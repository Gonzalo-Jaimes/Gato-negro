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
    
    res.send("Rol no válido");
});

app.get('/logout', (req, res) => {
    req.session.destroy(); 
    res.redirect('/'); 
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

// ---------------- PEDIDOS ----------------
app.get('/pedidos', async (req, res) => {
    if (!req.session.rol) return res.redirect('/');

    let query = supabase.from('pedidos').select('*').order('id', { ascending: false });
    
    if (req.session.rol === "fabriquin" || req.session.rol === "fabricacion" || req.session.rol === "envolvedor") {
        query = query.eq('usuario', req.session.usuario);
    }

    const { data: pedidos } = await query;
    const { data: cestas } = await supabase.from('inventario').select('*').ilike('material', '%cesta%');

    const pedidosCalculados = (pedidos || []).map(p => {
        let factor = p.cantidad / 1500; 
        if (p.material === 'Tabacos') {
            p.tripa_necesaria = +(factor * 35).toFixed(2);
            p.capa_necesaria = +(factor * 9).toFixed(2);
            p.capote_necesario = +(factor * 5).toFixed(2);
            p.cestas_necesarias = Math.ceil(factor * 3);
        } else {
            p.papel_necesario = +(factor * 1.5).toFixed(2);
            p.tabacos_necesarios = p.cantidad; 
        }
        return p;
    });

    res.render('pedidos', { pedidos: pedidosCalculados, cestas_inventario: cestas || [] });
});

app.post('/agregar_pedido', async (req, res) => {
    const cantidad_tabacos = req.body.cantidad_tabacos;
    const tiempo = obtenerHoraColombia();
    const tipoPedido = req.session.rol === 'envolvedor' ? 'Envoltura' : 'Tabacos';

    await supabase.from('pedidos').insert([{ 
        material: tipoPedido, 
        cantidad: cantidad_tabacos, 
        usuario: req.session.usuario, 
        fecha: tiempo.fecha, 
        estado: 'pendiente' 
    }]);
    res.redirect('/pedidos');
});

app.post('/rechazar_pedido/:id', async (req, res) => {
    await supabase.from('pedidos').update({ estado: 'rechazado' }).eq('id', req.params.id);
    res.redirect('/pedidos');
});

// ---------------- APROBAR PEDIDO (ESCUDO NUBE Y KARDEX) ----------------
app.post('/aprobar_pedido/:id', async (req, res) => {
    const idPedido = req.params.id;
    const cestaSeleccionada = req.body.cesta_seleccionada || "ninguna"; 

    const { data: pedido } = await supabase.from('pedidos').select('*').eq('id', idPedido).single();
    if (!pedido) return res.send(mostrarAlerta('Error', 'No se encontró el pedido.', 'error'));

    let factor = pedido.cantidad / 1500;
    const { data: inv } = await supabase.from('inventario').select('*');

    const registrarMovimiento = async (material_nombre, cant) => {
        const tiempo = obtenerHoraColombia();
        await supabase.from('movimientos').insert([{
            fecha: tiempo.fecha,
            hora: tiempo.hora,
            tipo_movimiento: 'SALIDA',
            material: material_nombre,
            cantidad: cant,
            usuario: req.session.usuario || 'Admin',
            descripcion: `Aprobado pedido #${pedido.id} para ${pedido.usuario}`
        }]);
    };

    if (pedido.material === 'Tabacos') {
        let tripaReq = +(factor * 35).toFixed(2);
        let capaReq = +(factor * 9).toFixed(2);
        let capoteReq = +(factor * 5).toFixed(2);
        let cestasReq = Math.ceil(factor * 3);

        let dispTripa = 0, dispCapa = 0, dispCapote = 0, dispCesta = 0;
        
        inv.forEach(item => {
            let m = item.material.toLowerCase();
            if(m.includes('tripa') || m.includes('material')) dispTripa += item.cantidad; 
            if(m.includes('capa')) dispCapa += item.cantidad;
            if(m.includes('capote')) dispCapote += item.cantidad;
            if(m === cestaSeleccionada.toLowerCase()) dispCesta += item.cantidad;
        });

        let falta = "";
        if (dispTripa < tripaReq) falta += `Falta Tripa (${dispTripa}/${tripaReq} kg).<br>`;
        if (dispCapa < capaReq) falta += `Falta Capa (${dispCapa}/${capaReq} kg).<br>`;
        if (dispCapote < capoteReq) falta += `Falta Capote (${dispCapote}/${capoteReq} kg).<br>`;
        if (dispCesta < cestasReq) falta += `Falta ${cestaSeleccionada} (${dispCesta}/${cestasReq} unds).<br>`;

        if (falta !== "") return res.send(mostrarAlerta('¡Stock Insuficiente!', falta, 'warning'));

        for (let item of inv) {
            let m = item.material.toLowerCase();
            if ((m.includes('tripa') || m.includes('material')) && tripaReq > 0) {
                await supabase.from('inventario').update({ cantidad: item.cantidad - tripaReq }).eq('id', item.id);
                await registrarMovimiento(item.material, tripaReq); tripaReq = 0;
            }
            if (m.includes('capa') && capaReq > 0) {
                await supabase.from('inventario').update({ cantidad: item.cantidad - capaReq }).eq('id', item.id);
                await registrarMovimiento(item.material, capaReq); capaReq = 0;
            }
            if (m.includes('capote') && capoteReq > 0) {
                await supabase.from('inventario').update({ cantidad: item.cantidad - capoteReq }).eq('id', item.id);
                await registrarMovimiento(item.material, capoteReq); capoteReq = 0;
            }
            if (m === cestaSeleccionada.toLowerCase() && cestasReq > 0) {
                await supabase.from('inventario').update({ cantidad: item.cantidad - cestasReq }).eq('id', item.id);
                await registrarMovimiento(item.material, cestasReq); cestasReq = 0;
            }
        }
        await supabase.from('pedidos').update({ estado: 'aprobado' }).eq('id', idPedido);
        res.redirect('/pedidos');

    } else if (pedido.material === 'Envoltura') {
        let papelReq = +(factor * 1.5).toFixed(2);
        let tabacosReq = pedido.cantidad; 
        
        let dispPapel = 0, dispTabacos = 0;
        
        inv.forEach(item => {
            let m = item.material.toLowerCase().trim();
            if(m.includes('papel')) dispPapel += item.cantidad; 
            if(m === 'tabacos' || m === 'tabaco') dispTabacos += item.cantidad; 
        });

        let faltaEnv = "";
        if (dispPapel < papelReq) faltaEnv += `Falta Papel (${dispPapel}/${papelReq} kg).<br>`;
        if (dispTabacos < tabacosReq) faltaEnv += `Faltan Tabacos (${dispTabacos}/${tabacosReq} unds).<br>`;

        if (faltaEnv !== "") {
            return res.send(mostrarAlerta('¡Falta Material!', faltaEnv, 'warning'));
        }

        for (let item of inv) {
            let m = item.material.toLowerCase().trim();
            if (m.includes('papel') && papelReq > 0) {
                await supabase.from('inventario').update({ cantidad: item.cantidad - papelReq }).eq('id', item.id);
                await registrarMovimiento(item.material, papelReq); papelReq = 0;
            }
            if ((m === 'tabacos' || m === 'tabaco') && tabacosReq > 0) {
                await supabase.from('inventario').update({ cantidad: item.cantidad - tabacosReq }).eq('id', item.id);
                await registrarMovimiento(item.material, tabacosReq); tabacosReq = 0;
            }
        }
        await supabase.from('pedidos').update({ estado: 'aprobado' }).eq('id', idPedido);
        res.redirect('/pedidos');
    }
});

// ---------------- RECEPCIÓN DE TAREAS ----------------
app.get('/recepcion', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');
    
    const { data: pedidos } = await supabase.from('pedidos')
        .select('*')
        .eq('estado', 'aprobado')
        .eq('material', 'Tabacos')
        .order('id', { ascending: true });

    const { data: completados } = await supabase.from('pedidos')
        .select('usuario, rezago')
        .eq('estado', 'completado');

    let resumenRezagos = {};
    if (completados) {
        completados.forEach(p => {
            if (!resumenRezagos[p.usuario]) resumenRezagos[p.usuario] = 0;
            resumenRezagos[p.usuario] += (p.rezago || 0); 
        });
    }

    let listaRezagos = Object.keys(resumenRezagos).map(usuario => {
        return { usuario: usuario, total: resumenRezagos[usuario] };
    }).filter(r => r.total !== 0); 

    res.render('recepcion', { 
        pedidos: pedidos || [],
        listaRezagos: listaRezagos 
    });
});

app.post('/recibir_tarea/:id', async (req, res) => {
    const idPedido = req.params.id;
    const tabacosEntregados = parseInt(req.body.entregado) || 0;
    const cestasDevueltas = parseInt(req.body.cestas_devueltas) || 0;

    const { data: pedido } = await supabase.from('pedidos').select('*').eq('id', idPedido).single();
    if (!pedido) return res.redirect('/recepcion');

    const rezagoCalculado = pedido.cantidad - tabacosEntregados;

    await supabase.from('pedidos').update({ 
        estado: 'completado', 
        entregado: tabacosEntregados,
        rezago: rezagoCalculado
    }).eq('id', idPedido);

    const { data: invTabacos } = await supabase.from('inventario').select('*').ilike('material', 'Tabacos').single();
    
    if (invTabacos) {
        await supabase.from('inventario').update({ cantidad: invTabacos.cantidad + tabacosEntregados }).eq('id', invTabacos.id);
    } else {
        await supabase.from('inventario').insert([{ material: 'Tabacos', cantidad: tabacosEntregados, categoria: 'En Proceso' }]);
    }

    const tiempo = obtenerHoraColombia();
    
    // 🪄 AQUÍ ESTÁ EL ARREGLO: Agregamos el nombre del fabriquin al chisme del Kardex
    let descripcionKardex = `Recepción de tarea de ${pedido.usuario}. Orden #${idPedido}.`;
    if (rezagoCalculado > 0) {
        descripcionKardex += ` (${pedido.usuario} quedó debiendo: ${rezagoCalculado} tabacos)`;
    } else if (rezagoCalculado < 0) {
        descripcionKardex += ` (${pedido.usuario} trajo ${Math.abs(rezagoCalculado)} tabacos extra)`;
    }

    await supabase.from('movimientos').insert([{
        fecha: tiempo.fecha,
        hora: tiempo.hora,
        tipo_movimiento: 'ENTRADA',
        material: 'Tabacos',
        cantidad: tabacosEntregados,
        usuario: req.session.usuario || 'Admin',
        descripcion: descripcionKardex
    }]);

    if (cestasDevueltas > 0) {
        const { data: invCestas } = await supabase.from('inventario').select('*').ilike('material', '%cesta%').limit(1);
        if (invCestas && invCestas.length > 0) {
            await supabase.from('inventario').update({ cantidad: invCestas[0].cantidad + cestasDevueltas }).eq('id', invCestas[0].id);
        }
    }

    res.redirect('/recepcion');
});

// --- ABONAR DEUDA DIRECTAMENTE ---
app.post('/abonar_deuda', async (req, res) => {
    const { usuario, cantidad_abono } = req.body;
    const abono = parseInt(cantidad_abono);
    
    if (!abono || abono <= 0) return res.redirect('/recepcion');

    const tiempo = obtenerHoraColombia();

    // 1. Creamos un "pedido fantasma" completado con rezago negativo para restar la deuda
    await supabase.from('pedidos').insert([{
        usuario: usuario,
        material: 'Abono Deuda',
        cantidad: 0,
        entregado: abono,
        rezago: -abono, 
        estado: 'completado',
        fecha: tiempo.fecha
    }]);

    // 2. Sumamos los tabacos al inventario
    const { data: invTabacos } = await supabase.from('inventario').select('*').ilike('material', 'Tabacos').single();
    if (invTabacos) {
        await supabase.from('inventario').update({ cantidad: invTabacos.cantidad + abono }).eq('id', invTabacos.id);
    }

    // 3. Lo registramos en el Kardex
    await supabase.from('movimientos').insert([{
        fecha: tiempo.fecha,
        hora: tiempo.hora,
        tipo_movimiento: 'ENTRADA',
        material: 'Tabacos',
        cantidad: abono,
        usuario: req.session.usuario || 'Admin',
        descripcion: `Abono manual de deuda del fabriquin ${usuario}.`
    }]);

    res.redirect('/recepcion');
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

module.exports = app;