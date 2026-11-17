/* Auditoría de accesibilidad propia (sin librerías externas), Fase 4 del taller.
   Uso: abrir una pantalla con sesión iniciada, pegar este archivo en la consola del navegador y ejecutar:
        JSON.parse(window.__audit())
   Comprueba: idioma/título/viewport, landmarks y skip link, encabezados, imágenes sin alt, nombres accesibles,
   controles sin etiqueta o solo con placeholder, ids duplicados, tabindex positivo, tablas (caption y scope),
   aria-invalid sin mensaje y CONTRASTE real de cada texto (WCAG: 4,5:1 normal, 3:1 grande).
   Límite: textos sobre fondos con degradado/imagen se cuentan aparte como "indeterminados". */
window.__audit = function () { return (() => {
    const out = { url: location.pathname };
    const vis = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && !e.closest('[hidden]'); };
    const nombre = (e) => (e.getAttribute('aria-label') || '').trim() || (e.getAttribute('aria-labelledby') ? [...e.getAttribute('aria-labelledby').split(' ')].map(i => (document.getElementById(i) || {}).textContent || '').join(' ').trim() : '') || (e.textContent || '').replace(/\s+/g, ' ').trim() || (e.getAttribute('title') || '').trim() || (e.querySelector('img[alt]') ? e.querySelector('img[alt]').alt : '');

    out.documento = { lang: document.documentElement.lang, titulo: !!document.title.trim(), viewport: !!document.querySelector('meta[name=viewport]') };
    out.landmarks = { main: document.querySelectorAll('main').length, nav: document.querySelectorAll('nav').length, header: document.querySelectorAll('header').length, skipLink: !!document.querySelector('a.skip-link[href^="#"]') && !!document.querySelector(document.querySelector('a.skip-link[href^="#"]').getAttribute('href')) };
    const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(vis);
    let salto = 0, prev = 0; hs.forEach(h => { const n = +h.tagName[1]; if (prev && n > prev + 1) salto++; prev = n; });
    out.encabezados = { h1: hs.filter(h => h.tagName === 'H1').length, saltosDeNivel: salto };
    out.imgSinAlt = [...document.querySelectorAll('img')].filter(i => !i.hasAttribute('alt')).length;

    const interact = [...document.querySelectorAll('button, a[href], [role=button], summary')].filter(vis);
    out.sinNombreAccesible = interact.filter(e => !nombre(e)).map(e => e.outerHTML.slice(0, 80));
    const ctrls = [...document.querySelectorAll('input, select, textarea')].filter(e => !['hidden', 'submit', 'button', 'reset'].includes(e.type) && vis(e));
    out.controles = ctrls.length;
    out.controlesSinEtiqueta = ctrls.filter(e => !(e.id && document.querySelector('label[for="' + e.id + '"]')) && !e.closest('label') && !e.getAttribute('aria-label') && !e.getAttribute('aria-labelledby')).map(e => (e.id || e.name || e.type));
    out.soloPlaceholder = ctrls.filter(e => e.placeholder && !(e.id && document.querySelector('label[for="' + e.id + '"]')) && !e.getAttribute('aria-label')).length;
    const ids = {}; document.querySelectorAll('[id]').forEach(e => { ids[e.id] = (ids[e.id] || 0) + 1; });
    out.idsDuplicados = Object.entries(ids).filter(([, n]) => n > 1).map(([i]) => i);
    out.tabindexPositivo = document.querySelectorAll('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])').length;
    const tablas = [...document.querySelectorAll('table')].filter(vis);
    out.tablas = tablas.map(t => ({ caption: !!t.querySelector('caption') || !!t.getAttribute('aria-label') || !!t.getAttribute('aria-labelledby'), thScope: t.querySelectorAll('th[scope]').length, th: t.querySelectorAll('th').length }));
    out.regionesLive = document.querySelectorAll('[aria-live], [role=alert], [role=status]').length;
    out.ariaInvalidSinMensaje = [...document.querySelectorAll('[aria-invalid=true]')].filter(e => !e.getAttribute('aria-describedby')).length;

    // Contraste real: color de texto frente al fondo efectivo (mezclando fondos con transparencia)
    const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(x => parseFloat(x)); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
    const mezcla = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
    const fondo = (e) => { const capas = []; for (let n = e; n; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c.a > 0) { capas.push(c); if (c.a === 1) break; } } let b = { r: 255, g: 255, b: 255, a: 1 }; if (!capas.length || capas[capas.length - 1].a < 1) { const bd = parse(getComputedStyle(document.body).backgroundColor); if (bd && bd.a > 0) b = bd; } capas.reverse().forEach(c => { b = mezcla(c, b); }); return b; };
    const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
    const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const vistos = new Map(); let evaluados = 0, falla = 0, indeterminados = 0;
    const conGradiente = (e) => { for (let n = e; n; n = n.parentElement) { if (getComputedStyle(n).backgroundImage !== 'none') return true; } return false; };
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n; (n = w.nextNode());) {
        if (!n.nodeValue.trim()) continue; const e = n.parentElement; if (!e || !vis(e) || e.closest('script,style,noscript,canvas')) continue;
        const cs = getComputedStyle(e); let fg = parse(cs.color); if (!fg) continue; if (conGradiente(e)) { indeterminados++; continue; } const bg = fondo(e); fg = mezcla(fg, bg);
        const r = ratio(fg, bg); evaluados++;
        const grande = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && parseInt(cs.fontWeight) >= 700);
        const minimo = grande ? 3 : 4.5;
        if (r < minimo) { falla++; const k = cs.color + '|' + cs.backgroundColor + '|' + e.tagName; if (!vistos.has(k)) vistos.set(k, { texto: n.nodeValue.trim().slice(0, 28), ratio: +r.toFixed(2), min: minimo, tag: e.tagName, clase: String(e.className).slice(0, 30) }); }
    }
    out.contraste = { textosEvaluados: evaluados, indeterminadosPorFondoDegradado: indeterminados, textosBajoElMinimo: falla, combinacionesDistintas: [...vistos.values()].slice(0, 8) };
    const peq = interact.filter(e => { const r = e.getBoundingClientRect(); return (r.height < 24 || r.width < 24); }).length;
    out.objetivosMuyPequenos = peq;
    return JSON.stringify(out);
})()
; };
