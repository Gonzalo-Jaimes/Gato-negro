/**
 * Evalúa un modelo de Ollama con el bot REAL (prompt y herramientas reales de bot_core.js).
 * Telegram y Supabase son falsos: no escribe en tu base de datos ni envía nada.
 * Necesita Ollama corriendo con el modelo descargado.
 *
 * Uso:  node tests/evaluar_modelos.js llama3.1
 *       node tests/evaluar_modelos.js qwen2.5:7b
 */
const path = require('path');
const modelo = process.argv[2] || 'llama3.1';
process.env.OLLAMA_MODEL = modelo;
process.env.TELEGRAM_TOKEN = 'token-falso';
delete process.env.GEMINI_API_KEY;
delete process.env.ADMIN_IDS;

const ADMIN = 8589883684;
const handlers = {};
const mock = (ruta, exports) => { const r = require.resolve(ruta); require.cache[r] = { id: r, filename: r, loaded: true, exports }; };
const q = () => { const o = { then(res, rej) { return Promise.resolve({ data: [], error: null }).then(res, rej); } };
    ['select', 'eq', 'in', 'gte', 'gt', 'lt', 'ilike', 'or', 'order', 'limit', 'insert', 'update'].forEach(m => (o[m] = () => o));
    o.single = o.maybeSingle = () => ({ then(res, rej) { return Promise.resolve({ data: null, error: null }).then(res, rej); } }); return o; };
const raiz = path.join(__dirname, '..');
mock(path.join(raiz, 'src/lib/shared.js'), { supabase: { from: q }, obtenerHoraColombia: () => ({ fecha: '2026-11-09', hora: '10:00' }) });
let respuestas = [];
mock('node-telegram-bot-api', class { on(e, f) { handlers[e] = f; } sendMessage(c, t) { respuestas.push(t); return Promise.resolve({}); }
    editMessageText() { return Promise.resolve({}); } answerCallbackQuery() { return Promise.resolve(); } sendChatAction() {} isPolling() { return false; } });

const llamadas = [];
const logOriginal = console.log;
console.log = (...a) => { const t = a.join(' '); if (t.includes('invocó herramienta')) { const m = t.match(/herramienta: (\w+) (.*)$/); llamadas.push({ nombre: m[1], args: JSON.parse(m[2] || '{}') }); } };
console.warn = console.error = () => {};
const bot = require(path.join(raiz, 'src/bot/bot_core.js'));

const usa = (n, chk = () => true) => c => c.some(x => x.nombre === n && chk(x.args));
const casos = [
    ['¿quiénes me deben?',                         usa('listar_todos_los_deudores')],
    ['cuánto debe Alcides',                        usa('consultar_deuda_empleado', a => /alcides/i.test(a.nombre_o_codigo))],
    ['cuántos tabacos se produjeron hoy',          usa('consultar_produccion', a => Number(a.dias) === 1)],
    ['dame la producción de esta semana',          usa('consultar_produccion', a => Number(a.dias) === 7)],
    ['cómo están las máquinas',                    usa('consultar_maquinaria')],
    ['Alcides entregó 1250 tabacos y 3 cestas',    usa('registrar_produccion', a => Number(a.tabacos) === 1250 && Number(a.cestas) === 3)],
    ['F11 entregó 500 tabacos extra, 0 cestas',    usa('registrar_produccion', a => Number(a.tabacos) === 500 && (a.esExtra === true || a.esExtra === 'true'))],
    ['Alcides entregó 800 tabacos y abonó 25000 pesos, 0 cestas', usa('registrar_produccion', a => Number(a.tabacos) === 800 && Number(a.abono_pesos) === 25000)],
    ['quién es Gregorio',                          usa('consultar_documentacion')],
    ['hola, ¿cómo estás?',                         c => c.length === 0],
    // Sin mencionar cestas NO debe registrar: debe preguntar o consultar el despacho
    ['Alcides entregó 800 tabacos',                c => !c.some(x => x.nombre === 'registrar_produccion')],
];

(async () => {
    await handlers.callback_query({ id: 'c', data: 'menu_ia', from: { id: ADMIN }, message: { chat: { id: 1 }, message_id: 1 } });
    let ok = 0, tiempoTotal = 0, conJson = 0;
    console.log = logOriginal;
    console.log(`\nModelo: ${modelo}\n`);
    const loggerTool = console.log; console.log = (...a) => { const t = a.join(' '); if (t.includes('invocó herramienta')) { const m = t.match(/herramienta: (\w+) (.*)$/); llamadas.push({ nombre: m[1], args: JSON.parse(m[2] || '{}') }); } };
    const resultados = [];
    for (let i = 0; i < casos.length; i++) {
        const [texto, valida] = casos[i];
        llamadas.length = 0; respuestas = [];
        const t0 = Date.now();
        await bot.procesarMensajeSync({ chat: { id: 100 + i }, from: { id: ADMIN, first_name: 'T' }, text: texto });
        const seg = (Date.now() - t0) / 1000; tiempoTotal += seg;
        const pasa = valida([...llamadas]);
        const textoResp = respuestas.join(' ');
        if (/\{"name"|\{"function"|Ollama\)? parece estar apagado|me enred|ovillo/i.test(textoResp)) conJson++;
        if (pasa) ok++;
        resultados.push(`  ${pasa ? '✅' : '❌'} ${seg.toFixed(1)}s  "${texto}"  → herramientas: [${llamadas.map(l => l.nombre).join(', ') || 'ninguna'}]`);
    }
    console.log = logOriginal;
    resultados.forEach(r => console.log(r));
    console.log(`\n${modelo}: ${ok}/${casos.length} correctos · ${(tiempoTotal / casos.length).toFixed(1)}s promedio · ${conJson} respuestas con JSON/error visibles\n`);
    process.exit(0);
})();
