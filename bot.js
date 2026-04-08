const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { createClient } = require('@supabase/supabase-js');

// --- CONFIGURACIÓN DE SUPABASE ---
const supabaseUrl = 'https://jgvnqumkzfwruhjglics.supabase.co';
const supabaseKey = 'sb_publishable_XXDhaCrrjj_DVUdxh04wFg_9dwm1_jQ'; // Usando la misma del server por ahora
const supabase = createClient(supabaseUrl, supabaseKey);

// --- INICIALIZACIÓN DEL BOT ---
const client = new Client({
    authStrategy: new LocalAuth(), // Guarda la sesión para no escanear QR siempre
    puppeteer: {
        handleSIGINT: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Evento: Generar QR en la terminal
client.on('qr', (qr) => {
    console.log('🐈‍⬛ [BCB] ¡ESCANEAME PARA ACTIVAR AL GATO!');
    qrcode.generate(qr, { small: true });
});

// Evento: Bot listo
client.on('ready', () => {
    console.log('✅ ¡Black Cat Bot (BCB) está online y listo para el patrón!');
});

// --- CONFIGURACIÓN DE SEGURIDAD (ADMINS) ---
// Agrega aquí los números de teléfono de los patrones (con el código de país, ej: '573123456789@c.us')
const ADMIN_WHITELIST = [
    '573124567890@c.us', // Reemplazar por los números reales
    '584124567890@c.us'
];

function isAdmin(number) {
    // Para pruebas, si la lista está vacía, todos son admins
    if (ADMIN_WHITELIST.length === 0) return true;
    return ADMIN_WHITELIST.includes(number);
}

// ⏱️ HORA UNIFICADA (COL/VEN)
function getGatoTime() {
    const ahora = new Date();
    const opciones = { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' };
    const fecha = new Intl.DateTimeFormat('en-CA', opciones).format(ahora); 
    return fecha;
}

// Evento: Mensaje recibido
client.on('message', async (msg) => {
    const from = msg.from;
    const text = msg.body.toLowerCase();

    // 1. FILTRO DE SEGURIDAD
    if (!isAdmin(from)) {
        // Opcional: ignorar o avisar
        return; 
    }

    // --- COMANDOS DE PRUEBA ---
    if (text === 'hola gato' || text === 'gato') {
        msg.reply('🐾 ¡Miau! Soy el *Black Cat Bot (BCB)*. Estoy listo para el reporte de producción y maquinaria.\n\nEscríbeme "Ayuda" para ver mis comandos.');
    }

    if (text === 'ayuda') {
        msg.reply('📖 *Comandos Disponibles:*\n\n' +
                  '📊 *Reporte Maquinaria* -> Resumen de salud de los equipos.\n' +
                  '💰 *Deuda [Código]* -> Consulta deuda de un fabriquin (Ej: Deuda F11).\n' +
                  '🛠️ *Pendientes* -> Lista de mantenimientos que tocan hoy.');
    }

    // --- COMANDO: REPORTE MAQUINARIA ---
    if (text === 'reporte maquinaria' || text === 'maquinas') {
        try {
            const { data: maquinas } = await supabase.from('maquinas').select('*');
            if (!maquinas) return msg.reply('❌ No pude acceder a la lista de máquinas.');

            let funcionales = 0;
            let fallas = 0;
            let atrasados = 0;
            const hoy = new Date();

            maquinas.forEach(m => {
                if (m.estado === 'Funcional') funcionales++;
                else fallas++;

                if (m.ultimo_mtto) {
                    const last = new Date(m.ultimo_mtto + 'T00:00:00');
                    const diff = Math.floor((hoy - last) / (1000 * 60 * 60 * 24));
                    if (diff >= (m.frecuencia_mtto_dias || 30)) atrasados++;
                }
            });

            msg.reply(`⚙️ *Resumen de Planta (${getGatoTime()}):*\n\n` +
                      `✅ Funcionales: ${funcionales}\n` +
                      `⚠️ Fallas/Mal estado: ${fallas}\n` +
                      `🚨 Mtto Atrasado: *${atrasados} máquinas*\n\n` +
                      `Para ver detalles escribe "Pendientes".`);
        } catch (e) {
            msg.reply('❌ Error al consultar maquinaria.');
        }
    }

    // --- COMANDO: CONSULTA DEUDA ---
    if (text.startsWith('deuda ')) {
        const codigo = text.split(' ')[1].toUpperCase();
        try {
            // 1. Buscar al empleado por código
            const { data: emp } = await supabase.from('empleados_fabriquines').select('*').eq('codigo', codigo).single();
            if (!emp) return msg.reply(`❌ No encontré al empleado con código ${codigo}.`);

            // 2. Buscar deuda financiera (Vales)
            const { data: deudas } = await supabase.from('deudores_fabriquines').select('monto_deuda').eq('usuario', `${emp.codigo} - ${emp.nombre}`).eq('estado', 'ACTIVA');
            
            let totalPlata = 0;
            if (deudas) deudas.forEach(d => totalPlata += parseFloat(d.monto_deuda || 0));

            msg.reply(`👤 *Ficha de ${emp.nombre} (${emp.codigo}):*\n\n` +
                      `🧺 *Deuda Tabacos:* ${emp.deuda_tabacos.toLocaleString()} u\n` +
                      `💵 *Deuda Vales:* $${totalPlata.toLocaleString('es-CO')} COP\n\n` +
                      `_Actualizado el ${getGatoTime()}_`);
        } catch (e) {
            msg.reply('❌ Error al consultar la deuda.');
        }
    }

    // --- COMANDO: PENDIENTES ---
    if (text === 'pendientes') {
        try {
            const { data: maquinas } = await supabase.from('maquinas').select('*');
            if (!maquinas) return msg.reply('❌ No pude acceder a la lista.');

            let lista = '🛠️ *Equipos con Atención Pendiente:* \n\n';
            let hayPendientes = false;
            const hoy = new Date();

            maquinas.forEach(m => {
                let atrasada = false;
                if (m.ultimo_mtto) {
                    const last = new Date(m.ultimo_mtto + 'T00:00:00');
                    const diff = Math.floor((hoy - last) / (1000 * 60 * 60 * 24));
                    if (diff >= (m.frecuencia_mtto_dias || 30)) atrasada = true;
                } else {
                    atrasada = true;
                }

                if (atrasada || m.estado !== 'Funcional') {
                    hayPendientes = true;
                    lista += `• *${m.nombre}* (${m.codigo})\n` +
                             `  Estado: ${m.estado}\n` +
                             `  Motivo: ${atrasada ? 'MANTENIMIENTO ATRASADO 🚨' : 'Falla Reportada ⚠️'}\n\n`;
                }
            });

            if (!hayPendientes) return msg.reply('✨ ¡Todo al día! No hay máquinas con pendientes hoy.');
            msg.reply(lista);
        } catch (e) {
            msg.reply('❌ Error al consultar pendientes.');
        }
    }
});

// Iniciar cliente
console.log('🚀 Iniciando Black Cat Bot...');
client.initialize();
