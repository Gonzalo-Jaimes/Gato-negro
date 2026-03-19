const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jgvnqumkzfwruhjglics.supabase.co';
const supabaseKey = 'sb_publishable_XXDhaCrrjj_DVUdxh04wFg_9dwm1_jQ';
const supabase = createClient(supabaseUrl, supabaseKey);

const imagenes_maquinas = {
  "HORNO GARDAI": "hor.jpg",
  "Destierradora": "4.jpg",
  "Humecteadora": "5.jpg",
  "Enrolladora-1": "6.jpg",
  "Enrolladora-2": "7.jpg",
  "Enrolladora-3": "7.jpg",
  "Enrolladora-4": "Imagen4.jpg",
  "Picadora": "8.jpg",
  "Vanda Transportadora": "9.jpg",
  "Picadora 2": "10.jpg",
  "Tobacco Feed": "11.jpg",
  "Secador": "12.jpg",
  "Aromador": "13.jpg",
  "Bomba aromador": "bomba.jpg",
  "Cigarre Machine": "cigarrete.jpg",
  "Compresor": "compresor.jpg",
  "Afiladora": "afiladora.jpg",
  "Ventilador": "ventilador.jpg",
  "Planta": "21.jpg",
  "Enrolladora-5": "26.jpg",
  "Enrolladora-6": "27.jpg",
  "Clasificadora de picadura": "28.jpg",
  "Saranda": "29.jpg"
};

async function actualizar() {
    console.log("📸 Enlazando fotografías a las máquinas en Supabase...");
    let exitos = 0;
    for (const [nombre, img] of Object.entries(imagenes_maquinas)) {
        const { error } = await supabase.from('maquinas').update({ imagen: img }).ilike('nombre', nombre);
        if (error) {
            console.error(`❌ Error en ${nombre}:`, error.message);
        } else {
            console.log(`✅ Foto asignada a ${nombre} -> ${img}`);
            exitos++;
        }
    }
    console.log(`\n🎉 Completado. ${exitos} imágenes enlazadas.`);
    process.exit(0);
}

actualizar();
