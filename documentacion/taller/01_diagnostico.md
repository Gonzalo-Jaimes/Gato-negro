# Fase 1 · Diagnóstico — Gato Negro ERP

Fecha de medición: 2026-11-17 · Servidor local `localhost:3001` · Rama `feature/taller-mejoramiento`
Método: inspección en navegador (escritorio 1366 px, tableta 768 px, móvil 375 px) y conteo programático en el DOM de cada pantalla.

> Origen de las capturas: las 15 capturas "antes" se tomaron del **commit original `a24fbc5`** (anterior al rediseño artesanal), ejecutado en un worktree aparte en el puerto 3002 con la misma base de datos. Las métricas de la sección 2 se midieron en ambas versiones (`a24fbc5` y la rama actual) y **coinciden**: el rediseño previo cambió CSS y paleta, no la estructura DOM, por lo que los hallazgos estructurales (labels, ARIA, estilos inline, modales, `alert`/`confirm`) son válidos para el estado original. Las cifras son medidas reales, no estimaciones.
>
> Diferencia visible entre versiones: en `a24fbc5` el tema es frío (azul/gris, tipografía en negrita pesada en el menú) y `/movimientos` muestra barra de scroll horizontal en escritorio; en la versión actual el menú y la paleta cobre ya fueron mejorados.

## 1. Pantallas base y capturas originales

| # | Rol en el taller | Ruta | Vista | Capturas |
|---|---|---|---|---|
| 1 | Dashboard | `/analitica` | `views/admin/analitica.ejs` | `capturas/antes/{escritorio,tableta,movil}/1_dashboard_analitica.jpg` |
| 2 | Gestión | `/empleados` | `views/admin/empleados.ejs` | `.../2_gestion_empleados.jpg` |
| 3 | Formulario crítico | `/despacho` | `views/produccion/despacho.ejs` | `.../3_formulario_despacho.jpg` |
| 4 | Tabla / listado | `/movimientos` | `views/admin/movimientos_kardex.ejs` | `.../4_tabla_kardex.jpg` |
| 5 | Pantalla más débil | `/bodega` | `views/produccion/picadura.ejs` | `.../5_bodega_pantalla_debil.jpg` |

Criterio para la pantalla más débil: `/bodega` concentra **1361 atributos `style=`**, 23 controles sin etiqueta asociada, 4 modales sin `role="dialog"` y 8 tarjetas KPI de igual peso visual.

## 2. Métricas medidas por pantalla

| Métrica | /analitica | /empleados | /despacho | /movimientos | /bodega |
|---|---:|---:|---:|---:|---:|
| Atributos `style=` inline | 31 | 112 | 152 | 186 | **1361** |
| Controles de formulario | 2 | 3 | 14 | 13 | 23 |
| Controles **sin** `<label>`/aria asociado | 2 | 3 | 14 | 11 | 23 |
| Controles con `placeholder` | 0 | 3 | 10 | 8 | 11 |
| Controles `required` | – | – | 3 | – | – |
| Elementos `aria-*` / `role` | 0 | 0 | 0 | 13 | 0 |
| Tablas / `th[scope]` | 0 / – | 1 / 0 | – | 1 / 0 | – |
| Buscador / paginación propios | – | no / no | – | DataTables (CDN) | – |
| `alert()` nativos | – | – | 3 | – | 0 |
| `confirm()` nativos en acción destructiva | – | sí | – | – | 0 |
| Modales / con `role=dialog` | – | – | – | – | 4 / 0 |
| Skip link | no | – | – | – | – |

Global (`public/css/theme.css`): 226 líneas, 56 variables, **1 sola** regla `:focus-visible`, **2** `@media` en total, 1 bloque `prefers-reduced-motion`.

## 3. Matriz de hallazgos (21)

| # | Pantalla | Hallazgo | Impacto | Prioridad | Acción / corrección |
|---|---|---|---|---|---|
| 1 | /bodega | 1361 estilos inline; el tema no se puede cambiar ni mantener | Alto: inconsistencia visual y deuda técnica | Alta | Migrar a clases del sistema de diseño (Fase 3) |
| 2 | Todas | Los inputs usan `placeholder` como única etiqueta (53 de 55 controles medidos no tienen label asociado) | Alto: al escribir se pierde el contexto; lectores de pantalla no los nombran | Alta | `<label for>` visible en todos los campos (Fase 4) |
| 3 | /despacho | 14 de 14 controles sin etiqueta asociada; solo 3 con `required` | Alto: formulario crítico propenso a errores | Alta | Labels, `required`, validación por campo |
| 4 | /despacho | 3 `alert()` nativos como retroalimentación | Medio: bloquea la pantalla, sin estilo ni contexto | Alta | Toasts/mensajes inline con estados éxito/error |
| 5 | /empleados | Eliminar empleado usa `confirm()` nativo, botón rojo pequeño y sin deshacer | Alto: acción destructiva poco protegida | Alta | Modal de confirmación accesible con nombre del empleado |
| 6 | /empleados | Lista sin buscador, orden ni paginación; `th` sin `scope` | Alto con muchos trabajadores | Alta | Buscar, ordenar, paginar (Fase 4) |
| 7 | /empleados (móvil) | La tabla se corta: la columna Herramienta queda fuera de pantalla y el formulario aprieta los inputs ("Non", "Cédu") | Alto en planta con celular | Alta | Vista de tarjetas en móvil; formulario en una columna |
| 8 | /movimientos | Tres formularios (ingreso, salida, venta) compiten arriba; en móvil la tabla queda lejos | Medio: jerarquía confusa | Media | Pestañas o acordeón por tipo de movimiento |
| 9 | /movimientos y /analitica | Scripts de terceros por CDN: jQuery 3.7 + DataTables (Kardex) y `chart.js` **sin versión fijada** (Analítica); 0 atributos `integrity` en todas las vistas | Medio: rendimiento y riesgo de cadena de suministro (verificado con búsqueda en `views/`) | Media | Fijar versión + SRI o reemplazar por componente propio |
| 10 | /movimientos | 11 de 13 controles sin label; 186 estilos inline; `th` sin `scope` | Medio | Media | Etiquetar y normalizar estilos |
| 11 | /bodega | 8 tarjetas KPI de igual peso: "303 sacos" pesa lo mismo que "0 sobrantes" | Alto: no se entiende qué importa primero | Alta | Jerarquía por niveles (ver `02_jerarquia_visual.md`) |
| 12 | /bodega (tableta/móvil) | Cada KPI de un número ocupa una fila completa: se desperdicia el alto de la pantalla | Medio | Media | Grid auto-fit de 2–4 columnas |
| 13 | /bodega | 4 modales sin `role="dialog"`/`aria-modal`; el código de `picadura.ejs` no tiene `.focus()` ni cierre con Escape (verificado por búsqueda en el archivo) | Alto para teclado y lectores | Alta | Un solo componente modal accesible |
| 14 | /analitica | El dato clave (Balance neto, hoy negativo) queda debajo de la gráfica | Alto: nivel 1 de jerarquía bajo el pliegue | Alta | KPIs resumen arriba; gráfica debajo |
| 15 | /analitica | Gráfica de barras con una categoría dominante (≈60 000 vs ≈0): las otras no se leen | Medio | Media | Escala/etiquetas de valor y orden por magnitud |
| 16 | /analitica | 2 selects sin label; 0 atributos ARIA; la gráfica no tiene alternativa textual | Medio | Media | Labels y descripción de la gráfica |
| 17 | Navegación | Emojis como iconos del menú; "Recepción" aparece en 3 módulos y "Asignar" en 3 con nombres distintos | Medio: ambigüedad y render inconsistente por sistema | Media | Rediseño de arquitectura (Fase 2) |
| 18 | Global | Estilos de foco mínimos (2 coincidencias de `:focus` en `theme.css` y `header.ejs`), solo 3 `@media` en todo el sistema (2 en `theme.css`, 1 en `header.ejs`; 0 en las 5 vistas base), **0 skip links en todas las vistas**, 0 ARIA en 4 de 5 pantallas | Alto: teclado y adaptabilidad deficientes | Alta | Foco global, breakpoints, skip link (Fases 3–4) |
| 19 | /analitica (estado original) | La gráfica del dashboard **no se dibuja**: `JSON.parse` falla en consola (`Expected property name or '}' in JSON`) porque `analitica.ejs:67` inyectaba el JSON con `<%-` (sin escapar) dentro del atributo `data-raw="..."`, cuyas comillas dobles cortaban el atributo | Alto: el dashboard principal queda sin su visualización clave y sin aviso al usuario | Alta | Escapar con `<%=` (corregido en `de97435`); mejor aún, pasar los datos en un `<script type="application/json">` y mostrar un estado de error si falla |
| 20 | /cierre_diario (todos los roles) | "Mi Cierre de Producción" **devuelve 500 para todos**: la ruta renderiza la vista sin datos (`ganancia_semana is not defined`) y además exige rol admin, aunque es la pantalla de inicio de anilladores y empacadores tras el login; estos rebotan al login sin ningún mensaje | Alto: dos roles no pueden usar el sistema y el trabajador no ve su pago | Alta | Restaurar la consulta original filtrada por el usuario de la sesión, permitir solo roles operativos y mostrar estado de error si falla (corregido en commit aparte) |
| 21 | Global (30 vistas) | Los manejadores `onclick`, `onchange`, `oninput` y `onsubmit` en línea (98 en total) **no se ejecutan**: `helmet` aplica por defecto `script-src-attr 'none'` y `server.js` no lo sobrescribe. Medido: el botón de modo oscuro no hace nada y la consola reporta la violación del CSP. 7 confirmaciones críticas (borrar empleado, usuario o máquina; archivar nómina; entrega de efectivo; validar y facturar; liquidar) dependen de ellos y quedarían sin pedir confirmación | Alto: acciones destructivas o de pago sin confirmar; menú móvil, modales y filtros inoperantes | Alta | Opción rápida: permitir `scriptSrcAttr: ["'unsafe-inline'"]` (coherente con `scriptSrc`, que ya lo permite). Mejor: migrar los 98 manejadores a `addEventListener` y botones/modales accesibles (Fase 4). **Aplicada la opción rápida** en un commit aparte (verificado: la cabecera pasó a `script-src-attr 'unsafe-inline'` y el botón de modo oscuro responde; `object-src`, `frame-ancestors` y `form-action` siguen restringidos). Queda pendiente la migración a `addEventListener` para volver a `'none'` |

Sobre las capturas "antes" de `/analitica`: en el commit original `a24fbc5` el recuadro de la gráfica aparece **vacío incluso tras esperar 5 s**. No es un problema de captura sino el hallazgo 19: un error real de la aplicación original. La captura se conserva tal cual como evidencia. El hallazgo 15 (escala de la gráfica) se observó en la versión actual, donde la gráfica ya se dibuja.

Pendiente de medir con herramienta (no afirmado aún): contraste de textos secundarios (subtítulos grises sobre fondo crema) y tiempos de carga; se medirá con Lighthouse en la Fase 4.

Evidencia del hallazgo 19: capturas `capturas/antes/*/1_dashboard_analitica.jpg` (recuadro vacío) y error de consola en `a24fbc5`, línea 410 de la página renderizada. Diferencia verificada con `git show a24fbc5:views/admin/analitica.ejs` frente a la versión actual.

## 4. Prioridad resumida
- **Alta (14):** 1, 2, 3, 4, 5, 6, 7, 11, 13, 14, 18, 19, 20, 21
- **Media (7):** 8, 9, 10, 12, 15, 16, 17

Total: 21 hallazgos (requisito: mínimo 15). Prioridad Baja: ninguno por ahora; se añadirán los menores que aparezcan al implementar.
