const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jgvnqumkzfwruhjglics.supabase.co';
const supabaseKey = 'sb_publishable_XXDhaCrrjj_DVUdxh04wFg_9dwm1_jQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixProduccion() {
    const { data: produccion } = await supabase.from('produccion_fabriquines').select('*');
    if (produccion) {
         for (let p of produccion) {
             // Si lo inflamos por accidente a 150,000, lo regresamos a 150 por tabaco
             if (p.precio_por_unidad === 150000) {
                 await supabase.from('produccion_fabriquines').update({ 
                     precio_por_unidad: 150, 
                     total_ganado: p.cantidad_producida * 150 
                 }).eq('id', p.id);
             }
         }
    }
    console.log("Corrección de tarifas de producción finalizada.");
    process.exit(0);
}

fixProduccion();
