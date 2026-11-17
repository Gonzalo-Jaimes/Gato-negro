# Fase 3 · Sistema de diseño y tokens

Archivo fuente: `public/css/theme.css` (v5.0, 412 líneas, **73 tokens de diseño** en `:root`, 83 contando los 10 valores `--dark-*` de respaldo). Guía viva y comprobable: ruta `/guia_estilos` (rol admin; menú Administración → Guía de estilos).

## 1. Punto de partida (auditoría, antes de cambiar nada)

| Hallazgo | Evidencia |
|---|---|
| Colores escritos a mano ignoran el tema | 631 colores `#rrggbb` en `views/` (paleta Tailwind: `#10b981` ×37, `#ef4444` ×28, `#6b7280` ×25…) frente a 616 usos de variables |
| Dos clases para el mismo botón | `.btn` ×57 y `.premium-btn` ×27 |
| Botones redefinidos por vista | 11 reglas ad hoc (`.btn-guardar`, `.btn-liquidar`, `.btn-prestamo`, `.btn-extra`, `.btn-historial`) copiadas en 4 vistas |
| Sin escalas de espaciado ni de tipografía | Los `padding`/`font-size` son literales en ~1165 estilos inline |
| Componentes sin estados de formulario | No existían `.input`, error ni éxito; modal con 3+ implementaciones |
| Modo oscuro roto en componentes propios | Fondos `white` y colores fijos no cambiaban al activar el modo oscuro |
| `header.ejs` redefinía componentes globales | `.card`, `input/select/textarea`, `label` y `table` dentro del layout, con `z-index` literales |

## 2. Fundamentos

### 2.1 Color
- **Marca:** cobre `#B4541A` (contraste con texto claro 4,71:1) y hoja de tabaco `#6B4F2A` (7,38:1). Hereda la identidad artesanal ya elegida para el rediseño.
- **Superficies:** papel cálido (`--bg-main`, `--bg-card`, `--bg-sunken`) y texto marrón oscuro; en modo oscuro las mismas variables cambian de valor.
- **Semánticos:** éxito, peligro, aviso, información, cada uno con variante suave (`*-soft`) para fondos de insignias y mensajes.
- **Regla de contraste (medida por cálculo WCAG 2.1):**

| Par (modo claro) | Contraste | ¿AA (≥ 4,5)? |
|---|---:|---|
| Texto principal / tarjeta | 15,56 | Sí |
| Texto apagado / tarjeta | 5,03 | Sí |
| Texto apagado / fondo de página | 4,57 | Sí (justo) |
| Primario / tarjeta | 4,86 | Sí |
| Texto claro sobre primario | 4,71 | Sí |
| Éxito / tarjeta | 4,87 | Sí |
| Peligro / tarjeta | 6,16 | Sí |
| Información / tarjeta | 5,64 | Sí |
| **Aviso `#C98A1B` / tarjeta** | **2,87** | **No → solo relleno o borde** |
| Aviso para texto `--warning-text` `#8A5A00` / tarjeta | 5,79 | Sí |
| Texto / tarjeta en modo oscuro | 14,32 | Sí |
| Primario `#D9743A` / tarjeta oscura | 5,40 | Sí |

  Consecuencia en código: el color de texto `#f59e0b` de las vistas se migró a `var(--warning-text)` (7 casos). El contraste real de cada pantalla se medirá con Lighthouse en la Fase 4.

### 2.2 Tipografía
Títulos en **Outfit** y cifras/interfaz en **Inter** (`font-variant-numeric: tabular-nums` en importes). Escala `--text-xs` (0,75 rem) a `--text-3xl` (2 rem), pesos 400/500/600/700 y dos interlineados. Las fuentes ahora sí cargan (el `@import` va primero en el archivo).

### 2.3 Espaciado, forma y profundidad
Escala de 4 px (`--space-1` a `--space-12`), radios `--radius-xs/sm/radius/full`, tres sombras cálidas, anillo de foco `--focus-ring` y alturas mínimas `--control-h` (42 px) y `--touch-min` (44 px).

### 2.4 Capas y movimiento
`--z-sticky` 1000, `--z-sidebar-mobile` 1100, `--z-modal` 2000, `--z-toast` 3000. Movimiento de 150–200 ms con `--ease-out` y `prefers-reduced-motion` respetado.

## 3. Catálogo de tokens

Generado automáticamente desde `theme.css` (no se edita a mano). No lista los fondos degradados de varias líneas (`--login-bg`, `--dark-login-bg`).

### 1. Color · marca (9 tokens)

| Token | Valor (claro) | Valor en modo oscuro |
|---|---|---|
| `--primary-h` | `22` | — |
| `--primary-s` | `75%` | — |
| `--primary-l` | `40%` | — |
| `--primary-rgb` | `180, 84, 26` | `217, 116, 58` |
| `--primary` | `#B4541A` | `#D9743A` |
| `--primary-hover` | `#9A4515` | `#E88A52` |
| `--primary-soft` | `rgba(180, 84, 26, 0.12)` | `rgba(217, 116, 58, 0.16)` |
| `--secondary` | `#6B4F2A` | — |
| `--on-primary` | `#FFF8EE` | `#1A1008` |

### 2. Color · superficies y texto (8 tokens)

| Token | Valor (claro) | Valor en modo oscuro |
|---|---|---|
| `--bg-main` | `#F6F1E7` | `var(--dark-bg)` |
| `--bg-card` | `#FFFCF6` | `var(--dark-card)` |
| `--bg-sunken` | `#EFE7D8` | `var(--dark-sunken)` |
| `--text-main` | `#2A2018` | `var(--dark-text)` |
| `--text-muted` | `#7A6B5A` | `var(--dark-text-muted)` |
| `--border-color` | `#E2D8C6` | `var(--dark-border)` |
| `--border-strong` | `#C9BBA3` | `var(--dark-border-strong)` |
| `--overlay` | `rgba(22, 14, 6, 0.65)` | — |

### 3. Color · semánticos (10 tokens)

| Token | Valor (claro) | Valor en modo oscuro |
|---|---|---|
| `--success` | `#4F7A4A` | `#8DBF86` |
| `--success-soft` | `rgba(79, 122, 74, 0.14)` | `rgba(141, 191, 134, 0.16)` |
| `--danger` | `#A63D2F` | `#E58475` |
| `--danger-hover` | `#8C3226` | `#EE9A8D` |
| `--danger-soft` | `rgba(166, 61, 47, 0.12)` | `rgba(229, 132, 117, 0.16)` |
| `--warning` | `#C98A1B` | — |
| `--warning-text` | `#8A5A00` | `#E3B04B` |
| `--warning-soft` | `rgba(201, 138, 27, 0.16)` | `rgba(227, 176, 75, 0.16)` |
| `--info` | `#3D6A8C` | `#86B4D8` |
| `--info-soft` | `rgba(61, 106, 140, 0.12)` | `rgba(134, 180, 216, 0.16)` |

### 4. Espaciado (9 tokens)

| Token | Valor (claro) | Valor en modo oscuro |
|---|---|---|
| `--space-1` | `4px` | — |
| `--space-2` | `8px` | — |
| `--space-3` | `12px` | — |
| `--space-4` | `16px` | — |
| `--space-5` | `20px` | — |
| `--space-6` | `24px` | — |
| `--space-8` | `32px` | — |
| `--space-10` | `40px` | — |
| `--space-12` | `48px` | — |

### 5. Tipografía (15 tokens)

| Token | Valor (claro) | Valor en modo oscuro |
|---|---|---|
| `--font-main` | `'Inter', system-ui, -apple-system, sans-serif` | — |
| `--font-head` | `'Outfit', 'Inter', sans-serif` | — |
| `--text-xs` | `0.75rem` | — |
| `--text-sm` | `0.875rem` | — |
| `--text-base` | `1rem` | — |
| `--text-lg` | `1.125rem` | — |
| `--text-xl` | `1.25rem` | — |
| `--text-2xl` | `1.5rem` | — |
| `--text-3xl` | `2rem` | — |
| `--weight-regular` | `400` | — |
| `--weight-medium` | `500` | — |
| `--weight-semibold` | `600` | — |
| `--weight-bold` | `700` | — |
| `--leading-tight` | `1.25` | — |
| `--leading-normal` | `1.5` | — |

### 6. Forma, profundidad y tamaños (12 tokens)

| Token | Valor (claro) | Valor en modo oscuro |
|---|---|---|
| `--radius-xs` | `6px` | — |
| `--radius-sm` | `10px` | — |
| `--radius` | `14px` | — |
| `--radius-full` | `999px` | — |
| `--shadow-sm` | `0 1px 2px 0 rgb(60 40 20 / 0.06)` | — |
| `--shadow-md` | `0 4px 10px -2px rgb(60 40 20 / 0.10), 0 2px 4px -2px rgb(60 40 20 /…` | `0 4px 10px -2px rgb(0 0 0 / 0.4)` |
| `--shadow-lg` | `0 14px 28px -6px rgb(60 40 20 / 0.16), 0 6px 10px -6px rgb(60 40 20…` | `0 14px 28px -6px rgb(0 0 0 / 0.5)` |
| `--focus-ring` | `0 0 0 3px rgba(var(--primary-rgb), 0.35)` | — |
| `--control-h` | `42px` | — |
| `--touch-min` | `44px` | — |
| `--glass-bg` | `rgba(255, 252, 246, 0.6)` | `rgba(31, 25, 18, 0.7)` |
| `--glass-blur` | `blur(12px)` | — |

### 7. Capas (4 tokens)

| Token | Valor (claro) | Valor en modo oscuro |
|---|---|---|
| `--z-sticky` | `1000` | — |
| `--z-sidebar-mobile` | `1100` | — |
| `--z-modal` | `2000` | — |
| `--z-toast` | `3000` | — |

### 8. Movimiento (3 tokens)

| Token | Valor (claro) | Valor en modo oscuro |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | — |
| `--t-fast` | `150ms` | — |
| `--t-base` | `200ms` | — |

### 9. Login (2 tokens)

| Token | Valor (claro) | Valor en modo oscuro |
|---|---|---|
| `--login-card-bg` | `rgba(255, 252, 246, 0.85)` | `var(--dark-login-card-bg)` |
| `--login-text` | `#2A2018` | `var(--dark-login-text)` |

## 4. Componentes

| Componente | Clase base y modificadores | Estados cubiertos |
|---|---|---|
| **Botón** | `.btn` + `-primary` (defecto) `-secondary` `-success` `-danger` `-ghost`; tamaños `-sm` `-lg`; `-block` | normal, hover, active (escala 0,98), focus-visible (anillo), disabled |
| **Tarjeta** | `.card` + `.card-header` `.card-title` `.card-footer`; `-interactive` | normal, hover |
| **Campo de formulario** | `.field` > `label` + `.input` + `.field-hint` / `.field-error` / `.field-success`; `.is-invalid`, `.is-valid` | normal, focus, error, éxito, disabled |
| **Insignia** | `.badge` + `-success` `-danger` `-warning` `-info` `-neutral` | — |
| **Tabla** | `table` / `th` / `td` globales con `.num` para cifras | hover de fila |
| **Modal** | `.modal-backdrop` > `.modal-dialog` (+ `.modal-header` `.modal-title` `.modal-footer`); se abre con `.activo` | animación de entrada |

Alias heredados que siguen funcionando: `.premium-btn`, `.premium-card`, `.modal-overlay-pic`, `.modal-box-pic`.

### Fragmento de código comprobable
Una variante de botón es cambiar variables locales; el modo oscuro solo redefine tokens:

```css
:root { --primary: #B4541A; --space-4: 16px; --radius-sm: 10px; }
html.dark-mode { --primary: #D9743A; }

.btn {
    background: var(--btn-bg, var(--primary));
    padding: var(--space-2) var(--space-5);
    border-radius: var(--radius-sm);
}
.btn-danger { --btn-bg: var(--danger); }
```

## 5. Demostración (mínimo 2 componentes estandarizados en toda la SaaS)

**Componente 1 — Botón.** Una sola definición en `theme.css` para toda la aplicación.

| Métrica | Antes | Después |
|---|---:|---:|
| Clases distintas para el botón primario | 2 (`btn`, `premium-btn`) | 1 (`btn`) |
| Usos de `premium-btn` en vistas | 27 | 0 |
| Reglas de botón redefinidas por vista | 11 | 0 |
| Usos de `class="btn …"` | 57 | 73 |

**Componente 2 — Tarjeta, campo, insignia y tabla.** Movidos desde `header.ejs` a `theme.css` y expresados solo con tokens, de modo que las 24 vistas de la aplicación heredan el mismo aspecto y el modo oscuro.

**Adopción global de tokens:**

| Métrica | Antes | Después |
|---|---:|---:|
| Tokens de diseño en `:root` (sin `--dark-*`) | 32 | 73 |
| Colores `#rrggbb` en `views/` | 631 | 341 |
| Usos de `var(--…)` en `views/` | 616 | 941 |
| `z-index` literales en el layout | 2 | 0 |

De los 341 colores restantes, **128** están en documentos de impresión o aislados (hoja de despacho, formato de nómina, facturas, ficha y QR de equipos, login, landing, splash NFC), que deben conservar colores fijos en papel; **43** están dentro de bloques `<script>` (colores de `chart.js` y JS, que no aceptan `var()` en canvas); y los **165** restantes son neutros sin equivalente semántico (`#000`, `#111`, `#333`, `#ccc`…) o pasteles de error (`#fca5a5`, `#fef2f2`) que se tratarán al rediseñar cada pantalla en la Fase 4.

**Evidencia visual:** capturas de la guía en `capturas/sistema_diseno/` (modo claro y oscuro) y de las 5 pantallas base tras la migración en `capturas/despues/escritorio/`.

## 6. Reglas de migración aplicadas
1. Solo se reemplazó texto **fuera** de `<script>` (el JS y el canvas no resuelven `var()`).
2. Se **excluyeron** los documentos de impresión y aislados (papel blanco y negro, sin modo oscuro).
3. Colores semánticos: `#10b981`, `#16a34a`, `#059669` → `--success`; `#ef4444`, `#dc2626`, `#b91c1c` → `--danger`; `#3b82f6`, `#2563eb`, `#1d4ed8` → `--info`; grises de texto → `--text-muted`/`--text-main`; bordes → `--border-color`; fondos claros → `--bg-sunken`; `background: white` → `--bg-card`; pasteles de estado → `*-soft`.
4. Texto de aviso (`color: #f59e0b`) → `--warning-text` por contraste.
5. Los nombres de clase antiguos se conservan como ganchos por si algún script los referencia (verificado: ningún JS dependía de `.btn-*`).

## 7. Verificación realizada
- Las 41 plantillas EJS compilan y la guía se renderiza.
- En el navegador (escritorio): la guía carga con los valores reales de los tokens, el botón mide 44 px (`--touch-min`) y las 5 pantallas base se ven coherentes tras la migración.
- **Modo oscuro:** al añadir `html.dark-mode` los valores calculados cambian (fondo `#16110C`, texto `#F1E8D8`, tarjetas y barra lateral oscuras) sin tocar ningún componente.
- **Modal de la guía:** abre con el foco en "Cancelar", Escape lo cierra y el foco vuelve al botón que lo abrió.

## 8. Límites y pendientes
- **Colores de `chart.js`** (dashboard): siguen siendo literales porque se dibujan en canvas; se leerán de los tokens con `getComputedStyle` en la Fase 4.
- **Estilos inline:** los ~1165 atributos `style=` no se eliminaron en esta fase; se reducirán al reconstruir cada pantalla (Fase 4).
- **Modales existentes** (picadura, fabriquines, equipos) conservan su CSS y su estructura; se migrarán al componente nuevo junto con la accesibilidad (`role="dialog"`, foco, Escape) en la Fase 4.
- **Documentos de impresión:** conservan colores fijos a propósito.

## 9. Hallazgo nuevo descubierto al verificar
**Los manejadores `onclick`/`onchange`/`oninput`/`onsubmit` en línea están bloqueados por el CSP.** `helmet` añade por defecto `script-src-attr 'none'`, y la configuración de `server.js` no lo sobrescribe. Medido en el navegador: el botón de modo oscuro (`onclick="toggleDarkMode()"`) **no hace nada** y la consola muestra "Executing inline event handler violates the following Content Security Policy directive 'script-src-attr 'none''". Afecta a 98 manejadores en 30 vistas (65 `onclick`, 15 `oninput`, 12 `onchange`, 5 `onsubmit`, 1 `onkeyup`): menú móvil, modales y filtros. **Riesgo mayor:** 7 confirmaciones `confirm()` de acciones críticas viven en esos manejadores (`empleados.ejs:40` borrar empleado, `usuarios.ejs:47` borrar usuario con un enlace GET, `lista.ejs:93` borrar máquina, `nomina.ejs:40` archivar nómina pagada, `factura_detalle.ejs:179` confirmar entrega de efectivo, `anilladores.ejs:67` validar y facturar, `envolvedoras_control.ejs:121` liquidar). Si el manejador no se ejecuta, el formulario o enlace procede **sin pedir confirmación**. Se deduce del código y del bloqueo medido; no se probó pulsando borrar para no destruir datos reales. La intención documentada en `server.js` era permitir los manejadores en línea. Ver hallazgo 21 en `01_diagnostico.md`; se consultó antes de tocar la configuración de seguridad.

**Resolución (aprobada):** se añadió `scriptSrcAttr: ["'unsafe-inline'"]` en `server.js`, en un commit aparte. Es coherente con `scriptSrc`, que ya permitía scripts en línea, y el resto de directivas (`object-src 'none'`, `frame-ancestors 'self'`, `form-action 'self'`) no cambió. Verificación en el navegador: la cabecera ahora trae `script-src-attr 'unsafe-inline'`; el clic real en el botón de modo oscuro activa el tema (clase aplicada, preferencia guardada en `localStorage`, fondo `#16110C`) y un segundo clic lo restaura. **No se probaron** las confirmaciones de borrado pulsándolas, para no destruir datos reales. Deuda técnica: migrar los 98 manejadores a `addEventListener` y volver a `'none'` (Fase 4).
