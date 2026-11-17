# Fase 1 · Diagnóstico — Gato Negro ERP

Fecha de medición: 2026-11-17 · Servidor local `localhost:3001` · Rama `feature/taller-mejoramiento`
Método: inspección en navegador (escritorio 1366 px, tableta 768 px, móvil 375 px) y conteo programático en el DOM de cada pantalla.

> Nota de honestidad: las capturas "antes" corresponden al código actual de `main`, que ya incluye el rediseño artesanal parcial (tokens cobre, landing, loader). Es la línea base **de este taller**. Las cifras de la columna Evidencia son medidas reales, no estimaciones.

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

## 3. Matriz de hallazgos (18)

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
| 9 | /movimientos | La tabla depende de jQuery 3.7 + DataTables por CDN, sin SRI | Medio: rendimiento y riesgo de cadena de suministro | Media | Fijar integridad (SRI) o reemplazar por componente propio |
| 10 | /movimientos | 11 de 13 controles sin label; 186 estilos inline; `th` sin `scope` | Medio | Media | Etiquetar y normalizar estilos |
| 11 | /bodega | 8 tarjetas KPI de igual peso: "303 sacos" pesa lo mismo que "0 sobrantes" | Alto: no se entiende qué importa primero | Alta | Jerarquía por niveles (ver `02_jerarquia_visual.md`) |
| 12 | /bodega (tableta/móvil) | Cada KPI de un número ocupa una fila completa: se desperdicia el alto de la pantalla | Medio | Media | Grid auto-fit de 2–4 columnas |
| 13 | /bodega | 4 modales sin `role="dialog"`/`aria-modal`; sin gestión de foco | Alto para teclado y lectores | Alta | Un solo componente modal accesible |
| 14 | /analitica | El dato clave (Balance neto, hoy negativo) queda debajo de la gráfica | Alto: nivel 1 de jerarquía bajo el pliegue | Alta | KPIs resumen arriba; gráfica debajo |
| 15 | /analitica | Gráfica de barras con una categoría dominante (≈60 000 vs ≈0): las otras no se leen | Medio | Media | Escala/etiquetas de valor y orden por magnitud |
| 16 | /analitica | 2 selects sin label; 0 atributos ARIA; la gráfica no tiene alternativa textual | Medio | Media | Labels y descripción de la gráfica |
| 17 | Navegación | Emojis como iconos del menú; "Recepción" aparece en 3 módulos y "Asignar" en 3 con nombres distintos | Medio: ambigüedad y render inconsistente por sistema | Media | Rediseño de arquitectura (Fase 2) |
| 18 | Global | Solo 1 regla `:focus-visible`, 2 `@media`, sin skip link, 0 ARIA en 4 de 5 pantallas | Alto: teclado y adaptabilidad deficientes | Alta | Foco global, breakpoints, skip link (Fases 3–4) |

Pendiente de medir con herramienta (no afirmado aún): contraste de textos secundarios (subtítulos grises sobre fondo crema) y tiempos de carga; se medirá con Lighthouse en la Fase 4.

## 4. Prioridad resumida
- **Alta (11):** 1, 2, 3, 4, 5, 6, 7, 11, 13, 14, 18
- **Media (7):** 8, 9, 10, 12, 15, 16, 17

Total: 18 hallazgos (requisito: mínimo 15). Prioridad Baja: ninguno por ahora; se añadirán los menores que aparezcan al implementar.
