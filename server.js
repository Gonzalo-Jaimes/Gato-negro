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
    
    // Consulta a Supabase
    const { data: resultado, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('usuario', usuario)
        .eq('password', password)
        .single(); // single() porque esperamos 1 solo usuario

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

// ---------------- INVENTARIO E HISTORIAL ----------------
app.get('/inventario', async (req, res) => {
    if (!req.session.rol || req.session.rol !== 'admin') return res.redirect('/');
    
    // Pedimos datos a Supabase simultáneamente
    const { data: materiales } = await supabase.from('inventario').select('*').order('material', { ascending: true });
    const { data: historial } = await supabase.from('historial_ingresos').select('*').order('id', { ascending: false });
    
    res.render('inventario', { materiales: materiales || [], historial: historial || [] });
});

app.post('/agregar_material', async (req, res) => {
    const material = req.body.material.toLowerCase().trim();
    const cantidad = parseFloat(req.body.cantidad); 
    const fecha = new Date().toISOString().split('T')[0];

    // 1. Guardar Historial
    await supabase.from('historial_ingresos').insert([{ material, cantidad, fecha }]);

    // 2. Sumar al Total
    const { data: fila } = await supabase.from('inventario').select('*').eq('material', material).single();
    
    if (fila) {
        await supabase.from('inventario').update({ cantidad: fila.cantidad + cantidad }).eq('id', fila.id);
    } else {
        await supabase.from('inventario').insert([{ material, cantidad }]);
    }
    res.redirect('/inventario');
});

app.get('/eliminar/:id', async (req, res) => {
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

// ---------------- APROBAR PEDIDO (ESCUDO NUBE) ----------------
app.post('/aprobar_pedido/:id', async (req, res) => {
    const idPedido = req.params.id;
    const cestaSeleccionada = req.body.cesta_seleccionada || "ninguna"; 

    const { data: pedido } = await supabase.from('pedidos').select('*').eq('id', idPedido).single();
    if (!pedido) return res.send(mostrarAlerta('Error', 'No se encontró el pedido.', 'error'));

    let factor = pedido.cantidad / 1500;
    const { data: inv } = await supabase.from('inventario').select('*');

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

        // Descontar inventario específico
        for (let item of inv) {
            let m = item.material.toLowerCase();
            if ((m.includes('tripa') || m.includes('material')) && tripaReq > 0) {
                await supabase.from('inventario').update({ cantidad: item.cantidad - tripaReq }).eq('id', item.id);
            }
            if (m.includes('capa') && capaReq > 0) {
                await supabase.from('inventario').update({ cantidad: item.cantidad - capaReq }).eq('id', item.id);
            }
            if (m.includes('capote') && capoteReq > 0) {
                await supabase.from('inventario').update({ cantidad: item.cantidad - capoteReq }).eq('id', item.id);
            }
            if (m === cestaSeleccionada.toLowerCase() && cestasReq > 0) {
                await supabase.from('inventario').update({ cantidad: item.cantidad - cestasReq }).eq('id', item.id);
            }
        }
        await supabase.from('pedidos').update({ estado: 'aprobado' }).eq('id', idPedido);
        res.redirect('/pedidos');

    // --- LÓGICA ENVOLVEDOR ---
    } else if (pedido.material === 'Envoltura') {
        let papelReq = +(factor * 1.5).toFixed(2);
        let dispPapel = 0;
        
        inv.forEach(item => {
            if(item.material.toLowerCase().includes('papel')) dispPapel += item.cantidad; 
        });

        if (dispPapel < papelReq) {
            return res.send(mostrarAlerta('¡Falta Papel!', `Requiere: <b>${papelReq} kg</b><br>Tienes: <b>${dispPapel} kg</b> en bodega.`, 'warning'));
        }

        for (let item of inv) {
            if (item.material.toLowerCase().includes('papel')) {
                await supabase.from('inventario').update({ cantidad: item.cantidad - papelReq }).eq('id', item.id);
            }
        }
        await supabase.from('pedidos').update({ estado: 'aprobado' }).eq('id', idPedido);
        res.redirect('/pedidos');
    }
});
// ---------------- MÁQUINAS Y EQUIPOS ----------------
app.get('/maquinas', async (req, res) => {
    if (!req.session.rol || (req.session.rol !== 'admin' && req.session.rol !== 'mantenimiento')) return res.redirect('/');
    
    const { data: maquinas } = await supabase.from('maquinas').select('*').order('nombre', { ascending: true });
    res.render('maquinas', { maquinas: maquinas || [] });
});

app.post('/agregar_maquina', async (req, res) => {
    await supabase.from('maquinas').insert([{ 
        nombre: req.body.nombre,
        marca: req.body.marca,
        modelo: req.body.modelo,
        fabricante: req.body.fabricante,
        codigo: req.body.codigo,
        estado: req.body.estado,
        observaciones: req.body.observaciones
    }]);
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

app.get('/mantenimiento', async (req, res) => {
    if (!req.session.rol || (req.session.rol !== 'admin' && req.session.rol !== 'mantenimiento')) return res.redirect('/');
    const { data: mantenimientos } = await supabase.from('mantenimiento').select('*').order('id', { ascending: false });
    res.render('mantenimiento', { mantenimientos: mantenimientos || [] });
});

app.post('/agregar_mantenimiento', async (req, res) => {
    await supabase.from('mantenimiento').insert([req.body]);
    res.redirect('/mantenimiento');
});

// ---------------- INICIAR SERVIDOR / EXPORTAR A VERCEL ----------------
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`🐾 Servidor Gato Negro corriendo en http://localhost:${PORT}`));
}
module.exports = app; // <-- Vercel necesita esta línea para funcionar