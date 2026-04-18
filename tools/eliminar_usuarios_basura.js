const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://jgvnqumkzfwruhjglics.supabase.co';
const supabaseKey = 'sb_publishable_XXDhaCrrjj_DVUdxh04wFg_9dwm1_jQ'; 
const supabase = createClient(supabaseUrl, supabaseKey);

const basuras = [
  'fecha:', 'nombre fabriquin:', 'capote', 'picadura', 'cestas', 
  'periodico', 'trapos', 'resortes', 'maq. rolleras', 'pacoras', 
  'cortadores', 'cuchillas', 'prestamos', 'rezagos'
];

async function limpiar() {
    console.log("Iniciando purga de usuarios basura...");
    for (const b of basuras) {
        const { error } = await supabase.from('usuarios').delete().eq('usuario', b);
        if (error) {
            console.error(`Error eliminando ${b}:`, error);
        } else {
            console.log(`🗑️ Eliminado: ${b}`);
        }
    }
    console.log("¡Limpieza Terminada!");
}

limpiar();
