const { mostrarAlerta } = require('./shared');

// ¿La petición espera JSON (fetch desde ui.js) en vez de una página?
const quiereJSON = (req) => req.xhr || (req.headers.accept || '').includes('application/json');

const isAdmin = (req, res, next) => {
    if (req.session && req.session.rol === 'admin') {
        return next();
    }
    // Sesión válida pero sin permiso: respuesta 403 explicativa (antes: rebote mudo al login)
    if (req.session && req.session.usuario) {
        if (quiereJSON(req)) return res.status(403).json({ ok: false, mensaje: 'No tienes permiso para realizar esta acción.' });
        return res.status(403).render('403');
    }
    if (quiereJSON(req)) return res.status(401).json({ ok: false, mensaje: 'Tu sesión expiró. Inicia sesión de nuevo.' });
    res.redirect('/login');
};

const isAuth = (req, res, next) => {
    if (req.session && req.session.usuario) {
        return next();
    }
    if (quiereJSON(req)) return res.status(401).json({ ok: false, mensaje: 'Tu sesión expiró. Inicia sesión de nuevo.' });
    res.redirect('/login');
};

module.exports = {
    isAdmin,
    isAuth,
    quiereJSON
};
