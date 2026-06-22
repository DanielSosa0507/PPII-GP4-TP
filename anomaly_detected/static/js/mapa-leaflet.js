/* ============================================================
   ANOMALY DETECTED — mapa-leaflet.js
   Inicializa el mapa mundial real con Leaflet + OpenStreetMap,
   reemplazando la simulación anterior basada en posiciones
   top/left en porcentaje.
   ============================================================ */

(function () {
    var mapaEl = document.getElementById('map-leaflet');
    if (!mapaEl || typeof L === 'undefined') return; // Leaflet no cargó o no es la página del mapa

    /* ------------------------------------------------------------
       DATOS REALES — se cargan desde la API. FENOMENOS y FAVORITOS
       arrancan vacíos y se llenan cuando responde el fetch (más abajo).
       ------------------------------------------------------------ */
    var FENOMENOS = [];
    var FAVORITOS = {}; // id de fenómeno -> id del registro Favorito
    var VISITAS = {}; // id de fenómeno -> id del registro Visita

    function getCookie(name) {
        var match = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
        return match ? match.pop() : '';
    }

    /* ------------------------------------------------------------
       INICIALIZACIÓN DEL MAPA
       Vista mundial (zoom bajo) centrada levemente sobre América,
       ya que ahí está la mayoría de los datos de ejemplo, pero
       mostrando el mapa mundi completo como pediste.
       ------------------------------------------------------------ */
    var mapa = L.map('map-leaflet', {
        zoomControl: false, // usamos los botones propios del diseño (+/−/🎯)
        worldCopyJump: true,
    }).setView([20, -30], 2);

    // Tile layer oscuro (Carto Dark Matter), gratuito y sin API key,
    // combina con la paleta cyberpunk del resto del sitio.
    var capaOscura = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
    });

    var capaClara = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
    });

    // Elige la capa según el tema actual (día/noche), y la actualiza
    // si el tema cambia mientras la persona tiene la pestaña abierta.
    function aplicarCapaSegunTema() {
        var esClaro = document.documentElement.classList.contains('light-theme');
        if (esClaro) {
            mapa.removeLayer(capaOscura);
            capaClara.addTo(mapa);
        } else {
            mapa.removeLayer(capaClara);
            capaOscura.addTo(mapa);
        }
    }
    aplicarCapaSegunTema();
    setInterval(aplicarCapaSegunTema, 60 * 1000);

    /* ------------------------------------------------------------
       ÍCONOS PERSONALIZADOS (mismos colores que el diseño original)
       ------------------------------------------------------------ */
    function crearIcono(claseColor) {
        return L.divIcon({
            className: 'pin-leaflet-wrapper',
            html: '<span class="pin-mapa ' + claseColor + '"></span>',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
        });
    }
    var iconoVerde = crearIcono('pin-verde');
    var iconoMorado = crearIcono('pin-morado');

    /* ------------------------------------------------------------
       MARCADORES + POPUPS
       Se agrupan con Leaflet.markercluster: con miles de fenómenos
       cargados, dibujar cada uno suelto en el mapa lo deja lento y
       saturado de puntos superpuestos. Agrupados, se ven números
       cuando hay varios cerca y solo se abren al hacer zoom.
       ------------------------------------------------------------ */
    var marcadores = {};
    var grupoMarcadores = (typeof L.markerClusterGroup === 'function')
        ? L.markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 60 })
        : L.layerGroup(); // si el plugin no cargó, al menos no rompe el resto del mapa
    grupoMarcadores.addTo(mapa);

    function popupFavoritoHtml(f) {
        var esFavorito = !!FAVORITOS[f.id];
        return '<button type="button" class="btn-favorito-popup' + (esFavorito ? ' es-favorito' : '') +
            '" data-fenomeno="' + f.id + '">' +
            (esFavorito ? '♥ Quitar de favoritos' : '♡ Agregar a favoritos') + '</button>';
    }

    function estrellasHtml(valorActual) {
        var html = '';
        for (var i = 1; i <= 5; i++) {
            html += '<button type="button" class="ficha-estrella' + (i <= valorActual ? ' activa' : '') +
                '" data-valor="' + i + '">★</button>';
        }
        return html;
    }

    function construirMarcadores() {
        FENOMENOS.forEach(function (f) {
            var icono = f.tipo === 'embrujado' ? iconoMorado : iconoVerde;
            var marker = L.marker([f.lat, f.lng], { icon: icono });

            var tipoLabel = f.tipo === 'embrujado' ? 'Lugar embrujado' : 'Avistamiento OVNI';
            var anio = f.fecha_ocurrencia ? f.fecha_ocurrencia.slice(0, 4) : 's/f';

            var contenidoPopup =
                '<div class="popup-mapa-cyber popup-leaflet">' +
                '<h4>' + f.titulo + '</h4>' +
                '<p class="sub">' + tipoLabel + ' — ' + anio + '</p>' +
                popupFavoritoHtml(f) +
                '<button type="button" class="btn-ver-detalles" data-fenomeno="' + f.id + '">Ver detalles →</button>' +
                '</div>';

            marker.bindPopup(contenidoPopup, { closeButton: false, className: 'popup-leaflet-wrapper' });
            marcadores[f.id] = marker;
        });

        agregarMarcadoresAlGrupo(Object.values(marcadores));
    }

    // addLayers (en plural) es del plugin de clustering, para agregar
    // muchos de una sola vez sin recalcular los clusters en cada uno.
    // Si el plugin no cargó, el L.layerGroup() de respaldo no tiene ese
    // método, así que en ese caso se agregan de a uno.
    function agregarMarcadoresAlGrupo(lista) {
        if (typeof grupoMarcadores.addLayers === 'function') {
            grupoMarcadores.addLayers(lista);
        } else {
            lista.forEach(function (m) { grupoMarcadores.addLayer(m); });
        }
    }

    // Delegación de eventos: como los popups y el modal de ficha se
    // insertan/actualizan dinámicamente, escuchamos el click en el documento.
    document.addEventListener('click', function (e) {
        var btnDetalle = e.target.closest('.btn-ver-detalles[data-fenomeno]');
        if (btnDetalle) { abrirFichaModal(btnDetalle.getAttribute('data-fenomeno')); return; }

        var btnFav = e.target.closest('.btn-favorito-popup[data-fenomeno]');
        if (btnFav) { toggleFavorito(btnFav); return; }

        var btnVis = e.target.closest('.btn-visitado-popup[data-fenomeno]');
        if (btnVis) { toggleVisitado(btnVis); return; }

        var btnEstrella = e.target.closest('.ficha-estrella[data-valor]');
        if (btnEstrella) { puntuarFicha(btnEstrella); }
    });

    // Crea una función de toggle (agregar/quitar) genérica para los
    // endpoints con la forma favoritos/visitas: POST para agregar,
    // DELETE /<id>/ para quitar.
    function crearToggle(mapaEstado, urlBase, etiquetaOn, etiquetaOff) {
        return function (btn) {
            var fenomenoId = btn.getAttribute('data-fenomeno');
            var registroId = mapaEstado[fenomenoId];

            var peticion = registroId
                ? fetch(urlBase + registroId + '/', {
                      method: 'DELETE',
                      credentials: 'same-origin',
                      headers: { 'X-CSRFToken': getCookie('csrftoken') },
                  }).then(function () { delete mapaEstado[fenomenoId]; })
                : fetch(urlBase, {
                      method: 'POST',
                      credentials: 'same-origin',
                      headers: {
                          'Content-Type': 'application/json',
                          'X-CSRFToken': getCookie('csrftoken'),
                      },
                      body: JSON.stringify({ fenomeno: fenomenoId }),
                  }).then(function (res) {
                      if (res.status === 401 || res.status === 403) {
                          window.location.href = '/login/';
                          return Promise.reject();
                      }
                      return res.json();
                  }).then(function (data) { mapaEstado[fenomenoId] = data.id; });

            return peticion.then(function () {
                var activo = !!mapaEstado[fenomenoId];
                btn.classList.toggle('es-favorito', activo);
                btn.textContent = activo ? etiquetaOn : etiquetaOff;
            }).catch(function () {});
        };
    }

    var toggleFavorito = crearToggle(FAVORITOS, '/api/fenomenos/favoritos/', '♥ Quitar de favoritos', '♡ Agregar a favoritos');
    var toggleVisitado = crearToggle(VISITAS, '/api/fenomenos/visitas/', '✓ Visitado (quitar)', 'Marcar como visitado');

    function abrirFichaModal(fenomenoId) {
        var f = FENOMENOS.find(function (x) { return String(x.id) === String(fenomenoId); });
        if (!f) return;

        var tipoLabel = { ovni: 'OVNI', embrujado: 'Lugar embrujado', otro: 'Otro' }[f.tipo] || f.tipo;
        var anio = f.fecha_ocurrencia ? f.fecha_ocurrencia.slice(0, 4) : 's/f';

        var badge = document.getElementById('fichaBadge');
        badge.textContent = tipoLabel;
        badge.className = 'badge badge-' + f.tipo;
        document.getElementById('fichaTitulo').textContent = f.titulo;
        document.getElementById('fichaUbicacion').textContent = (f.estado ? f.estado + ', ' : '') + 'EE.UU. · ' + anio;
        document.getElementById('fichaPuntuacion').textContent = f.puntuacion_promedio
            ? '★ ' + f.puntuacion_promedio + ' (' + f.puntuacion_total + ')'
            : 'Sin puntuar todavía';
        document.getElementById('fichaDescripcion').textContent = f.descripcion;

        var btnFav = document.getElementById('fichaBtnFavorito');
        var esFavorito = !!FAVORITOS[f.id];
        btnFav.setAttribute('data-fenomeno', f.id);
        btnFav.className = 'btn-favorito-popup' + (esFavorito ? ' es-favorito' : '');
        btnFav.textContent = esFavorito ? '♥ Quitar de favoritos' : '♡ Agregar a favoritos';

        var btnVis = document.getElementById('fichaBtnVisitado');
        var esVisitado = !!VISITAS[f.id];
        btnVis.setAttribute('data-fenomeno', f.id);
        btnVis.className = 'btn-visitado-popup' + (esVisitado ? ' es-favorito' : '');
        btnVis.textContent = esVisitado ? '✓ Visitado (quitar)' : 'Marcar como visitado';

        document.getElementById('fichaMiPuntuacion').innerHTML =
            '<span class="ficha-mi-puntuacion-label">Tu puntuación:</span> ' +
            '<span class="ficha-estrellas" data-fenomeno="' + f.id + '">' + estrellasHtml(0) + '</span>';

        var comentariosEl = document.getElementById('fichaComentarios');
        comentariosEl.innerHTML = '<p class="ficha-vacio">Cargando…</p>';
        fetch('/api/comentarios/?fenomeno=' + f.id, { credentials: 'same-origin' })
            .then(function (res) { return res.json(); })
            .then(function (comentarios) {
                comentariosEl.innerHTML = comentarios.length
                    ? comentarios.map(function (c) {
                        return '<div class="modal-ficha-comentario">' +
                            '<div class="modal-ficha-comentario-header"><strong>' + c.usuario_nombre + '</strong></div>' +
                            '<p>' + c.texto + '</p></div>';
                    }).join('')
                    : '<p class="ficha-vacio">Todavía no hay comentarios.</p>';
            });

        var enlacesEl = document.getElementById('fichaEnlaces');
        enlacesEl.innerHTML = '<p class="ficha-vacio">Cargando…</p>';
        fetch('/api/fenomenos/' + f.id + '/enlaces/', { credentials: 'same-origin' })
            .then(function (res) { return res.json(); })
            .then(function (enlaces) {
                enlacesEl.innerHTML = enlaces.length
                    ? enlaces.map(function (en) {
                        return '<a class="ficha-enlace" href="' + en.url + '" target="_blank" rel="noopener">' + en.titulo + '</a>';
                    }).join('')
                    : '<p class="ficha-vacio">No hay enlaces todavía.</p>';
            });

        var modal = document.getElementById('modalFichaFenomeno');
        if (modal) modal.showModal();
    }

    function puntuarFicha(btn) {
        var contenedor = btn.closest('.ficha-estrellas');
        var fenomenoId = contenedor.getAttribute('data-fenomeno');
        var valor = Number(btn.getAttribute('data-valor'));

        fetch('/api/fenomenos/' + fenomenoId + '/puntuar/', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
            body: JSON.stringify({ valor: valor }),
        }).then(function (res) {
            if (res.status === 401 || res.status === 403) {
                window.location.href = '/login/';
                return Promise.reject();
            }
            contenedor.innerHTML = estrellasHtml(valor);
            return fetch('/api/fenomenos/' + fenomenoId + '/', { credentials: 'same-origin' });
        }).then(function (res) { return res.json(); })
          .then(function (data) {
              var f = FENOMENOS.find(function (x) { return String(x.id) === String(fenomenoId); });
              if (f) {
                  f.puntuacion_promedio = data.puntuacion_promedio;
                  f.puntuacion_total = data.puntuacion_total;
              }
              document.getElementById('fichaPuntuacion').textContent = data.puntuacion_promedio
                  ? '★ ' + data.puntuacion_promedio + ' (' + data.puntuacion_total + ')'
                  : 'Sin puntuar todavía';
          }).catch(function () {});
    }

    /* ------------------------------------------------------------
       CAPA DE MAPA DE CALOR (manchas radiales sobre coordenadas reales)
       ------------------------------------------------------------ */
    var circulosCalor = [];
    var INTENSIDAD_COLOR = {
        extrema: '#ea2b4b',
        alta: '#f7a01b',
        moderada: '#f7a01b',
        baja: '#2196f3',
    };
    var INTENSIDAD_RADIO = {
        extrema: 280000,
        alta: 200000,
        moderada: 160000,
        baja: 120000,
    };

    function construirCapaCalor() {
        FENOMENOS.forEach(function (f) {
            var circulo = L.circle([f.lat, f.lng], {
                radius: INTENSIDAD_RADIO[f.actividad] || 150000,
                color: 'transparent',
                fillColor: INTENSIDAD_COLOR[f.actividad] || '#f7a01b',
                fillOpacity: 0.35,
                className: 'mancha-calor-leaflet',
            });
            circulosCalor.push(circulo);
        });
    }

    function toggleCapaCalor(activar) {
        circulosCalor.forEach(function (c) {
            if (activar) {
                c.addTo(mapa);
            } else {
                mapa.removeLayer(c);
            }
        });
        if (activar) {
            mapa.removeLayer(grupoMarcadores);
        } else {
            grupoMarcadores.addTo(mapa);
        }
    }

    var botonCalor = document.getElementById('toggleMapaCalor');
    var refCalor = document.querySelector('.ref-item-calor');
    if (botonCalor) {
        botonCalor.addEventListener('click', function () {
            var activo = botonCalor.classList.toggle('active');
            toggleCapaCalor(activo);
            if (refCalor) refCalor.classList.toggle('hidden', !activo);
        });
    }

    /* ------------------------------------------------------------
       BASES MILITARES POR ESTADO — el dataset de bases no trae
       latitud/longitud por base individual, así que en vez de pines
       sueltos se dibuja una burbuja en el centroide de cada estado
       con la cantidad de bases ahí. Las coordenadas de los centroides
       son fijas (geografía conocida), no vienen de la base de datos.
       ------------------------------------------------------------ */
    var CENTROIDES_ESTADOS = {
        'Alabama': [32.8067, -86.7911], 'Alaska': [61.3707, -152.4044],
        'Arizona': [33.7298, -111.4312], 'Arkansas': [34.9697, -92.3731],
        'California': [36.1162, -119.6816], 'Colorado': [39.0598, -105.3111],
        'Connecticut': [41.5978, -72.7554], 'Delaware': [39.3185, -75.5071],
        'District of Columbia': [38.8974, -77.0268], 'Florida': [27.7663, -81.6868],
        'Georgia': [33.0406, -83.6431], 'Hawaii': [21.0943, -157.4983],
        'Idaho': [44.2405, -114.4788], 'Illinois': [40.3495, -88.9861],
        'Indiana': [39.8494, -86.2583], 'Iowa': [42.0115, -93.2105],
        'Kansas': [38.5266, -96.7265], 'Kentucky': [37.6681, -84.6701],
        'Louisiana': [31.1695, -91.8678], 'Maine': [44.6939, -69.3819],
        'Maryland': [39.0639, -76.8021], 'Massachusetts': [42.2302, -71.5301],
        'Michigan': [43.3266, -84.5361], 'Minnesota': [45.6945, -93.9002],
        'Mississippi': [32.7416, -89.6787], 'Missouri': [38.4561, -92.2884],
        'Montana': [46.9219, -110.4544], 'Nebraska': [41.1254, -98.2681],
        'Nevada': [38.3135, -117.0554], 'New Hampshire': [43.4525, -71.5639],
        'New Jersey': [40.2989, -74.5210], 'New Mexico': [34.8405, -106.2485],
        'New York': [42.1657, -74.9481], 'North Carolina': [35.6301, -79.8064],
        'North Dakota': [47.5289, -99.7840], 'Ohio': [40.3888, -82.7649],
        'Oklahoma': [35.5653, -96.9289], 'Oregon': [44.5720, -122.0709],
        'Pennsylvania': [40.5908, -77.2098], 'Rhode Island': [41.6809, -71.5118],
        'South Carolina': [33.8569, -80.9450], 'South Dakota': [44.2998, -99.4388],
        'Tennessee': [35.7478, -86.6923], 'Texas': [31.0545, -97.5635],
        'Utah': [40.1500, -111.8624], 'Vermont': [44.0459, -72.7107],
        'Virginia': [37.7693, -78.1700], 'Washington': [47.4009, -121.4905],
        'West Virginia': [38.4912, -80.9546], 'Wisconsin': [44.2685, -89.6165],
        'Wyoming': [42.7560, -107.3025], 'Guam': [13.4443, 144.7937],
        'Puerto Rico': [18.2208, -66.5901],
    };

    var grupoBasesMilitares = L.layerGroup();
    var basesCargadas = false;

    // Mismos 3 colores que ya usa el mapa de calor (INTENSIDAD_COLOR), para
    // que "rojo" signifique lo mismo en todo el mapa: alta concentración.
    function colorPorConcentracion(cantidad) {
        if (cantidad >= 30) return '#ea2b4b'; // alta
        if (cantidad >= 10) return '#f7a01b'; // moderada
        return '#2196f3'; // baja
    }

    function cargarBasesMilitares() {
        if (basesCargadas) return Promise.resolve();
        return fetchPropio('/api/fenomenos/bases-por-estado/').then(function (datos) {
            datos.forEach(function (fila) {
                var centro = CENTROIDES_ESTADOS[fila.estado];
                if (!centro) return; // estado sin centroide conocido (datos sucios, ej. "Naval Magazine")

                var radio = 14 + Math.sqrt(fila.cantidad) * 4;
                var color = colorPorConcentracion(fila.cantidad);
                var icono = L.divIcon({
                    className: 'burbuja-base-militar-wrapper',
                    html: '<span class="burbuja-base-militar" style="width:' + radio + 'px;height:' + radio + 'px;background-color:' + color + 'cc;border-color:' + color + ';">' + fila.cantidad + '</span>',
                    iconSize: [radio, radio],
                    iconAnchor: [radio / 2, radio / 2],
                });
                L.marker(centro, { icon: icono })
                    .bindTooltip(fila.estado + ': ' + fila.cantidad + ' bases militares')
                    .addTo(grupoBasesMilitares);
            });
            basesCargadas = true;
        });
    }

    var botonBasesMilitares = document.getElementById('toggleBasesMilitares');
    if (botonBasesMilitares) {
        botonBasesMilitares.addEventListener('click', function () {
            var activo = botonBasesMilitares.classList.toggle('active');
            if (activo) {
                cargarBasesMilitares().then(function () { grupoBasesMilitares.addTo(mapa); });
            } else {
                mapa.removeLayer(grupoBasesMilitares);
            }
        });
    }

    /* ------------------------------------------------------------
       FILTROS COMBINADOS (tipo OVNI/Embrujados + estado) — se
       aplican juntos: un fenómeno se muestra solo si su tipo está
       activo Y (no hay estado elegido O coincide con el elegido).
       ------------------------------------------------------------ */
    var botonesTipo = document.querySelectorAll('.btn-filtro-cyber[data-filtro]');
    var selectEstado = document.getElementById('selectEstado');

    function tiposActivos() {
        var activos = [];
        botonesTipo.forEach(function (btn) {
            var filtro = btn.getAttribute('data-filtro');
            if ((filtro === 'ovni' || filtro === 'embrujado') && btn.classList.contains('active')) {
                activos.push(filtro);
            }
        });
        return activos;
    }

    function aplicarFiltros() {
        var tipos = tiposActivos();
        var estado = selectEstado ? selectEstado.value : '';

        var visibles = FENOMENOS.filter(function (f) {
            var pasaTipo = tipos.indexOf(f.tipo) !== -1;
            var pasaEstado = !estado || f.estado === estado;
            return pasaTipo && pasaEstado;
        }).map(function (f) { return marcadores[f.id]; }).filter(Boolean);

        if (typeof grupoMarcadores.clearLayers === 'function') {
            grupoMarcadores.clearLayers();
        }
        agregarMarcadoresAlGrupo(visibles);
    }

    botonesTipo.forEach(function (btn) {
        var filtro = btn.getAttribute('data-filtro');
        if (filtro !== 'ovni' && filtro !== 'embrujado') return; // "militar" no tiene pines (sin coordenadas en el dataset)

        btn.addEventListener('click', function () {
            btn.classList.toggle('active');
            aplicarFiltros();
        });
    });

    if (selectEstado) {
        selectEstado.addEventListener('change', aplicarFiltros);
    }

    // Llena el <select> de estados con los valores reales que hay en los
    // datos (antes tenía nombres de estado hardcodeados que ni siquiera
    // coincidían con el formato que se guarda, ej. "New Mexico" vs "NM").
    function poblarSelectEstado() {
        if (!selectEstado) return;
        var estados = Array.from(new Set(
            FENOMENOS.map(function (f) { return f.estado; }).filter(Boolean)
        )).sort();
        estados.forEach(function (estado) {
            var opcion = document.createElement('option');
            opcion.value = estado;
            opcion.textContent = estado;
            selectEstado.appendChild(opcion);
        });
    }

    /* ------------------------------------------------------------
       CONTROLES DE ZOOM PROPIOS (+ / − / 🎯 recentrar)
       ------------------------------------------------------------ */
    var zoomIn = document.getElementById('zoomIn');
    var zoomOut = document.getElementById('zoomOut');
    var zoomReset = document.getElementById('zoomReset');
    if (zoomIn) zoomIn.addEventListener('click', function () { mapa.zoomIn(); });
    if (zoomOut) zoomOut.addEventListener('click', function () { mapa.zoomOut(); });
    if (zoomReset) zoomReset.addEventListener('click', function () { mapa.setView([20, -30], 2); });

    /* ------------------------------------------------------------
       BUSCADOR SIMPLE (busca por nombre entre los datos cargados
       y centra el mapa en el resultado más cercano)
       ------------------------------------------------------------ */
    var buscador = document.getElementById('buscadorMapa');
    if (buscador) {
        buscador.addEventListener('keydown', function (e) {
            if (e.key !== 'Enter') return;
            var termino = buscador.value.trim().toLowerCase();
            if (!termino) return;
            var encontrado = FENOMENOS.find(function (f) {
                return (f.titulo + ' ' + (f.estado || '')).toLowerCase().indexOf(termino) !== -1;
            });
            if (encontrado) {
                mapa.setView([encontrado.lat, encontrado.lng], 7);
                marcadores[encontrado.id].openPopup();
            }
        });
    }

    // Abre el popup del primer fenómeno al cargar, para que se vea
    // contenido apenas entra a la página.
    function abrirPrimerPopup() {
        var primero = FENOMENOS[0];
        if (primero) marcadores[primero.id].openPopup();
    }

    /* ------------------------------------------------------------
       RECORRIDOS TEMÁTICOS — al clickear una tarjeta, dibuja una
       línea (polyline) conectando los puntos de esa ruta en orden,
       y centra el mapa para que se vea completa.
       ------------------------------------------------------------ */
    // Las 3 rutas usan coordenadas propias (puntosCustom) de lugares
    // reales conocidos, en vez de buscar por id dentro de FENOMENOS:
    // antes "ovni"/"embrujado" buscaban f.id === 'roswell' (texto), pero
    // los fenómenos que vienen de la API tienen id numérico — esa
    // búsqueda nunca encontraba nada. Con datos reales importados podría
    // buscarse por ciudad/nombre, pero coordenadas fijas son más
    // confiables (no dependen de qué haya o no en la base en cada momento).
    var RUTAS = {
        ovni: {
            titulo: 'Ruta OVNI',
            descripcion: 'Un recorrido por 3 sitios clásicos de avistamientos OVNI.',
            color: '#adff2f',
            // Este→oeste para que la línea no quede cruzada.
            puntosCustom: [
                { nombre: 'Roswell, NM', lat: 33.3943, lng: -104.5230 },
                { nombre: 'Phoenix, AZ', lat: 33.4484, lng: -112.0740 },
                { nombre: 'Area 51, NV', lat: 37.2431, lng: -115.7930 },
            ],
        },
        embrujado: {
            titulo: 'Ruta Embrujados',
            descripcion: 'Dos de los lugares embrujados más conocidos de EE.UU.',
            color: '#9d8df1',
            puntosCustom: [
                { nombre: 'Stanley Hotel, CO', lat: 40.4019, lng: -105.5217 },
                { nombre: 'Winchester Mystery House, CA', lat: 37.3184, lng: -121.9511 },
            ],
        },
        militar: {
            titulo: 'Ruta Militar',
            descripcion: 'Bases militares asociadas a teorías sobre actividad OVNI.',
            color: '#ea2b4b',
            puntosCustom: [
                { nombre: 'Area 51, NV', lat: 37.2431, lng: -115.7930 },
                { nombre: 'Edwards AFB, CA', lat: 34.9054, lng: -117.8836 },
                { nombre: 'Nellis AFB, NV', lat: 36.2361, lng: -115.0342 },
            ],
        },
    };

    var lineaRutaActual = null;
    var tarjetaRutaActiva = null;
    var marcadoresRutaActual = [];

    function coordenadasDeRuta(claveRuta) {
        var ruta = RUTAS[claveRuta];
        if (!ruta) return [];
        return ruta.puntosCustom.map(function (p) { return [p.lat, p.lng]; });
    }

    // Marcador numerado (1, 2, 3...) con el nombre del lugar siempre visible
    // (tooltip permanente), para que se entienda "desde dónde hasta dónde"
    // va la ruta sin tener que adivinar mirando solo la línea.
    function crearMarcadorParada(punto, numero, color) {
        var icono = L.divIcon({
            className: 'parada-ruta-wrapper',
            html: '<span class="parada-ruta-numero" style="background:' + color + '">' + numero + '</span>',
            iconSize: [22, 22],
            iconAnchor: [11, 11],
        });
        return L.marker([punto.lat, punto.lng], { icon: icono })
            .bindTooltip(punto.nombre, { permanent: true, direction: 'top', className: 'tooltip-parada-ruta' });
    }

    function limpiarRutaDibujada() {
        if (lineaRutaActual) {
            mapa.removeLayer(lineaRutaActual);
            lineaRutaActual = null;
        }
        marcadoresRutaActual.forEach(function (m) { mapa.removeLayer(m); });
        marcadoresRutaActual = [];
        if (tarjetaRutaActiva) {
            tarjetaRutaActiva.classList.remove('recorrido-activo');
            tarjetaRutaActiva = null;
        }
    }

    document.querySelectorAll('.recorrido-card[data-recorrido]').forEach(function (tarjeta) {
        tarjeta.addEventListener('click', function () {
            var clave = tarjeta.getAttribute('data-recorrido');
            var yaEstabaActiva = tarjeta === tarjetaRutaActiva;

            limpiarRutaDibujada();

            // Si clickeás la misma tarjeta que ya estaba activa, el
            // efecto es "apagar" la ruta (toggle), no volver a dibujarla.
            if (yaEstabaActiva) return;

            var coords = coordenadasDeRuta(clave);
            if (coords.length < 2) return;

            var ruta = RUTAS[clave];
            var listaParadas = ruta.puntosCustom.map(function (p) {
                return '<li>' + p.nombre + '</li>';
            }).join('');

            lineaRutaActual = L.polyline(coords, {
                color: ruta.color,
                weight: 3,
                opacity: 0.85,
                dashArray: '8 6',
                className: 'linea-recorrido-leaflet',
            }).addTo(mapa);

            lineaRutaActual.bindPopup(
                '<div class="popup-recorrido-cyber">' +
                '<h4>' + ruta.titulo + '</h4>' +
                '<p>' + ruta.descripcion + '</p>' +
                '<ol class="popup-recorrido-paradas">' + listaParadas + '</ol>' +
                '</div>',
                { className: 'popup-leaflet-wrapper' }
            ).openPopup();

            marcadoresRutaActual = ruta.puntosCustom.map(function (punto, i) {
                return crearMarcadorParada(punto, i + 1, ruta.color).addTo(mapa);
            });

            tarjeta.classList.add('recorrido-activo');
            tarjetaRutaActiva = tarjeta;

            mapa.fitBounds(lineaRutaActual.getBounds(), { padding: [60, 60] });
        });
    });

    /* ------------------------------------------------------------
       CARGA DE DATOS REALES — fenómenos desde la API, y los
       favoritos del usuario actual si está logueado (si no, la
       API devuelve 401 y seguimos sin favoritos marcados).
       ------------------------------------------------------------ */
    function fetchPropio(url) {
        return fetch(url, { credentials: 'same-origin' })
            .then(function (res) { return res.ok ? res.json() : []; })
            .catch(function () { return []; });
    }

    Promise.all([
        fetchPropio('/api/fenomenos/'),
        fetchPropio('/api/fenomenos/favoritos/'),
        fetchPropio('/api/fenomenos/visitas/'),
    ]).then(function (resultados) {
        // La API usa latitud/longitud; Leaflet espera lat/lng.
        FENOMENOS = resultados[0].map(function (f) {
            f.lat = f.latitud;
            f.lng = f.longitud;
            return f;
        });
        resultados[1].forEach(function (fav) { FAVORITOS[fav.fenomeno] = fav.id; });
        resultados[2].forEach(function (vis) { VISITAS[vis.fenomeno] = vis.id; });

        construirMarcadores();
        construirCapaCalor();
        poblarSelectEstado();
        setTimeout(abrirPrimerPopup, 600);
    });
})();