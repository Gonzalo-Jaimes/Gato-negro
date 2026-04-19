const express = require('express');
const router = express.Router();
const { supabase, mostrarAlerta, obtenerHoraColombia } = require('../lib/shared');
const { isAdmin, isAuth } = require('../lib/middleware');

// ---------------- BODEGA / PICADURA ----------------

router.get('/bodega', isAdmin, async (req, res) => {
    try {
        const { data: L } = await supabase.from('lotes_picadura').select('*').order('fecha',{ascending:false}).limit(15);
        const { data: S } = await supabase.from('sacos_picadura').select('*, lotes_picadura(fecha)').eq('estado','disponible').order('numero_saco', {ascending:true});
        const { data: E } = await supabase.from('sacos_picadura').select('*, empleados_fabriquines(nombre), lotes_picadura(fecha)').eq('estado','entregado').order('fecha_entrega',{ascending:false}).limit(40);
        const { data: F } = await supabase.from('despachos_registro').select('*').in('estado',['pendiente','activo']);
        const { data: inv } = await supabase.from('inventario').select('*');

        const empIds = [...new Set((F || []).map(f => f.empleado_id).filter(id => id))];
        let empleados = [];
        if (empIds.length > 0) {
            const { data: eR } = await supabase.from('empleados_fabriquines').select('id, nombre').in('id', empIds).order('nombre');
            empleados = eR || [];
        }

        res.render('produccion/picadura', {
            lotes:           L || [],
            sacosDisponibles: S || [],
            sacosEntregados:  E || [],
            empleados:       empleados,
            facturasPend:    F || [],
            inventario:      inv || []
        });
    } catch(err) {
        res.status(500).send("Error en Bodega.");
    }
});

// ---------------- ANILLADORES Y TAREAS ----------------

router.get('/anilladores', isAdmin, async (req, res) => {
    try {
        const { data: usuariosAnilladores } = await supabase.from('usuarios').select('*').eq('rol', 'anillador');
        const { data: tareasPendientes } = await supabase.from('tareas_anilladores').select('*').eq('estado', 'pendiente').order('fecha', { ascending: false });
        const { data: tareasValidadas } = await supabase.from('tareas_anilladores').select('*').eq('estado', 'validado').order('fecha_validacion', { ascending: false }).limit(20);
        
        res.render('produccion/anilladores', { 
            usuariosAnilladores: usuariosAnilladores || [], 
            tareasPendientes:    tareasPendientes || [],
            tareasValidadas:     tareasValidadas  || []
        });
    } catch (err) {
        console.error('Error en /anilladores:', err.message);
        res.status(500).send('Error interno en Anilladores: ' + err.message);
    }
});

// ---------------- ENVOLVEDORAS ----------------

router.get('/envolvedoras', isAdmin, async (req, res) => {
    const { data: empleados } = await supabase.from('empleados_fabriquines').select('*').order('codigo');
    const { data: registros }  = await supabase.from('recepcion_envolvedoras').select('*').eq('estado', 'pendiente');
    res.render('produccion/envolvedoras', { empleados: empleados || [], registros: registros || [] });
});

module.exports = router;
