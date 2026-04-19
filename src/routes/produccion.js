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

module.exports = router;
