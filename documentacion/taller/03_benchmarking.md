# Fase 1 · Benchmarking — 5 referentes

Fecha: 2026-11-17. Capturas reales tomadas con el navegador integrado en `capturas/benchmarking/`. Los datos de tamaño de cada biblioteca provienen de búsquedas web (fuentes al final) y varían entre fuentes; no se afirman como exactos.

> Límite declarado: Mobbin, Refero y Page Flows muestran sus ejemplos completos solo con cuenta de pago o de prueba. Aquí se documenta lo observable públicamente (página de ejemplo de SaaSFrame, consultas sugeridas de Refero, descripciones oficiales y portadas). No se inició sesión ni se evadió ningún control de acceso. Para ampliar con ejemplos concretos, el equipo puede crear sus cuentas.

## Resumen

| # | Referente | Qué es | Enlace | Captura |
|---|---|---|---|---|
| 1 | SaaSFrame | Biblioteca de pantallas y flujos reales de SaaS (dashboards, landing, pricing) | https://www.saasframe.io | `1_saasframe_mintlify_dashboard.jpg` |
| 2 | Refero | Biblioteca de pantallas, flujos y patrones UX reales, con modo de investigación | https://refero.design | `2_refero_home.jpg` |
| 3 | Page Flows | Biblioteca de **videos** de flujos de usuario (onboarding, login, búsqueda) | https://pageflows.com | `3_pageflows_home.jpg` |
| 4 | Mobbin | Biblioteca de pantallas, flujos y elementos UI de apps móviles y web | https://mobbin.com | `4_mobbin_home.jpg` |
| 5 | MotionSites | Plantillas y prompts de sitios web animados | https://motionsites.ai | `5_motionsites_home.jpg` |

Nota sobre `4_mobbin_home.jpg`: el panel del navegador cargó la página sin hojas de estilo; la captura es fiel a lo que se vio, pero poco representativa visualmente.

## Análisis por referente

### 1. SaaSFrame — Dashboard de Mintlify (ejemplo 8/19 de la categoría Dashboard)
- **Patrón observado:** etiquetas propias del ejemplo: *Card, Charts, Dashboard, Filter, Metrics, Sidebar Navigation*. Estructura: barra lateral compacta y estrecha (Home, Editor, Analytics, Settings), saludo contextual arriba, tres tarjetas de estado en fila ("Enable automatic updates", "Customize your docs", "Add custom domain") y una tabla de historial de actividad debajo.
- **Cómo se adapta a Gato Negro:** KPIs en fila superior en `/analitica` (Balance neto, Ingresos, Nómina, Mantenimiento); menú lateral agrupado y compacto con 4 destinos por grupo; tabla de actividad reciente en el dashboard.
- **Qué se descarta:** contenido tipo documentación, saludo personalizado, funciones PRO (descargar Figma, "Design with AI") y la densidad de texto diminuto, que no cumple el contraste/tamaño que exige la planta.

### 2. Refero — Modo de investigación y consultas sugeridas
- **Patrón observado:** la portada ofrece categorías de búsqueda por patrón; entre las consultas sugeridas aparecen "Dashboard layouts with charts" y "Data tables with filters", justo los dos problemas de `/analitica` y `/movimientos`. Separa *Web apps*, *iOS apps* y *Styles* (dirección visual).
- **Cómo se adapta:** definir la barra de filtros de tablas (búsqueda + filtros + orden) antes de implementarla, y usar la categoría *Styles* para validar que la paleta cobre/papel mantiene jerarquía.
- **Qué se descarta:** integración MCP y funciones de pago; el estilo de fondo oscuro de su portada, porque la fábrica trabaja con luz de planta y la paleta clara es más legible.

### 3. Page Flows — Videos de flujos de usuario
- **Patrón observado:** la plataforma clasifica por **flujo completo** (onboarding, login, checkout, búsqueda) en iOS, Android, Web y emails; se ven ritmo, transiciones y guía de atención entre pasos, no solo pantallas estáticas.
- **Cómo se adapta:** tratar "Asignar tarea a fabriquín" (`/despacho`) como un flujo de pasos numerados con progreso y confirmación final, y usarlo para escribir las 3 tareas críticas de la prueba de usuarios (Fase 6).
- **Qué se descarta:** patrones de apps de consumo (paywalls, registro social) y el acceso por suscripción; no aplican a un ERP interno.

### 4. Mobbin — Pantallas, flujos y elementos UI
- **Patrón observado:** catálogo separado en móvil y web, cada uno con *pantallas, flujos y elementos UI* (formularios, navegación, estados vacíos); permite comparar cómo distintas apps resuelven un mismo componente.
- **Cómo se adapta:** referencia para los **5 estados de formulario** (normal, foco, error, deshabilitado, éxito) y para la navegación móvil del sistema (menú hamburguesa → panel con grupos) de la Fase 2.
- **Qué se descarta:** estética de apps de consumo y el límite del plan gratuito (solo unas pocas apps visibles).

### 5. MotionSites — Prompts de sitios animados
- **Patrón observado:** plantillas de landing con héroe animado y prompts listos para pegar en un constructor con IA; categorías *Sections, Hero, Landing Page, SaaS*.
- **Cómo se adapta:** solo a la **landing** (que ya tiene transiciones y Cat Loader); sirve además como ejemplo para la comparación de prompt débil vs. estructurado de la Fase 5.
- **Qué se descarta:** animaciones de héroe en pantallas operativas. Decisión de diseño del proyecto: sin animación en acciones de teclado ni en tablas de alta frecuencia; todo movimiento respeta `prefers-reduced-motion`.

## Decisiones que salen del benchmarking
1. Dashboard con KPIs arriba y gráfica abajo (SaaSFrame, Refero).
2. Barra de herramientas estándar para tablas: búsqueda, filtros, orden, paginación (Refero).
3. Formularios en pasos con estados completos y retroalimentación no bloqueante (Page Flows, Mobbin).
4. Menú lateral compacto y agrupado, con versión móvil en panel (SaaSFrame, Mobbin).
5. Movimiento solo donde comunica estado (MotionSites como contraejemplo para pantallas operativas).

## Fuentes
- [SaaSFrame — página de ejemplo Mintlify Dashboard](https://www.saasframe.io/examples/mintlify-dashboard) y [SaaSFrame: hechos del producto](https://www.saasframe.io/for-ai)
- [Refero](https://refero.design) y [reseña en AlternativeTo](https://alternativeto.net/lists/44740/design-reference-libraries-for-real-world-inspiration/)
- [Page Flows](https://pageflows.com) y [reseña de Page Flows](https://uiuxshowcase.com/resources/page-flows/)
- [Mobbin](https://mobbin.com) y [Mobbin — índice oficial](https://mobbin.com/index.md)
- [MotionSites](https://motionsites.ai) y [listado en Product Hunt](https://www.producthunt.com/products/motionsites)
