const { createClient } = require('@supabase/supabase-js');

// Credenciales oficiales Gato Negro recuperadas de server.js
const supabaseUrl = 'https://jgvnqumkzfwruhjglics.supabase.co';
const supabaseKey = 'sb_publishable_XXDhaCrrjj_DVUdxh04wFg_9dwm1_jQ';
const supabase = createClient(supabaseUrl, supabaseKey);

// Las 28 máquinas transcritas exactamente del Excel para ahorrarle el trabajo al jefe
const maquinas = [
  { nombre: "HORNO GARDAI", marca: "ARENCO", modelo: "Caldera", fabricante: "ALEMANIA", codigo: "SE-HG-04", observaciones: "Funcional", estado: "Funcional", area: "Producción" },
  { nombre: "Destierradora", marca: "Arenco", modelo: "Destierradora", fabricante: "Alemania", codigo: "Dora-01", observaciones: "Funcional", estado: "Funcional", area: "Producción" },
  { nombre: "Humecteadora", marca: "Arenco", modelo: "Horno picanza", fabricante: "ALEMANIA", codigo: "HUM001", observaciones: "Funcional", estado: "Funcional", area: "Producción" },
  { nombre: "Enrolladora-1", marca: "Arenco", modelo: "Enrolladora", fabricante: "Alemania", codigo: "ENR-001", observaciones: "no estan funcionando", estado: "No Funcional", area: "Producción" },
  { nombre: "Enrolladora-2", marca: "Arenco", modelo: "Enrolladora", fabricante: "Alemania", codigo: "ENR-002", observaciones: "Aun no esta funcional", estado: "No Funcional", area: "Producción" },
  { nombre: "Enrolladora-3", marca: "Arenco", modelo: "Enrolladora", fabricante: "Alemania", codigo: "ENR-003", observaciones: "No estan en funcionamiento", estado: "No Funcional", area: "Producción" },
  { nombre: "Enrolladora-4", marca: "Arenco", modelo: "Enrolladora", fabricante: "Alemania", codigo: "ENR-004", observaciones: "No esta funcional", estado: "No Funcional", area: "Producción" },
  { nombre: "Picadora", marca: "Arenco", modelo: "Picadora", fabricante: "Alemania", codigo: "PIC-001", observaciones: "Funcional", estado: "Funcional", area: "Producción" },
  { nombre: "Vanda Transportadora", marca: "Arenco", modelo: "Transportadora", fabricante: "Alemania", codigo: "VAN-001", observaciones: "Funcional", estado: "Funcional", area: "Producción" },
  { nombre: "Picadora 2", marca: "Arenco", modelo: "Picadora", fabricante: "Alemania", codigo: "PIC-002", observaciones: "Maquinaria guardada", estado: "Guardada", area: "Producción" },
  { nombre: "Tobacco Feed", marca: "N/A", modelo: "Tobacco Feed", fabricante: "Alemania", codigo: "TOB-001", observaciones: "Se estan haciendo pruebas", estado: "Falla Menor", area: "Producción" },
  { nombre: "Secador", marca: "Arenco", modelo: "Aromador", fabricante: "Alemania", codigo: "SEC-001", observaciones: "Se han hecho pruebas", estado: "Falla Menor", area: "Producción" },
  { nombre: "Aromador", marca: "Arenco", modelo: "Aromador", fabricante: "Alemania", codigo: "ARO-001", observaciones: "Estamos haciendo pruebas", estado: "Falla Menor", area: "Producción" },
  { nombre: "Bomba aromador", marca: "Arenco", modelo: "Bomba", fabricante: "N/A", codigo: "BAR-001", observaciones: "Funcional", estado: "Funcional", area: "Producción" },
  { nombre: "Cigarre Machine", marca: "Cigarre", modelo: "N/A", fabricante: "Alemania", codigo: "CIG-001", observaciones: "Mantenimiento", estado: "No Funcional", area: "Producción" },
  { nombre: "Compresor", marca: "N/A", modelo: "N/A", fabricante: "alemania", codigo: "COM-001", observaciones: "Funcional", estado: "Funcional", area: "Producción" },
  { nombre: "Afiladora", marca: "N/A", modelo: "Afiladora", fabricante: "N/A", codigo: "AFI-001", observaciones: "Esta en mantenimiento", estado: "No Funcional", area: "Producción" },
  { nombre: "Ventilador", marca: "Telemecanique", modelo: "N/A", fabricante: "N/A", codigo: "VEN-001", observaciones: "Funcional", estado: "Funcional", area: "Producción" },
  { nombre: "Trapichera", marca: "N/A", modelo: "Trapiche", fabricante: "N/A", codigo: "TRA-001", observaciones: "Funcional", estado: "Funcional", area: "Producción" },
  { nombre: "Planta", marca: "AOSIF", modelo: "AC83", fabricante: "N/A", codigo: "2206387505", observaciones: "Su uso es relativo", estado: "Funcional", area: "Planta" },
  { nombre: "Camion 2005", marca: "CHEVROLET", modelo: "NPR", fabricante: "Venezuela", codigo: "A81BIOS", observaciones: "Funcional", estado: "Funcional", area: "Transporte" },
  { nombre: "Camion 2009", marca: "CHEVROLET", modelo: "NPR", fabricante: "Venezuela", codigo: "AF4AL6A", observaciones: "Funcional", estado: "Funcional", area: "Transporte" },
  { nombre: "Camion 1721", marca: "FORT", modelo: "FORT1721", fabricante: "Venezuela", codigo: "A32CEOA", observaciones: "Funcional", estado: "Funcional", area: "Transporte" },
  { nombre: "Camion 2008", marca: "Chevrolet", modelo: "NPR", fabricante: "Venezuela", codigo: "A33AB8G", observaciones: "Funcional", estado: "Funcional", area: "Transporte" },
  { nombre: "Enrolladora-5", marca: "Arenco", modelo: "Enrolladora", fabricante: "Alemania", codigo: "ENR-005", observaciones: "No funcional", estado: "No Funcional", area: "Producción" },
  { nombre: "Enrolladora-6", marca: "Arenco", modelo: "Enrolladora", fabricante: "Alemania", codigo: "ENR-006", observaciones: "No funcional", estado: "No Funcional", area: "Producción" },
  { nombre: "Clasificadora de picadura", marca: "Arenco", modelo: "N/A", fabricante: "Alemania", codigo: "CLA-001", observaciones: "Guardada", estado: "Guardada", area: "Producción" },
  { nombre: "Saranda", marca: "Arenco", modelo: "N/A", fabricante: "N/A", codigo: "SAR-001", observaciones: "Guardada", estado: "Guardada", area: "Producción" }
];

async function importar() {
    console.log("🚀 Iniciando inyección masiva de 28 máquinas en Supabase...");
    let exitos = 0;
    
    for (const m of maquinas) {
        // Valores default inteligentes
        m.horas_dia = 8;
        m.frecuencia_mtto_dias = 30;

        const { data, error } = await supabase.from('maquinas').insert([m]);
        
        if (error) {
            console.error(`❌ Error con ${m.nombre}:`, error.message);
        } else {
            console.log(`✅ Creada: ${m.nombre} (${m.estado})`);
            exitos++;
        }
    }
    
    console.log(`\n🎉 Operación limpia. ${exitos}/${maquinas.length} máquinas guardadas.`);
    process.exit(0);
}

importar();
