const express = require('express');
const router = express.Router();
const { supabase, mostrarAlerta, obtenerHoraColombia } = require('../lib/shared');
const { isAdmin } = require('../lib/middleware');

// --- REDIRECCIÓN PARA EVITAR CRASH DEL NAVEGADOR ---
router.get('/anilladores/dashboard', (req, res) => res.redirect('/anilladores/inventario'));

// ---------------- INVENTARIO Y PERSONAL ----------------
router.get('/anilladores/inventario', isAdmin, async (req, res) => {
    const { data: empleados } = await supabase.from('empleados_anilladores').select('*').order('nombre');
    const { data: insumos } = await supabase.from('inventario_insumos_graficos').select('*').order('material');
        
    res.render('produccion/anilladores_inventario', { 
        empleados: empleados || [], 
        insumos: insumos || []
    });
});

// ---------------- DESPACHO ----------------
router.get('/anilladores/despacho', isAdmin, async (req, res) => {
    const { data: empleados } = await supabase.from('empleados_anilladores').select('*').order('nombre');
    res.render('produccion/anilladores_despacho', { empleados: empleados || [] });
});

// ---------------- RECEPCIÓN (SEMANAL) ----------------
router.get('/anilladores/recepcion', isAdmin, async (req, res) => {
    try {
        const { data: empleados } = await supabase.from('empleados_anilladores').select('*').order('nombre');
        const { data: registros } = await supabase.from('recepcion_diaria_anilladores').select('*').eq('estado', 'pendiente');
        
        res.render('produccion/anilladores_recepcion', { 
            empleados: empleados || [],
            registros: registros || []
        });
    } catch (err) {
        console.error("Error en recepción anilladores:", err);
        res.status(500).send("Error interno.");
    }
});

// ---------------- GESTIÓN DE EMPLEADOS ----------------
router.post('/api/anilladores/empleados', isAdmin, async (req, res) => {
    const { nombre, cedula } = req.body;
    try {
        await supabase.from('empleados_anilladores').insert([{ nombre, cedula }]);
        res.redirect('/anilladores/inventario?ok=empleado_creado');
    } catch(e) {
        res.redirect('/anilladores/inventario?error=crear_empleado');
    }
});

// ---------------- DESPACHO (ASIGNAR TRABAJO) ----------------
router.post('/api/anilladores/despachar', isAdmin, async (req, res) => {
    const { empleado_id, cantidad_tabacos, modelo_anillo, cantidad_anillos, cantidad_pega } = req.body;
    const tabacos = parseInt(cantidad_tabacos) || 0;
    // Cada unidad ingresada en la UI son 500 anillos
    const anillosTotales = (parseInt(cantidad_anillos) || 0) * 500;
    const pega = parseInt(cantidad_pega) || 0;

    if (!empleado_id || tabacos <= 0 || anillosTotales <= 0 || !modelo_anillo) {
        return res.send(mostrarAlerta('Error', 'Datos inválidos o en cero.', 'error'));
    }

    try {
        const marca = modelo_anillo.includes('Intabaca') ? 'Intabaca' : 'Gato';
        const matEnvueltos = `Tabacos Envueltos (${marca})`;
        
        // Validar inventario de Tabacos Envueltos
        const { data: invTabacos } = await supabase.from('inventario').select('*').eq('material', matEnvueltos).single();
        if (!invTabacos || invTabacos.cantidad < tabacos) {
            return res.send(mostrarAlerta('Error', `No hay suficientes ${matEnvueltos} en inventario. Disponibles: ${invTabacos ? invTabacos.cantidad : 0}`, 'error'));
        }

        // Validar inventario de Anillos
        const { data: invAnillos } = await supabase.from('inventario').select('*').eq('material', modelo_anillo).single();
        if (!invAnillos || invAnillos.cantidad < anillosTotales) {
            return res.send(mostrarAlerta('Error', `No hay suficientes ${modelo_anillo} en inventario. Disponibles: ${invAnillos ? invAnillos.cantidad : 0}`, 'error'));
        }

        const { data: emp } = await supabase.from('empleados_anilladores').select('*').eq('id', empleado_id).single();
        if (!emp) throw new Error("Empleado no encontrado");

        // Descontar inventarios
        await supabase.from('inventario').update({ cantidad: invTabacos.cantidad - tabacos }).eq('id', invTabacos.id);
        await supabase.from('inventario').update({ cantidad: invAnillos.cantidad - anillosTotales }).eq('id', invAnillos.id);

        const tiempo = obtenerHoraColombia();
        // Registrar salidas en Kardex
        await supabase.from('movimientos').insert([
            { fecha: tiempo.fecha, hora: tiempo.hora, tipo_movimiento: 'SALIDA', material: matEnvueltos, cantidad: tabacos, usuario: req.session.usuario || 'Admin', descripcion: `Despacho a Anillador: ${emp.nombre}` },
            { fecha: tiempo.fecha, hora: tiempo.hora, tipo_movimiento: 'SALIDA', material: modelo_anillo, cantidad: anillosTotales, usuario: req.session.usuario || 'Admin', descripcion: `Despacho a Anillador: ${emp.nombre}` }
        ]);

        // Aumentar la deuda del empleado
        await supabase.from('empleados_anilladores').update({
            deuda_tabacos: emp.deuda_tabacos + tabacos,
            deuda_anillos: emp.deuda_anillos + anillosTotales
        }).eq('id', empleado_id);

        res.send(mostrarAlerta('Éxito', `Se asignaron ${tabacos} tabacos y ${anillosTotales} anillos a ${emp.nombre}.`, 'success', '/anilladores/despacho'));
    } catch(e) {
        console.error(e);
        res.send(mostrarAlerta('Error', 'Fallo al despachar', 'error'));
    }
});

// ---------------- RECEPCIÓN (GUARDAR DIARIO) ----------------
router.post('/anilladores/recepcion_guardar', isAdmin, async (req, res) => {
    const { empleado_id, registro_id } = req.body;
    const tiempo = obtenerHoraColombia();

    const campos = {
        empleado_id,
        lun_cestas: parseInt(req.body.lun_cestas) || 0, mar_cestas: parseInt(req.body.mar_cestas) || 0,
        mie_cestas: parseInt(req.body.mie_cestas) || 0, jue_cestas: parseInt(req.body.jue_cestas) || 0,
        vie_cestas: parseInt(req.body.vie_cestas) || 0, sab_cestas: parseInt(req.body.sab_cestas) || 0,
        lun_tabacos: parseInt(req.body.lun_tabacos) || 0, mar_tabacos: parseInt(req.body.mar_tabacos) || 0,
        mie_tabacos: parseInt(req.body.mie_tabacos) || 0, jue_tabacos: parseInt(req.body.jue_tabacos) || 0,
        vie_tabacos: parseInt(req.body.vie_tabacos) || 0, sab_tabacos: parseInt(req.body.sab_tabacos) || 0,
        merma_anillos: parseInt(req.body.merma_anillos) || 0,
        merma_tabacos: parseInt(req.body.merma_tabacos) || 0,
        precio_tabaco: parseInt(req.body.precio_tabaco) || 11, // 11 por tabaco = 11000 por millar
        estado: 'pendiente'
    };

    try {
        if (registro_id && registro_id !== '') {
            await supabase.from('recepcion_diaria_anilladores').update(campos).eq('id', registro_id);
        } else {
            campos.semana_inicio = tiempo.fecha;
            await supabase.from('recepcion_diaria_anilladores').insert([campos]);
        }
        res.redirect('/anilladores/recepcion');
    } catch(e) {
        console.error(e);
        res.send(mostrarAlerta('Error', 'Fallo al guardar recepción de anilladores', 'error'));
    }
});

// ---------------- LIQUIDAR SEMANA ----------------
router.post('/anilladores/liquidar_semana/:id', isAdmin, async (req, res) => {
    const regId = req.params.id;
    const tiempo = obtenerHoraColombia();
    
    try {
        const { data: reg } = await supabase.from('recepcion_diaria_anilladores').select('*, empleados_anilladores(*)').eq('id', regId).single();
        if (!reg) return res.send(mostrarAlerta('Error', 'Registro no encontrado.', 'error'));
        
        const emp = reg.empleados_anilladores;
        const totalTabacos = reg.lun_tabacos + reg.mar_tabacos + reg.mie_tabacos + reg.jue_tabacos + reg.vie_tabacos + reg.sab_tabacos;
        const totalAnillosMerma = reg.merma_anillos || 0;
        const totalTabacosMerma = reg.merma_tabacos || 0;

        // Descontar deudas del anillador
        const nuevaDeudaTabacos = Math.max(0, emp.deuda_tabacos - (totalTabacos + totalTabacosMerma));
        const nuevaDeudaAnillos = Math.max(0, emp.deuda_anillos - (totalTabacos + totalAnillosMerma));
        
        await supabase.from('empleados_anilladores').update({
            deuda_tabacos: nuevaDeudaTabacos,
            deuda_anillos: nuevaDeudaAnillos
        }).eq('id', emp.id);

        // Aumentar en inventario global (usaremos "Tabacos Anillados (Gato)" por defecto si no se especificó marca, para esta v1.1 lo simplificamos a Gato)
        // Ya que la tabla no tiene marca, la podemos dejar por defecto o agregar luego.
        const mat = `Tabacos Anillados (Gato)`;
        const { data: invT } = await supabase.from('inventario').select('*').eq('material', mat).single();
        if (invT && totalTabacos > 0) {
            await supabase.from('inventario').update({ cantidad: invT.cantidad + totalTabacos }).eq('id', invT.id);
            await supabase.from('movimientos').insert([{ 
                fecha: tiempo.fecha, hora: tiempo.hora, 
                tipo_movimiento: 'ENTRADA', material: mat, cantidad: totalTabacos, 
                usuario: req.session.usuario || 'Admin', 
                descripcion: `Liquidación Semanal Anillador: ${emp.nombre}` 
            }]);
        }

        // Marcar semana como liquidada
        await supabase.from('recepcion_diaria_anilladores').update({ estado: 'liquidado' }).eq('id', regId);
        
        // Generar en el módulo de pagos - pendiente para nómina
        // await supabase.from('pagos_nomina').insert([...]);

        res.send(mostrarAlerta('Éxito', `Semana liquidada correctamente para ${emp.nombre}. ${totalTabacos} tabacos procesados.`, 'success', '/anilladores/recepcion'));
    } catch(e) {
        console.error(e);
        res.send(mostrarAlerta('Error', 'Fallo al liquidar', 'error'));
    }
});

module.exports = router;
