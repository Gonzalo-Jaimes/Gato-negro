# Plan de reestructuración UI/UX — Gato Negro

**Dirección elegida:** artesanal tabaquero · acento nuevo, fuentes actuales (Inter + Outfit) · alcance: sistema de diseño + páginas clave.
**Intocables:** login y NFC; despacho, picadura y recepciones (formularios, buscadores, modales, fetch).

## 0. Hallazgos que condicionan el plan
- Landing oscura y login claro: dos identidades distintas.
- `public/css/theme.css`: tokens existen, pero ~1.100 `style=` inline y hex fijos (#10b981, #6b7280, #ef4444...) los ignoran.
- `@import` de Google Fonts en `theme.css:54` está después de reglas: **las fuentes no cargan** (cae a system-ui).
- 3-4 sistemas de modal, botones `.btn-*` redefinidos por archivo, 7 variantes de tarjeta.
- `header.ejs:313` usa `locals.currentUrl`, nunca definido: el item activo del sidebar no funciona.
- Bugs ajenos al diseño (se reportan, no se tocan sin tu OK): 4 vistas inexistentes que darían 500 (`finanzas/formato_nomina_v18`, `finanzas/factura`, `produccion/despacho_empaque`, `produccion/recepcion_empaque`); `data-raw` de analitica.ejs con JSON en atributo; token NFC en la URL; CDNs sin versión fija.

## 1. Sistema de diseño (fundación)
Archivo único: `public/css/theme.css` (reordenar, `@import` primero).
- **Paleta artesanal** (propuesta; el acento exacto lo confirmas):
  - Acento: cobre/brasa `#B4541A` (hover `#9A4515`), secundario hoja de tabaco `#6B4F2A`.
  - Claro: fondo papel `#F6F1E7`, tarjeta `#FFFCF6`, texto `#2A2018`, apagado `#7A6B5A`, borde `#E2D8C6`.
  - Oscuro: fondo `#16110C`, tarjeta `#1F1912`, texto `#F1E8D8`, borde `#33291D`.
  - Semánticos desaturados: éxito `#4F7A4A`, peligro `#A63D2F`, aviso `#C98A1B`.
- **Tipografía:** Outfit para títulos, Inter para UI y cifras (`tabular-nums` en montos/pesos).
- **Forma y profundidad:** radios 10/14 px, sombras cálidas de 3 niveles, bordes finos; textura sutil de papel solo en landing.
- **Componentes únicos** (clases compartidas): `.btn` (+ `-primary/-ghost/-danger/-sm`), `.card`, `.modal` (un solo sistema), `.input`, `.badge`, `.table`.
- **Movimiento:** transiciones 150-200 ms con `ease-out`, `:active` scale .98, respeto de `prefers-reduced-motion`. Sin animaciones en acciones de teclado ni en tablas de alta frecuencia.
- **Compatibilidad:** se mantienen los nombres de clases y tokens actuales como alias para que ninguna vista se rompa; mantener `html.dark-mode` y la clave `gato-dark-mode`.

## 2. Páginas y componentes, en orden
| # | Componente | Archivos | Cambio | Riesgo |
|---|---|---|---|---|
| 1 | Tokens + base | `public/css/theme.css` | Paleta, fuentes, componentes, dark mode | Bajo |
| 2 | Layout + sidebar | `views/partials/header.ejs`, `footer.ejs` | Nueva topbar/sidebar, estado activo real (pasar `currentUrl` desde middleware), mismo script dark/móvil | Medio |
| 3 | Landing | `views/landing.ejs` | Hero artesanal, tarjetas de módulos, CTA; mantener oneko opcional | Bajo |
| 4 | Login | `views/login.ejs` | Mismo lenguaje visual; **formulario, nombres de campos y POST /login intactos** | Bajo-medio |
| 5 | Splash NFC | `views/splash_nfc.ejs` | Solo estilo; redirección de 3 s y `redirectPath` intactos | Bajo |
| 6 | Despacho | `views/produccion/despacho.ejs` | Mover estilos inline a clases; lógica JS intacta | Medio |
| 7 | Picadura | `views/produccion/picadura.ejs` | Idem (120 estilos inline); modales y fetch intactos | Medio-alto |
| 8 | Recepciones | `anilladores_recepcion`, `empaque_recepcion`, `fabriquines_diario` | Botones/tarjetas/modal unificados | Medio |
| 9 | Dashboard/inicio y tablas | vistas admin principales | Tarjetas KPI y tablas con el nuevo sistema | Bajo |

Fuera de alcance (heredan los tokens, sin edición): el resto de ~35 vistas, nómina/factura, QR, mantenimiento, analítica.

## 3. Reglas de ejecución
1. Una pieza por paso; tras cada una reviso en el navegador (desktop y móvil 375 px, claro y oscuro).
2. No se modifican `src/routes`, nombres de `id`/`name`/`onclick`, ni lógica JS de formularios, buscadores, modales y fetch.
3. Commits pequeños en una rama `feature/rediseno-ui`; nada se empuja sin tu aprobación.
4. Antes de cada vista crítica, comparar capturas antes/después y probar el flujo (buscar empleado, abrir modal, guardar).
5. Accesibilidad: contraste ≥ 4.5:1, foco visible, objetivos táctiles ≥ 44 px.

## 4. Verificación
Capturas con el navegador en las rutas rediseñadas, consola sin errores nuevos, y recorrido manual del login, despacho, picadura y una recepción. Las rutas internas requieren que **tú** inicies sesión en el panel del navegador (yo no escribo contraseñas).

## 5. Decisiones que necesito de ti con el APROBADO
- Acento cobre `#B4541A` (propuesto) u otro color.
- Rama `feature/rediseno-ui` (propuesta) o trabajar sobre `main`.
- ¿Quieres que además corrija los 4 render rotos y el bug de `data-raw` (cambios de lógica, aparte del rediseño)? Por defecto: **no**.
