const { mostrarAlerta } = require('./shared');

const isAdmin = (req, res, next) => {
    if (req.session && req.session.rol === 'admin') {
        return next();
    }
    res.redirect('/');
};

const isAuth = (req, res, next) => {
    if (req.session && req.session.usuario) {
        return next();
    }
    res.redirect('/');
};

module.exports = {
    isAdmin,
    isAuth
};
