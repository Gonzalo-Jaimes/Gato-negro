// SCRIPT DE MIGRACIÓN: Excel -> Supabase
const xlsx = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

// Usar las llaves secretas del entorno
const supabaseUrl = 'https://jgvnqumkzfwruhjglics.supabase.co';
const supabaseKey = 'sb_publishable_XXDhaCrrjj_DVUdxh04wFg_9dwm1_jQ'; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrarUsuarios() {
    console.log("Leyendo Excel...");
    const wb = xlsx.readFile('documentacion/FORMATO ACTUALIZADO FABRIQUIN 2025.xlsx');
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    let usuariosAInsertar = [];

    // Suponemos que los nombres y cédulas empiezan por ahí en las celdas C y D (Viendo el dump JSON)
    // El dump muestra filas con: [ ... 'ALCIDES CORREA', 'CC-88.193.514' ]
    for(let i=0; i<data.length; i++) {
        const row = data[i];
        if(!row) continue;
        
        // Un poco de heurística para atrapar nombres (cadenas largas en mayúsculas) y cédulas
        const nombreCol = row.find(cell => typeof cell === 'string' && cell.length > 5 && cell === cell.toUpperCase() && !cell.includes('CC') && !cell.includes('V-') && !cell.includes('KG'));
        const cedulaCol = row.find(cell => typeof cell === 'string' && (cell.includes('CC') || cell.includes('V-') || cell.includes('cedula') === false));
        
        if (nombreCol && cedulaCol && !nombreCol.includes('DESCRIPCION') && !nombreCol.includes('FABRICA')) {
            let cedulaLimpia = cedulaCol.replace(/[^a-zA-Z0-9-]/g, '');
            let nombreLimpio = nombreCol.trim().toLowerCase();
            
            usuariosAInsertar.push({
                usuario: nombreLimpio,
                password: cedulaLimpia.replace(/[^0-9]/g, ''), // Contraseña = Solo números de la cédula
                rol: 'fabriquin',
                identificacion: cedulaLimpia
            });
        }
    }

    console.log(`Se encontraron ${usuariosAInsertar.length} usuarios potenciales.`);
    
    // Insertar a Supabase
    let insertados = 0;
    for(const u of usuariosAInsertar) {
        console.log(`Registrando a: ${u.usuario} (CI: ${u.identificacion})`);
        const { error } = await supabase.from('usuarios').insert([u]);
        if (!error) insertados++;
        else console.log(`Error insertando a ${u.usuario}:`, error.message);
    }
    console.log(`¡Migración Completada! Se subieron ${insertados} empleados exitosamente.`);
}

migrarUsuarios();
