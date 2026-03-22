const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://jgvnqumkzfwruhjglics.supabase.co';
const supabaseKey = 'sb_publishable_XXDhaCrrjj_DVUdxh04wFg_9dwm1_jQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function duplicatorHunter() {
    console.log("Iniciando escaneo de tabla inventario...");
    const { data: inventario, error } = await supabase.from('inventario').select('*');
    if (error) {
        console.error("Error leyendo DB:", error);
        return;
    }
    
    // Group by case-insensitive and trimmed names
    let map = {};
    for (const item of inventario) {
        let normalizedName = item.material.trim().toLowerCase();
        if (!map[normalizedName]) map[normalizedName] = [];
        map[normalizedName].push(item);
    }

    for (const [name, items] of Object.entries(map)) {
        if (items.length > 1) {
            console.log(`🚨 Duplicados encontrados para '${name}': ${items.length} filas.`);
            let totalQty = items.reduce((sum, el) => sum + el.cantidad, 0);
            
            // Retain the first entry (primary), which usually has the best casing
            const primaryId = items[0].id;
            console.log(`   -> Fusionando cantidades a la fila principal ID [${primaryId}] con total = ${totalQty}`);
            await supabase.from('inventario').update({ cantidad: totalQty }).eq('id', primaryId);
            
            // Exterminate duplicates
            for (let i = 1; i < items.length; i++) {
                console.log(`   -> Borrando clon inútil ID [${items[i].id}]`);
                await supabase.from('inventario').delete().eq('id', items[i].id);
            }
        }
    }
    console.log("Escaneo estructural V1.7.4.4 finalizado limpiamente.");
}
duplicatorHunter();
