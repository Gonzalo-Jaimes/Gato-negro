> Etiquetas: #erp #operaciones #mantenimiento #maquinaria #manolo

# 🛠️ Diseño, Estado Actual y Hoja de Ruta: Módulo de Mantenimiento

Este documento consolida la especificación técnica, el estado actual de implementación y los requerimientos para el **Área de Mantenimiento y Maquinaria** de la [[EMPRESA_GATO_NEGRO|Fábrica de Tabacos Gato Negro]], operada principalmente por el mecánico de planta **Manuel "Manolo"** y supervisada por Administración.

---

## 1. ¿Qué tenemos actualmente? (Estado Implementado)

### 1.1 Base de Datos (Supabase)
El módulo opera de forma unificada sobre dos tablas principales en Supabase (además de `usuarios` y `auditoria_logs`), sin requerir tablas adicionales para tareas o solicitudes:
- **`maquinas`**: Catálogo de los 28 equipos de la fábrica (despalilladoras, enrolladoras, picadoras, hornos, compresor, camiones, etc.).
  - Campos principales: `id`, `nombre`, `codigo`, `area`, `marca`, `modelo`, `fabricante`, `horas_dia`, `estado` (`Funcional`, `Falla Menor`, `No Funcional`, `Guardada`), `frecuencia_mtto_dias` (default: 30), `ultimo_mtto`, `observaciones`, `imagen`.
- **`mantenimiento`**: Historial de órdenes de trabajo, tareas asignadas y solicitudes de correctivo.
  - Campos principales: `id`, `fecha`, `hora`, `maquina` (nombre del equipo), `tipo` (`Preventivo`, `Correctivo`, `Limpieza Post-Produccion`), `descripcion`, `tiempo_min`, `costo_mo`, `costo_mat`, `hecho_por`, `estado`, `foto_url`.
  - **Estados soportados en `mantenimiento.estado`:**
    - `REALIZADO`: Orden ejecutada (impacta costos en BI y reinicia contador `ultimo_mtto` si es `Preventivo`).
    - `NO REALIZADO`: Tarea asignada por Admin pendiente de ejecutar por el mecánico.
    - `SOLICITADO`: Solicitud de mantenimiento correctivo abierta por el mecánico, pendiente de aprobación del Admin.
    - `APROBADO`: Solicitud de correctivo autorizada por el Admin, lista para que el mecánico la ejecute y cierre.
    - `RECHAZADO`: Solicitud de correctivo rechazada por el Admin (conserva motivo en `descripcion`, no suma costos ni aparece en la ficha técnica impresa).
- **`usuarios`**: Soporta el rol `"mantenimiento"` (con login tradicional en `/login` y login por tarjeta en `/login/nfc`, redirigiendo automáticamente a `/mantenimiento`).

### 1.2 Rutas Backend (`src/routes/equipos.js`)
| Método | Ruta (y Alias) | Middleware | Función actual |
| :--- | :--- | :--- | :--- |
| `GET` | `/maquinas` (`/lista`) | `isAuth` | Lista el catálogo de máquinas, calcula `costo_historico` y `dias_para_mtto` según `ultimo_mtto` y `frecuencia_mtto_dias`. |
| `POST` | `/agregar` (`/agregar_maquina`) | `isAdmin` | Registra un nuevo equipo en `maquinas`. |
| `POST` | `/editar/:id` (`/editar_maquina/:id`) | `isAdmin` | Edita los datos técnicos, estado, frecuencia o fecha de último mantenimiento de una máquina. |
| `GET` | `/eliminar/:id` (`/eliminar_maquina/:id`) | `isAdmin` | Elimina un equipo de la base de datos. |
| `GET` | `/ficha/:id` (`/ficha_maquina/:id`, `/maquinas/ficha/:id`) | `isAuth` | Muestra la Hoja de Vida / Ficha Técnica imprimible de la máquina filtrando únicamente intervenciones con `estado = 'REALIZADO'`. |
| `GET` | `/mantenimiento` | `isAuth` | Muestra bandejas de Solicitudes de Correctivo, Tareas Asignadas Pendientes, formulario dinámico y el historial de órdenes. |
| `POST` | `/registrar_mantenimiento` (`/agregar_mantenimiento`) | `isAuth` | Inserta orden en `mantenimiento`. Si el mecánico envía un `Correctivo`, pasa automáticamente a `SOLICITADO` y notifica por Telegram al Admin. |
| `POST` | `/mantenimiento/responder_solicitud/:id` | `isAdmin` | Permite al Admin aprobar (`APROBADO`) o rechazar (`RECHAZADO`) una solicitud de correctivo adjuntando un comentario. |
| `POST` | `/mantenimiento/completar/:id` | `isAuth` | Permite al mecánico o Admin completar una tarea asignada (`NO REALIZADO`) o un correctivo autorizado (`APROBADO`), pasando a `REALIZADO` y actualizando `ultimo_mtto` si es `Preventivo`. |
| `GET` | `/qrs` (`/maquinas/qrs`) | `isAdmin` | Panel de etiquetas QR con selección por checkbox para impresión (`@media print`). |
| `GET` | `/:id/qr` (`/maquina/:id/qr`) | Público | Genera en tiempo real el buffer PNG del código QR que apunta a `/ficha/:id`. |

### 1.3 Vistas Frontend (`views/equipos/`)
1. **`views/equipos/lista.ejs` (`/maquinas`)**:
   - Formulario superior para crear máquina (visible solo para `admin`).
   - Buscador en tiempo real por nombre, código, marca o área.
   - Tabla con semáforo de salud del equipo (`🟢 Funcional`, `🟡 Falla Menor`, `🔴 No Funcional`, `⚪ Guardada`) y alerta de días restantes para mantenimiento (`🚨 ¡Mtto Atrasado!`, `⚠️ Próximo Mtto`, `🟢 Mtto al Día`).
   - Modal rápido de Ficha Técnica (al hacer doble clic en la fila) y modal de edición de máquina (solo `admin`).
2. **`views/equipos/mantenimiento.ejs` (`/mantenimiento`)**:
   - **Bandeja 1 — Solicitudes de Correctivo (`SOLICITADO` / `APROBADO`):** Botones de Aprobar/Rechazar para Admin y botón de Registrar Ejecución para Manolo una vez aprobado.
   - **Bandeja 2 — Tareas Asignadas / Pendientes (`NO REALIZADO`):** Lista de tareas programadas para el mecánico con botón `✔ Marcar Realizado`.
   - **Formulario Principal inteligente con Select2:** Adapta textos y estados según si quien opera es Admin (puede asignar tarea pendiente o registrar orden realizada) o Mecánico (registra preventivos/limpiezas directamente o solicita aprobación en caso de correctivos).
   - **Tabla de Historial de Órdenes de Trabajo:** Con buscador instantáneo, badges por estado y modal emergente (`#modal-detalle-mtto`).
3. **`views/equipos/ficha.ejs` (`/ficha/:id`)**:
   - Formato corporativo tipo Excel con encabezado oficial de la empresa, foto del equipo, grilla de datos técnicos, historial de intervenciones realizadas y botón de impresión.
4. **`views/equipos/qrs.ejs` (`/maquinas/qrs`)**:
   - Cuadrícula de tarjetas QR con filtro de selección manual para imprimir únicamente los stickers deseados.

---

## 2. Estado de Requerimientos y Ajustes

### 2.1 Ajuste Prioritario de UI/UX y Rol para Manolo (`rol === "mantenimiento"`) — ✅ COMPLETADO (03/11/2026)
- [x] **Menú Lateral (Sidebar) en `views/partials/header.ejs`**:
  - **Problema detectado:** El sidebar solo distinguía `if (session.rol === "admin")` y enviaba a todos los demás roles al bloque `else`, mostrando únicamente `📋 Pedidos` (`/pedidos`) y `💵 Mi Producción` (`/cierre_diario`), los cuales no tienen relación con el área de mantenimiento.
  - **Solución aplicada:** Se agregó la condición `else if (session.rol === "mantenimiento")` en `views/partials/header.ejs` mostrando la sección **Área Técnica** con:
    - `⚙️ Ver Máquinas` (`/maquinas`) — para ver el catálogo, estado, alertas y fichas técnicas de las máquinas.
    - `🔧 Subir Mantenimiento` (`/mantenimiento`) — para registrar y consultar mantenimientos.
- [x] **Permisos visuales en `/maquinas` (`views/equipos/lista.ejs`)**:
  - Cuando ingresa el mecánico (`rol === "mantenimiento"`), puede consultar todas las máquinas, usar el buscador y abrir sus fichas técnicas (`/ficha/:id` y modal rápido con doble clic), ocultando los controles exclusivos de administrador (`Registrar Nuevo Equipo`, `Editar` y `Borrar` máquina).
- [x] **Adaptación del formulario de Mantenimiento para el Mecánico (`views/equipos/mantenimiento.ejs`)**:
  - Se autocompletan por defecto la **Fecha** y **Hora** actual al abrir la vista, y el campo `Responsable (Hecho por)` se pre-llena automáticamente con el usuario en sesión cuando su rol es `mantenimiento`.
- [x] **Corrección de etiqueta en Ficha Técnica (`views/equipos/ficha.ejs`)**:
  - Se corrigió la tarjeta de historial para que `Limpieza Post-Produccion` muestre `🔵 Limpieza Post-Produccion` en lugar de `🔴 Correctivo`.

### 2.2 Flujo de Tareas Asignadas (Admin ➡️ Mecánico) — ✅ COMPLETADO (03/11/2026)
- [x] **Asignación de tareas desde Administración:**
  - El administrador puede seleccionar `📌 ASIGNAR TAREA PENDIENTE AL MECÁNICO (Por Realizar)` en `/mantenimiento`, indicando máquina, tipo (`Preventivo`, `Limpieza Post-Produccion`, `Correctivo`), instrucciones, fecha límite/programada y responsable (`manolo`).
- [x] **Bandeja de "Mis Tareas Pendientes" para Manolo:**
  - Al entrar a `/mantenimiento`, Manolo visualiza sus tareas pendientes en la tarjeta superior y puede pulsar **`✔ Marcar Realizado`**, ingresando en un modal el tiempo de parada, costos y notas de ejecución (actualizando automáticamente `ultimo_mtto` si era `Preventivo`).

### 2.3 Flujo de Solicitudes de Correctivo y Aprobación (Mecánico ➡️ Admin) — ✅ COMPLETADO (03/11/2026)
- [x] **Solicitud de Mantenimiento Correctivo por el Mecánico:**
  - Cuando Manolo selecciona `🔴 Mantenimiento Correctivo` en `/mantenimiento`, el formulario le avisa que requiere autorización y crea el registro en estado `SOLICITADO`.
- [x] **Aprobación o Rechazo por el Administrador:**
  - Al administrador le aparece la bandeja **🚨 Solicitudes de Mantenimiento Correctivo** con botones **`✅ Aprobar`** y **`❌ Rechazar`** y un modal para añadir comentarios o instrucciones.
  - Al aprobarse (`APROBADO`), a Manolo se le habilita el botón **`🔧 Registrar Ejecución`** para cerrarla como `REALIZADO`.
- [x] **Notificación por Telegram (Bot BCA):**
  - Al crearse una solicitud de correctivo (`SOLICITADO`), el backend envía automáticamente un mensaje de alerta por Telegram al administrador (`ADMIN_CHAT_IDS`) si `TELEGRAM_TOKEN` está configurado, además de dejar trazabilidad en `auditoria_logs`.

---

## 📝 Bitácora de Desarrollo del Módulo

### Fecha: 03 de Noviembre de 2026 (19:59 — Auditoría Inicial y Creación de Bitácora)
* **Acción:** Creación del documento maestro `Módulo Mantenimiento.md`.
* **Detalle:** Se auditó todo el código existente en `src/routes/equipos.js`, `views/equipos/*` y `views/partials/header.ejs`. Se identificó que el usuario con rol `mantenimiento` (Manolo) es redirigido correctamente a `/mantenimiento` al iniciar sesión, pero el menú lateral (`header.ejs`) le mostraba las opciones de operario de producción (`Pedidos` y `Mi Producción`) en lugar de los accesos a `Máquinas` (`/maquinas`) y `Órdenes de Mantenimiento` (`/mantenimiento`).

### Fecha: 03 de Noviembre de 2026 (20:05 — Implementación Menú Lateral de Manolo y Ajustes de Vistas)
* **Acción:** Corrección del Sidebar para rol `mantenimiento`, permisos en catálogo de máquinas y mejoras UX en órdenes y fichas técnicas.
* **Detalle:**
  1. **`views/partials/header.ejs`**: Se añadió el bloque `else if (session.rol === "mantenimiento")` con la sección **Área Técnica** y los enlaces `⚙️ Ver Máquinas` (`/maquinas`) y `🔧 Subir Mantenimiento` (`/mantenimiento`).
  2. **`views/equipos/lista.ejs`**: Se restringió la visibilidad del formulario *Registrar Nuevo Equipo* y de los botones *Editar* / *Borrar* únicamente al rol `admin`, permitiendo a Manolo consultar todas las máquinas, su salud, buscador y fichas técnicas sin errores de permisos.
  3. **`views/equipos/mantenimiento.ejs`**: Se agregó autocompletado automático de fecha y hora actual al cargar el formulario, y pre-llenado automático del campo `Responsable (Hecho por)` con el usuario en sesión cuando su rol es `mantenimiento`.
  4. **`views/equipos/ficha.ejs`**: Se corrigió la visualización del tipo de mantenimiento en las tarjetas del historial clínico para distinguir correctamente `Preventivo` (🟢), `Correctivo` (🔴) y `Limpieza Post-Produccion` (🔵).
* **Verificación:** Probado y validado en servidor local (`http://localhost:3001`) con el usuario `manolo`.

### Fecha: 03 de Noviembre de 2026 (21:05 — Flujo de Tareas Asignadas y Solicitudes de Correctivo Integrado)
* **Acción:** Implementación completa de asignación de tareas (Admin ➡️ Mecánico) y solicitudes de correctivo con aprobación/rechazo (Mecánico ➡️ Admin) sobre la tabla `mantenimiento`.
* **Detalle:**
  1. **`src/routes/equipos.js`**:
     - En `GET /ficha/:id` se filtró `.eq('estado', 'REALIZADO')` para que la ficha técnica imprimible solo muestre mantenimientos efectivamente realizados.
     - En `POST /registrar_mantenimiento`, si el usuario no es `admin` y registra un `Correctivo`, el estado se guarda automáticamente como `SOLICITADO`, se registra en `auditoria_logs` y se envía notificación por Telegram al administrador.
     - Se creó `POST /mantenimiento/responder_solicitud/:id` (`isAdmin`) para aprobar (`APROBADO`) o rechazar (`RECHAZADO`) solicitudes de correctivo anexando el comentario administrativo en `descripcion`.
     - Se creó `POST /mantenimiento/completar/:id` (`isAuth`) para que Manolo o el Admin marquen como `REALIZADO` tanto tareas asignadas (`NO REALIZADO`) como correctivos aprobados (`APROBADO`), registrando tiempo de parada, costos, notas de cierre y actualizando `ultimo_mtto` en `maquinas` si el mantenimiento es `Preventivo`.
  2. **`views/equipos/mantenimiento.ejs`**:
     - Se añadió la bandeja **🚨 Solicitudes de Mantenimiento Correctivo** con botones de aprobación/rechazo para Admin y botón de ejecución para el mecánico cuando está aprobado.
     - Se añadió la bandeja **📌 Tareas Pendientes Asignadas** con botón `✔ Marcar Realizado` y modal de cierre (`#modal-completar-mtto`).
     - Se adaptó dinámicamente el formulario principal para mostrar alerta de solicitud cuando el mecánico elige `Correctivo`, y selector de asignación de tarea cuando opera el Admin.

### Fecha: 03 de Noviembre de 2026 (21:13 — Numeración Secuencial Independiente por Máquina)
* **Acción:** Reemplazo del ID global de base de datos por un contador consecutivo independiente por máquina (`nro_maquina`: `#1`, `#2`, `#3`...).
* **Detalle:**
  - En **`src/routes/equipos.js`** (`GET /mantenimiento` y `GET /ficha/:id`), se ordenan cronológicamente los registros y se asigna a cada orden su número secuencial propio dentro del historial de esa máquina (`nro_maquina`), de modo que si una máquina tiene 5 mantenimientos se numeran del `#1` al `#5` sin saltos provocados por otras máquinas.
  - En **`views/equipos/mantenimiento.ejs`** y **`views/equipos/ficha.ejs`**, todas las tablas, tarjetas y modales muestran ahora `# 1`, `# 2`, `# 3` por equipo, conservando internamente `mtto.id` para las operaciones en base de datos.

### Fecha: 03 de Noviembre de 2026 (21:21 — Rediseño Visual de Fichas Técnicas con Paleta Artesanal Tabaquera v4.0)
* **Acción:** Aplicación del Sistema de Diseño v4.0 (`public/css/theme.css`) a la Ficha Técnica imprimible (`/ficha/:id`) y al modal rápido de Ficha Técnica en `/maquinas`.
* **Detalle:**
  - **`views/equipos/ficha.ejs`**: Se integró `/css/theme.css` con las variables cálidas de cobre/brasa (`--primary: #B4541A`), hoja de tabaco (`--secondary: #6B4F2A`), superficies de papel cálido (`--bg-main`, `--bg-card`), modo oscuro nativo con botón de cambio de tema (`🌓 Cambiar Tema`), botón de retorno (`⬅ Volver a Máquinas`), blindaje de costos solo para rol `admin` y preservación de formato limpio blanco y negro en `@media print`.
  - **`views/equipos/lista.ejs`**: Se actualizaron los colores del modal `#modal-ficha`, enlaces y botones `📋 Ver Ficha` eliminando los antiguos tonos azules/morados por la paleta artesanal tabaquera v4.0.
