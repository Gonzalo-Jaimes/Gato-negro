# Fase 7 · Matriz de cumplimiento frente a la rúbrica

Estado a 2026-11-17, rama `feature/taller-mejoramiento` (sin *merge* a `main`). **Cumple** = hecho y demostrado con evidencia; **Parcial** = hecho con una carencia declarada; **Pendiente** = depende del equipo.

## 1. Rúbrica (100 %)

| Componente | Peso | Estado | Evidencia | Carencia declarada |
|---|:-:|:-:|---|---|
| Diagnóstico: 15 problemas, impacto y prioridad | 10 % | **Cumple** | `01_diagnostico.md`: **21 hallazgos** con pantalla, impacto, prioridad (14 altas, 7 medias, 0 bajas) y acción; métricas medidas por pantalla | El contraste se midió con una herramienta propia, no con Lighthouse |
| Benchmarking: 5 referencias | 10 % | **Cumple** | `03_benchmarking.md`: SaaSFrame, Refero, Page Flows, Mobbin y MotionSites con enlace, captura, patrón, adaptación y descarte | Mobbin, Refero y Page Flows exigen cuenta para ver ejemplos completos; solo se documentó lo público. La captura de Mobbin salió sin estilos |
| Jerarquía / Arquitectura | 10 % | **Cumple** | `02_jerarquia_visual.md` (5 niveles, esquema, rediseño y comparación) y `04_arquitectura_informacion.md` (mapa actual con duplicidades, mapa mejorado, menú implementado: 19 → 24 enlaces, 2 → 12 a un clic) | Los mapas son árboles de texto, no diagramas dibujados |
| Sistema de diseño: reglas, tokens y componentes | 15 % | **Cumple** | `05_sistema_de_diseno.md`: 82 tokens de diseño, catálogo generado desde el CSS, fragmento de código, componentes (botón, tarjeta, campo, insignia, tabla, modal, KPI, estado, toast) y guía viva en `/guia_estilos` en claro y oscuro | Quedan 282 colores fijos en vistas (631 al inicio; 341 al cierre de la Fase 3 y el resto lo redujo la Fase 4; 128 están en documentos de impresión por diseño) |
| Formularios / Tablas: estados y datos | 10 % | **Cumple** | `06_fase4_mejoras.md`: 5 estados de campo, validación específica en cliente y servidor, tablas con búsqueda, filtro, orden y paginación, 7 estados en Empleados y Kardex, con capturas | Altas y bajas reales en la base de datos no se probaron (respuestas simuladas) |
| Responsive y accesibilidad: mejoras verificadas | 10 % | **Parcial** | Responsive en 3 tamaños sin desborde; 5 mejoras de accesibilidad medidas antes y después con `herramientas/auditoria_a11y.js` | **No se ejecutó Lighthouse** (ni axe-core: el control de permisos bloqueó su carga). 14 textos de Despacho sobre degradado sin evaluar. Solo se auditaron las 5 pantallas base y la guía |
| Uso crítico de IA: 5 interacciones con registro y criterio | 10 % | **Cumple** | `07_uso_de_ia.md`: 5 fichas con herramienta, prompt, respuesta, aceptado, rechazado, modificaciones y evidencia; comparación de prompts con rúbrica (6/20 frente a 18/20) y salidas íntegras en `ia/` | Las 5 fichas usan **la misma herramienta** (Claude Code); el equipo puede añadir las que hizo con otras. El experimento es de una sola ejecución por prompt |
| Implementación: cambios demostrables en código | 15 % | **Cumple** | 27 commits sobre `main` al iniciar la Fase 7 (más los de esta fase); app funcional con sesión real; 42 plantillas compilan; 34 rutas verificadas (ver sección 3) | Otras ~30 vistas siguen con estilos y manejadores en línea |
| Antes y después: 5 comparaciones justificadas | 5 % | **Cumple** | `08_antes_y_despues.md`: 5 comparaciones con capturas reales del commit original, problema, principio, cambio en código y resultado | Bodega quedó **parcial**: sus 8 indicadores siguen apilados en móvil (hallazgos 11 y 12 abiertos) |
| Sustentación: pruebas y conclusiones | 5 % | **Pendiente** | `12_guia_y_sustentacion.md` (guion de 10 minutos) y `10_reflexion_critica.md` | La claridad en vivo depende del equipo |

## 2. Entregables finales

| Entregable | Estado | Dónde |
|---|:-:|---|
| Informe técnico: diagnóstico (15 hallazgos), benchmarking (5), mapas, sistema de diseño / tokens y reflexión | **Cumple** (reflexión parcial) | `Informe_Taller_SaaS.pdf` (se genera con `build_pdf.py`) |
| Evidencia: capturas iniciales | **Cumple** | `capturas/antes/` (15, del commit `a24fbc5`) |
| Evidencia: 5 comparaciones antes/después | **Cumple** | `08_antes_y_despues.md` |
| Evidencia: formularios, tablas y estados | **Cumple** | `capturas/estados_empleados/`, `capturas/estados_kardex/`, `capturas/sistema_diseno/` |
| Evidencia: pruebas responsive | **Cumple** | `capturas/responsive/` |
| Evidencia: 5 mejoras de accesibilidad | **Cumple** | `06_fase4_mejoras.md` sección 5 |
| Evidencia: 5 interacciones de IA | **Cumple** | `07_uso_de_ia.md` |
| **Evidencia: pruebas con 3 usuarios reales** | **Pendiente** | Protocolo y hojas de registro listos en `09_pruebas_con_usuarios.md`; **las tablas están vacías** |
| Reflexión crítica | **Parcial** | `10_reflexion_critica.md`; la sección 5 («aprendizaje del equipo») debe escribirla el equipo |
| Producto funcional: enlace o versión ejecutable y demostración | **Parcial** | Se ejecuta en local (ver `12_guia_y_sustentacion.md`). **No hay despliegue** de esta rama: `vercel.json` existe, pero publicarlo requiere aprobación del equipo y las variables de entorno |

## 3. Regresión final (2026-11-17)
- 42 plantillas EJS compilan; `ui.js`, `server.js` y todas las rutas pasan `node --check`.
- Con sesión de administrador se pidieron **34 rutas** GET: 29 responden 200; 5 redirigen por diseño (`/anilladores/dashboard`, `/envolvedoras`, `/despacho_empaque` y `/recepcion_empaque` a su ruta canónica, y `/cierre_diario` a la landing para el administrador). Se encontró y corrigió `/recepcion_empaque` (500).
- Como trabajador: `/cierre_diario` carga y las 10 páginas de administración probadas quedan bloqueadas (Fase 2).

## 4. Qué NO se hizo (resumen honesto)
1. **Pruebas con usuarios reales:** pendientes; sin ellas no se puede afirmar mejora de usabilidad percibida.
2. **Aprendizaje del equipo:** pendiente de redactar por el equipo.
3. **Lighthouse:** no se ejecutó.
4. **Altas y bajas reales** en la base de datos: no se probaron.
5. **Bodega en móvil** (hallazgos 11 y 12): abierto.
6. **Migración de los 98 manejadores en línea** a `addEventListener` y vuelta a `script-src-attr 'none'`: abierta (87 restantes).
7. **Despliegue, *merge* a `main`, *push* y *pull request*:** no realizados, a la espera de aprobación.
8. **Token de Telegram:** el de `.env` está rechazado (401); el bot no arranca en local. No afecta a la web.
