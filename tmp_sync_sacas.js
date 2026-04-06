const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jgvnqumkzfwruhjglics.supabase.co';
const supabaseKey = 'sb_publishable_XXDhaCrrjj_DVUdxh04wFg_9dwm1_jQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncSacas() {
    console.log("🚀 Iniciando sincronización de Sacas entre Bodega y Global...");
    
    // 1. Obtener conteo real de `sacos_picadura` con estado 'disponible'
    const { data: sacosReales, error: errSacos } = await supabase
        .from('sacos_picadura')
        .select('peso_kg, tipo')
        .eq('estado', 'disponible');

    if (errSacos) { console.error("Error obteniendo sacos:", errSacos); return; }

    const conteoReal = {};
    for (let s of sacosReales) {
        let nombre = s.tipo === 'sobrante' ? 'Saca Picadura Sobrante' : `Saca Picadura ${s.peso_kg}kg`;
        conteoReal[nombre] = (conteoReal[nombre] || 0) + 1;
    }
    console.log("📊 Conteo Real en Bodega:", conteoReal);

    // 2. Traer la tabla principal `inventario`
    const { data: inventario, error: errInv } = await supabase.from('inventario').select('*');
    if (errInv) { console.error("Error inventario:", errInv); return; }

    // Primero, poner a 0 todas las sacas_picadura del inventario para reconstruirlas bien
    const itemsSaca = inventario.filter(i => i.material.toLowerCase().includes('saca picadura') || i.material.toLowerCase().includes('saco picadura'));
    console.log(`Borrando ${itemsSaca.length} registros antiguos de sacas en inventario...`);
    if(itemsSaca.length > 0) {
        await supabase.from('inventario').delete().in('id', itemsSaca.map(i => i.id));
    }

    // 3. Recrear el stock en `inventario` basándose en el conteo de la bodega!
    const inserts = [];
    for (let [nombre, cant] of Object.entries(conteoReal)) {
        inserts.push({
            material: nombre,
            cantidad: cant,
            categoria: 'Materia Prima'
        });
    }

    if (inserts.length > 0) {
        const { error: errInsert } = await supabase.from('inventario').insert(inserts);
        if (errInsert) console.error("❌ Error subiendo el inventario sincronizado:", errInsert);
        else console.log(`✅ ¡Inventario Global Sincronizado! Se recrearon ${inserts.length} tipos de sacas.`);
    } else {
        console.log("ℹ️ No hay sacas disponibles para sincronizar.");
    }
}

syncSacas();
