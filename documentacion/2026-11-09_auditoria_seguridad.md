# Auditoría de seguridad y corrección — Gato Negro ERP

**Fecha:** 9 de noviembre de 2026
**Hora de cierre del paquete de correcciones:** 10:06 a. m. (commit `9334cca`, hora local -05:00)
**Rama de trabajo:** `Gonzalo-Jaimes/revision-de-seguridad-y-codigo-basura`
**Rama de este documento:** `auditoria-seguridad/2026-11-09`
**Basado en:** "Manual de revisión básica de seguridad" (Tecnologías de la Industria 4.0 — Cloud Computing)
**Realizado con:** Claude Code (Claude Sonnet 5)

Este documento reúne, en un solo lugar y con evidencia reproducible, la auditoría de seguridad que hicimos hoy sobre el proyecto y las correcciones que quedaron aplicadas en el código. Sirve como entregable para el taller de la universidad.

---

## 1. Alcance y método

Se siguieron los 11 puntos del manual de la clase:
1. Búsqueda de claves y datos sensibles en el código (`service_role`, `password`, `secret`, `apikey`).
2. Revisión de lo que el navegador puede ver (consola, Network, Application).
3. Comprobación de RLS en Supabase con la clave pública (`anon`/`publishable`).
4. Prueba de inserción sin autorización.
5. Revisión de permisos entre usuarios / IDOR.
6. Storage y archivos.
7. HTTPS y cabeceras de respuesta.
8. `npm audit` / `npm outdated`.
9. Archivos `.env` y qué sigue Git.
10. Prueba de entrada de texto (`<script>alert("prueba")</script>`).
11. Verificación de que el rol no dependa solo del frontend.

Todas las pruebas se hicieron sobre el propio proyecto (repositorio `Gonzalo-Jaimes/Gato-negro` y su despliegue en `https://gato-negro.vercel.app/`), sin tocar sistemas de terceros.

---

## 2. Hallazgos (estado antes de corregir)

| # | Severidad | Hallazgo |
|---|---|---|
| 1 | **Crítica** | RLS abierto: 25 tablas de Supabase se leían sin sesión, incluida `usuarios` (con `password` e hashes) |
| 2 | **Crítica** | Clave de firma de cookie de sesión hardcodeada (`'gato_negro_nube'`) en `server.js`, en un repositorio **público**: permite falsificar una cookie de administrador |
| 3 | **Crítica** | `TELEGRAM_TOKEN` y `GEMINI_API_KEY` reales filtrados en el historial de git (commit `234ca04`, 2026-04-13) de un repo público, aunque el `.env` ya fue borrado después |
| 4 | Alta | `INSERT` anónimo aceptado por la API de Supabase (comprobado con `curl`, HTTP 201 en `auditoria_logs`) |
| 5 | Alta | `nfc_token` legible vía API pública; `/login/nfc?token=...` inicia sesión solo con ese valor |
| 6 | Alta | De 9 usuarios, 1 tenía la contraseña en texto plano; los 8 hashes bcrypt restantes eran de lectura pública |
| 7 | Alta | 28 vulnerabilidades en dependencias (`npm audit`): 5 críticas, 7 altas, 16 moderadas |
| 8 | Media | Sin cabeceras de seguridad (`CSP`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Referrer-Policy`), sin CSRF, sin rate limiting en login |
| 9 | Media | Riesgo de XSS almacenado en `mostrarAlerta()` (`src/lib/shared.js`) y XSS reflejada vía parámetro de URL en `fabriquines_diario.ejs` |
| 10 | Baja | Archivos basura/temporales versionados (`tmp_old_server*.js`, `app.py`, `crear_admin.py`, `test_*.js`, `.obsidian/`) |

Detalle completo de la metodología y de cada prueba (comandos `curl`, resultados HTTP, columnas expuestas, etc.) quedó registrado en la conversación de la sesión de auditoría del 9 de noviembre de 2026, antes de este documento.

---

## 3. Correcciones aplicadas hoy (commit `9334cca`)

### 3.1 Sesión y autenticación — `server.js`
- Se eliminó el valor estático de respaldo de la clave de sesión (`keys: ['gato_negro_nube']`).
- Ahora `SESSION_SECRET` se lee únicamente de la variable de entorno. En producción (`NODE_ENV=production` o `VERCEL=1`), **el servidor no arranca** si la variable no está definida.
- La cookie de sesión ahora incluye `httpOnly: true`, `sameSite: 'lax'` y `secure` cuando corre en producción.
- Se deshabilitó la cabecera `X-Powered-By`.

### 3.2 Cabeceras de seguridad — `server.js` + `helmet`
- Se instaló y configuró `helmet` (`package.json` → `"helmet": "^8.3.0"`).
- Cabeceras activas, verificadas con una petición real:
  - `Content-Security-Policy` (básica: `default-src 'self'`, con los orígenes externos que el proyecto ya usa — `cdn.jsdelivr.net`, `cdn.tailwindcss.com`, `code.jquery.com`, `cdn.datatables.net`, `fonts.googleapis.com`).
  - `X-Content-Type-Options: nosniff`.
  - `X-Frame-Options: SAMEORIGIN`.
  - `Referrer-Policy: no-referrer`.
- No se usó una CSP estricta con `nonce` porque las vistas EJS del proyecto usan scripts y estilos inline de forma extensiva; una CSP estricta habría roto la aplicación sin reescribir todas las vistas. Queda documentado como mejora futura.

### 3.3 Corrección de XSS
- **`src/lib/shared.js` → `mostrarAlerta()`:** el título, texto y ruta se interpolaban sin escapar dentro de un bloque `<script>`. Un valor con comillas o `</script>` (por ejemplo, el nombre de un empleado) podía ejecutar JavaScript arbitrario en el navegador del administrador. Se corrigió con una función `jsonParaScript()` que usa `JSON.stringify` y neutraliza además el carácter `<` para impedir que `</script>` cierre el bloque.
  - Verificado con el payload `Nombre con </script><img src=x onerror=alert(1)>`: queda como texto literal, no se ejecuta.
- **`views/produccion/fabriquines_diario.ejs`:** el parámetro de URL `despacho_id` se insertaba sin validar en `innerHTML` (XSS reflejada vía enlace manipulado). Se corrigió validando que sea solo dígitos y construyendo el enlace con `document.createElement` / `textContent` en vez de `innerHTML`.
- Se revisaron `movimientos_kardex.ejs` y `picadura.ejs`: sus usos de `innerHTML` solo manejan datos estáticos o numéricos propios del código, no datos de usuario. No se modificaron porque no son explotables.

### 3.4 Dependencias
- `npm audit fix` (sin cambios incompatibles): **28 → 13 vulnerabilidades**.
- Quedan pendientes, sin aplicar en este commit porque requieren una decisión del equipo:
  - `tough-cookie` / `uuid` (moderadas): solo se arreglan con `npm audit fix --force`, que sube `node-telegram-bot-api` a una versión mayor (`2.3.0`) y podría romper el bot de Telegram.
  - `xlsx` (alta/crítica): sin parche disponible en npm hasta la fecha; la alternativa es migrar a `exceljs` o a la build de SheetJS distribuida por CDN.

### 3.5 Limpieza de basura versionada
Se eliminaron del repositorio (sin referencias en el resto del código, verificado antes de borrar):
- `app.py`, `crear_admin.py` (prototipo en Flask/SQLite, no se usa; además creaba un admin con contraseña `1234`).
- `test_db.js`, `test_users.js` (scripts de prueba sueltos en la raíz).
- `tmp_old_server.js`, `tmp_old_server_utf8.js` (versión anterior del servidor, con la misma clave de sesión hardcodeada).
- `.obsidian/` (configuración local del editor Obsidian, no pertenece al repo del proyecto).

---

## 4. Evidencia para el entregable

### 4.1 Cabeceras de seguridad (antes / después)

**Antes** (`curl -I https://gato-negro.vercel.app/`):
```
HTTP/1.1 200 OK
Server: Vercel
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Powered-By: Express
```
Solo `Strict-Transport-Security` estaba presente (la pone Vercel por defecto).

**Después** (verificado localmente con el servidor corregido):
```
Content-Security-Policy: default-src 'self'; base-uri 'self'; ...
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: no-referrer
X-Powered-By: (ausente)
```

### 4.2 RLS / API de Supabase (lectura pública, sin sesión)

```
curl "https://jgvnqumkzfwruhjglics.supabase.co/rest/v1/usuarios?select=*" \
  -H "apikey: <ANON_KEY>"
```
Resultado: HTTP 200, 9 filas, columnas `id, usuario, password, rol, identificacion, nfc_token`.

```
curl -X POST "https://jgvnqumkzfwruhjglics.supabase.co/rest/v1/auditoria_logs" \
  -H "apikey: <ANON_KEY>" -H "Content-Type: application/json" \
  -d '{"usuario":"PRUEBA_AUDITORIA_RLS", "modulo":"SEGURIDAD", "accion":"test"}'
```
Resultado: HTTP 201 (inserción anónima aceptada). La fila de prueba fue borrada manualmente después desde el panel de Supabase.

**Este punto queda pendiente de corregir** — es una configuración de políticas RLS en el panel de Supabase, no un cambio de código.

### 4.3 Dependencias

```
npm audit            # antes: 28 vulnerabilidades (5 críticas, 7 altas, 16 moderadas)
npm audit fix         # después: 13 vulnerabilidades (2 críticas, 1 alta, 10 moderadas)
```

### 4.4 Seguridad de sesión

```
SESSION_SECRET=   node server.js   # NODE_ENV=production -> no arranca, lanza error
SESSION_SECRET=xx node server.js   # arranca normalmente
```

```
Swal.fire payload de prueba: Nombre con </script><img src=x onerror=alert(1)>
Salida generada: "Nombre con </script><img src=x onerror=alert(1)>"
```
El payload queda como texto, no ejecuta.

---

## 5. Pendiente (no es código, requiere acceso a paneles externos)

1. **Rotar credenciales filtradas:** `TELEGRAM_TOKEN` (revocar en @BotFather y generar uno nuevo) y `GEMINI_API_KEY` (rotar en Google AI Studio). Siguen expuestas en el historial de git de un repositorio público.
2. **Configurar `SESSION_SECRET` en Vercel** (Project Settings → Environment Variables) con un valor largo y aleatorio. Con el commit de hoy, el despliegue no arrancará sin esta variable.
3. **Activar RLS real en Supabase** en las 25 tablas que hoy devuelven datos sin sesión, y revisar las políticas `INSERT`/`UPDATE`/`DELETE` para que no acepten escritura anónima.
4. **Cambiar la contraseña en texto plano** del usuario que no tenía hash, y rotar el `nfc_token` expuesto.
5. **Dependencias que requieren decisión:** actualizar `node-telegram-bot-api` a una versión mayor (rompe compatibilidad, hay que probar el bot) o migrar `xlsx` a una alternativa con parche de seguridad.
6. Opcional / mejora futura: CSP estricta con `nonce` por vista, CSRF tokens en las rutas de eliminación que hoy son `GET`, rate limiting en `/login` y `/login/nfc`.

---

## 6. Referencia de commits

| Commit | Rama | Contenido |
|---|---|---|
| `9334cca` | `Gonzalo-Jaimes/revision-de-seguridad-y-codigo-basura` | Corrección de sesión, XSS, cabeceras de seguridad (`helmet`), `npm audit fix` y limpieza de archivos basura |
| (este documento) | `auditoria-seguridad/2026-11-09` | Registro de la auditoría y las correcciones, para el entregable del taller |

Ninguno de los dos commits fue enviado a `origin` todavía; quedan solo en el repositorio local hasta que se confirme el envío.
