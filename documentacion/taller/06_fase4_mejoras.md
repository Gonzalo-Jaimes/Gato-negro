# Fase 4 · Mejorar: formularios, tablas, estados, responsive, accesibilidad y microinteracciones

Todo lo descrito está implementado en código y verificado en el navegador con la sesión de administrador (servidor local, base de datos real en modo lectura; ver «Qué no se probó»). Las cifras salen de mediciones propias, no de estimaciones.

**Módulos intervenidos:** *Empleados* (formulario + lista) y *Kardex* (3 formularios + tabla de 254 movimientos) como módulos de referencia, más el *Dashboard*, *Despacho* y *Bodega* (las otras pantallas base). El kit común vive en `public/js/ui.js` (454 líneas, sin dependencias) y `public/css/theme.css`.

## 1. Formularios

### 1.1 Cinco estados obligatorios
Componente `.field` + `.input` (ver `05_sistema_de_diseno.md` y `/guia_estilos`). Evidencia en Empleados: `capturas/estados_empleados/`.

| Estado | Cómo se ve y cuándo ocurre | Evidencia |
|---|---|---|
| **Normal** | Etiqueta visible, ejemplo en el *placeholder* y ayuda debajo («Letras y números») | `1_normal.jpg` |
| **Foco** | Anillo de 3 px (`--focus-ring`), no solo cambio de color de borde | `/guia_estilos`, sección 7 |
| **Error** | Borde y fondo de peligro, mensaje específico bajo el campo, `aria-invalid="true"`, `aria-describedby` y aviso general con `role="alert"`; el foco va al primer campo inválido | `2_formulario_error.jpg` |
| **Deshabilitado** | Fondo hundido y cursor `not-allowed`; p. ej. «Material» hasta elegir categoría en el Kardex; el botón mientras envía | Kardex |
| **Éxito** | Borde verde + mensaje («Documento válido») y, al guardar, un aviso «Se registró a …» | `4_exito.jpg` |
| **Enviando** (extra) | Botón con *spinner* y `aria-busy`, deshabilitado para evitar doble envío | `3_formulario_enviando.jpg` |

### 1.2 Validaciones sin mensajes genéricos
Cada regla dice **qué pasó y cómo arreglarlo**. Las mismas reglas están en el navegador y en el servidor (el servidor es el que cuenta y responde 422 con un mensaje por campo).

| Campo | Mensaje (ejemplos reales de la aplicación) |
|---|---|
| Código de trabajador vacío | «Escribe el código del trabajador (ejemplo: F01).» |
| Código con formato inválido | «El código lleva letras y luego números, sin espacios (ejemplo: F01 o AN12).» |
| Código repetido (solo servidor) | «Ya existe un trabajador con el código F01. Usa otro código.» |
| Nombre corto | «El nombre es muy corto: escribe al menos 3 letras.» |
| Documento | «El documento debe tener entre 5 y 12 números, con prefijo opcional (CC-, V-, E-).» |
| Retiro de material | «Solo hay 1000 disponibles de Anillos; escribe 1000 o menos.» |
| Venta | «Escribe cuánto dinero ingresó, en pesos (ejemplo: 150000).» |
| Despacho | «Escribe cuántos tabacos vas a asignar: debe ser un número mayor que cero.» |

Verificado: enviar vacío muestra 3 errores y el aviso «Revisa los 3 campos marcados», el foco queda en el primero y el aviso desaparece cuando se corrigen todos.

### 1.3 Sin placeholder como etiqueta
Las 5 pantallas base ahora tienen `<label for>` visible en cada control; el *placeholder* solo da un ejemplo. Medido con la auditoría propia (`herramientas/auditoria_a11y.js`): **controles sin etiqueta → 0** en Empleados, Kardex, Dashboard, Despacho (0 de 8) y Bodega (0 de 13); controles con solo *placeholder*: 7 → 0 en Despacho.

## 2. Tablas y listados

### 2.1 Clasificación de la información
Atributo `data-col` en cada columna; el componente lo usa para decidir qué mostrar en cada tamaño.

| Tabla | Esencial (siempre visible) | Secundaria (se oculta en pantallas < 768 px) | Bajo demanda (botón «Ver detalle») |
|---|---|---|---|
| Empleados | Código, nombre, acciones | Documento | — |
| Kardex | Fecha y hora, movimiento (con signo y color), material | Registrado por | Detalle del movimiento |

En móvil (< 640 px) cada fila pasa a **tarjeta** con etiqueta por dato (`data-label`), conservando las acciones.

### 2.2 Funciones implementadas (componente `UI.tabla`)
| Función | Comportamiento comprobado |
|---|---|
| **Búsqueda** | Ignora tildes, mayúsculas y puntuación: «88193514» encuentra «CC-88.193.514»; «áLcIdEs» encuentra «ALCIDES». Anuncia el resultado en una región `aria-live` |
| **Filtros** | Kardex: Todos / Entradas / Salidas (117 + 137 = 254). Se combina con la búsqueda (33 salidas de «capa») |
| **Orden** | Clic o Enter/Espacio en el encabezado; `aria-sort`; texto con `localeCompare('es')` y numérico real (el Kardex ordena −12000 … 30000 por valor con signo, no por texto) |
| **Paginación** | 10/25/50 (Empleados) y 25/50/100 (Kardex); «Mostrando 1–25 de 254 (filtrado de 254)» |
| **Adaptativa** | Columnas por prioridad y tarjetas en móvil (sección 4) |

Se **eliminó** la dependencia de jQuery 3.7 + DataTables (CDN sin SRI) del Kardex; además su archivo de idioma estaba bloqueado por el CSP y la tabla salía en inglés («Show 25 entries / Search:»). Referencias a jQuery/DataTables por CDN en las vistas: 5 → 1 (queda `mantenimiento.ejs`, que usa select2); `chart.js` ahora tiene versión fijada (4.4.1).

## 3. Diseño de todos los estados (7) en dos módulos

| Estado | Empleados | Kardex |
|---|---|---|
| **Normal** | Lista paginada de 48 trabajadores, `1_normal.jpg` | 254 movimientos con filtro, `1_normal_con_filtro.jpg` |
| **Cargando** | *Skeleton* de 5 filas, botón «Actualizar» en carga, `aria-busy`; `5_cargando.jpg` | *Skeleton* de 6 filas; `2_cargando.jpg` |
| **Vacío** | «Aún no hay trabajadores registrados» + botón «Registrar el primero» que enfoca el formulario; `6_vacio.jpg` | «Aún no hay movimientos» (texto configurado; **no se simuló** porque no se vació la tabla real) |
| **Error** | Bloque con `role="alert"`, causa en lenguaje claro y **Reintentar**; `8_error.jpg` | Igual; `4_error.jpg` |
| **Éxito** | Aviso «Se registró a PRUEBA TALLER (ZZ9)», fila resaltada 2 s y contador 48 → 49 (respuesta simulada); `4_exito.jpg` | Recarga correcta: «Mostrando 1–25 de 254» (los formularios del Kardex envían de forma clásica y recargan la página; no tienen aviso de éxito propio) |
| **Sin permisos** | Respuesta 403 → bloque «No tienes permiso para ver esto»; `9_sin_permisos.jpg`. Además una **página 403** completa para quien entra por URL a una sección de administración | `5_sin_permisos.jpg` |
| **Sin resultados** | «Sin resultados para «zzzz»» + «Limpiar búsqueda» (devuelve el foco al buscador); `7_sin_resultados.jpg` | «Sin resultados…» + «Quitar búsqueda y filtros»; `3_sin_resultados.jpg` |

El **Dashboard** suma dos estados propios: *vacío* («Sin datos para mostrar» + enlace al Kardex) y *error* («No se pudieron leer los datos de la gráfica» + Recargar). Antes el error del hallazgo 19 dejaba el recuadro vacío sin explicación.

**Cambios de servidor que lo hacen posible** (compatibles hacia atrás, sin JavaScript sigue funcionando la redirección clásica):
- `GET /api/empleados`; `POST /agregar_empleado` y `/eliminar_empleado/:id` responden JSON (`201/200`, `422` con `campos`, `500`) cuando la petición lo pide.
- `isAdmin`/`isAuth`: sesión válida sin permiso → **403** (página o JSON) en vez del rebote mudo al login; sin sesión → 302 (HTML) o 401 (JSON). Probado por rol con un arnés: sin sesión 302/401; anillador 403 con página explicativa; admin 200.

## 4. Responsive

Breakpoints: ≤ 1024 px (menú lateral como panel, ya existía), ≤ 900/560 px (formularios de 4 → 2 → 1 columna), < 768 px (se oculta lo secundario y los botones suben a 44 px), ≤ 640 px (tablas en tarjetas), ≤ 420 px (filas de campos a una columna). `h1` fluido con `clamp()` (3 líneas en móvil eran demasiado).

Evidencia en `capturas/responsive/` (dashboard y empleados en los 3 tamaños). Verificación programática: `scrollWidth ≤ innerWidth` en **todas** las combinaciones probadas (sin desborde horizontal) en 1366, 768 y 375 px.

| Pantalla | Escritorio | Tableta (768) | Móvil (375) | Justificación |
|---|---|---|---|---|
| Dashboard | Balance neto a ancho completo y 3 KPI en fila; controles junto al título de la gráfica | 3 KPI en fila, controles en 2 columnas, gráfica de barras horizontales | KPI apilados con el balance primero; barras horizontales (las etiquetas largas caben) | Lo primero que debe entenderse (balance) queda sobre el pliegue en los tres tamaños |
| Empleados | Formulario en 4 columnas y tabla | Formulario en 2 columnas; la tabla conserva todas las columnas | Formulario en 1 columna; **tarjetas** por trabajador con acción «Eliminar» de 44 px | En planta se usa el celular: la tabla cortada del diagnóstico (hallazgo 7) deja de existir |

Corrección encontrada al probar: los inputs tenían ancho intrínseco mayor que su columna y desbordaban la página en la fila «Cantidad / Ingreso» del Kardex. Se arregló en el componente (`.field input {width:100%; min-width:0}`) y se midió sin desborde.

## 5. Accesibilidad: 5 mejoras comprobables

Herramienta: `herramientas/auditoria_a11y.js` (auditoría propia sin librerías externas; se intentó cargar *axe-core* desde un CDN dentro de la sesión autenticada y el clasificador de permisos lo bloqueó, por lo que no se usó ni se rodeó). Mide: idioma y título, landmarks y skip link, encabezados, nombres accesibles, etiquetas, ids duplicados, tablas y el **contraste real de cada texto** (WCAG 2.1: 4,5:1; 3:1 en texto grande).

| # | Mejora | Cómo se comprueba | Antes → después (misma herramienta) |
|---|---|---|---|
| 1 | **Etiquetas asociadas y errores accesibles** (`label for`, `aria-invalid`, `aria-describedby`, `role=alert`) | Controles sin etiqueta | Despacho 8/8 → **0**; Bodega 13/13 → **0**; Empleados 3/3 → **0**; Kardex 11/13 → **0**; Dashboard 2/2 → **0** |
| 2 | **Contraste AA** con tokens `*-text`, texto atenuado más oscuro y paleta de gráficas | Textos bajo el mínimo | Kardex 21 → **0** (de 258); Dashboard 3 → **0** (de 79); Despacho 18 → **0** (de 70; 14 sobre fondo degradado quedan *sin evaluar*); Guía 7 → **0** (de 227); Empleados **0** de 110; Bodega 5 → **1** (es un bloque deshabilitado a propósito, exento en WCAG) |
| 3 | **Teclado completo** | Prueba con teclas reales | Skip link «Saltar al contenido»; grupos del menú son `<button aria-expanded>`; encabezados ordenables con Enter/Espacio; **selector de fabriquín de Despacho operable con ↑ ↓ Enter Escape** (antes solo con ratón); diálogo con foco inicial en la opción segura, trampa de Tab, Escape y retorno del foco |
| 4 | **No depender solo del color ni de la imagen** | Revisión + auditoría | Gráfica con `aria-label`, resumen textual («Mayor valor: …, 90 % del total») y **tabla alternativa**; KPI con ▲/▼ y «Superávit/Déficit»; movimientos con signo (+/−) y texto «Entrada/Salida» para lectores; emojis decorativos con `aria-hidden` |
| 5 | **Estructura semántica** | Landmarks, encabezados, ids, tablas | Saltos de nivel de encabezado 1 → **0** (Despacho y Bodega); **ids duplicados 10 → 0** en Bodega (había un modal copiado que nunca se abría); tablas con `<caption>` y `th scope` (Empleados 4/4, Kardex 6/6); regiones `aria-live` para avisos, contadores y estados |

Complementos: objetivos táctiles de **44 px** bajo 768 px (medido: botón «Ver detalle» 44 px, antes 32) y `prefers-reduced-motion` respetado.

## 6. Microinteracciones (5, funcionales y con propósito)

| # | Microinteracción | Propósito | Detalle | Dónde |
|---|---|---|---|---|
| 1 | **Respuesta del botón**: *hover* (fondo + sombra), *active* (escala 0,98) y anillo de foco | Confirmar que el elemento es pulsable y que el clic se registró | 150 ms, `ease-out` | Todos los `.btn` |
| 2 | **Carga visible**: *spinner* en el botón y *skeleton* en tablas | Evitar dobles envíos y mostrar que algo está pasando | `aria-busy`; el botón se deshabilita | Empleados, Kardex, recargas |
| 3 | **Confirmación destructiva** con diálogo propio | Evitar borrar o pagar por error; el foco inicia en «Cancelar» | `role="alertdialog"`, Escape cancela, foco vuelve al botón | Borrar empleado/usuario/máquina, archivar nómina, validar y facturar, liquidar (6 de 7; la de `factura_detalle` es un documento aislado sin el kit y conserva `confirm()` nativo) |
| 4 | **Éxito y error sin bloquear** (*toast*) | Informar el resultado sin interrumpir; reemplaza `alert()` | 4,5 s (8 s en error), cerrable, `role=alert` en errores | Alta/baja de empleados, avisos de Despacho |
| 5 | **Cambio de estado animado** | Mostrar causa y efecto | Fila nueva resaltada 2 s; fila eliminada se desvanece en 200 ms; chevron del menú gira 150 ms; la gráfica se redibuja al cambiar de tema | Tablas, menú, dashboard |

Todas respetan `prefers-reduced-motion`. Sin animación en acciones de teclado ni en las tablas de alta frecuencia (decisión de diseño del proyecto).

## 7. Otros defectos hallados y corregidos al implementar

| Defecto | Evidencia | Corrección |
|---|---|---|
| **10 `id` duplicados** en Bodega (bloque de entrega copiado como modal nunca abierto; `cerrarModalEntrega` ni existía) | Auditoría: 10 ids repetidos | Se eliminó el bloque muerto |
| **CSS inválido** `rgba(var(--text-muted), 0.05)` (los tokens son hexadecimales): el navegador lo ignoraba y el fondo no se pintaba | Búsqueda en `views/` | Sustituido por `--bg-sunken`/`--primary-soft` en 4 vistas |
| Selector de fabriquín **solo con ratón** (lista de `div` con `onclick`) | Revisión del código | `role=combobox/listbox/option` + teclado |
| 3 `alert()` bloqueantes en Despacho | Revisión | Avisos no bloqueantes con foco al campo |
| Botones sin clase con **texto negro sobre cobre** (4,22:1) | Auditoría | Clases `.btn` del sistema |
| `chart.js` sin versión y JSON del dashboard en un atributo HTML | Hallazgo 19 | Versión 4.4.1 fijada; datos en `<script type="application/json">` |
| Fallo propio: al agregar o quitar una fila, el contador bajaba de 48 a 11 (la tabla solo conocía la página visible) | Prueba con filas simuladas | La lista completa vive aparte del `<tbody>` |
| Fallo propio: los componentes con `display:flex` ignoraban el atributo `hidden` (barra de búsqueda visible en el estado de error) | Capturas | Regla global `[hidden]{display:none!important}` |

## 8. Trazabilidad con el diagnóstico

| Hallazgo | Estado tras la Fase 4 |
|---|---|
| 2, 3 (labels, formulario crítico) | **Resuelto** en las 5 pantallas base |
| 4 (`alert()`) | **Resuelto** en Despacho; quedan 3 `alert()` en otras vistas fuera de alcance |
| 5 (borrado sin protección) | **Resuelto**: diálogo accesible |
| 6, 7 (tabla de empleados, móvil) | **Resuelto** |
| 9 (CDN sin SRI) | **Parcial**: se quitó jQuery/DataTables y se fijó la versión de `chart.js`; falta el atributo `integrity` |
| 10 (Kardex labels/estilos) | Labels **resueltas**; los estilos inline bajan 32 → 15 en la vista |
| 11, 12 (Bodega) | **Parcial**: etiquetas, ids, contraste y encabezados resueltos; la jerarquía de los 8 KPI y su disposición móvil no se rediseñaron |
| 13 (modales sin `role=dialog`) | **Parcial**: el diálogo nuevo es accesible; los modales de Bodega/Fabriquines/Equipos conservan su estructura |
| 14, 15, 16 (dashboard) | **Resuelto** (KPI primero, resumen y tabla alternativa, labels) |
| 18 (foco, `@media`, skip link) | **Resuelto** en lo medido: skip link, `@media` 2 → 6 en el tema, anillo de foco global |
| 19, 20, 21 | Resueltos en fases anteriores |

Métricas globales (código fuente de `views/`, del final de la Fase 3 a hoy): ocurrencias de `style="` 1181 → 1107; `aria-*`/`role` 30 → 63; manejadores en línea 98 → 87; `confirm()` nativos 10 → 4; `alert()` nativos 5 → 3.

## 9. Qué no se probó y límites
- **Altas y bajas reales en la base de datos:** no se ejecutaron (es la base real). El flujo de éxito/eliminación se verificó con respuestas simuladas; el servidor se verificó con peticiones inválidas y duplicadas (422) y con la lectura real de 48 empleados y 254 movimientos. La inserción real (`insert().select().single()`) queda sin ejecutar.
- **Lighthouse:** no se ejecutó. Corre en un navegador aparte, sin la sesión de administrador, y no puede auditar estas pantallas autenticadas; por eso se usó la auditoría propia, que es más estrecha (no cubre todo lo que cubre axe/Lighthouse: p. ej. roles ARIA válidos o relaciones entre elementos).
- **Contraste:** 14 textos de Despacho están sobre un fondo con degradado y no se pueden evaluar con este método.
- **Alcance:** solo las 5 pantallas base y la guía se auditaron. Otras 30 vistas siguen con estilos inline y manejadores en línea.
- **Despacho** mantiene su envío clásico (abre la hoja en otra pestaña y redirige); no se convirtió a asíncrono porque su cálculo y su impresión dependen de ese flujo.
