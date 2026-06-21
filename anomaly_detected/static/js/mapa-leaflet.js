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
       ------------------------------------------------------------ */
    var marcadores = {};

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
            var marker = L.marker([f.lat, f.lng], { icon: icono }).addTo(mapa);

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
        Object.keys(marcadores).forEach(function (id) {
            var marker = marcadores[id];
            var el = marker.getElement();
            if (el) el.style.display = activar ? 'none' : '';
        });
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
       FILTROS POR TIPO (OVNI / Embrujados) — muestran u ocultan
       los marcadores correspondientes.
       ------------------------------------------------------------ */
    document.querySelectorAll('.btn-filtro-cyber[data-filtro]').forEach(function (btn) {
        var filtro = btn.getAttribute('data-filtro');
        if (filtro !== 'ovni' && filtro !== 'embrujado') return; // "militar" no tiene datos de ejemplo todavía

        btn.addEventListener('click', function () {
            var activo = btn.classList.toggle('active');
            FENOMENOS.filter(function (f) { return f.tipo === filtro; }).forEach(function (f) {
                var marker = marcadores[f.id];
                if (!marker) return;
                if (activo) {
                    mapa.addLayer(marker);
                } else {
                    mapa.removeLayer(marker);
                }
            });
        });
    });

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
                return f.nombre.toLowerCase().indexOf(termino) !== -1;
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
    var RUTAS = {
        ovni: {
            color: '#adff2f',
            // Sigue el orden este→oeste para que la línea no quede
            // cruzada: Roswell (NM) → Phoenix (AZ) → Area 51 (NV).
            puntos: ['roswell', 'phoenix', 'area51'],
        },
        embrujado: {
            color: '#9d8df1',
            puntos: ['stanley', 'winchester'],
        },
        militar: {
            color: '#ea2b4b',
            // No hay pines de ejemplo de bases militares todavía, así
            // que esta ruta usa coordenadas propias (Area 51 y dos
            // bases reales conocidas de EE.UU.) solo para que la línea
            // tenga sentido visual hasta que haya datos reales.
            puntosCustom: [
                { nombre: 'Area 51, NV', lat: 37.2431, lng: -115.7930 },
                { nombre: 'Edwards AFB, CA', lat: 34.9054, lng: -117.8836 },
                { nombre: 'Nellis AFB, NV', lat: 36.2361, lng: -115.0342 },
            ],
        },
    };

    var lineaRutaActual = null;
    var tarjetaRutaActiva = null;

    function coordenadasDeRuta(claveRuta) {
        var ruta = RUTAS[claveRuta];
        if (!ruta) return [];

        if (ruta.puntosCustom) {
            return ruta.puntosCustom.map(function (p) { return [p.lat, p.lng]; });
        }

        return ruta.puntos
            .map(function (id) { return FENOMENOS.find(function (f) { return f.id === id; }); })
            .filter(Boolean)
            .map(function (f) { return [f.lat, f.lng]; });
    }

    function limpiarRutaDibujada() {
        if (lineaRutaActual) {
            mapa.removeLayer(lineaRutaActual);
            lineaRutaActual = null;
        }
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
            lineaRutaActual = L.polyline(coords, {
                color: ruta.color,
                weight: 3,
                opacity: 0.85,
                dashArray: '8 6',
                className: 'linea-recorrido-leaflet',
            }).addTo(mapa);

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
        setTimeout(abrirPrimerPopup, 600);
    });
})();