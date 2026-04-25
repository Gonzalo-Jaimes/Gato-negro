const express = require('express');
const router = express.Router();
const { supabase, mostrarAlerta, obtenerHoraColombia } = require('../lib/shared');
const { isAdmin } = require('../lib/middleware');
const GatoNegroPDF = require('../lib/pdf_gen');

// ---------------- DASHBOARD ANALÍTICO ----------------

router.get('/analitica', isAdmin, async (req, res) => {
    const { data: movsBrutos } = await supabase.from('movimientos').select('tipo_movimiento, material, cantidad, fecha').order('id', { ascending: false }).limit(2000);
    const { data: movEntradas } = await supabase.from('movimientos').select('material, cantidad').eq('tipo_movimiento', 'ENTRADA');
    
    let prodNormales = 0, prodAnillados = 0, prodEnvoltura = 0;
    if (movEntradas) {
        movEntradas.forEach(m => {
            let mat = m.material ? m.material.toLowerCase() : '';
            if (mat.includes('anillado')) prodAnillados += m.cantidad;
            else if (mat.includes('envoltura')) prodEnvoltura += m.cantidad;
            else if (mat.includes('normal') || mat === 'tabacos' || mat === 'tabaco') prodNormales += m.cantidad;
        });
    }

    const { data: movSalidas } = await supabase.from('movimientos').select('descripcion').eq('tipo_movimiento', 'SALIDA').ilike('descripcion', '%[VENTA]%');
    let totalIngresos = 0;
    if (movSalidas) {
        movSalidas.forEach(m => {
            let match = m.descripcion.match(/\$([\d.]+)/);
            if (match) totalIngresos += parseInt(match[1].replace(/\./g, ''));
        });
    }

    const { data: nomina } = await supabase.from('produccion_fabriquines').select('total_ganado');
    let totalNomina = 0;
    if (nomina) nomina.forEach(n => totalNomina += parseFloat(n.total_ganado) || 0);

    const { data: mtto } = await supabase.from('mantenimiento').select('costo_mo, costo_mat').eq('estado', 'REALIZADO');
    let totalMtto = 0;
    if (mtto) mtto.forEach(m => totalMtto += (parseFloat(m.costo_mo) || 0) + (parseFloat(m.costo_mat) || 0));

    res.render('admin/analitica', {
        session: req.session,
        raw_movs: movsBrutos,
        produccion: { normales: prodNormales, anillados: prodAnillados, envoltura: prodEnvoltura },
        finanzas: { ingresos: totalIngresos, nomina: totalNomina, mantenimiento: totalMtto }
    });
});

// ---------------- NÓMINA Y FACTURACIÓN ----------------

router.get('/nomina', isAdmin, async (req, res) => {
    const { data: empleados } = await supabase.from('empleados_fabriquines').select('*').order('codigo', { ascending: true });
    const { data: deudas_activas } = await supabase.from('deudores_fabriquines').select('*').eq('estado', 'ACTIVA');
    const { data: cierres_pendientes } = await supabase.from('recepcion_diaria').select('*, empleados_fabriquines(*)').eq('estado', 'liquidado');
    
    res.render('finanzas/nomina', { 
        nomina: [], 
        empleados: empleados || [],
        deudas_activas: deudas_activas || [], 
        cierres_pendientes: cierres_pendientes || [] 
    });
});

router.get('/facturas', isAdmin, async (req, res) => {
    const { data: despachos } = await supabase.from('despachos_registro')
        .select('*, empleados_fabriquines(nombre, codigo)')
        .in('estado', ['activo', 'pendiente']).order('created_at', { ascending: false });
            
    const { data: lotes } = await supabase.from('lotes_picadura').select('*').order('fecha', { ascending: false }).limit(20);
    const { data: sacosDisponibles } = await supabase.from('sacos_picadura').select('*, lotes_picadura(fecha)').eq('estado', 'disponible');

    res.render('finanzas/facturas_lista', { 
        despachos: despachos || [], lotes: lotes || [], sacosDisponibles: sacosDisponibles || [] 
    });
});

router.get('/factura_detalle/:id', isAdmin, async (req, res) => {
    const { data: d } = await supabase.from('despachos_registro').select('*, empleados_fabriquines(nombre, codigo)').eq('id', req.params.id).single();
    if (!d) return res.redirect('/facturas');
    res.render('finanzas/factura_detalle', { d });
});

router.get('/factura/pdf/:id', isAdmin, async (req, res) => {
    try {
        const { data: d } = await supabase.from('despachos_registro')
            .select('*, empleados_fabriquines(nombre, codigo, deuda_tabacos, deuda_dinero)')
            .eq('id', req.params.id)
            .single();

        if (!d) return res.status(404).send('Factura no encontrada');

        const pdfData = {
            id: d.id,
            fecha: d.fecha,
            empleado_nombre: d.empleados_fabriquines.nombre,
            empleado_codigo: d.empleados_fabriquines.codigo,
            total_tabacos: d.meta_tabacos,
            total_ganado: (d.meta_tabacos * 12).toLocaleString('es-CO'), // Precio estimado por ahora
            deuda_tabacos: d.empleados_fabriquines.deuda_tabacos,
            deuda_dinero: d.empleados_fabriquines.deuda_dinero.toLocaleString('es-CO'),
            produccion: d.detalles_diarios || {} // Si existe el JSON de desglose
        };

        const buffer = await GatoNegroPDF.generarFactura(pdfData);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Factura_GatoNegro_${d.id}.pdf`);
        res.send(buffer);

    } catch (e) {
        console.error('Error al generar PDF:', e);
        res.status(500).send('Error interno al generar el PDF');
    }
});

// ---------------- IMPRIMIR NÓMINA V18 ----------------

router.get('/imprimir_nomina_v18/:id', isAdmin, async (req, res) => {
    const regId = req.params.id;
    const { data: reg } = await supabase.from('recepcion_diaria').select('*, empleados_fabriquines(*)').eq('id', regId).single();
    if (!reg) return res.redirect('/nomina');
    const emp = reg.empleados_fabriquines;
    const total_cestas = reg.lun_cestas + reg.mar_cestas + reg.mie_cestas + reg.jue_cestas + reg.vie_cestas + reg.sab_cestas;
    const total_tabacos = reg.lun_tabacos + reg.mar_tabacos + reg.mie_tabacos + reg.jue_tabacos + reg.vie_tabacos + reg.sab_tabacos;
    const VALOR_TABACO = 85, VALOR_RECORTE = 6500, VALOR_VENA = 3500, VALOR_EXTRA = 230;
    const pago_tabacos = total_tabacos * VALOR_TABACO;
    const pago_recorte = reg.recorte_kg * VALOR_RECORTE;
    const pago_vena = reg.vena_kg * VALOR_VENA;
    const pago_extras = reg.extra_tabacos * VALOR_EXTRA;
    let total_ganado = pago_tabacos + pago_recorte + pago_vena + pago_extras;
    let descuentos = 0, desglose_descuentos = [];
    try {
        const { data: abonos } = await supabase.from('abonos_prestamo').select('monto_abono, tipo, nota, fecha_abono').eq('empleado_id', emp.id).gte('fecha_abono', reg.semana_inicio);
        if (abonos) { abonos.forEach(a => { const monto = parseFloat(a.monto_abono || 0); const tipo = a.tipo || 'abono'; if (monto > 0 && (tipo === 'abono' || tipo === 'descuento_sueldo')) { descuentos += monto; desglose_descuentos.push({ tipo, monto, nota: a.nota, fecha: a.fecha_abono }); } }); }
    } catch(e) {}
    const total_neto = Math.max(0, total_ganado - descuentos);
    res.render('finanzas/formato_nomina_v18', {
        empleado: emp, reg, tiempo: obtenerHoraColombia(),
        totales: { tabacos: total_tabacos, cestas: total_cestas },
        pagos: { pago_tabacos, pago_recorte, pago_vena, pago_extras, total_bruto: total_ganado, descuentos, desglose_descuentos, total_neto, valor_tabaco: VALOR_TABACO, valor_recorte: VALOR_RECORTE, valor_vena: VALOR_VENA, valor_extra: VALOR_EXTRA }
    });
});

router.post('/archivar_cierre_v18/:id', isAdmin, async (req, res) => {
    await supabase.from('recepcion_diaria').update({ estado: 'pagado_y_archivado' }).eq('id', req.params.id);
    res.redirect('/nomina');
});

router.get('/factura_nomina/:usuario', isAdmin, async (req, res) => {
    const userToPay = req.params.usuario;
    const { data: userData } = await supabase.from('usuarios').select('identificacion').eq('usuario', userToPay).single();
    const documento = userData?.identificacion || '123456789';
    const { data: produccion } = await supabase.from('produccion_fabriquines').select('*').eq('usuario', userToPay).eq('estado', 'PENDIENTE');
    const { data: deudas } = await supabase.from('deudores_fabriquines').select('*').eq('usuario', userToPay).eq('estado', 'ACTIVA');
    let subtotal = 0; (produccion || []).forEach(p => subtotal += parseFloat(p.total_ganado));
    let desc = 0; (deudas || []).forEach(d => desc += parseFloat(d.monto_deuda));
    res.render('finanzas/factura', { usuario: userToPay, produccion: produccion || [], deudas: deudas || [], subtotal, descuentos: desc, total_neto: subtotal - desc, fecha: obtenerHoraColombia().fecha, documento });
});

router.post('/pagar_nomina/:usuario', isAdmin, async (req, res) => {
    const userToPay = req.params.usuario;
    await supabase.from('produccion_fabriquines').update({ estado: 'PAGADO' }).eq('usuario', userToPay).eq('estado', 'PENDIENTE');
    await supabase.from('deudores_fabriquines').update({ estado: 'COBRADA' }).eq('usuario', userToPay).eq('estado', 'ACTIVA');
    res.redirect('/nomina');
});

router.post('/agregar_deuda', isAdmin, async (req, res) => {
    await supabase.from('deudores_fabriquines').insert([{
        fecha: req.body.fecha || obtenerHoraColombia().fecha,
        usuario: req.body.usuario,
        monto_deuda: parseFloat(req.body.monto),
        concepto: req.body.concepto,
        estado: 'ACTIVA'
    }]);
    res.redirect('/nomina');
});

router.post('/abonar_deuda/:id', isAdmin, async (req, res) => {
    const deudaId = req.params.id;
    const { usuario, deuda_total_original, monto_abono, tipo_abono } = req.body;
    let abonoNum = parseFloat(monto_abono);
    let originalNum = parseFloat(deuda_total_original);
    if (isNaN(abonoNum) || abonoNum <= 0) return res.send(mostrarAlerta('Error', 'Monto inválido.', 'error', '/nomina'));
    let nuevoSaldo = Math.max(0, originalNum - abonoNum);
    let estadoActualizado = nuevoSaldo <= 0 ? 'COBRADA' : 'ACTIVA';
    await supabase.from('deudores_fabriquines').update({ monto_deuda: nuevoSaldo, estado: estadoActualizado }).eq('id', deudaId);
    if (tipo_abono === 'rezago') {
        const tiempo = obtenerHoraColombia();
        const { data: inv } = await supabase.from('inventario').select('*');
        if (inv) {
            let mat = inv.find(i => i.material.toLowerCase().includes('recorte') || i.material.toLowerCase().includes('rezago'));
            if (mat) {
                await supabase.from('inventario').update({ cantidad: mat.cantidad + abonoNum }).eq('id', mat.id);
                await supabase.from('movimientos').insert([{ fecha: tiempo.fecha, hora: tiempo.hora, tipo_movimiento: 'INGRESO', material: mat.material, cantidad: abonoNum, usuario: req.session.usuario || 'Admin', descripcion: `Abono de deuda por Rezago de ${usuario}` }]);
            }
        }
    }
    res.redirect('/nomina');
});

module.exports = router;
