const TelegramBot = require('node-telegram-bot-api');
const { supabase, obtenerHoraColombia } = require('../lib/shared');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const menus = require('./handlers/menu_handlers');
const GatoNegroPDF = require('../lib/pdf_gen');
const { Ollama } = require('ollama'); // 👈 Importamos Ollama
const fs = require('fs');
const path = require('path');

// ============================================================
// 🔧 CONFIGURACIÓN Y VALIDACIÓN DE VARIABLES DE ENTORNO
// ============================================================
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Modelos para transcribir notas de voz. Flash y flash-lite entran en el plan gratuito de la API.
const GEMINI_AUDIO_MODEL = process.env.GEMINI_AUDIO_MODEL || 'gemini-2.5-flash';
const GEMINI_AUDIO_FALLBACK = process.env.GEMINI_AUDIO_FALLBACK || 'gemini-2.5-flash-lite';

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
// Se puede sobrescribir con ADMIN_IDS="123,456" en el .env.
const ADMIN_LIST = (process.env.ADMIN_IDS
    ? process.env.ADMIN_IDS.split(',').map(s => parseInt(s.trim())).filter(Number.isFinite)
    : [
        8589883684, // Gonzalo
        2073256205, // Ingeniera Yesith
    ]);

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
    ai = new GoogleGenerativeAI(GEMINI_API_KEY);
}

// Instancia de Ollama apuntando dinámicamente
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
const ollama = new Ollama({ host: OLLAMA_HOST });

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
    // Lista vacía = nadie entra (fail-closed). Antes dejaba entrar a todos.
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
            id: emp.id, // <--- AÑADIDO PARA USO INTERNO
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

        let funcionales = [], conFallas = [], urgentes = [];
        const hoy = new Date();

        maquinas.forEach(m => {
            if (m.estado === 'Funcional') funcionales.push(m.nombre);
            else conFallas.push(m.nombre);

            if (m.ultimo_mtto) {
                const last = new Date(m.ultimo_mtto + 'T00:00:00');
                const dias = Math.floor((hoy - last) / (1000 * 60 * 60 * 24));
                if (dias >= (m.frecuencia_mtto_dias || 30)) urgentes.push(m.nombre);
            }
        });

        return { 
            total_funcionales: funcionales.length,
            nombres_funcionales: funcionales,
            total_con_fallas: conFallas.length,
            nombres_con_fallas: conFallas,
            mantenimientos_urgentes: urgentes 
        };
    } catch (e) {
        return { error: true, mensaje: e.message };
    }
}

/**
 * Obtiene el color Y la cantidad de cestas del último despacho de un empleado.
 */
async function obtenerColorCestaParaPregunta({ nombre_o_codigo }) {
    try {
        const empRes = await consultarDeudaEmpleado({ nombre_o_codigo });
        if (!empRes.encontrado) {
            return { color: 'de color', cantidad: 0, nombre: nombre_o_codigo };
        }

        // Buscar el último despacho para saber el color y cantidad de cestas
        const { data: ultimoDespacho } = await supabase
            .from('despachos_registro')
            .select('color_cesta, cestas_cant')
            .eq('empleado_id', empRes.id)
            .in('estado', ['entregado', 'pendiente', 'activo'])
            .order('id', { ascending: false })
            .limit(1)
            .maybeSingle();

        const color = ultimoDespacho?.color_cesta || null;
        const cantidad = parseInt(ultimoDespacho?.cestas_cant) || 0;

        return {
            color: color ? `*${color.toLowerCase()}*` : 'de color',
            cantidad,
            nombre: empRes.nombre
        };
    } catch (e) {
        return { color: 'de color', cantidad: 0, nombre: nombre_o_codigo, error: e.message };
    }
}

/**
 * Enrutador de Documentación Optimizado (RAG Estático).
 * Lee directamente el archivo pre-digerido según el tema, ahorrando CPU y Tokens.
 */
async function consultarDocumentacion({ tema }) {
    try {
        let fileName = '';
        const t = tema.toLowerCase();

        if (t.includes('empresa') || t.includes('historia') || t.includes('fabrica') || t.includes('proceso')) {
            fileName = 'EMPRESA_GATO_NEGRO.md';
        } else if (t.includes('erp') || t.includes('sistema') || t.includes('bot') || t.includes('proyecto') || t.includes('universidad')) {
            fileName = 'SISTEMA_ERP_Y_BOT.md';
        } else if (t.includes('personal') || t.includes('equipo') || t.includes('trabajador') || t.includes('administrador') || t.includes('omaira') || t.includes('gregorio') || t.includes('quien') || t.includes('quién')) {
            fileName = 'PERSONAL_Y_ORGANIGRAMA.md';
        } else if (t.includes('finanza') || t.includes('precio') || t.includes('formula') || t.includes('pago')) {
            fileName = 'FINANZAS_Y_FORMULAS.md';
        } else if (t.includes('diccionario') || t.includes('rol') || t.includes('concepto') || t.includes('cesta')) {
            fileName = 'DICCIONARIO_FABRICA.md';
        } else {
            return { error: true, mensaje: "Tema no encontrado. Puedo hablar de: 'la empresa', 'el personal', 'el sistema ERP', 'finanzas' o 'diccionario'." };
        }

        const filePath = path.join(__dirname, '../../documentacion', fileName);
        if (!fs.existsSync(filePath)) return { error: true, mensaje: `El archivo ${fileName} no existe en la base de conocimientos.` };

        const content = fs.readFileSync(filePath, 'utf-8');
        return { documento_consultado: fileName, contenido: content };
    } catch (e) {
        return { error: true, mensaje: e.message };
    }
}

/**
 * Consulta la producción de tabacos en un rango de días (por defecto 7 días = esta semana).
 */
async function consultarProduccion({ dias = 7 } = {}) {
    try {
        dias = parseInt(dias) || 7;

        // "Hoy": los registros son semanales (una columna por día), así que se
        // suma solo la columna del día actual de la semana en curso.
        if (dias <= 1) {
            const { columna } = obtenerFechaHoraColombia();
            const col = `${columna}_tabacos`;
            const { data: enCurso } = await supabase
                .from('recepcion_diaria')
                .select(col)
                .in('estado', ['pendiente', 'activo']);
            const totalHoy = (enCurso || []).reduce((acc, r) => acc + (r[col] || 0), 0);
            return { total: totalHoy, dias_consultados: 1, registros_encontrados: (enCurso || []).length };
        }

        // Rango de varios días: se incluye la semana que contiene la fecha de
        // inicio (semana_inicio es el lunes, hasta 6 días antes de esa fecha).
        const fechaDesde = new Date();
        fechaDesde.setDate(fechaDesde.getDate() - dias - 6);
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
 * Ahora soporta 'abono_pesos' para descontar de préstamos activos.
 */
async function registrarProduccionRapida(nombre_o_codigo, tabacos, cestas = 0, color_cesta = null, esExtra = false, abono_pesos = 0) {
    try {
        const empRes = await consultarDeudaEmpleado({ nombre_o_codigo });
        if (!empRes.encontrado) return empRes.mensaje;
        
        // Obtener datos completos del empleado usando el ID ya resuelto por consultarDeudaEmpleado
        const { data: emp } = await supabase
            .from('empleados_fabriquines')
            .select('*')
            .eq('id', empRes.id)
            .single();
        if (!emp) return `❌ No se pudo encontrar el registro completo del empleado ${empRes.codigo}.`;


        const tiempo = obtenerFechaHoraColombia();
        
        // 1. Buscar registro activo de la semana en curso
        // Se busca en estado 'pendiente' o 'activo' (ambos significan semana en curso)
        let { data: reg } = await supabase
            .from('recepcion_diaria')
            .select('*')
            .eq('empleado_id', emp.id)
            .in('estado', ['pendiente', 'activo'])
            .order('id', { ascending: false })
            .limit(1)
            .maybeSingle();

        // =====================================================================
        // MODO PAGO DE DEUDA: Si no hay registro activo esta semana pero el
        // empleado tiene deuda de tabacos, procesamos sin recepcion_diaria.
        // Esto cubre el caso de fabriquines pagando deudas de semanas anteriores.
        // =====================================================================
        const esPagoDeDeuda = !reg && (emp.deuda_tabacos || 0) > 0;

        if (!reg && !esPagoDeDeuda) {
            return `⚠️ *No se puede registrar:* ${emp.nombre} no tiene un despacho activo y tampoco tiene deuda de tabacos pendiente.`;
        }

        let msgDetalle = "";

        if (reg) {
            // --- MODO NORMAL: hay registro activo esta semana ---
            let updatedData = {};
            if (esExtra) {
                updatedData['extra_tabacos'] = (reg.extra_tabacos || 0) + tabacos;
                msgDetalle = `sumado a *Tabacos Extras* (Venta Directa)`;
            } else {
                const colTabacos = `${tiempo.columna}_tabacos`;
                updatedData[colTabacos] = (reg[colTabacos] || 0) + tabacos;
                msgDetalle = `sumado al día *${tiempo.columna}*`;
            }
            if (cestas > 0) {
                const colCestas = `${tiempo.columna}_cestas`;
                updatedData[colCestas] = (reg[colCestas] || 0) + cestas;
            }
            await supabase.from('recepcion_diaria').update(updatedData).eq('id', reg.id);
        } else {
            // --- MODO PAGO DE DEUDA: sin despacho activo esta semana ---
            msgDetalle = `registrado como *Pago de Deuda* (sin despacho activo esta semana)`;
        }

        // 1.5 NOVEDAD: Descontar la deuda de tabacos inmediatamente en tiempo real
        if (!esExtra) {
            const nuevaDeuda = Math.max(0, (emp.deuda_tabacos || 0) - tabacos);
            await supabase.from('empleados_fabriquines').update({ deuda_tabacos: nuevaDeuda }).eq('id', emp.id);
        }

        // 1.6 NOVEDAD: Descontar abono en pesos de los préstamos activos
        let msgAbono = "";
        if (abono_pesos > 0) {
            const { data: prestamos } = await supabase
                .from('prestamos_fabriquines')
                .select('*')
                .eq('empleado_id', emp.id)
                .eq('estado', 'activo')
                .order('created_at', { ascending: true });

            let pesosRestantes = abono_pesos;
            if (prestamos && prestamos.length > 0) {
                for (const p of prestamos) {
                    if (pesosRestantes <= 0) break;
                    const saldo = parseFloat(p.saldo_pendiente || 0);
                    if (saldo > 0) {
                        const aDescontar = Math.min(saldo, pesosRestantes);
                        const nuevoSaldo = saldo - aDescontar;
                        const nuevoEstado = nuevoSaldo <= 0 ? 'pagado' : 'activo';
                        await supabase.from('prestamos_fabriquines').update({ saldo_pendiente: nuevoSaldo, estado: nuevoEstado }).eq('id', p.id);
                        pesosRestantes -= aDescontar;
                    }
                }
                msgAbono = `\n💰 *Abono monetario:* Se descontaron *$${abono_pesos.toLocaleString('es-CO')}* de sus préstamos.`;
            } else {
                msgAbono = `\n⚠️ Se registró un abono de *$${abono_pesos.toLocaleString('es-CO')}*, pero no se detectaron deudas monetarias activas.`;
            }
        }

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
            descripcion: esPagoDeDeuda
                ? `Pago de Deuda: ${emp.codigo} - ${emp.nombre}`
                : `Registro Rápido ${esExtra ? '(EXTRA)' : ''}: ${emp.codigo} - ${emp.nombre}`
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

        // =====================================================================
        // 4. CALCULAR SALDO PENDIENTE ACTUALIZADO para incluir en la respuesta
        // =====================================================================
        // 4a. Tabacos: ya calculado arriba como nuevaDeuda
        const nuevaDeudaTabacos = !esExtra ? Math.max(0, (emp.deuda_tabacos || 0) - tabacos) : (emp.deuda_tabacos || 0);

        // 4b. Pesos: re-consultar préstamos activos para obtener saldo fresco
        const { data: prestamosActualizados } = await supabase
            .from('prestamos_fabriquines')
            .select('saldo_pendiente')
            .eq('empleado_id', emp.id)
            .eq('estado', 'activo');
        const deudaPesosRestante = (prestamosActualizados || []).reduce((s, p) => s + parseFloat(p.saldo_pendiente || 0), 0);

        // 4c. Cestas: obtener original del despacho y restar todas las devueltas históricamente
        const { data: ultimoDespacho } = await supabase
            .from('despachos_registro')
            .select('cestas_cant')
            .eq('empleado_id', emp.id)
            .order('id', { ascending: false })
            .limit(1)
            .maybeSingle();
        const cestasOriginales = parseInt(ultimoDespacho?.cestas_cant) || 0;

        // Sumar cestas devueltas en todos los registros semanales históricos
        const { data: todasRecep } = await supabase
            .from('recepcion_diaria')
            .select('lun_cestas, mar_cestas, mie_cestas, jue_cestas, vie_cestas, sab_cestas')
            .eq('empleado_id', emp.id);
        const cestasRetornadasHistorico = (todasRecep || []).reduce((s, r) =>
            s + (r.lun_cestas||0) + (r.mar_cestas||0) + (r.mie_cestas||0)
              + (r.jue_cestas||0) + (r.vie_cestas||0) + (r.sab_cestas||0), 0);
        // En modo pago de deuda las cestas de hoy no están en recepcion_diaria → sumarlas aquí
        const cestasRetornadasTotal = cestasRetornadasHistorico + (esPagoDeDeuda ? cestas : 0);
        const cestasPendientes = Math.max(0, cestasOriginales - cestasRetornadasTotal);

        // Construir bloque de saldo pendiente
        let msgSaldo = '';
        if (nuevaDeudaTabacos > 0 || deudaPesosRestante > 0 || cestasPendientes > 0) {
            msgSaldo = `\n\n📊 *Saldo pendiente de ${emp.nombre}:*`;
            if (nuevaDeudaTabacos > 0) msgSaldo += `\n   🚬 Tabacos: *${nuevaDeudaTabacos.toLocaleString('es-CO')} u*`;
            if (cestasPendientes > 0)  msgSaldo += `\n   🧺 Cestas:  *${cestasPendientes}*`;
            if (deudaPesosRestante > 0) msgSaldo += `\n   💵 Pesos:   *$${deudaPesosRestante.toLocaleString('es-CO')}*`;
        } else {
            msgSaldo = `\n\n🎉 *¡${emp.nombre} ha saldado toda su deuda!*`;
        }

        return `✅ *Registro Exitoso*\n👤 Empleado: *${emp.nombre} (${emp.codigo})*\n📈 *+${tabacos.toLocaleString('es-CO')} u* ${msgDetalle}${cestas > 0 ? ` y *+${cestas}* cestas` : ''}.${msgAbono}${msgSaldo}`;
    } catch (e) {
        return '❌ Error al registrar producción: ' + e.message;
    }
}



// ============================================================
// 🧠 DECLARACIÓN DE HERRAMIENTAS PARA GEMINI
// ============================================================
const herramientasOllama = [
    {
        type: 'function',
        function: {
            name: 'consultar_deuda_empleado',
                description: 'Consulta la deuda de un operario. ESTÁ ESTRICTAMENTE PROHIBIDO usar esta herramienta para buscar a "Gonzalo", "Don Gonzalo" o fundadores.',
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
        }
    },
    {
        type: 'function',
        function: {
            name: 'listar_todos_los_deudores',
            description: 'Lista todos los empleados que tienen deudas pendientes (tabacos o pesos). Usar cuando el usuario pregunta "¿quiénes me deben?", "lista de deudores", "todos los que deben".',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'consultar_maquinaria',
            description: 'Muestra el estado actual de la maquinaria de la fábrica: detalla cuáles máquinas están operativas, cuáles tienen fallas, y devuelve los nombres exactos de las que necesitan mantenimiento urgente.',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'consultar_produccion',
            description: 'Consulta cuántos tabacos se han fabricado en un período dado. Usar para preguntas como "¿cuantos tabacos nos entregaron hoy?", "producción del mes", "qué tanto producimos".',
            parameters: {
                type: 'object',
                properties: {
                    dias: {
                        type: 'integer',
                        description: 'Número de días hacia atrás para consultar. 7 = esta semana, 30 = este mes, 1 = hoy.'
                    }
                },
                required: ['dias']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'registrar_produccion',
            description: 'Registra la entrega de tabacos de un operario. REGLA ESTRICTA: Si el usuario NO menciona las cestas, PREGÚNTALE primero si entregó cestas antes de usar la herramienta. Si te confirma que no entregó, usa el valor 0.',
            parameters: {
                type: 'object',
                properties: {
                    nombre_o_codigo: { type: 'string', description: 'Nombre o código del operario (ej: Alcides, F11)' },
                    tabacos: { type: 'integer', description: 'Cantidad de tabacos entregados (ej: 1250)' },
                    cestas: { type: 'integer', description: 'Cantidad de cestas devueltas. (0 si no entregó)' },
                    abono_pesos: { type: 'integer', description: 'Pesos colombianos abonados a la deuda monetaria. 0 por defecto. Ejemplo: si dice "25000 pesos", usar 25000.' },
                    esExtra: { type: 'boolean', description: 'Verdadero SOLO si el usuario dice que son tabacos extras o ventas directas. Falso por defecto.' }
                },
                required: ['nombre_o_codigo', 'tabacos', 'cestas']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'obtener_color_cesta_para_pregunta',
            description: 'Obtiene el color y la CANTIDAD de cestas del último despacho de un operario. Úsala cuando pregunten cuántas cestas tiene alguien, de qué color son, o antes de registrar producción para tener contexto completo.',
            parameters: {
                type: 'object',
                properties: {
                    nombre_o_codigo: { type: 'string', description: 'Nombre o código del operario (ej: Alcides, F11)' }
                },
                required: ['nombre_o_codigo']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'consultar_documentacion',
            description: 'Lee la base de conocimientos de la empresa. ÚSALA SIEMPRE que pregunten por la historia de la empresa, "¿quién es [nombre]?", el personal (Gregorio, Omaira, etc), el proyecto, precios, o diccionarios.',
            parameters: {
                type: 'object',
                properties: {
                    tema: { type: 'string', description: 'Palabra clave del tema (ej: "empresa", "finanzas", "personal", "gregorio", "proyecto", "diccionario")' }
                },
                required: ['tema']
            }
        }
    }
];

// ============================================================
// 💬 HISTORIAL DE CONVERSACIÓN POR CHAT (para que recuerde contexto)
// ============================================================
const conversaciones = {}; // { chatId: [ {role, parts}, ... ] }

const SYSTEM_PROMPT = `Eres el "Black Cat Agent (BCA)", el carismático asistente de IA de la Fábrica de Tabacos Gato Negro.
Tu personalidad es amigable y astuta. Eres el asistente de Gonzalo Andres Jaimes.

DATOS EN TU MEMORIA (Usa estos datos para responder directamente, SIN usar herramientas):
- 👔 Fundador y Dueño de la empresa: Gonzalo Jaimes Bastos (Don Gonzalo).
- 💻 Creador tuyo (del bot) y del ERP: Gonzalo Andres Jaimes (Nieto de Don Gonzalo).

REGLAS DE ORO:
1. Actitud: Responde de forma cálida y humana en español.
2. Cero Disculpas: ESTÁ ESTRICTAMENTE PROHIBIDO pedir perdón, decir "lo siento", "disculpa" o "cometí un error". Habla siempre con seguridad y alegría.
3. Cero Alucinaciones: NUNCA inventes deudas, números ni nombres. Si no sabes algo, DEBES usar una herramienta. NUNCA inventes herramientas que no existan.
4. Cero JSON: NUNCA escribas código JSON o estructuras de programación en el chat.

GATILLOS DE HERRAMIENTAS (¡OBLIGATORIO USARLAS!):
- Si preguntan "¿quién debe?", "lista de deudores": INVOCA LA HERRAMIENTA listar_todos_los_deudores.
- Si mencionan a un operario junto a "debe", "deuda": INVOCA LA HERRAMIENTA consultar_deuda_empleado.
- Si preguntan por "producción": INVOCA LA HERRAMIENTA consultar_produccion.
- Si preguntan por "máquinas" o "mantenimiento": INVOCA LA HERRAMIENTA consultar_maquinaria.
- Al registrar producción, si el usuario no menciona las cestas, DEBES usar la herramienta 'obtener_color_cesta_para_pregunta' para saber el color Y la cantidad. Luego, pregunta usando ambos datos. Ejemplo: "A Alcides se le entregaron 6 cestas negras, ¿cuántas devolvió?". Una vez tengas todos los datos, invoca 'registrar_produccion'.
- Si preguntan "¿cuántas cestas tiene [nombre]?", "¿de qué color son sus cestas?", "¿cuántas cestas le dimos a [nombre]?": INVOCA LA HERRAMIENTA obtener_color_cesta_para_pregunta y responde con el color y la cantidad exacta.
- Si te preguntan "¿Qué sabes de la empresa?", "¿Quién es Gregorio/Omaira/etc?", por el personal, precios, historia o el proyecto: INVOCA LA HERRAMIENTA consultar_documentacion indicando el tema.`;

// ============================================================
// 🔄 EJECUTAR LA HERRAMIENTA QUE GEMINI PIDIÓ
// ============================================================
async function ejecutarHerramienta(nombre, args) {
    console.log(`🔧 Ollama invocó herramienta: ${nombre}`, JSON.stringify(args));
    switch (nombre) {
        case 'consultar_deuda_empleado':    return await consultarDeudaEmpleado(args);
        case 'listar_todos_los_deudores':   return await listarTodosLosDeudores();
        case 'consultar_maquinaria':        return await consultarMaquinaria();
        case 'consultar_produccion':        return await consultarProduccion(args);
        case 'obtener_color_cesta_para_pregunta': return await obtenerColorCestaParaPregunta(args);
        case 'consultar_documentacion':     return await consultarDocumentacion(args);
        case 'registrar_produccion': {
            const tabacosNum = parseInt(args.tabacos) || 0;
            const cestasNum  = parseInt(args.cestas)  || 0;
            const pesosNum   = parseInt(args.abono_pesos) || 0;
            // Cast explícito a booleano real para evitar el bug del string 'false' (truthy)
            const esExtraBool = args.esExtra === true || args.esExtra === 'true' || args.esExtra === 'True';
            const resTexto = await registrarProduccionRapida(args.nombre_o_codigo, tabacosNum, cestasNum, null, esExtraBool, pesosNum);
            return { exito: true, detalle: resTexto };
        }
        default:                            return {
            // Herramienta inexistente (alucinada por el modelo): NO se reporta como éxito,
            // para que el LLM no confirme acciones que nunca ocurrieron.
            exito: false,
            error: `La herramienta "${nombre}" no existe.`,
            datos: "El fundador de la empresa es Gonzalo Jaimes Bastos (Don Gonzalo). El creador del ERP y del bot es Gonzalo Andres Jaimes.",
            instruccion_secreta: "No realizaste ninguna acción. Responde amigablemente con los datos disponibles y dile al usuario qué sí puedes hacer."
        };
    }
}

// ============================================================
// 🤖 PROCESAR MENSAJE CON OLLAMA (Local & Gratis)
// ============================================================
async function responderConOllama(chatId, textoUsuario) {
    // Inicializar historial si no existe
    if (!conversaciones[chatId]) {
        conversaciones[chatId] = [{ role: 'system', content: SYSTEM_PROMPT }];
    }

    // Agregar mensaje del usuario al historial
    conversaciones[chatId].push({
        role: 'user',
        content: textoUsuario
    });

    // Limitar historial a últimas 20 interacciones
    if (conversaciones[chatId].length > 20) {
        const sys = conversaciones[chatId][0]; // Guardar el prompt
        let recorte = conversaciones[chatId].slice(-19);
        // No empezar con un mensaje 'tool' o 'assistant' huérfano (sin su pregunta/tool_call previo)
        while (recorte.length && recorte[0].role !== 'user') recorte.shift();
        conversaciones[chatId] = [sys, ...recorte];
    }

    try {
        // 1. Llamar a Ollama
        const response = await ollama.chat({
            model: 'llama3.1', // Llama 3.1 8B es el rey del Tool Calling para la RTX 4050
            messages: conversaciones[chatId],
            tools: herramientasOllama,
        });

        // =====================================================================
        // 🚀 RESCATE DE ALUCINACIÓN DE TOOL CALL (LLaMA 3.1 Python/JSON Bug)
        // =====================================================================
        let textoSalida = response.message.content || "";
        if (!response.message.tool_calls || response.message.tool_calls.length === 0) {
            if (textoSalida.includes('"name"') && textoSalida.includes('{')) {
                try {
                    const match = textoSalida.match(/\{[\s\S]*\}/);
                    if (match) {
                        // Reemplazar sintaxis Python (False/True) por JSON válido
                        const jsonLimpio = match[0].replace(/False/g, 'false').replace(/True/g, 'true').replace(/'/g, '"');
                        const parsedTool = JSON.parse(jsonLimpio);
                        
                        let funcName = parsedTool.name || (parsedTool.function && parsedTool.function.name);
                        let args = parsedTool.parameters || parsedTool.arguments || (parsedTool.function && parsedTool.function.arguments) || {};
                        
                        if (funcName) {
                            console.log("🛠️ ¡Rescate exitoso de Tool Call manual!:", funcName);
                            response.message.tool_calls = [{
                                function: { name: funcName, arguments: args }
                            }];
                            response.message.content = ""; // Limpiamos para engañar al flujo
                            textoSalida = "";
                        }
                    }
                } catch(e) {}
            }
        }
        // =====================================================================

        // 2. ¿Ollama decidió que necesita usar una base de datos/herramienta?
        if (response.message.tool_calls && response.message.tool_calls.length > 0) {
            // Guardamos la decisión de Ollama en el historial
            conversaciones[chatId].push(response.message);

            // Ejecutamos las herramientas que pidió (Ej: consultar_produccion)
            for (const tool of response.message.tool_calls) {
                const resultadoDB = await ejecutarHerramienta(tool.function.name, tool.function.arguments);
                
                // Le devolvemos los datos de Supabase a Ollama
                conversaciones[chatId].push({
                    role: 'tool',
                    name: tool.function.name,
                    content: JSON.stringify(resultadoDB)
                });
            }

            // 3. Volvemos a llamar a Ollama para que lea los datos y redacte la respuesta final
            const finalResponse = await ollama.chat({
                model: 'llama3.1',
                messages: conversaciones[chatId]
            });
            
            conversaciones[chatId].push(finalResponse.message);
            
            let textoSalidaFinal = finalResponse.message.content;
            // Filtro Anti-Alucinación JSON Brutal Suavizado
            if (textoSalidaFinal.includes('{"name":') || textoSalidaFinal.includes('{"function":')) {
                console.warn("⚠️ Alucinación JSON interceptada post-tool:", textoSalidaFinal);
                textoSalidaFinal = "🐾 ¡Miau! Ejecuté la acción exitosamente, pero me enredé respondiendo. ¿Qué más necesitas?";
            }
            return textoSalidaFinal;
        }

        // Si no usó herramientas, simplemente respondemos lo que dijo
        conversaciones[chatId].push(response.message);
        
        // Filtro Anti-Alucinación JSON Brutal Suavizado
        if (textoSalida.includes('{"name":') || textoSalida.includes('{"function":')) {
             console.warn("⚠️ Alucinación JSON interceptada sin tools:", textoSalida);
             textoSalida = "🐾 ¡Miau! Me distraje con un ovillo de lana 🧶. La operación fue procesada, ¿me repites qué más querías saber?";
        }
        return textoSalida;

    } catch (e) {
        console.error('❌ Error con Ollama:', e.message);
        return '🐾 Miau... Mi servidor de IA local (Ollama) parece estar apagado. Verifica que esté corriendo en tu PC.';
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

        // 0. Filtro de Seguridad: ANTES de cualquier trabajo costoso (descarga/transcripción de audio, IA)
        if (!esAdmin(userId)) {
            console.log(`⛔ Usuario no autorizado: ${userId}`);
            bot.sendMessage(chatId, `🐾 *Miau...* No hablo con desconocidos. Tu ID es \`${userId}\`. Pídele a Gonzalo que te agregue.`, { parse_mode: 'Markdown' });
            return;
        }

        let textoFinal = text;

        // 🎙️ MANEJO DE AUDIOS CON GEMINI (Speech-to-Text)
        if (!msg.text) {
            if (msg.voice) {
                if (!ai) {
                    bot.sendMessage(chatId, "🐾 *¡Miau!* Mi API Key de Gemini no está configurada, así que soy sordo por ahora. 😿");
                    return;
                }
                bot.sendChatAction(chatId, 'typing');
                bot.sendMessage(chatId, "🎧 _Escuchando tu nota de voz..._", { parse_mode: 'Markdown' });
                
                try {
                    // 1. Descargar audio (.ogg) desde Telegram
                    const fileInfo = await bot.getFile(msg.voice.file_id);
                    const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${fileInfo.file_path}`;
                    const response = await fetch(fileUrl);
                    const arrayBuffer = await response.arrayBuffer();
                    const audioBase64 = Buffer.from(arrayBuffer).toString('base64');
                    
                    // 2. Pedirle a Gemini que lo transcriba (Con Fallback de Modelos)
                    let geminiRes;
                    const promptAudio = [
                        'Transcribe exactamente este mensaje de voz a texto. Solo devuelve lo que la persona dijo en español, sin añadir comillas ni comentarios.',
                        { inlineData: { mimeType: 'audio/ogg', data: audioBase64 } }
                    ];
                    
                    try {
                        // Los modelos 1.5 ya no existen en la API; el modelo se puede cambiar con GEMINI_AUDIO_MODEL
                        const geminiModel = ai.getGenerativeModel({ model: GEMINI_AUDIO_MODEL });
                        geminiRes = await geminiModel.generateContent(promptAudio);
                    } catch (errApi) {
                        console.warn(`⚠️ Intento flash falló (${errApi.message}). Intentando modelo pro...`);
                        const fallbackModel = ai.getGenerativeModel({ model: GEMINI_AUDIO_FALLBACK });
                        geminiRes = await fallbackModel.generateContent(promptAudio); 
                    }
                    
                    textoFinal = geminiRes.response.text().trim();
                    console.log(`🎤 [AUDIO TRANSCRITO]: "${textoFinal}"`);
                    bot.sendMessage(chatId, `🗣️ _Entendí:_ "${textoFinal}"`, { parse_mode: 'Markdown' });
                } catch (audioErr) {
                    console.error("❌ Error con Gemini Audio:", audioErr);
                    bot.sendMessage(chatId, "🐾 *¡Miau!* Hubo un problema al escuchar tu audio. ¿Estará bien la API Key? ¿Podrías escribírmelo?");
                    return;
                }
            } else {
                bot.sendMessage(chatId, "🐾 *¡Miau!* Por ahora solo entiendo texto y notas de voz. 🐈‍⬛", { parse_mode: 'Markdown' });
                return;
            }
        }

        // 1. Comando /id  – siempre responder sin IA
        if (textoFinal === '/id') {
            bot.sendMessage(chatId, `🔑 Tu ID de Telegram es: \`${userId}\``, { parse_mode: 'Markdown' });
            return;
        }

        // 1. Manejo de Comandos Manuales
        const saludos = ['hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'que tal', 'hey'];
        // Solo es saludo si es corto ("hola", "buenas tardes") y no hay un flujo activo.
        // Así "Hola, ¿cuánto debe F11?" o un reporte en curso no se pierden.
        const hayFlujoActivo = !!userStates[userId];
        const esSaludo = !hayFlujoActivo
            && textoFinal.trim().split(/\s+/).length <= 3
            && saludos.some(s => textoFinal.toLowerCase().startsWith(s));

        if (textoFinal === '/start' || esSaludo) {
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
            const reporte = textoFinal;
            const maquina = estadoActual.machineName;
            const tipoMtto = estadoActual.mttoType || 'Correctivo/Ajuste';
            const tiempo = obtenerHoraColombia();

            bot.sendChatAction(chatId, 'typing');
            
            // Guardar en Supabase
            const { error } = await supabase.from('mantenimiento').insert([{
                fecha: tiempo.fecha,
                hora: tiempo.hora,
                maquina: maquina,
                tipo: tipoMtto,
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
            // Si el usuario quiere salir del modo chat
            if (textoFinal.toLowerCase() === '/salir' || textoFinal.toLowerCase() === 'salir') {
                userStates[userId] = null;
                bot.sendMessage(chatId, "🚪 *Saliste del Chat con IA.*\n\nVolviste al menú principal. ¿Qué deseas hacer?", { 
                    parse_mode: 'Markdown',
                    reply_markup: menus.mainKeyboard // Asumiendo que mainKeyboard existe en menus
                });
                return;
            }
            
            // Ejecutar Ollama
            bot.sendChatAction(chatId, 'typing');
            const respuestaIA = await responderConOllama(chatId, textoFinal);
            if (respuestaIA) {
                bot.sendMessage(chatId, respuestaIA, { parse_mode: 'Markdown' }).catch(err => {
                    console.warn('⚠️ Error de formato Markdown detectado. Enviando como texto plano...');
                    bot.sendMessage(chatId, respuestaIA);
                });
            }
            return; // Terminar aquí para no procesar otros comandos
        }

        // Comando /ayuda (alias de /start)
        if (textoFinal === '/ayuda') {
            bot.sendChatAction(chatId, 'typing');
            const msgAyuda = `🐾 *Comandos Disponibles:*\n\n/pendientes - Ver deudores\n/entregas - Últimos despachos\n/maquinas - Estado planta\n/deuda [COD] - Ver deuda específica\n/id - Ver tu ID\n/ping - Test de vida`;
            bot.sendMessage(chatId, msgAyuda, { parse_mode: 'Markdown' });
            return;
        }

        // 3. Comando /ping – test rápido
        if (textoFinal === '/ping') {
            bot.sendMessage(chatId, '😼 *¡Pong!* Estoy vivo y conectado a Gato Negro.', { parse_mode: 'Markdown' });
            return;
        }

        // --- NUEVOS COMANDOS OPERATIVOS ---
        
        // A. Ver deudores de tabaco
        if (textoFinal === '/pendientes') {
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
        if (textoFinal === '/entregas') {
            bot.sendChatAction(chatId, 'typing');
            const respuesta = await listarUltimasEntregas();
            bot.sendMessage(chatId, respuesta, { parse_mode: 'Markdown' });
            return;
        }

        // C. Registro rápido de producción (Texto Natural)
        const regexProd = /^([A-Z0-9]{3}|[a-zA-Z\s]{3,})\s+(\d+)\s+tabacos(?:\s+(extra))?(?:\s*(?:y|,|)\s*(\d+)\s+cestas(?:\s+([\w\s]+))?)?$/i;
        const match = textoFinal.trim().match(regexProd);
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
        if (textoFinal === '/maquinas' || textoFinal === '/reporte') {
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
        if (textoFinal.startsWith('/deuda')) {
            bot.sendChatAction(chatId, 'typing');
            const partes = textoFinal.trim().split(/\s+/);
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

        // ============================================================
        // ⚠️ FALLBACK: Mensaje no reconocido
        // ============================================================
        console.log(`ℹ️ Mensaje no reconocido: "${textoFinal}"`);
        bot.sendMessage(chatId, 
            `🐾 *¡Miau!* No entendí lo que quisiste decir.\n\nSi quieres conversar, hacerme preguntas o registrar entregas de tabacos, entra al 🤖 *Chat con IA* presionando el botón en el menú principal.\n\n¿Qué deseas hacer ahora?`, 
            { 
                parse_mode: 'Markdown',
                reply_markup: menus.mainKeyboard
            }
        );

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

// Apagado elegante para evitar procesos zombies que causen el Error 409
process.once('SIGINT', () => {
    console.log('🛑 Apagando el bot de Telegram limpiamente...');
    if (bot && bot.isPolling()) bot.stopPolling();
    process.exit(0);
});
process.once('SIGTERM', () => {
    console.log('🛑 Apagando el bot de Telegram limpiamente...');
    if (bot && bot.isPolling()) bot.stopPolling();
    process.exit(0);
});

// ============================================================
// 🖱️ MANEJO DE BOTONES (CALLBACK QUERIES)
// ============================================================
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const userId = query.from.id;
    const data = query.data;

    // Los botones también exigen ser admin (antes solo se validaban los mensajes de texto)
    if (!esAdmin(userId)) {
        console.log(`⛔ Botón rechazado, usuario no autorizado: ${userId}`);
        bot.answerCallbackQuery(query.id, { text: '⛔ No autorizado.', show_alert: true }).catch(() => {});
        return;
    }

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
            await bot.editMessageText(`🔧 *Tipo de Mantenimiento*\n\n¿Qué tipo de reporte deseas realizar para esta máquina?`, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: menus.getMttoTipoKeyboard(id)
            });
        }

        if (data.startsWith('maquina_tipo_')) {
            // Formato: maquina_tipo_{Tipo}_{Id}
            const partes = data.split('_');
            const tipo = partes[2];
            const id = partes[3];

            const { data: m } = await supabase.from('maquinas').select('nombre').eq('id', id).single();
            if (m) {
                userStates[userId] = { 
                    state: 'ESPERANDO_MTTO', 
                    machineName: m.nombre,
                    mttoType: tipo 
                };
                
                let emoji = tipo === 'Correctivo' ? '🔴' : (tipo === 'Preventivo' ? '🟡' : '🟢');
                
                await bot.editMessageText(`${emoji} *Reporte: ${tipo} (${m.nombre})*\n\nPor favor, escribe el detalle del trabajo o la novedad encontrada.`, {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                    reply_markup: menus.backToMaquinasKeyboard
                });
            }
        }

        // G. IA CHAT (MODO MANTENIMIENTO)
        if (data === 'menu_ia') {
            userStates[userId] = { state: 'CHAT_IA' }; // Activar estado
            await bot.editMessageText(`🤖 *Chat con IA (Black Cat Agent)*\n\n¡Hola! Estoy usando el servidor local de tu PC. Puedes preguntarme sobre la fábrica, consultar deudas, inventario o máquinas.\n\nEscribe tu pregunta aquí abajo o envía \`/salir\` para volver al menú.`, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
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
