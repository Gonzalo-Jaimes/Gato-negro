const express = require('express');
const router = express.Router();
const { supabase, mostrarAlerta, obtenerHoraColombia, registrarAuditoria } = require('../lib/shared');
const { isAdmin, isAuth } = require('../lib/middleware');

// ---------------- DESPACHO DE TAREAS ----------------

router.get('/despacho', isAdmin, async (req, res) => {
    const { data: empleados } = await supabase.from('empleados_fabriquines').select('*').order('codigo');
    
    let prestamosActivos = [];
    try {
        const { data: p } = await supabase.from('prestamos_fabriquines').select('*').eq('estado', 'activo');
        prestamosActivos = p || [];
    } catch(e) {}

    let resumenSemanal = { 
        capa_kg: 0, capote_kg: 0, picadura_kg: 0, 
        total_fabriquines: 0, total_tabacos: 0,
        total_cestas: 0, cestas_por_color: {} 
    };
    try {
        const { data: facturasPend } = await supabase.from('despachos_registro')
            .select('*').eq('estado', 'pendiente');
        
        if (facturasPend) {
            resumenSemanal.total_fabriquines = facturasPend.length;
            facturasPend.forEach(f => {
                resumenSemanal.capa_kg     += parseFloat(f.capa_kg || 0);
                resumenSemanal.capote_kg   += parseFloat(f.capote_kg || 0);
                resumenSemanal.picadura_kg += parseFloat(f.picadura_kg || 0);
                resumenSemanal.total_tabacos += parseInt(f.meta_tabacos || 0);
                
                const cant = parseInt(f.cestas_cant || 0);
                if (cant > 0) {
                    resumenSemanal.total_cestas += cant;
                    const color = (f.color_cesta || 'Sin Color').toLowerCase();
                    resumenSemanal.cestas_por_color[color] = (resumenSemanal.cestas_por_color[color] || 0) + cant;
                }
            });
        }
    } catch(e) { console.error('Error resumenSemanal:', e); }

    res.render('produccion/despacho', { empleados: empleados || [], prestamos: prestamosActivos, resumenSemanal });
});

router.post('/despachar_tarea', isAdmin, async (req, res) => {
    const empleadoId = req.body.empleado_id;
    const fisicoEntregado = parseInt(req.body.meta_tabacos) || 0;
    const colorCesta = req.body.color_cesta || "Cestas";
    
    const { data: empleado } = await supabase.from('empleados_fabriquines').select('*').eq('id', empleadoId).single();
    if (!empleado) return res.send(mostrarAlerta('Error', 'Empleado no encontrado', 'error'));
    
    const saldoEnCasa = parseInt(empleado.deuda_tabacos) || 0;
    const nuevaMeta = saldoEnCasa + fisicoEntregado;
    
    if (fisicoEntregado <= 0) return res.send(mostrarAlerta('Error Lógico', 'La entrega debe ser mayor a cero', 'warning'));
    
    const factor = fisicoEntregado / 1000;
    const capaKgBase     = parseFloat((factor * 1.0).toFixed(2));
    const capoteKgBase   = parseFloat((factor * 1.8).toFixed(2));
    const picaduraKgBase = parseFloat((factor * 7.0).toFixed(2));

    const abono_prestamo = parseInt(req.body.abono_prestamo) || 0;
    const nuevo_prestamo = parseInt(req.body.nuevo_prestamo) || 0;
    const goma_uds       = parseFloat(req.body.goma_uds)     || 0;
    const goma_num       = req.body.goma_num                 || "";
    const periodico_kg   = parseFloat(req.body.periodico_kg) || 0;
    const cestasCant     = parseInt(req.body.cestas_cant)   || Math.ceil(fisicoEntregado / 1250);

    const tiempo = obtenerHoraColombia();

    let despachoId = null;
    try {
        const { data: dReg } = await supabase.from('despachos_registro').insert([{
            empleado_id:   empleado.id,
            fecha:         tiempo.fecha,
            meta_tabacos:  fisicoEntregado,
            deuda_anterior: saldoEnCasa,
            capa_kg:       capaKgBase,
            capote_kg:     capoteKgBase,
            picadura_kg:   picaduraKgBase,
            color_cesta:   colorCesta,
            cestas_cant:   cestasCant,
            goma_uds:      goma_uds,
            goma_num:      goma_num  || null,
            periodico_kg:  periodico_kg,
            abono_prestamo: abono_prestamo,
            nuevo_prestamo: nuevo_prestamo,
            estado:        'pendiente'
        }]).select().single();
        if (dReg) despachoId = dReg.id;
    } catch(e) { console.log('Despacho no guardado en DB:', e.message); }

    res.render('produccion/hoja_despacho', {
        empleado: { id: empleado.id, nombre: empleado.nombre, codigo: empleado.codigo },
        despacho: {
            id:           despachoId || empleado.id,
            fecha_semana: `${tiempo.fecha} ${tiempo.hora}`,
            meta_tabacos: nuevaMeta,
            color_cesta:  colorCesta,
            cestas_cant:  cestasCant,
            capa_kg:      capaKgBase,
            capote_kg:    capoteKgBase,
            picadura_kg:  picaduraKgBase,
            deuda_anterior: saldoEnCasa,
            goma_uds:     goma_uds,
            goma_num:     goma_num,
            periodico_kg: periodico_kg,
            notas: null
        },
        sacos: []
    });
});

// ---------------- RECEPCIÓN DIARIA ----------------

router.get('/recepcion_diaria', isAdmin, async (req, res) => {
    const { data: empleados } = await supabase.from('empleados_fabriquines').select('*').order('codigo');
    const { data: registros } = await supabase.from('recepcion_diaria').select('*').eq('estado', 'pendiente');
    
    let prestamosActivos = [];
    try {
        const { data: p } = await supabase.from('prestamos_fabriquines').select('*').eq('estado', 'activo');
        prestamosActivos = p || [];
    } catch(e) { }
    
    const empleadosActivos = (empleados || []).filter(emp => emp.deuda_tabacos > 0 || (registros || []).some(r => r.empleado_id === emp.id));
    
    let historialPrestamos = {};
    try {
        const { data: abonos } = await supabase.from('abonos_prestamo').select('*').order('fecha_abono', { ascending: false });
        (abonos || []).forEach(a => {
            if (!historialPrestamos[a.empleado_id]) historialPrestamos[a.empleado_id] = [];
            historialPrestamos[a.empleado_id].push(a);
        });
    } catch(e) {}

    res.render('produccion/fabriquines_diario', { 
        empleados: empleadosActivos, 
        registros: registros || [], 
        prestamos: prestamosActivos,
        successMsg: req.query.ok || null,
        despachoId: req.query.despacho_id || null,
        historialPrestamos
    });
});

router.post('/recepcion_diaria_guardar', isAdmin, async (req, res) => {
    const empId = req.body.empleado_id;
    const regId = req.body.registro_id;
    const tiempo = obtenerHoraColombia();
    
    const { data: emp } = await supabase.from('empleados_fabriquines').select('*').eq('id', empId).single();
    
    const newLun = parseInt(req.body.lun_tabacos) || 0;
    const newMar = parseInt(req.body.mar_tabacos) || 0;
    const newMie = parseInt(req.body.mie_tabacos) || 0;
    const newJue = parseInt(req.body.jue_tabacos) || 0;
    const newVie = parseInt(req.body.vie_tabacos) || 0;
    const newSab = parseInt(req.body.sab_tabacos) || 0;
    const newTotal = newLun + newMar + newMie + newJue + newVie + newSab;
    
    const newLunC = parseInt(req.body.lun_cestas) || 0;
    const newMarC = parseInt(req.body.mar_cestas) || 0;
    const newMieC = parseInt(req.body.mie_cestas) || 0;
    const newJueC = parseInt(req.body.jue_cestas) || 0;
    const newVieC = parseInt(req.body.vie_cestas) || 0;
    const newSabC = parseInt(req.body.sab_cestas) || 0;
    const newTotalC = newLunC + newMarC + newMieC + newJueC + newVieC + newSabC;

    const newExtra = parseInt(req.body.extra_tabacos) || 0;
    const newRecorte = parseFloat(req.body.recorte_kg) || 0;
    const newVena = parseFloat(req.body.vena_kg) || 0;

    let oldTab = 0, oldCest = 0, oldExt = 0, oldRec = 0, oldVen = 0;
    if (regId && regId !== '') {
        const { data: oldReg } = await supabase.from('recepcion_diaria').select('*').eq('id', regId).single();
        if (oldReg) {
            oldTab = oldReg.lun_tabacos + oldReg.mar_tabacos + oldReg.mie_tabacos + oldReg.jue_tabacos + oldReg.vie_tabacos + oldReg.sab_tabacos;
            oldCest = oldReg.lun_cestas + oldReg.mar_cestas + oldReg.mie_cestas + oldReg.jue_cestas + oldReg.vie_cestas + oldReg.sab_cestas;
            oldExt = oldReg.extra_tabacos || 0;
            oldRec = oldReg.recorte_kg || 0;
            oldVen = oldReg.vena_kg || 0;
        }
    }
    
    async function difStock(materialNom, categ, dif, tipoDesc) {
        if (dif === 0) return;
        const nombreCorto = emp ? emp.nombre.split(' ').slice(0, 2).join(' ') : 'Fabriquín';
        const cod = emp ? emp.codigo : 'N/A';
        const tipoMov = dif > 0 ? 'ENTRADA' : 'SALIDA';
        
        const { data: invT } = await supabase.from('inventario').select('*').eq('material', materialNom).single();
        if (invT) await supabase.from('inventario').update({ cantidad: invT.cantidad + dif }).eq('id', invT.id);
        else await supabase.from('inventario').insert([{ material: materialNom, cantidad: dif, categoria: categ }]);
        
        await supabase.from('movimientos').insert([{
            fecha: tiempo.fecha, hora: tiempo.hora, tipo_movimiento: tipoMov, material: materialNom, cantidad: Math.abs(dif), usuario: 'Admin',
            descripcion: `Registro Diario (${tipoDesc}): ${cod} - ${nombreCorto}`
        }]);
    }

    await difStock('Tabacos', 'En Proceso', newTotal - oldTab, 'Lotes Tarea');

    const difCestas = newTotalC - oldCest;
    let colorCestaRetorno = 'Cestas Generales'; 
    if (difCestas !== 0) {
        const { data: ultimoDespacho } = await supabase.from('movimientos')
            .select('material').ilike('material', 'Cestas%').ilike('descripcion', `%${emp ? emp.codigo : ''}%`)
            .order('id', { ascending: false }).limit(1).single();
        if (ultimoDespacho && ultimoDespacho.material) colorCestaRetorno = ultimoDespacho.material;
    }
    await difStock(colorCestaRetorno, 'Herramientas', difCestas, 'Retorno Bulto');

    await difStock('Tabacos Extras (Ventas)', 'Producto Terminado', newExtra - oldExt, 'Compra Directa');
    await difStock('Recorte', 'Materia Prima', newRecorte - oldRec, 'Merma');
    await difStock('Vena', 'Materia Prima', newVena - oldVen, 'Merma');
    
    const dataObj = {
        empleado_id: empId,
        lun_cestas: newLunC, lun_tabacos: newLun,
        mar_cestas: newMarC, mar_tabacos: newMar,
        mie_cestas: newMieC, mie_tabacos: newMie,
        jue_cestas: newJueC, jue_tabacos: newJue,
        vie_cestas: newVieC, vie_tabacos: newVie,
        sab_cestas: newSabC, sab_tabacos: newSab,
        recorte_kg: newRecorte, vena_kg: newVena,
        extra_tabacos: newExtra, estado: 'pendiente'
    };
    
    if (regId && regId !== '') {
        await supabase.from('recepcion_diaria').update(dataObj).eq('id', regId);
    } else {
        dataObj.semana_inicio = tiempo.fecha;
        await supabase.from('recepcion_diaria').insert([dataObj]);
    }

    res.redirect('/recepcion_diaria');
});

// ---------------- HISTORIAL Y CIERRES ----------------

router.get('/entregas_historicas', isAdmin, async (req, res) => {
    const { data: entregas } = await supabase.from('recepcion_diaria')
        .select('*, empleados_fabriquines(*)')
        .order('id', { ascending: false });
    res.render('produccion/historial_entregas', { entregas: entregas || [] });
});

// ---------------- ÁREA DE EMPAQUE (RESTAURADA) ----------------

router.get('/recepcion_empaque', isAdmin, async (req, res) => {
    const { data: empaquetadores } = await supabase.from('usuarios').select('*').eq('rol', 'empacador');
    const { data: registros } = await supabase.from('recepcion_empaque').select('*').eq('estado', 'pendiente').order('id', { ascending: false });
    res.render('produccion/empaque_recepcion', { personal: empaquetadores || [], registros: registros || [] });
});

router.get('/despacho_empaque', isAdmin, async (req, res) => {
    const { data: empaquetadores } = await supabase.from('usuarios').select('*').eq('rol', 'empacador');
    const { data: registros } = await supabase.from('despacho_empaque').select('*').eq('estado', 'pendiente');
    res.render('produccion/empaque_despacho', { personal: empaquetadores || [], registros: registros || [] });
});

// ---------------- MERMAS Y COMPRAS (RESTAURADA) ----------------

router.get('/mermas', isAdmin, async (req, res) => {
    const { data: compras } = await supabase.from('compras_materia_prima').select('*').order('fecha', { ascending: false }).limit(50);
    const { data: mermas }  = await supabase.from('mermas_materia_prima').select('*').order('fecha', { ascending: false }).limit(50);
    res.render('produccion/mermas', { compras: compras || [], mermas: mermas || [] });
});

// ---------------- PEDIDOS Y ÓRDENES (RESTAURADA) ----------------

router.get('/pedidos', isAuth, async (req, res) => {
    const { data: pedidos } = await supabase.from('pedidos_tabaco').select('*').order('id', { ascending: false }).limit(100);
    const { data: cestas }  = await supabase.from('inventario').select('*').ilike('material', 'Cestas%');
    res.render('produccion/pedidos', { 
        pedidos: pedidos || [], 
        cestas_inventario: cestas || [],
        session: req.session 
    });
});

// ---------------- RECEPCIÓN GENERAL (RESTAURADA) ----------------

router.get('/recepcion_general', isAdmin, async (req, res) => {
    const { data: empleados } = await supabase.from('empleados_fabriquines').select('*').order('nombre');
    const { data: registros } = await supabase.from('recepcion_diaria').select('*, empleados_fabriquines(*)').order('id', { ascending: false }).limit(50);
    res.render('produccion/recepcion_general', { empleados: empleados || [], registros: registros || [] });
});

// ---------------- IMPRIMIR DESPACHO ----------------
router.get('/imprimir_despacho/:empleado_id', isAdmin, (req, res) => {
    const d = req.session.ultimo_despacho;
    if (!d || d.empleado_id != req.params.empleado_id) {
        return res.send('<script>alert("No hay datos de despacho. Haz el despacho primero."); window.close();</script>');
    }
    res.render('produccion/hoja_despacho', {
        empleado: { id: d.empleado_id, nombre: d.empleado_nombre, codigo: d.empleado_codigo },
        despacho: {
            id: d.empleado_id, fecha_semana: d.fecha_actual, meta_tabacos: d.meta,
            color_cesta: d.params?.color_cesta || '—', cestas_cant: d.params?.cestas || 0,
            capa_kg: d.params?.capa || 0, capote_kg: d.params?.capote || 0,
            picadura_kg: d.params?.picadura || 0, deuda_anterior: d.saldo_casa || 0,
            goma_uds: d.suministros?.goma_uds || 0, goma_num: d.suministros?.goma_num || '',
            periodico_kg: d.suministros?.periodico_kg || 0, notas: null
        },
        sacos: []
    });
});

// ---------------- REIMPRIMIR FACTURA ----------------
router.get('/reimprimir_factura/:id', isAdmin, async (req, res) => {
    try {
        const { data: d } = await supabase.from('despachos_registro')
            .select('*, empleados_fabriquines(nombre, codigo)').eq('id', req.params.id).single();
        if (!d) return res.send('<script>alert("Factura no encontrada."); window.close();</script>');
        const emp = d.empleados_fabriquines || {};
        res.render('produccion/hoja_despacho', {
            empleado: { id: d.empleado_id, nombre: emp.nombre || '—', codigo: emp.codigo || '—' },
            despacho: { id: d.id, fecha_semana: d.fecha, meta_tabacos: d.meta_tabacos, color_cesta: d.color_cesta,
                cestas_cant: d.cestas_cant, capa_kg: d.capa_kg, capote_kg: d.capote_kg, picadura_kg: d.picadura_kg,
                deuda_anterior: d.deuda_anterior, goma_uds: d.goma_uds, goma_num: d.goma_num,
                periodico_kg: d.periodico_kg, notas: null },
            sacos: []
        });
    } catch(e) { res.send('<script>alert("Error al cargar."); window.close();</script>'); }
});

// ---------------- PRÉSTAMOS DESDE RECEPCIÓN ----------------
router.post('/registrar_movimiento_prestamo', isAdmin, async (req, res) => {
    const { empleado_id, tipo, monto, fecha, nota } = req.body;
    const montoNum = parseInt(monto) || 0;
    if (!empleado_id || montoNum <= 0) return res.json({ ok: false, msg: 'Datos inválidos' });
    const tiempo = obtenerHoraColombia();
    const fechaFinal = fecha || tiempo.fecha;
    try {
        if (tipo === 'abono') {
            const { data: prest } = await supabase.from('prestamos_fabriquines')
                .select('*').eq('empleado_id', empleado_id).eq('estado', 'activo').single();
            if (!prest) return res.json({ ok: false, msg: 'No hay préstamo activo' });
            const nuevoSaldo = Math.max(0, parseFloat(prest.saldo_pendiente) - montoNum);
            const nuevoEstado = nuevoSaldo === 0 ? 'pagado' : 'activo';
            await supabase.from('prestamos_fabriquines').update({ saldo_pendiente: nuevoSaldo, estado: nuevoEstado }).eq('id', prest.id);
            await supabase.from('abonos_prestamo').insert([{ prestamo_id: prest.id, empleado_id: parseInt(empleado_id), monto_abono: montoNum, fecha_abono: fechaFinal, semana_ref: nota || tipo, tipo: 'abono', nota: nota || '' }]);
            return res.json({ ok: true, nuevo_saldo: nuevoSaldo, tipo: 'abono' });
        } else {
            const { data: prestActivo } = await supabase.from('prestamos_fabriquines')
                .select('*').eq('empleado_id', empleado_id).eq('estado', 'activo').single();
            if (prestActivo) {
                const nuevoSaldo = parseFloat(prestActivo.saldo_pendiente) + montoNum;
                await supabase.from('prestamos_fabriquines').update({ saldo_pendiente: nuevoSaldo, monto_total: parseFloat(prestActivo.monto_total) + montoNum }).eq('id', prestActivo.id);
                await supabase.from('abonos_prestamo').insert([{ prestamo_id: prestActivo.id, empleado_id: parseInt(empleado_id), monto_abono: -montoNum, fecha_abono: fechaFinal, semana_ref: nota || tipo, tipo, nota: nota || '' }]);
                return res.json({ ok: true, nuevo_saldo: nuevoSaldo, tipo });
            } else {
                const { data: nuevoPrest } = await supabase.from('prestamos_fabriquines').insert([{ empleado_id: parseInt(empleado_id), monto_total: montoNum, saldo_pendiente: montoNum, concepto: nota || tipo, estado: 'activo' }]).select().single();
                if (nuevoPrest) { await supabase.from('abonos_prestamo').insert([{ prestamo_id: nuevoPrest.id, empleado_id: parseInt(empleado_id), monto_abono: -montoNum, fecha_abono: fechaFinal, semana_ref: nota || tipo, tipo, nota: nota || '' }]); }
                return res.json({ ok: true, nuevo_saldo: montoNum, tipo });
            }
        }
    } catch(e) { return res.json({ ok: false, msg: e.message }); }
});

router.post('/registrar_material_extra', isAdmin, async (req, res) => {
    const { empleado_id, material, kg, fecha, nota } = req.body;
    const kgNum = parseFloat(kg) || 0;
    if (!empleado_id || !material || kgNum <= 0) return res.json({ ok: false, msg: 'Datos incompletos' });
    try {
        const { data: emp } = await supabase.from('empleados_fabriquines').select('*').eq('id', empleado_id).single();
        if (!emp) return res.json({ ok: false, msg: 'Empleado no encontrado' });
        const campo = material === 'capa' ? 'saldo_capa_kg' : material === 'capote' ? 'saldo_capote_kg' : 'saldo_picadura_kg';
        const nuevoSaldo = parseFloat(((emp[campo] || 0) - kgNum).toFixed(2));
        await supabase.from('empleados_fabriquines').update({ [campo]: nuevoSaldo }).eq('id', empleado_id);
        return res.json({ ok: true, msg: `${kgNum} kg de ${material} registrado. Nuevo saldo: ${nuevoSaldo} kg.` });
    } catch(e) { return res.json({ ok: false, msg: e.message }); }
});

router.get('/historial_prestamo/:empleado_id', isAdmin, async (req, res) => {
    try {
        const { data: abonos } = await supabase.from('abonos_prestamo').select('*').eq('empleado_id', req.params.empleado_id).order('fecha_abono', { ascending: false });
        return res.json(abonos || []);
    } catch(e) { return res.json([]); }
});

// ---------------- LIQUIDAR SEMANA ----------------
router.post('/liquidar_semana/:id', isAdmin, async (req, res) => {
    const regId = req.params.id;
    const { data: reg } = await supabase.from('recepcion_diaria').select('*, empleados_fabriquines(*)').eq('id', regId).single();
    if (!reg || reg.estado === 'liquidado') return res.send(mostrarAlerta('Error', 'Hoja no encontrada o ya liquidada.', 'error'));
    const emp = reg.empleados_fabriquines;
    const total_tabacos = reg.lun_tabacos + reg.mar_tabacos + reg.mie_tabacos + reg.jue_tabacos + reg.vie_tabacos + reg.sab_tabacos;
    const VALOR_TABACO = 85, VALOR_RECORTE = 6500, VALOR_VENA = 3500, VALOR_EXTRA = 230;
    const total_ganado = (total_tabacos * VALOR_TABACO) + (reg.recorte_kg * VALOR_RECORTE) + (reg.vena_kg * VALOR_VENA) + (reg.extra_tabacos * VALOR_EXTRA);
    const tiempo = obtenerHoraColombia();
    await supabase.from('recepcion_diaria').update({ estado: 'liquidado', total_ganado }).eq('id', regId);
    let nueva_deuda = Math.max(0, emp.deuda_tabacos - total_tabacos);
    await supabase.from('empleados_fabriquines').update({ deuda_tabacos: nueva_deuda }).eq('id', emp.id);
    await supabase.from('produccion_fabriquines').insert([{ fecha: tiempo.fecha, usuario: emp.nombre, cantidad_producida: total_tabacos, precio_por_unidad: VALOR_TABACO, total_ganado, estado: 'PAGADO' }]);
    res.redirect('/nomina');
});

// ---------------- PEDIDOS ----------------
router.post('/agregar_pedido', isAuth, async (req, res) => {
    const tiempo = obtenerHoraColombia();
    await supabase.from('pedidos_tabaco').insert([{
        material: req.body.material, cantidad: parseInt(req.body.cantidad) || 0,
        usuario: req.session.usuario, fecha: tiempo.fecha, estado: 'pendiente', nota: req.body.nota || null
    }]);
    res.redirect('/pedidos');
});

router.post('/aprobar_pedido/:id', isAdmin, async (req, res) => {
    await supabase.from('pedidos_tabaco').update({ estado: 'aprobado' }).eq('id', req.params.id);
    res.redirect('/pedidos');
});

router.post('/rechazar_pedido/:id', isAdmin, async (req, res) => {
    await supabase.from('pedidos_tabaco').update({ estado: 'rechazado' }).eq('id', req.params.id);
    res.redirect('/pedidos');
});

// ---------------- MERMAS Y COMPRAS ----------------
router.post('/registrar_compra_material', isAdmin, async (req, res) => {
    const { fecha, tipo, kg_comprado, kg_pesado, proveedor, precio_kg, nota } = req.body;
    try {
        await supabase.from('compras_materia_prima').insert([{ fecha, tipo, kg_comprado: parseFloat(kg_comprado), kg_pesado: kg_pesado ? parseFloat(kg_pesado) : null, proveedor: proveedor || null, precio_kg: precio_kg ? parseFloat(precio_kg) : null, nota: nota || null }]);
        res.redirect('/mermas?ok=compra');
    } catch(e) { res.redirect('/mermas?error=compra'); }
});

router.post('/registrar_merma', isAdmin, async (req, res) => {
    const { fecha, tipo_origen, kg_entrada, kg_util, kg_degradado, tipo_destino, nota } = req.body;
    try {
        await supabase.from('mermas_materia_prima').insert([{ fecha, tipo_origen, kg_entrada: parseFloat(kg_entrada), kg_util: parseFloat(kg_util), kg_degradado: kg_degradado ? parseFloat(kg_degradado) : 0, tipo_destino: tipo_destino || null, nota: nota || null }]);
        res.redirect('/mermas?ok=merma');
    } catch(e) { res.redirect('/mermas?error=merma'); }
});

// ---------------- PICADURA / BODEGA ----------------
router.post('/registrar_lote_picadura', isAdmin, async (req, res) => {
    const { fecha, kg_entrada, nota } = req.body;
    const kgEnt = parseFloat(kg_entrada) || 0;
    const pesos = [35, 28, 21, 14, 7];
    let kgSalida = 0, sacosACrear = [], contador = 1;
    pesos.forEach(p => {
        const qty = parseInt(req.body[`sacos_${p}`]) || 0;
        for (let i = 0; i < qty; i++) { kgSalida += p; sacosACrear.push({ numero_saco: contador++, peso_kg: p, tipo: 'estandar' }); }
    });
    const sobQty = parseInt(req.body.sacos_sobrante_qty) || 0;
    const sobKg = parseFloat(req.body.sacos_sobrante_kg) || 0;
    if (sobQty > 0 && sobKg > 0) { for (let i = 0; i < sobQty; i++) { kgSalida += sobKg; sacosACrear.push({ numero_saco: contador++, peso_kg: sobKg, tipo: 'sobrante' }); } }
    if (sacosACrear.length === 0) return res.redirect('/bodega?error=sin_sacos');
    try {
        const { data: lote, error: errLote } = await supabase.from('lotes_picadura').insert([{ fecha, kg_entrada: kgEnt, kg_salida: parseFloat(kgSalida.toFixed(2)), nota: nota || null, estado: 'activo' }]).select().single();
        if (errLote) throw errLote;
        const sacosInsert = sacosACrear.map(s => ({ lote_id: lote.id, numero_saco: s.numero_saco, peso_kg: s.peso_kg, tipo: s.tipo, estado: 'disponible' }));
        await supabase.from('sacos_picadura').insert(sacosInsert);
        res.redirect('/bodega?ok=lote_creado');
    } catch(e) { res.redirect('/bodega?error=db'); }
});

router.post('/dividir_saco', isAdmin, async (req, res) => {
    const { saco_id, distribuciones } = req.body;
    if (!saco_id || !distribuciones || distribuciones.length === 0) return res.json({ ok: false, msg: 'Datos incompletos' });
    try {
        const { data: saco } = await supabase.from('sacos_picadura').select('*').eq('id', saco_id).eq('estado', 'disponible').single();
        if (!saco) return res.json({ ok: false, msg: 'Saco no disponible' });
        const totalNuevo = distribuciones.reduce((acc, d) => acc + (parseFloat(d.peso_kg) * parseInt(d.cantidad)), 0);
        if (totalNuevo > parseFloat(saco.peso_kg) + 0.01) return res.json({ ok: false, msg: 'Excede peso original' });
        const { data: ultimos } = await supabase.from('sacos_picadura').select('numero_saco').eq('lote_id', saco.lote_id).order('numero_saco', { ascending: false }).limit(1);
        let cnt = (ultimos?.[0]?.numero_saco || 0) + 1;
        const nuevos = [];
        distribuciones.forEach(d => { for (let i = 0; i < parseInt(d.cantidad); i++) { nuevos.push({ lote_id: saco.lote_id, numero_saco: cnt++, peso_kg: parseFloat(d.peso_kg), tipo: 'estandar', estado: 'disponible' }); } });
        const sobrante = parseFloat((parseFloat(saco.peso_kg) - totalNuevo).toFixed(2));
        if (sobrante > 0.1) nuevos.push({ lote_id: saco.lote_id, numero_saco: cnt++, peso_kg: sobrante, tipo: 'sobrante', estado: 'disponible' });
        await supabase.from('sacos_picadura').insert(nuevos);
        await supabase.from('sacos_picadura').update({ estado: 'dividido' }).eq('id', saco_id);
        return res.json({ ok: true, msg: `Saco dividido en ${nuevos.length} sacos.` });
    } catch(e) { return res.json({ ok: false, msg: e.message }); }
});

router.post('/entregar_sacos', isAdmin, async (req, res) => {
    if (!req.session.usuario) return res.status(401).json({ ok: false, msg: 'Sesión expirada.' });
    const { empleado_id, sacos_ids, capa_real_kg, capote_real_kg, nota, fecha } = req.body;
    const tiempo = obtenerHoraColombia();
    const fechEntrega = fecha || tiempo.fecha;
    try {
        const arrSacosIds = Array.isArray(sacos_ids) ? sacos_ids : (sacos_ids ? sacos_ids.split(',').filter(x => x) : []);
        if (arrSacosIds.length === 0) return res.json({ ok: false, msg: 'Seleccione al menos un saco.' });
        const [resFactura, resEmpleado, resSacos] = await Promise.all([
            supabase.from('despachos_registro').select('*').eq('empleado_id', empleado_id).in('estado', ['pendiente', 'activo']).order('created_at', { ascending: true }).limit(1),
            supabase.from('empleados_fabriquines').select('*').eq('id', empleado_id).single(),
            supabase.from('sacos_picadura').select('peso_kg, tipo').in('id', arrSacosIds)
        ]);
        const despacho = resFactura.data?.[0];
        if (!despacho) return res.json({ ok: false, msg: 'No hay factura vigente.' });
        const sacosInfo = resSacos.data || [];
        const totalPicaduraKg = sacosInfo.reduce((acc, s) => acc + parseFloat(s.peso_kg || 0), 0);
        const capaKgReal = parseFloat(capa_real_kg) || 0;
        const capoteKgReal = parseFloat(capote_real_kg) || 0;
        await supabase.from('sacos_picadura').update({ estado: 'entregado', empleado_id, fecha_entrega: fechEntrega, despacho_nota: nota || null }).in('id', arrSacosIds);
        const empleado = resEmpleado.data;
        await supabase.from('empleados_fabriquines').update({
            deuda_tabacos: (parseInt(empleado.deuda_tabacos) || 0) + despacho.meta_tabacos
        }).eq('id', empleado_id);
        await supabase.from('despachos_registro').update({ estado: 'entregado', capa_kg: capaKgReal, capote_kg: capoteKgReal, picadura_kg: totalPicaduraKg }).eq('id', despacho.id);
        await registrarAuditoria(req, 'BODEGA', 'ENTREGA DE MATERIAL', { fabriquin: empleado.nombre, factura_id: despacho.id });
        return res.json({ ok: true, msg: 'Entrega completada.' });
    } catch(e) { return res.json({ ok: false, msg: e.message }); }
});

router.post('/confirmar_entrega_bodega', isAdmin, async (req, res) => {
    const { despacho_id, empleado_id, capa_real_kg, capote_real_kg, sacos_seleccionados } = req.body;
    const tiempo = obtenerHoraColombia();
    try {
        const { data: despacho } = await supabase.from('despachos_registro').select('*').eq('id', despacho_id).single();
        if (!despacho || despacho.estado !== 'pendiente') return res.send(mostrarAlerta('Error', 'Orden no válida o ya procesada.', 'error'));
        const { data: empleado } = await supabase.from('empleados_fabriquines').select('*').eq('id', empleado_id).single();
        if (!empleado) return res.send(mostrarAlerta('Error', 'Empleado no encontrado', 'error'));
        const capaKg = parseFloat(capa_real_kg) || 0;
        const capoteKg = parseFloat(capote_real_kg) || 0;
        const arrSacosIds = sacos_seleccionados ? sacos_seleccionados.split(',').filter(x => x) : [];
        let totalPicaduraKg = 0;
        if (arrSacosIds.length > 0) {
            const { data: sacosInfo } = await supabase.from('sacos_picadura').select('peso_kg').in('id', arrSacosIds);
            totalPicaduraKg = (sacosInfo || []).reduce((acc, s) => acc + parseFloat(s.peso_kg || 0), 0);
            await supabase.from('sacos_picadura').update({ estado: 'entregado', empleado_id, fecha_entrega: tiempo.fecha }).in('id', arrSacosIds);
        }
        await supabase.from('empleados_fabriquines').update({ deuda_tabacos: (parseInt(empleado.deuda_tabacos) || 0) + despacho.meta_tabacos }).eq('id', empleado.id);
        await supabase.from('recepcion_diaria').insert([{ empleado_id, usuario: empleado.codigo, fecha_registro: tiempo.fecha, estado: 'pendiente' }]);
        await supabase.from('despachos_registro').update({ estado: 'entregado', capa_kg: capaKg, capote_kg: capoteKg, picadura_kg: totalPicaduraKg }).eq('id', despacho_id);
        return res.send(mostrarAlerta('Material Entregado', `Salida registrada para ${empleado.nombre}.`, 'success', '/facturas'));
    } catch(e) { return res.send(mostrarAlerta('Error', 'No se pudo procesar.', 'error')); }
});

module.exports = router;
