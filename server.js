const express = require('express');
const session = require('express-session');
const path = require('path');
const { createClient } = require('@supabase/supabase-js'); 
const QRCode = require('qrcode');

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
    
    const { data: resultado, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('usuario', usuario)
        .eq('password', password)
        .single(); 

    if (error || !resultado) return res.send(mostrarAlerta('Oops...', 'Usuario o contraseña incorrectos!', 'error', '/'));
    
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
    res.render('empleados', { empleados: empleados || [] });
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

// ---------------- INVENTARIO Y KARDEX (DIVIDIDO) ----------------

app.get('/inventario', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');
    
    const { data: inventario } = await supabase.from('inventario')
        .select('*')
        .order('categoria', { ascending: true })
        .order('material', { ascending: true });
    
    res.render('inventario', { inventario: inventario || [] });
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
    const metaTabacos = parseInt(req.body.meta_tabacos) || 0;
    
    const { data: empleado } = await supabase.from('empleados_fabriquines').select('*').eq('id', empleadoId).single();
    if (!empleado) return res.send(mostrarAlerta('Error', 'Empleado no encontrado', 'error'));
    
    const saldoEnCasa = parseInt(empleado.deuda_tabacos) || 0;
    const aEntregar = metaTabacos - saldoEnCasa;
    
    if (aEntregar <= 0) return res.send(mostrarAlerta('Error Lógico', 'La meta debe ser mayor al saldo en casa', 'warning'));
    
    // Cálculo de kilogramos (x1000 tabacos -> 1kg capa, 1.8kg capote, 7kg picadura)
    const factor = aEntregar / 1000;
    const capaKg = (factor * 1.0).toFixed(2);
    const capoteKg = (factor * 1.8).toFixed(2);
    const picaduraKg = (factor * 7.0).toFixed(2);
    
    const tiempo = obtenerHoraColombia();
    
    // 1. Descontar del inventario maestro (si existe el material)
    const { data: inv } = await supabase.from('inventario').select('*');
    if (inv) {
        let c = parseFloat(capaKg), cp = parseFloat(capoteKg), pi = parseFloat(picaduraKg);
        for (let item of inv) {
            let m = item.material.toLowerCase();
            if (m.includes('capa') && c > 0) { await supabase.from('inventario').update({ cantidad: item.cantidad - c }).eq('id', item.id); c = 0; }
            if (m.includes('capote') && cp > 0) { await supabase.from('inventario').update({ cantidad: item.cantidad - cp }).eq('id', item.id); cp = 0; }
            if ((m.includes('picadura') || m.includes('tripa') || m.includes('material')) && pi > 0) { await supabase.from('inventario').update({ cantidad: item.cantidad - pi }).eq('id', item.id); pi = 0; }
        }
    }
    
    // 2. Registro histórico (Kardex)
    await supabase.from('movimientos').insert([{
        fecha: tiempo.fecha, hora: tiempo.hora, tipo_movimiento: 'SALIDA',
        material: 'MATERIA PRIMA', cantidad: 1, usuario: 'Admin',
        descripcion: `Despacho Tarea [${metaTabacos}] a ${empleado.codigo}. (Físico: Capa ${capaKg}kg, Capote ${capoteKg}kg, Picadura ${picaduraKg}kg.)`
    }]);

    // 3. ACTUALIZAR DEUDA ROTATIVA
    await supabase.from('empleados_fabriquines').update({ deuda_tabacos: metaTabacos }).eq('id', empleado.id);

    // 4. Imprimir soporte Formato V1.8
    const fechaText = `${tiempo.fecha} ${tiempo.hora}`;
    res.render('formato_despacho', {
        empleado: empleado,
        meta: metaTabacos,
        saldo_casa: saldoEnCasa,
        fecha_actual: fechaText,
        params: {
            capa: capaKg, capote: capoteKg, picadura: picaduraKg,
            saldo_capa: (saldoEnCasa / 1000 * 1.0).toFixed(2),
            saldo_capote: (saldoEnCasa / 1000 * 1.8).toFixed(2),
            saldo_picadura: (saldoEnCasa / 1000 * 7.0).toFixed(2)
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
    
    // Filtrar para que solo salgan los que tienen deuda > 0 (tarea viva) o tienen un registro pendiente
    const empleadosActivos = (empleados || []).filter(emp => emp.deuda_tabacos > 0 || (registros || []).some(r => r.empleado_id === emp.id));
    
    res.render('recepcion_diaria', { empleados: empleadosActivos, registros: registros || [] });
});

app.post('/recepcion_diaria_guardar', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');
    
    const empId = req.body.empleado_id;
    const regId = req.body.registro_id;
    const tiempo = obtenerHoraColombia();
    
    const dataObj = {
        empleado_id: empId, semana_inicio: tiempo.fecha,
        lun_cestas: parseInt(req.body.lun_cestas) || 0, lun_tabacos: parseInt(req.body.lun_tabacos) || 0,
        mar_cestas: parseInt(req.body.mar_cestas) || 0, mar_tabacos: parseInt(req.body.mar_tabacos) || 0,
        mie_cestas: parseInt(req.body.mie_cestas) || 0, mie_tabacos: parseInt(req.body.mie_tabacos) || 0,
        jue_cestas: parseInt(req.body.jue_cestas) || 0, jue_tabacos: parseInt(req.body.jue_tabacos) || 0,
        vie_cestas: parseInt(req.body.vie_cestas) || 0, vie_tabacos: parseInt(req.body.vie_tabacos) || 0,
        sab_cestas: parseInt(req.body.sab_cestas) || 0, sab_tabacos: parseInt(req.body.sab_tabacos) || 0,
        recorte_kg: parseFloat(req.body.recorte_kg) || 0, vena_kg: parseFloat(req.body.vena_kg) || 0,
        extra_tabacos: parseInt(req.body.extra_tabacos) || 0, estado: 'pendiente'
    };
    
    if (regId && regId !== '') {
        delete dataObj.semana_inicio; // no sobrescribir la fecha
        await supabase.from('recepcion_diaria').update(dataObj).eq('id', regId);
    } else {
        await supabase.from('recepcion_diaria').insert([dataObj]);
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
    
    // 3. ACTUALIZAR INVENTARIOS (KARDEX / BODEGA MAESTRA)
    if (total_tabacos > 0) {
        const { data: invT } = await supabase.from('inventario').select('*').eq('material', 'Tabacos').single();
        if (invT) await supabase.from('inventario').update({ cantidad: invT.cantidad + total_tabacos }).eq('id', invT.id);
        else await supabase.from('inventario').insert([{ material: 'Tabacos', cantidad: total_tabacos, categoria: 'En Proceso' }]);
        
        await supabase.from('movimientos').insert([{
            fecha: tiempo.fecha, hora: tiempo.hora, tipo_movimiento: 'ENTRADA', material: 'Tabacos', cantidad: total_tabacos, usuario: 'Admin',
            descripcion: `Liquidación Cierre Semanal: Fabriquín ${emp.codigo}`
        }]);
    }
    
    if (reg.extra_tabacos > 0) {
        const { data: invT } = await supabase.from('inventario').select('*').eq('material', 'Tabacos').single();
        if (invT) await supabase.from('inventario').update({ cantidad: invT.cantidad + reg.extra_tabacos }).eq('id', invT.id);
        
        await supabase.from('movimientos').insert([{
            fecha: tiempo.fecha, hora: tiempo.hora, tipo_movimiento: 'ENTRADA', material: 'Tabacos', cantidad: reg.extra_tabacos, usuario: 'Admin',
            descripcion: `Compra de EXTRA Tabacos a ${emp.codigo}`
        }]);
    }
    
    // Subproductos
    if (reg.recorte_kg > 0) {
        const { data: invR } = await supabase.from('inventario').select('*').eq('material', 'Recorte').single();
        if (invR) await supabase.from('inventario').update({ cantidad: invR.cantidad + reg.recorte_kg }).eq('id', invR.id);
        else await supabase.from('inventario').insert([{ material: 'Recorte', cantidad: reg.recorte_kg, categoria: 'Materia Prima' }]);
    }
    if (reg.vena_kg > 0) {
        const { data: invV } = await supabase.from('inventario').select('*').eq('material', 'Vena').single();
        if (invV) await supabase.from('inventario').update({ cantidad: invV.cantidad + reg.vena_kg }).eq('id', invV.id);
        else await supabase.from('inventario').insert([{ material: 'Vena', cantidad: reg.vena_kg, categoria: 'Materia Prima' }]);
    }
    
    if (total_cestas > 0) {
        const { data: invC } = await supabase.from('inventario').select('*').ilike('material', '%cesta%').limit(1);
        if (invC && invC.length > 0) await supabase.from('inventario').update({ cantidad: invC[0].cantidad + total_cestas }).eq('id', invC[0].id);
    }
    
    // Inyectar a tabla historica fina "produccion_fabriquines" antigua para mantener la consistencia
    await supabase.from('produccion_fabriquines').insert([{
        fecha: tiempo.fecha, usuario: emp.nombre, cantidad_producida: total_tabacos, precio_por_unidad: VALOR_TABACO, total_ganado: total_ganado, estado: 'PAGADO'
    }]);

    // 4. GENERAR NÓMINA IMPRIMIBLE FORMATO EXCEL V1.8
    res.render('formato_nomina_v18', {
        empleado: emp, reg: reg, tiempo: tiempo,
        totales: { tabacos: total_tabacos, cestas: total_cestas },
        pagos: { pago_tabacos, pago_recorte, pago_vena, pago_extras, total_ganado, valor_tabaco: VALOR_TABACO, valor_recorte: VALOR_RECORTE, valor_vena: VALOR_VENA, valor_extra: VALOR_EXTRA }
    });
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
    
    const { data: usuarios } = await supabase.from('usuarios').select('*').in('rol', ['fabriquin', 'fabricacion', 'envolvedor']);
    const { data: prod_pendientes } = await supabase.from('produccion_fabriquines').select('*').eq('estado', 'PENDIENTE');
    const { data: deudas_activas } = await supabase.from('deudores_fabriquines').select('*').eq('estado', 'ACTIVA');
    
    const nomina = (usuarios || []).map(u => {
        let ganancia = 0;
        let deudas = 0;
        (prod_pendientes || []).forEach(p => { if (p.usuario === u.usuario) ganancia += parseFloat(p.total_ganado); });
        (deudas_activas || []).forEach(d => { if (d.usuario === u.usuario) deudas += parseFloat(d.monto_deuda); });
        
        u.ganancia_pendiente = ganancia;
        u.deuda_activa = deudas;
        u.pago_neto = ganancia - deudas;
        return u;
    });
    
    res.render('nomina', { nomina, deudas_activas: deudas_activas || [] });
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

    // 1. Producción (Entradas de Bodega)
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
        produccion: { normales: prodNormales, anillados: prodAnillados, envoltura: prodEnvoltura },
        finanzas: { ingresos: totalIngresos, nomina: totalNomina, mantenimiento: totalMtto }
    });
});

module.exports = app;