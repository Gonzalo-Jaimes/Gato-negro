const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jgvnqumkzfwruhjglics.supabase.co';
const supabaseKey = 'sb_publishable_XXDhaCrrjj_DVUdxh04wFg_9dwm1_jQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function pagarAbonoFaltante() {
    console.log("Inyectando el pago de los 500 tabacos abonados de René...");
    
    await supabase.from('produccion_fabriquines').insert([{
        fecha: '2026-03-19',
        usuario: 'rene',
        cantidad_producida: 500,
        precio_por_unidad: 150,
        total_ganado: 500 * 150,
        estado: 'PENDIENTE'
    }]);

    console.log("René ha recibido sus $75.000 generados por su abono rezagado.");
    process.exit(0);
}

pagarAbonoFaltante();
