const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const { supabase, mostrarAlerta, obtenerHoraColombia, registrarAuditoria } = require('../lib/shared');
const { isAdmin, isAuth } = require('../lib/middleware');
const bot = require('../bot/bot_core');

const ADMIN_CHAT_IDS = [8589883684]; // Gonzalo

async function notificarAdminTelegram(mensaje) {
    if (!process.env.TELEGRAM_TOKEN || !bot || !bot.sendMessage) return;
    for (const chatId of ADMIN_CHAT_IDS) {
        try {
            await bot.sendMessage(chatId, mensaje, { parse_mode: 'Markdown' });
        } catch (err) {
            console.error('⚠️ No se pudo enviar notificación Telegram de mantenimiento:', err.message);
        }
    }
}

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
        .select('*')
        .eq('maquina', maquina.nombre)
        .eq('estado', 'REALIZADO')
        .order('fecha', { ascending: false })
        .order('hora', { ascending: false });

    let costoPreventivo = 0, costoCorrectivo = 0;
    const totalRegistros = (mantenimientos || []).length;
    if (mantenimientos) {
        mantenimientos.forEach((mtto, idx) => {
            // Numeración secuencial por máquina (1 = el más antiguo, N = el más reciente)
            mtto.nro_maquina = totalRegistros - idx;
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

// ---------------- MANTENIMIENTO (ÓRDENES, TAREAS Y SOLICITUDES DE CORRECTIVO) ----------------

router.get('/mantenimiento', isAuth, async (req, res) => {
    const { data: maquinas } = await supabase.from('maquinas').select('nombre, codigo, estado').order('nombre');
    const { data: mantenimientos } = await supabase.from('mantenimiento').select('*').order('id', { ascending: false });
    const { data: mecanicos } = await supabase.from('usuarios').select('usuario').eq('rol', 'mantenimiento').order('usuario');

    // Calcular numeración consecutiva independiente por cada máquina (1, 2, 3...)
    const listaMttos = mantenimientos || [];
    const cronologico = [...listaMttos].sort((a, b) => {
        const fechaA = `${a.fecha || ''} ${a.hora || ''}`;
        const fechaB = `${b.fecha || ''} ${b.hora || ''}`;
        if (fechaA !== fechaB) return fechaA.localeCompare(fechaB);
        return (a.id || 0) - (b.id || 0);
    });
    const contadoresMaquina = {};
    cronologico.forEach(m => {
        const clave = (m.maquina || 'general').trim().toLowerCase();
        contadoresMaquina[clave] = (contadoresMaquina[clave] || 0) + 1;
        m.nro_maquina = contadoresMaquina[clave];
    });

    res.render('equipos/mantenimiento', {
        maquinas: maquinas || [],
        mantenimientos: listaMttos,
        mecanicos: mecanicos || []
    });
});

async function procesarRegistroMantenimiento(req, res) {
    const tiempo = obtenerHoraColombia();
    const esAdmin = req.session && req.session.rol === 'admin';
    const tipo = req.body.tipo || 'Preventivo';

    // Determinar el estado según el rol y el modo del formulario:
    // 1. Si el mecánico (no admin) envía un Correctivo, pasa obligatoriamente a 'SOLICITADO' (pendiente de aprobación por Admin).
    // 2. Si el Admin asigna una tarea pendiente, se guarda como 'NO REALIZADO'.
    let estadoFinal = req.body.estado || 'REALIZADO';
    if (!esAdmin && tipo === 'Correctivo') {
        estadoFinal = 'SOLICITADO';
    }

    const registro = {
        fecha: req.body.fecha || tiempo.fecha,
        hora: req.body.hora || tiempo.hora,
        maquina: req.body.maquina,
        tipo: tipo,
        descripcion: req.body.descripcion,
        tiempo_min: parseInt(req.body.tiempo_min) || 0,
        costo_mo: parseFloat(req.body.costo_mo) || 0,
        costo_mat: parseFloat(req.body.costo_mat) || 0,
        hecho_por: req.body.hecho_por || (req.session && req.session.usuario) || 'Manolo',
        estado: estadoFinal
    };

    const { error } = await supabase.from('mantenimiento').insert([registro]);
    if (error) {
        console.error('❌ Error al insertar mantenimiento:', error.message);
    }

    if (tipo === 'Preventivo' && estadoFinal === 'REALIZADO') {
        await supabase.from('maquinas').update({ ultimo_mtto: registro.fecha }).eq('nombre', registro.maquina);
    }

    // Si es una solicitud de correctivo, notificar al Admin por Telegram
    if (estadoFinal === 'SOLICITADO') {
        await registrarAuditoria(req, 'MANTENIMIENTO', 'SOLICITUD_CORRECTIVO', {
            maquina: registro.maquina,
            descripcion: registro.descripcion
        });
        await notificarAdminTelegram(
            `🔧 *Solicitud de Correctivo*\n` +
            `• *Máquina:* ${registro.maquina}\n` +
            `• *Solicitado por:* ${registro.hecho_por}\n` +
            `• *Descripción:* ${registro.descripcion}\n\n` +
            `_Ingresa a /mantenimiento en el ERP para aprobar o rechazar esta solicitud._`
        );
    }

    res.redirect('/mantenimiento');
}

router.post('/registrar_mantenimiento', isAuth, procesarRegistroMantenimiento);
router.post('/agregar_mantenimiento', isAuth, procesarRegistroMantenimiento);

// Admin aprueba o rechaza una solicitud de correctivo
router.post('/mantenimiento/responder_solicitud/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    const { decision, comentario_admin } = req.body; // decision: 'APROBADO' | 'RECHAZADO'
    const estadoNuevo = decision === 'APROBADO' ? 'APROBADO' : 'RECHAZADO';

    const { data: orden } = await supabase.from('mantenimiento').select('*').eq('id', id).single();
    if (!orden) return res.redirect('/mantenimiento');

    let nuevaDescripcion = orden.descripcion || '';
    if (comentario_admin && comentario_admin.trim() !== '') {
        const etiqueta = estadoNuevo === 'APROBADO' ? 'Nota Admin (Aprobado)' : 'Motivo Rechazo';
        nuevaDescripcion += ` | [${etiqueta}: ${comentario_admin.trim()}]`;
    }

    await supabase.from('mantenimiento').update({
        estado: estadoNuevo,
        descripcion: nuevaDescripcion
    }).eq('id', id);

    await registrarAuditoria(req, 'MANTENIMIENTO', `CORRECTIVO_${estadoNuevo}`, {
        orden_id: id,
        maquina: orden.maquina,
        comentario_admin
    });

    res.redirect('/mantenimiento');
});

// Mecánico o Admin completa una Tarea Asignada ('NO REALIZADO') o ejecuta un Correctivo Aprobado ('APROBADO')
router.post('/mantenimiento/completar/:id', isAuth, async (req, res) => {
    const { id } = req.params;
    const tiempo = obtenerHoraColombia();

    const { data: orden } = await supabase.from('mantenimiento').select('*').eq('id', id).single();
    if (!orden) return res.redirect('/mantenimiento');

    // No permitir ejecutar un correctivo que aún está en 'SOLICITADO' o 'RECHAZADO' a menos que sea Admin
    const esAdmin = req.session && req.session.rol === 'admin';
    if (!esAdmin && (orden.estado === 'SOLICITADO' || orden.estado === 'RECHAZADO')) {
        return res.redirect('/mantenimiento');
    }

    let nuevaDescripcion = orden.descripcion || '';
    if (req.body.notas_cierre && req.body.notas_cierre.trim() !== '') {
        nuevaDescripcion += ` | [Ejecución: ${req.body.notas_cierre.trim()}]`;
    }

    const tiempoMin = req.body.tiempo_min !== undefined ? (parseInt(req.body.tiempo_min) || 0) : (orden.tiempo_min || 0);
    const costoMo = req.body.costo_mo !== undefined ? (parseFloat(req.body.costo_mo) || 0) : (orden.costo_mo || 0);
    const costoMat = req.body.costo_mat !== undefined ? (parseFloat(req.body.costo_mat) || 0) : (orden.costo_mat || 0);
    const hechoPor = (req.body.hecho_por && req.body.hecho_por.trim() !== '')
        ? req.body.hecho_por.trim()
        : (orden.hecho_por || (req.session && req.session.usuario) || 'Manolo');

    await supabase.from('mantenimiento').update({
        estado: 'REALIZADO',
        fecha: tiempo.fecha,
        hora: tiempo.hora,
        tiempo_min: tiempoMin,
        costo_mo: costoMo,
        costo_mat: costoMat,
        hecho_por: hechoPor,
        descripcion: nuevaDescripcion
    }).eq('id', id);

    if (orden.tipo === 'Preventivo') {
        await supabase.from('maquinas').update({ ultimo_mtto: tiempo.fecha }).eq('nombre', orden.maquina);
    }

    await registrarAuditoria(req, 'MANTENIMIENTO', 'ORDEN_COMPLETADA', {
        orden_id: id,
        maquina: orden.maquina,
        tipo: orden.tipo
    });

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
