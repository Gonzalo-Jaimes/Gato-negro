# Rediseño de la landing y transiciones con el Cat Loader

Fecha: 2026-10-30 · Rama: `feature/rediseno-ui`

## 1. Objetivo

Llevar la landing de Don Gato a una experiencia interactiva inspirada en trionn.com, sin romper la identidad artesanal (acento cobre `#B4541A`) y sin penalizar a los equipos modestos:

- Un hero 3D/WebGL construido programáticamente a partir de una sola imagen 2D (`public/img/logo.png`).
- Una pantalla de carga con los ojos del gato que enmascara la carga de la textura.
- La sección "Módulos y Funcionalidades del Sistema" fuera del viewport inicial, revelada con scroll fluido.
- Degradación elegante en móviles y equipos de bajas prestaciones (CSS puro).
- Transiciones de ruta con el mismo loader, únicamente en tres flujos.
- Un botón "Volver al inicio" en el login.

## 2. Flujo de ejecución

1. Auditoría visual local con Playwright (escritorio 1440×900 y móvil 390×844) y exploración del código con el subagente Explore (Haiku).
2. Preguntas de alineación: scroll nativo con `IntersectionObserver`, shader de desplazamiento con parallax, fallback CSS con Ken Burns, loader de ojos que se abren.
3. Plan Markdown y pausa estricta hasta la aprobación.
4. Implementación y verificación en el navegador.
5. Segunda iteración: transiciones de ruta con el loader y botón de volver, con el mismo ciclo (exploración, plan, aprobación, ejecución).

## 3. Landing interactiva

### Archivos

| Archivo | Rol |
|---|---|
| `views/landing.ejs` | Estructura del hero, módulos, loader y detección de modo |
| `public/css/landing-fx.css` | Hero, revelado de módulos, modo ligero, navbar móvil |
| `public/js/landing-fx.js` | Loader con progreso real, shader, scroll fluido, revelado |
| `public/css/cat-loader.css` | Loader compartido (ver sección 4) |

### Selección de modo

Un script inline en `<head>` decide el modo antes del primer pintado y añade `fx-gl` o `fx-lite` a `<html>`. Se usa el modo ligero si se cumple cualquiera de estas condiciones: pantalla de 768 px o menos, puntero táctil, `prefers-reduced-motion`, 2 GB de memoria o menos, 2 núcleos o menos, `saveData` activo o falta de WebGL. Los parámetros `?lite=1` y `?fx=1` fuerzan cada modo para pruebas.

### Modo WebGL (escritorio)

- Three.js 0.160.0 se carga con `import()` dinámico desde jsdelivr, con tope de 8 s. Si falla, la página cae sola al modo ligero.
- Un plano a pantalla completa de su contenedor muestra `logo.png` como textura. Se usa `NoColorSpace` porque el `ShaderMaterial` escribe el color sin conversión.
- El fragment shader:
  1. Calcula una profundidad falsa promediando la luminancia en cruz (5 muestras) y desplaza el UV según el cursor suavizado.
  2. Añade un brillo cobre pulsante sobre los píxeles ámbar (ojos y franjas rojas).
  3. Aplica viñeta y un grano leve contra el banding.
  4. Multiplica el color por `uIntro`, que sube de 0 a 1 cuando el loader termina.
- Rendimiento: densidad de píxeles limitada a 1.5, render pausado cuando el hero sale de pantalla o la pestaña se oculta, y manejo de `webglcontextlost` con regreso al modo ligero.

### Modo ligero (móvil)

No carga Three.js. La misma imagen se muestra con CSS: zoom lento (Ken Burns, 24 s), pulso cobre sobre los ojos y parallax por scroll con `rAF` y `passive`. No se usa giroscopio porque en iOS exige permiso.

### Ocultamiento y revelado de módulos

- El hero ocupa `100svh`, así que la sección empieza exactamente en el borde inferior del viewport.
- Una variable CSS `--p` (0 a 1) se calcula con el scroll y controla el fondo y el encabezado de la sección. Las 6 tarjetas entran escalonadas (90 ms) mediante `IntersectionObserver`.
- El botón "Ver Características" ejecuta un scroll animado de 900 a 1400 ms con easing cúbico. Una rueda, un toque o una tecla lo cancelan. El hash se actualiza con `history.replaceState`. Con `prefers-reduced-motion` el salto es instantáneo.
- El scroll manual produce la misma animación, porque depende del scroll y no del clic.

### Otras correcciones

El navbar móvil se desbordaba a 390 px: ahora la palabra "SaaS" se oculta por debajo de 420 px y el botón se compacta.

## 4. Cat Loader y transiciones de ruta

### El loader

El loader (`#loader`) son dos paneles negros y dos ojos ámbar en SVG con párpados animados. Sus estados:

| Clase | Significado |
|---|---|
| (ninguna) | Cubre la pantalla (arranque de la landing) |
| `ready` | Los ojos se abren del todo |
| `done` | Reposo: paneles fuera y ojos ocultos |
| `closing` | Cierre rápido (0.5 s) antes de navegar |

En la landing el progreso es real: espera fuentes, decodificación de la imagen, la carga de Three.js y la primera compilación del shader, con un mínimo de 900 ms y un tope de 6 s.

### Piezas compartidas

- `public/css/cat-loader.css`: estilos y estados.
- `views/partials/cat-loader.ejs`: marcado. Con `idle: true` nace en reposo.
- `views/partials/cat-head.ejs`: enlaza el CSS y el script, y pinta el telón antes del primer fotograma si llega una marca válida.
- `public/js/cat-transition.js`: la lógica de las transiciones.

### Estrategia

El proyecto es Express con EJS renderizado en servidor, sin router de cliente. En lugar de convertirlo en una SPA, el telón cubre una navegación nativa:

1. Al salir, un clic o un envío de formulario cierra el telón, guarda una marca en `sessionStorage` (con hora) y navega.
2. El navegador desmonta la página anterior y monta la nueva debajo del telón.
3. En la página de destino, el script de `<head>` ve la marca y añade `cat-cover` a `<html>`, lo que pinta el telón en el primer fotograma. Cuando la página carga, los ojos se abren y el telón se retira.

### Los tres flujos

| Flujo | Disparador | Marca |
|---|---|---|
| Landing → Login | Clic en un enlace a `/login`, solo desde `/` | `landing>login` |
| Login → Panel | `submit` del formulario `action="/login"` | `login>panel` |
| Panel → Login | Clic en "SALIR DEL SISTEMA" (`/logout`) | `panel>login` |

Reglas que lo limitan a esos tres flujos:

- Cada página solo acepta las marcas que le corresponden: el login acepta `landing>login` y `panel>login`; el panel (`header.ejs`, que incluyen todas las vistas con layout) acepta `login>panel`.
- Toda carga borra la marca, y esta caduca a los 6 s, así que una marca vieja nunca dispara el loader en otra página.
- Una visita directa, un refresh, el botón "Volver al inicio" o un login fallido no muestran el telón.
- Con `prefers-reduced-motion` no hay telón y la navegación es directa.
- El evento `pageshow` con `persisted` devuelve el loader a reposo al usar el botón Atrás.
- Si `sessionStorage` está bloqueado, la navegación es normal.

## 5. Botón "Volver al inicio"

Añadido en `views/login.ejs`, arriba a la izquierda, como espejo del botón de tema. Es un enlace a `/` sin loader (no es uno de los tres flujos).

- Píldora fantasma con flecha SVG y colores de los tokens (`--text-muted`, `--border-color`, `--primary`).
- Al pasar el cursor (solo en dispositivos con hover), la flecha se desplaza 2 px en 150 ms y el borde se vuelve cobre. Al pulsar, `scale(.97)`.
- Zona táctil de 48 px, anillo de foco cobre y `aria-label`. Respeta `prefers-reduced-motion`.

## 6. Verificación

Con Playwright, sin errores de consola:

- Landing en escritorio (WebGL, canvas activo) y en móvil (modo ligero, sin cargar Three.js ni desbordes).
- Scroll del botón: llegada exacta a la sección y las 6 tarjetas reveladas.
- Los tres flujos de transición, la visita directa sin loader, el login fallido, el botón Atrás, `prefers-reduced-motion` y el botón "Volver" en escritorio y móvil.

## 7. Límites conocidos

- No se midió el rendimiento en un teléfono real ni los fotogramas por segundo del shader.
- En un login fallido, el telón se cierra al enviar y desaparece de golpe cuando el servidor devuelve la alerta. Corregirlo exige cambiar el servidor.
- El login por NFC no usa estas transiciones.
- Si el rol redirige a una vista sin el header común, la marca de transición puede activar el loader en la siguiente página abierta dentro de los 6 s.
- `logo.png` pesa 526 KB; convertirla a WebP sería una mejora opcional.
