const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jgvnqumkzfwruhjglics.supabase.co';
const supabaseKey = 'sb_publishable_XXDhaCrrjj_DVUdxh04wFg_9dwm1_jQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function limpiarSpam() {
    console.log("🧹 Iniciando Operación de Limpieza: Revirtiendo clics múltiples...");
    
    // 1. Limpiar Nómina Duplicada de René
    const { data: prods } = await supabase.from('produccion_fabriquines')
        .select('*').ilike('usuario', 'rene').eq('estado', 'PENDIENTE').order('id', { ascending: true });
    
    if (prods && prods.length > 1) {
        console.log(`⚠️ Se encontraron ${prods.length} registros de nómina para René. Eliminando los repetidos...`);
        // Borramos todos menos el primero (el original)
        for (let i = 1; i < prods.length; i++) {
            await supabase.from('produccion_fabriquines').delete().eq('id', prods[i].id);
        }
        console.log(`✅ Dinero en nómina revertido a la normalidad.`);
    }

    // 2. Limpiar Kardex de Inventario (Movimientos Duplicados Orden #13)
    const { data: movs } = await supabase.from('movimientos')
        .select('*').ilike('descripcion', '%Orden #13%').eq('tipo_movimiento', 'ENTRADA').order('id', { ascending: true });

    let excedenteTabacos = 0;
    if (movs && movs.length > 1) {
        console.log(`⚠️ Se detectaron ${movs.length} movimientos de inventario repetidos. Deshaciendo...`);
        for (let i = 1; i < movs.length; i++) {
            excedenteTabacos += movs[i].cantidad;
            await supabase.from('movimientos').delete().eq('id', movs[i].id);
        }
    }

    // 3. Restar el excedente artificial del inventario real
    if (excedenteTabacos > 0) {
        const { data: inv } = await supabase.from('inventario').select('*').ilike('material', 'Tabacos').single();
        if (inv) {
            await supabase.from('inventario').update({ cantidad: inv.cantidad - excedenteTabacos }).eq('id', inv.id);
            console.log(`✅ Inventario general purgado: Se restaron ${excedenteTabacos} tabacos fantasma.`);
        }
    }

    // 4. Limpiar Deudas Multiplicadas (Cestas)
    const { data: deudas } = await supabase.from('deudores_fabriquines')
        .select('*').ilike('usuario', 'rene').eq('estado', 'ACTIVA').ilike('concepto', '%Cesta%').order('id', { ascending: true });
    
    if (deudas && deudas.length > 1) {
        console.log(`⚠️ Se detectaron ${deudas.length} multas de cestas repetidas. Limpiando...`);
        for (let i = 1; i < deudas.length; i++) {
            await supabase.from('deudores_fabriquines').delete().eq('id', deudas[i].id);
        }
        console.log(`✅ Multas de cestas restauradas a 1 sola amonestación.`);
    }

    console.log("🎉 Limpieza de Base de Datos finalizada con éxito.");
    process.exit(0);
}

limpiarSpam();
