/* ------------------------------------------------------------
   Mini-mapa de "Reportar nuevo fenómeno": clic para marcar el
   punto exacto del fenómeno y completar latitud/longitud.
   ------------------------------------------------------------ */
(function () {
    var contenedor = document.getElementById('mini-mapa-reporte');
    if (!contenedor || typeof L === 'undefined') return;

    var inputLat = document.getElementById('input-latitud');
    var inputLng = document.getElementById('input-longitud');

    var latInicial = parseFloat(contenedor.dataset.lat);
    var lngInicial = parseFloat(contenedor.dataset.lng);
    var hayUbicacionInicial = !isNaN(latInicial) && !isNaN(lngInicial);

    var centroInicial = hayUbicacionInicial ? [latInicial, lngInicial] : [-34.6037, -58.3816];
    var zoomInicial = hayUbicacionInicial ? 9 : 4;

    var mapa = L.map('mini-mapa-reporte').setView(centroInicial, zoomInicial);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 19,
    }).addTo(mapa);

    var marcador = hayUbicacionInicial ? L.marker(centroInicial).addTo(mapa) : null;

    mapa.on('click', function (e) {
        var lat = e.latlng.lat;
        var lng = e.latlng.lng;

        if (marcador) {
            marcador.setLatLng(e.latlng);
        } else {
            marcador = L.marker(e.latlng).addTo(mapa);
        }

        inputLat.value = lat.toFixed(6);
        inputLng.value = lng.toFixed(6);
    });
})();
