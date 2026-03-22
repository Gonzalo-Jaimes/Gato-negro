const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://jgvnqumkzfwruhjglics.supabase.co';
const supabaseKey = 'sb_publishable_XXDhaCrrjj_DVUdxh04wFg_9dwm1_jQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrarNombres() {
    console.log("Iniciando migración de 'Tabacos' a 'Tabacos Normales'...");

    // 1. Pedidos
    const { data: pedidos, error: errPed } = await supabase
        .from('pedidos')
        .update({ material: 'Tabacos Normales' })
        .eq('material', 'Tabacos');
    
    if (errPed) console.error("Error pedidos:", errPed);
    else console.log("Pedidos actualizados.");

    // 2. Inventario
    const { data: inv, error: errInv } = await supabase
        .from('inventario')
        .update({ material: 'Tabacos Normales' })
        .eq('material', 'Tabacos');
        
    if (errInv) console.error("Error inventario:", errInv);
    else console.log("Inventario actualizado.");

    // 3. Movimientos
    const { data: mov, error: errMov } = await supabase
        .from('movimientos')
        .update({ material: 'Tabacos Normales' })
        .eq('material', 'Tabacos');

    if (errMov) console.error("Error movimientos:", errMov);
    else console.log("Movimientos Kardex actualizados.");

    console.log("Migración finalizada con éxito.");
}

migrarNombres();
