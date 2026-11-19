# Fase 5 · Uso crítico de la IA como copiloto

> **Alcance y honestidad del registro.** Las 5 fichas documentan interacciones **reales** de este trabajo con la herramienta *Claude Code* (modelo Claude Sonnet 5.5, en la aplicación de escritorio de Claude), no ejemplos construidos para el informe. Los prompts del equipo se citan textualmente; las respuestas se resumen y cada una apunta a la evidencia verificable (commit, archivo o captura). En «Modificaciones manuales» se anota **quién** decidió o cambió qué: durante esta sesión el equipo no editó archivos a mano; sus intervenciones fueron decisiones de alcance, rechazos y aprobaciones, y así se registran. Todas las fichas usan la misma herramienta; el equipo puede añadir las que hizo con otras (p. ej. ChatGPT, Gemini) en el mismo formato.

## 1. Cinco fichas de interacción

### Ficha 1 · Diagnóstico con evidencia medida (Fase 1)

| Campo | Registro |
|---|---|
| **Herramienta** | Claude Code (Claude Sonnet 5.5) con acceso al repositorio, al navegador integrado y al terminal |
| **Prompt (equipo)** | «…lee el md de resumen y requerimientos y haz un plan estructurado para cumplirlos dame el plan con cada paso y aprobarlo antes de ejecutar nada» → aprobación: «1 Rama feature/taller-mejoramiento · 2 sí me sirven · 3 Sí · 4 solo corrige las 4 vistas rotas…». Después: «Las capturas del antes sácalas del commit a24fbc5 ya que las actuales ya llevan un proceso de rediseño» |
| **Respuesta de la IA** | Plan de 9 fases; 15 capturas y una matriz de hallazgos **medidos en el DOM** (estilos inline, controles sin etiqueta, ARIA, `alert()`/`confirm()`), jerarquía visual del dashboard y benchmarking de 5 referentes |
| **Qué se aceptó** | La matriz con cifras reales (p. ej. 1361 estilos inline en Bodega; 53 de 55 controles sin etiqueta), la jerarquía de 5 niveles y el benchmarking con sus límites declarados (ejemplos completos de Mobbin/Refero/Page Flows requieren cuenta) |
| **Qué se rechazó** | (1) La primera toma del «antes» desde la rama actual: el equipo la rechazó por ya incluir rediseño. (2) Una explicación de la propia IA —«la gráfica vacía es un problema de tiempo de carga»— que **la medición refutó**: tras 5 s seguía vacía y la consola mostraba `JSON.parse: Expected property name…` |
| **Modificaciones manuales** | Decisión del equipo de usar `a24fbc5` como línea base. Corrección posterior de la IA tras la petición «Revisar Fase 1»: conteos erróneos (ej. «0–2 de 63 controles» → «53 de 55») y un «2 `@media`» que en realidad eran 3 en todo el sistema |
| **Evidencia** | `01_diagnostico.md` (21 hallazgos); hallazgo 19 con `git show a24fbc5:views/admin/analitica.ejs` (`<%-` sin escapar en `data-raw`); commits `13370ec`, `e5dc0ef`, `04fed20`, `9bd6ff4`; capturas `capturas/antes/` |
| **Aprendizaje** | La IA formula hipótesis rápido; el valor está en **medirlas**. La recaptura pedida por el equipo descubrió un error real de la aplicación original que la primera explicación ocultaba |

### Ficha 2 · Arquitectura de información y navegación (Fase 2)

| Campo | Registro |
|---|---|
| **Herramienta** | Claude Code (Claude Sonnet 5.5) |
| **Prompt (equipo)** | «Sí, Fase 2» y, ante un hallazgo funcional, «Primero /cierre_diario» |
| **Respuesta de la IA** | Mapa actual con 6 páginas huérfanas y duplicidades; mapa mejorado por proceso (24 enlaces, 12 a un clic) generado desde una sola estructura de datos; verificación pidiendo las 24 rutas con sesión real |
| **Qué se aceptó** | El menú por cadena de producción, los grupos como `<button aria-expanded>` y la estructura de datos única por rol |
| **Qué se rechazó** | La **propia propuesta inicial** de la IA de enlazar `/despacho_empaque`: al pedir las 24 rutas devolvió 500 (`ReferenceError: usuarios is not defined`); se cambió a la ruta canónica `/despachos_empaque`. También se descartó borrar rutas duplicadas para no romper marcadores del bot |
| **Modificaciones manuales** | Decisión del equipo de resolver primero `/cierre_diario`; la IA recuperó del historial de git la lógica original perdida en la refactorización (y descubrió que fallaba con 500 para todos los roles, no solo por el permiso) |
| **Evidencia** | `04_arquitectura_informacion.md`; commits `e75b478` (menú), `eb18295` (ruta 500), `8fc2000` (`/cierre_diario`); prueba por rol: sin sesión 302, anillador 200, admin 302 |
| **Aprendizaje** | Una prueba automática de rutas encontró lo que una lectura del código no mostraba. La IA debe poder corregirse a sí misma con evidencia |

### Ficha 3 · Sistema de diseño y contraste (Fase 3)

| Campo | Registro |
|---|---|
| **Herramienta** | Claude Code (Claude Sonnet 5.5) y el verificador de diseño automático de la sesión (*impeccable*) |
| **Prompt (equipo)** | «Sí, Fase 3» |
| **Respuesta de la IA** | `theme.css` v5 con tokens, componentes y guía viva; **cálculo WCAG de cada par de color** antes de fijar valores; migración de 246 colores fijos a tokens con script, fuera de `<script>` |
| **Qué se aceptó** | Tokens `*-text` para texto sobre fondos tintados; `--warning` solo como relleno (2,87:1); la guía `/guia_estilos` con valores leídos del CSS en vivo |
| **Qué se rechazó** | (1) Migrar colores de hojas imprimibles y facturas: la IA lo descartó porque el modo oscuro las rompería. (2) Un conteo propio inconsistente de tokens (81 frente a 83) detectado al revisar y corregido a 73/83 con el mismo criterio para ambas versiones. (3) El verificador marcó dos acentos gruesos de un solo lado (toast y KPI) y se sustituyeron por bordes finos completos |
| **Modificaciones manuales** | Ninguna del equipo en esta fase; la aprobación fue la decisión de ejecutar |
| **Evidencia** | `05_sistema_de_diseno.md`; commits `88564d9`, `f2ebed7`; `capturas/sistema_diseno/` (claro y oscuro) |
| **Aprendizaje** | Pedir a la IA que **calcule** (contrastes, conteos) en vez de afirmar produce cifras verificables, y los verificadores automáticos detectan patrones que la propia IA tiende a repetir |

### Ficha 4 · Seguridad: CSP que bloqueaba los botones (hallazgo 21)

| Campo | Registro |
|---|---|
| **Herramienta** | Claude Code (Claude Sonnet 5.5) con navegador integrado |
| **Prompt (equipo)** | «Sí, corregir CSP» (respuesta a una propuesta con dos opciones) |
| **Respuesta de la IA** | Descubrió al probar que el botón de modo oscuro no hacía nada (`script-src-attr 'none'` por defecto de `helmet`), que afectaba a 98 manejadores en 30 vistas y que 7 confirmaciones de borrado/pago quedaban sin ejecutarse. Ofreció una opción rápida y otra de fondo |
| **Qué se aceptó** | La opción rápida (`scriptSrcAttr: ["'unsafe-inline'"]`, coherente con `scriptSrc`), verificada con un clic real y con la cabecera |
| **Qué se rechazó** | Migrar los 98 manejadores en esa fase (aplazado y registrado como deuda); y **no** probar el borrado pulsando el botón para no destruir datos reales |
| **Modificaciones manuales** | La decisión de qué opción aplicar fue del equipo. La IA no cambió la configuración de seguridad hasta recibir esa aprobación |
| **Evidencia** | Hallazgo 21; commit `296db75`; consola del navegador antes (violación del CSP) y después (cabecera `script-src-attr 'unsafe-inline'`) |
| **Aprendizaje** | Un cambio de seguridad debe consultarse aunque la IA tenga razón; y conviene separar «lo probé» de «lo deduje del código» (aquí, las confirmaciones solo se dedujeron) |

### Ficha 5 · Auditoría de accesibilidad con herramienta propia (Fase 4)

| Campo | Registro |
|---|---|
| **Herramienta** | Claude Code (Claude Sonnet 5.5) |
| **Prompt (equipo)** | «Sí, Fase 4» |
| **Respuesta de la IA** | Intentó medir accesibilidad cargando *axe-core* desde un CDN dentro de la sesión autenticada; el control de permisos de la herramienta **lo bloqueó**. Propuso y escribió una auditoría propia sin librerías externas: etiquetas, nombres accesibles, encabezados, ids duplicados, tablas y **contraste real de cada texto** |
| **Qué se aceptó** | Respetar el bloqueo (no se rodeó) y usar la auditoría propia como instrumento, con sus límites declarados en el informe |
| **Qué se rechazó** | Un falso positivo de la propia herramienta (1,1:1 en un banner con fondo degradado), que se pasó a «indeterminado»; un cálculo de contraste de botones sin clase (negro sobre cobre); y dos fallos del código de la IA detectados al probar: la tabla perdía filas al agregar (48 → 11) y los componentes ignoraban el atributo `hidden` |
| **Modificaciones manuales** | Ninguna del equipo; la auditoría y las correcciones las hizo la IA y se verificaron en el navegador |
| **Evidencia** | `herramientas/auditoria_a11y.js`; `06_fase4_mejoras.md` (antes → después: Kardex 21 → 0 textos bajo el contraste mínimo, Bodega 10 → 0 ids duplicados); commits `27aaf74`, `591013e`, `f7b5416` |
| **Aprendizaje** | Una herramienta bloqueada no es un obstáculo a evadir sino un dato: se buscó una alternativa más modesta y se documentó qué cubre y qué no. Los errores de la IA aparecieron **porque se probó cada cambio** |

## 2. Qué decidió el equipo frente a lo que propuso la IA

| Momento | Propuesta de la IA | Decisión del equipo |
|---|---|---|
| Inicio | Plan de 9 fases, pidió aprobación antes de ejecutar | Aprobó con 4 decisiones (rama, pantallas, identidad cobre, alcance de las vistas rotas) |
| Fase 1 | Capturas «antes» desde la rama actual | Exigió el commit original `a24fbc5` |
| Entrega | Informe en Markdown | Exigió **PDF** |
| Fase 2 | Corregir `/cierre_diario` (cambio de permisos) | «Primero /cierre_diario» |
| Fase 3 | Corregir el CSP (opción rápida o de fondo) | «Sí, corregir CSP» (opción rápida) |
| Fase 4 | Probar altas reales con un empleado de prueba | No lo aprobó todavía: sigue pendiente, declarado como límite |
| Fase 5 | Ejecutar el experimento de prompts con Gemini (clave del `.env`), con dos subagentes de Claude o delegando en el equipo | Eligió **dos subagentes de Claude**: no sale nada a servicios externos ni usa claves del proyecto |

## 3. Comparación: prompt débil frente a prompt estructurado

### 3.1 Diseño del experimento
- **Tarea (idéntica):** mejorar el formulario de alta de empleados tal como estaba en el commit original `a24fbc5` (3 campos y un botón, estilos en línea, sin etiquetas asociadas).
- **Dos ejecuciones independientes:** cada prompt se envió a un agente nuevo, sin el contexto de esta conversación ni de este proyecto. A ambos se les añadió la misma línea de control: *«responde solo con texto; no leas archivos ni uses herramientas»*, para que el agente estructurado no pudiera copiar la solución ya implementada en el repositorio.
- **Archivos:** `ia/prompt_debil.txt`, `ia/prompt_estructurado.txt`, respuestas íntegras sin editar en `ia/salida_debil.md` y `ia/salida_estructurado.md`, script de evaluación `ia/evaluar_salidas.js` y su resultado `ia/resultado_evaluacion.json` (se puede repetir con `node documentacion/taller/ia/evaluar_salidas.js`).

**Prompt débil** (1 071 caracteres: la instrucción más el código del formulario):
````
Mejora este formulario:

(código HTML del formulario original)
````

**Prompt estructurado** (3 512 caracteres). Secciones, en este orden: **Rol** (diseñador-desarrollador senior en accesibilidad e interfaces industriales), **Contexto** (ERP de una fábrica de tabacos, Node/Express/EJS, usuarios en escritorio y celular, y la lista exacta de variables y clases del sistema de diseño que debe reutilizar), **Tarea**, **Restricciones obligatorias** (no cambiar `name` ni la ruta POST, sin librerías nuevas, español de Colombia, sin placeholder como etiqueta y las reglas de negocio de cada campo), **Criterios de aceptación** (los 5 estados, mensajes específicos, ARIA, objetivos de 44 px, responsive), **Formato de salida** (problemas detectados, código final en un bloque, checklist de 6 verificaciones) y el formulario actual. Texto completo en `ia/prompt_estructurado.txt`.

### 3.2 Resultados medidos (chequeos automáticos sobre el código entregado)

| Criterio | Prompt débil | Prompt estructurado |
|---|---|---|
| Conserva `name` y `action` | Sí | Sí |
| Etiquetas con `for` válido | 3 de 3 | 3 de 3 |
| Campos con `aria-describedby` | 2 de 3 | 3 de 3 |
| `aria-invalid` dinámico | No | Sí |
| Regiones `role="alert"`/`aria-live` | 0 | 5 |
| Mensajes de error específicos en el código | **0** (solo burbujas nativas del navegador) | **16** |
| Foco al primer campo inválido | No | Sí |
| Estados del campo cubiertos (de 5) | 2: foco y error (solo CSS) | **5**: normal, foco, error, deshabilitado, éxito |
| Objetivo táctil de 44 px | No | Sí |
| Colores fijos (`#hex`) en el CSS | **6** | **0** |
| Usos de variables del sistema de diseño | **0** | **32** |
| Clases del sistema de diseño reutilizadas (de 5) | **0** | **5** |
| Se adapta a una columna en móvil | Sí | Sí |
| Dependencias nuevas | Ninguna | Ninguna |
| Tiempo y consumo del agente | 19,7 s · ≈ 61 mil tokens | 41,4 s · ≈ 66 mil tokens |

### 3.3 ¿Aplican las mismas reglas que el servidor real?
Se probaron **38 casos** hechos a mano (14 códigos, 10 nombres, 14 documentos) contra la función real `validarEmpleado` de `src/routes/admin.js`. Para el prompt débil se evaluaron los atributos HTML que propuso (`pattern`, `minlength`, `maxlength`); para el estructurado, sus funciones de validación en JavaScript.

| | Casos en que coincide con el servidor | Diferencias |
|---|---|---|
| Prompt débil | **25 de 38 (65,8 %)** | 13: **acepta** códigos que el servidor rechaza (`ABCD1`, `F-1`, `1F`, `F12345`, `AB`), nombres con números o guion bajo (`Ana3`, `Carlos_Ruiz`) y un nombre de solo espacios; **rechaza** datos válidos (`88193514` sin prefijo, `12.345.678`, `cc-88193514`, `F01 ` con espacio final) |
| Prompt estructurado | **34 de 38 (89,5 %)** | 4, todas en el documento: `CC1020304050` (sin guion), `12.345.678` (con puntos), `CE-12345678` y `V-12 345 678` |

Las 4 diferencias del estructurado **se explican por el propio prompt**: la regla que se le dio decía «prefijo opcional (CC-, V-, E-)» y no mencionaba los puntos ni espacios que el servidor sí tolera (los documentos reales se guardan como `CC-88.193.514`). La IA aplicó fielmente una especificación incompleta. El débil, en cambio, **inventó** reglas (`[A-Za-z0-9\-]{2,10}`) que nadie le pidió.

### 3.4 Rúbrica (0 = no cumple, 1 = parcial, 2 = cumple)

| # | Criterio | Débil | Estructurado | Evidencia |
|---|---|:-:|:-:|---|
| 1 | Respeta `name` y `action` | 2 | 2 | chequeo estructural |
| 2 | Etiquetas visibles asociadas | 2 | 2 | 3/3 en ambos |
| 3 | Cinco estados del campo | 1 | 2 | 2/5 frente a 5/5 |
| 4 | Mensajes de error específicos | 0 | 2 | 0 frente a 16 |
| 5 | ARIA (`describedby`, `invalid`, regiones) | 1 | 2 | 2/3 y sin `invalid`, frente a 3/3 |
| 6 | Foco al primer campo inválido | 0 | 2 | revisión del JS |
| 7 | Fidelidad a las reglas del servidor (0: < 70 %, 1: 70–90 %, 2: ≥ 90 %) | 0 | 1 | 65,8 % frente a 89,5 % |
| 8 | Objetivos táctiles de 44 px | 0 | 2 | `min-height: 44px` |
| 9 | Uso del sistema de diseño | 0 | 1 | 0/5 y 6 hex, frente a 5/5 y 32 tokens; definió clases propias de composición (`.form-grid`, `.form-acciones`) aunque se le pidió no inventar más |
| 10 | Pasos de verificación comprobables | 0 | 2 | sin checklist frente a 6 comprobaciones |
| | **Total** | **6 / 20** | **18 / 20** | |

### 3.5 Análisis
1. **Lo que cambia es la información, no la inteligencia.** El débil dio consejos razonables y genéricos (validar también en el servidor, añadir CSRF, avisar con `aria-live`), pero no podía conocer las reglas de negocio ni el sistema de diseño: eligió colores y patrones propios. Justo lo que la Fase 3 había eliminado volvería a entrar (6 colores fijos, 0 tokens).
2. **El prompt estructurado trasladó el costo de corrección del humano a la especificación.** Con el débil habría que reescribir validaciones, colores y estados; con el estructurado, el esfuerzo fue redactar bien el prompt, y su único desvío de comportamiento (documentos con puntos) nació de una omisión nuestra.
3. **Una buena respuesta también tiene faltas.** El agente estructurado afirmó «no conozco con certeza la firma de `UI.form`» aunque el prompt la incluía, y definió clases nuevas pese a la restricción; las cifras anteriores lo reflejan (criterio 9 en 1, no en 2).
4. **El débil se equivocó en la dirección peligrosa:** aceptar datos que el servidor rechazará (el usuario vería un error tardío) y bloquear datos válidos en el navegador (el trabajador no podría registrar a alguien con un documento tal como figura en su cédula).

### 3.6 Qué se tomó y qué se descartó
- **Se tomó como contraste** de la propia implementación de la Fase 4 (que se hizo con más contexto y usa el `UI.form` real): ambas llegan a los mismos 5 estados, y la respuesta estructurada aporta ideas aprovechables —mensajes que dependen del caso («tiene 4 números; debe tener al menos 5»)— que quedan como mejora opcional.
- **Se descartó** copiar código de cualquiera de las dos respuestas al proyecto: ninguna estaba integrada con `UI.form`, el JSON del servidor ni los estilos reales. No se modificó ningún archivo de la aplicación a partir de este experimento.

### 3.7 Límites del experimento
- **Una sola ejecución por prompt** y un solo modelo: sirve para ilustrar, no para generalizar. Otra ejecución podría variar.
- **38 casos escritos a mano**, no una muestra estadística; el porcentaje de coincidencia es descriptivo.
- **Sesgo de evaluación:** quien diseñó los prompts, el script y la rúbrica es de la misma familia de modelos, y varios criterios (8 y 10) salen de los criterios de aceptación que solo el prompt estructurado contenía. La rúbrica mide si la respuesta sirve al proyecto, no si siguió instrucciones que el débil nunca recibió. Se mitigó con chequeos automáticos reproducibles y publicando las salidas completas.
- **El HTML y el CSS entregados no se renderizaron** en el navegador: solo se ejecutó su lógica de validación y se inspeccionó su estructura.

## 4. Guía de prompt profesional (plantilla usada)

| Bloque | Qué debe contener | Ejemplo de este experimento |
|---|---|---|
| **Rol** | Quién es y su especialidad | «Diseñador-desarrollador senior, accesibilidad WCAG 2.1 AA» |
| **Contexto** | Producto, usuarios, tecnología y **lo que ya existe y debe reutilizarse** | Lista de variables y clases; helper `UI.form` |
| **Tarea** | Una sola, concreta | «Rediseñar el formulario de alta de empleados» |
| **Restricciones** | Lo que no puede cambiar y las **reglas de negocio completas** | `name`, ruta POST, formato de código/nombre/documento *(faltaron los puntos del documento)* |
| **Criterios de aceptación** | Cómo sabremos que está bien | 5 estados, mensajes específicos, 44 px |
| **Formato de salida** | Estructura de la respuesta | Problemas, código, checklist |
| **Material** | El código o dato de entrada | El formulario original |

Regla práctica aprendida: **la respuesta no puede ser más precisa que la especificación**. Antes de enviar un prompt, comprobar que las reglas de negocio estén completas, p. ej. contrastándolas con el código del servidor, como hizo `evaluar_salidas.js` después.
