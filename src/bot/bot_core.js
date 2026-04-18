const TelegramBot = require('node-telegram-bot-api');
const { supabase, obtenerHoraColombia } = require('../lib/shared');
const { GoogleGenAI } = require('@google/genai');
const menus = require('./handlers/menu_handlers');
const GatoNegroPDF = require('../lib/pdf_gen');

// ============================================================
// 🔧 CONFIGURACIÓN Y VALIDACIÓN DE VARIABLES DE ENTORNO
// ============================================================
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

console.log('🔍 Diagnóstico Bot: TELEGRAM_TOKEN =', TELEGRAM_TOKEN ? '✅ Cargado (...' + TELEGRAM_TOKEN.slice(-4) + ')' : '❌ NO ENCONTRADO');
console.log('🔍 Diagnóstico Bot: GEMINI_API_KEY =', GEMINI_API_KEY ? '✅ Cargada' : '❌ NO ENCONTRADA');

if (!TELEGRAM_TOKEN) {
    console.warn('⚠️ ADVERTENCIA: No se encontró TELEGRAM_TOKEN en process.env. El bot de Telegram estará desactivado.');
}
if (!GEMINI_API_KEY) {
    console.warn('⚠️ ADVERTENCIA: No se encontró GEMINI_API_KEY. Las funciones de IA estarán desactivadas.');
}

// Nota: Supabase y obtenerHoraColombia ya vienen de ../lib/shared

// ============================================================
// 🛡️ LISTA BLANCA DE ADMINISTRADORES
// ============================================================
const ADMIN_LIST = [
    8589883684, // Gonzalo
];

// ============================================================
// 🧠 MEMORIA DE ESTADOS (CONTEXTO DE USUARIO)
// ============================================================
const userStates = {}; 
// Estructura: { userId: { state: 'WAITING_MTTO', machineName: 'Saranda', lastMsgId: 123 } }

// ============================================================
// 🧠 CLIENTE DE GEMINI
// ============================================================
let ai = null;
if (GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

// ============================================================
// 🤖 BOT DE TELEGRAM
// ============================================================
let bot = null;
if (TELEGRAM_TOKEN) {
    // Detectamos si estamos en Vercel o localmente
    // Forzamos Polling si estamos en Windows (PC Local) o si no es producción
    const esVercelReal = (process.env.VERCEL === '1' || !!process.env.VERCEL) && process.env.NODE_ENV === 'production';
    const esLocal = !esVercelReal || process.platform === 'win32'; 
    
    // Si es local, usamos Polling: true (Escucha activa)
    bot = new TelegramBot(TELEGRAM_TOKEN, { polling: esLocal }); 
    
    if (esLocal) {
        console.log('🚀 Black Cat Agent (BCA) configurado para modo POLLING (Local)...');
    } else {
        console.log('🚀 Black Cat Agent (BCA) configurado para modo WEBHOOK (Vercel)...');
    }
} else {
    // Objeto ficticio para evitar errores de referencia en otros archivos
    bot = {
        processUpdate: () => console.warn('🤖 Bot desactivado: No se puede procesar actualización sin Token.'),
        sendMessage: () => console.warn('🤖 Bot desactivado: No se puede enviar mensaje sin Token.'),
        sendChatAction: () => {},
        on: () => {}
    };
}



function esAdmin(userId) {
    // Si la lista está vacía, todos pueden entrar (modo desarrollo)
    if (ADMIN_LIST.length === 0) return true;
    return ADMIN_LIST.includes(userId);
}

// ============================================================
// 🔧 HERRAMIENTAS QUE GEMINI PUEDE INVOCAR (Function Calling)
// ============================================================

/**
 * Busca deudas de un empleado por nombre o código.
 * Soporta búsqueda parcial: "alcides" encuentra "Alcides Perez"
 */
async function consultarDeudaEmpleado({ nombre_o_codigo }) {
    try {
        const termino = nombre_o_codigo.trim().toUpperCase();

        // Intentar por código exacto (ej: "F11")
        let { data: emp } = await supabase
            .from('empleados_fabriquines')
            .select('*')
            .eq('codigo', termino)
            .single();

        // Si no encontró por código, intentar por nombre parcial
        if (!emp) {
            const { data: porNombre } = await supabase
                .from('empleados_fabriquines')
                .select('*')
                .ilike('nombre', `%${nombre_o_codigo.trim()}%`);

            if (!porNombre || porNombre.length === 0) {
                return { encontrado: false, mensaje: `No encontré a ningún empleado con "${nombre_o_codigo}".` };
            }
            if (porNombre.length > 1) {
                const lista = porNombre.map(e => `${e.codigo} - ${e.nombre}`).join('\n');
                return { encontrado: false, multiple: true, mensaje: `Encontré varios empleados:\n${lista}\n¿Cuál de estos?` };
            }
            emp = porNombre[0];
        }

        // Buscar préstamos activos (deuda en pesos)
        const { data: prestamos } = await supabase
            .from('prestamos_fabriquines')
            .select('saldo_pendiente')
            .eq('empleado_id', emp.id)
            .eq('estado', 'activo');

        let deudaPesos = 0;
        if (prestamos) prestamos.forEach(p => deudaPesos += parseFloat(p.saldo_pendiente || 0));

        return {
            encontrado: true,
            nombre: emp.nombre,
            codigo: emp.codigo,
            deuda_tabacos: emp.deuda_tabacos || 0,
            deuda_pesos: deudaPesos,
        };
    } catch (e) {
        return { error: true, mensaje: `Error al consultar: ${e.message}` };
    }
}

/**
 * Lista todos los empleados que tienen deudas pendientes.
 */
async function listarTodosLosDeudores() {
    try {
        const { data: empleados } = await supabase
            .from('empleados_fabriquines')
            .select('*, prestamos_fabriquines(saldo_pendiente, estado)')
            .order('nombre');

        if (!empleados) return { error: true, mensaje: 'No se pudo consultar la base de datos.' };

        const conDeuda = empleados.filter(emp => {
            const deudaTab = emp.deuda_tabacos > 0;
            const deudaPrestamo = (emp.prestamos_fabriquines || [])
                .filter(p => p.estado === 'activo')
                .reduce((sum, p) => sum + parseFloat(p.saldo_pendiente || 0), 0) > 0;
            return deudaTab || deudaPrestamo;
        });

        if (conDeuda.length === 0) return { deudores: [], mensaje: '¡Nadie debe nada! Todos están al día.' };

        const lista = conDeuda.map(emp => {
            const pesos = (emp.prestamos_fabriquines || [])
                .filter(p => p.estado === 'activo')
                .reduce((sum, p) => sum + parseFloat(p.saldo_pendiente || 0), 0);
            return { codigo: emp.codigo, nombre: emp.nombre, tabacos: emp.deuda_tabacos || 0, pesos };
        });

        return { deudores: lista };
    } catch (e) {
        return { error: true, mensaje: e.message };
    }
}

/**
 * Consulta el estado de la maquinaria de la fábrica.
 */
async function consultarMaquinaria() {
    try {
        const { data: maquinas } = await supabase.from('maquinas').select('*');
        if (!maquinas) return { error: true, mensaje: 'No hay datos de maquinaria.' };

        let funcionales = 0, conFallas = 0, urgentes = [];
        const hoy = new Date();

        maquinas.forEach(m => {
            if (m.estado === 'Funcional') funcionales++;
            else conFallas++;

            if (m.ultimo_mtto) {
                const last = new Date(m.ultimo_mtto + 'T00:00:00');
                const dias = Math.floor((hoy - last) / (1000 * 60 * 60 * 24));
                if (dias >= (m.frecuencia_mtto_dias || 30)) urgentes.push(m.nombre);
            }
        });

        return { funcionales, con_fallas: conFallas, mantenimientos_urgentes: urgentes };
    } catch (e) {
        return { error: true, mensaje: e.message };
    }
}

/**
 * Consulta la producción de tabacos en un rango de días (por defecto 7 días = esta semana).
 */
async function consultarProduccion({ dias = 7 } = {}) {
    try {
        const fechaDesde = new Date();
        fechaDesde.setDate(fechaDesde.getDate() - dias);
        const fechaStr = fechaDesde.toISOString().split('T')[0];

        const { data: registros } = await supabase
            .from('recepcion_diaria')
            .select('lun_tabacos, mar_tabacos, mie_tabacos, jue_tabacos, vie_tabacos, sab_tabacos, extra_tabacos, semana_inicio')
            .gte('semana_inicio', fechaStr);

        if (!registros || registros.length === 0) {
            return { total: 0, dias_consultados: dias, mensaje: `No hay registros de producción en los últimos ${dias} días.` };
        }

        let total = 0;
        registros.forEach(r => {
            total += (r.lun_tabacos || 0) + (r.mar_tabacos || 0) + (r.mie_tabacos || 0)
                   + (r.jue_tabacos || 0) + (r.vie_tabacos || 0) + (r.sab_tabacos || 0)
                   + (r.extra_tabacos || 0);
        });

        return { total, dias_consultados: dias, registros_encontrados: registros.length };
    } catch (e) {
        return { error: true, mensaje: e.message };
    }
}

/**
 * Lista empleados con deudas de tabacos pendientes.
 */
async function listarPendientesTabacos() {
    try {
        const { data: empleados } = await supabase
            .from('empleados_fabriquines')
            .select('*')
            .gt('deuda_tabacos', 0)
            .order('nombre');

        if (!empleados || empleados.length === 0) return '✅ No hay deudas de tabacos pendientes. ¡Miau!';

        let lista = '🧺 *Deudas de Tabacos Pendientes:*\n\n';
        empleados.forEach(e => {
            lista += `👤 *${e.nombre}* (${e.codigo}): \`${e.deuda_tabacos.toLocaleString('es-CO')} u\`\n`;
        });
        return lista;
    } catch (e) {
        return '❌ Error al consultar pendientes: ' + e.message;
    }
}

/**
 * Lista las últimas 10 entregas de material.
 */
async function listarUltimasEntregas() {
    try {
        const { data: entregas } = await supabase
            .from('despachos_registro')
            .select('*, empleados_fabriquines(nombre, codigo)')
            .order('id', { ascending: false })
            .limit(10);

        if (!entregas || entregas.length === 0) return '📦 No hay registros de entregas recientes.';

        let lista = '🚚 *Últimas 10 Entregas de Material:*\n\n';
        entregas.forEach(d => {
            const emp = d.empleados_fabriquines || { nombre: 'Desconocido', codigo: '?' };
            lista += `📅 *${d.fecha}*: ${emp.nombre} (${emp.codigo})\n`;
            lista += `   - Tabacos: \`${d.meta_tabacos} u\` | Capa: \`${d.capa_kg} Kg\`\n`;
            lista += `   - Capote: \`${d.capote_kg} Kg\` | Picadura: \`${d.picadura_kg} Kg\`\n\n`;
        });
        return lista;
    } catch (e) {
        return '❌ Error al consultar entregas: ' + e.message;
    }
}


/**
 * Helper para obtener fecha, hora y columna de día en Colombia (UTC-5)
 */
function obtenerFechaHoraColombia() {
    const ahora = new Date();
    const opcionesFecha = { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' };
    const opcionesHora = { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', hour12: false };
    const fecha = new Intl.DateTimeFormat('en-CA', opcionesFecha).format(ahora); 
    const hora = new Intl.DateTimeFormat('es-CO', opcionesHora).format(ahora); 
    
    // Obtener día de la semana para mapear a la columna de la DB (lun, mar, mie, jue, vie, sab)
    const diaSemanaShort = new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', weekday: 'short' }).format(ahora).toLowerCase();
    const diaLimpio = diaSemanaShort.replace('.', '').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    const mapping = { 'lun': 'lun', 'mar': 'mar', 'mie': 'mie', 'jue': 'jue', 'vie': 'vie', 'sab': 'sab', 'sáb': 'sab' };
    const columna = mapping[diaLimpio] || 'extra';
    
    return { fecha, hora, columna };
}

/**
 * Registra producción de forma rápida desde texto natural.
 * Ahora soporta el flag 'esExtra' para sumar a extra_tabacos.
 */
async function registrarProduccionRapida(nombre_o_codigo, tabacos, cestas = 0, color_cesta = null, esExtra = false) {
    try {
        const empRes = await consultarDeudaEmpleado({ nombre_o_codigo });
        if (!empRes.encontrado) return empRes.mensaje;
        
        // Buscar el empleado real en la DB para tener el ID
        const { data: emp } = await supabase.from('empleados_fabriquines').select('*').eq('id', (await supabase.from('empleados_fabriquines').select('id').eq('codigo', empRes.codigo).single()).data.id).single();
        if (!emp) return `❌ No se pudo encontrar el ID del empleado ${empRes.codigo}.`;

        const tiempo = obtenerFechaHoraColombia();
        
        // 1. Validar que tenga una entrega/recepción pendiente para esta semana
        let { data: reg } = await supabase
            .from('recepcion_diaria')
            .select('*')
            .eq('empleado_id', emp.id)
            .eq('estado', 'pendiente')
            .order('id', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (!reg) {
            return `⚠️ *No se puede registrar:* ${emp.nombre} no tiene una entrega o despacho activo para esta semana. Primero debes hacer el despacho en el sistema web.`;
        }

        let updatedData = {};
        let msgDetalle = "";

        if (esExtra) {
            // Caso Tabacos Extras (Ventas)
            updatedData['extra_tabacos'] = (reg.extra_tabacos || 0) + tabacos;
            msgDetalle = `sumado a *Tabacos Extras* (Venta Directa)`;
        } else {
            // Caso Tabacos de Tarea (Día de la semana)
            const colTabacos = `${tiempo.columna}_tabacos`;
            updatedData[colTabacos] = (reg[colTabacos] || 0) + tabacos;
            msgDetalle = `sumado al día *${tiempo.columna}*`;
        }

        // Siempre sumar cestas si vienen en el mensaje al día correspondiente
        if (cestas > 0) {
            const colCestas = `${tiempo.columna}_cestas`;
            updatedData[colCestas] = (reg[colCestas] || 0) + cestas;
        }

        // Ejecutar actualización en recepcion_diaria
        await supabase.from('recepcion_diaria').update(updatedData).eq('id', reg.id);

        // 2. Actualizar Inventario (Tabacos o Tabacos Extras)
        const materialInv = esExtra ? 'Tabacos Extras (Ventas)' : 'Tabacos';
        const categoriaInv = esExtra ? 'Producto Terminado' : 'En Proceso';
        
        const { data: invTab } = await supabase.from('inventario').select('*').eq('material', materialInv).maybeSingle();
        if (invTab) {
            await supabase.from('inventario').update({ cantidad: invTab.cantidad + tabacos }).eq('id', invTab.id);
        } else {
            await supabase.from('inventario').insert([{ material: materialInv, cantidad: tabacos, categoria: categoriaInv }]);
        }

        await supabase.from('movimientos').insert([{
            fecha: tiempo.fecha, hora: tiempo.hora, tipo_movimiento: 'ENTRADA', material: materialInv, cantidad: tabacos, usuario: 'Bot',
            descripcion: `Registro Rápido ${esExtra ? '(EXTRA)' : ''}: ${emp.codigo} - ${emp.nombre}`
        }]);

        // 3. Actualizar Inventario (Cestas)
        if (cestas > 0) {
            let colorFinal = color_cesta ? `Cestas ${color_cesta}` : 'Cestas';
            const { data: invCest } = await supabase.from('inventario').select('*').ilike('material', `%${colorFinal}%`).limit(1).maybeSingle();
            if (invCest) {
                await supabase.from('inventario').update({ cantidad: invCest.cantidad + cestas }).eq('id', invCest.id);
                await supabase.from('movimientos').insert([{
                    fecha: tiempo.fecha, hora: tiempo.hora, tipo_movimiento: 'ENTRADA', material: invCest.material, cantidad: cestas, usuario: 'Bot',
                    descripcion: `Retorno Rápido: ${emp.codigo}`
                }]);
            }
        }

        return `✅ *Registro Exitoso*\n👤 Empleado: *${emp.nombre} (${emp.codigo})*\n📈 *+${tabacos.toLocaleString('es-CO')} u* ${msgDetalle}${cestas > 0 ? ` y *+${cestas}* cestas` : ''}.`;
    } catch (e) {
        return '❌ Error al registrar producción: ' + e.message;
    }
}



// ============================================================
// 🧠 DECLARACIÓN DE HERRAMIENTAS PARA GEMINI
// ============================================================
const herramientas = [
    {
        name: 'consultar_deuda_empleado',
        description: 'Consulta la deuda de un empleado específico por su nombre o código. Usar cuando el usuario pregunta por una persona en particular, ej: "¿cuánto debe Alcides?", "deuda de F11", "José me debe?"',
        parameters: {
            type: 'object',
            properties: {
                nombre_o_codigo: {
                    type: 'string',
                    description: 'Nombre parcial o código del empleado (ej: "Alcides", "Jose", "F11", "F22")'
                }
            },
            required: ['nombre_o_codigo']
        }
    },
    {
        name: 'listar_todos_los_deudores',
        description: 'Lista todos los empleados que tienen deudas pendientes (tabacos o pesos). Usar cuando el usuario pregunta "¿quiénes me deben?", "lista de deudores", "todos los que deben".',
        parameters: { type: 'object', properties: {} }
    },
    {
        name: 'consultar_maquinaria',
        description: 'Muestra el estado actual de la maquinaria de la fábrica: cuántas están operativas, con fallas, y cuáles necesitan mantenimiento urgente.',
        parameters: { type: 'object', properties: {} }
    },
    {
        name: 'consultar_produccion',
        description: 'Consulta cuántos tabacos se han fabricado en un período dado. Usar para preguntas como "¿cuánto se hizo esta semana?", "producción del mes", "qué tanto producimos".',
        parameters: {
            type: 'object',
            properties: {
                dias: {
                    type: 'number',
                    description: 'Número de días hacia atrás para consultar. 7 = esta semana, 30 = este mes, 1 = hoy.'
                }
            }
        }
    }
];

// ============================================================
// 💬 HISTORIAL DE CONVERSACIÓN POR CHAT (para que recuerde contexto)
// ============================================================
const conversaciones = {}; // { chatId: [ {role, parts}, ... ] }

const SYSTEM_PROMPT = `Eres el "Black Cat Agent (BCA)", el asistente inteligente de la Fábrica de Tabacos Gato Negro, en Colombia.
Tu personalidad es profesional pero cercana, usas un tono cálido y colombiano. Eres el asistente de Gonzalo Jaimes, el dueño.

TUS REGLAS:
1. Responde SIEMPRE en español.
2. Cuando necesites datos de la fábrica (deudas, máquinas, producción), usa las herramientas disponibles. NO inventes números.
3. Sé conciso. No escribas párrafos largos si no hace falta.
4. Usa emojis con moderación para dar carácter a tus respuestas.
5. Si te preguntan algo que no tiene que ver con la fábrica, puedes charlar brevemente pero recuerda tu misión.
6. Los tabacos se miden en "unidades" (u) y el dinero en pesos colombianos (COP).
7. Cuando "Alcides", "José", "F11" etc. aparecen en el contexto de deuda, busca al empleado.`;

// ============================================================
// 🔄 EJECUTAR LA HERRAMIENTA QUE GEMINI PIDIÓ
// ============================================================
async function ejecutarHerramienta(nombre, args) {
    console.log(`🔧 Gemini invocó herramienta: ${nombre}`, JSON.stringify(args));
    switch (nombre) {
        case 'consultar_deuda_empleado':    return await consultarDeudaEmpleado(args);
        case 'listar_todos_los_deudores':   return await listarTodosLosDeudores();
        case 'consultar_maquinaria':        return await consultarMaquinaria();
        case 'consultar_produccion':        return await consultarProduccion(args);
        default:                            return { error: `Herramienta desconocida: ${nombre}` };
    }
}

// ============================================================
// 🤖 PROCESAR MENSAJE CON GEMINI (con Function Calling)
// ============================================================
async function responderConGemini(chatId, textoUsuario) {
    // Inicializar historial si no existe
    if (!conversaciones[chatId]) {
        conversaciones[chatId] = [];
    }

    // Agregar mensaje del usuario al historial
    conversaciones[chatId].push({
        role: 'user',
        parts: [{ text: textoUsuario }]
    });

    // Limitar historial a últimas 20 interacciones para no gastar tokens
    if (conversaciones[chatId].length > 20) {
        conversaciones[chatId] = conversaciones[chatId].slice(-20);
    }

    try {
        // Llamar a Gemini con el historial y las herramientas
        let respuesta = await ai.models.generateContent({
            model: 'gemini-2.0-flash-lite',
            systemInstruction: SYSTEM_PROMPT,
            contents: conversaciones[chatId],
            tools: [{ functionDeclarations: herramientas }],
        });

        // Bucle de Function Calling (Gemini puede pedir varias herramientas)
        let iteraciones = 0;
        while (iteraciones < 5) {
            iteraciones++;

            const candidate = respuesta.candidates?.[0];
            if (!candidate) break;

            const partes = candidate.content?.parts || [];
            const llamadas = partes.filter(p => p.functionCall);

            // Si Gemini no pidió ninguna herramienta, salir del bucle
            if (llamadas.length === 0) break;

            // Agregar la respuesta de Gemini (con las llamadas) al historial
            conversaciones[chatId].push({
                role: 'model',
                parts: partes
            });

            // Ejecutar cada herramienta y recopilar resultados
            const resultados = [];
            for (const parte of llamadas) {
                const resultado = await ejecutarHerramienta(
                    parte.functionCall.name,
                    parte.functionCall.args || {}
                );
                resultados.push({
                    functionResponse: {
                        name: parte.functionCall.name,
                        response: resultado
                    }
                });
            }

            // Agregar los resultados al historial
            conversaciones[chatId].push({
                role: 'user',
                parts: resultados
            });

            // Pedir a Gemini que formule la respuesta final con los datos
            respuesta = await ai.models.generateContent({
                model: 'gemini-2.0-flash-lite',
                systemInstruction: SYSTEM_PROMPT,
                contents: conversaciones[chatId],
                tools: [{ functionDeclarations: herramientas }],
            }).catch(err => {
                if (!err.message.includes('message is not modified')) {
                    console.error("Error en editMessageText:", err.message);
                }
            });
        }

        // Extraer el texto final de Gemini
        const textoFinal = respuesta.candidates?.[0]?.content?.parts
            ?.filter(p => p.text)
            ?.map(p => p.text)
            ?.join('') || '🐾 No supe qué responder. Intenta de nuevo.';

        // Agregar respuesta de Gemini al historial
        conversaciones[chatId].push({
            role: 'model',
            parts: [{ text: textoFinal }]
        });

        return textoFinal;

    } catch (e) {
        console.error('❌ Error con Gemini:', e.message);
        if (e.message.includes('API_KEY') || e.message.includes('401')) {
            return '__ERROR_APIKEY__';
        }
        if (e.message.includes('429') || e.message.includes('RESOURCE_EXHAUSTED') || e.message.includes('quota')) {
            return '__ERROR_QUOTA__';
        }
        return '__ERROR_GENERAL__';
    }
}

// ============================================================
// 📨 PROCESAMIENTO DE MENSAJES DE TELEGRAM
// ============================================================
async function procesarMensajeSync(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const fromUser = msg.from.first_name || 'Patrón';
    const text = msg.text || '';

    // Evitar procesar si el bot no está inicializado (Mock)
    if (!process.env.TELEGRAM_TOKEN) {
        console.warn("⚠️ Bot ignorando mensaje: Token no configurado.");
        return;
    }

    try {
        console.log(`📩 [MENSAJE RECIBIDO] De: ${fromUser} (${userId}) | Texto: "${text}"`);

        // 0. Filtro de Seguridad
        if (!esAdmin(userId)) {
            console.log(`⛔ Usuario no autorizado: ${userId}`);
            bot.sendMessage(chatId, `🐾 *Miau...* No hablo con desconocidos. Tu ID es \`${userId}\`. Pídele a Gonzalo que te agregue.`, { parse_mode: 'Markdown' });
            return;
        }

        // 1. Comando /id  – siempre responder sin IA
        if (text === '/id') {
            bot.sendMessage(chatId, `🔑 Tu ID de Telegram es: \`${userId}\``, { parse_mode: 'Markdown' });
            return;
        }

        // 1. Manejo de Comandos Manuales
        const saludos = ['hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'que tal', 'hey'];
        const esSaludo = saludos.some(s => text.toLowerCase().startsWith(s));

        if (text === '/start' || esSaludo) {
            userStates[userId] = null; // Limpiar estado al iniciar
            bot.sendChatAction(chatId, 'typing');
            bot.sendMessage(chatId,
                `🐾 *¡Hola, ${fromUser}!* Bienvenido al centro de control de Gato Negro.\n\n` +
                `He preparado un menú táctil para que navegues más fácil. ¿Qué deseas revisar hoy?`,
                { 
                    parse_mode: 'Markdown',
                    reply_markup: menus.mainKeyboard 
                });
            return;
        }

        // 2. Manejo de Estados (Memoria Contextual)
        const estadoActual = userStates[userId];

        if (estadoActual && estadoActual.state === 'ESPERANDO_MTTO') {
            const reporte = text;
            const maquina = estadoActual.machineName;
            const tiempo = obtenerHoraColombia();

            bot.sendChatAction(chatId, 'typing');
            
            // Guardar en Supabase
            const { error } = await supabase.from('mantenimiento').insert([{
                fecha: tiempo.fecha,
                hora: tiempo.hora,
                maquina: maquina,
                tipo: 'Correctivo/Ajuste',
                descripcion: reporte,
                hecho_por: fromUser,
                estado: 'REALIZADO'
            }]);

            if (error) {
                console.error("Error guardando mtto desde bot:", error);
                bot.sendMessage(chatId, "❌ Hubo un error al guardar tu reporte. Intenta de nuevo.");
            } else {
                bot.sendMessage(chatId, `✅ *Reporte Guardado*\n\nSe ha registrado el mantenimiento para la máquina: *${maquina}*.\n\nDetalle: "${reporte}"`, {
                    parse_mode: 'Markdown',
                    reply_markup: menus.backToMaquinasKeyboard
                });
            }

            userStates[userId] = null; // Limpiar estado tras éxito
            return;
        }

        if (estadoActual && estadoActual.state === 'CHAT_IA') {
            // Lógica de IA solo si está en este modo
            if (!ai) {
                bot.sendMessage(chatId, "⚠️ La IA está desactivada o sin cuota. Usa los botones.");
                return;
            }
            // ... (Lógica de Gemini existente)
        }

        // 3. Si no hay estado y no es comando, ignoramos o pedimos usar menú
        // Para evitar el mensaje molesto de "IA ocupada"
        if (!text.startsWith('/')) {
            console.log(`ℹ️ Texto ignorado (Sin contexto): "${text}"`);
            // Nota: Podríamos enviar un mensaje de "Usa el menú", pero suele ser molesto.
            // Mejor solo responder si el usuario explícitamente entró a una sección.
            return;
        }

        // Comando /ayuda (alias de /start)
        if (text === '/ayuda') {
            bot.sendChatAction(chatId, 'typing');
            const msgAyuda = `🐾 *Comandos Disponibles:*\n\n/pendientes - Ver deudores\n/entregas - Últimos despachos\n/maquinas - Estado planta\n/deuda [COD] - Ver deuda específica\n/id - Ver tu ID\n/ping - Test de vida`;
            bot.sendMessage(chatId, msgAyuda, { parse_mode: 'Markdown' });
            return;
        }

        // 3. Comando /ping – test rápido
        if (text === '/ping') {
            bot.sendMessage(chatId, '😼 *¡Pong!* Estoy vivo y conectado a Gato Negro.', { parse_mode: 'Markdown' });
            return;
        }

        // --- NUEVOS COMANDOS OPERATIVOS ---
        
        // A. Ver deudores de tabaco
        if (text === '/pendientes') {
            bot.sendChatAction(chatId, 'typing');
            try {
                const respuesta = await listarPendientesTabacos();
                bot.sendMessage(chatId, respuesta, { parse_mode: 'Markdown' });
            } catch (err) {
                bot.sendMessage(chatId, "❌ Error al listar pendientes. Revisa los logs.");
            }
            return;
        }

        // B. Ver últimas entregas
        if (text === '/entregas') {
            bot.sendChatAction(chatId, 'typing');
            const respuesta = await listarUltimasEntregas();
            bot.sendMessage(chatId, respuesta, { parse_mode: 'Markdown' });
            return;
        }

        // C. Registro rápido de producción (Texto Natural)
        const regexProd = /^([A-Z0-9]{3}|[a-zA-Z\s]{3,})\s+(\d+)\s+tabacos(?:\s+(extra))?(?:\s*(?:y|,|)\s*(\d+)\s+cestas(?:\s+([\w\s]+))?)?$/i;
        const match = text.trim().match(regexProd);
        if (match) {
            bot.sendChatAction(chatId, 'typing');
            const nombreCod = match[1].trim();
            const tabacos = parseInt(match[2]);
            const esExtra = !!match[3];
            const cestas = match[4] ? parseInt(match[4]) : 0;
            const color = match[5] ? match[5].trim() : null;
            
            const respuesta = await registrarProduccionRapida(nombreCod, tabacos, cestas, color, esExtra);
            bot.sendMessage(chatId, respuesta, { parse_mode: 'Markdown' });
            return;
        }

        // 4. Comando /maquinas
        if (text === '/maquinas' || text === '/reporte') {
            bot.sendChatAction(chatId, 'typing');
            try {
                const { data: maquinas } = await supabase.from('maquinas').select('*');
                if (!maquinas || maquinas.length === 0) {
                    bot.sendMessage(chatId, '⚙️ No hay datos de maquinaria.');
                    return;
                }
                let funcionales = 0, fallas = 0, urgentes = [];
                const hoy = new Date();
                maquinas.forEach(m => {
                    if (m.estado === 'Funcional') funcionales++;
                    else fallas++;
                    if (m.ultimo_mtto) {
                        const last = new Date(m.ultimo_mtto + 'T00:00:00');
                        const dias = Math.floor((hoy - last) / (1000 * 60 * 60 * 24));
                        if (dias >= (m.frecuencia_mtto_dias || 30)) urgentes.push(m.nombre);
                    }
                });
                let resp = `⚙️ *Estado de Maquinaria:*\n✅ Operacionales: ${funcionales}\n⚠️ Con fallas: ${fallas}\n\n`;
                resp += urgentes.length > 0 ? `🚨 *Pendientes:* ${urgentes.join(', ')}` : `✨ Todo al día.`;
                bot.sendMessage(chatId, resp, { parse_mode: 'Markdown' });
            } catch (e) {
                bot.sendMessage(chatId, '❌ Error en maquinaria: ' + e.message);
            }
            return;
        }

        // 5. Comando /deuda [codigo]
        if (text.startsWith('/deuda')) {
            bot.sendChatAction(chatId, 'typing');
            const partes = text.trim().split(/\s+/);
            const codigo = partes[1] ? partes[1].toUpperCase() : null;
            if (!codigo) {
                bot.sendMessage(chatId, '⚠️ Usa: `/deuda F11`', { parse_mode: 'Markdown' });
                return;
            }
            try {
                const { data: emp } = await supabase.from('empleados_fabriquines').select('*').eq('codigo', codigo).single();
                if (!emp) {
                    bot.sendMessage(chatId, `❌ No encontré al empleado *${codigo}*.`);
                    return;
                }
                const { data: p } = await supabase.from('prestamos_fabriquines').select('saldo_pendiente').eq('empleado_id', emp.id).eq('estado', 'activo');
                let dP = 0; if (p) p.forEach(x => dP += parseFloat(x.saldo_pendiente || 0));
                bot.sendMessage(chatId, `👤 *${emp.nombre}*\n🧺 Tabacos: *${emp.deuda_tabacos}*\n💵 Pesos: *$${dP.toLocaleString()}*`, { parse_mode: 'Markdown' });
            } catch (e) {
                bot.sendMessage(chatId, '❌ Error en deuda: ' + e.message);
            }
            return;
        }

        // 6. Todo lo demás → Gemini
        bot.sendChatAction(chatId, 'typing');
        try {
            const respuestaIA = await responderConGemini(chatId, text);
            if (respuestaIA.startsWith('__ERROR')) {
                bot.sendMessage(chatId, "⚠️ La IA está ocupada o sin cuota, pero puedes usar los comandos directos como /pendientes.");
            } else {
                bot.sendMessage(chatId, respuestaIA, { parse_mode: 'Markdown' }).catch(() => bot.sendMessage(chatId, respuestaIA));
            }
        } catch (iaErr) {
            bot.sendMessage(chatId, "❌ Error al procesar con IA. Intenta con comandos directos.");
        }

    } catch (globalErr) {
        console.error("❌ CRASH EVITADO en bot.on('message'):", globalErr);
        // Intentamos avisar al usuario si es posible
        try { bot.sendMessage(chatId, "🐾 *Miau...* Tuve un error interno inesperado. Por favor, intenta de nuevo en un momento."); } catch(err) {}
    }
}

// Escuchar en entorno local (Long Polling)
bot.on('message', procesarMensajeSync);

// ============================================================
// ⚠️ MANEJO DE ERRORES DE POLLING (con auto-recuperación)
// ============================================================
bot.on('polling_error', (error) => {
    console.error('❌ Error de polling:', error.message);
});

process.on('unhandledRejection', (reason) => {
    console.error('⚠️ Error no manejado:', reason?.message || reason);
});

// ============================================================
// 🖱️ MANEJO DE BOTONES (CALLBACK QUERIES)
// ============================================================
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const data = query.data;

    try {
        // A. MENÚ PRINCIPAL
        if (data === 'menu_principal') {
            await bot.editMessageText(`🐾 *Menú Principal*\nSelecciona una opción:`, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: menus.mainKeyboard
            }).catch(err => {
                if (!err.message.includes('message is not modified')) {
                    console.error("Error en editMessageText:", err.message);
                }
            });
        }

        // B. CATÁLOGO DE MAQUINARIA
        if (data === 'menu_maquinas') {
            const kb = await menus.getMaquinasKeyboard();
            await bot.editMessageText(`⚙️ *Catálogo de Maquinaria*\nSelecciona una máquina para ver detalles:`, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: kb
            }).catch(err => {
                if (!err.message.includes('message is not modified')) {
                    console.error("Error en editMessageText:", err.message);
                }
            });
        }

        // C. DETALLE DE MÁQUINA
        if (data.startsWith('maquina_ver_')) {
            const id = data.replace('maquina_ver_', '');
            const { data: m } = await supabase.from('maquinas').select('*').eq('id', id).single();
            
            if (m) {
                let texto = `🏗️ *${m.nombre}*\n\n`;
                texto += `📍 Área: ${m.area || 'N/A'}\n`;
                texto += `🏷️ Marca: ${m.marca || 'N/A'}\n`;
                texto += `📟 Código: \`${m.codigo || 'S/N'}\`\n`;
                texto += `🔔 Estado: ${m.estado === 'Funcional' ? '✅ Operativa' : '⚠️ En Falla'}\n`;
                
                await bot.editMessageText(texto, {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                    reply_markup: menus.getAccionesMaquina(id)
                });
            }
        }

        // D. MENÚ FABRIQUINES
        if (data === 'menu_fabriquines') {
            await bot.editMessageText(`🧺 *Gestión de Fabriquines*\n¿Qué deseas hacer hoy?`, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: menus.fabriquinesKeyboard
            }).catch(err => {
                if (!err.message.includes('message is not modified')) {
                    console.error("Error en editMessageText:", err.message);
                }
            });
        }

        // E. ACCIONES FABRIQUINES
        if (data === 'fab_deudores') {
            const txt = await listarPendientesTabacos();
            await bot.editMessageText(txt, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: menus.backToFabKeyboard
            }).catch(err => {
                if (!err.message.includes('message is not modified')) {
                    console.error("Error en editMessageText:", err.message);
                }
            });
        }
        if (data === 'fab_entregas') {
            const txt = await listarUltimasEntregas();
            await bot.editMessageText(txt, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: menus.backToFabKeyboard
            }).catch(err => {
                if (!err.message.includes('message is not modified')) {
                    console.error("Error en editMessageText:", err.message);
                }
            });
        }
        if (data === 'fab_pdf_request') {
            try {
                // Buscamos el último despacho/factura disponible para pruebas
                const { data: d } = await supabase.from('despachos_registro')
                    .select('*, empleados_fabriquines(*)')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (!d) {
                    await bot.sendMessage(chatId, "❌ No encontré facturas registradas para tu usuario.");
                    return;
                }

                // Generar el Buffer del PDF
                const pdfData = {
                    id: d.id,
                    fecha: d.fecha,
                    empleado_nombre: d.empleados_fabriquines.nombre,
                    empleado_codigo: d.empleados_fabriquines.codigo,
                    total_tabacos: d.meta_tabacos,
                    total_ganado: (d.meta_tabacos * 12).toLocaleString('es-CO'),
                    deuda_tabacos: d.empleados_fabriquines.deuda_tabacos,
                    deuda_dinero: (d.empleados_fabriquines.deuda_dinero || 0).toLocaleString('es-CO'),
                    produccion: d.detalles_diarios || {}
                };

                const buffer = await GatoNegroPDF.generarFactura(pdfData);

                // Enviar el documento
                await bot.sendDocument(chatId, buffer, {
                    caption: `📄 *Factura Semanal - Gato Negro*\n\nAquí tienes tu comprobante de producción.`,
                    parse_mode: 'Markdown'
                }, {
                    filename: `Factura_GN_${d.id}.pdf`,
                    contentType: 'application/pdf'
                });

                // Enviar un pequeño mensaje de navegación después del PDF
                await bot.sendMessage(chatId, "✅ *Documento enviado con éxito.* ¿Deseas hacer algo más?", {
                    parse_mode: 'Markdown',
                    reply_markup: menus.mainKeyboard
                });

            } catch (err) {
                console.error("Error al procesar PDF en el bot:", err);
                bot.answerCallbackQuery(query.id, { text: "❌ Error al generar PDF." });
            }
        }

        // F. ACCIONES MÁQUINA (DETALLE)
        if (data.startsWith('maquina_ficha_')) {
            const id = data.replace('maquina_ficha_', '');
            const { data: m } = await supabase.from('maquinas').select('*').eq('id', id).single();
            if (m) {
                let txt = `📄 *Ficha Técnica: ${m.nombre}*\n\n`;
                txt += `🏭 Fabricante: ${m.fabricante || '—'}\n`;
                txt += `🗓️ Modelo: ${m.modelo || '—'}\n`;
                txt += `⚡ Frecuencia Mtto: cada ${m.frecuencia_mtto_dias || 30} días\n`;
                txt += `🔧 Último Mtto: ${m.ultimo_mtto || 'Sin registro'}\n\n`;
                txt += `📝 *Observaciones:* ${m.observaciones || 'Ninguna'}`;
                
                await bot.editMessageText(txt, {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                    reply_markup: menus.backToMaquinasKeyboard
                });
            }
        }
        if (data.startsWith('maquina_mtto_')) {
            const id = data.replace('maquina_mtto_', '');
            const { data: m } = await supabase.from('maquinas').select('nombre').eq('id', id).single();
            
            if (m) {
                userStates[userId] = { state: 'ESPERANDO_MTTO', machineName: m.nombre };
                await bot.editMessageText(`📧 *Reporte de Mantenimiento: ${m.nombre}*\n\nPor favor, escribe el detalle de la falla o el servicio realizado.\n\n_(Ejemplo: "Limpieza general y cambio de aceite")_`, {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                    reply_markup: menus.backToMaquinasKeyboard
                });
            }
        }

        // G. IA CHAT
        if (data === 'menu_ia') {
            userStates[userId] = { state: 'CHAT_IA' };
            await bot.editMessageText(`🤖 *Asistente Inteligente*\n\n¿En qué puedo ayudarte hoy?\n\nHe activado el modo de conversación. Puedes hacerme preguntas sobre el ERP o pedirme consejos sobre maquinaria.\n\n_Escribe tu mensaje abajo:_`, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: menus.backToMainKeyboard
            }).catch(err => {
                if (!err.message.includes('message is not modified')) {
                    console.error("Error en editMessageText:", err.message);
                }
            });
        }

        // H. OTROS MENÚS
        if (data === 'menu_finanzas') {
            const { data: n } = await supabase.from('produccion_fabriquines').select('total_ganado').eq('estado', 'PENDIENTE');
            let total = 0; if (n) n.forEach(x => total += parseFloat(x.total_ganado));
            const txt = `💰 *Resumen Financiero*\n\n💵 Nómina Pendiente: *$${total.toLocaleString('es-CO')}*\n⚖️ Saldo en Caja: _(Sincronizando...)_\n\nUsa /analitica en la web para ver gráficos.`;
            
            await bot.editMessageText(txt, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: menus.backToMainKeyboard
            }).catch(err => {
                if (!err.message.includes('message is not modified')) {
                    console.error("Error en editMessageText:", err.message);
                }
            });
        }
        if (data === 'menu_bodega') {
            const { data: inv } = await supabase.from('inventario').select('*').gt('cantidad', 0);
            let txt = `🚚 *Estado de Bodega*\n\n`;
            if (inv) inv.slice(0, 10).forEach(i => txt += `• ${i.material}: \`${i.cantidad}\` ${i.unidad || ''}\n`);
            
            await bot.editMessageText(txt, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: menus.backToMainKeyboard
            }).catch(err => {
                if (!err.message.includes('message is not modified')) {
                    console.error("Error en editMessageText:", err.message);
                }
            });
        }

        // Finalizar el relojito de carga en Telegram
        bot.answerCallbackQuery(query.id);

    } catch (err) {
        console.error("Error en Callback Query:", err);
        bot.answerCallbackQuery(query.id, { text: "❌ Error al procesar acción." });
    }
});

// Exportamos el bot y la función síncrona
bot.procesarMensajeSync = procesarMensajeSync;
module.exports = bot;


