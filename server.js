const express = require('express');
const session = require('express-session');
const path = require('path');
const { createClient } = require('@supabase/supabase-js'); 

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

// ---------------- INVENTARIO Y KARDEX ----------------
app.get('/inventario', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');
    
    const { data: inventario } = await supabase.from('inventario').select('*').order('categoria', { ascending: true }).order('material', { ascending: true });
    const { data: movimientos } = await supabase.from('movimientos').select('*').order('fecha', { ascending: false }).order('hora', { ascending: false });
    
    res.render('inventario', { inventario: inventario || [], movimientos: movimientos || [] });
});

app.post('/agregar_inventario', async (req, res) => {
    const { material, cantidad, categoria, descripcion } = req.body;
    const cantNum = parseFloat(cantidad);
    
    const { data: existente } = await supabase.from('inventario').select('*').eq('material', material).single();
    if (existente) {
        await supabase.from('inventario').update({ cantidad: existente.cantidad + cantNum, categoria: categoria }).eq('id', existente.id);
    } else {
        await supabase.from('inventario').insert([{ material, cantidad: cantNum, categoria }]);
    }
    
    const hoy = new Date();
    const fechaLocal = new Date(hoy.getTime() - (4 * 60 * 60 * 1000)).toISOString().split('T')[0];
    
    await supabase.from('movimientos').insert([{
        fecha: fechaLocal,
        hora: hoy.toTimeString().split(' ')[0].substring(0, 5),
        tipo_movimiento: 'ENTRADA',
        material: material,
        cantidad: cantNum,
        usuario: req.session.usuario || 'Admin',
        descripcion: descripcion || 'Ingreso manual'
    }]);
    
    res.redirect('/inventario');
});

app.post('/restar_inventario', async (req, res) => {
    const { material_id, cantidad_salida, descripcion_salida, nombre_material } = req.body;
    const cantNum = parseFloat(cantidad_salida);
    
    const { data: existente } = await supabase.from('inventario').select('*').eq('id', material_id).single();
    
    if (existente && existente.cantidad >= cantNum) {
        await supabase.from('inventario').update({ cantidad: existente.cantidad - cantNum }).eq('id', existente.id);
        
        const hoy = new Date();
        const fechaLocal = new Date(hoy.getTime() - (4 * 60 * 60 * 1000)).toISOString().split('T')[0];

        await supabase.from('movimientos').insert([{
            fecha: fechaLocal,
            hora: hoy.toTimeString().split(' ')[0].substring(0, 5),
            tipo_movimiento: 'SALIDA',
            material: nombre_material,
            cantidad: cantNum,
            usuario: req.session.usuario || 'Admin',
            descripcion: descripcion_salida || 'Salida a producción / Despacho'
        }]);
    }
    res.redirect('/inventario');
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
    const fecha = new Date().toISOString().split('T')[0];
    const tipoPedido = req.session.rol === 'envolvedor' ? 'Envoltura' : 'Tabacos';

    await supabase.from('pedidos').insert([{ 
        material: tipoPedido, 
        cantidad: cantidad_tabacos, 
        usuario: req.session.usuario, 
        fecha: fecha, 
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
        const hoy = new Date();
        const fechaLocal = new Date(hoy.getTime() - (4 * 60 * 60 * 1000)).toISOString().split('T')[0];
        await supabase.from('movimientos').insert([{
            fecha: fechaLocal,
            hora: hoy.toTimeString().split(' ')[0].substring(0, 5),
            tipo_movimiento: 'SALIDA',
            material: material_nombre,
            cantidad: cant,
            usuario: req.session.usuario || 'Admin',
            descripcion: `Aprobado pedido #${pedido.id} para ${pedido.usuario}`
        }]);
    };

    // --- LÓGICA FABRIQUÍN ---
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

    // --- LÓGICA ENVOLVEDOR ---
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
    
    // Solo mostramos pedidos APROBADOS de TABACOS que aún no se han recibido
    const { data: pedidos } = await supabase.from('pedidos')
        .select('*')
        .eq('estado', 'aprobado')
        .eq('material', 'Tabacos')
        .order('id', { ascending: true });
        
    res.render('recepcion', { pedidos: pedidos || [] });
});

app.post('/recibir_tarea/:id', async (req, res) => {
    const idPedido = req.params.id;
    const tabacosEntregados = parseInt(req.body.entregado) || 0;
    const cestasDevueltas = parseInt(req.body.cestas_devueltas) || 0;

    // 1. Buscamos el pedido original para saber cuánto se le había pedido (Meta)
    const { data: pedido } = await supabase.from('pedidos').select('*').eq('id', idPedido).single();
    if (!pedido) return res.redirect('/recepcion');

    // 2. Calculamos la deuda (Rezago)
    const rezagoCalculado = pedido.cantidad - tabacosEntregados;

    // 3. Actualizamos el pedido: Lo marcamos 'completado' y guardamos lo que trajo y lo que debe
    await supabase.from('pedidos').update({ 
        estado: 'completado', 
        entregado: tabacosEntregados,
        rezago: rezagoCalculado
    }).eq('id', idPedido);

    // 4. Sumar los tabacos al Inventario (Buscamos la palabra 'Tabacos' sin importar mayúsculas)
    const { data: invTabacos } = await supabase.from('inventario').select('*').ilike('material', 'Tabacos').single();
    
    if (invTabacos) {
        await supabase.from('inventario').update({ cantidad: invTabacos.cantidad + tabacosEntregados }).eq('id', invTabacos.id);
    } else {
        await supabase.from('inventario').insert([{ material: 'Tabacos', cantidad: tabacosEntregados, categoria: 'En Proceso' }]);
    }

    // 5. Registrar la ENTRADA de tabacos en el Súper Kardex
    const hoy = new Date();
    const fechaLocal = new Date(hoy.getTime() - (4 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const horaLocal = hoy.toTimeString().split(' ')[0].substring(0, 5);

    let descripcionKardex = `Recepción de tarea. Orden #${idPedido}.`;
    if (rezagoCalculado > 0) descripcionKardex += ` (Quedó debiendo: ${rezagoCalculado} tabacos)`;

    await supabase.from('movimientos').insert([{
        fecha: fechaLocal,
        hora: horaLocal,
        tipo_movimiento: 'ENTRADA',
        material: 'Tabacos',
        cantidad: tabacosEntregados,
        usuario: req.session.usuario || 'Admin',
        descripcion: descripcionKardex
    }]);

    // 6. Si devolvió cestas, las sumamos
    if (cestasDevueltas > 0) {
        const { data: invCestas } = await supabase.from('inventario').select('*').ilike('material', '%cesta%').limit(1);
        if (invCestas && invCestas.length > 0) {
            await supabase.from('inventario').update({ cantidad: invCestas[0].cantidad + cestasDevueltas }).eq('id', invCestas[0].id);
        }
    }

    res.redirect('/recepcion');
});
// ---------------- MÁQUINAS Y EQUIPOS ----------------
app.get('/maquinas', async (req, res) => {
    if (!req.session.rol || (req.session.rol !== 'admin' && req.session.rol !== 'mantenimiento')) return res.redirect('/');
    
    const { data: maquinas } = await supabase.from('maquinas').select('*').order('nombre', { ascending: true });
    res.render('maquinas', { maquinas: maquinas || [] });
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
        observaciones: req.body.observaciones || 'Ninguna'
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
    res.redirect('/mantenimiento');
});

// ---------------- INICIAR SERVIDOR / EXPORTAR A VERCEL ----------------
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`🐾 Servidor Gato Negro corriendo en http://localhost:${PORT}`));
}
module.exports = app;