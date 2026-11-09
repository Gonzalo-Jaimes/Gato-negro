> Etiquetas: #bot #telegram #whatsapp #docker #hosting #revision
> Fecha: 2026-11-09 · Rama: `feacture/revision_bot`

# 🐈‍⬛ Revisión completa del Black Cat Bot (BCB/BCA)

Documento único que consolida lo que el bot hace hoy (leído del código, no solo de los docs), lo que dicen los `.md` anteriores, y dos decisiones pendientes: **¿pasarlo a WhatsApp?** y **¿Docker en el PC fue lo mejor o hay que alojarlo en otro lado?**

Fuentes: `src/bot/bot_core.js` (1411 líneas), `src/bot/handlers/menu_handlers.js`, `server.js`, `Dockerfile`, `docker-compose.yml`, `tools/_set_webhook.js`, y los `.md` de `documentacion/` (`Black Cat Bot (BCB)`, `SISTEMA_ERP_Y_BOT`, `VISION_MULTIAGENTE_BCB`, `PENDIENTES_TECNICOS`, `avance_08_05`, `registro_bugfix_ollama`, `registro_avances_gemini_audio`, `conversation sobre ollama`, `2026-11-09_auditoria_seguridad`).

---

## 1. Qué puede hacer hoy

### 1.1 Comandos de texto (sin IA, deterministas)
| Comando | Qué hace |
|---|---|
| `/start`, saludos ("hola", "buenas…") | Menú principal con botones |
| `/ayuda` | Lista de comandos |
| `/id` | Devuelve tu ID de Telegram (útil para agregar usuarios) |
| `/ping` | Test de vida |
| `/pendientes` | Deudores de tabaco |
| `/entregas` | Últimos despachos |
| `/maquinas`, `/reporte` | Resumen de maquinaria: operativas, con fallas, mantenimiento vencido |
| `/deuda F11` | Deuda de tabacos y pesos de un fabriquín por código |
| Texto libre: `Alcides 1250 tabacos extra y 3 cestas rojas` | **Registro rápido de producción** por regex (sin IA) |

### 1.2 Menú con botones
- **🏭 Maquinaria:** lista dinámica desde Supabase con ✅/⚠️ → ficha completa → **reportar falla/mantenimiento** (Correctivo / Preventivo / Limpieza) → guarda en tabla `mantenimiento`.
- **🧺 Fabriquines:** deudores, últimas entregas, registro guiado de producción, **factura PDF** (`pdf_gen.js`).
- **💰 Finanzas / Nómina:** solo muestra la nómina pendiente (el "Saldo en Caja" dice *Sincronizando…*, es un placeholder).
- **🚚 Bodega:** primeros 10 materiales del inventario.
- **🤖 Chat IA:** modo conversacional libre (`/salir` para volver).

### 1.3 Chat con IA (Ollama + Llama 3.1 8B, function calling)
Herramientas que el modelo puede invocar:
`consultar_deuda_empleado`, `listar_todos_los_deudores`, `consultar_maquinaria`, `consultar_produccion(dias)`, `registrar_produccion` (tabacos, cestas, abono en pesos, extras), `obtener_color_cesta_para_pregunta`, `consultar_documentacion` (lee la base de conocimiento).

`registrar_produccion` es la acción más potente: actualiza `recepcion_diaria`, deuda del empleado, abonos en cascada sobre `prestamos_fabriquines`, **inventario** y **movimientos** (Kardex). O sea, el bot **escribe en la base de datos de producción**, no solo consulta.

### 1.4 Voz
Las notas de voz se descargan de Telegram, **Gemini 1.5 flash/pro las transcribe** (con fallback), y el texto sigue el flujo normal. (`PENDIENTES_TECNICOS.md` dice que "no puede procesar voz todavía": **está desactualizado**, el código ya lo hace en `bot_core.js:860`. Lo que sigue bloqueando es la cuota del free tier de Gemini.)

### 1.4b Lo que NO hace
Fotos/documentos (responde "solo entiendo texto y notas de voz"), alertas proactivas, notificaciones al admin cuando el mecánico pide un correctivo, merma formal, consulta de saldo completo, historial persistente.

---

## 2. Arquitectura actual (y sus puntos frágiles)

```
Telegram ──polling──▶ Docker (PC de Gonzalo) ──▶ Supabase (nube)
                          │
                          └──▶ Ollama (Windows host, RTX 4050)  ← el cerebro
                          └──▶ Gemini API (solo audio)
```

Hallazgos del código:

1. **Todo depende de que el PC esté encendido:** Ollama corre en el host Windows (`host.docker.internal:11434`), y el contenedor corre en ese mismo PC. PC apagado = bot muerto, sin excepción.
2. **Estado solo en RAM:** `userStates` (flujo "esperando descripción de mantenimiento", modo chat IA) y `conversaciones` (historial del LLM) son objetos en memoria. Reiniciar el contenedor los borra; en Vercel/serverless **se pierden entre invocaciones** y los flujos guiados dejarían de funcionar.
3. **Polling vs webhook se pelean:** en Docker (Linux, sin `VERCEL`) el bot arranca en **polling**. Pero `tools/_set_webhook.js` apunta el webhook a Vercel. Telegram no permite polling mientras hay un webhook activo (error 409): hay que tener claro cuál de los dos está activo.
4. **Webhook en `server.js` ignora callbacks:** `/api/bot` solo llama `procesarMensajeSync` si llega `req.body.message`; para botones usa `bot.processUpdate`, pero sin polling activo y en serverless la respuesta puede cortarse al hacer `res.sendStatus(200)` antes de terminar.
5. **Autorización incompleta:** `esAdmin` solo se aplica a mensajes (`bot_core.js:908`). El handler `callback_query` (`:1149`) **no verifica admin**: cualquiera que consiga un mensaje con los botones podría pulsarlos. Además `ADMIN_LIST` está hardcodeada (2 IDs) y **si se vacía, todos pasan** ("modo desarrollo").
6. **Calidad del LLM chico:** Llama 3.1 8B alucina tool calls. Hay parches (rescate por regex, filtro anti-JSON, casteo `parseInt`) en `registro_bugfix_ollama.md`. Funcionan, pero un 8B escribiendo en inventario y deudas es riesgoso. Falta **confirmación explícita** antes de `registrar_produccion`.
7. **Sin idempotencia:** si Telegram reenvía un update o el usuario repite, se registra dos veces.
8. **Dependencias:** `node-telegram-bot-api` tiene advisories moderados (`tough-cookie`/`uuid`) cuyo arreglo es un salto mayor (ver auditoría 2026-11-09). `shared.js` aún tiene una URL y key de Supabase como *fallback* hardcodeado.
9. **Seguridad pendiente de la auditoría:** `TELEGRAM_TOKEN` y `GEMINI_API_KEY` quedaron en el historial git de un repo público: **hay que rotarlas** (BotFather `/revoke` + AI Studio). Mientras no se roten, cualquiera puede suplantar al bot.
10. **Docker monta el código como volumen** (`.:/usr/src/app`): es práctico para desarrollar pero anula el sentido de empaquetar (la imagen no es reproducible).

---

## 3. ¿Docker fue lo mejor? ¿Dónde alojarlo?

**Respuesta corta:** Docker está bien como *formato de empaque*, pero **no resuelve tu problema real** (PC apagado). Lo que pesa es *dónde corre* y *qué cerebro usa*, no el contenedor.

El problema tiene dos piezas separadas:

| Pieza | Hoy | ¿Necesita el PC? |
|---|---|---|
| Servidor del bot / ERP (Node) | Docker en tu PC | No debería |
| LLM (Llama 3.1 vía Ollama + GPU) | Tu PC (RTX 4050) | **Sí, y es lo que ata todo** |

Mover solo el contenedor a la nube **no sirve** mientras el LLM siga en tu PC. Hay que decidir el cerebro.

### Opciones de alojamiento
| Opción | Costo aprox.* | Pros | Contras |
|---|---|---|---|
| **A. VPS barato + API de IA (Gemini/Claude/OpenAI)** | VPS ~US$5-6/mes + uso de API | 24/7, estado persistente, mismo Docker, soporta webhook y polling. Mejor calidad que Llama 8B. | Pago mensual; hay que migrar el LLM (ya está medio hecho para audio con Gemini) |
| **B. PaaS tipo Railway/Render/Fly con el Docker actual** | ~US$5-10/mes | Deploy desde git, menos mantenimiento que un VPS | Igual que A: necesita API de IA |
| **C. PC/mini-PC dedicado 24/7 en la fábrica** (ya estaba en `PENDIENTES_TECNICOS`) | Cero mensualidad; luz + equipo | Mantiene Ollama gratis y datos locales | Un corte de luz/internet = bot caído; hay que mantener la máquina. Llama 8B sigue siendo la parte débil |
| **D. Vercel (webhook serverless)** | Gratis | Ya está parcialmente armado | **No recomendado:** estado en RAM se pierde, timeouts cortos con LLM, no hay Ollama. Solo serviría para comandos deterministas |
| **E. Híbrido:** comandos deterministas siempre arriba (nube) + IA pesada opcional en PC | Bajo | Los comandos y botones nunca caen | Más piezas que mantener |

\* Precios de referencia; confirmar antes de decidir.

### Recomendación
1. **Corto plazo (esta semana):** rotar tokens; decidir si el webhook o el polling es el activo; agregar verificación `esAdmin` en `callback_query`.
2. **Mediano plazo:** **Opción A/B** — mover el contenedor a un VPS/PaaS y **cambiar el cerebro a una API**. Para tu caso (consultas cortas, un puñado de usuarios) el costo de API es de pocos dólares al mes y el tool calling es mucho más confiable que un 8B local.
3. **Guardar el estado en Supabase** (`bot_conversaciones` y `bot_estados` con TTL) para que sobreviva reinicios; es prerrequisito de cualquier despliegue en nube (ya estaba en pendientes).
4. **Sacar el volumen de código** del `docker-compose.yml` en producción.

Si la fábrica no quiere pagar nada: la **Opción C** (mini-PC dedicado) es la única gratis, pero asumes los cortes.

---

## 4. ¿Es viable pasarlo a WhatsApp?

**Sí, es viable, y tiene sentido porque ahí está tu gente.** Pero no es "cambiar la librería": cambia el modelo de mensajería, y hay un camino correcto y uno riesgoso.

### Camino correcto: WhatsApp Business Platform (Cloud API de Meta)
- Gratis para montar; Meta cobra **por mensaje de plantilla** enviado por el negocio. Responder dentro de la **ventana de 24 h** tras un mensaje del usuario es la ruta más barata/gratuita según la categoría. *(Confirmar la tabla de precios vigente de Meta antes de presupuestar.)*
- Requiere: cuenta de **Meta Business**, un **número dedicado** (no puede estar usándose en la app normal de WhatsApp a la vez), verificación del negocio, y **webhook público HTTPS** (otra razón para salir del PC de casa).
- Se puede ir directo a Meta o vía proveedor (Twilio, 360dialog…): más fácil de montar, un poco más caro.

### Camino riesgoso: librerías no oficiales (Baileys, whatsapp-web.js)
- "Gratis" y rápido (escaneas un QR), **pero viola los términos de WhatsApp**, puede **banear el número** de la empresa, y se rompe cuando WhatsApp cambia su protocolo. **No lo recomiendo** para un bot que escribe en producción y nómina.

### Qué se traduce bien y qué no
| Telegram hoy | WhatsApp |
|---|---|
| Comandos `/deuda F11` | No existen. Se reemplazan por texto libre/palabras clave o menú interactivo |
| Teclado inline con muchos botones | **Botones de respuesta: máx. 3**; **listas: máx. 10 opciones**. El menú de 5 opciones hay que rediseñarlo como lista |
| `editMessageText` (editar el menú in situ) | No se pueden editar mensajes: cada pulsación es un mensaje nuevo |
| Notas de voz | Sí: llegan como media; mismo flujo de transcripción con Gemini. **WhatsApp se usa mucho con voz, buen fit** |
| PDF de factura | Sí, se envían como documento |
| Alertas proactivas | Solo con **plantillas aprobadas** si pasaron >24 h desde el último mensaje del usuario |
| Lista blanca por ID | Se reemplaza por lista blanca de **números de teléfono** (más natural y fácil de gestionar) |

### Qué cambia en el código
El núcleo de negocio (`registrarProduccionRapida`, consultas a Supabase, PDF, herramientas del LLM) **se reutiliza tal cual**. Lo que hay que reescribir es solo la capa de transporte (~25% de `bot_core.js`: recibir webhook, enviar mensajes, menús, estados). Por eso conviene **separar ya** la lógica del bot de la capa Telegram, para poder tener los dos canales con el mismo cerebro.

### Plan sugerido
1. Refactor: extraer `core` (herramientas + lógica) de `transporte telegram` → interfaz `enviarTexto / enviarMenu / enviarDocumento`.
2. Mover a VPS/PaaS con webhook HTTPS y estado en Supabase (sección 3).
3. Crear cuenta Meta Business + número de prueba (Meta da uno de sandbox) y montar `/api/whatsapp` con verificación de firma del webhook.
4. Piloto con 2-3 personas (tú, la ingeniera, un supervisor) en paralelo a Telegram.
5. Si funciona, apagar Telegram o dejarlo solo para admins.

---

## 5. Pendientes consolidados del bot (ordenados)

**Urgente (seguridad)**
- [ ] Rotar `TELEGRAM_TOKEN` y `GEMINI_API_KEY` (siguen en el historial git público).
- [ ] Verificar `esAdmin` también en `callback_query`.
- [ ] Quitar el fallback hardcodeado de Supabase en `src/lib/shared.js`.
- [ ] No permitir "lista vacía = todos entran" en `ADMIN_LIST`; moverla a variable de entorno.

**Estabilidad**
- [ ] Decidir polling vs webhook (no ambos). Documentar cuál está activo.
- [ ] Persistir `conversaciones` y `userStates` en Supabase con TTL.
- [ ] Confirmación ("¿Registro 1250 tabacos a Alcides? Sí/No") antes de escribir producción desde el chat IA.
- [ ] Idempotencia por `update_id` / `message_id`.
- [ ] Corregir `PENDIENTES_TECNICOS.md` (voz ya implementada).

**Despliegue**
- [ ] Elegir host (recomendado: VPS/PaaS + API de IA) y quitar dependencia del PC.
- [ ] Quitar el volumen de código del compose de producción.

**Producto**
- [ ] Alertas proactivas (mantenimiento vencido, stock bajo de cestas).
- [ ] Notificar al admin las solicitudes de correctivo del mecánico.
- [ ] Herramienta `consultar_saldo_completo`.
- [ ] Rediseño del menú para WhatsApp (lista de ≤10 ítems).
- [ ] Visión multi-agente (Fase 1: modularizar `bot_core.js`; 1411 líneas en un archivo).

---

## 6. Sobre `ask-argon.bat`

El `.bat` está en `cronograma-universidad/Arreglos-de-calendario/ask-argon.bat` (no en este repo; está en `.gitignore`) y es solo un atajo: `gemini -m gemini-2.5-argon %*`, es decir, un envoltorio del **Gemini CLI** para pedir segunda opinión a otro modelo. No lo ejecuté en esta revisión (enviaría contenido del proyecto a un servicio externo); si quieres, le pasamos este documento para contrastar las conclusiones.

---

## 7. Decisiones que necesito de ti
1. ¿Se acepta pagar un VPS/PaaS + API de IA (~pocos dólares/mes), o debe ser gratis (mini-PC en la fábrica)?
2. ¿WhatsApp reemplaza a Telegram o conviven?
3. ¿Hay un número de WhatsApp que se pueda dedicar solo al bot?

---

## 8. Segunda opinión de Argon (2026-11-09)

Ejecutado con `ask-argon.bat` (Antigravity CLI, modo plan = solo lectura). Los puntos 1 y 3 los verifiqué en el código; el resto están **por verificar**.

1. **Gemini sin autenticación (verificado):** la transcripción de voz corre *antes* de `esAdmin` (`bot_core.js:860` vs `:908`). Un desconocido que envíe audios gasta tu cuota de Gemini.
2. **Escrituras sin atomicidad (por verificar):** `registrarProduccionRapida` hace varios `update/insert` seguidos sin transacción ni revisar `error`; dos mensajes simultáneos o un fallo a medias pueden descuadrar saldos y Kardex.
3. **Los saludos pisan los flujos activos (verificado):** `esSaludo` se evalúa antes de `userStates`. "Hola, ¿cuánto debe F11?" dentro del chat IA te saca al menú.
4. **Cestas pendientes (por verificar):** toma las cestas del último despacho pero resta devoluciones de todo el historial.
5. **Herramienta inventada = "éxito" (por verificar):** el `default` de `ejecutarHerramienta` devuelve `exito: true`.
6. **`consultar_produccion(dias:1)` y recorte de historial (por verificar):** el filtro por `semana_inicio` no da "hoy"; `slice(-19)` puede dejar un mensaje `tool` huérfano.
7. **WhatsApp:** Meta exige webhook HTTPS público 24/7. Con el PC como servidor haría falta un túnel (Cloudflare Tunnel) y cualquier apagado tumba el servicio.
