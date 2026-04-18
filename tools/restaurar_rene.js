const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jgvnqumkzfwruhjglics.supabase.co';
const supabaseKey = 'sb_publishable_XXDhaCrrjj_DVUdxh04wFg_9dwm1_jQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function restaurarPagoRene() {
    // Restaurar los 500 tabacos legítimos de la orden 13 que se borraron en la limpieza extrema
    await supabase.from('produccion_fabriquines').insert([{
        fecha: '2026-03-19',
        usuario: 'rene',
        cantidad_producida: 500,
        precio_por_unidad: 150,
        total_ganado: 500 * 150,
        estado: 'PENDIENTE'
    }]);
    console.log("René recuperó sus $75.000 COP correctamente.");
    process.exit(0);
}

restaurarPagoRene();
