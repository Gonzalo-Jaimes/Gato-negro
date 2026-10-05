const express = require('express');
const router = express.Router();
const { supabase, mostrarAlerta, obtenerHoraColombia } = require('../lib/shared');
const { isAdmin } = require('../lib/middleware');

// ---------------- RECEPCIÓN (SEMANAL) ----------------
router.get('/empacadores/recepcion', isAdmin, async (req, res) => {
    try {
        // Obtenemos todos los empleados que puedan empacar
        // (Por ahora tomamos de anilladores ya que comparten roles, 
        // pero podemos filtrarlos por una columna o simplemente mostrar todos)
        const { data: empleados } = await supabase.from('empleados_empacadores').select('*').order('nombre');
        
        const { data: registros } = await supabase.from('recepcion_empacadores').select('*').eq('estado', 'pendiente');
        
        res.render('produccion/empaque_recepcion', { 
            empleados: empleados || [],
            registros: registros || []
        });
    } catch (err) {
        console.error("Error en recepción empacadores:", err);
        res.status(500).send("Error interno.");
    }
});

// ---------------- RECEPCIÓN (GUARDAR DIARIO) ----------------
router.post('/empacadores/recepcion_guardar', isAdmin, async (req, res) => {
    const { empleado_id, registro_id } = req.body;
    const tiempo = obtenerHoraColombia();

    const campos = {
        empleado_id,
        lun_bultos_25: parseInt(req.body.lun_bultos_25) || 0, mar_bultos_25: parseInt(req.body.mar_bultos_25) || 0,
        mie_bultos_25: parseInt(req.body.mie_bultos_25) || 0, jue_bultos_25: parseInt(req.body.jue_bultos_25) || 0,
        vie_bultos_25: parseInt(req.body.vie_bultos_25) || 0, sab_bultos_25: parseInt(req.body.sab_bultos_25) || 0,
        lun_bultos_50: parseInt(req.body.lun_bultos_50) || 0, mar_bultos_50: parseInt(req.body.mar_bultos_50) || 0,
        mie_bultos_50: parseInt(req.body.mie_bultos_50) || 0, jue_bultos_50: parseInt(req.body.jue_bultos_50) || 0,
        vie_bultos_50: parseInt(req.body.vie_bultos_50) || 0, sab_bultos_50: parseInt(req.body.sab_bultos_50) || 0,
        lun_cajas_25: parseInt(req.body.lun_cajas_25) || 0, mar_cajas_25: parseInt(req.body.mar_cajas_25) || 0,
        mie_cajas_25: parseInt(req.body.mie_cajas_25) || 0, jue_cajas_25: parseInt(req.body.jue_cajas_25) || 0,
        vie_cajas_25: parseInt(req.body.vie_cajas_25) || 0, sab_cajas_25: parseInt(req.body.sab_cajas_25) || 0,
        lun_cajas_50: parseInt(req.body.lun_cajas_50) || 0, mar_cajas_50: parseInt(req.body.mar_cajas_50) || 0,
        mie_cajas_50: parseInt(req.body.mie_cajas_50) || 0, jue_cajas_50: parseInt(req.body.jue_cajas_50) || 0,
        vie_cajas_50: parseInt(req.body.vie_cajas_50) || 0, sab_cajas_50: parseInt(req.body.sab_cajas_50) || 0,
        precio_bulto_25: parseInt(req.body.precio_bulto_25) || 11, // Equivalente a 11000 por millar
        precio_bulto_50: parseInt(req.body.precio_bulto_50) || 11,
        estado: 'pendiente'
    };

    try {
        if (registro_id && registro_id !== '') {
            await supabase.from('recepcion_empacadores').update(campos).eq('id', registro_id);
        } else {
            campos.semana_inicio = tiempo.fecha;
            await supabase.from('recepcion_empacadores').insert([campos]);
        }
        res.redirect('/empacadores/recepcion');
    } catch(e) {
        console.error(e);
        res.send(mostrarAlerta('Error', 'Fallo al guardar recepción de empacadores', 'error'));
    }
});

// ---------------- LIQUIDAR SEMANA ----------------
router.post('/empacadores/liquidar_semana/:id', isAdmin, async (req, res) => {
    const regId = req.params.id;
    const tiempo = obtenerHoraColombia();
    
    try {
        const { data: reg } = await supabase.from('recepcion_empacadores').select('*, empleados_empacadores(*)').eq('id', regId).single();
        if (!reg) return res.send(mostrarAlerta('Error', 'Registro no encontrado.', 'error'));
        
        const emp = reg.empleados_empacadores;
        
        const totalBultos25 = reg.lun_bultos_25 + reg.mar_bultos_25 + reg.mie_bultos_25 + reg.jue_bultos_25 + reg.vie_bultos_25 + reg.sab_bultos_25;
        const totalBultos50 = reg.lun_bultos_50 + reg.mar_bultos_50 + reg.mie_bultos_50 + reg.jue_bultos_50 + reg.vie_bultos_50 + reg.sab_bultos_50;
        
        const totalCajas25 = (reg.lun_cajas_25||0) + (reg.mar_cajas_25||0) + (reg.mie_cajas_25||0) + (reg.jue_cajas_25||0) + (reg.vie_cajas_25||0) + (reg.sab_cajas_25||0);
        const totalCajas50 = (reg.lun_cajas_50||0) + (reg.mar_cajas_50||0) + (reg.mie_cajas_50||0) + (reg.jue_cajas_50||0) + (reg.vie_cajas_50||0) + (reg.sab_cajas_50||0);
        
        // 1 bulto 25 = 2100 tabacos (84 cajas de 25)
        // 1 bulto 50 = 2100 tabacos (42 cajas de 50)
        // 1 caja 25 = 25 tabacos
        // 1 caja 50 = 50 tabacos
        const totalTabacos = (totalBultos25 * 2100) + (totalBultos50 * 2100) + (totalCajas25 * 25) + (totalCajas50 * 50);

        // Por ahora, solo lo marcamos liquidado.
        
        await supabase.from('recepcion_empacadores').update({ estado: 'liquidado' }).eq('id', regId);

        res.send(mostrarAlerta('Éxito', `Semana liquidada correctamente para ${emp.nombre}. Total: ${totalTabacos.toLocaleString('es-CO')} tabacos.`, 'success', '/empacadores/recepcion'));
    } catch(e) {
        console.error(e);
        res.send(mostrarAlerta('Error', 'Fallo al liquidar', 'error'));
    }
});

module.exports = router;
