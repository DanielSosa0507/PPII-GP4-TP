/* ============================================================
   ANOMALY DETECTED — script.js
   Interactividad de front (filtros, tabs, toggles) sin backend.
   ============================================================ */

/* ------------------------------------------------------------
   0) TEMA AUTOMÁTICO SEGÚN HORARIO (se ejecuta ANTES de pintar
      el resto, para evitar el parpadeo de "flash" de color).
      18:00 a 5:59  -> tema oscuro (el de siempre, sin clase extra)
      6:00  a 17:59 -> tema claro  (clase .light-theme en <body>)
   ------------------------------------------------------------ */
aplicarTemaSegunHorario();

function aplicarTemaSegunHorario() {
    var ahora = new Date();
    var hora = ahora.getHours(); // 0-23, hora local del dispositivo

    var esDeDia = hora >= 6 && hora < 18; // 6:00 a 17:59

    if (esDeDia) {
        document.documentElement.classList.add('light-theme');
    } else {
        document.documentElement.classList.remove('light-theme');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Vuelve a aplicar por si el <body> todavía no existía al ejecutar arriba.
    document.body.classList.toggle('light-theme', document.documentElement.classList.contains('light-theme'));

    // Revisa la hora cada minuto, por si alguien deja la pestaña abierta
    // justo en el momento del cambio (las 6:00 o las 18:00).
    setInterval(aplicarTemaYSincronizarBody, 60 * 1000);

    initEventoEspecial();
    initComunidadTabs();
    initComunidadVotos();
    initFavoritosFiltros();
    initReporteSelectorTipo();
    initReportesSidebarFiltros();
    initFormularioReporte();
});

function aplicarTemaYSincronizarBody() {
    aplicarTemaSegunHorario();
    document.body.classList.toggle('light-theme', document.documentElement.classList.contains('light-theme'));
}

/* ------------------------------------------------------------
   0.5) EVENTOS ESPECIALES (decoración temática)
   - Halloween: todo el mes de octubre.
   - Luna llena: se calcula con una fórmula astronómica simple
     (no exacta al segundo, pero suficiente para esta demo) y
     dura el día exacto del plenilunio.
   Ambos agregan: un banner arriba de la página + una capa de
   íconos animados flotando de fondo + una clase en <html> que
   cambia el acento de color vía CSS.
   ------------------------------------------------------------ */
function initEventoEspecial() {
    var evento = detectarEventoActivo();
    if (!evento) return;

    document.documentElement.classList.add('evento-' + evento.clase);
    insertarBannerEvento(evento);
    insertarDecoracionEvento(evento);
}

function detectarEventoActivo() {
    var ahora = new Date();

    // --- Halloween: todo octubre ---
    if (ahora.getMonth() === 9) { // 0-indexado: 9 = octubre
        return {
            clase: 'halloween',
            mensaje: 'Modo Halloween activado — Ruta embrujada especial todo octubre',
            iconos: [],
        };
    }

    // --- Luna llena: cálculo aproximado ---
    if (esLunaLlenaHoy(ahora)) {
        return {
            clase: 'luna-llena',
            mensaje: 'Noche de Luna llena — mayor visibilidad nocturna para avistamientos hoy',
            iconos: [],
        };
    }

    return null;
}

function esLunaLlenaHoy(fecha) {
    // Cálculo aproximado del ciclo lunar (29.53 días) a partir de una
    // luna nueva de referencia conocida (6 de enero de 2000).
    var LUNA_NUEVA_REF = Date.UTC(2000, 0, 6, 18, 14);
    var CICLO_MS = 29.53058867 * 24 * 60 * 60 * 1000;

    var diff = fecha.getTime() - LUNA_NUEVA_REF;
    var ciclosTranscurridos = diff / CICLO_MS;
    var faseActual = ciclosTranscurridos - Math.floor(ciclosTranscurridos); // 0 a 1

    // Luna llena ocurre en fase ≈ 0.5. Margen de ±1.5% del ciclo
    // (~10 horas) para que el día completo de la luna llena la muestre.
    return Math.abs(faseActual - 0.5) < 0.015;
}

function insertarBannerEvento(evento) {
    var banner = document.createElement('div');
    banner.className = 'banner-evento banner-evento-' + evento.clase;
    banner.innerHTML = '<span>' + evento.mensaje + '</span>';
    document.body.insertBefore(banner, document.body.firstChild);
}

function insertarDecoracionEvento(evento) {
    if (!evento.iconos.length) return;

    var capa = document.createElement('div');
    capa.className = 'decoracion-evento';
    capa.setAttribute('aria-hidden', 'true');

    var CANTIDAD = 14;
    for (var i = 0; i < CANTIDAD; i++) {
        var icono = document.createElement('span');
        icono.className = 'decoracion-evento-icono';
        icono.textContent = evento.iconos[i % evento.iconos.length];
        icono.style.left = (Math.random() * 100) + 'vw';
        icono.style.animationDuration = (12 + Math.random() * 10) + 's';
        icono.style.animationDelay = (Math.random() * 12) + 's';
        icono.style.fontSize = (1 + Math.random() * 1.2) + 'rem';
        icono.style.opacity = (0.25 + Math.random() * 0.35).toFixed(2);
        capa.appendChild(icono);
    }
    document.body.appendChild(capa);
}

/* ------------------------------------------------------------
   2) TABS DE COMUNIDAD (Teorías / Experiencias / Eventos)
   ------------------------------------------------------------ */
function initComunidadTabs() {
    var tabs = document.querySelectorAll('.tab[data-tab]');
    if (!tabs.length) return;

    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            tabs.forEach(function (t) { t.classList.remove('active'); });
            tab.classList.add('active');
            // En esta versión sin backend, solo cambiamos el estado visual.
            // Si en el futuro se separa el feed por categoría, acá se filtraría.
        });
    });
}

/* ------------------------------------------------------------
   3) VOTOS DE COMUNIDAD (Creíble / Dudoso / Muy extraño)
   ------------------------------------------------------------ */
function initComunidadVotos() {
    var botones = document.querySelectorAll('.btn-vote');
    if (!botones.length) return;

    botones.forEach(function (btn) {
        var yaVoto = false;
        btn.addEventListener('click', function () {
            if (yaVoto) return; // evita sumar votos infinitos en la demo
            var match = btn.textContent.match(/\((\d+)\)/);
            if (match) {
                var actual = parseInt(match[1], 10);
                btn.textContent = btn.textContent.replace(/\(\d+\)/, '(' + (actual + 1) + ')');
            }
            btn.classList.add('btn-vote-creible');
            yaVoto = true;
        });
    });

    // Botón "Publicar" en el creador de post
    var btnPublish = document.querySelector('.btn-publish');
    var textarea = document.querySelector('.post-creator textarea');
    if (btnPublish && textarea) {
        btnPublish.addEventListener('click', function () {
            if (textarea.value.trim() === '') {
                textarea.focus();
                return;
            }
            textarea.value = '';
            textarea.placeholder = '¡Publicado! Compartí tu próxima teoría o experiencia...';
        });
    }
}

/* ------------------------------------------------------------
   4) FILTROS DE FAVORITOS (Todos / OVNIs / Embrujados / Visitados)
   ------------------------------------------------------------ */
function initFavoritosFiltros() {
    var tags = document.querySelectorAll('.filter-tags .tag[data-filtro]');
    var cards = document.querySelectorAll('.cards-grid .card[data-tipo]');
    if (!tags.length || !cards.length) return;

    tags.forEach(function (tag) {
        tag.addEventListener('click', function () {
            tags.forEach(function (t) { t.classList.remove('active'); });
            tag.classList.add('active');

            var filtro = tag.getAttribute('data-filtro');

            cards.forEach(function (card) {
                var tipo = card.getAttribute('data-tipo');
                var visitado = card.getAttribute('data-visitado') === 'true';
                var mostrar = true;

                if (filtro === 'ovni') mostrar = tipo === 'ovni';
                else if (filtro === 'embrujado') mostrar = tipo === 'embrujado';
                else if (filtro === 'visitados') mostrar = visitado;
                // filtro === 'todos' -> mostrar siempre true

                card.style.display = mostrar ? '' : 'none';
            });
        });
    });
}

/* ------------------------------------------------------------
   5-7) FILTROS, ZOOM, MAPA DE CALOR Y POPUPS DEL MAPA
   Ahora viven en mapa-leaflet.js, que controla el mapa real de
   Leaflet en vez de simular posiciones con top/left en %.
   ------------------------------------------------------------ */

/* ------------------------------------------------------------
   8) SELECTOR DE TIPO DE FENÓMENO (Reportar nuevo fenómeno)
   ------------------------------------------------------------ */
function initReporteSelectorTipo() {
    var botones = document.querySelectorAll('.selector-tipo .btn-tipo[data-tipo]');
    var grupoForma = document.getElementById('grupo-forma-ovni');
    var grupoEmbrujado = document.getElementById('grupo-embrujado');
    if (!botones.length) return;

    botones.forEach(function (btn) {
        btn.addEventListener('click', function () {
            botones.forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');

            var esOvni = btn.getAttribute('data-tipo') === 'ovni';

            if (grupoForma) {
                grupoForma.classList.toggle('hidden', !esOvni);
                var selectOvni = grupoForma.querySelector('select');
                if (selectOvni) selectOvni.required = esOvni;
            }

            if (grupoEmbrujado) {
                grupoEmbrujado.classList.toggle('hidden', esOvni);
                var selectEmbrujado = grupoEmbrujado.querySelector('select');
                if (selectEmbrujado) selectEmbrujado.required = !esOvni;
            }
        });
    });
}

/* ------------------------------------------------------------
   FILTROS DE TIPO EN SIDEBAR DE REPORTES (OVNIs / Embrujados)
   ------------------------------------------------------------ */
function initReportesSidebarFiltros() {
    var botones = document.querySelectorAll('.filter-box-btn[data-tipo]');
    if (!botones.length) return;

    botones.forEach(function (btn) {
        btn.addEventListener('click', function () {
            btn.classList.toggle('active');
        });
    });
}

/* ------------------------------------------------------------
   ENVÍO DEL FORMULARIO DE REPORTE (validación simple en front)
   ------------------------------------------------------------ */
function initFormularioReporte() {
    var form = document.getElementById('form-reporte');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        var camposRequeridos = form.querySelectorAll('[required]');
        var faltante = null;

        camposRequeridos.forEach(function (campo) {
            if (campo.offsetParent !== null && !campo.value.trim()) {
                faltante = faltante || campo;
            }
        });

        if (faltante) {
            e.preventDefault();
            faltante.focus();
        }
        // Si está todo completo, se deja que el form siga su action normal (Django).
    });
}