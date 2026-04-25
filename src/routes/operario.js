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

// ---------------- ANILLADORES POST ----------------

router.post('/anilladores/crear_tarea', isAdmin, async (req, res) => {
    const { anillador_id, fabriquin_origen, cantidad_cestas, precio_cesta } = req.body;
    const { data: anilladorInfo } = await supabase.from('usuarios').select('nombre').eq('id', anillador_id).single();
    if (!anilladorInfo) return res.send(mostrarAlerta('Error', 'Anillador Inválido', 'error', '/anilladores'));
    const cant = parseFloat(cantidad_cestas);
    const precio = parseFloat(precio_cesta);
    const tiempo = obtenerHoraColombia();
    await supabase.from('tareas_anilladores').insert([{
        fecha: tiempo.fecha, hora: tiempo.hora, anillador_id, anillador_nombre: anilladorInfo.nombre,
        fabriquin_origen, cantidad_cestas: cant, precio_cesta: precio, total_ganado: cant * precio, estado: 'pendiente'
    }]);
    res.redirect('/anilladores');
});

router.post('/anilladores/validar_tarea/:id', isAdmin, async (req, res) => {
    const tareaId = req.params.id;
    const cantNum = parseFloat(req.body.cantidad_cestas);
    await supabase.from('tareas_anilladores').update({ estado: 'validada', fecha_validacion: new Date().toISOString() }).eq('id', tareaId);
    const cantTabacos = cantNum * 1250;
    const { data: invNormal } = await supabase.from('inventario').select('*').ilike('material', '%tabaco%normal%').single();
    const { data: invAnillado } = await supabase.from('inventario').select('*').ilike('material', '%tabaco%anillado%').single();
    const tiempo = obtenerHoraColombia();
    if (invNormal && invAnillado) {
        await supabase.from('inventario').update({ cantidad: Math.max(0, invNormal.cantidad - cantTabacos) }).eq('id', invNormal.id);
        await supabase.from('inventario').update({ cantidad: invAnillado.cantidad + cantTabacos }).eq('id', invAnillado.id);
        await supabase.from('movimientos').insert([{ fecha: tiempo.fecha, hora: tiempo.hora, tipo_movimiento: 'TRANSFORMACIÓN', material: 'Tabacos Anillados', cantidad: cantTabacos, usuario: req.session.usuario || 'Admin', descripcion: `Validación Tarea Anillador: ${cantNum} Cestas.` }]);
    }
    res.redirect('/anilladores');
});

// ---------------- ENVOLVEDORAS POST ----------------

router.post('/guardar_envoltedora', isAdmin, async (req, res) => {
    const empId = req.body.empleado_id;
    const regId = req.body.registro_id;
    const tiempo = obtenerHoraColombia();
    const campos = {
        empleado_id: empId, cestas_asignadas: parseInt(req.body.cestas_asignadas) || 0,
        lun_cestas_in: parseInt(req.body.lun_cestas_in) || 0, mar_cestas_in: parseInt(req.body.mar_cestas_in) || 0,
        mie_cestas_in: parseInt(req.body.mie_cestas_in) || 0, jue_cestas_in: parseInt(req.body.jue_cestas_in) || 0,
        vie_cestas_in: parseInt(req.body.vie_cestas_in) || 0, sab_cestas_in: parseInt(req.body.sab_cestas_in) || 0,
        lun_cestas_out: parseInt(req.body.lun_cestas_out) || 0, mar_cestas_out: parseInt(req.body.mar_cestas_out) || 0,
        mie_cestas_out: parseInt(req.body.mie_cestas_out) || 0, jue_cestas_out: parseInt(req.body.jue_cestas_out) || 0,
        vie_cestas_out: parseInt(req.body.vie_cestas_out) || 0, sab_cestas_out: parseInt(req.body.sab_cestas_out) || 0,
        papel_trans_g: parseFloat(req.body.papel_trans_g) || 0,
        lun_papel_extra: parseFloat(req.body.lun_papel_extra) || 0, mar_papel_extra: parseFloat(req.body.mar_papel_extra) || 0,
        mie_papel_extra: parseFloat(req.body.mie_papel_extra) || 0, jue_papel_extra: parseFloat(req.body.jue_papel_extra) || 0,
        vie_papel_extra: parseFloat(req.body.vie_papel_extra) || 0, sab_papel_extra: parseFloat(req.body.sab_papel_extra) || 0,
        papel_sobrante_g: parseFloat(req.body.papel_sobrante_g) || 0,
        precio_cesta: parseInt(req.body.precio_cesta) || 11000, estado: 'pendiente'
    };
    if (regId && regId !== '') { await supabase.from('recepcion_envolvedoras').update(campos).eq('id', regId); }
    else { campos.semana_inicio = tiempo.fecha; await supabase.from('recepcion_envolvedoras').insert([campos]); }
    res.redirect('/envolvedoras');
});

router.post('/liquidar_envolvedora/:id', isAdmin, async (req, res) => {
    const regId = req.params.id;
    const { data: reg } = await supabase.from('recepcion_envolvedoras').select('*').eq('id', regId).single();
    if (!reg) return res.send(mostrarAlerta('Error', 'Registro no encontrado.', 'error'));
    const totalCestasOut = reg.lun_cestas_out + reg.mar_cestas_out + reg.mie_cestas_out + reg.jue_cestas_out + reg.vie_cestas_out + reg.sab_cestas_out;
    const pago = totalCestasOut * reg.precio_cesta;
    const tiempo = obtenerHoraColombia();
    await supabase.from('produccion_fabriquines').insert([{ fecha: tiempo.fecha, usuario: String(reg.empleado_id), cantidad_producida: totalCestasOut, precio_por_unidad: reg.precio_cesta, total_ganado: pago, estado: 'PENDIENTE' }]);
    await supabase.from('recepcion_envolvedoras').update({ estado: 'pagado' }).eq('id', regId);
    res.send(mostrarAlerta('✅ Liquidada', `Total: $${pago.toLocaleString('es-CO')} COP por ${totalCestasOut} cestas.`, 'success'));
});

// ---------------- DESPACHOS EMPAQUE ----------------

router.get('/despachos_empaque', isAdmin, async (req, res) => {
    const { data: usuarios } = await supabase.from('usuarios').select('*').in('rol', ['anillador', 'empacador']);
    const { data: inventario } = await supabase.from('inventario').select('*').gt('cantidad', 0);
    const { data: despachos_activos } = await supabase.from('pedidos').select('*').eq('estado', 'aprobado');
    let despachosRoles = [];
    if (despachos_activos && usuarios) { despachos_activos.forEach(d => { if (usuarios.find(u => u.usuario === d.usuario)) despachosRoles.push(d); }); }
    res.render('produccion/despacho_empaque', { session: req.session, usuarios, inventario, despachos_activos: despachosRoles });
});

router.post('/asignar_despacho', isAdmin, async (req, res) => {
    const { usuario, material_id, material_nombre, cantidad, unidad_medida } = req.body;
    let cantNum = parseFloat(cantidad);
    let desc = `Despacho a ${usuario} para tarea de empaque/anillado.`;
    if (unidad_medida === 'cestas') { desc = `Despacho de ${cantNum} Cestas a ${usuario}.`; cantNum = cantNum * 1500; }
    const { data: inv } = await supabase.from('inventario').select('*').eq('id', material_id).single();
    if (inv && inv.cantidad >= cantNum) {
        await supabase.from('inventario').update({ cantidad: inv.cantidad - cantNum }).eq('id', inv.id);
        const tiempo = obtenerHoraColombia();
        await supabase.from('movimientos').insert([{ fecha: tiempo.fecha, hora: tiempo.hora, tipo_movimiento: 'SALIDA', material: material_nombre, cantidad: cantNum, usuario: req.session.usuario || 'Admin', descripcion: desc }]);
        await supabase.from('pedidos').insert([{ material: material_nombre, cantidad: cantNum, usuario, fecha: tiempo.fecha, estado: 'aprobado', entregado: 0, rezago: cantNum }]);
    }
    res.redirect('/despachos_empaque');
});

router.get('/recepcion_empaque', isAdmin, async (req, res) => {
    const { data: despachos } = await supabase.from('pedidos').select('*').eq('estado', 'aprobado');
    const { data: usuarios } = await supabase.from('usuarios').select('usuario, rol');
    let despachosRoles = [];
    if (despachos && usuarios) { despachos.forEach(d => { let u = usuarios.find(u => u.usuario === d.usuario); if (u && (u.rol === 'anillador' || u.rol === 'empacador')) { d.rol_usuario = u.rol; despachosRoles.push(d); } }); }
    res.render('produccion/recepcion_empaque', { session: req.session, despachos_pendientes: despachosRoles });
});

router.post('/recibir_empaque/:id', isAdmin, async (req, res) => {
    const idPedido = req.params.id;
    const { rol, usuario, cestas_anilladas, bultos_50, bultos_25, cajas_50_sueltas, cajas_25_sueltas } = req.body;
    const tiempo = obtenerHoraColombia();
    const TARIFA_ANILLADO = 12000, TARIFA_BULTO50 = 10000, TARIFA_BULTO25 = 7000;
    const TARIFA_CAJA50 = TARIFA_BULTO50 / 25, TARIFA_CAJA25 = TARIFA_BULTO25 / 50;
    async function invAdd(matName, cant, cat) { const { data: i } = await supabase.from('inventario').select('*').eq('material', matName).single(); if (i) await supabase.from('inventario').update({ cantidad: i.cantidad + cant }).eq('id', i.id); else await supabase.from('inventario').insert([{ material: matName, cantidad: cant, categoria: cat }]); }
    async function pagar(user, cant, precio, t) { await supabase.from('produccion_fabriquines').insert([{ fecha: t.fecha, usuario: user, cantidad_producida: cant, precio_por_unidad: precio, total_ganado: cant * precio, estado: 'PENDIENTE' }]); }
    if (rol === 'anillador') { let n = parseInt(cestas_anilladas) || 0; if (n > 0) { await invAdd('Tabacos Anillados', n * 1500, 'Producto Terminado'); await pagar(usuario, n, TARIFA_ANILLADO, tiempo); } }
    else { let n50 = parseInt(bultos_50) || 0, n25 = parseInt(bultos_25) || 0, c50 = parseInt(cajas_50_sueltas) || 0, c25 = parseInt(cajas_25_sueltas) || 0;
        if (n50 > 0) { await invAdd('Bultos de 50', n50, 'Producto Terminado'); await pagar(usuario, n50, TARIFA_BULTO50, tiempo); }
        if (n25 > 0) { await invAdd('Bultos de 25', n25, 'Producto Terminado'); await pagar(usuario, n25, TARIFA_BULTO25, tiempo); }
        if (c50 > 0) { await invAdd('Cajas de 50', c50, 'Producto Terminado'); await pagar(usuario, c50, TARIFA_CAJA50, tiempo); }
        if (c25 > 0) { await invAdd('Cajas de 25', c25, 'Producto Terminado'); await pagar(usuario, c25, TARIFA_CAJA25, tiempo); }
    }
    await supabase.from('pedidos').update({ estado: 'completado' }).eq('id', idPedido);
    res.redirect('/recepcion_empaque');
});

module.exports = router;
