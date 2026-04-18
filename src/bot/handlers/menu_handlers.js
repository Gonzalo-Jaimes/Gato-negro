const { supabase } = require('../../lib/shared');

/**
 * Teclado del Menú Principal
 */
const mainKeyboard = {
    inline_keyboard: [
        [
            { text: '🏭 Maquinaria', callback_data: 'menu_maquinas' },
            { text: '🧺 Fabriquines', callback_data: 'menu_fabriquines' }
        ],
        [
            { text: '💰 Finanzas / Nómina', callback_data: 'menu_finanzas' },
            { text: '🚚 Bodega / Material', callback_data: 'menu_bodega' }
        ],
        [
            { text: '🤖 Preguntar a IA (Chat)', callback_data: 'menu_chat' }
        ]
    ]
};

/**
 * Genera el menú de Maquinaria dinámicamente desde Supabase
 */
async function getMaquinasKeyboard() {
    const { data: maquinas } = await supabase.from('maquinas').select('id, nombre, estado').order('nombre');
    
    const rows = [];
    if (maquinas) {
        maquinas.forEach(m => {
            const emoji = m.estado === 'Funcional' ? '✅' : '⚠️';
            rows.push([{ text: `${emoji} ${m.nombre}`, callback_data: `maquina_ver_${m.id}` }]);
        });
    }

    rows.push([{ text: '🔄 Refrescar Lista', callback_data: 'menu_maquinas' }]);
    rows.push([{ text: '⬅️ Volver al Inicio', callback_data: 'menu_principal' }]);
    
    return { inline_keyboard: rows };
}

/**
 * Acciones para una máquina específica
 */
function getAccionesMaquina(maquinaId) {
    return {
        inline_keyboard: [
            [
                { text: '📜 Ver Ficha Completa', callback_data: `maquina_ficha_${maquinaId}` },
                { text: '🔧 Reportar Falla/Mtto', callback_data: `maquina_mtto_${maquinaId}` }
            ],
            [
                { text: '⬅️ Volver al Catálogo', callback_data: 'menu_maquinas' }
            ]
        ]
    };
}

/**
 * Menú de Fabriquines
 */
const fabriquinesKeyboard = {
    inline_keyboard: [
        [
            { text: '🧺 Ver Deudores de Tabaco', callback_data: 'fab_deudores' },
            { text: '🚚 Últimas Entregas', callback_data: 'fab_entregas' }
        ],
        [
            { text: '🗳️ Registrar Producción', callback_data: 'fab_registro_guiado' }
        ],
        [
            { text: '📄 Pedir Factura PDF', callback_data: 'fab_pdf_request' }
        ],
        [
            { text: '⬅️ Volver al Inicio', callback_data: 'menu_principal' }
        ]
    ]
};

const backToFabKeyboard = {
    inline_keyboard: [[{ text: '⬅️ Volver a Fabriquines', callback_data: 'menu_fabriquines' }]]
};

const backToMaquinasKeyboard = {
    inline_keyboard: [[{ text: '⬅️ Volver al Catálogo', callback_data: 'menu_maquinas' }]]
};

const backToMainKeyboard = {
    inline_keyboard: [[{ text: '⬅️ Volver al Inicio', callback_data: 'menu_principal' }]]
};

module.exports = {
    mainKeyboard,
    getMaquinasKeyboard,
    getAccionesMaquina,
    fabriquinesKeyboard,
    backToFabKeyboard,
    backToMaquinasKeyboard,
    backToMainKeyboard
};
