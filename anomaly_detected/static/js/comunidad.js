/* ============================================================
   ANOMALY DETECTED — comunidad.js
   Carga las teorías reales desde /api/comunidad/, permite
   publicar nuevas y votar (a favor / en contra).
   ============================================================ */

(function () {
    var feed = document.getElementById('teoriasFeed');
    if (!feed) return;

    function getCookie(name) {
        var match = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
        return match ? match.pop() : '';
    }

    function renderTeorias(teorias) {
        if (!teorias.length) {
            feed.innerHTML = '<p class="ficha-vacio">Todavía no hay teorías publicadas. ¡Sé el primero!</p>';
            return;
        }

        feed.innerHTML = teorias.map(function (t) {
            return (
                '<article class="post-card" data-id="' + t.id + '">' +
                    '<div class="user-info">' +
                        '<div class="avatar">👤</div>' +
                        '<div class="meta"><strong>' + t.usuario_nombre + '</strong></div>' +
                    '</div>' +
                    '<h3 class="teoria-titulo">' + t.titulo + '</h3>' +
                    '<p>' + t.contenido + '</p>' +
                    '<div class="actions">' +
                        '<button type="button" class="btn-vote btn-votar-teoria" data-id="' + t.id + '" data-valor="1">A favor</button>' +
                        '<button type="button" class="btn-vote btn-votar-teoria" data-id="' + t.id + '" data-valor="-1">En contra</button>' +
                        '<span class="teoria-votos">' + t.votos_total + ' pts</span>' +
                    '</div>' +
                '</article>'
            );
        }).join('');
    }

    function cargarTeorias() {
        fetch('/api/comunidad/', { credentials: 'same-origin' })
            .then(function (res) { return res.json(); })
            .then(renderTeorias)
            .catch(function () {
                feed.innerHTML = '<p class="ficha-vacio">No se pudieron cargar las teorías.</p>';
            });
    }

    feed.addEventListener('click', function (e) {
        var btn = e.target.closest('.btn-votar-teoria');
        if (!btn) return;

        fetch('/api/comunidad/' + btn.getAttribute('data-id') + '/votar/', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
            body: JSON.stringify({ valor: Number(btn.getAttribute('data-valor')) }),
        }).then(function (res) {
            if (res.status === 401 || res.status === 403) {
                window.location.href = '/login/';
                return Promise.reject();
            }
            cargarTeorias();
        }).catch(function () {});
    });

    var btnPublicar = document.getElementById('btnPublicarTeoria');
    if (btnPublicar) {
        btnPublicar.addEventListener('click', function () {
            var titulo = document.getElementById('teoriaTitulo').value.trim();
            var contenido = document.getElementById('teoriaContenido').value.trim();
            if (!titulo || !contenido) return;

            fetch('/api/comunidad/', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
                body: JSON.stringify({ titulo: titulo, contenido: contenido }),
            }).then(function (res) {
                if (res.status === 401 || res.status === 403) {
                    window.location.href = '/login/';
                    return Promise.reject();
                }
                document.getElementById('teoriaTitulo').value = '';
                document.getElementById('teoriaContenido').value = '';
                cargarTeorias();
            }).catch(function () {});
        });
    }

    cargarTeorias();
})();
