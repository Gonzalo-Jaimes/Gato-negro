# 🐈‍⬛ Gato Negro ERP

Sistema de gestión (ERP) para la **Fábrica de Tabacos Gato Negro** (San Antonio del Táchira, Venezuela): control de inventario, producción, nómina y mantenimiento de maquinaria para toda la cadena de manufactura artesanal del tabaco, con un bot de Telegram como canal adicional de captura de datos.

> Proyecto académico desarrollado por **Gonzalo Jaimes** — Ingeniería Mecatrónica, Universidad de Pamplona — sobre la operación real de la fábrica familiar.

## Índice

- [El problema que resuelve](#el-problema-que-resuelve)
- [Cadena de producción cubierta](#cadena-de-producción-cubierta)
- [Arquitectura y stack](#arquitectura-y-stack)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Puesta en marcha local](#puesta-en-marcha-local)
- [Variables de entorno](#variables-de-entorno)
- [Scripts disponibles](#scripts-disponibles)
- [Despliegue](#despliegue)
- [Seguridad](#seguridad)
- [Documentación adicional](#documentación-adicional)

## El problema que resuelve

Antes de este sistema, la fábrica dependía de hojas de Excel sueltas y anotaciones en papel centralizadas en un solo supervisor. Eso generaba:

- **Ceguera de inventario** entre semana (nadie sabía cuánta Capa, Capote o Picadura había en planta un miércoles).
- **Errores humanos** en el cálculo de pagos por destajo a los fabriquines.
- **Mermas no contabilizadas** (vena, recorte) que se perdían como activo.
- **Nula trazabilidad** entre los eslabones de producción (quién recibió qué, cuándo, y de quién).

Gato Negro ERP centraliza esa operación en una aplicación web con base de datos en la nube, cálculos automáticos y trazabilidad por usuario y por movimiento.

## Cadena de producción cubierta

El sistema modela los eslabones reales de manufactura:

1. **Bodega** — recibe materia prima y despacha Capa, Capote y Picadura.
2. **Fabriquines** — arman tabacos "en bola" (atados de 50) a destajo.
3. **Envolvedoras** — refinan y envuelven el tabaco crudo.
4. **Anilladores** — colocan la vitola (anillo) de marca y empaquetan.
5. **Empacadores / Despacho** — embalaje comercial final y salida a venta.

Además incluye: **mantenimiento de maquinaria** (fichas por equipo con código QR, bitácora de correctivos/preventivos), **finanzas** (nómina, facturación, cierres diarios, préstamos y abonos a empleados) y un **bot de Telegram** como canal alterno de captura y consulta para operarios en planta.

## Arquitectura y stack

| Capa | Tecnología |
|---|---|
| Backend | Node.js + [Express 5](https://expressjs.com/) |
| Vistas | [EJS](https://ejs.co/) (server-side rendering) |
| Base de datos | [Supabase](https://supabase.com/) (PostgreSQL gestionado) vía `@supabase/supabase-js` |
| Sesión | `cookie-session`, firmada con una clave en variable de entorno |
| Bot | `node-telegram-bot-api`, integrado vía webhook en `/api/bot` |
| IA | Google Gemini (`@google/genai`) para análisis de datos de producción |
| PDF / Excel | `pdfkit` (nóminas y facturas), `xlsx` (importación de formatos existentes) |
| QR | `qrcode` (fichas de máquina) |
| Seguridad HTTP | `helmet` (CSP, cabeceras de seguridad) |
| Hosting | [Vercel](https://vercel.com/) (serverless) |

El servidor se monta con todas las rutas en la raíz (sin prefijos de API), para que las URLs reflejen directamente la sección del ERP (`/inventario`, `/despacho`, `/nomina`, `/mantenimiento`, etc.).

## Estructura del proyecto

```
server.js                  Punto de entrada Express (sesión, middlewares, montaje de rutas)
src/
  bot/                      Lógica del bot de Telegram (bot_core.js, handlers)
  lib/                      Utilidades compartidas: cliente Supabase, bcrypt, alertas, auditoría
  routes/                   Rutas por dominio: admin, produccion, equipos, finanzas,
                            operario, anilladores, empacadores
views/
  admin/                    Inventario, usuarios, kardex, cierre diario
  produccion/               Despacho, recepción, mermas, picadura, fabriquines
  equipos/                  Fichas de máquina, mantenimiento, código QR
  finanzas/                 Nómina, facturación
  partials/                 Header, footer, loader, transiciones
public/                     Estáticos: CSS, JS de cliente, imágenes, video de splash
tools/                      Scripts puntuales de migración/mantenimiento de datos (uso manual, no en producción)
scripts/                    Análisis de datos (clustering de producción)
documentacion/              Bitácora de desarrollo, decisiones de diseño y auditorías
*.sql                       Migraciones aplicadas sobre el esquema de Supabase
```

## Puesta en marcha local

Requisitos: Node.js 20+, una cuenta y proyecto de [Supabase](https://supabase.com/).

```bash
git clone https://github.com/Gonzalo-Jaimes/Gato-negro.git
cd Gato-negro
npm install
cp .env.example .env   # y completa los valores (ver sección siguiente)
npm start
```

El servidor queda disponible en `http://localhost:3000`.

También hay un `docker-compose.yml` para levantarlo en contenedor (útil si se corre junto a un modelo local de Ollama):

```bash
docker compose up --build
```

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `SESSION_SECRET` | **Sí** | Clave para firmar la cookie de sesión. Debe ser un valor largo y aleatorio (`openssl rand -hex 32`). El servidor **no arranca en producción** sin ella. |
| `SUPABASE_URL` | Sí | URL del proyecto de Supabase. |
| `SUPABASE_KEY` | Sí | Clave `anon`/`publishable` de Supabase (no la `service_role`). |
| `TELEGRAM_TOKEN` | No | Token del bot de Telegram (`@BotFather`). Sin él, el bot queda desactivado. |
| `GEMINI_API_KEY` | No | Clave de Google Gemini para los módulos de análisis con IA. |
| `PORT` | No | Puerto local (por defecto `3000`; Vercel lo gestiona solo). |

> ⚠️ Nunca subas `.env` al repositorio. Rota cualquier credencial que haya quedado expuesta en el historial de git.

## Scripts disponibles

```bash
npm start   # arranca el servidor (equivalente a `node server.js`)
npm run dev # alias de npm start
```

## Despliegue

El proyecto está pensado para desplegarse en **Vercel** (`vercel.json` ya define el build con `@vercel/node`). Pasos clave:

1. Configurar `SESSION_SECRET`, `SUPABASE_URL`, `SUPABASE_KEY`, `TELEGRAM_TOKEN` y `GEMINI_API_KEY` como variables de entorno del proyecto en Vercel.
2. Apuntar el webhook del bot de Telegram a `https://<tu-dominio>/api/bot`.
3. Verificar en Supabase que **Row Level Security (RLS)** esté habilitado en todas las tablas con datos sensibles (ver siguiente sección).

## Seguridad

Este proyecto pasó por una auditoría de seguridad siguiendo el manual básico de revisión de la clase de Cloud Computing. El detalle completo (hallazgos, correcciones aplicadas y pendientes) está en [`documentacion/2026-11-09_auditoria_seguridad.md`](documentacion/2026-11-09_auditoria_seguridad.md). Resumen de lo que ya quedó corregido en el código:

- La clave de sesión ya no tiene un valor estático: se exige por variable de entorno (`SESSION_SECRET`).
- Cabeceras de seguridad activas vía `helmet` (CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`).
- Puntos de XSS corregidos en las alertas del servidor y en un parámetro de URL reflejado.
- Dependencias actualizadas donde fue posible sin romper compatibilidad (`npm audit fix`).

**Pendiente de configurar fuera del código:** activar RLS real en todas las tablas de Supabase y rotar cualquier credencial que haya estado expuesta en commits antiguos.

Si encuentras una vulnerabilidad, por favor repórtala de forma privada antes de publicarla.

## Documentación adicional

La carpeta [`documentacion/`](documentacion/) contiene la bitácora completa del desarrollo: decisiones de arquitectura, análisis de datos de producción, diccionario de términos de fábrica y el contexto de negocio (ver especialmente `EMPRESA_GATO_NEGRO.md`, `SISTEMA_ERP_Y_BOT.md` y `LINEA_DE_PRODUCCION_PLATAFORMA.md`).

---

🤖 Parte de este README y de la auditoría de seguridad se elaboró con ayuda de [Claude Code](https://claude.com/claude-code).
