const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

// --- CONFIGURACIÓN DE SUPABASE ---
const supabaseUrl = process.env.SUPABASE_URL || 'https://jgvnqumkzfwruhjglics.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'sb_publishable_XXDhaCrrjj_DVUdxh04wFg_9dwm1_jQ';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- UTILIDADES COMPARTIDAS ---

const mostrarAlerta = (titulo, texto, icono = 'warning', ruta = '/pedidos') => {
    return `
    <!DOCTYPE html>
    <html lang="es"><head><meta charset="UTF-8"><title>Aviso</title><script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script></head>
    <body style="background-color: #f4f6f9; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
        <script>
            document.addEventListener("DOMContentLoaded", function() {
                Swal.fire({ icon: '${icono}', title: '${titulo}', html: '${texto}', confirmButtonColor: '#111', allowOutsideClick: false })
                .then(() => { window.location.href = '${ruta}'; });
            });
        </script>
    </body></html>`;
};

function obtenerHoraColombia() {
    const ahora = new Date();
    const opcionesFecha = { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' };
    const opcionesHora = { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', hour12: false };
    const fecha = new Intl.DateTimeFormat('en-CA', opcionesFecha).format(ahora); 
    const hora = new Intl.DateTimeFormat('es-CO', opcionesHora).format(ahora); 
    return { fecha, hora };
}

async function registrarAuditoria(req, modulo, accion, detalles = {}) {
    try {
        const usuario = req.session ? (req.session.usuario || 'Desconocido') : 'SISTEMA';
        await supabase.from('auditoria_logs').insert([{ 
            usuario, modulo, accion, detalles 
        }]);
    } catch (e) {
        console.error('⚠️ Error silencioso al registrar auditoría:', e.message);
    }
}

module.exports = {
    supabase,
    bcrypt,
    mostrarAlerta,
    obtenerHoraColombia,
    registrarAuditoria
};
