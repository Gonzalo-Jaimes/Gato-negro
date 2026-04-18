const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://jgvnqumkzfwruhjglics.supabase.co';
const supabaseKey = 'sb_publishable_XXDhaCrrjj_DVUdxh04wFg_9dwm1_jQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function purgarDuplicados() {
    console.log("Iniciando purga de MÚLTIPLES clones de Tabacos...");

    const { data: inv } = await supabase.from('inventario').select('*');
    
    // Agrupar por nombre de material
    let agrupado = {};
    for (let item of inv) {
        const nombre = item.material.trim();
        if(!agrupado[nombre]) agrupado[nombre] = [];
        agrupado[nombre].push(item);
    }
    
    // Procesar cada grupo donde hay más de 1 id
    for (let material in agrupado) {
        if (agrupado[material].length > 1) {
            console.log(`Fusionando ${agrupado[material].length} registros de ${material}...`);
            let total = 0;
            let idsABorrar = [];
            let idMaestro = agrupado[material][0].id; // el primero q encontremos será el rey
            
            for (let i = 0; i < agrupado[material].length; i++) {
                total += agrupado[material][i].cantidad;
                if(i !== 0) idsABorrar.push(agrupado[material][i].id);
            }
            
            // Actualizar al rey
            await supabase.from('inventario').update({ cantidad: total }).eq('id', idMaestro);
            
            // Borrar los clones
            for(let idB of idsABorrar) {
                await supabase.from('inventario').delete().eq('id', idB);
            }
            console.log(`✅ ${material} unificado en ID ${idMaestro} con cantidad total ${total}. Se borraron ${idsABorrar.length} clones.`);
        }
    }
    
    console.log("¡PURGA FINALIZADA CON ÉXITO!");
}

purgarDuplicados();
