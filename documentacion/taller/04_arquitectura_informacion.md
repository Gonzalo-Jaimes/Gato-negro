# Fase 2 · Arquitectura de información y navegación

Fuente de los datos: lectura de `views/partials/header.ejs`, `src/routes/*.js` y `src/lib/middleware.js` en el commit `a24fbc5`/`main`, más verificación en el navegador. Todo lo que aquí se afirma sobre rutas y vistas se comprobó contra el código.

## 1. Mapa de navegación actual (rol `admin`)

Leyenda: `⚠` duplicidad o ambigüedad · `✖` página existente sin entrada en el menú.

```
Menú lateral actual (19 enlaces; solo 2 a un clic, 17 a dos clics)
├─ ADMINISTRACIÓN
│  └─ Central de Negocios ▾                        ⚠ nombre genérico
│     ├─ Inventario Global        /inventario
│     ├─ Kardex                   /movimientos
│     ├─ Nómina                   /nomina
│     ├─ Analítica BI             /analitica
│     └─ Empleados                /empleados
├─ PRODUCCIÓN
│  ├─ Fabriquines ▾
│  │  ├─ Asignar Hojas            /despacho            ⚠ "Asignar" con 3 nombres distintos
│  │  ├─ Facturas                 /facturas            ⚠ son facturas de nómina (finanzas)
│  │  ├─ Recepción                /recepcion_diaria    ⚠ "Recepción" repetido en 3 grupos
│  │  └─ Bodega Central           /bodega              ⚠ sirve a toda la cadena, no solo a fabriquines
│  ├─ Anilladores ▾
│  │  ├─ Asignar Trabajo          /anilladores/despacho
│  │  ├─ Recepción                /anilladores/recepcion
│  │  └─ Inv / Empleados          /anilladores/inventario   ⚠ abreviatura ambigua
│  ├─ Envolvedoras ▾
│  │  ├─ Asignar Semana           /envolvedoras/despacho
│  │  └─ Recepción Diaria         /envolvedoras/control
│  └─ Empacado                    /empacadores/recepcion    ⚠ solo recepción; el despacho no tiene entrada
└─ TÉCNICO
   ├─ Mantenimiento ▾
   │  ├─ Equipos                  /maquinas
   │  ├─ Órdenes                  /mantenimiento
   │  └─ Etiquetas QR             /maquinas/qrs
   └─ Accesos                     /usuarios            ⚠ gestión de usuarios dentro de "Técnico"

Páginas del rol admin SIN entrada en el menú:
  ✖ /mermas               Mermas y Compras de Materia Prima
  ✖ /recepcion_general    Recepción de Tareas (Fabriquines) y abono de rezagos
  ✖ /despacho_empaque     Despacho a Empacadores/Anilladores
  ✖ /entregas_historicas  Historial y Trazabilidad de Entregas Logísticas   (ningún enlace interno la apunta)
  ✖ /pedidos              Órdenes de Producción / Envoltura                 (solo está en el menú operativo)
  ✖ /cierre_diario        Mi Cierre de Producción
```

### Duplicidades y ambigüedades detectadas

| # | Hallazgo | Evidencia |
|---|---|---|
| A1 | "Asignar" con tres nombres: *Asignar Hojas*, *Asignar Trabajo*, *Asignar Semana* | `header.ejs` líneas del menú original |
| A2 | "Recepción" aparece en 3 grupos con nombres casi iguales (*Recepción*, *Recepción*, *Recepción Diaria*) y *Empacado* oculta otra recepción | `header.ejs` |
| A3 | Dos URLs para la misma vista: `/despacho_empaque` y `/despachos_empaque` → `produccion/empaque_despacho`; `/recepcion_empaque` y `/empacadores/recepcion` → `produccion/empaque_recepcion`. **`/despacho_empaque` devolvía error 500** (le pasaba a la vista `personal` y `registros`, pero la vista espera `usuarios`, `inventario` y `despachos_activos`); la que funciona y a la que redirige el flujo POST es `/despachos_empaque`. **Hallado en la regresión final (Fase 7):** `/recepcion_empaque` tenía el mismo defecto (`ReferenceError: empleados is not defined`, `empaque_recepcion.ejs:24`) y se corrigió igual: redirige a `/empacadores/recepcion` | `produccion.js`, `operario.js`, `empacadores.js`; error visto en el navegador (`ReferenceError: usuarios is not defined`, `empaque_despacho.ejs:13`) |
| A4 | `/lista` y `/maquinas` consultan las mismas tablas (`maquinas`, `mantenimiento`): dos puertas al mismo catálogo; el script de activación tiene un caso especial para ellas | `equipos.js` líneas 23 y 51, `header.ejs` |
| A5 | `/anilladores` y `/anilladores/dashboard` y `/envolvedoras` son redirecciones o pantallas alternas de otras rutas del menú | `operario.js`, `anilladores.js` |
| A6 | *Bodega Central* vive bajo *Fabriquines*, pero despacha material a toda la cadena; *Facturas* vive bajo *Fabriquines* y es facturación de nómina; *Accesos* vive bajo *Técnico* y es administración | Etiquetas y rutas |
| A7 | `/recepcion_general` (recibir tareas, abonar rezagos) y `/recepcion_diaria` (guardar recepción diaria) son funciones **distintas**, pero la primera no tiene ningún enlace | Formularios: `/recibir_tarea/:id`, `/abonar_rezago` frente a `/recepcion_diaria_guardar` |
| A8 | Código muerto de navegación: `views/base.ejs` (layout con menú antiguo, ninguna ruta lo usa) y `locals.currentUrl` (nunca se define; el ítem activo funciona por JavaScript con `location.pathname`) | Búsqueda en `src/` y `views/` |

### Hallazgo funcional (acceso por rol)
Los roles `anillador` y `empacador` son redirigidos tras el login a `/cierre_diario` (`admin.js` líneas 31 y 59), pero esa ruta exige `isAdmin` (`admin.js` línea 157, `middleware.js`). Resultado: vuelven a `/login`. El menú operativo ("Mi producción") apunta a la misma ruta. Además la ruta fallaba con 500 para cualquier rol (renderizaba sin datos). Corregido en un commit aparte; ver sección 5.

## 2. Principios usados para el rediseño
1. **Agrupar por proceso**, no por quién usa la pantalla: la cadena real es Fabriquines (asignar tarea) → Bodega (entregar material) → Fabriquines (recibir) → Anilladores → Envolvedoras → Empaque, como describe `documentacion/LINEA_DE_PRODUCCION_PLATAFORMA.md`.
2. **Mismo patrón en cada eslabón:** *Asignar* (despacho de material) y *Recibir producción* (recepción). Mismos verbos, mismos nombres.
3. **Frecuente a un clic:** lo que no pertenece a un eslabón (resumen, finanzas, mantenimiento, administración) queda como enlace directo.
4. **Todo lo que existe se puede llegar desde el menú** (benchmarking: SaaSFrame y Mobbin muestran menús compactos y completos).
5. **Etiquetas con verbo y objeto** en lugar de abreviaturas.

## 3. Mapa de navegación mejorado (rol `admin`)

```
Menú lateral nuevo (24 enlaces; 12 a un clic, 12 a dos clics)
├─ RESUMEN
│  ├─ Analítica                   /analitica
│  └─ Inventario                  /inventario
├─ PRODUCCIÓN                      (en el orden de la cadena)
│  ├─ Fabriquines ▾
│  │  ├─ Asignar tarea            /despacho
│  │  ├─ Recibir producción       /recepcion_diaria
│  │  └─ Recibir tareas y rezagos /recepcion_general      ← nuevo en menú
│  ├─ Bodega ▾
│  │  ├─ Despachar material       /bodega
│  │  └─ Mermas y compras         /mermas                 ← nuevo en menú
│  ├─ Anilladores ▾
│  │  ├─ Asignar trabajo          /anilladores/despacho
│  │  ├─ Recibir producción       /anilladores/recepcion
│  │  └─ Inventario y personal    /anilladores/inventario
│  ├─ Envolvedoras ▾
│  │  ├─ Asignar semana           /envolvedoras/despacho
│  │  └─ Recibir producción       /envolvedoras/control
│  ├─ Empaque ▾
│  │  ├─ Asignar trabajo          /despachos_empaque      ← nuevo en menú
│  │  └─ Recibir producción       /empacadores/recepcion
│  ├─ Pedidos                     /pedidos                ← nuevo en menú admin
│  └─ Historial de entregas       /entregas_historicas    ← nuevo en menú
├─ FINANZAS Y CONTROL
│  ├─ Kardex                      /movimientos
│  ├─ Nómina                      /nomina
│  └─ Facturas                    /facturas
├─ MANTENIMIENTO
│  ├─ Equipos                     /maquinas
│  ├─ Órdenes                     /mantenimiento
│  └─ Etiquetas QR                /maquinas/qrs
└─ ADMINISTRACIÓN
   ├─ Empleados                   /empleados
   └─ Accesos                     /usuarios
```

Menús de los otros roles (misma estructura de datos):
- `mantenimiento`: *Ver máquinas* (`/maquinas`) y *Subir mantenimiento* (`/mantenimiento`).
- Operativo (`fabriquin`, `fabricacion`, `envolvedor`, `anillador`, `empacador`): *Pedidos* y *Mi producción*.

### Comparación

| Métrica (rol admin) | Antes | Después |
|---|---|---|
| Enlaces en el menú | 19 | 24 |
| Páginas existentes sin entrada | 6 | 1 (`/cierre_diario`, ver sección 5) |
| Destinos a un clic | 2 | 12 |
| Destinos a dos clics | 17 | 12 |
| Nombres distintos para "asignar" | 3 | 1 por eslabón (*Asignar tarea/semana/trabajo*, verbo común) |
| Grupos por criterio | mezcla de rol y proceso | proceso (producción) y función (resto) |

## 4. Cambios implementados en código
Archivo: `views/partials/header.ejs` (el único tocado; ninguna ruta, `id`, `name` ni formulario cambió).

1. **El menú se genera desde una sola estructura de datos** (`menu`) por rol, en lugar de HTML repetido a mano. Añadir una página es añadir una línea.
2. **Grupos desplegables como `<button>`** con `aria-expanded` y `aria-controls`, en lugar de `<a href="#" onclick>`; el grupo con la página actual se abre solo y se resalta.
3. **Página actual** marcada con `class="active"` y `aria-current="page"`; las rutas hijas (`/factura_detalle/:id`, `/ficha/:id`, `/imprimir_despacho/:id`…) mantienen activo su ítem mediante `data-tambien`.
4. **Landmark `<nav aria-label="Navegación principal">`** y emojis marcados `aria-hidden` (el texto ya describe el destino).
5. **Foco visible** en enlaces y botones del menú, y chevrón que rota (150 ms, respeta `prefers-reduced-motion`).
6. Eliminado el código muerto `locals.currentUrl`.

Verificación realizada:
- El encabezado renderiza para los tres tipos de rol y los 24 enlaces del menú admin apuntan a rutas GET existentes.
- En el navegador (escritorio y móvil): el grupo de la página actual se abre solo, el ítem activo lleva `aria-current="page"`, los grupos se abren con clic y con Enter, y el foco muestra contorno.
- Al pedir las 24 rutas con la sesión de administrador, **23 respondieron 200 y una dio 500** (`/despacho_empaque`, ver A3). Se enlazó entonces la ruta canónica `/despachos_empaque` y la ruta rota se corrigió en un commit aparte (redirige a la canónica).

## 5. Pendientes que requieren decisión
- **Acceso de `anillador` y `empacador` (RESUELTO, commit aparte):** al revisar la ruta resultó que `/cierre_diario` fallaba con 500 **para todos**, no solo por el permiso: renderizaba la vista sin datos. La lógica original (anterior a la refactorización modular, recuperada del historial de git) consultaba la producción pendiente, las deudas activas y los pedidos del usuario de la sesión. Se restauró, limitada a los roles `fabriquin`, `fabricacion`, `envolvedor`, `anillador` y `empacador`, cada uno solo con sus propios datos. Admin y mantenimiento son redirigidos a la landing. Verificado con un arnés de prueba por rol (ver 04, sección 6); falta probar con un usuario real de esos roles.
- **Rutas duplicadas (A3, A4, A5):** no se eliminaron para no romper marcadores ni enlaces del bot; se documentan y el menú usa una sola URL canónica por pantalla.
- **`views/base.ejs`:** código muerto; se puede borrar en una limpieza aparte.

## 6. Evidencia
- Antes: el menú original aparece en las capturas `capturas/antes/escritorio/*.jpg` (grupos colapsados, 5 grupos mezclados con rol y proceso).
- Después: `capturas/despues/escritorio/6_menu_navegacion.jpg` (menú por proceso con el grupo de la página actual abierto y resaltado).
- Prueba de `/cierre_diario` por rol (arnés con sesión simulada, datos reales de Supabase filtrados por un usuario inexistente): sin sesión → 302 `/login`; admin y mantenimiento → 302 `/`; `anillador`, `empacador` y `fabriquin` → 200, con el título, el bloque "A Favor" y sin errores de plantilla. Con datos reales de un trabajador no se probó (no hay credenciales de ese rol).
- Comprobación de la ruta corregida: `/despacho_empaque` ahora redirige a `/despachos_empaque` y la página carga; las 24 rutas del menú admin responden 200.

### Prueba de `/cierre_diario` con un usuario real (rol trabajador)
Realizada el 2026-11-17 con una sesión real de un usuario operativo (captura `capturas/despues/escritorio/7_cierre_diario_trabajador.jpg`):
- Tras el login la pantalla **carga sin error** (antes: 500 y rebote al login). Título "Mi Cierre de Producción", tres tarjetas y dos tablas.
- Menú lateral con solo **Pedidos** y **Mi producción** (activo). Coincide con el rol.
- **Control de acceso:** con esa sesión, las 10 páginas de administración probadas (`/nomina`, `/inventario`, `/analitica`, `/usuarios`, `/empleados`, `/movimientos`, `/despacho`, `/facturas`, `/bodega`, `/mermas`) redirigen y no cargan; responden 200 solo `/pedidos`, `/cierre_diario` y `/maquinas`.
- **Estado con datos:** este usuario no tenía producción, deudas ni pedidos, así que se vio el estado vacío (tarjetas en $0 y mensajes "No te han asignado ningún material aún" / "No tienes producciones pendientes"). El estado con datos se comprobó renderizando la vista con datos de muestra (montos, filas y estados "Liquidado"/"En proceso" correctos); **no** con datos reales.
- Observación pre-existente, sin cambios: `/maquinas` es accesible a cualquier usuario autenticado (usa `isAuth`), aunque no aparece en su menú. Queda anotada para revisión de permisos.
