require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const session = require('cookie-session');
const path = require('path');
const bot = require('./src/bot/bot_core.js');

const app = express();

// --- MIDDLEWARES ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- CONFIGURACIÓN DE EJS & ESTÁTICOS ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// --- SESIONES ---
app.use(session({
    name: 'gato_session',
    keys: ['gato_negro_nube'],
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
}));

app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

// --- INTEGRACIÓN DE TELEGRAM BOT (WEBHOOK) ---
app.post('/api/bot', async (req, res) => {
    if (!process.env.TELEGRAM_TOKEN) {
        console.error("❌ ERROR: TELEGRAM_TOKEN no configurado.");
        return res.status(200).send("Bot Desactivado"); 
    }
    
    if (req.body && Object.keys(req.body).length > 0) {
        if (req.body.message && bot.procesarMensajeSync) {
            try {
                await bot.procesarMensajeSync(req.body.message);
            } catch (err) {
                console.error("❌ Error grave en bot:", err);
            }
        } else {
            bot.processUpdate(req.body);
        }
    }
    res.sendStatus(200);
});

// --- MONTAR RUTAS MODULARES ---
const adminRoutes = require('./src/routes/admin');
const produccionRoutes = require('./src/routes/produccion');
const equiposRoutes = require('./src/routes/equipos');
const finanzasRoutes = require('./src/routes/finanzas');
const operarioRoutes = require('./src/routes/operario');

// Rutas de raíz
app.get('/', (req, res) => res.render('login'));
app.use('/admin', adminRoutes);
app.use('/produccion', produccionRoutes);
app.use('/equipos', equiposRoutes);
app.use('/finanzas', finanzasRoutes);
app.use('/operarios', operarioRoutes);

// Shortcuts para compatibilidad con logins viejos o accesos directos
app.post('/login', adminRoutes); 
app.get('/logout', adminRoutes);

// --- CAPA DE REDIRECCIÓN (LEGACY) ---
const legacyMap = {
    '/despacho': '/produccion/despacho',
    '/recepcion_diaria': '/produccion/recepcion_diaria',
    '/entregas_historicas': '/produccion/entregas_historicas',
    '/maquinas': '/equipos/lista',
    '/mantenimiento': '/equipos/mantenimiento',
    '/inventario': '/admin/inventario',
    '/usuarios': '/admin/usuarios',
    '/empleados': '/admin/empleados',
    '/bodega': '/operarios/bodega',
    '/analitica': '/finanzas/analitica',
    '/nomina': '/finanzas/nomina',
    '/recepcion_empaque': '/produccion/recepcion_empaque',
    '/despacho_empaque': '/produccion/despacho_empaque',
    '/pedidos': '/produccion/pedidos'
};

Object.entries(legacyMap).forEach(([oldPath, newPath]) => {
    app.get(oldPath, (req, res) => res.redirect(newPath));
});

// --- MANEJO DE ERRORES 404 ---
app.use((req, res) => {
    res.status(404).send('<h2>404 - Página no encontrada en Gato Negro ERP</h2>');
});

// --- INICIAR SERVIDOR ---
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`
  🐈‍⬛ Gato Negro ERP - v3.3.0 Modular
  🚀 Servidor corriendo en: http://localhost:${PORT}
  🤖 Bot de Telegram activo (Modo Híbrido)
        `);
    });
}

module.exports = app; // Para Vercel