const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jgvnqumkzfwruhjglics.supabase.co';
const supabaseKey = 'sb_publishable_XXDhaCrrjj_DVUdxh04wFg_9dwm1_jQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function arreglarPesos() {
    console.log("🛠️ Revisando el historial de mantenimientos para escalar montos a miles de Pesos Colombianos...");
    
    // 1. Corregir Mantenimientos
    const { data: mttos } = await supabase.from('mantenimiento').select('*');
    let mttos_corregidos = 0;
    
    if (mttos) {
        for (let m of mttos) {
            let modificado = false;
            let updateData = {};
            
            if (m.costo_mo > 0 && m.costo_mo <= 2000) {
                updateData.costo_mo = m.costo_mo * 1000;
                modificado = true;
            }
            if (m.costo_mat > 0 && m.costo_mat <= 2000) {
                updateData.costo_mat = m.costo_mat * 1000;
                modificado = true;
            }
            
            if (modificado) {
                await supabase.from('mantenimiento').update(updateData).eq('id', m.id);
                mttos_corregidos++;
            }
        }
    }
    console.log(`✅ ${mttos_corregidos} mantenimientos corregidos multiplicados x1000.`);
    
    // 2. Corregir Producción (si algún empleado mandó tarifa incorrecta durante nuestras pruebas)
    const { data: produccion } = await supabase.from('produccion_fabriquines').select('*');
    let prod_corregidos = 0;
    if (produccion) {
         for (let p of produccion) {
              if (p.precio_por_unidad === 150) {
                   await supabase.from('produccion_fabriquines').update({ 
                       precio_por_unidad: 150000, 
                       total_ganado: p.cantidad_producida * 150000 
                   }).eq('id', p.id);
                   prod_corregidos++;
              }
         }
    }
    console.log(`✅ ${prod_corregidos} producciones corregidas a tarifa corporativa 150.000 COP.`);
    
    console.log("\n🎉 Migración a Pesos Finalizada con éxito.");
    process.exit(0);
}

arreglarPesos();
