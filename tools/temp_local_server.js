const app = require('./server');
const port = process.env.PORT || 3001;

app.listen(port, () => {
    console.log(`🚀 Servidor local de previsualización v3.0 activo en: http://localhost:${port}`);
    console.log(`👉 Visita la URL para ver el nuevo diseño de Login y el Header.`);
});
