/* Landing: loader, shader del hero (Three.js, solo escritorio), scroll fluido y revelado.
   La clase fx-gl / fx-lite la fija un script inline en <head> antes del primer pintado. */
(function () {
    'use strict';

    var root = document.documentElement;
    var reduced = root.classList.contains('fx-reduced');
    var THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
    var IMG_URL = '/img/logo.png';

    var loader = document.getElementById('loader');
    var heroArt = document.querySelector('.hero-art');
    var heroImg = document.getElementById('hero-img');
    var canvas = document.getElementById('hero-gl');
    var section = document.getElementById('caracteristicas');
    var glApi = null;

    function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
    function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
    function withTimeout(p, ms) {
        return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, ms); })]);
    }

    /* ---------- Loader con progreso real ---------- */
    var total = 0, done = 0;
    function track(p) {
        total++;
        return p.catch(function () {}).then(function () {
            done++;
            root.style.setProperty('--lp', (done / total).toFixed(2));
        });
    }

    function imageReady() {
        if (!heroImg) return Promise.resolve();
        if (heroImg.complete && heroImg.naturalWidth) return Promise.resolve();
        return new Promise(function (res) { heroImg.addEventListener('load', res, { once: true }); heroImg.addEventListener('error', res, { once: true }); });
    }

    function finishLoader() {
        if (!loader || loader.dataset.finished) return;
        loader.dataset.finished = '1';
        loader.classList.add('ready');
        setTimeout(function () {
            loader.classList.add('done');
            root.classList.remove('is-loading');
            if (glApi) glApi.reveal();
            if (location.hash === '#caracteristicas' && section) window.scrollTo(0, section.offsetTop);
            updateReveal();
        }, reduced ? 0 : 650);
    }

    /* ---------- Shader del hero ---------- */
    var VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
    var FRAG = [
        'precision highp float;',
        'uniform sampler2D uTex; uniform vec2 uMouse; uniform vec2 uRes; uniform vec2 uImg; uniform float uTime; uniform float uIntro;',
        'varying vec2 vUv;',
        'vec2 cover(vec2 uv){ float ra = uRes.x/uRes.y; float ia = uImg.x/uImg.y;',
        '  vec2 s = ra > ia ? vec2(1.0, ia/ra) : vec2(ra/ia, 1.0); return (uv - 0.5) * s + 0.5; }',
        'float lum(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }',
        'void main(){',
        '  vec2 uv = cover(vUv);',
        '  vec2 px = 2.0 / uImg;',
        // Profundidad falsa: luminancia promediada en cruz (blur barato)
        '  float d = (lum(texture2D(uTex, uv).rgb) + lum(texture2D(uTex, uv + vec2(px.x, 0.0)).rgb) + lum(texture2D(uTex, uv - vec2(px.x, 0.0)).rgb)',
        '           + lum(texture2D(uTex, uv + vec2(0.0, px.y)).rgb) + lum(texture2D(uTex, uv - vec2(0.0, px.y)).rgb)) / 5.0;',
        '  uv -= uMouse * (d - 0.22) * 0.045;',
        '  vec3 col = texture2D(uTex, uv).rgb;',
        // Brillo cobre pulsante sobre los píxeles ámbar (ojos y franjas)
        '  float amber = smoothstep(0.18, 0.5, col.r - col.b) * smoothstep(0.3, 0.65, col.r);',
        '  col += vec3(0.8, 0.36, 0.09) * amber * (0.3 + 0.18 * sin(uTime * 1.7));',
        '  vec2 q = vUv - 0.5;',
        '  col *= mix(0.4, 1.0, smoothstep(0.85, 0.2, length(q * vec2(1.0, 1.05))));',
        '  col += (fract(sin(dot(vUv * uRes + uTime, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.03;',
        '  gl_FragColor = vec4(col * uIntro, 1.0);',
        '}'
    ].join('\n');

    function toLite() {
        root.classList.remove('fx-gl');
        root.classList.add('fx-lite');
        if (glApi) { glApi.stop(); glApi = null; }
        initLiteParallax();
    }

    function initGL() {
        return withTimeout(import(THREE_URL), 8000).then(function (THREE) {
            return new Promise(function (res, rej) {
                new THREE.TextureLoader().load(IMG_URL, function (t) { res({ THREE: THREE, tex: t }); }, undefined, rej);
            });
        }).then(function (o) {
            var THREE = o.THREE, tex = o.tex;
            tex.colorSpace = THREE.NoColorSpace;
            tex.minFilter = THREE.LinearFilter;
            tex.generateMipmaps = false;

            var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
            var material = new THREE.ShaderMaterial({
                vertexShader: VERT, fragmentShader: FRAG,
                uniforms: {
                    uTex: { value: tex },
                    uMouse: { value: new THREE.Vector2(0, 0) },
                    uRes: { value: new THREE.Vector2(1, 1) },
                    uImg: { value: new THREE.Vector2(tex.image.width, tex.image.height) },
                    uTime: { value: 0 },
                    uIntro: { value: 0 }
                }
            });
            var scene = new THREE.Scene();
            var camera = new THREE.Camera();
            scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

            var u = material.uniforms;
            var target = { x: 0, y: 0 };
            var introStart = -1, visible = true, running = false, t0 = performance.now();

            function resize() {
                var w = heroArt.clientWidth, h = heroArt.clientHeight;
                if (!w || !h) return;
                renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
                renderer.setSize(w, h, false);
                u.uRes.value.set(canvas.width, canvas.height);
            }
            function frame(now) {
                if (!visible || document.hidden) { running = false; return; }
                u.uTime.value = (now - t0) / 1000;
                u.uMouse.value.x += (target.x - u.uMouse.value.x) * 0.06;
                u.uMouse.value.y += (target.y - u.uMouse.value.y) * 0.06;
                if (introStart >= 0) u.uIntro.value = clamp((now - introStart) / 1300, 0, 1);
                renderer.render(scene, camera);
                requestAnimationFrame(frame);
            }
            function start() { if (!running) { running = true; requestAnimationFrame(frame); } }

            var onMove = function (e) {
                target.x = (e.clientX / window.innerWidth) * 2 - 1;
                target.y = -((e.clientY / window.innerHeight) * 2 - 1);
            };
            window.addEventListener('pointermove', onMove, { passive: true });
            document.addEventListener('visibilitychange', start);
            new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); }).observe(heroArt);
            new ResizeObserver(resize).observe(heroArt);
            canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); toLite(); });

            resize();
            u.uIntro.value = 0;
            renderer.render(scene, camera);   // compila el shader antes de quitar el loader
            heroArt.classList.add('gl-ready');
            start();

            glApi = {
                reveal: function () { introStart = performance.now(); start(); },
                stop: function () {
                    visible = false;
                    window.removeEventListener('pointermove', onMove);
                    renderer.dispose();
                    heroArt.classList.remove('gl-ready');
                }
            };
        });
    }

    /* ---------- Modo ligero: parallax por scroll ---------- */
    var liteBound = false;
    function initLiteParallax() {
        if (liteBound || reduced || !heroArt) return;
        liteBound = true;
        var ticking = false;
        window.addEventListener('scroll', function () {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(function () {
                ticking = false;
                var y = Math.min(window.scrollY, window.innerHeight);
                heroArt.style.setProperty('--sy', y);
            });
        }, { passive: true });
    }

    /* ---------- Revelado de módulos ---------- */
    var rafPending = false;
    function updateReveal() {
        if (!section) return;
        if (reduced) { section.style.setProperty('--p', 1); return; }
        var vh = window.innerHeight;
        var p = clamp((vh - section.getBoundingClientRect().top) / (vh * 0.55), 0, 1);
        section.style.setProperty('--p', (p * p * (3 - 2 * p)).toFixed(3));
    }
    function initReveal() {
        if (!section) return;
        window.addEventListener('scroll', function () {
            if (rafPending) return;
            rafPending = true;
            requestAnimationFrame(function () { rafPending = false; updateReveal(); });
        }, { passive: true });
        window.addEventListener('resize', updateReveal);
        updateReveal();

        var cards = section.querySelectorAll('.card-reveal');
        cards.forEach(function (c, i) { c.style.setProperty('--d', ((i % 3) * 90) + 'ms'); });
        if (!('IntersectionObserver' in window) || reduced) {
            cards.forEach(function (c) { c.classList.add('in'); });
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
        }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
        cards.forEach(function (c) { io.observe(c); });
    }

    /* ---------- Smooth scroll del botón ---------- */
    function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    var anim = 0;
    function smoothScrollTo(y) {
        cancelAnimationFrame(anim);
        var from = window.scrollY, dist = y - from;
        if (reduced || Math.abs(dist) < 2) { window.scrollTo(0, y); return; }
        var dur = clamp(Math.abs(dist) * 1.1, 900, 1400), t0 = performance.now();
        function cancel() { cancelAnimationFrame(anim); off(); }
        function off() {
            ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (ev) { window.removeEventListener(ev, cancel); });
        }
        ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (ev) { window.addEventListener(ev, cancel, { passive: true }); });
        (function step(now) {
            var k = clamp((now - t0) / dur, 0, 1);
            window.scrollTo(0, from + dist * easeInOutCubic(k));
            if (k < 1) anim = requestAnimationFrame(step); else off();
        })(t0);
    }
    function initScrollLinks() {
        document.querySelectorAll('a[href="#caracteristicas"]').forEach(function (a) {
            a.addEventListener('click', function (e) {
                if (!section) return;
                e.preventDefault();
                smoothScrollTo(section.getBoundingClientRect().top + window.scrollY);
                try { history.replaceState(null, '', '#caracteristicas'); } catch (err) {}
            });
        });
    }

    /* ---------- Arranque ---------- */
    initReveal();
    initScrollLinks();

    var tasks = [
        track(wait(reduced ? 0 : 900)),
        track(imageReady()),
        track(document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve())
    ];
    if (root.classList.contains('fx-gl')) {
        tasks.push(track(initGL().catch(function () { toLite(); })));
    } else {
        initLiteParallax();
    }
    withTimeout(Promise.all(tasks), 6000).then(finishLoader, finishLoader);
})();
