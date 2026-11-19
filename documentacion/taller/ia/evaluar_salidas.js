/* Evalúa las dos respuestas del experimento de prompts (salida_debil.md y salida_estructurado.md).
   Uso (desde la raíz del proyecto):  node documentacion/taller/ia/evaluar_salidas.js
   1) Chequeos estructurales sobre el código entregado.
   2) Prueba de comportamiento: ¿cada propuesta acepta/rechaza igual que el servidor real (validarEmpleado en src/routes/admin.js)? */
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const leer = (f) => fs.readFileSync(path.join(dir, f), 'utf8');
const debil = leer('salida_debil.md');
const estruct = leer('salida_estructurado.md');

/* ---------- 1. Chequeos estructurales ---------- */
function estructural(t) {
    const html = (t.match(/```html\n([\s\S]*?)```/) || [, ''])[1];
    const css = [...t.matchAll(/```css\n([\s\S]*?)```/g)].map((m) => m[1]).join('\n') + ((html.match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1]);
    const js = (html.match(/<script>([\s\S]*?)<\/script>/) || [, ''])[1];
    const todo = html + '\n' + css + '\n' + js;
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
    const labels = [...html.matchAll(/<label[^>]*for="([^"]+)"/g)].map((m) => m[1]);
    const inputs = [...html.matchAll(/<input\b[^>]*>/g)].map((m) => m[0]);
    const mensajes = [...js.matchAll(/return\s+'([^']{12,})'/g)].length;
    return {
        mantiene_name_y_action: ['name="codigo"', 'name="nombre"', 'name="cedula"', 'action="/agregar_empleado"', 'method="POST"'].every((s) => html.includes(s)),
        etiquetas_con_for_valido: `${labels.filter((l) => ids.includes(l)).length}/${inputs.length}`,
        inputs_con_aria_describedby: `${inputs.filter((i) => i.includes('aria-describedby')).length}/${inputs.length}`,
        aria_invalid_dinamico: /aria-invalid/.test(js),
        regiones_de_error_o_estado: (html.match(/role="(alert|status)"|aria-live/g) || []).length,
        mensajes_de_error_especificos_en_js: mensajes,
        foco_al_primer_invalido: /\.focus\(\)/.test(js),
        colores_hex_fijos: (todo.match(/#[0-9a-fA-F]{3,8}\b/g) || []).filter((c) => !/^#(titulo|ayuda|form|btn|estado)/.test(c)).length - (html.match(/#[a-z]/gi) || []).length * 0,
        usos_de_tokens_var: (todo.match(/var\(--/g) || []).length,
        // clases del sistema de diseño usadas como TOKEN dentro de un atributo class="..." (no como palabra suelta)
        clases_del_sistema_de_diseno: ['input', 'field', 'btn', 'field-hint', 'field-error'].filter((c) => new RegExp(String.raw`class="(?:[^"]*\s)?${c}(?:\s[^"]*)?"`).test(html)).length + '/5',
        estados_cubiertos: {
            foco: /:focus-visible/.test(css),
            error: /is-invalid|user-invalid|:invalid/.test(css),
            deshabilitado: /:disabled/.test(css),
            exito: /is-valid/.test(css)
        },
        objetivo_tactil_44px: /min-height:\s*44px/.test(css),
        usa_placeholder_como_ejemplo: (html.match(/placeholder=/g) || []).length,
        responsive_una_columna_en_movil: /grid-template-columns:\s*1fr\b/.test(css) || /max-width/.test(css)
    };
}

/* ---------- 2. Comportamiento frente al servidor real ---------- */
const admin = fs.readFileSync(path.join(dir, '..', '..', '..', 'src', 'routes', 'admin.js'), 'utf8');
const trozo = admin.slice(admin.indexOf('function validarEmpleado'), admin.indexOf("router.get('/api/empleados'"));
const validarServidor = new Function(trozo + '; return validarEmpleado;')();
const servidor = (campo, v) => {
    const d = { codigo: '', nombre: '', cedula: '' };
    d[campo] = campo === 'codigo' ? v.trim().toUpperCase() : (campo === 'nombre' ? v.trim().replace(/\s+/g, ' ') : v.trim());
    // los otros campos válidos para aislar el campo bajo prueba
    const base = { codigo: 'F01', nombre: 'Ana Perez', cedula: 'CC-12345678' };
    return !(validarServidor({ ...base, [campo]: d[campo] })[campo]);
};

const regla = estruct.slice(estruct.indexOf('var reglas = {'), estruct.indexOf('var nombres = ['));
const reglasEstruct = new Function(regla.replace(/\n\s*\/\*[\s\S]*?\*\//g, '') + '; return reglas;')();
const estructurado = (campo, v) => reglasEstruct[campo](v) === null;
// HTML `pattern` se evalúa sobre todo el valor; minlength/maxlength/required también aplican.
const debilHTML = {
    codigo: (v) => v.length >= 1 && v.length <= 10 && /^(?:[A-Za-z0-9\-]{2,10})$/.test(v),
    nombre: (v) => v.length >= 3 && v.length <= 80,                       // solo minlength/maxlength; sin pattern
    cedula: (v) => v.length >= 1 && v.length <= 20 && /^(?:(V|E|CC|CE)-?[0-9]{5,12})$/.test(v)
};

const casos = {
    codigo: ['F01', 'AN12', 'f01', 'ABCD1', 'F-1', '1F', 'F12345', 'F 01', 'F', 'AB', 'FAB123', 'A1', 'ÑU1', 'F01 '],
    nombre: ['Ana María Pérez', 'Al', 'Ana3', "O'Neil-Pérez", 'Juan  Carlos', 'X'.repeat(81), 'Carlos_Ruiz', 'José A.', '   ', 'Li'],
    cedula: ['CC-88193514', '88193514', 'V-12345', 'V-1234', 'CC1020304050', 'XX-123', '12.345.678', 'CE-12345678', 'E-9876543', 'cc-88193514', 'CC-1234567890123', 'V-12 345 678', 'V-', 'CC-8819351A']
};

function comparar(nombreImpl, impl) {
    let total = 0, coinciden = 0; const difieren = [];
    for (const campo of Object.keys(casos)) {
        for (const v of casos[campo]) {
            const s = servidor(campo, v), i = impl(campo, v);
            total++; if (s === i) coinciden++; else difieren.push(`${campo}: «${v}» servidor=${s ? 'válido' : 'inválido'}, ${nombreImpl}=${i ? 'válido' : 'inválido'}`);
        }
    }
    return { casos: total, coinciden, porcentaje: +(100 * coinciden / total).toFixed(1), difieren };
}

const resultado = {
    estructural: { prompt_debil: estructural(debil), prompt_estructurado: estructural(estruct) },
    comportamiento_vs_servidor: {
        prompt_debil: comparar('débil', (c, v) => debilHTML[c](v)),
        prompt_estructurado: comparar('estructurado', estructurado)
    }
};
console.log(JSON.stringify(resultado, null, 2));
