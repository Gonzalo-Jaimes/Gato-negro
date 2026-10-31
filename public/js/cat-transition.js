/* Transiciones con el loader del gato, solo en tres flujos:
   landing -> login, login -> panel (al enviar el formulario) y panel -> login (logout).
   Navegacion nativa: el telon cierra, se navega y la pagina nueva carga debajo; al llegar se abre. */
(function () {
    'use strict';

    var KEY = 'cat-transition';
    var root = document.documentElement;
    var loader = document.getElementById('loader');
    var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    function setFlag(v) { try { sessionStorage.setItem(KEY, JSON.stringify({ v: v, t: Date.now() })); } catch (e) {} }
    function clearFlag() { try { sessionStorage.removeItem(KEY); } catch (e) {} }

    // Toda carga consume la marca: una marca vieja nunca dispara el loader en otra pagina.
    clearFlag();

    function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

    /* ---------- Llegada: abrir el telon ---------- */
    if (loader && root.classList.contains('cat-cover')) {
        var loaded = new Promise(function (r) {
            if (document.readyState === 'complete') r(); else window.addEventListener('load', r, { once: true });
        });
        var fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
        Promise.race([Promise.all([loaded, fonts, wait(450)]), wait(4000)]).then(function () {
            loader.classList.add('ready');
            setTimeout(function () { root.classList.remove('cat-cover'); }, 500);
        });
    }

    /* ---------- Salida: cerrar el telon y navegar ---------- */
    function cover(next) {
        if (!loader || reduced) { next(); return; }
        var fired = false;
        function go() { if (fired) return; fired = true; next(); }
        loader.classList.remove('ready', 'done');
        loader.classList.add('closing');
        loader.querySelector('.ld-r').addEventListener('transitionend', go, { once: true });
        setTimeout(go, 700);
    }

    document.addEventListener('click', function (e) {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        var a = e.target.closest && e.target.closest('a[href]');
        if (!a || a.target === '_blank') return;
        var path = a.pathname;
        var flow = null;
        if (path === '/login' && location.pathname === '/') flow = 'landing>login';
        else if (path === '/logout') flow = 'panel>login';
        if (!flow) return;
        e.preventDefault();
        setFlag(flow);
        cover(function () { location.href = a.href; });
    });

    document.addEventListener('submit', function (e) {
        var form = e.target;
        if (!form || form.getAttribute('action') !== '/login' || form.dataset.sent) return;
        e.preventDefault();
        setFlag('login>panel');
        cover(function () { form.dataset.sent = '1'; form.submit(); });
    });

    /* Boton Atras (bfcache): dejar el telon en reposo para no quedar tapado */
    window.addEventListener('pageshow', function (e) {
        if (!e.persisted || !loader) return;
        loader.classList.remove('closing', 'ready');
        loader.classList.add('done');
        root.classList.remove('cat-cover');
        var f = document.querySelector('form[action="/login"]');
        if (f) delete f.dataset.sent;
    });
})();
