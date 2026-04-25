const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const { supabase, mostrarAlerta, obtenerHoraColombia } = require('../lib/shared');
const { isAdmin, isAuth } = require('../lib/middleware');

// ---------------- MÁQUINAS Y EQUIPOS ----------------

router.get('/lista', isAuth, async (req, res) => {
    const { data: maquinas } = await supabase.from('maquinas').select('*').order('nombre', { ascending: true });
    const { data: mantenimientos } = await supabase.from('mantenimiento').select('*');

    const maquinasProcesadas = (maquinas || []).map(m => {
        const mttosMaquina = (mantenimientos || []).filter(mtto => mtto.maquina === m.nombre);
        let costo_total = 0;
        mttosMaquina.forEach(mtto => {
           if (mtto.estado === 'REALIZADO') costo_total += (mtto.costo_mo || 0) + (mtto.costo_mat || 0);
        });
        m.costo_historico = costo_total;

        if (m.ultimo_mtto) {
            const fechaUltimo = new Date(m.ultimo_mtto + 'T00:00:00');
            const fechaActual = new Date();
            const diasTranscurridos = Math.floor((fechaActual - fechaUltimo) / (1000 * 60 * 60 * 24));
            const limite = m.frecuencia_mtto_dias || 30;
            m.dias_para_mtto = limite - diasTranscurridos;
        } else {
            m.dias_para_mtto = "Sin Registro";
        }
        return m;
    });

    res.render('equipos/lista', { maquinas: maquinasProcesadas });
});

// Alias: /maquinas apunta al mismo handler que /lista
router.get('/maquinas', isAuth, async (req, res) => {
    const { data: maquinas } = await supabase.from('maquinas').select('*').order('nombre', { ascending: true });
    const { data: mantenimientos } = await supabase.from('mantenimiento').select('*');
    const maquinasProcesadas = (maquinas || []).map(m => {
        const costo_total = (mantenimientos || [])
            .filter(mt => mt.maquina === m.nombre && mt.estado === 'REALIZADO')
            .reduce((a, mt) => a + (mt.costo_mo || 0) + (mt.costo_mat || 0), 0);
        m.costo_historico = costo_total;
        if (m.ultimo_mtto) {
            const dias = Math.floor((new Date() - new Date(m.ultimo_mtto + 'T00:00:00')) / 86400000);
            m.dias_para_mtto = (m.frecuencia_mtto_dias || 30) - dias;
        } else { m.dias_para_mtto = "Sin Registro"; }
        return m;
    });
    res.render('equipos/lista', { maquinas: maquinasProcesadas });
});

router.post('/agregar', isAdmin, async (req, res) => {
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
        frecuencia_mtto_dias: parseInt(req.body.frecuencia_mtto_dias) || 30
    }]);
    if (error) console.error("❌ ERROR AL GUARDAR MÁQUINA:", error);
    res.redirect('/maquinas');
});

// Alias: views reference /agregar_maquina
router.post('/agregar_maquina', isAdmin, async (req, res) => {
    const { error } = await supabase.from('maquinas').insert([{ 
        nombre: req.body.nombre, area: req.body.area, marca: req.body.marca,
        modelo: req.body.modelo, horas_dia: parseInt(req.body.horas_dia) || 8,
        fabricante: req.body.fabricante, codigo: req.body.codigo, estado: req.body.estado,
        observaciones: req.body.observaciones || 'Ninguna',
        frecuencia_mtto_dias: parseInt(req.body.frecuencia_mtto_dias) || 30
    }]);
    if (error) console.error("❌ ERROR:", error);
    res.redirect('/maquinas');
});

router.post('/editar/:id', isAdmin, async (req, res) => {
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
    if (req.body.ultimo_mtto) datosActualizados.ultimo_mtto = req.body.ultimo_mtto;

    await supabase.from('maquinas').update(datosActualizados).eq('id', req.params.id);
    res.redirect('/maquinas');
});

// Alias: views reference /editar_maquina/:id
router.post('/editar_maquina/:id', isAdmin, async (req, res) => {
    const datosActualizados = {
        nombre: req.body.nombre, area: req.body.area, marca: req.body.marca,
        modelo: req.body.modelo, horas_dia: parseInt(req.body.horas_dia) || 8,
        codigo: req.body.codigo, estado: req.body.estado, observaciones: req.body.observaciones,
        fabricante: req.body.fabricante, frecuencia_mtto_dias: parseInt(req.body.frecuencia_mtto_dias) || 30
    };
    if (req.body.ultimo_mtto) datosActualizados.ultimo_mtto = req.body.ultimo_mtto;
    await supabase.from('maquinas').update(datosActualizados).eq('id', req.params.id);
    res.redirect('/maquinas');
});

router.get('/eliminar/:id', isAdmin, async (req, res) => {
    await supabase.from('maquinas').delete().eq('id', req.params.id);
    res.redirect('/maquinas');
});

// Alias: views reference /eliminar_maquina/:id
router.get('/eliminar_maquina/:id', isAdmin, async (req, res) => {
    await supabase.from('maquinas').delete().eq('id', req.params.id);
    res.redirect('/maquinas');
});

// ---------------- FICHA TÉCNICA ----------------

router.get('/ficha/:id', isAuth, async (req, res) => {
    const maquinaId = req.params.id;
    const { data: maquina } = await supabase.from('maquinas').select('*').eq('id', maquinaId).single();
    if (!maquina) return res.send("<h2>❌ Máquina no encontrada.</h2>");

    const { data: mantenimientos } = await supabase.from('mantenimiento')
        .select('*').eq('maquina', maquina.nombre)
        .order('fecha', { ascending: false }).order('hora', { ascending: false });

    let costoPreventivo = 0, costoCorrectivo = 0;
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

    res.render('equipos/ficha', { maquina, historial: mantenimientos || [] });
});

// ---------------- MANTENIMIENTO ----------------

router.get('/mantenimiento', isAuth, async (req, res) => {
    const { data: maquinas } = await supabase.from('maquinas').select('nombre, codigo').order('nombre');
    const { data: mantenimientos } = await supabase.from('mantenimiento').select('*').order('id', { ascending: false });
    res.render('equipos/mantenimiento', { maquinas: maquinas || [], mantenimientos: mantenimientos || [] });
});

router.post('/registrar_mantenimiento', isAuth, async (req, res) => {
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

    if (req.body.tipo === 'Preventivo' && req.body.estado === 'REALIZADO') {
        const tiempo = obtenerHoraColombia();
        await supabase.from('maquinas').update({ ultimo_mtto: req.body.fecha || tiempo.fecha }).eq('nombre', req.body.maquina);
    }
    res.redirect('/mantenimiento');
});

// Alias: views reference /agregar_mantenimiento
router.post('/agregar_mantenimiento', isAuth, async (req, res) => {
    await supabase.from('mantenimiento').insert([{ 
        fecha: req.body.fecha, hora: req.body.hora, maquina: req.body.maquina,
        tipo: req.body.tipo, descripcion: req.body.descripcion,
        tiempo_min: parseInt(req.body.tiempo_min) || 0,
        costo_mo: parseFloat(req.body.costo_mo) || 0, costo_mat: parseFloat(req.body.costo_mat) || 0,
        hecho_por: req.body.hecho_por, estado: req.body.estado
    }]);
    if (req.body.tipo === 'Preventivo' && req.body.estado === 'REALIZADO') {
        const tiempo = obtenerHoraColombia();
        await supabase.from('maquinas').update({ ultimo_mtto: req.body.fecha || tiempo.fecha }).eq('nombre', req.body.maquina);
    }
    res.redirect('/mantenimiento');
});

// ---------------- CÓDIGOS QR ----------------

router.get('/qrs', isAdmin, async (req, res) => {
    const { data: maquinas } = await supabase.from('maquinas').select('*').order('nombre', { ascending: true });
    res.render('equipos/qrs', { maquinas: maquinas || [] });
});

// Alias compatible con el sidebar: /maquinas/qrs
router.get('/maquinas/qrs', isAdmin, async (req, res) => {
    const { data: maquinas } = await supabase.from('maquinas').select('*').order('nombre', { ascending: true });
    res.render('equipos/qrs', { maquinas: maquinas || [] });
});

router.get('/:id/qr', async (req, res) => {
    const host = req.get('host');
    const protocol = req.protocol;
    const urlDeLaFicha = `${protocol}://${host}/ficha/${req.params.id}`;

    try {
        const qrBuffer = await QRCode.toBuffer(urlDeLaFicha, { type: 'png', margin: 1, width: 250 });
        res.type('png');
        res.send(qrBuffer);
    } catch (error) {
        res.status(500).send('Error QR.');
    }
});

// Alias: views reference /maquina/:id/qr
router.get('/maquina/:id/qr', async (req, res) => {
    const host = req.get('host');
    const protocol = req.protocol;
    const urlDeLaFicha = `${protocol}://${host}/ficha/${req.params.id}`;
    try {
        const qrBuffer = await QRCode.toBuffer(urlDeLaFicha, { type: 'png', margin: 1, width: 250 });
        res.type('png');
        res.send(qrBuffer);
    } catch (error) {
        res.status(500).send('Error QR.');
    }
});

// Aliases: views reference /ficha_maquina/:id and /maquinas/ficha/:id
router.get('/ficha_maquina/:id', isAuth, async (req, res) => {
    res.redirect('/ficha/' + req.params.id);
});

router.get('/maquinas/ficha/:id', isAuth, async (req, res) => {
    res.redirect('/ficha/' + req.params.id);
});

module.exports = router;
