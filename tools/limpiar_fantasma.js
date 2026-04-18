const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jgvnqumkzfwruhjglics.supabase.co';
const supabaseKey = 'sb_publishable_XXDhaCrrjj_DVUdxh04wFg_9dwm1_jQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function limpiarFantasma() {
    console.log("Limpiando orden 13 que entró incompleta...");
    
    // 1. Limpiar Nómina de René producida hoy
    await supabase.from('produccion_fabriquines')
        .delete().ilike('usuario', 'rene').eq('estado', 'PENDIENTE');
    
    // 2. Limpiar Movimientos de tabacos fantasma de esta orden
    const { data: movs } = await supabase.from('movimientos')
        .select('*').ilike('descripcion', '%Orden #13%').eq('tipo_movimiento', 'ENTRADA');
        
    let tabacosRestar = 0;
    if (movs && movs.length > 0) {
        for (let m of movs) {
            tabacosRestar += m.cantidad;
            await supabase.from('movimientos').delete().eq('id', m.id);
        }
    }

    // 3. Restar del inventario general si se sumaron
    if (tabacosRestar > 0) {
        const { data: inv } = await supabase.from('inventario').select('*').ilike('material', 'Tabacos').single();
        if (inv) {
            await supabase.from('inventario').update({ cantidad: inv.cantidad - tabacosRestar }).eq('id', inv.id);
        }
    }

    console.log("Lista. René vuelve a $0 COP pendientes y el Kardex está limpio.");
    process.exit(0);
}

limpiarFantasma();
