require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const session = require('cookie-session');
const helmet = require('helmet');
const path = require('path');
const bot = require('./src/bot/bot_core.js');

const app = express();
app.disable('x-powered-by');

// --- CABECERAS DE SEGURIDAD ---
// CSP básica: el proyecto usa scripts/estilos inline en las vistas EJS y unas
// pocas librerías externas (SweetAlert2, Tailwind CDN, jQuery, DataTables),
// así que no se puede usar una CSP estricta con nonces sin reescribir todas
// las vistas. Esta configuración bloquea igualmente cualquier origen no listado
// (objetos, iframes, formularios a otros dominios, etc.).
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdn.tailwindcss.com", "https://code.jquery.com", "https://cdn.datatables.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net", "https://cdn.datatables.net"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
            imgSrc: ["'self'", "data:", "blob:"],
            mediaSrc: ["'self'"],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameAncestors: ["'self'"],
            formAction: ["'self'"],
            baseUri: ["'self'"],
            upgradeInsecureRequests: []
        }
    },
    // El sitio se sirve embebido en algunos flujos propios (splash NFC, QR);
    // no se bloquea con frameguard global, pero sí se limita con frameAncestors arriba.
    crossOriginEmbedderPolicy: false
}));

// --- CLAVE DE FIRMA DE SESIÓN ---
// Nunca debe existir un valor estático por defecto: una clave fija y pública
// permite falsificar cookies de sesión (incluida una sesión de "admin").
if (!process.env.SESSION_SECRET) {
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
        throw new Error('❌ SESSION_SECRET no está configurado. Defínelo como variable de entorno antes de arrancar en producción.');
    }
    console.warn('⚠️ SESSION_SECRET no configurado: usando una clave aleatoria solo para desarrollo local (las sesiones no sobrevivirán un reinicio).');
}
const SESSION_SECRET = process.env.SESSION_SECRET || require('crypto').randomBytes(32).toString('hex');

// --- MIDDLEWARES ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- CONFIGURACIÓN DE EJS & ESTÁTICOS ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// --- SESIONES ---
// Detrás del proxy de Vercel la petición llega por HTTP; sin esto cookie-session
// considera la conexión insegura y descarta la cookie "secure" (login roto).
app.set('trust proxy', 1);
app.use(session({
    name: 'gato_session',
    keys: [SESSION_SECRET],
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    secure: process.env.NODE_ENV === 'production' || process.env.VERCEL === '1',
    httpOnly: true,
    sameSite: 'lax'
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

// --- MONTAR RUTAS MODULARES (raíz, sin prefijos) ---
const adminRoutes    = require('./src/routes/admin');
const produccionRoutes = require('./src/routes/produccion');
const equiposRoutes  = require('./src/routes/equipos');
const finanzasRoutes = require('./src/routes/finanzas');
const operarioRoutes = require('./src/routes/operario');
const anilladoresRoutes = require('./src/routes/anilladores');
const empacadoresRoutes = require('./src/routes/empacadores');

app.get('/', (req, res) => res.render('landing'));

// Todos montados en raíz → /despacho, /anilladores, /inventario, etc.
app.use('/', adminRoutes);
app.use('/', produccionRoutes);
app.use('/', equiposRoutes);
app.use('/', finanzasRoutes);
app.use('/', operarioRoutes);
app.use('/', anilladoresRoutes);
app.use('/', empacadoresRoutes);

// --- MANEJO DE ERRORES 404 ---
app.use((req, res) => {
    res.status(404).send('<h2>404 - Página no encontrada en Gato Negro ERP</h2>');
});

// --- INICIAR SERVIDOR ---
const PORT = process.env.PORT || 3000;
// En Vercel no se debe usar app.listen. En Docker o Local sí.
const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;
if (!isVercel) {
    app.listen(PORT, () => {
        console.log(`
  🐈‍⬛ Gato Negro ERP - v3.3.0 Modular
  🚀 Servidor corriendo en: http://localhost:${PORT}
  🤖 Bot de Telegram activo (Modo Híbrido)
        `);
    });
}

module.exports = app; // Para Vercel