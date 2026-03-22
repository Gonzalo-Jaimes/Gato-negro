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
        if (p.material && p.material.includes('Tabacos')) {
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
    const tipoPedido = req.session.rol === 'envolvedor' ? 'Envoltura' : (req.body.tipo_tabaco || 'Tabacos Normales');

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

    if (pedido.material && pedido.material.includes('Tabacos')) {
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
        .in('material', ['Tabacos Normales', 'Tabacos Anillados'])
        .order('id', { ascending: true });

    const { data: completados } = await supabase.from('pedidos')
        .select('usuario, rezago, rezago_cestas')
        .eq('estado', 'completado');

    let resumenRezagos = {};
    if (completados) {
        completados.forEach(p => {
            if (!resumenRezagos[p.usuario]) resumenRezagos[p.usuario] = { tabacos: 0, cestas: 0 };
            resumenRezagos[p.usuario].tabacos += (parseInt(p.rezago) || 0); 
            resumenRezagos[p.usuario].cestas += (parseInt(p.rezago_cestas) || 0); 
        });
    }

    let listaRezagos = Object.keys(resumenRezagos).map(usuario => {
        return { 
            usuario: usuario, 
            total: resumenRezagos[usuario].tabacos, 
            faltan_cestas: resumenRezagos[usuario].cestas 
        };
    }).filter(r => r.total !== 0 || r.faltan_cestas > 0); 

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
    
    // 🛡️ BLOQUEO ANTI-SPAM CLICKS: Si no existe o ya fue completado, abortar la transacción.
    if (!pedido || pedido.estado === 'completado') {
        return res.redirect('/recepcion');
    }

    const rezagoCalculado = pedido.cantidad - tabacosEntregados;
    const cestasEsperadas = Math.ceil(pedido.cantidad / 500); // Promedio corporativo
    const cestasFaltantes = (cestasEsperadas - cestasDevueltas) > 0 ? (cestasEsperadas - cestasDevueltas) : 0;

    await supabase.from('pedidos').update({ 
        estado: 'completado', 
        entregado: tabacosEntregados,
        rezago: rezagoCalculado,
        rezago_cestas: cestasFaltantes
    }).eq('id', idPedido);

    const { data: invTabacos } = await supabase.from('inventario').select('*').eq('material', pedido.material).single();
    
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
        
        let nomCesta = 'Cestas Plásticas';
        if (invCestas && invCestas.length > 0) {
            nomCesta = invCestas[0].material;
            await supabase.from('inventario').update({ cantidad: invCestas[0].cantidad + cestasDevueltas }).eq('id', invCestas[0].id);
        } else {
            await supabase.from('inventario').insert([{ material: nomCesta, cantidad: cestasDevueltas, categoria: 'Herramientas' }]);
        }
        
        // Mágicamente lo metemos al kardex para que el admin lo vea en Entradas y Salidas
        await supabase.from('movimientos').insert([{
            fecha: tiempo.fecha,
            hora: tiempo.hora,
            tipo_movimiento: 'ENTRADA',
            material: nomCesta,
            cantidad: cestasDevueltas,
            usuario: req.session.usuario || 'Admin',
            descripcion: `Devolución formal de cestas por ${pedido.usuario}`
        }]);
    }

    // ==========================================
    // 🪄 NUEVO: INTEGRACIÓN AUTOMÁTICA CON NÓMINA Y CESTAS
    // ==========================================
    const precio_por_tabaco = 150; // 150 COP la unidad, 150.000 el millar
    const ganancia = tabacosEntregados * precio_por_tabaco;
    
    // Inyectar en la nómina (Producción del Fabriquín) automáticamente
    if (tabacosEntregados > 0) {
        await supabase.from('produccion_fabriquines').insert([{
            fecha: tiempo.fecha,
            usuario: pedido.usuario,
            cantidad_producida: tabacosEntregados,
            precio_por_unidad: precio_por_tabaco,
            total_ganado: ganancia,
            estado: 'PENDIENTE'
        }]);
    }

    // Registrar en sistema de cobros de nómina física
    if (cestasFaltantes > 0) {
        await supabase.from('deudores_fabriquines').insert([{
            fecha: tiempo.fecha,
            usuario: pedido.usuario,
            monto_deuda: 0, 
            concepto: `Faltan ${cestasFaltantes} Cesta(s) Plástica(s)`,
            estado: 'ACTIVA'
        }]);
    }

    res.redirect('/recepcion');
});

// --- ABONAR REZAGOS (TABACOS Y CESTAS) ---
app.post('/abonar_rezago', async (req, res) => {
    const { usuario, cantidad_tabacos, cantidad_cestas } = req.body;
    const tabacos = parseInt(cantidad_tabacos) || 0;
    const cestas = parseInt(cantidad_cestas) || 0;
    
    if (tabacos <= 0 && cestas <= 0) return res.redirect('/recepcion');

    const tiempo = obtenerHoraColombia();

    // 1. Pedido fantasma maestro para saldar
    await supabase.from('pedidos').insert([{
        usuario: usuario,
        material: 'Abono Multi-Rezago',
        cantidad: 0,
        entregado: tabacos,
        rezago: -tabacos, 
        rezago_cestas: -cestas,
        estado: 'completado',
        fecha: tiempo.fecha
    }]);

    // 2. Procesar Tabacos (Inventario, Nómina y Kardex)
    if (tabacos > 0) {
        const { data: invTabacos } = await supabase.from('inventario').select('*').eq('material', req.body.tipo_tabaco || 'Tabacos Normales').single();
        if (invTabacos) {
            await supabase.from('inventario').update({ cantidad: invTabacos.cantidad + tabacos }).eq('id', invTabacos.id);
        }
        await supabase.from('movimientos').insert([{
            fecha: tiempo.fecha, hora: tiempo.hora, tipo_movimiento: 'ENTRADA',
            material: req.body.tipo_tabaco || 'Tabacos Normales', cantidad: tabacos, usuario: req.session.usuario || 'Admin',
            descripcion: `Abono/Devolución de rezagos de tabacos de ${usuario}.`
        }]);
        
        // ¡Magia! Si devuelve tabacos, ¡Significa que los fabricó y HAY QUE PAGÁRSELOS! 💰
        const precio = 150;
        await supabase.from('produccion_fabriquines').insert([{
            fecha: tiempo.fecha,
            usuario: usuario,
            cantidad_producida: tabacos,
            precio_por_unidad: precio,
            total_ganado: tabacos * precio,
            estado: 'PENDIENTE'
        }]);
    }

    // 3. Procesar Cestas (Inventario y Kardex)
    if (cestas > 0) {
        const { data: invCestas } = await supabase.from('inventario').select('*').ilike('material', '%cesta%').limit(1);
        let nomCesta = 'Cestas Plásticas';
        if (invCestas && invCestas.length > 0) {
            nomCesta = invCestas[0].material;
            await supabase.from('inventario').update({ cantidad: invCestas[0].cantidad + cestas }).eq('id', invCestas[0].id);
        } else {
            await supabase.from('inventario').insert([{ material: nomCesta, cantidad: cestas, categoria: 'Herramientas' }]);
        }
        
        await supabase.from('movimientos').insert([{
            fecha: tiempo.fecha, hora: tiempo.hora, tipo_movimiento: 'ENTRADA',
            material: nomCesta, cantidad: cestas, usuario: req.session.usuario || 'Admin',
            descripcion: `Abono/Devolución de cestas rezagadas de ${usuario}.`
        }]);
        
        // Limpiar la deuda penal (física) en su perfil
        const { data: deuda } = await supabase.from('deudores_fabriquines').select('*')
            .eq('usuario', usuario).eq('estado', 'ACTIVA').ilike('concepto', '%Cesta%').limit(1);
        if (deuda && deuda.length > 0) {
            await supabase.from('deudores_fabriquines').update({ estado: 'COBRADA' }).eq('id', deuda[0].id);
        }
    }

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