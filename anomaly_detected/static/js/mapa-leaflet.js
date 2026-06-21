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
       DATOS DE EJEMPLO (coordenadas geográficas reales).
       Cuando se conecte la API real, este array se reemplaza por
       el resultado de fetch('/api/fenomenos/').
       ------------------------------------------------------------ */
    var FENOMENOS = [
        {
            id: 'roswell',
            nombre: 'Roswell, New Mexico',
            tipo: 'ovni',
            lat: 33.3943,
            lng: -104.5230,
            anio: 1947,
            actividad: 'extrema',
            esAltaConcentracion: true,
        },
        {
            id: 'area51',
            nombre: 'Area 51, Nevada',
            tipo: 'ovni',
            lat: 37.2431,
            lng: -115.7930,
            anio: 2026,
            actividad: 'extrema',
        },
        {
            id: 'phoenix',
            nombre: 'Phoenix Lights, AZ',
            tipo: 'ovni',
            lat: 33.4484,
            lng: -112.0740,
            anio: 1997,
            actividad: 'moderada',
        },
        {
            id: 'winchester',
            nombre: 'Winchester House, CA',
            tipo: 'embrujado',
            lat: 37.3184,
            lng: -121.9510,
            anio: 1926,
            actividad: 'alta',
        },
        {
            id: 'stanley',
            nombre: 'Stanley Hotel, CO',
            tipo: 'embrujado',
            lat: 40.4072,
            lng: -105.5220,
            anio: 1909,
            actividad: 'alta',
        },
    ];

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

    FENOMENOS.forEach(function (f) {
        var icono = f.tipo === 'embrujado' ? iconoMorado : iconoVerde;
        var marker = L.marker([f.lat, f.lng], { icon: icono }).addTo(mapa);

        var tipoLabel = f.tipo === 'embrujado' ? 'Lugar embrujado' : 'Avistamiento OVNI';
        var actividadLabel = {
            baja: 'Actividad baja',
            moderada: 'Actividad moderada',
            alta: 'Actividad alta',
            extrema: 'Actividad extrema',
        }[f.actividad] || '';

        var contenidoPopup =
            '<div class="popup-mapa-cyber popup-leaflet">' +
            '<h4>' + f.nombre + '</h4>' +
            '<p class="sub">' + tipoLabel + ' — ' + f.anio + '</p>' +
            '<span class="tag-alerta-extrema">' + actividadLabel + '</span>' +
            '<button type="button" class="btn-ver-detalles" data-fenomeno="' + f.id + '">Ver detalles →</button>' +
            '</div>';

        marker.bindPopup(contenidoPopup, { closeButton: false, className: 'popup-leaflet-wrapper' });
        marcadores[f.id] = marker;
    });

    // Delegación de eventos: como los popups de Leaflet se insertan
    // dinámicamente, escuchamos el click en el documento.
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('.btn-ver-detalles[data-fenomeno]');
        if (!btn) return;
        var modal = document.getElementById('modalFichaFenomeno');
        if (modal) modal.showModal();
    });

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
    construirCapaCalor();

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

    // Abre el popup de Roswell al cargar, para que se vea contenido
    // de ejemplo apenas entra a la página (igual que el diseño original).
    setTimeout(function () {
        if (marcadores.roswell) marcadores.roswell.openPopup();
    }, 600);

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
})();