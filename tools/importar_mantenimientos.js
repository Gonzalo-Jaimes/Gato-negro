const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jgvnqumkzfwruhjglics.supabase.co';
const supabaseKey = 'sb_publishable_XXDhaCrrjj_DVUdxh04wFg_9dwm1_jQ';
const supabase = createClient(supabaseUrl, supabaseKey);

// Historial transcrito del Excel de Gato Negro
const mantenimientos = [
{ fecha: '2024-01-19', hora: '09:17', maquina: 'Enrolladora-1', tipo: 'Preventivo', descripcion: 'Limpieza, engrasado, automatizacion', tiempo_min: 60, costo_mo: 90, costo_mat: 0, hecho_por: 'Dairon', estado: 'REALIZADO' },
{ fecha: '2024-05-11', hora: '08:33', maquina: 'Picadora', tipo: 'Preventivo', descripcion: 'Limpieza, engrasado y cambio de piezas', tiempo_min: 120, costo_mo: 21, costo_mat: 0, hecho_por: 'Manuel', estado: 'REALIZADO' },
{ fecha: '2024-05-11', hora: '09:08', maquina: 'Humecteadora', tipo: 'Preventivo', descripcion: 'Limpieza, se ajusto el quemador', tiempo_min: 120, costo_mo: 21, costo_mat: 0, hecho_por: 'Manuel', estado: 'REALIZADO' },
{ fecha: '2024-05-11', hora: '09:13', maquina: 'Vanda Transportadora', tipo: 'Preventivo', descripcion: 'Limpieza y engrasado', tiempo_min: 60, costo_mo: 21, costo_mat: 0, hecho_por: 'Manuel', estado: 'REALIZADO' },
{ fecha: '2024-05-17', hora: '08:23', maquina: 'Planta', tipo: 'Preventivo', descripcion: 'Se hizo limpieza, cambio de aceite y filtros', tiempo_min: 120, costo_mo: 90, costo_mat: 0, hecho_por: 'Manuel', estado: 'REALIZADO' },
{ fecha: '2024-06-01', hora: '08:33', maquina: 'Picadora', tipo: 'Preventivo', descripcion: 'Limpieza, engrasado y cambio de desgaste', tiempo_min: 120, costo_mo: 21, costo_mat: 0, hecho_por: 'Manuel', estado: 'REALIZADO' },
{ fecha: '2024-06-01', hora: '09:08', maquina: 'Humecteadora', tipo: 'Preventivo', descripcion: 'Limpieza, se ajusto quemador', tiempo_min: 120, costo_mo: 21, costo_mat: 0, hecho_por: 'Manuel', estado: 'REALIZADO' },
{ fecha: '2024-06-01', hora: '09:13', maquina: 'Vanda Transportadora', tipo: 'Preventivo', descripcion: 'Limpieza y engrasado', tiempo_min: 60, costo_mo: 21, costo_mat: 0, hecho_por: 'Manuel', estado: 'REALIZADO' },
{ fecha: '2024-06-17', hora: '09:17', maquina: 'Enrolladora-1', tipo: 'Preventivo', descripcion: 'Limpieza, engrasado, automatizacion', tiempo_min: 60, costo_mo: 90, costo_mat: 0, hecho_por: 'Dairon', estado: 'REALIZADO' },
{ fecha: '2024-06-22', hora: '09:08', maquina: 'Humecteadora', tipo: 'Preventivo', descripcion: 'Limpieza, se ajusto el quemador', tiempo_min: 120, costo_mo: 21, costo_mat: 0, hecho_por: 'Manuel', estado: 'REALIZADO' },
{ fecha: '2024-06-22', hora: '08:33', maquina: 'Picadora', tipo: 'Preventivo', descripcion: 'Limpieza, engrasado y cambio de piezas', tiempo_min: 120, costo_mo: 21, costo_mat: 0, hecho_por: 'Manuel', estado: 'REALIZADO' },
{ fecha: '2024-06-22', hora: '09:13', maquina: 'Vanda Transportadora', tipo: 'Preventivo', descripcion: 'Limpieza y engrasado', tiempo_min: 60, costo_mo: 21, costo_mat: 0, hecho_por: 'Manuel', estado: 'REALIZADO' },
{ fecha: '2024-06-21', hora: '07:44', maquina: 'Compresor', tipo: 'Preventivo', descripcion: 'Limpieza y engrase', tiempo_min: 120, costo_mo: 180, costo_mat: 0, hecho_por: 'Manuel', estado: 'REALIZADO' },
{ fecha: '2024-06-28', hora: '08:55', maquina: 'Camion 2005', tipo: 'Correctivo', descripcion: 'Arreglo de luces', tiempo_min: 120, costo_mo: 0, costo_mat: 70000, hecho_por: 'Pacho Electricista', estado: 'REALIZADO' },
{ fecha: '2024-07-13', hora: '09:08', maquina: 'Secador', tipo: 'Preventivo', descripcion: 'Limpieza, se ajusto el quemador', tiempo_min: 120, costo_mo: 21, costo_mat: 0, hecho_por: 'Manuel', estado: 'REALIZADO' },
{ fecha: '2024-08-15', hora: '08:23', maquina: 'Planta', tipo: 'Preventivo', descripcion: 'Limpieza general, cambio de aceites', tiempo_min: 120, costo_mo: 90, costo_mat: 0, hecho_por: 'Manuel', estado: 'REALIZADO' },
{ fecha: '2024-08-19', hora: '09:49', maquina: 'Destierradora', tipo: 'Preventivo', descripcion: 'Limpieza', tiempo_min: 60, costo_mo: 90, costo_mat: 0, hecho_por: 'Gonzalo A', estado: 'REALIZADO' },
{ fecha: '2024-12-21', hora: '07:44', maquina: 'Compresor', tipo: 'Preventivo', descripcion: 'Limpieza y engrase', tiempo_min: 120, costo_mo: 180, costo_mat: 0, hecho_por: 'Manuel', estado: 'REALIZADO' },
{ fecha: '2024-07-01', hora: '13:03', maquina: 'Camion 2005', tipo: 'Correctivo', descripcion: 'Cambio de aceite', tiempo_min: 20, costo_mo: 0, costo_mat: 0, hecho_por: 'Carlos', estado: 'REALIZADO' },
{ fecha: '2024-07-01', hora: '09:39', maquina: 'Camion 2005', tipo: 'Correctivo', descripcion: 'Portafusible y fusible, bombillo', tiempo_min: 240, costo_mo: 0, costo_mat: 150000, hecho_por: 'Pacho Electricista', estado: 'REALIZADO' },
{ fecha: '2024-12-19', hora: '09:49', maquina: 'Destierradora', tipo: 'Preventivo', descripcion: 'limpieza', tiempo_min: 60, costo_mo: 90, costo_mat: 0, hecho_por: 'Gonzalo A.', estado: 'REALIZADO' }
];

async function importar() {
    console.log("🛠️ Inyectando 21 registros de Mantenimiento Histórico...");
    let exitos = 0;
    
    // Objeto para llevar cuenta de la fecha más reciente de preventivo para cada máquina
    const ultimosPreventivos = {};

    for (const mtto of mantenimientos) {
        const { error } = await supabase.from('mantenimiento').insert([mtto]);
        
        if (error) {
            console.error(`❌ Error en registro de ${mtto.maquina}:`, error.message);
        } else {
            console.log(`✅ Registro de ${mtto.maquina} importado (${mtto.fecha})`);
            exitos++;
            
            // Lógica inteligente: registrar el preventivo más reciente
            if (mtto.tipo === 'Preventivo') {
                if (!ultimosPreventivos[mtto.maquina] || mtto.fecha > ultimosPreventivos[mtto.maquina]) {
                    ultimosPreventivos[mtto.maquina] = mtto.fecha;
                }
            }
        }
    }

    console.log("\n🔄 Actualizando fechas de máquinas en base a los históricos...");
    for (const [maquina, fechaStr] of Object.entries(ultimosPreventivos)) {
        await supabase.from('maquinas').update({ ultimo_mtto: fechaStr }).eq('nombre', maquina);
        console.log(`   🔸 Máquina ${maquina} último preventivo ajustado a: ${fechaStr}`);
    }
    
    console.log(`\n🎉 Operación completa. ${exitos} registros inyectados. Las fechas de prevención están sincronizadas.`);
    process.exit(0);
}

importar();
