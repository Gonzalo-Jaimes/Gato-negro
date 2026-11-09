/**
 * Simulador del bot: ejecuta bot_core.js con Telegram, Supabase, Ollama y Gemini FALSOS.
 * No toca internet, ni la base de datos real, ni tu token. Es seguro correrlo en cualquier momento.
 *
 * Uso:  node tests/simular_bot.js
 */
const path = require('path');
const assert = require('assert');

const ADMIN = 8589883684;      // ID autorizado (de la lista por defecto)
const INTRUSO = 111111111;     // ID NO autorizado

// ---------- Registro de lo que "pasa" ----------
const log = { enviados: [], callbacks: [], ediciones: [], inserts: [], updates: [], supabaseTablas: [], fetch: 0, geminiModelos: [], ollamaLlamadas: [] };
const handlers = {};
const reset = () => { Object.keys(log).forEach(k => Array.isArray(log[k]) ? (log[k].length = 0) : (log[k] = 0)); };

// ---------- Datos falsos de la "base de datos" ----------
const hoyCol = (() => {
    const d = new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', weekday: 'short' }).format(new Date())
        .toLowerCase().replace('.', '').normalize('NFD').replace(/[̀-ͯ]/g, '');
    return ['lun', 'mar', 'mie', 'jue', 'vie', 'sab'].includes(d) ? d : 'extra';
})();
const tablas = {
    maquinas: [{ id: 1, nombre: 'Saranda', estado: 'Funcional', ultimo_mtto: '2026-01-01', frecuencia_mtto_dias: 30 }],
    recepcion_diaria: [
        { lun_tabacos: 7, mar_tabacos: 7, mie_tabacos: 7, jue_tabacos: 7, vie_tabacos: 7, sab_tabacos: 7, extra_tabacos: 7, semana_inicio: '2026-11-02' },
        { lun_tabacos: 7, mar_tabacos: 7, mie_tabacos: 7, jue_tabacos: 7, vie_tabacos: 7, sab_tabacos: 7, extra_tabacos: 7, semana_inicio: '2026-11-02' },
    ],
    empleados_fabriquines: [{ id: 1, codigo: 'F11', nombre: 'Alcides Perez', deuda_tabacos: 5000 }], prestamos_fabriquines: [], despachos_registro: [], inventario: [], movimientos: [],
};

// ---------- Mock de Supabase (encadenable) ----------
function query(tabla) {
    log.supabaseTablas.push(tabla);
    const q = {
        _op: 'select',
        then(res, rej) {
            const data = this._single ? (tablas[tabla] || [])[0] || null : (tablas[tabla] || []);
            return Promise.resolve({ data, error: null }).then(res, rej);
        },
    };
    ['select', 'eq', 'in', 'gte', 'gt', 'lt', 'ilike', 'or', 'order', 'limit'].forEach(m => (q[m] = () => q));
    q.single = () => { q._single = true; return q; };
    q.maybeSingle = () => { q._single = true; return q; };
    q.insert = rows => { log.inserts.push({ tabla, rows }); return q; };
    q.update = row => { log.updates.push({ tabla, row }); return q; };
    return q;
}

// ---------- Inyección de mocks ----------
function mockModulo(ruta, exports) {
    const resolved = require.resolve(ruta);
    require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
}
const raiz = path.join(__dirname, '..');
mockModulo(path.join(raiz, 'src/lib/shared.js'), {
    supabase: { from: query },
    obtenerHoraColombia: () => ({ fecha: '2026-11-09', hora: '10:00' }),
});
mockModulo('node-telegram-bot-api', class FakeTelegramBot {
    constructor() {}
    on(evento, fn) { handlers[evento] = fn; }
    sendMessage(chatId, texto, opts) { log.enviados.push({ chatId, texto, opts }); return Promise.resolve({ message_id: 1 }); }
    editMessageText(texto, opts) { log.ediciones.push({ texto, opts }); return Promise.resolve({}); }
    answerCallbackQuery(id, opts) { log.callbacks.push({ id, opts }); return Promise.resolve(true); }
    sendChatAction() {}
    sendDocument() { return Promise.resolve({}); }
    getFile() { return Promise.resolve({ file_path: 'voice/x.oga' }); }
    isPolling() { return false; }
    stopPolling() {}
});
// Ollama: el guion de respuestas lo define cada prueba
let guionOllama = [];
mockModulo('ollama', {
    Ollama: class { chat(args) { log.ollamaLlamadas.push(JSON.parse(JSON.stringify(args))); return Promise.resolve(guionOllama.shift() || { message: { role: 'assistant', content: 'ok' } }); } },
});
mockModulo('@google/generative-ai', {
    GoogleGenerativeAI: class {
        getGenerativeModel({ model }) {
            return { generateContent: async () => { log.geminiModelos.push(model); return { response: { text: () => 'hola desde la voz' } }; } };
        }
    },
});
global.fetch = async () => { log.fetch++; return { arrayBuffer: async () => new ArrayBuffer(8) }; };

process.env.TELEGRAM_TOKEN = 'token-falso';
process.env.GEMINI_API_KEY = 'gemini-falsa';
process.env.ADMIN_IDS = '6721336050'; // admin extra (segunda cuenta de Gonzalo)
process.env.OLLAMA_HOST = 'http://falso:1';
const bot = require(path.join(raiz, 'src/bot/bot_core.js'));

// ---------- Utilidades de prueba ----------
const msg = (userId, text, extra = {}) => ({ chat: { id: userId }, from: { id: userId, first_name: 'Test' }, text, ...extra });
const boton = (userId, data) => handlers.callback_query({ id: 'cb', data, from: { id: userId }, message: { chat: { id: userId }, message_id: 5 } });
const ultimoTexto = () => (log.enviados[log.enviados.length - 1] || {}).texto || '';

const pruebas = [];
const prueba = (nombre, fn) => pruebas.push({ nombre, fn });

// ================== PRUEBAS ==================
prueba('Intruso: el texto es rechazado y no toca la base de datos', async () => {
    await bot.procesarMensajeSync(msg(INTRUSO, '/deuda F11'));
    assert.match(ultimoTexto(), /No hablo con desconocidos/);
    assert.strictEqual(log.supabaseTablas.length, 0);
});

prueba('Intruso: una nota de voz NO descarga audio ni llama a Gemini', async () => {
    await bot.procesarMensajeSync({ chat: { id: INTRUSO }, from: { id: INTRUSO, first_name: 'X' }, voice: { file_id: 'v' } });
    assert.strictEqual(log.fetch, 0, 'no debe descargar el audio');
    assert.strictEqual(log.geminiModelos.length, 0, 'no debe gastar cuota de Gemini');
});

prueba('Intruso: los botones son rechazados', async () => {
    await boton(INTRUSO, 'menu_finanzas');
    assert.match(log.callbacks[0].opts.text, /No autorizado/);
    assert.strictEqual(log.ediciones.length, 0);
    assert.strictEqual(log.supabaseTablas.length, 0);
});

prueba('Admin: /ping responde', async () => {
    await bot.procesarMensajeSync(msg(ADMIN, '/ping'));
    assert.match(ultimoTexto(), /Pong/);
});

prueba('Admin: "hola" abre el menú principal', async () => {
    await bot.procesarMensajeSync(msg(ADMIN, 'hola'));
    assert.match(ultimoTexto(), /Bienvenido/);
});

prueba('Admin: "Hola, cuánto debe F11?" NO es tomado como saludo', async () => {
    await bot.procesarMensajeSync(msg(ADMIN, 'Hola, cuánto debe F11?'));
    assert.doesNotMatch(ultimoTexto(), /Bienvenido/);
});

prueba('Flujo de mantenimiento: un saludo dentro del reporte NO lo cancela y se guarda', async () => {
    await boton(ADMIN, 'maquina_tipo_Correctivo_1');
    reset();
    await bot.procesarMensajeSync(msg(ADMIN, 'Buenas tardes, falló el motor'));
    assert.strictEqual(log.inserts.length, 1, 'debe guardar el reporte');
    assert.strictEqual(log.inserts[0].tabla, 'mantenimiento');
    assert.match(log.inserts[0].rows[0].descripcion, /falló el motor/);
    assert.strictEqual(log.inserts[0].rows[0].maquina, 'Saranda');
});

prueba('Voz de admin: usa el modelo vigente (gemini-flash-lite-latest)', async () => {
    await bot.procesarMensajeSync({ chat: { id: ADMIN }, from: { id: ADMIN, first_name: 'G' }, voice: { file_id: 'v' } });
    assert.strictEqual(log.fetch, 1);
    assert.deepStrictEqual(log.geminiModelos, ['gemini-flash-lite-latest']);
    assert.ok(log.enviados.some(e => /hola desde la voz/.test(e.texto)), 'debe mostrar lo entendido');
});

prueba('IA: una herramienta inventada NO se reporta como éxito', async () => {
    await boton(ADMIN, 'menu_ia');
    reset();
    guionOllama = [
        { message: { role: 'assistant', content: '', tool_calls: [{ function: { name: 'borrar_todo', arguments: {} } }] } },
        { message: { role: 'assistant', content: 'listo' } },
    ];
    await bot.procesarMensajeSync(msg(ADMIN, 'haz magia'));
    const msgs = log.ollamaLlamadas[1].messages;
    const tool = JSON.parse(msgs.filter(m => m.role === 'tool').pop().content);
    assert.strictEqual(tool.exito, false);
});

prueba('IA: consultar_produccion(dias=1) suma solo la columna de hoy', async () => {
    reset();
    guionOllama = [
        { message: { role: 'assistant', content: '', tool_calls: [{ function: { name: 'consultar_produccion', arguments: { dias: 1 } } }] } },
        { message: { role: 'assistant', content: 'ok' } },
    ];
    await bot.procesarMensajeSync(msg(ADMIN, 'cuántos tabacos hoy'));
    const tool = JSON.parse(log.ollamaLlamadas[1].messages.filter(m => m.role === 'tool').pop().content);
    // 2 registros * 7 tabacos en la columna de hoy (si hoy es domingo: columna "extra", también 7)
    assert.strictEqual(tool.total, 14, `columna de hoy: ${hoyCol}`);
});

prueba('IA: el historial recortado nunca empieza con un mensaje "tool"', async () => {
    reset();
    for (let i = 0; i < 14; i++) {
        guionOllama = [
            { message: { role: 'assistant', content: '', tool_calls: [{ function: { name: 'listar_todos_los_deudores', arguments: {} } }] } },
            { message: { role: 'assistant', content: 'r' + i } },
        ];
        await bot.procesarMensajeSync(msg(ADMIN, 'lista ' + i));
    }
    for (const llamada of log.ollamaLlamadas) {
        assert.strictEqual(llamada.messages[0].role, 'system');
        if (llamada.messages.length > 1) assert.strictEqual(llamada.messages[1].role, 'user', 'primer mensaje tras el prompt debe ser del usuario');
    }
});

prueba('Ollama apagado: el bot responde un aviso y no se cae', async () => {
    reset();
    const { Ollama } = require('ollama');
    const original = Ollama.prototype.chat;
    Ollama.prototype.chat = () => Promise.reject(new Error('ECONNREFUSED'));
    await bot.procesarMensajeSync(msg(ADMIN, 'hola ia'));
    Ollama.prototype.chat = original;
    assert.match(ultimoTexto(), /Ollama/);
});

// ---- Confirmación Sí/No y texto libre ----
const idConfirmacion = () => {
    const ultimo = [...log.enviados].reverse().find(e => e.opts && e.opts.reply_markup && e.opts.reply_markup.inline_keyboard);
    return ultimo ? ultimo.opts.reply_markup.inline_keyboard[0][0].callback_data.replace('conf_si_', '') : null;
};
const escrituras = () => log.inserts.length + log.updates.length;
const OTRO_ADMIN = 6721336050;
// /start borra cualquier estado previo (p. ej. el modo chat IA que dejaron otras pruebas)
const pruebaLimpia = (nombre, fn) => prueba(nombre, async () => { await bot.procesarMensajeSync(msg(ADMIN, '/start')); reset(); await fn(); });

pruebaLimpia('ADMIN_IDS agrega a un admin extra sin quitar a los base', async () => {
    await bot.procesarMensajeSync(msg(OTRO_ADMIN, '/ping'));
    assert.match(ultimoTexto(), /Pong/);
    reset();
    await bot.procesarMensajeSync(msg(ADMIN, '/ping'));
    assert.match(ultimoTexto(), /Pong/);
});

pruebaLimpia('Registro rápido por texto: pide confirmación y NO escribe nada todavía', async () => {
    await bot.procesarMensajeSync(msg(ADMIN, 'Alcides 1250 tabacos y 3 cestas'));
    assert.match(ultimoTexto(), /Confirma el registro/);
    assert.match(ultimoTexto(), /Alcides Perez \(F11\)/);
    assert.ok(idConfirmacion(), 'debe traer botones Sí/Cancelar');
    assert.strictEqual(escrituras(), 0);
});

pruebaLimpia('Pulsar Cancelar: no se guarda nada', async () => {
    await bot.procesarMensajeSync(msg(ADMIN, 'Alcides 1250 tabacos y 3 cestas'));
    const id = idConfirmacion(); reset();
    await boton(ADMIN, `conf_no_${id}`);
    assert.match(log.ediciones[0].texto, /cancelado/);
    assert.strictEqual(escrituras(), 0);
});

pruebaLimpia('Pulsar Sí: registra; un segundo toque NO registra de nuevo', async () => {
    await bot.procesarMensajeSync(msg(ADMIN, 'Alcides 1250 tabacos y 3 cestas'));
    const id = idConfirmacion(); reset();
    await boton(ADMIN, `conf_si_${id}`);
    const tras1 = escrituras();
    assert.ok(tras1 > 0, 'debe escribir al confirmar');
    await boton(ADMIN, `conf_si_${id}`);
    assert.strictEqual(escrituras(), tras1, 'el doble toque no debe volver a escribir');
    assert.match(log.ediciones[log.ediciones.length - 1].texto, /ya no es válida/);
});

pruebaLimpia('Confirmación ajena o inventada: no registra', async () => {
    await boton(ADMIN, 'conf_si_zzzzzz');
    assert.strictEqual(escrituras(), 0);
    assert.match(log.ediciones[0].texto, /ya no es válida/);
});

pruebaLimpia('IA pide registrar: manda confirmación, NO escribe y no gasta segunda llamada al LLM', async () => {
    guionOllama = [{ message: { role: 'assistant', content: '', tool_calls: [{ function: { name: 'registrar_produccion', arguments: { nombre_o_codigo: 'F11', tabacos: '800', cestas: 0 } } }] } }];
    await bot.procesarMensajeSync(msg(ADMIN, 'F11 entregó 800 tabacos, 0 cestas'));
    assert.match(ultimoTexto(), /Confirma el registro/);
    assert.strictEqual(escrituras(), 0);
    assert.strictEqual(log.ollamaLlamadas.length, 1);
});

pruebaLimpia('Empleado inexistente: avisa y no pide confirmación', async () => {
    const guardado = tablas.empleados_fabriquines; tablas.empleados_fabriquines = [];
    await bot.procesarMensajeSync(msg(ADMIN, 'Zutano 100 tabacos'));
    tablas.empleados_fabriquines = guardado;
    assert.match(ultimoTexto(), /No encontré/);
    assert.strictEqual(escrituras(), 0);
});

pruebaLimpia('Texto libre fuera del modo chat: lo atiende la IA (ya no responde "No entendí")', async () => {
    guionOllama = [{ message: { role: 'assistant', content: 'Don Gonzalo Jaimes Bastos fundó Gato Negro' } }];
    await bot.procesarMensajeSync(msg(ADMIN, '¿Quién creó Gato Negro?'));
    assert.strictEqual(log.ollamaLlamadas.length, 1);
    assert.match(ultimoTexto(), /Don Gonzalo/);
    assert.ok(!log.enviados.some(e => /No entendí/.test(e.texto)));
});



pruebaLimpia('Modo chat IA: "Alcides 1250 tabacos y 3 cestas" va directo a confirmación, sin LLM', async () => {
    await boton(ADMIN, 'menu_ia'); reset();
    await bot.procesarMensajeSync(msg(ADMIN, 'Alcides 1250 tabacos y 3 cestas'));
    assert.match(ultimoTexto(), /Confirma el registro/);
    assert.strictEqual(log.ollamaLlamadas.length, 0, 'no debe consultar al LLM');
    assert.strictEqual(escrituras(), 0);
});

pruebaLimpia('Qwen escribe la llamada como texto "registrando_produccion({...})": se rescata y pide confirmación', async () => {
    guionOllama = [{ message: { role: 'assistant', content: 'registrando_produccion({"nombre_o_codigo": "F11", "tabacos": 1250, "cestas": 1, "esExtra": false})' } }];
    await bot.procesarMensajeSync(msg(ADMIN, '1 cesta devuelta'));
    assert.match(ultimoTexto(), /Confirma el registro/);
    assert.match(ultimoTexto(), /1 cestas|1.250/);
    assert.ok(!log.enviados.some(e => /registrando_produccion/.test(e.texto)), 'no debe mostrar la llamada cruda');
    assert.strictEqual(escrituras(), 0);
});

pruebaLimpia('Llamada cruda que no se puede rescatar: se oculta y NO dice que se procesó', async () => {
    guionOllama = [{ message: { role: 'assistant', content: 'hacer_magia({"a": 1})' } }];
    await bot.procesarMensajeSync(msg(ADMIN, 'haz algo raro'));
    assert.ok(!log.enviados.some(e => /hacer_magia/.test(e.texto)));
    assert.match(ultimoTexto(), /No se guardó nada/);
});

// ================== EJECUCIÓN ==================
(async () => {
    let ok = 0, fallos = 0;
    const silencio = console.log; const silencioW = console.warn; const silencioE = console.error;
    for (const p of pruebas) {
        reset();
        console.log = console.warn = console.error = () => {};
        try { await p.fn(); console.log = silencio; console.warn = silencioW; console.error = silencioE; ok++; console.log('  ✅', p.nombre); }
        catch (e) { console.log = silencio; console.warn = silencioW; console.error = silencioE; fallos++; console.log('  ❌', p.nombre, '\n      →', e.message.split('\n')[0]); }
    }
    console.log(`\n${ok} ok, ${fallos} con fallos`);
    process.exit(fallos ? 1 : 0);
})();
