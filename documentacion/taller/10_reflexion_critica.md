# Fase 6 · Reflexión crítica

> Las partes 1 a 4 se basan en evidencia del repositorio y de las mediciones del taller. La parte 5 (aprendizaje del equipo) **no se puede redactar por el equipo**: contiene preguntas guía y un borrador marcado para que ustedes lo reescriban con su experiencia real.

## 1. ¿Cambió de verdad la experiencia? Lo que se sabe y lo que no

**Lo que está demostrado** (mediciones propias, reproducibles):
- El dashboard original **no mostraba su gráfica** por un error de JSON que nadie avisaba; ahora dibuja y explica cuando no hay datos o falla.
- Las 5 pantallas base pasaron de **53 de 55 controles sin etiqueta a 0**; los textos bajo el contraste mínimo quedaron en 0 en Empleados, Dashboard, Kardex y Despacho (antes: 3, 21 y 18 en tres de ellas) y en 1 —un bloque deshabilitado a propósito— en Bodega; un selector que solo funcionaba con ratón ahora se maneja con teclado.
- Se encontraron y corrigieron fallos funcionales que **impedían trabajar**: `/cierre_diario` daba 500 a todos los roles (anilladores y empacadores no podían entrar), `/despacho_empaque` daba 500 y un CSP bloqueaba todos los `onclick` (botón de modo oscuro, menú móvil y las confirmaciones de borrado y pago).
- La lista de empleados pasó de una tabla cortada en móvil a tarjetas con búsqueda, y el Kardex de 254 filas ahora se filtra, ordena y pagina en español.

**Lo que NO está demostrado:** que **las personas** completen mejor sus tareas. Las pruebas con 3 usuarios reales siguen pendientes (`09_pruebas_con_usuarios.md`); todo lo anterior son indicadores técnicos y de accesibilidad, que son necesarios pero no suficientes. Un formulario con etiquetas perfectas puede seguir confundiendo a alguien. Hasta tener esas sesiones, la afirmación honesta es «**eliminamos barreras medibles**», no «mejoramos la usabilidad».

## 2. ¿Qué quedó mal, a medias o es una concesión?

| Asunto | Estado y por qué importa |
|---|---|
| Bodega en móvil | Los 8 indicadores de sacos siguen ocupando una fila cada uno y sin jerarquía (hallazgos 11 y 12 abiertos): es la pantalla que dijimos que era «la más débil» y quedó **parcialmente** resuelta |
| Estilos y manejadores en línea | `style=` en las vistas bajó de 1181 a 1107 (−6 %) y los manejadores en línea de 98 a 87: avance pequeño frente a lo que queda. Se reconstruyeron las pantallas clave, no las ~30 restantes |
| Seguridad | Para que los botones volvieran a funcionar se permitió `script-src-attr 'unsafe-inline'`. Es coherente con la configuración previa, pero **es una concesión**; lo correcto es migrar los manejadores a `addEventListener` |
| Kit propio | `ui.js` evita dependencias (se eliminó jQuery y DataTables), pero **somos dueños de sus errores**: encontramos 5 propios (filas que desaparecían, `hidden` ignorado, una clase compartida que recibía el contador de filas, la columna «bajo demanda» visible dentro de las tarjetas e inputs que desbordaban su columna). Una librería madura habría tenido menos, a cambio de más peso y dependencias |
| Despacho | Mantiene su envío clásico (abre la hoja en otra pestaña): no tiene los estados asíncronos de Empleados |
| Pruebas con la base real | No se hicieron altas ni bajas reales; el éxito y el borrado se verificaron con respuestas simuladas |
| Lighthouse | No se ejecutó (necesita un navegador sin sesión); se usó una auditoría propia más estrecha |
| `chart.js` | Versión fijada pero sin atributo `integrity` |

## 3. ¿Cómo se usó realmente la IA?

**Magnitud:** casi todo el código y la documentación de este taller lo escribió una IA (Claude Code), bajo decisiones y aprobaciones del equipo. Eso es un hecho que debe quedar claro en la sustentación; lo que el equipo aportó fue **criterio, alcance y límites** (ver `07_uso_de_ia.md`): qué línea base usar, qué cambiar y qué no (la autenticación NFC), el formato de entrega, qué permisos conceder y qué probar con datos reales.

**Lo que la IA hizo bien:**
- **Medir en vez de opinar:** los 21 hallazgos salen de conteos en el DOM y en el código, y eso permitió descartar sus propias hipótesis (la gráfica «vacía por el tiempo de carga» era un error de JSON).
- **Encontrar problemas fuera de la lista:** el CSP que bloqueaba los botones y el 500 de `/cierre_diario` aparecieron al **probar**, no al leer.
- **Pedir permiso cuando algo cambiaba seguridad o datos:** consultó antes de tocar permisos y del CSP, y no hizo borrados ni altas reales.

**Dónde falló (todo detectado por pruebas, no por revisión):**

| Falla de la IA | Cómo se detectó | Efecto si no se hubiera detectado |
|---|---|---|
| Atribuir la gráfica vacía a un retraso | Recaptura con espera y consola | Hallazgo 19 sin documentar |
| Conteos inconsistentes (controles, `@media`, tokens) | Revisión pedida por el equipo («Revisar Fase 1») y recuento | Cifras contradictorias en el informe |
| Una tabla que perdía filas al agregar (48 → 11) | Prueba con datos simulados | Lista visiblemente rota tras el primer alta |
| Componentes que ignoraban `hidden` | Capturas del estado de error | Interfaz con elementos de más en errores |
| Un chequeo propio mal escrito (regex) que daba 0/5 a los dos prompts | Contraste con el HTML real | Conclusión falsa en el experimento de prompts |
| Regenerar un documento pisó una edición manual (se perdió el texto sobre el CSP) | Búsqueda del texto tras regenerar | Sección de seguridad desactualizada en el PDF |
| Intentar cargar *axe-core* desde un CDN en una sesión autenticada | Bloqueado por el control de permisos | Código de terceros ejecutándose con la sesión del administrador |

**Riesgos de fondo:** (1) *exceso de confianza*: la IA redacta con seguridad aunque se equivoque; el antídoto fue exigir una medición o una prueba para cada afirmación; (2) *deuda de comprensión*: si el equipo no puede explicar cómo funciona `UI.tabla` o por qué se cambió el CSP, el trabajo no es suyo; (3) *sesgo al evaluar a la propia IA*: el experimento de prompts lo diseñó y lo evaluó la misma familia de modelos (se declaró y se mitigó con un script reproducible).

## 4. ¿Qué haríamos distinto?
1. **Medir la línea base desde el primer día con los mismos instrumentos** que se usarían al final, y guardarla: la auditoría de accesibilidad nació en la Fase 4, así que algunas pantallas no tienen un «antes» medido con el mismo método.
2. **Conseguir temprano un usuario o un entorno de prueba** para poder probar altas y bajas reales y planear las sesiones con personas desde la Fase 1, no al final.
3. **Reconstruir primero la pantalla peor** (Bodega) en vez de la más cómoda de medir.
4. **Pedir la revisión de cifras antes de escribirlas en el informe**, no después.
5. **Dividir el trabajo para que el equipo escriba código a mano** al menos en un componente, para poder defenderlo.

## 5. Aprendizaje del equipo (a completar por ustedes)

Esta sección debe estar en **sus palabras**. Preguntas guía, para responder con ejemplos concretos del taller:

1. ¿Qué principio de diseño o de accesibilidad entendían mal o no conocían antes (p. ej. por qué el *placeholder* no es una etiqueta, qué es el contraste 4,5:1, qué significa `aria-describedby`) y cómo lo comprobaron?
2. De los cambios hechos, ¿cuál **no sabrían** explicar ni defender hoy? ¿Qué harán para poder hacerlo antes de la sustentación?
3. ¿Qué decisión del equipo (no de la IA) cambió el resultado? Ejemplos del registro: exigir el commit original para las capturas, pedir el PDF, aprobar el cambio del CSP.
4. ¿Qué hallazgo de las pruebas con usuarios los sorprendió, y qué cambiaron por eso? *(completar tras las sesiones)*
5. ¿Qué diferencia vieron entre pedirle a la IA «mejora esto» y darle contexto, reglas y criterios (experimento de la Fase 5)? ¿Cómo lo aplicarán en otros cursos o en un trabajo real?
6. ¿Cómo evitarán depender de la IA para entender el código que entregan?

**Borrador de punto de partida (redactado por la IA, para reescribir o descartar):** «Aprendimos que mejorar una interfaz no es cambiar colores: es medir qué falla, decidir qué corregir primero y comprobar que el cambio funciona. La IA aceleró el trabajo, pero se equivocó varias veces y solo lo detectamos porque probamos cada cambio. Nos queda por validar con personas reales si las mejoras se sienten como mejoras.»

## 6. Preguntas probables en la sustentación (y dónde está la respuesta)

| Pregunta | Respuesta corta | Evidencia |
|---|---|---|
| ¿Qué es lo primero que arreglaron y por qué? | Lo que impedía trabajar: la gráfica rota, los 500 y el CSP | `01_diagnostico.md`, hallazgos 19–21 |
| ¿Cómo saben que mejoró? | Mediciones antes/después con la misma herramienta, no opiniones | `06_fase4_mejoras.md`, `08_antes_y_despues.md` |
| ¿Por qué un sistema de diseño propio? | 631 colores fijos y 3 modales distintos hacían imposible mantener la coherencia | `05_sistema_de_diseno.md` |
| ¿Qué hizo la IA y qué hicieron ustedes? | Ver la tabla de decisiones | `07_uso_de_ia.md`, sección 2 |
| ¿Qué falta? | Pruebas con usuarios, Bodega en móvil, migrar manejadores en línea | secciones 1 y 2 de este documento |
