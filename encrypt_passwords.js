const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jgvnqumkzfwruhjglics.supabase.co';
const supabaseKey = 'sb_publishable_XXDhaCrrjj_DVUdxh04wFg_9dwm1_jQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function cifrarClaves() {
    console.log("Iniciando auditoria y cifrado militar de claves...");
    
    // Obtener todos los usuarios
    const { data: usuarios } = await supabase.from('usuarios').select('*');
    
    if (!usuarios) {
        console.log("Error consultando usuarios");
        return;
    }

    let modificados = 0;
    for (let u of usuarios) {
        // Bcrypt hashes format begins with $2a$, $2b$, or $2y$
        if (!u.password.startsWith('$2b$') && !u.password.startsWith('$2a$') && !u.password.startsWith('$2y$')) {
            const hash = await bcrypt.hash(u.password, 10);
            await supabase.from('usuarios').update({ password: hash }).eq('id', u.id);
            console.log(`Clave de ${u.usuario} y rol [${u.rol}] asegurada exitosamente -> ${hash}`);
            modificados++;
        } else {
            console.log(`Clave de ${u.usuario} ya estaba encriptada.`);
        }
    }
    
    console.log(`Proceso terminado. Se encriptaron ${modificados} perfiles.`);
}
cifrarClaves();
