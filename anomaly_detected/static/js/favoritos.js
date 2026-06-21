/* ============================================================
   ANOMALY DETECTED — favoritos.js
   Carga los favoritos reales del usuario desde la API
   (/api/fenomenos/favoritos/) y permite quitarlos.
   ============================================================ */

(function () {
    var grid = document.getElementById('favoritosGrid');
    if (!grid) return;

    var TIPO_LABELS = { ovni: 'OVNI', embrujado: 'Embrujado', otro: 'Otro' };

    function getCookie(name) {
        var match = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
        return match ? match.pop() : '';
    }

    function renderFavoritos(favoritos) {
        if (!favoritos.length) {
            grid.innerHTML = '<div class="card card-add-more">' +
                '<span class="empty-heart">♡</span>' +
                '<p>Guardá más lugares desde el mapa</p></div>';
            return;
        }

        grid.innerHTML = favoritos.map(function (fav) {
            var f = fav.fenomeno_detalle;
            var tipoLabel = TIPO_LABELS[f.tipo] || f.tipo;
            return (
                '<div class="card card-' + f.tipo + '" data-tipo="' + f.tipo + '">' +
                    '<span class="badge badge-' + f.tipo + '">' + tipoLabel + '</span>' +
                    '<div class="card-image-placeholder"><span class="card-corner-dot"></span></div>' +
                    '<div class="card-content">' +
                        '<h2 class="card-title">' + f.titulo + '</h2>' +
                        '<p class="card-location">' + f.latitud + ', ' + f.longitud + '</p>' +
                        '<div class="card-footer">' +
                            '<span class="status">' + (f.validado ? 'Validado' : 'Sin validar') + '</span>' +
                            '<button type="button" class="btn-quitar-favorito" data-id="' + fav.id + '">Quitar</button>' +
                        '</div>' +
                    '</div>' +
                '</div>'
            );
        }).join('');

        if (typeof initFavoritosFiltros === 'function') initFavoritosFiltros();

        grid.querySelectorAll('.btn-quitar-favorito').forEach(function (btn) {
            btn.addEventListener('click', function () {
                quitarFavorito(btn.getAttribute('data-id'));
            });
        });
    }

    function quitarFavorito(id) {
        fetch('/api/fenomenos/favoritos/' + id + '/', {
            method: 'DELETE',
            credentials: 'same-origin',
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
        }).then(cargarFavoritos);
    }

    function cargarFavoritos() {
        fetch('/api/fenomenos/favoritos/', { credentials: 'same-origin' })
            .then(function (res) { return res.ok ? res.json() : []; })
            .then(renderFavoritos)
            .catch(function () {
                grid.innerHTML = '<p class="favoritos-error">No se pudieron cargar los favoritos.</p>';
            });
    }

    cargarFavoritos();
})();
