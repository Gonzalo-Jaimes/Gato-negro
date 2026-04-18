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
    if (!d) return res.redirect('/finanzas/facturas');
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

module.exports = router;
