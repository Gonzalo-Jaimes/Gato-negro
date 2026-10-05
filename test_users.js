const { supabase } = require('./src/lib/shared.js');

async function checkUsuarios() {
    console.log("Checking usuarios...");
    const { data, error } = await supabase.from('usuarios').select('*');
    if (error) console.error("Error:", error.message);
    else console.log(data);
}

checkUsuarios();
