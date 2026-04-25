const express = require('express');
const router = express.Router();
const { supabase, bcrypt, mostrarAlerta, obtenerHoraColombia, registrarAuditoria } = require('../lib/shared');
const { isAdmin } = require('../lib/middleware');

// ---------------- LOGIN / LOGOUT ----------------

router.get('/login', (req, res) => res.render('login'));

router.post('/login', async (req, res) => {
    const { usuario, password } = req.body;
    
    const { data: resultado, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('usuario', usuario)
        .single(); 

    if (error || !resultado) return res.send(mostrarAlerta('Oops...', 'Usuario no encontrado.', 'error', '/'));
    
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

router.get('/logout', (req, res) => {
    req.session = null; // cookie-session no tiene .destroy() — esto borra la cookie
    res.redirect('/'); 
});

// ---------------- GESTIÓN DE USUARIOS ----------------

router.get('/usuarios', isAdmin, async (req, res) => {
    const { data: usuarios } = await supabase.from('usuarios').select('*').order('usuario');
    res.render('admin/usuarios', { usuarios: usuarios || [] });
});

// ---------------- INVENTARIO Y MOVIMIENTOS ----------------

router.get('/inventario', isAdmin, async (req, res) => {
    const { data: inventario } = await supabase.from('inventario')
        .select('*')
        .order('categoria', { ascending: true })
        .order('material', { ascending: true });
        
    const { data: ultRegistros } = await supabase.from('recepcion_diaria').select('semana_inicio').order('id', { ascending: false }).limit(1);
    const ultima_semana = ultRegistros && ultRegistros.length > 0 ? ultRegistros[0].semana_inicio : '1999-01-01';
    
    const { data: lotes_pendientes } = await supabase.from('recepcion_diaria')
        .select('*, empleados_fabriquines(*)')
        .eq('semana_inicio', ultima_semana)
        .order('id', { ascending: false });
    
    res.render('admin/inventario', { inventario: inventario || [], lotes_pendientes: lotes_pendientes || [], ultima_semana });
});

router.get('/movimientos', isAdmin, async (req, res) => {
    const { data: movimientos } = await supabase.from('movimientos').select('*').order('fecha', { ascending: false }).order('hora', { ascending: false });
    const { data: inventario } = await supabase.from('inventario').select('*').order('material', { ascending: true });
    
    res.render('admin/movimientos_kardex', { movimientos: movimientos || [], inventario: inventario || [] });
});

router.post('/agregar_inventario', isAdmin, async (req, res) => {
    const { material, cantidad, categoria, descripcion } = req.body;
    const cantNum = parseFloat(cantidad);
    
    const { data: existente } = await supabase.from('inventario').select('*').eq('material', material).single();
    if (existente) {
        await supabase.from('inventario').update({ cantidad: existente.cantidad + cantNum, categoria: categoria }).eq('id', existente.id);
    } else {
        await supabase.from('inventario').insert([{ material, cantidad: cantNum, categoria }]);
    }
    
    const tiempo = obtenerHoraColombia();
    await registrarAuditoria(req, 'INVENTARIO', 'ENTRADA', { material, cantidad: cantNum });
    
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

router.post('/restar_inventario', isAdmin, async (req, res) => {
    const { material_id, cantidad_salida, descripcion_salida, nombre_material } = req.body;
    const cantNum = parseFloat(cantidad_salida);
    
    const { data: existente } = await supabase.from('inventario').select('*').eq('id', material_id).single();
    
    if (existente && existente.cantidad >= cantNum) {
        await supabase.from('inventario').update({ cantidad: existente.cantidad - cantNum }).eq('id', existente.id);
        const tiempo = obtenerHoraColombia();
        await registrarAuditoria(req, 'INVENTARIO', 'SALIDA', { material: nombre_material, cantidad: cantNum });

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

router.get('/cierre_diario', isAdmin, async (req, res) => {
    res.render('admin/cierre_diario');
});

router.get('/empleados', isAdmin, async (req, res) => {
    const { data: empleados } = await supabase.from('empleados_fabriquines').select('*').order('codigo');
    const { data: prestamos } = await supabase.from('prestamos_fabriquines').select('*').eq('estado', 'activo');
    res.render('admin/empleados', { empleados: empleados || [], prestamos: prestamos || [] });
});

// ---------------- CRUD USUARIOS ----------------

router.post('/agregar_usuario', isAdmin, async (req, res) => {
    const { usuario, password, rol } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await supabase.from('usuarios').insert([{ usuario, password: hashedPassword, rol }]);
    res.redirect('/usuarios');
});

router.get('/eliminar_usuario/:id', isAdmin, async (req, res) => {
    await supabase.from('usuarios').delete().eq('id', req.params.id);
    res.redirect('/usuarios');
});

// ---------------- CRUD EMPLEADOS ----------------

router.post('/agregar_empleado', isAdmin, async (req, res) => {
    await supabase.from('empleados_fabriquines').insert([{
        codigo: req.body.codigo.toUpperCase(),
        nombre: req.body.nombre,
        cedula: req.body.cedula,
        deuda_tabacos: 0
    }]);
    res.redirect('/empleados');
});

router.post('/eliminar_empleado/:id', isAdmin, async (req, res) => {
    await supabase.from('empleados_fabriquines').delete().eq('id', req.params.id);
    res.redirect('/empleados');
});

// ---------------- PRÉSTAMOS FABRIQUINES ----------------

router.post('/nuevo_prestamo', isAdmin, async (req, res) => {
    const empId = req.body.empleado_id;
    const montoNuevo = parseInt(req.body.monto_total) || 0;
    const concepto = req.body.concepto || '';
    if (montoNuevo <= 0) return res.send(mostrarAlerta('Error', 'El monto debe ser mayor a cero.', 'warning'));

    const { data: activo } = await supabase.from('prestamos_fabriquines')
        .select('*').eq('empleado_id', empId).eq('estado', 'activo').single();

    if (activo) {
        const nuevoSaldo = activo.saldo_pendiente + montoNuevo;
        await supabase.from('prestamos_fabriquines').update({
            saldo_pendiente: nuevoSaldo,
            monto_total: activo.monto_total + montoNuevo,
            concepto: (activo.concepto || '') + ` + ${concepto}`
        }).eq('id', activo.id);
    } else {
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

router.post('/abonar_prestamo/:id', isAdmin, async (req, res) => {
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

// ---------------- INVENTARIO EXTRA ----------------

router.get('/eliminar_inventario/:id', isAdmin, async (req, res) => {
    await supabase.from('inventario').delete().eq('id', req.params.id);
    res.redirect('/inventario');
});

router.post('/registrar_venta', isAdmin, async (req, res) => {
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

module.exports = router;
