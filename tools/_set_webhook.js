require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const TOKEN = process.env.TELEGRAM_TOKEN;
const VERCEL_URL = "https://gato-negro-erp.vercel.app/api/bot"; // URL oficial del proyecto

if (!TOKEN) {
    console.error("❌ Error: No hay TELEGRAM_TOKEN en el archivo .env");
    process.exit(1);
}

const bot = new TelegramBot(TOKEN);

console.log("🛠️ Intentando conectar Telegram con Vercel...");
console.log(`🔗 URL de destino: ${VERCEL_URL}`);

bot.setWebHook(VERCEL_URL)
    .then((result) => {
        if (result) {
            console.log("✅ ¡CONEXIÓN EXITOSA!");
            console.log("🚀 Telegram ahora enviará los mensajes directamente a Vercel.");
            console.log("ℹ️ Ya puedes apagar tu PC y el bot seguirá funcionando.");
        } else {
            console.error("❌ Telegram rechazó la conexión. Verifica la URL.");
        }
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ ERROR CRÍTICO:");
        console.error(error.message);
        process.exit(1);
    });
