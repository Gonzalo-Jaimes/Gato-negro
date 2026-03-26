# Análisis Arquitectónico y Documentación Técnica: Gato Negro ERP
## Sistema Avanzado de Gestión de Producción y Cierres Contables

**Versión Actual**: 1.8.2 (Estable)  
**Fecha de Actualización**: Marzo 2026  
**Despliegue**: Frontend en Vercel (Edge Network) + Backend Serverless en Supabase (PostgreSQL)  

---

## 📋 Índice General
1. [Resumen Ejecutivo e Hitos](#1-resumen-ejecutivo-e-hitos)
2. [Arquitectura General (V1.8)](#2-arquitectura-general-v18)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Estructura del Repositorio](#4-estructura-del-repositorio)
5. [Módulos Core y Flujos de Negocio](#5-módulos-core-y-flujos-de-negocio)
6. [Fórmulas Contables y Algoritmos](#6-fórmulas-contables-y-algoritmos)
7. [Base de Datos (Esquema Principal)](#7-base-de-datos-esquema-principal)
8. [Registro de Bugs Resueltos (Troubleshooting)](#8-registro-de-bugs-resueltos-troubleshooting)

---

## 📌 1. Resumen Ejecutivo e Hitos
**Gato Negro ERP** es la columna vertebral digital de una fábrica manufacturera de tabacos. Evolucionó desde un sistema descentralizado (P2P Fabriquín) hacia un **control administrativo centralizado** de flujo de materia prima y control de deudas rotativas (V1.8.x).

**Hitos Históricos de Arquitectura:**
- **V1.6:** Implementación de Supabase y autenticación de roles, eliminando SQLite local.
- **V1.7.4:** Rediseños UI agresivos, soporte total Responsivo (Móviles) y Dark Mode (OLED Persistente).
- **V1.8.2 (Actual):** Muerte del sistema de Pedidos Libres. Transición a Despacho Dirigido, Recepción Acumulativa Matricial (L-S) y Cierres de Nómina complejos con Mermas y Subproductos (Vena/Recorte).

---

## 🏗️ 2. Arquitectura General (V1.8)
Se utiliza un diseño MVC (Model-View-Controller) donde el servidor actúa como orquestador estricto para evitar manipulaciones del lado del cliente. Toda transacción es validada asíncronamente en backend antes de inyectarse a Supabase.

```text
┌─────────────────────────────────────────────────────────────┐
│                    NAVEGADOR DEL ADMINISTRADOR              │
│                 (HTML5 + EJS Engine + CSS Custom)           │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP POST/GET
┌─────────────────────▼───────────────────────────────────────┐
│                    NODE.JS (EXPRESS.JS)                     │
│  - Middleware de Sesiones en RAM                            │
│  - Lógicas de Negocio Matemáticas (Controllers)             │
│  - Generador de Formularios de Impresión PDF en tiempo real │
└─────────────────────┬───────────────────────────────────────┘
                      │ API REST Supabase SDK
┌─────────────────────▼───────────────────────────────────────┐
│              SUPABASE CLOUD (POSTGRESQL DB)                 │
│  - inventario | movimientos | empleados_fabriquines         │
│  - produccion_fabriquines | recepcion_diaria | mantenimiento│
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ 3. Stack Tecnológico
| Capa | Tecnología | Propósito Técnico |
|------|-----------|-------------------|
| **Motor Backend** | Node.js (Express 5.2.1) | Ruteo ultra-rápido, gestión de sesiones y cálculos matemáticos. |
| **Motor Frontend** | EJS (Embedded JavaScript) | Inyección de datos SQL directamente en el HTML antes de renderizar al cliente. |
| **Base de Datos** | Supabase SDK / PostgreSQL | Alta persistencia, integridad referencial y almacenamiento remoto inmune a desastres locales. |
| **UX / UI** | Vainilla CSS + SweetAlert2 | Componentes interactivos sin bloqueos y Dark/Light Mode controlado por Javascript. |

---

## 📁 4. Estructura del Repositorio
Se mantiene una filosofía de estructura limpia (Separation of Concerns):

```text
gato-negro-erp/
├── 📄 server.js                    # El Cerebro Monolítico (Endpoints y Controladores)
├── 📄 package.json                 # Dependencias Node
├── 📁 public/                      # Recursos Públicos (Accesibles sin login)
│   └── img/                        # Logotipos y fotos de máquinas
├── 📁 documentacion/               # Manuales y Planificaciones del Repositorio
│   └── 📄 ANALISIS_PROYECTO.md     # <- ¡Estás leyendo este archivo!
└── 📁 views/                       # Vistas y Formularios Renderizables
    ├── 📄 login.ejs                # Punto de entrada y escudo de seguridad
    ├── 📄 inventario.ejs           # Dashboard visual de Existencias (Stock)
    ├── 📄 movimientos.ejs          # Kardex (Libro Mayor de Entradas y Salidas)
    ├── 📄 despacho.ejs             # V1.8: Asignador de tareas y generador de vales
    ├── 📄 recepcion_diaria.ejs     # V1.8: Grilla matricial de recepciones diarias (L-S)
    ├── 📄 nomina.ejs               # Dashboard financiero semanal de pagos
    ├── 📄 formato_nomina_v18.ejs   # Generador PDF Formato Inteligente de Contabilidad
    ├── 📄 empleados.ejs            # CRUD panel administrativo para personal
    └── 📁 partials/                
        ├── 📄 header.ejs           # Menú, Dark Mode init y Metas 
        └── 📄 footer.ejs           # Pie de página y Derechos Reservados
```

---

## 🎯 5. Módulos Core y Flujos de Negocio

### Modulo de Despachos Rotativos (El inicio del ciclo)
- **Concepto:** El administrador le asigna una **Meta (Tarea)** a la clase obrera (Empleados).
- **Lógica:** El sistema detecta cuánta meta falló el empleado la semana pasada (Deuda) y calcula la Materia Prima restando el saldo acumulado para entregar exactamente lo justo.
- **Formato Impreso:** Genera un voucher PDF con el membrete corporativo, indicando Kilos exactos a reclamar en almacén.

### Módulo de Recepción Abierta Matricial (L-S)
- **Concepto:** Los obreros ya no entregan todo de golpe. Entregan progresivamente de lunes a sábado.
- **UI:** Una hoja de cálculo gigante dentro del EJS que permite Inserciones Diarias de Cestas Físicas y Unidades de Tabacos.
- **Filtro Inteligente:** Para evitar saturar la tabla, el backend oculta a los fabriquines inactivos (Deuda = 0).

### Motor de Liquidación Semanal (Cierres)
- **Responsabilidad Crítica:** Ejecutar cruces financieros y actualizar Inventarios de Bodega.
- **Acción:** Suma todo lo del empleado en la semana y aplica los costos unitarios del sistema. Inserta la ganancia consolidada a la tabla `produccion_fabriquines` e inyecta la "Deuda" restante como pasivo biológico para la próxima semana.

---

## 🧮 6. Fórmulas Contables y Algoritmos (Versión 1.8)

**Tasa Base de Conversión** (Por cada **1000** Tabacos):
* 1.0 kg de Capa.
* 1.8 kg de Capote.
* 7.0 kg de Picadura.

**Avaluación Monetaria** (Precios FIJOS Sistema):
* Tabaco Sano Elaborado: $85 COP / ud.
* Retorno de Vena: $3,500 COP / Kg.
* Retorno de Recorte (Mermas): $6,500 COP / Kg.
* Sub-venta (Tabacos fabricados como extra, retornados enteros): $230 COP / ud.

---

## 🐞 7. Registro de Bugs Resueltos (Troubleshooting)

Este repositorio ha superado grandes retos técnicos. Aquí documentamos problemas anteriores y las soluciones actuales aplicadas al Core:

### BUG_01: Desdoblamiento de Materiales en Inventario (Duplicidad Visual)
- **Síntoma:** El Dashboard mostraba tres o cuatro bloques separados llamados "Tabacos".
- **Raíz del Problema:** En `server.js`, las recepciones de materiales usaban la función SDK de Supabase `.single()`. Cuando existían dos filas con un nombre similar, o la DB desfasaba los triggers, `.single()` causaba crash y disparaba el `.catch()` o el bloque alternativo, insertando un nuevo renglón clonado.
- **Solución Aplicada (V1.8.2):** Se creó un limpiador base en JS (`purgar.js`) que recorrió la nube agrupando nombres y sumando campos antes de borrar clones. Y en EJS (`inventario.ejs`), se re-escribió un agrupador `Array.reduce` del lado del cliente que detecta `i => i.material.toLowerCase().trim() === nombreM.trim()` y suma la variable `item.cantidad` dinámicamente. Esto garantiza una sola UI Card perpetuamente.

### BUG_02: Formularios HTML perdiendo Contextos de Variables (NaN en BD)
- **Síntoma:** Las sumatorias de deuda devolvían valores nulos en el cierre semanal.
- **Raíz:** En javascript, los formularios vacíos HTML entregaban `""` (Empty strings) al Backend Express en vez de numéricos, por lo tanto la base `parseInt("")` resultaba en `NaN`.
- **Solución Aplicada:** Envoltorios de saneamiento global: `|| 0`. Ej: `parseInt(req.body.lunes_tab) || 0`.

### BUG_03: El Modo Oscuro destrozando Formatos de Impresión
- **Síntoma:** Al darle imprimir (`ctrl + P`), el color negro del fondo ocultaba la tinta en el papel, haciendo impresiones ilegibles y fundiendo tóner.
- **Solución Aplicada:** Inyección de media queries `@media print { * { background: transparent !important; color: black !important; } }`. Desactiva el modo oscuro en la capa del Spooler de la Impresora.

## 🏁 8. Estado y Prácticas a Futuro
- **Status:** Sistema Totalmente Refactorizado, Operativo bajo Criterios de Gestión Corporativa Administrativa (Full Admin Control).
- **Control de Cambios:** A seguir manejando mediante ramas de control (Ej. V1.8.x para refinamientos sutiles, V1.9.0 para grandes despliegues de infraestructura).
