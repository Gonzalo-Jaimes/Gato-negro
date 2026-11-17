/* Gato Negro · patrones de interfaz (sin dependencias).
   Estilos en public/css/theme.css (sección "PATRONES DE INTERFAZ").
   API: UI.toast, UI.confirm, UI.setLoading, UI.postJSON, UI.estado, UI.form, UI.tabla
   Atributos: data-confirm="mensaje" en <form> o <a> pide confirmación con un diálogo accesible. */
(function () {
    'use strict';
    const UI = (window.UI = {});

    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const norm = (s) => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    let uid = 0;
    UI.esc = esc;

    /* ---------- Toast ---------- */
    function regionToast() {
        let r = document.querySelector('.toast-region');
        if (!r) {
            r = document.createElement('div');
            r.className = 'toast-region';
            r.setAttribute('role', 'status');
            r.setAttribute('aria-live', 'polite');
            document.body.appendChild(r);
        }
        return r;
    }
    UI.toast = function (mensaje, tipo, ms) {
        tipo = tipo || 'info';
        const iconos = { success: '✅', danger: '⛔', warning: '⚠️', info: 'ℹ️' };
        const t = document.createElement('div');
        t.className = 'toast toast-' + tipo;
        if (tipo === 'danger') t.setAttribute('role', 'alert');
        const ic = document.createElement('span'); ic.setAttribute('aria-hidden', 'true'); ic.textContent = iconos[tipo] || iconos.info;
        const msg = document.createElement('div'); msg.className = 'toast-msg'; msg.textContent = mensaje;
        const x = document.createElement('button'); x.type = 'button'; x.className = 'toast-close'; x.setAttribute('aria-label', 'Cerrar aviso'); x.textContent = '×';
        t.append(ic, msg, x);
        regionToast().appendChild(t);
        const quitar = () => { t.classList.add('saliendo'); setTimeout(() => t.remove(), 220); };
        x.addEventListener('click', quitar);
        setTimeout(quitar, ms || (tipo === 'danger' ? 8000 : 4500));
        return t;
    };

    /* ---------- Confirmación accesible (reemplaza a confirm()) ---------- */
    UI.confirm = function (o) {
        o = o || {};
        return new Promise((resolve) => {
            const previo = document.activeElement;
            const id = 'ui-c' + ++uid;
            const fondo = document.createElement('div');
            fondo.className = 'modal-backdrop activo';
            fondo.innerHTML =
                '<div class="modal-dialog" role="alertdialog" aria-modal="true" aria-labelledby="' + id + '-t" aria-describedby="' + id + '-d" style="max-width:440px">' +
                '<div class="modal-header"><h3 class="modal-title" id="' + id + '-t"></h3></div>' +
                '<p id="' + id + '-d" style="color:var(--text-muted);white-space:pre-line"></p>' +
                '<div class="modal-footer"><button type="button" class="btn btn-ghost" data-r="0"></button>' +
                '<button type="button" class="btn ' + (o.peligro ? 'btn-danger' : '') + '" data-r="1"></button></div></div>';
            fondo.querySelector('.modal-title').textContent = o.titulo || '¿Confirmas la acción?';
            fondo.querySelector('p').textContent = o.mensaje || '';
            const botones = fondo.querySelectorAll('button');
            botones[0].textContent = o.cancelar || 'Cancelar';
            botones[1].textContent = o.confirmar || 'Confirmar';

            function cerrar(v) {
                document.removeEventListener('keydown', teclas, true);
                fondo.remove();
                if (previo && previo.focus) previo.focus();
                resolve(v);
            }
            function teclas(e) {
                if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cerrar(false); }
                else if (e.key === 'Tab') {
                    const f = [botones[0], botones[1]];
                    const i = f.indexOf(document.activeElement);
                    e.preventDefault();
                    f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
                }
            }
            fondo.addEventListener('click', (e) => { if (e.target === fondo) cerrar(false); });
            botones[0].addEventListener('click', () => cerrar(false));
            botones[1].addEventListener('click', () => cerrar(true));
            document.addEventListener('keydown', teclas, true);
            document.body.appendChild(fondo);
            botones[0].focus(); // el foco inicial va a la opción segura
        });
    };

    function opcionesDeDataset(el) {
        return {
            mensaje: el.dataset.confirm,
            titulo: el.dataset.confirmTitulo || '¿Confirmas la acción?',
            confirmar: el.dataset.confirmOk || 'Sí, continuar',
            peligro: el.dataset.confirmTipo === 'peligro'
        };
    }
    document.addEventListener('submit', async (e) => {
        const f = e.target;
        const submitter = e.submitter;
        // La confirmación puede estar en el botón que envía (p. ej. «Liquidar») o en el formulario entero.
        const fuente = submitter && submitter.dataset && submitter.dataset.confirm ? submitter : (f.matches && f.matches('form[data-confirm]') ? f : null);
        if (!fuente || f.dataset.confirmado) return;
        e.preventDefault();
        if (await UI.confirm(opcionesDeDataset(fuente))) {
            f.dataset.confirmado = '1';
            if (f.requestSubmit) f.requestSubmit(submitter); else f.submit();
            setTimeout(() => delete f.dataset.confirmado, 0);
        }
    }, true);
    document.addEventListener('click', async (e) => {
        const a = e.target.closest && e.target.closest('a[data-confirm]');
        if (!a) return;
        e.preventDefault();
        if (await UI.confirm(opcionesDeDataset(a))) window.location.href = a.href;
    });

    /* ---------- Cargando ---------- */
    UI.setLoading = function (btn, on) {
        if (!btn) return;
        btn.classList.toggle('is-loading', !!on);
        btn.disabled = !!on;
        if (on) btn.setAttribute('aria-busy', 'true'); else btn.removeAttribute('aria-busy');
    };

    /* ---------- Red: JSON con errores tipados ---------- */
    UI.postJSON = async function (url, datos, metodo) {
        let res;
        try {
            res = await fetch(url, {
                method: metodo || 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                credentials: 'same-origin',
                body: datos === undefined ? undefined : JSON.stringify(datos)
            });
        } catch (_) {
            throw { tipo: 'red', mensaje: 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.' };
        }
        let cuerpo = {};
        try { cuerpo = await res.json(); } catch (_) { /* respuesta sin JSON */ }
        if (res.status === 401 || res.status === 403) throw { tipo: 'denegado', mensaje: cuerpo.mensaje || 'No tienes permiso para realizar esta acción.' };
        if (!res.ok || cuerpo.ok === false) throw { tipo: 'error', mensaje: cuerpo.mensaje || 'El servidor no pudo completar la acción.', campos: cuerpo.campos };
        return cuerpo;
    };
    UI.getJSON = (url) => UI.postJSON(url, undefined, 'GET');

    /* ---------- Bloques de estado (vacío, sin resultados, error, sin permisos) ---------- */
    const ESTADOS = {
        vacio: { icono: '📭', titulo: 'Aún no hay registros', texto: 'Cuando se agregue el primero aparecerá aquí.', clase: '' },
        'sin-resultados': { icono: '🔎', titulo: 'Sin resultados', texto: 'Prueba con otras palabras o quita el filtro.', clase: '' },
        error: { icono: '⚠️', titulo: 'No se pudo cargar la información', texto: 'Ocurrió un problema al consultar los datos.', clase: 'state-error' },
        denegado: { icono: '🔒', titulo: 'No tienes permiso para ver esto', texto: 'Tu cuenta no tiene acceso a esta sección. Pide acceso a un administrador.', clase: 'state-denied' }
    };
    UI.estado = function (tipo, o) {
        o = Object.assign({}, ESTADOS[tipo], o || {});
        const div = document.createElement('div');
        div.className = 'state ' + (o.clase || '');
        if (tipo === 'error') div.setAttribute('role', 'alert');
        div.innerHTML = '<div class="state-icon" aria-hidden="true">' + o.icono + '</div><h3 class="state-title"></h3><p class="state-text"></p><div class="state-actions"></div>';
        div.querySelector('h3').textContent = o.titulo;
        div.querySelector('p').textContent = o.texto;
        const acc = div.querySelector('.state-actions');
        (o.acciones || []).forEach((a) => {
            const b = document.createElement(a.href ? 'a' : 'button');
            if (a.href) b.href = a.href; else b.type = 'button';
            b.className = 'btn ' + (a.clase || 'btn-ghost');
            b.textContent = a.texto;
            if (a.onClick) b.addEventListener('click', a.onClick);
            acc.appendChild(b);
        });
        if (!acc.children.length) acc.remove();
        return div;
    };

    /* ---------- Formularios: validación por campo + envío asíncrono ---------- */
    UI.form = function (form, cfg) {
        const reglas = cfg.campos || {};
        const tocados = new Set();
        const alerta = form.querySelector('[data-form-alerta]');
        const boton = form.querySelector('[type="submit"]');
        form.noValidate = true; // los mensajes los damos nosotros, específicos y en español

        function nodoError(input) {
            const id = input.id || input.name;
            let n = form.querySelector('#' + id + '-error');
            if (!n) {
                n = document.createElement('span');
                n.id = id + '-error'; n.className = 'field-error'; n.hidden = true;
                (input.closest('.field') || input.parentElement).appendChild(n);
            }
            return n;
        }
        function pintar(input, mensaje, valido) {
            const n = nodoError(input);
            input.classList.toggle('is-invalid', !!mensaje);
            input.classList.toggle('is-valid', !mensaje && valido);
            if (mensaje) {
                input.setAttribute('aria-invalid', 'true');
                input.setAttribute('aria-describedby', n.id);
                n.textContent = mensaje; n.hidden = false;
            } else {
                input.removeAttribute('aria-invalid');
                input.removeAttribute('aria-describedby');
                n.textContent = ''; n.hidden = true;
            }
        }
        function validarCampo(nombre) {
            const input = form.elements[nombre];
            if (!input) return null;
            const valor = (input.value || '').trim();
            const msg = reglas[nombre](valor);
            pintar(input, msg, tocados.has(nombre) && valor !== '');
            // Con todos los campos ya corregidos, el aviso general deja de tener sentido.
            if (alerta && !alerta.hidden && Object.keys(reglas).every((n) => form.elements[n] && !reglas[n]((form.elements[n].value || '').trim()))) mostrarAlerta('');
            return msg;
        }
        Object.keys(reglas).forEach((nombre) => {
            const input = form.elements[nombre];
            if (!input) return;
            input.addEventListener('blur', () => { tocados.add(nombre); validarCampo(nombre); });
            input.addEventListener('input', () => { if (tocados.has(nombre)) validarCampo(nombre); });
        });
        function mostrarAlerta(texto) {
            if (!alerta) return;
            alerta.textContent = texto || '';
            alerta.hidden = !texto;
        }
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            mostrarAlerta('');
            const invalidos = Object.keys(reglas).filter((n) => { tocados.add(n); return validarCampo(n); });
            if (invalidos.length) {
                mostrarAlerta('Revisa ' + (invalidos.length === 1 ? 'el campo marcado' : 'los ' + invalidos.length + ' campos marcados') + ' antes de continuar.');
                form.elements[invalidos[0]].focus();
                return;
            }
            const datos = {};
            Object.keys(reglas).forEach((n) => { datos[n] = (form.elements[n].value || '').trim(); });
            if (!cfg.enviar) { UI.setLoading(boton, true); form.submit(); return; } // envío clásico tras validar
            UI.setLoading(boton, true);
            try {
                const r = await cfg.enviar(datos);
                tocados.clear();
                form.reset();
                Object.keys(reglas).forEach((n) => pintar(form.elements[n], null, false));
                if (cfg.exito) cfg.exito(r, datos);
            } catch (err) {
                if (err.campos) {
                    Object.keys(err.campos).forEach((n) => { if (form.elements[n]) pintar(form.elements[n], err.campos[n], false); });
                    const primero = Object.keys(err.campos).find((n) => form.elements[n]);
                    if (primero) form.elements[primero].focus();
                }
                mostrarAlerta(err.mensaje || 'No se pudo guardar.');
                if (cfg.error) cfg.error(err);
            } finally {
                UI.setLoading(boton, false);
            }
        });
        return { validarCampo, mostrarAlerta };
    };

    /* ---------- Tabla de datos: búsqueda, orden, paginación y estados ---------- */
    UI.tabla = function (tabla, cfg) {
        cfg = cfg || {};
        const tamanos = cfg.tamanos || [10, 25, 50];
        const est = { q: '', col: -1, dir: 1, pagina: 1, tamano: cfg.tamano || tamanos[0], filtros: {} };
        const filtrosCfg = cfg.filtros || [];   // [{ id, etiqueta, opciones: [[valor, texto]], coincide: (tr, valor) => bool }]
        const thead = tabla.tHead;
        const ths = thead ? Array.from(thead.rows[0].cells) : [];
        const tbody = tabla.tBodies[0];
        const mostrarPorCol = ths.some((t) => t.dataset.col === 'demanda');
        // Si hay columnas «bajo demanda», se añade una columna de acciones (sin título visible) para el botón «Ver detalle».
        if (mostrarPorCol && thead && !ths.some((h) => h.classList.contains('acciones'))) {
            const h = document.createElement('th'); h.className = 'acciones'; h.dataset.col = 'esencial'; h.scope = 'col';
            h.innerHTML = '<span class="sr-only">Detalle</span>'; thead.rows[0].appendChild(h); ths.push(h);
        }

        const raiz = document.createElement('div');
        raiz.className = 'tabla-datos';
        tabla.parentNode.insertBefore(raiz, tabla);
        const id = 'ui-t' + ++uid;
        const barra = document.createElement('div');
        barra.className = 'table-toolbar';
        barra.innerHTML =
            '<div class="table-search"><label class="sr-only" for="' + id + '-q">' + esc(cfg.etiquetaBusqueda || 'Buscar en la tabla') + '</label>' +
            '<input type="search" id="' + id + '-q" class="input" placeholder="' + esc(cfg.placeholder || 'Buscar…') + '" autocomplete="off"></div>' +
            filtrosCfg.map((f) => '<div class="table-filtro"><label class="table-filtro-etiqueta" for="' + id + '-f-' + f.id + '">' + esc(f.etiqueta) + '</label> <select id="' + id + '-f-' + f.id + '" class="input" data-filtro="' + f.id + '" style="min-height:34px;padding:2px 8px">' +
                f.opciones.map((o) => '<option value="' + esc(o[0]) + '">' + esc(o[1]) + '</option>').join('') + '</select></div>').join('') +
            '<div class="table-meta" role="status" aria-live="polite"></div>';
        const envoltura = document.createElement('div');
        envoltura.className = 'table-wrap';
        tabla.parentNode.insertBefore(envoltura, tabla);
        envoltura.appendChild(tabla);
        const zonaEstado = document.createElement('div');
        zonaEstado.className = 'table-estado';
        const pie = document.createElement('div');
        pie.className = 'table-pager';
        pie.innerHTML =
            '<label class="table-meta" for="' + id + '-n">Filas por página <select id="' + id + '-n" class="input" style="min-height:34px;padding:2px 8px"></select></label>' +
            '<div class="pager-btns"><button type="button" class="btn btn-ghost btn-sm" data-p="-1">← Anterior</button>' +
            '<span class="table-meta" data-info></span><button type="button" class="btn btn-ghost btn-sm" data-p="1">Siguiente →</button></div>';
        raiz.append(barra, envoltura, zonaEstado, pie);

        const inputQ = barra.querySelector('input');
        const meta = barra.querySelector('.table-meta');
        const selN = pie.querySelector('select');
        tamanos.forEach((n) => { const o = document.createElement('option'); o.value = n; o.textContent = n; selN.appendChild(o); });
        selN.value = est.tamano;

        let filas = []; // { tr, texto, detalle }

        function prepararFila(tr) {
            Array.from(tr.cells).forEach((td, i) => {
                const th = ths[i];
                if (!th) return;
                if (!td.dataset.label) td.dataset.label = th.textContent.trim();
                if (th.dataset.col && !td.dataset.col) td.dataset.col = th.dataset.col;
            });
            const t = norm(tr.textContent);
            const f = { tr, texto: t, compacto: t.replace(/[^a-z0-9]/g, ''), detalle: null };
            if (mostrarPorCol) {
                const celdas = Array.from(tr.cells).filter((c) => c.dataset.col === 'demanda');
                if (celdas.length) {
                    const btn = document.createElement('button');
                    btn.type = 'button'; btn.className = 'btn btn-ghost btn-sm'; btn.textContent = 'Ver detalle'; btn.setAttribute('aria-expanded', 'false');
                    let dest = tr.querySelector('td.acciones');
                    if (!dest) { dest = document.createElement('td'); dest.className = 'acciones'; tr.appendChild(dest); }
                    dest.appendChild(btn);
                    btn.addEventListener('click', () => {
                        const abierto = btn.getAttribute('aria-expanded') === 'true';
                        btn.setAttribute('aria-expanded', String(!abierto));
                        btn.textContent = abierto ? 'Ver detalle' : 'Ocultar detalle';
                        if (abierto) { if (f.detalle) f.detalle.remove(); }
                        else {
                            f.detalle = document.createElement('tr');
                            f.detalle.className = 'row-detalle';
                            const td = document.createElement('td');
                            td.colSpan = tr.cells.length;
                            td.innerHTML = celdas.map((c) => '<strong>' + esc(c.dataset.label) + ':</strong> ' + esc(c.textContent)).join('<br>');
                            f.detalle.appendChild(td);
                            tr.after(f.detalle);
                        }
                    });
                }
            }
            return f;
        }
        function leer() { filas = Array.from(tbody.rows).filter((r) => !r.classList.contains('row-detalle')).map(prepararFila); }

        function valorOrden(f, i) {
            const td = f.tr.cells[i];
            const v = td.dataset.valor != null ? td.dataset.valor : td.textContent.trim();
            if (ths[i].dataset.sort === 'numero') {
                const t = String(v).replace(/\s|[$A-Za-z%]/g, '');
                const n = /,\d{1,2}$/.test(t) ? t.replace(/\./g, '').replace(',', '.') : t.replace(/[.,](?=\d{3}(\D|$))/g, '');
                return parseFloat(n) || 0;
            }
            return norm(v);
        }
        function render(anunciar) {
            const total = filas.length;
            let vis = filas;
            filtrosCfg.forEach((f) => { const v = est.filtros[f.id]; if (v) vis = vis.filter((fila) => f.coincide(fila.tr, v)); });
            if (est.q) {
                // Ignora tildes, mayúsculas y puntuación: «88193514» encuentra «CC-88.193.514».
                const q = norm(est.q), qc = q.replace(/[^a-z0-9]/g, '');
                vis = vis.filter((f) => f.texto.includes(q) || (qc.length >= 3 && f.compacto.includes(qc)));
            }
            if (est.col >= 0) {
                const c = est.col, num = ths[c].dataset.sort === 'numero';
                vis = vis.slice().sort((a, b) => {
                    const x = valorOrden(a, c), y = valorOrden(b, c);
                    return (num ? x - y : String(x).localeCompare(String(y), 'es', { numeric: true })) * est.dir;
                });
            }
            const paginas = Math.max(1, Math.ceil(vis.length / est.tamano));
            if (est.pagina > paginas) est.pagina = paginas;
            const ini = (est.pagina - 1) * est.tamano;
            const pagina = vis.slice(ini, ini + est.tamano);

            const hijos = [];
            pagina.forEach((f) => { hijos.push(f.tr); if (f.detalle && f.detalle.isConnected !== false && f.tr.querySelector('[aria-expanded="true"]')) hijos.push(f.detalle); });
            tbody.replaceChildren(...hijos);

            zonaEstado.replaceChildren();
            const hayDatos = total > 0, hayResultados = vis.length > 0;
            envoltura.hidden = !hayResultados;
            pie.hidden = !hayResultados || vis.length <= tamanos[0];
            barra.hidden = !hayDatos;
            if (!hayDatos) {
                zonaEstado.appendChild(UI.estado('vacio', cfg.vacio));
            } else if (!hayResultados) {
                const hayFiltro = Object.values(est.filtros).some(Boolean);
                zonaEstado.appendChild(UI.estado('sin-resultados', {
                    titulo: est.q ? 'Sin resultados para «' + est.q + '»' : 'Ningún registro coincide con el filtro',
                    texto: 'Revisa la ortografía, busca por otra palabra' + (hayFiltro ? ' o cambia el filtro.' : ', código o documento.'),
                    acciones: [{ texto: hayFiltro ? 'Quitar búsqueda y filtros' : 'Limpiar búsqueda', clase: 'btn-primary', onClick: () => { inputQ.value = ''; est.q = ''; est.filtros = {}; barra.querySelectorAll('[data-filtro]').forEach((s) => { s.value = ''; }); est.pagina = 1; render(true); inputQ.focus(); } }]
                }));
            }
            meta.textContent = hayResultados
                ? 'Mostrando ' + (ini + 1) + '–' + (ini + pagina.length) + ' de ' + vis.length + (vis.length !== total ? ' (filtrado de ' + total + ')' : '')
                : (hayDatos ? '0 resultados' : '');
            pie.querySelector('[data-info]').textContent = 'Página ' + est.pagina + ' de ' + paginas;
            pie.querySelector('[data-p="-1"]').disabled = est.pagina <= 1;
            pie.querySelector('[data-p="1"]').disabled = est.pagina >= paginas;
            ths.forEach((th, i) => { if (th.dataset.sort) th.setAttribute('aria-sort', i === est.col ? (est.dir === 1 ? 'ascending' : 'descending') : 'none'); });
            if (cfg.alRenderizar) cfg.alRenderizar({ total, visibles: vis.length });
        }

        ths.forEach((th, i) => {
            if (!th.dataset.sort) return;
            th.tabIndex = 0;
            th.setAttribute('aria-sort', 'none');
            const ordenar = () => { est.dir = est.col === i ? -est.dir : 1; est.col = i; est.pagina = 1; render(); };
            th.addEventListener('click', ordenar);
            th.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ordenar(); } });
        });
        let temporizador;
        inputQ.addEventListener('input', () => { clearTimeout(temporizador); temporizador = setTimeout(() => { est.q = inputQ.value; est.pagina = 1; render(); }, 120); });
        selN.addEventListener('change', () => { est.tamano = parseInt(selN.value, 10); est.pagina = 1; render(); });
        barra.addEventListener('change', (e) => { const s = e.target.closest('[data-filtro]'); if (s) { est.filtros[s.dataset.filtro] = s.value; est.pagina = 1; render(); } });
        pie.addEventListener('click', (e) => { const b = e.target.closest('[data-p]'); if (b) { est.pagina += parseInt(b.dataset.p, 10); render(); } });

        function mostrarBloque(el) { envoltura.hidden = true; pie.hidden = true; barra.hidden = true; zonaEstado.replaceChildren(el); }
        const api = {
            /* Sustituye las filas por nodos <tr> nuevos (p. ej. tras consultar la API). */
            setFilas(nodos) { tbody.replaceChildren(...nodos); leer(); est.pagina = 1; render(); },
            /* La lista completa vive en `filas`; el <tbody> solo contiene la página visible. */
            agregar(tr, destacar) { if (destacar) tr.classList.add('row-new'); filas.unshift(prepararFila(tr)); est.pagina = 1; render(); },
            quitar(tr) { tr.classList.add('row-removing'); setTimeout(() => { filas = filas.filter((f) => f.tr !== tr); tr.remove(); render(); }, 220); },
            cargando(n) {
                n = n || 5;
                const cols = ths.length || 3;
                const filasEsq = [];
                for (let i = 0; i < n; i++) {
                    const tr = document.createElement('tr');
                    for (let c = 0; c < cols; c++) { const td = document.createElement('td'); td.innerHTML = '<span class="skeleton" style="width:' + (50 + ((i * 17 + c * 23) % 45)) + '%"></span>'; tr.appendChild(td); }
                    filasEsq.push(tr);
                }
                tbody.replaceChildren(...filasEsq);
                envoltura.hidden = false; barra.hidden = true; pie.hidden = true; zonaEstado.replaceChildren();
                envoltura.setAttribute('aria-busy', 'true');
                meta.textContent = '';
            },
            error(msg, reintentar) {
                envoltura.removeAttribute('aria-busy');
                mostrarBloque(UI.estado('error', { texto: msg || undefined, acciones: reintentar ? [{ texto: 'Reintentar', clase: 'btn-primary', onClick: reintentar }] : [] }));
            },
            denegado() { envoltura.removeAttribute('aria-busy'); mostrarBloque(UI.estado('denegado')); },
            refrescar() { envoltura.removeAttribute('aria-busy'); leer(); render(); },
            filas: () => filas
        };
        leer();
        render();
        return api;
    };
})();
