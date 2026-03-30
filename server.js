const express = require('express');
const session = require('express-session');
const path = require('path');
const { createClient } = require('@supabase/supabase-js'); 
const QRCode = require('qrcode');
const bcrypt = require('bcrypt');

const app = express();

// --- CONFIGURACIÓN DE SUPABASE (LA NUBE) ---
const supabaseUrl = 'https://jgvnqumkzfwruhjglics.supabase.co';
const supabaseKey = 'sb_publishable_XXDhaCrrjj_DVUdxh04wFg_9dwm1_jQ';
const supabase = createClient(supabaseUrl, supabaseKey);
console.log("☁️ Conectado a la base de datos en Supabase");

// Configuración de EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'gato_negro_nube',
    resave: false,
    saveUninitialized: false
}));

app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

// 🌟 FUNCIÓN MAESTRA PARA ALERTAS
const mostrarAlerta = (titulo, texto, icono = 'warning', ruta = '/pedidos') => {
    return `
    <!DOCTYPE html>
    <html lang="es"><head><meta charset="UTF-8"><title>Aviso</title><script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script></head>
    <body style="background-color: #f4f6f9; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
        <script>
            document.addEventListener("DOMContentLoaded", function() {
                Swal.fire({ icon: '${icono}', title: '${titulo}', html: '${texto}', confirmButtonColor: '#111', allowOutsideClick: false })
                .then(() => { window.location.href = '${ruta}'; });
            });
        </script>
    </body></html>`;
};

// ⏱️ FUNCIÓN PARA FORZAR LA HORA CORRECTA (UTC-5)
function obtenerHoraColombia() {
    const ahora = new Date();
    // Forzamos la zona horaria de Bogotá (UTC-5)
    const opcionesFecha = { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' };
    const opcionesHora = { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', hour12: false };
    
    // Formato YYYY-MM-DD
    const fecha = new Intl.DateTimeFormat('en-CA', opcionesFecha).format(ahora); 
    // Formato HH:MM
    const hora = new Intl.DateTimeFormat('es-CO', opcionesHora).format(ahora); 
    
    return { fecha, hora };
}

// ---------------- LOGIN / LOGOUT ----------------
app.get('/', (req, res) => res.render('login'));

app.post('/login', async (req, res) => {
    const { usuario, password } = req.body;
    
    // Primero buscar si el usuario existe (Sin filtrar clave aquí porque ahora es un Hash)
    const { data: resultado, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('usuario', usuario)
        .single(); 

    if (error || !resultado) return res.send(mostrarAlerta('Oops...', 'Usuario no encontrado.', 'error', '/'));
    
    // Comparar la contraseña tipeada con el Hash de Supabase
    const passwordMatch = await bcrypt.compare(password, resultado.password);
    
    if (!passwordMatch) return res.send(mostrarAlerta('Acceso Denegado', 'La contraseña es incorrecta.', 'error', '/'));
    
    req.session.usuario = resultado.usuario;
    req.session.rol = resultado.rol;

    if (resultado.rol === "admin") return res.redirect("/inventario");
    if (resultado.rol === "fabriquin" || resultado.rol === "fabricacion" || resultado.rol === "envolvedor") return res.redirect("/pedidos");
    if (resultado.rol === "mantenimiento") return res.redirect("/mantenimiento");
    if (resultado.rol === "anillador" || resultado.rol === "empacador") return res.redirect("/cierre_diario");
    
    res.send("Rol no válido");
});

app.get('/logout', (req, res) => {
    req.session.destroy(); 
    res.redirect('/'); 
});

// ---------------- PANEL CRUD DE EMPLEADOS FABRIQUINES V1.8 ----------------
app.get('/empleados', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');
    const { data: empleados } = await supabase.from('empleados_fabriquines').select('*').order('codigo', { ascending: true });
    const { data: prestamos } = await supabase.from('prestamos_fabriquines').select('*').order('id', { ascending: false });
    res.render('empleados', { empleados: empleados || [], prestamos: prestamos || [] });
});

app.post('/agregar_empleado', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');
    await supabase.from('empleados_fabriquines').insert([{
        codigo: req.body.codigo.toUpperCase(),
        nombre: req.body.nombre,
        cedula: req.body.cedula,
        deuda_tabacos: 0
    }]);
    res.redirect('/empleados');
});

app.post('/eliminar_empleado/:id', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');
    await supabase.from('empleados_fabriquines').delete().eq('id', req.params.id);
    res.redirect('/empleados');
});

// ---------------- MÓDULO PRÉSTAMOS FABRIQUINES ----------------
app.post('/nuevo_prestamo', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');
    const empId = req.body.empleado_id;
    const montoNuevo = parseInt(req.body.monto_total) || 0;
    const concepto  = req.body.concepto || '';
    if (montoNuevo <= 0) return res.send(mostrarAlerta('Error', 'El monto debe ser mayor a cero.', 'warning'));

    // Buscar préstamo activo existente → acumular
    const { data: activo } = await supabase.from('prestamos_fabriquines')
        .select('*').eq('empleado_id', empId).eq('estado', 'activo').single();

    if (activo) {
        // Sumar al saldo pendiente del préstamo activo
        const nuevoSaldo = activo.saldo_pendiente + montoNuevo;
        await supabase.from('prestamos_fabriquines').update({
            saldo_pendiente: nuevoSaldo,
            monto_total: activo.monto_total + montoNuevo,
            concepto: (activo.concepto || '') + ` + ${concepto}`
        }).eq('id', activo.id);
    } else {
        // Crear nuevo préstamo
        await supabase.from('prestamos_fabriquines').insert([{
            empleado_id: empId,
            monto_total: montoNuevo,
            saldo_pendiente: montoNuevo,
            concepto: concepto,
            fecha_prestamo: new Date().toISOString().split('T')[0],
            estado: 'activo'
        }]);
    }
    res.redirect('/empleados');
});

app.post('/abonar_prestamo/:id', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');
    const prestamoId = req.params.id;
    const abono = parseInt(req.body.monto_abono) || 0;
    if (abono <= 0) return res.send(mostrarAlerta('Error', 'El abono debe ser mayor a cero.', 'warning'));

    const { data: prestamo } = await supabase.from('prestamos_fabriquines').select('*').eq('id', prestamoId).single();
    if (!prestamo) return res.send(mostrarAlerta('Error', 'Préstamo no encontrado.', 'error'));

    const nuevoSaldo = Math.max(0, prestamo.saldo_pendiente - abono);
    const nuevoEstado = nuevoSaldo === 0 ? 'pagado' : 'activo';

    await supabase.from('prestamos_fabriquines').update({
        saldo_pendiente: nuevoSaldo,
        estado: nuevoEstado
    }).eq('id', prestamoId);

    // Registrar abono en historial
    const tiempo = obtenerHoraColombia();
    await supabase.from('abonos_prestamo').insert([{
        prestamo_id: prestamoId,
        empleado_id: prestamo.empleado_id,
        monto_abono: abono,
        fecha_abono: tiempo.fecha,
        semana_ref: `Semana del ${tiempo.fecha}`
    }]);

    res.redirect('/empleados');
});


// ---------------- INVENTARIO Y KARDEX (DIVIDIDO) ----------------

app.get('/inventario', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');
    
    const { data: inventario } = await supabase.from('inventario')
        .select('*')
        .order('categoria', { ascending: true })
        .order('material', { ascending: true });
        
    // Lotes Semanales: Extraer la última semana registrada para el tracker
    const { data: ultRegistros } = await supabase.from('recepcion_diaria').select('semana_inicio').order('id', { ascending: false }).limit(1);
    const ultima_semana = ultRegistros && ultRegistros.length > 0 ? ultRegistros[0].semana_inicio : '1999-01-01';
    
    const { data: lotes_pendientes } = await supabase.from('recepcion_diaria')
        .select('*, empleados_fabriquines(*)')
        .eq('semana_inicio', ultima_semana)
        .order('id', { ascending: false });
    
    res.render('inventario', { inventario: inventario || [], lotes_pendientes: lotes_pendientes || [], ultima_semana });
});

app.get('/movimientos', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');
    
    const { data: movimientos } = await supabase.from('movimientos').select('*').order('fecha', { ascending: false }).order('hora', { ascending: false });
    const { data: inventario } = await supabase.from('inventario').select('*').order('material', { ascending: true });
    
    res.render('movimientos', { movimientos: movimientos || [], inventario: inventario || [] });
});

// ---------------- INGRESOS Y RETIROS DE MATERIAL ----------------
app.post('/agregar_inventario', async (req, res) => {
    const { material, cantidad, categoria, descripcion } = req.body;
    const cantNum = parseFloat(cantidad);
    
    const { data: existente } = await supabase.from('inventario').select('*').eq('material', material).single();
    if (existente) {
        await supabase.from('inventario').update({ cantidad: existente.cantidad + cantNum, categoria: categoria }).eq('id', existente.id);
    } else {
        await supabase.from('inventario').insert([{ material, cantidad: cantNum, categoria }]);
    }
    
    const tiempo = obtenerHoraColombia();
    
    await supabase.from('movimientos').insert([{
        fecha: tiempo.fecha,
        hora: tiempo.hora,
        tipo_movimiento: 'ENTRADA',
        material: material,
        cantidad: cantNum,
        usuario: req.session.usuario || 'Admin',
        descripcion: descripcion || 'Ingreso manual'
    }]);
    
    res.redirect('/movimientos');
});

app.post('/restar_inventario', async (req, res) => {
    const { material_id, cantidad_salida, descripcion_salida, nombre_material } = req.body;
    const cantNum = parseFloat(cantidad_salida);
    
    const { data: existente } = await supabase.from('inventario').select('*').eq('id', material_id).single();
    
    if (existente && existente.cantidad >= cantNum) {
        await supabase.from('inventario').update({ cantidad: existente.cantidad - cantNum }).eq('id', existente.id);
        
        const tiempo = obtenerHoraColombia();

        await supabase.from('movimientos').insert([{
            fecha: tiempo.fecha,
            hora: tiempo.hora,
            tipo_movimiento: 'SALIDA',
            material: nombre_material,
            cantidad: cantNum,
            usuario: req.session.usuario || 'Admin',
            descripcion: descripcion_salida || 'Salida a producción / Despacho'
        }]);
    }
    res.redirect('/movimientos');
});

app.get('/eliminar_inventario/:id', async (req, res) => {
    await supabase.from('inventario').delete().eq('id', req.params.id);
    res.redirect('/inventario');
});

// ---------------- VENTAS (MÓDULO FINANCIERO) ----------------
app.post('/registrar_venta', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');
    
    const { material_id, cantidad_vendida, valor_venta, nombre_material } = req.body;
    const cantNum = parseFloat(cantidad_vendida);
    const valorNum = parseInt(valor_venta) || 0;
    
    const { data: existente } = await supabase.from('inventario').select('*').eq('id', material_id).single();
    
    if (existente && existente.cantidad >= cantNum) {
        await supabase.from('inventario').update({ cantidad: existente.cantidad - cantNum }).eq('id', existente.id);
        
        const tiempo = obtenerHoraColombia();
        
        await supabase.from('movimientos').insert([{
            fecha: tiempo.fecha,
            hora: tiempo.hora,
            tipo_movimiento: 'SALIDA',
            material: nombre_material,
            cantidad: cantNum,
            usuario: req.session.usuario || 'Admin',
            descripcion: `[VENTA] $${valorNum.toLocaleString('es-CO')} COP`
        }]);
    }
    res.redirect('/movimientos');
});

// ============================================================================
// 🔥 MÓDULO V1.8 P2P: DESPACHO ROTATIVO AL FORMATO FABRIQUIN 2025 🔥
// ============================================================================
app.get('/despacho', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');
    
    const { data: empleados } = await supabase.from('empleados_fabriquines').select('*').order('codigo');
    
    res.render('despacho', { 
        empleados: empleados || []
    });
});

app.post('/despachar_tarea', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');
    
    const empleadoId = req.body.empleado_id;
    const fisicoEntregado = parseInt(req.body.meta_tabacos) || 0;
    const colorCesta = req.body.color_cesta || "Cestas";
    
    const { data: empleado } = await supabase.from('empleados_fabriquines').select('*').eq('id', empleadoId).single();
    if (!empleado) return res.send(mostrarAlerta('Error', 'Empleado no encontrado', 'error'));
    
    const saldoEnCasa = parseInt(empleado.deuda_tabacos) || 0;
    const nuevaMeta = saldoEnCasa + fisicoEntregado;
    
    if (fisicoEntregado <= 0) return res.send(mostrarAlerta('Error Lógico', 'La entrega debe ser mayor a cero', 'warning'));
    
    // Kg base calculados automáticamente
    const factor = fisicoEntregado / 1000;
    const capaKgBase     = parseFloat((factor * 1.0).toFixed(2));
    const capoteKgBase   = parseFloat((factor * 1.8).toFixed(2));
    const picaduraKgBase = parseFloat((factor * 7.0).toFixed(2));

    // Kg reales enviados desde el form (el admin puede haberlos editado)
    const capaKgReal     = parseFloat(req.body.capa_kg)     || capaKgBase;
    const capoteKgReal   = parseFloat(req.body.capote_kg)   || capoteKgBase;
    const picaduraKgReal = parseFloat(req.body.picadura_kg) || picaduraKgBase;
    const cestasCant     = parseInt(req.body.cestas_cant)   || Math.ceil(fisicoEntregado / 1250);
    
    // Saldo anterior de material del fabriquín
    const saldoCapaAnt     = parseFloat(empleado.saldo_capa_kg)     || 0;
    const saldoCapoteAnt   = parseFloat(empleado.saldo_capote_kg)   || 0;
    const saldoPicaduraAnt = parseFloat(empleado.saldo_picadura_kg) || 0;

    // Nuevo saldo = ant + base calculada - real entregado
    const nuevoSaldoCapa     = parseFloat((saldoCapaAnt     + capaKgBase     - capaKgReal).toFixed(2));
    const nuevoSaldoCapote   = parseFloat((saldoCapoteAnt   + capoteKgBase   - capoteKgReal).toFixed(2));
    const nuevoSaldoPicadura = parseFloat((saldoPicaduraAnt + picaduraKgBase - picaduraKgReal).toFixed(2));
    
    const tiempo = obtenerHoraColombia();
    
    // 1. Descontar del inventario maestro
    const { data: inv } = await supabase.from('inventario').select('*');
    if (inv) {
        let c = capaKgReal, cp = capoteKgReal, pi = picaduraKgReal;
        
        let mCesta = inv.find(i => i.material.toLowerCase() === colorCesta.toLowerCase());
        if (!mCesta || mCesta.cantidad < cestasCant) {
            return res.send(mostrarAlerta('Stock Insuficiente', `No hay suficientes ${colorCesta}. Requeridas: ${cestasCant}, Disponibles: ${mCesta ? mCesta.cantidad : 0}`, 'error'));
        }
        
        let iCapa    = inv.find(i => i.material.toLowerCase().includes('capa'));
        let iCapote  = inv.find(i => i.material.toLowerCase().includes('capote'));
        let iPicadura = inv.find(i => (i.material.toLowerCase().includes('picadura') || i.material.toLowerCase().includes('tripa') || i.material.toLowerCase().includes('material')) && i.material.toLowerCase() !== 'materia prima');
        
        if (!iCapa    || iCapa.cantidad    < c)  return res.send(mostrarAlerta('Stock Insuficiente', `Falta Capa. Requerida: ${c}kg, Disponible: ${iCapa ? iCapa.cantidad : 0}kg`, 'error'));
        if (!iCapote  || iCapote.cantidad  < cp) return res.send(mostrarAlerta('Stock Insuficiente', `Falta Capote. Requerida: ${cp}kg, Disponible: ${iCapote ? iCapote.cantidad : 0}kg`, 'error'));
        if (!iPicadura || iPicadura.cantidad < pi) return res.send(mostrarAlerta('Stock Insuficiente', `Falta Picadura. Requerida: ${pi}kg, Disponible: ${iPicadura ? iPicadura.cantidad : 0}kg`, 'error'));
        
        for (let item of inv) {
            let m = item.material.toLowerCase();
            if (m.includes('capa')    && c  > 0) { await supabase.from('inventario').update({ cantidad: item.cantidad - c  }).eq('id', item.id); c  = 0; }
            if (m.includes('capote')  && cp > 0) { await supabase.from('inventario').update({ cantidad: item.cantidad - cp }).eq('id', item.id); cp = 0; }
            if ((m.includes('picadura') || m.includes('tripa') || m.includes('material')) && m !== 'materia prima' && pi > 0) { await supabase.from('inventario').update({ cantidad: item.cantidad - pi }).eq('id', item.id); pi = 0; }
        }
        if (cestasCant > 0 && mCesta) {
            await supabase.from('inventario').update({ cantidad: mCesta.cantidad - cestasCant }).eq('id', mCesta.id);
        }
    }
    
    // 2. Kardex
    const nombreCorto = empleado.nombre.split(' ').slice(0, 2).join(' ');
    const desc = `Despacho Tarea [${nuevaMeta} META GLOBAL] a ${empleado.codigo} - ${nombreCorto}`;
    await supabase.from('movimientos').insert([
        { fecha: tiempo.fecha, hora: tiempo.hora, tipo_movimiento: 'SALIDA', material: 'Capa',    cantidad: capaKgReal,     usuario: 'Admin', descripcion: desc },
        { fecha: tiempo.fecha, hora: tiempo.hora, tipo_movimiento: 'SALIDA', material: 'Capote',  cantidad: capoteKgReal,   usuario: 'Admin', descripcion: desc },
        { fecha: tiempo.fecha, hora: tiempo.hora, tipo_movimiento: 'SALIDA', material: 'Picadura',cantidad: picaduraKgReal, usuario: 'Admin', descripcion: desc },
        { fecha: tiempo.fecha, hora: tiempo.hora, tipo_movimiento: 'SALIDA', material: colorCesta,cantidad: cestasCant,     usuario: 'Admin', descripcion: desc }
    ]);

    // 3A. Actualizar deuda de tabacos (SIEMPRE - columna original garantizada)
    await supabase.from('empleados_fabriquines').update({
        deuda_tabacos: nuevaMeta
    }).eq('id', empleado.id);

    // 3B. Actualizar saldos de material (requiere migracion SQL v250 - no falla el flujo si no existe)
    try {
        await supabase.from('empleados_fabriquines').update({
            saldo_capa_kg:     Math.max(0, nuevoSaldoCapa),
            saldo_capote_kg:   Math.max(0, nuevoSaldoCapote),
            saldo_picadura_kg: Math.max(0, nuevoSaldoPicadura)
        }).eq('id', empleado.id);
    } catch(e) { /* columnas aún no migradas — sin problema */ }

    // 4. Formato imprimible
    const fechaText = `${tiempo.fecha} ${tiempo.hora}`;
    res.render('formato_despacho', {
        empleado: empleado,
        meta: nuevaMeta,
        saldo_casa: saldoEnCasa,
        fecha_actual: fechaText,
        params: {
            capa: capaKgReal.toFixed(2), capote: capoteKgReal.toFixed(2), picadura: picaduraKgReal.toFixed(2),
            saldo_capa:     saldoCapaAnt.toFixed(2),
            saldo_capote:   saldoCapoteAnt.toFixed(2),
            saldo_picadura: saldoPicaduraAnt.toFixed(2),
            nuevo_saldo_capa:     Math.max(0, nuevoSaldoCapa).toFixed(2),
            nuevo_saldo_capote:   Math.max(0, nuevoSaldoCapote).toFixed(2),
            nuevo_saldo_picadura: Math.max(0, nuevoSaldoPicadura).toFixed(2),
            cestas: cestasCant, color_cesta: colorCesta
        }
    });
});

// ============================================================================
// 🔥 MÓDULO V1.8 P2P: RECEPCIÓN ACUMULATIVA (L-S) Y SUBPRODUCTOS 🔥
// ============================================================================
app.get('/recepcion_diaria', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');
    
    const { data: empleados } = await supabase.from('empleados_fabriquines').select('*').order('codigo');
    const { data: registros } = await supabase.from('recepcion_diaria').select('*').eq('estado', 'pendiente');
    
    // Traer préstamos activos para mostrar en la tabla
    let prestamosActivos = [];
    try {
        const { data: p } = await supabase.from('prestamos_fabriquines').select('*').eq('estado', 'activo');
        prestamosActivos = p || [];
    } catch(e) { /* tabla aún no migrada */ }
    
    const empleadosActivos = (empleados || []).filter(emp => emp.deuda_tabacos > 0 || (registros || []).some(r => r.empleado_id === emp.id));
    
    res.render('recepcion_diaria', { empleados: empleadosActivos, registros: registros || [], prestamos: prestamosActivos });
});


app.post('/recepcion_diaria_guardar', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');
    
    const empId = req.body.empleado_id;
    const regId = req.body.registro_id;
    const tiempo = obtenerHoraColombia();
    
    const { data: emp } = await supabase.from('empleados_fabriquines').select('*').eq('id', empId).single();
    
    // Extracción de Cantidades
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
    
    // Función Transaccional "En Vivo" (Inyecta a DB y Crea Kardex)
    async function difStock(materialNom, categ, dif, tipoDesc) {
        if (dif === 0) return;
        const nombreCorto = emp ? emp.nombre.split(' ').slice(0, 2).join(' ') : 'Fabriquín';
        const cod = emp ? emp.codigo : 'N/A';
        const tipoMov = dif > 0 ? 'ENTRADA' : 'SALIDA';
        const absDif = Math.abs(dif);
        
        const { data: invT } = await supabase.from('inventario').select('*').eq('material', materialNom).single();
        if (invT) await supabase.from('inventario').update({ cantidad: invT.cantidad + dif }).eq('id', invT.id);
        else await supabase.from('inventario').insert([{ material: materialNom, cantidad: dif, categoria: categ }]);
        
        await supabase.from('movimientos').insert([{
            fecha: tiempo.fecha, hora: tiempo.hora, tipo_movimiento: tipoMov, material: materialNom, cantidad: absDif, usuario: 'Admin',
            descripcion: `Registro Diario (${tipoDesc}): ${cod} - ${nombreCorto}`
        }]);
    }

    // Inyectar TODAS las diferencias diariamente!
    await difStock('Tabacos', 'En Proceso', newTotal - oldTab, 'Lotes Tarea');

    // --- RETORNO DE CESTAS AL COLOR CORRECTO ---
    // Buscamos el último despacho de este fabriquín para saber qué color de cesta se prestó
    const difCestas = newTotalC - oldCest;
    let colorCestaRetorno = 'Cestas Generales'; // fallback seguro
    if (difCestas !== 0) {
        const { data: ultimoDespacho } = await supabase.from('movimientos')
            .select('material')
            .ilike('material', 'Cestas%')
            .ilike('descripcion', `%${emp ? emp.codigo : ''}%`)
            .order('id', { ascending: false })
            .limit(1)
            .single();
        if (ultimoDespacho && ultimoDespacho.material) {
            colorCestaRetorno = ultimoDespacho.material;
        }
    }
    await difStock(colorCestaRetorno, 'Herramientas', difCestas, 'Retorno Bulto');
    // --- FIN RETORNO CESTAS ---

    await difStock('Tabacos Extras (Ventas)', 'Producto Terminado', newExtra - oldExt, 'Compra Directa');
    await difStock('Recorte', 'Materia Prima', newRecorte - oldRec, 'Merma');
    await difStock('Vena', 'Materia Prima', newVena - oldVen, 'Merma');
    
    const dataObj = {
        empleado_id: empId, semana_inicio: tiempo.fecha,
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
        delete dataObj.semana_inicio; 
        await supabase.from('recepcion_diaria').update(dataObj).eq('id', regId);
    } else {
        await supabase.from('recepcion_diaria').insert([dataObj]);
    }

    // --- ABONO AL PRÉSTAMO (si se ingresó) ---
    const prestamoId = req.body.prestamo_id;
    const abonoMonto = parseInt(req.body.abono_prestamo) || 0;
    if (prestamoId && abonoMonto > 0) {
        try {
            const { data: prest } = await supabase.from('prestamos_fabriquines').select('*').eq('id', prestamoId).single();
            if (prest) {
                const nuevoSaldo  = Math.max(0, prest.saldo_pendiente - abonoMonto);
                const nuevoEstado = nuevoSaldo === 0 ? 'pagado' : 'activo';
                await supabase.from('prestamos_fabriquines').update({ saldo_pendiente: nuevoSaldo, estado: nuevoEstado }).eq('id', prestamoId);
                await supabase.from('abonos_prestamo').insert([{
                    prestamo_id: prestamoId, empleado_id: empId,
                    monto_abono: abonoMonto, fecha_abono: tiempo.fecha,
                    semana_ref: `Registro ${tiempo.fecha}`
                }]);
            }
        } catch(e) { /* tabla prestamos aún no migrada */ }
    }

    res.redirect('/recepcion_diaria');
});

app.post('/liquidar_semana/:id', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');
    const regId = req.params.id;
    
    // Traer el registro con los datos del empleado emparentado
    const { data: reg } = await supabase.from('recepcion_diaria').select('*, empleados_fabriquines(*)').eq('id', regId).single();
    if (!reg || reg.estado === 'liquidado') return res.send(mostrarAlerta('Error', 'Hoja no encontrada o ya liquidada.', 'error'));
    
    const emp = reg.empleados_fabriquines;
    
    // SUMAS GLOBALES DE LA SEMANA
    const total_cestas = reg.lun_cestas + reg.mar_cestas + reg.mie_cestas + reg.jue_cestas + reg.vie_cestas + reg.sab_cestas;
    const total_tabacos = reg.lun_tabacos + reg.mar_tabacos + reg.mie_tabacos + reg.jue_tabacos + reg.vie_tabacos + reg.sab_tabacos;
    
    // ECONOMÍA
    const VALOR_TABACO = 85; 
    const VALOR_RECORTE = 6500;
    const VALOR_VENA = 3500;
    const VALOR_EXTRA = 230;
    
    const pago_tabacos = total_tabacos * VALOR_TABACO;
    const pago_recorte = reg.recorte_kg * VALOR_RECORTE;
    const pago_vena = reg.vena_kg * VALOR_VENA;
    const pago_extras = reg.extra_tabacos * VALOR_EXTRA;
    const total_ganado = pago_tabacos + pago_recorte + pago_vena + pago_extras;
    
    const tiempo = obtenerHoraColombia();
    
    // 1. CERRAR HOJA EXCEL
    await supabase.from('recepcion_diaria').update({ estado: 'liquidado', total_ganado: total_ganado }).eq('id', regId);
    
    // 2. DESCONTAR LA DEUDA DE TABACOS ROTATIVA
    let nueva_deuda = emp.deuda_tabacos - total_tabacos;
    if (nueva_deuda < 0) nueva_deuda = 0; 
    await supabase.from('empleados_fabriquines').update({ deuda_tabacos: nueva_deuda }).eq('id', emp.id);
    
    // 3. ACTUALIZAR HISTORIAL FINANCIERO (Físico ya fue actualizado en vivo por Recepcion Diaria Diferencial)
    await supabase.from('produccion_fabriquines').insert([{
        fecha: tiempo.fecha, usuario: emp.nombre, cantidad_producida: total_tabacos, precio_por_unidad: VALOR_TABACO, total_ganado: total_ganado, estado: 'PAGADO'
    }]);

    // REDIRECCIÓN DIRECTA A NOMINA (El PDF ahora se saca desde Contabilidad)
    res.redirect('/nomina');
});

// --- NUEVO MÓDULO BIG DATA: HISTORIAL DE ENTREGAS ---
app.get('/entregas_historicas', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');
    
    // Traemos TODAS las hojas, cerradas y pendientes, en orden de creación inversa (Más nuevas arriba)
    const { data: entregas } = await supabase.from('recepcion_diaria')
        .select('*, empleados_fabriquines(*)')
        .order('id', { ascending: false });
        
    res.render('entregas_historicas', { entregas: entregas || [] });
});

// ---------------- MÁQUINAS Y EQUIPOS ----------------
app.get('/maquinas', async (req, res) => {
    if (!req.session.rol || (req.session.rol !== 'admin' && req.session.rol !== 'mantenimiento')) return res.redirect('/');
    
    // Traemos datos de máquinas y de mantenimientos
    const { data: maquinas } = await supabase.from('maquinas').select('*').order('nombre', { ascending: true });
    const { data: mantenimientos } = await supabase.from('mantenimiento').select('*');

    // Procesamos la lógica de Alertas y Costos
    const maquinasProcesadas = (maquinas || []).map(m => {
        // Encontrar mantenimientos de esta máquina
        const mttosMaquina = (mantenimientos || []).filter(mtto => mtto.maquina === m.nombre);
        
        let costo_total = 0;
        mttosMaquina.forEach(mtto => {
           if (mtto.estado === 'REALIZADO') costo_total += (mtto.costo_mo || 0) + (mtto.costo_mat || 0);
        });
        m.costo_historico = costo_total;

        // Calcular alerta preventiva
        if (m.ultimo_mtto) {
            const fechaUltimo = new Date(m.ultimo_mtto + 'T00:00:00'); // Evitar fallos de zona horaria
            const fechaActual = new Date();
            const diasTranscurridos = Math.floor((fechaActual - fechaUltimo) / (1000 * 60 * 60 * 24));
            const limite = m.frecuencia_mtto_dias || 30;
            m.dias_para_mtto = limite - diasTranscurridos;
        } else {
            m.dias_para_mtto = "Sin Registro";
        }
        return m;
    });

    res.render('maquinas', { maquinas: maquinasProcesadas });
});

app.post('/agregar_maquina', async (req, res) => {
    const { error } = await supabase.from('maquinas').insert([{ 
        nombre: req.body.nombre,
        area: req.body.area,
        marca: req.body.marca,
        modelo: req.body.modelo,
        horas_dia: parseInt(req.body.horas_dia) || 8,
        fabricante: req.body.fabricante,
        codigo: req.body.codigo,
        estado: req.body.estado,
        observaciones: req.body.observaciones || 'Ninguna',
        frecuencia_mtto_dias: parseInt(req.body.frecuencia_mtto_dias) || 30 // NUEVO DATO INTELIGENTE
    }]);

    if (error) {
        console.error("❌ ERROR DE SUPABASE AL GUARDAR MÁQUINA:", error);
        return res.send("Hubo un error al guardar. Revisa la terminal negra de Visual Studio.");
    }

    res.redirect('/maquinas');
});

app.get('/eliminar_maquina/:id', async (req, res) => {
    await supabase.from('maquinas').delete().eq('id', req.params.id);
    res.redirect('/maquinas');
});

// --- EDITAR MÁQUINA Y FORZAR HISTÓRICO DE MTTO ---
app.post('/editar_maquina/:id', async (req, res) => {
    if (!req.session.rol || (req.session.rol !== 'admin' && req.session.rol !== 'mantenimiento')) return res.redirect('/');
    
    // Objeto con los datos a actualizar
    const datosActualizados = {
        nombre: req.body.nombre,
        area: req.body.area,
        marca: req.body.marca,
        modelo: req.body.modelo,
        horas_dia: parseInt(req.body.horas_dia) || 8,
        codigo: req.body.codigo,
        estado: req.body.estado,
        observaciones: req.body.observaciones,
        fabricante: req.body.fabricante,
        frecuencia_mtto_dias: parseInt(req.body.frecuencia_mtto_dias) || 30
    };

    // Si el administrador le metió una fecha manual histórica, la inyectamos para apagar alertas rojas
    if (req.body.ultimo_mtto) {
        datosActualizados.ultimo_mtto = req.body.ultimo_mtto;
    }

    const { error } = await supabase.from('maquinas')
        .update(datosActualizados)
        .eq('id', req.params.id);

    if (error) {
        console.error("❌ ERROR AL EDITAR MÁQUINA:", error);
    }

    res.redirect('/maquinas');
});

// --- FICHA TÉCNICA DIGITAL (CV DE LA MÁQUINA) ---
app.get('/maquinas/ficha/:id', async (req, res) => {
    const maquinaId = req.params.id;
    
    const { data: maquina } = await supabase.from('maquinas').select('*').eq('id', maquinaId).single();
    if (!maquina) return res.send("<h2>❌ Máquina no encontrada en el sistema.</h2>");

    const { data: mantenimientos } = await supabase.from('mantenimiento')
        .select('*')
        .eq('maquina', maquina.nombre)
        .order('fecha', { ascending: false })
        .order('hora', { ascending: false });

    // Calculamos el dinero invertido
    let costoPreventivo = 0;
    let costoCorrectivo = 0;
    
    if (mantenimientos) {
        mantenimientos.forEach(mtto => {
            if (mtto.estado === 'REALIZADO') {
                const totalMtto = (mtto.costo_mo || 0) + (mtto.costo_mat || 0);
                if (mtto.tipo === 'Preventivo') costoPreventivo += totalMtto;
                if (mtto.tipo === 'Correctivo') costoCorrectivo += totalMtto;
            }
        });
    }
    
    maquina.costo_preventivo = costoPreventivo;
    maquina.costo_correctivo = costoCorrectivo;
    maquina.costo_total = costoPreventivo + costoCorrectivo;

    res.render('ficha_maquina', { 
        maquina: maquina, 
        historial: mantenimientos || [] 
    });
});

// --- PANEL CENTRAL DE QRs (VISTA ADMINISTRATIVA) ---
app.get('/maquinas/qrs', async (req, res) => {
    // Solo permitimos acceso a admin y mantenimiento
    if (!req.session.rol || (req.session.rol !== 'admin' && req.session.rol !== 'mantenimiento')) return res.redirect('/');
    
    const { data: maquinas } = await supabase.from('maquinas').select('*').order('nombre', { ascending: true });
    
    res.render('maquinas_qrs', { maquinas: maquinas || [] });
});

// ---------------- USUARIOS Y MANTENIMIENTO ----------------
app.get('/usuarios', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');
    const { data: usuarios } = await supabase.from('usuarios').select('*').order('id');
    res.render('usuarios', { usuarios: usuarios || [] });
});

app.post('/agregar_usuario', async (req, res) => {
    await supabase.from('usuarios').insert([req.body]);
    res.redirect('/usuarios');
});

app.get('/eliminar_usuario/:id', async (req, res) => {
    await supabase.from('usuarios').delete().eq('id', req.params.id);
    res.redirect('/usuarios');
});

// ---------------- MANTENIMIENTO ----------------
app.get('/mantenimiento', async (req, res) => {
    if (!req.session.rol || (req.session.rol !== 'admin' && req.session.rol !== 'mantenimiento')) return res.redirect('/');
    
    const { data: maquinas } = await supabase.from('maquinas').select('nombre, codigo').order('nombre');
    const { data: mantenimientos } = await supabase.from('mantenimiento').select('*').order('id', { ascending: false });
    
    res.render('mantenimiento', { 
        maquinas: maquinas || [], 
        mantenimientos: mantenimientos || [] 
    });
});

app.post('/agregar_mantenimiento', async (req, res) => {
    await supabase.from('mantenimiento').insert([{ 
        fecha: req.body.fecha,
        hora: req.body.hora,
        maquina: req.body.maquina,
        tipo: req.body.tipo,
        descripcion: req.body.descripcion,
        tiempo_min: parseInt(req.body.tiempo_min) || 0,
        costo_mo: parseFloat(req.body.costo_mo) || 0,
        costo_mat: parseFloat(req.body.costo_mat) || 0,
        hecho_por: req.body.hecho_por,
        estado: req.body.estado
    }]);

    // SI EL MTTO ES PREVENTIVO, REINICIAMOS EL CONTADOR DE LA MÁQUINA
    if (req.body.tipo === 'Preventivo' && req.body.estado === 'REALIZADO') {
        const tiempo = obtenerHoraColombia();
        // Usamos la fecha real insertada para reiniciar o la de hoy si no mandan
        await supabase.from('maquinas').update({ ultimo_mtto: req.body.fecha || tiempo.fecha }).eq('nombre', req.body.maquina);
    }

    res.redirect('/mantenimiento');
});

// ---------------- INICIAR SERVIDOR / EXPORTAR A VERCEL ----------------
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`🐾 Servidor Gato Negro corriendo en http://localhost:${PORT}`));
}

// --- GENERADOR DE CÓDIGOS QR PARA MÁQUINAS ---
app.get('/maquina/:id/qr', async (req, res) => {
    const maquinaId = req.params.id;
    
    // 1. Detectamos automáticamente si estamos en Vercel (Production) o en Localhost
    const baseURL = process.env.NODE_ENV === 'production'
        ? 'https://gato-negro.vercel.app' // URL Real (Vercel)
        : `http://localhost:${PORT}`;     // URL Local (Tu PC)

    // 2. Definimos a qué URL va a apuntar el QR (A la futura ficha técnica)
    const urlDeLaFicha = `${baseURL}/maquinas/ficha/${maquinaId}`;

    try {
        // 3. Generamos el código QR como un Buffer de imagen PNG
        const qrBuffer = await QRCode.toBuffer(urlDeLaFicha, {
            type: 'png',
            margin: 1,
            width: 250 // Tamaño de la imagen
        });

        // 4. Se lo enviamos al navegador como si fuera una foto normal
        res.type('png');
        res.send(qrBuffer);

    } catch (error) {
        console.error('Error generando QR:', error);
        res.status(500).send('Error al generar el Código QR.');
    }
});

// ==================== FASE 5: NÓMINA Y FACTURACIÓN ====================

// --- DASHBOARD ANALÍTICO Y FINANCIERO (V2.3) ---
app.get('/analitica', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');

    // 1. Obtener gastos de Nómina (Pagos completados a la mano obrera)
    const { data: produccion } = await supabase.from('produccion_fabriquines')
                                         .select('total_ganado')
                                         .eq('estado', 'PAGADO');
    let totalNomina = 0;
    if (produccion) {
        produccion.forEach(p => totalNomina += parseFloat(p.total_ganado || 0));
    }

    // 2. Obtener gastos Confidenciales de Mantenimiento de Maquinaria
    const { data: mantenimientos } = await supabase.from('mantenimiento')
                                             .select('costo_mo, costo_mat')
                                             .eq('estado', 'REALIZADO');
    let totalMantenimiento = 0;
    if (mantenimientos) {
        mantenimientos.forEach(m => totalMantenimiento += (parseFloat(m.costo_mo || 0) + parseFloat(m.costo_mat || 0)));
    }

    // 3. Obtener Ingresos Mayoristas (Anclado temporalmente en 0 hasta V3.0)
    const totalIngresos = 0; 

    // 4. Agrupar la sábana gigante de datos de Movimientos para Chart.js
    const { data: raw_movs } = await supabase.from('movimientos')
                                         .select('tipo_movimiento, material, cantidad, fecha');

    const finanzas = {
        ingresos: totalIngresos,
        nomina: totalNomina,
        mantenimiento: totalMantenimiento
    };

    res.render('analitica', { finanzas, raw_movs: raw_movs || [] });
});

// --- PANEL DEL FABRIQUÍN (Cierre Diario) ---
app.get('/cierre_diario', async (req, res) => {
    const rolesPermitidos = ['fabriquin', 'fabricacion', 'envolvedor', 'anillador', 'empacador'];
    if (!req.session.rol || !rolesPermitidos.includes(req.session.rol)) return res.redirect('/');
    
    const usuario = req.session.usuario;
    
    // Obtener producción de la semana (estado PENDIENTE)
    const { data: produccion } = await supabase.from('produccion_fabriquines')
        .select('*').eq('usuario', usuario).eq('estado', 'PENDIENTE').order('fecha', { ascending: false });
        
    // Ganancia acumulada
    let ganancia_semana = 0;
    if (produccion) produccion.forEach(p => ganancia_semana += parseFloat(p.total_ganado || 0));
    
    // Obtener deuda activa
    const { data: deudas } = await supabase.from('deudores_fabriquines')
        .select('*').eq('usuario', usuario).eq('estado', 'ACTIVA');
        
    let deuda_total = 0;
    if (deudas) deudas.forEach(d => deuda_total += parseFloat(d.monto_deuda || 0));

    // Novedad: Obtener historial de tareas recibidas del Admin
    const { data: tareas_asignadas } = await supabase.from('pedidos')
        .select('*').eq('usuario', usuario).order('id', { ascending: false });
    
    res.render('cierre_diario', { 
        produccion: produccion || [], 
        ganancia_semana, 
        deuda_total, 
        saldo_neto: ganancia_semana - deuda_total,
        usuario,
        tareas_asignadas: tareas_asignadas || [],
        session: req.session
    });
});

    // Produccion manual del fabriquin fue removida. El Admin lo carga automático desde /recepcion.

// --- PANEL DE NÓMINA (ADMINISTRADOR) ---
app.get('/nomina', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');
    
    // Viejos arrays de la fase pasada
    const { data: usuarios } = await supabase.from('usuarios').select('*').in('rol', ['fabriquin', 'fabricacion', 'envolvedor']);
    const { data: deudas_activas } = await supabase.from('deudores_fabriquines').select('*').eq('estado', 'ACTIVA');
    
    // Nuevos arreglos Listos Para Imprimir V1.8 (Administración Central)
    const { data: cierres_pendientes } = await supabase.from('recepcion_diaria').select('*, empleados_fabriquines(*)').eq('estado', 'liquidado');
    
    res.render('nomina', { 
        nomina: [], 
        deudas_activas: deudas_activas || [], 
        cierres_pendientes: cierres_pendientes || [] 
    });
});

// --- V2.0 DESACOPLE PDF ---
app.get('/imprimir_nomina_v18/:id', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');
    const regId = req.params.id;
    
    // Traer el registro con los datos del empleado emparentado
    const { data: reg } = await supabase.from('recepcion_diaria').select('*, empleados_fabriquines(*)').eq('id', regId).single();
    if (!reg) return res.redirect('/nomina');
    
    const emp = reg.empleados_fabriquines;
    const total_cestas = reg.lun_cestas + reg.mar_cestas + reg.mie_cestas + reg.jue_cestas + reg.vie_cestas + reg.sab_cestas;
    const total_tabacos = reg.lun_tabacos + reg.mar_tabacos + reg.mie_tabacos + reg.jue_tabacos + reg.vie_tabacos + reg.sab_tabacos;
    
    const VALOR_TABACO = 85; 
    const VALOR_RECORTE = 6500;
    const VALOR_VENA = 3500;
    const VALOR_EXTRA = 230;
    
    const pago_tabacos = total_tabacos * VALOR_TABACO;
    const pago_recorte = reg.recorte_kg * VALOR_RECORTE;
    const pago_vena = reg.vena_kg * VALOR_VENA;
    const pago_extras = reg.extra_tabacos * VALOR_EXTRA;
    const total_ganado = pago_tabacos + pago_recorte + pago_vena + pago_extras;
    
    res.render('formato_nomina_v18', {
        empleado: emp, reg: reg, tiempo: obtenerHoraColombia(),
        totales: { tabacos: total_tabacos, cestas: total_cestas },
        pagos: { pago_tabacos, pago_recorte, pago_vena, pago_extras, total_ganado, valor_tabaco: VALOR_TABACO, valor_recorte: VALOR_RECORTE, valor_vena: VALOR_VENA, valor_extra: VALOR_EXTRA }
    });
});

app.post('/archivar_cierre_v18/:id', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');
    // Archivar y sacar del tablero de PDF central
    await supabase.from('recepcion_diaria').update({ estado: 'pagado_y_archivado' }).eq('id', req.params.id);
    res.redirect('/nomina');
});

// --- GENERAR FACTURA IMPRIMIBLE ---
app.get('/factura_nomina/:usuario', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');
    const userToPay = req.params.usuario;
    
    const { data: userData } = await supabase.from('usuarios').select('identificacion').eq('usuario', userToPay).single();
    const documento = (userData && userData.identificacion) ? userData.identificacion : '123456789';

    const { data: produccion } = await supabase.from('produccion_fabriquines').select('*').eq('usuario', userToPay).eq('estado', 'PENDIENTE');
    const { data: deudas } = await supabase.from('deudores_fabriquines').select('*').eq('usuario', userToPay).eq('estado', 'ACTIVA');
    
    let subtotal = 0;
    (produccion || []).forEach(p => subtotal += parseFloat(p.total_ganado));
    
    let descuentos = 0;
    (deudas || []).forEach(d => descuentos += parseFloat(d.monto_deuda));
    
    const total_neto = subtotal - descuentos;
    
    res.render('factura', { 
        usuario: userToPay, 
        produccion: produccion || [], 
        deudas: deudas || [], 
        subtotal, 
        descuentos, 
        total_neto,
        fecha: obtenerHoraColombia().fecha,
        documento
    });
});

app.post('/pagar_nomina/:usuario', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');
    const userToPay = req.params.usuario;
    
    await supabase.from('produccion_fabriquines').update({ estado: 'PAGADO' }).eq('usuario', userToPay).eq('estado', 'PENDIENTE');
    await supabase.from('deudores_fabriquines').update({ estado: 'COBRADA' }).eq('usuario', userToPay).eq('estado', 'ACTIVA');
    res.redirect('/nomina');
});

app.post('/agregar_deuda', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');
    await supabase.from('deudores_fabriquines').insert([{
        fecha: req.body.fecha || obtenerHoraColombia().fecha,
        usuario: req.body.usuario,
        monto_deuda: parseFloat(req.body.monto),
        concepto: req.body.concepto,
        estado: 'ACTIVA'
    }]);
    res.redirect('/nomina');
});

// --- MÓDULO 7: DESPACHOS DE ANILLADO Y EMPAQUE ---
app.get('/despachos_empaque', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');
    
    const { data: usuarios } = await supabase.from('usuarios').select('*').in('rol', ['anillador', 'empacador']);
    const { data: inventario } = await supabase.from('inventario').select('*').gt('cantidad', 0);
    const { data: despachos_activos } = await supabase.from('pedidos').select('*').eq('estado', 'aprobado');
    
    // Filtrar solo los despachos aprobados de anilladores y empacadores
    let despachosRoles = [];
    if (despachos_activos && usuarios) {
        despachos_activos.forEach(d => {
            if (usuarios.find(u => u.usuario === d.usuario)) despachosRoles.push(d);
        });
    }

    res.render('despacho_empaque', { session: req.session, usuarios, inventario, despachos_activos: despachosRoles });
});

app.post('/asignar_despacho', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');
    const { usuario, material_id, material_nombre, cantidad, unidad_medida } = req.body;
    let cantNum = parseFloat(cantidad);
    
    let desc = `Despacho a ${usuario} para tarea de empaque/anillado.`;
    
    // Novedad: Si entregan cestas de anillado, el descuento en inventario es x1500
    if (unidad_medida === 'cestas') {
        desc = `Despacho de ${cantNum} Cestas a ${usuario} para tarea de anillado.`;
        cantNum = cantNum * 1500;
    }

    const { data: inv } = await supabase.from('inventario').select('*').eq('id', material_id).single();
    if (inv && inv.cantidad >= cantNum) {
        await supabase.from('inventario').update({ cantidad: inv.cantidad - cantNum }).eq('id', inv.id);
        const tiempo = obtenerHoraColombia();
        
        await supabase.from('movimientos').insert([{
            fecha: tiempo.fecha, hora: tiempo.hora, tipo_movimiento: 'SALIDA',
            material: material_nombre, cantidad: cantNum, usuario: req.session.usuario || 'Admin',
            descripcion: desc
        }]);

        await supabase.from('pedidos').insert([{
            material: material_nombre, cantidad: cantNum, usuario: usuario,
            fecha: tiempo.fecha, estado: 'aprobado', entregado: 0, rezago: cantNum
        }]);
    }
    res.redirect('/despachos_empaque');
});

app.get('/recepcion_empaque', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');
    
    const { data: despachos } = await supabase.from('pedidos').select('*').eq('estado', 'aprobado');
    const { data: usuarios } = await supabase.from('usuarios').select('usuario, rol');
    
    let despachosRoles = [];
    if (despachos && usuarios) {
        despachos.forEach(d => {
            let userMatch = usuarios.find(u => u.usuario === d.usuario);
            if (userMatch && (userMatch.rol === 'anillador' || userMatch.rol === 'empacador')) {
                d.rol_usuario = userMatch.rol;
                despachosRoles.push(d);
            }
        });
    }

    res.render('recepcion_empaque', { session: req.session, despachos_pendientes: despachosRoles });
});

app.post('/recibir_empaque/:id', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');
    
    const idPedido = req.params.id;
    const { rol, usuario, cestas_anilladas, bultos_50, bultos_25, cajas_50_sueltas, cajas_25_sueltas } = req.body;
    const tiempo = obtenerHoraColombia();
    
    // Tarifas Configurables Base (Phase 7)
    const TARIFA_ANILLADO = 12000;
    const TARIFA_BULTO50 = 10000;
    const TARIFA_BULTO25 = 7000;
    // Bulto de 50 trae 25 cajas. Bulto de 25 trae 50 cajas.
    const TARIFA_CAJA50 = TARIFA_BULTO50 / 25; // 400 COP
    const TARIFA_CAJA25 = TARIFA_BULTO25 / 50; // 140 COP
    
    // Helpers
    async function invAdd(matName, cant, cat) {
        const { data: i } = await supabase.from('inventario').select('*').eq('material', matName).single();
        if (i) await supabase.from('inventario').update({ cantidad: i.cantidad + cant }).eq('id', i.id);
        else await supabase.from('inventario').insert([{ material: matName, cantidad: cant, categoria: cat }]);
    }
    async function pagar(user, cant, precio, t) {
        await supabase.from('produccion_fabriquines').insert([{
            fecha: t.fecha, usuario: user, cantidad_producida: cant, precio_por_unidad: precio,
            total_ganado: cant * precio, estado: 'PENDIENTE'
        }]);
    }

    if (rol === 'anillador') {
        let numCestas = parseInt(cestas_anilladas) || 0;
        if (numCestas > 0) {
            await invAdd('Tabacos Anillados', numCestas * 1500, 'Producto Terminado');
            await pagar(usuario, numCestas, TARIFA_ANILLADO, tiempo);
        }
    } else {
        let n50 = parseInt(bultos_50) || 0, n25 = parseInt(bultos_25) || 0;
        let c50 = parseInt(cajas_50_sueltas) || 0, c25 = parseInt(cajas_25_sueltas) || 0;
        
        if (n50 > 0) { await invAdd('Bultos de 50', n50, 'Producto Terminado'); await pagar(usuario, n50, TARIFA_BULTO50, tiempo); }
        if (n25 > 0) { await invAdd('Bultos de 25', n25, 'Producto Terminado'); await pagar(usuario, n25, TARIFA_BULTO25, tiempo); }
        if (c50 > 0) { await invAdd('Cajas de 50', c50, 'Producto Terminado'); await pagar(usuario, c50, TARIFA_CAJA50, tiempo); }
        if (c25 > 0) { await invAdd('Cajas de 25', c25, 'Producto Terminado'); await pagar(usuario, c25, TARIFA_CAJA25, tiempo); }
    }

    await supabase.from('pedidos').update({ estado: 'completado' }).eq('id', idPedido);
    res.redirect('/recepcion_empaque');
});

// --- MÓDULO 6: DASHBOARD ANALÍTICO ---
app.get('/analitica', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');

    // 1. Carga masiva de todos los movimientos para BI Frontend
    const { data: movsBrutos } = await supabase.from('movimientos').select('tipo_movimiento, material, cantidad, fecha').order('id', { ascending: false }).limit(2000);
    
    // Producción tradicional (Entradas de Bodega) para mantener código viejo vivo
    const { data: movEntradas } = await supabase.from('movimientos').select('material, cantidad').eq('tipo_movimiento', 'ENTRADA');
    
    let prodNormales = 0, prodAnillados = 0, prodEnvoltura = 0;
    if (movEntradas) {
        movEntradas.forEach(m => {
            let mat = m.material ? m.material.toLowerCase() : '';
            // Si tiene la palabra "anillado", va a la segunda barra
            if (mat.includes('anillado')) {
                prodAnillados += m.cantidad;
            } 
            // Si tiene "envoltura", va a la tercera barra
            else if (mat.includes('envoltura')) {
                prodEnvoltura += m.cantidad;
            }
            // Si es un tabaco genérico o "normal", va a la primera
            else if (mat.includes('normal') || mat === 'tabacos' || mat === 'tabaco') {
                prodNormales += m.cantidad;
            }
        });
    }

    // 2. Ingresos (Ventas registradas)
    const { data: movSalidas } = await supabase.from('movimientos').select('descripcion').eq('tipo_movimiento', 'SALIDA').ilike('descripcion', '%[VENTA]%');
    
    let totalIngresos = 0;
    if (movSalidas) {
        movSalidas.forEach(m => {
            let match = m.descripcion.match(/\$([\d.]+)/);
            if (match) {
                totalIngresos += parseInt(match[1].replace(/\./g, ''));
            }
        });
    }

    // 3. Egresos (Nómina Pagada y Pendiente)
    const { data: nomina } = await supabase.from('produccion_fabriquines').select('total_ganado');
    let totalNomina = 0;
    if (nomina) {
        nomina.forEach(n => totalNomina += parseFloat(n.total_ganado) || 0);
    }

    // 4. Egresos (Mantenimiento)
    const { data: mtto } = await supabase.from('mantenimiento').select('costo_mo, costo_mat').eq('estado', 'REALIZADO');
    let totalMtto = 0;
    if (mtto) {
        mtto.forEach(m => totalMtto += (parseFloat(m.costo_mo) || 0) + (parseFloat(m.costo_mat) || 0));
    }

    res.render('analitica', {
        session: req.session,
        raw_movs: movsBrutos,
        produccion: { normales: prodNormales, anillados: prodAnillados, envoltura: prodEnvoltura },
        finanzas: { ingresos: totalIngresos, nomina: totalNomina, mantenimiento: totalMtto }
    });
});
// ============================================================================
// 🌯 MÓDULO ENVOLVEDORAS V2.5
// ============================================================================
app.get('/envolvedoras', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');
    // Empleados del tipo envolvedora (usamos misma tabla, filtrar por área si se agrega campo)
    const { data: empleados } = await supabase.from('empleados_fabriquines').select('*').order('codigo');
    const { data: registros }  = await supabase.from('recepcion_envolvedoras').select('*').eq('estado', 'pendiente');
    res.render('envolvedoras', { empleados: empleados || [], registros: registros || [] });
});

app.post('/guardar_envoltedora', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');
    const empId = req.body.empleado_id;
    const regId = req.body.registro_id;
    const tiempo = obtenerHoraColombia();

    const campos = {
        empleado_id:      empId,
        cestas_asignadas: parseInt(req.body.cestas_asignadas) || 0,
        // Cestas IN
        lun_cestas_in:  parseInt(req.body.lun_cestas_in)  || 0,
        mar_cestas_in:  parseInt(req.body.mar_cestas_in)  || 0,
        mie_cestas_in:  parseInt(req.body.mie_cestas_in)  || 0,
        jue_cestas_in:  parseInt(req.body.jue_cestas_in)  || 0,
        vie_cestas_in:  parseInt(req.body.vie_cestas_in)  || 0,
        sab_cestas_in:  parseInt(req.body.sab_cestas_in)  || 0,
        // Cestas OUT
        lun_cestas_out: parseInt(req.body.lun_cestas_out) || 0,
        mar_cestas_out: parseInt(req.body.mar_cestas_out) || 0,
        mie_cestas_out: parseInt(req.body.mie_cestas_out) || 0,
        jue_cestas_out: parseInt(req.body.jue_cestas_out) || 0,
        vie_cestas_out: parseInt(req.body.vie_cestas_out) || 0,
        sab_cestas_out: parseInt(req.body.sab_cestas_out) || 0,
        // Papel base + extra diario + sobrante
        papel_trans_g:    parseFloat(req.body.papel_trans_g)    || 0,
        lun_papel_extra:  parseFloat(req.body.lun_papel_extra)  || 0,
        mar_papel_extra:  parseFloat(req.body.mar_papel_extra)  || 0,
        mie_papel_extra:  parseFloat(req.body.mie_papel_extra)  || 0,
        jue_papel_extra:  parseFloat(req.body.jue_papel_extra)  || 0,
        vie_papel_extra:  parseFloat(req.body.vie_papel_extra)  || 0,
        sab_papel_extra:  parseFloat(req.body.sab_papel_extra)  || 0,
        papel_sobrante_g: parseFloat(req.body.papel_sobrante_g) || 0,
        precio_cesta:     parseInt(req.body.precio_cesta)       || 11000,
        estado: 'pendiente'
    };

    if (regId && regId !== '') {
        await supabase.from('recepcion_envolvedoras').update(campos).eq('id', regId);
    } else {
        campos.semana_inicio = tiempo.fecha;
        await supabase.from('recepcion_envolvedoras').insert([campos]);
    }
    res.redirect('/envolvedoras');
});

app.post('/liquidar_envolvedora/:id', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');
    const regId = req.params.id;
    const { data: reg } = await supabase.from('recepcion_envolvedoras').select('*').eq('id', regId).single();
    if (!reg) return res.send(mostrarAlerta('Error', 'Registro no encontrado.', 'error'));

    const totalCestasOut = reg.lun_cestas_out + reg.mar_cestas_out + reg.mie_cestas_out +
                           reg.jue_cestas_out + reg.vie_cestas_out + reg.sab_cestas_out;
    const pago = totalCestasOut * reg.precio_cesta;

    // Registrar en nómina
    const tiempo = obtenerHoraColombia();
    await supabase.from('produccion_fabriquines').insert([{
        fecha: tiempo.fecha, usuario: String(reg.empleado_id),
        cantidad_producida: totalCestasOut,
        precio_por_unidad: reg.precio_cesta,
        total_ganado: pago, estado: 'PENDIENTE'
    }]);

    await supabase.from('recepcion_envolvedoras').update({ estado: 'pagado' }).eq('id', regId);
    res.send(mostrarAlerta('✅ Liquidada', `Envolvedora liquidada. Total a cobrar: $${pago.toLocaleString('es-CO')} COP por ${totalCestasOut} cestas.`, 'success'));
});

module.exports = app;