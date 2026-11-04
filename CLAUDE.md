# 🐈‍⬛ Gato Negro ERP & Black Cat Bot (BCB) — Memoria y Contexto del Proyecto

Sistema ERP Web modular (Node.js + Express 5 + EJS + Supabase PostgreSQL) con Asistente Virtual en Telegram (**Black Cat Bot**) para la **Fábrica de Tabacos Gato Negro** (San Antonio del Táchira, Venezuela). Controla de punta a punta la manufactura artesanal de tabacos, inventarios, nómina a destajo y mantenimiento industrial.

---

## 🚀 1. Ejecución y Stack Tecnológico
- **Punto de entrada:** `server.js` (Express 5.2, sesiones con `cookie-session`, vistas EJS en `views/`, estáticos en `public/`).
- **Ejecución local:** `node server.js` → corre en `http://localhost:3000` (en Vercel exporta `app` sin `app.listen`).
- **Base de datos:** Supabase (`@supabase/supabase-js`) inicializado en `src/lib/shared.js`.
- **Autenticación y Roles (`src/lib/middleware.js`):**
  - `isAuth`: Verifica sesión activa (`req.session.usuario`).
  - `isAdmin`: Restringe acceso exclusivamente a `req.session.rol === 'admin'`.
  - **Roles existentes en tabla `usuarios`:** `admin`, `mantenimiento` (ej. Manolo), `fabriquin` / `fabricacion`, `anillador`, `envolvedor`, `empacador`.
  - Soporta login tradicional con `bcrypt` (`/login`) y login rápido por tarjeta NFC (`/login/nfc?token=...`).

---

## 🔄 2. Línea de Producción Completa (5 Eslabones y Fórmulas)
Documentación detallada en: `documentacion/LINEA_DE_PRODUCCION_PLATAFORMA.md` y `documentacion/DICCIONARIO_FABRICA.md`.

1. **Etapa 0 — Bodega Central y Kardex (`/bodega`, `/movimientos`, `/inventario`):**
   - Ingreso de Materia Prima (`Capa`, `Capote`, `Picadura`), Herramientas (`Cestas Rojas`, `Cestas Negras`, etc.) e Insumos (`Anillos (Gato)`, `Anillos (Intabaca)`, `Papel de Envoltura`, `Goma`, `Periódico`).
   - En `/bodega` la hoja bruta se fracciona en **Sacas de Picadura** estandarizadas (`35, 28, 21, 14, 7 kg` o sobrantes).
2. **Etapa 1 — Entrega de Material a Fabriquines (`/despacho` → confirmación en `/bodega`):**
   - Se asigna la meta semanal de tabacos al fabriquín.
   - **Tasa de conversión por cada 1,000 tabacos:** `1.0 kg Capa`, `1.8 kg Capote`, `7.0 kg Picadura` y `1 cesta por cada 1,250 tabacos`.
   - Genera hoja imprimible (`hoja_despacho.ejs`), descuenta sacos en `/bodega` y suma la meta a `deuda_tabacos` del fabriquín.
3. **Etapa 2 — Búsqueda y Recepción Diaria de Tabacos (`/recepcion_diaria`):**
   - Incluye buscador en tiempo real por nombre o código del fabriquín.
   - Registro matricial de **Lunes a Sábado** de cestas (`1 cesta = 1,250 tabacos normales`), tabacos, mermas (`Vena` a `$3,500 COP/kg`, `Recorte` a `$6,500 COP/kg`) y `Tabacos Extras` (`$230 COP/ud`). El tabaco normal se paga a `$85 COP/ud`.
   - **Motor Diferencial en Vivo (`/recepcion_diaria_guardar`):** Cada guardado calcula la diferencia respecto al guardado anterior e inyecta al instante la entrada/salida en `inventario` (`Tabacos`, `Cestas`, `Vena`, `Recorte`) y `movimientos` (Kardex).
   - Al **Liquidar Semana (`/liquidar_semana/:id`)**, descuenta `deuda_tabacos` y envía el pago a **Nómina (`/nomina`)**.
4. **Etapa 3 — Anilladores (`/anilladores/despacho` → `/anilladores/recepcion`):**
   - Se trabaja con dos marcas: **Gato** e **Intabaca**.
   - En despacho se entregan tabacos y **Paquetes de Anillos** (`1 paquete = 500 anillos`, el backend multiplica `× 500` automáticamente) + pega de yuca.
   - En recepción se registran entregas de Lunes a Sábado (`1 cesta de anillador = 1,500 tabacos`) y mermas de anillos/tabacos. Al liquidar, suma `Tabacos Anillados (Gato)` o `Tabacos Anillados (Intabaca)` al inventario global.
5. **Etapa 4 — Envolvedoras (`/envolvedoras/despacho` → `/envolvedoras/control`):**
   - Asignación semanal por **Marca** (`Gato` o `Intabaca`), creando tarjetas separadas si una misma operaria trabaja ambas marcas.
   - Descuenta `Tabacos Anillados (Marca)` (`cestas × 1,250`) y `Papel de Envoltura` (en gramos/kg, universal para ambas marcas).
   - En `/envolvedoras/control` (con buscador en vivo) se registran de Lunes a Sábado `Cestas IN`, `Cestas OUT`, `Tabacos OUT` y papel extra/sobrante. Al liquidar, suma `Tabacos Envueltos (Gato)` o `Tabacos Envueltos (Intabaca)` al inventario global y envía el cobro a Nómina.
6. **Etapa 5 — Empacadores (`/empacadores/recepcion` y `/despachos_empaque`):**
   - Los empacadores sellan los tabacos envueltos en cajas y bultos de Lunes a Sábado:
     - **1 Bulto de 25** = `84 cajas × 25 tabacos` = **2,100 tabacos**.
     - **1 Bulto de 50** = `42 cajas × 50 tabacos` = **2,100 tabacos**.
     - **Cajas sueltas de 25** (`25 tabacos`) y **Cajas sueltas de 50** (`50 tabacos`).
   - Al liquidar semana, consolida el total de tabacos empacados y actualiza el stock de producto terminado.

---

## 📁 3. Mapa de Arquitectura del Código

```text
├── server.js                        # Entrada Express, sesiones, montaje de rutas en '/' y webhook /api/bot
├── src/
│   ├── lib/
│   │   ├── shared.js                # Cliente Supabase, bcrypt, mostrarAlerta (SweetAlert2), obtenerHoraColombia, registrarAuditoria
│   │   ├── middleware.js            # Middlewares isAdmin e isAuth
│   │   └── pdf_gen.js               # Generador de facturas PDF (GatoNegroPDF)
│   ├── routes/
│   │   ├── admin.js                 # /login, /login/nfc, /logout, /usuarios, /inventario, /movimientos, /empleados, préstamos
│   │   ├── produccion.js            # /despacho, /recepcion_diaria, /liquidar_semana, /bodega (lotes/sacos picadura), /mermas, /pedidos
│   │   ├── anilladores.js           # /anilladores/inventario, /anilladores/despacho, /anilladores/recepcion, /api/anilladores/*
│   │   ├── operario.js              # /bodega, /anilladores (tareas por cestas), /envolvedoras/despacho, /envolvedoras/control, /despachos_empaque
│   │   ├── empacadores.js           # /empacadores/recepcion, /empacadores/recepcion_guardar, /empacadores/liquidar_semana/:id
│   │   ├── finanzas.js              # /analitica, /nomina, /facturas, /factura_detalle/:id, /imprimir_nomina_v18/:id, deudas
│   │   └── equipos.js               # /maquinas (/lista), /ficha/:id, /mantenimiento, /qrs (/maquinas/qrs), flujo correctivos/tareas
│   └── bot/
│       ├── bot_core.js              # Núcleo híbrido del Black Cat Bot (Telegram + IA Gemini/Ollama)
│       └── handlers/menu_handlers.js
└── views/
    ├── partials/                    # header.ejs (sidebar por rol, tema oscuro/claro), footer.ejs, cat-head.ejs, cat-loader.ejs
    ├── admin/                       # inventario.ejs, movimientos_kardex.ejs, empleados.ejs, usuarios.ejs, analitica.ejs, cierre_diario.ejs
    ├── produccion/                  # despacho.ejs, hoja_despacho.ejs, fabriquines_diario.ejs, picadura.ejs, anilladores_*.ejs, envolvedoras_*.ejs, empaque_*.ejs
    ├── finanzas/                    # nomina.ejs, formato_nomina.ejs, facturas_lista.ejs, factura_detalle.ejs, factura.ejs
    └── equipos/                     # lista.ejs, ficha.ejs, mantenimiento.ejs, qrs.ejs
```

---

## 🗄️ 4. Tablas Principales en Supabase (PostgreSQL)
- **Inventario y Bodega:** `inventario`, `movimientos` (Kardex), `lotes_picadura`, `sacos_picadura`, `compras_materia_prima`, `mermas_materia_prima`, `inventario_insumos_graficos`.
- **Fabriquines y Nómina:** `empleados_fabriquines`, `despachos_registro`, `recepcion_diaria`, `produccion_fabriquines`, `prestamos_fabriquines`, `abonos_prestamo`, `deudores_fabriquines`.
- **Anilladores, Envolvedoras y Empaque:** `empleados_anilladores`, `recepcion_diaria_anilladores`, `tareas_anilladores`, `empleados_envolvedoras`, `recepcion_envolvedoras`, `empleados_empacadores`, `recepcion_empacadores`, `pedidos`, `pedidos_tabaco`.
- **Mantenimiento y Maquinaria:** `maquinas`, `mantenimiento` (estados: `REALIZADO`, `NO REALIZADO` para tareas asignadas por admin, `SOLICITADO` para correctivos pedidos por el mecánico, `APROBADO`, `RECHAZADO`).
- **Seguridad y Sistema:** `usuarios`, `auditoria_logs`.

---

## 🔧 5. Convenciones de UI, Mantenimiento y Reglas Técnicas
- **Sistema de Diseño (Paleta Artesanal v4.0):** Variables CSS definidas en `views/partials/header.ejs` (`--bg-app`, `--bg-card`, `--text-main`, `--brand`, `--accent`, `--border`, etc.) con soporte completo para **Modo Claro y Modo Oscuro** (`[data-theme="dark"]`).
- **Módulo de Mantenimiento (`/mantenimiento` y `/ficha/:id`):**
  - El rol `mantenimiento` (Manolo) ve en el menú lateral únicamente **Mantenimiento** (`/mantenimiento`) e **Inventario de Máquinas** (`/maquinas`).
  - La numeración de mantenimientos (`nro_maquina`) se calcula de forma independiente por cada máquina (`1, 2, 3...` según orden cronológico).
  - Si un mecánico (`rol !== 'admin'`) registra un mantenimiento `Correctivo`, entra en estado `SOLICITADO` y notifica por Telegram al Admin, quien debe **Aprobar** o **Rechazar** antes de que pueda ejecutarse.
- **Documentación de Referencia en `documentacion/`:**
  - `documentacion/LINEA_DE_PRODUCCION_PLATAFORMA.md`: Flujo operativo completo paso a paso.
  - `documentacion/DICCIONARIO_FABRICA.md`: Glosario de fábrica, cestas, bultos y sistema de papelitos.
  - `documentacion/EMPRESA_GATO_NEGRO.md`: Contexto corporativo e historia de la fábrica.
  - `documentacion/FINANZAS_Y_FORMULAS.md`: Fórmulas contables y precios por destajo.
