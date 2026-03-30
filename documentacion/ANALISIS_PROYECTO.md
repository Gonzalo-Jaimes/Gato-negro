# Análisis Arquitectónico y Documentación Técnica: Gato Negro ERP
## Sistema Avanzado de Gestión de Producción y Cierres Contables

**Versión Actual**: 2.3.0 (Estable - Producción)  
**Fecha de Actualización**: Finales de Marzo 2026  
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
- **V1.8.2:** Muerte del sistema de Pedidos Libres. Transición a Despacho Dirigido, Recepción Acumulativa Matricial (L-S) y Cierres de Nómina complejos.
- **V2.0.0:** Implementación de Seguridad Criptográfica (BCrypt) para todos los usuarios y blindaje del Login.
- **V2.1.0:** Desacople Contable. Creación del Módulo de Nómina para centralizar impresión de pagos e integrar Control de Lotes.
- **V2.2.0:** Motor Transaccional y Diferencial "En Vivo". Inteligencia matemática para inyectar al Kardex las Mermas, Cestas y Extras de Venta de forma instantánea. Control estricto transaccional anti-negativos (Sobregiros de stock).
- **V2.3.0 (Actual):** Módulo Analítico Financiero (BI) con renderizado dinámico `Chart.js` y Módulo Avanzado de Mantenimiento e Impresión QR Selectiva.
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

### BUG_04: Sistema de Inventario Físico Defasado (Solucionado en V2.2)
- **Síntoma:** Los Tabacos físicos, las cestas retornadas y las Mermas producidas por los fabriquines no se veían en la bodega maestra ni en el Kardex hasta que el Administrador diera clic en "Liquidar Semana" el día Sábado. Esto dejaba a la planta trabajando "a ciegas" de Lunes a Viernes.
- **Solución Aplicada:** Reescritura pura del código de Node (`/recepcion_diaria_guardar`). Se implementó lógica de cálculo **Transaccional Diferencial** para todos los inputs numéricos (Tabacos, Cestas, Extras, Recorte, Vena). Cada vez que se da click en "Guardar", el servidor deduce matemáticamente cuántos ítems **nuevos** se teclearon respecto al guardado anterior, e inyecta "Comprobantes Instantáneos" en el Kardex, manteniendo todos los stocks en la vida real.

### BUG_05: Fraude de Inventarios Negativos / Cestas Ficticias (Solucionado en V2.2)
- **Síntoma:** El sistema permitía "Despachar" Materia Prima (Capa, Capote) o Cestas de Colores que físicamente el sistema no detentaba, provocando existencias fantasma en la Base de Datos (Ej: Cestas Rojas = `-1`).
- **Solución Aplicada:** Inyección de barreras transaccionales pre-validatorias en el Backend. Antes de ejecutar la resta de Supabase, el sistema hace una ponderación local: si el saldo físico es menor a la meta del fabriquin, cancela todo el *Request* y dispara una alerta visual roja denegando el egreso.

---

## 🚀 8. Evolución Arquitectónica General (Serie V2.X)

### Módulo Administrativo de Nómina (Desacople Total)
Se extirpó la mala práctica de forzar a los almacenistas logísticos a manejar e imprimir Excel(s) y temas Salariales en plena rampa de bodega. Ahora el módulo de Recepción Diaria simplemente "Cierra/Liquida" la semana desde el punto de vista numérico, y dichas tirillas de cobro aterrizan en un panel exclusivo y silencioso de **`/nomina`**. Allí contabilidad mantiene el orden, agrupando los cierres y contando con botones limpios para Imprimir en PDF y "Archivar" finalmente los reportes luego de entregar los billetes. Todo este proceso es completamente asíncrono y desacoplado del almacén.

### Analítica de Calidad (Lotes Visibles)
Se incrustó un nuevo Dashboard secundario al fondo del Inventario llamado **"Lotes de Tabaco en Mesa"**. Este lee y formatea (DD/MM al DD/MM) incansablemente las bases de datos de recepción de la **semana activa cursante** para revelar frente al supervisor de calidad exactamente qué volúmenes de tabaco trajo cada Fabriquín al recinto de Envolvedoras, logrando una herramienta inigualable de auditoría al descubrir averías y rechazos.

---

## 🏁 9. Conclusión V2.2 (Enterprise-Ready)
- **Status:** Sistema Erradicado de Monolito Arcaico. Convertido en un **ERP Transaccional Completamente Escalable**. Protegido mediante criptografía BCrypt, con barreras lógicas de seguridad de inventario de nivel bancario, UX predictiva sin fisuras, e integraciones logísticas 100% aisladas del organigrama financiero. 

---

## 📊 10. Evolución Business Intelligence (Serie V2.3)

### Dashboard Analítico Centralizado
A raíz de políticas de seguridad financiera, todo el componente de *Inversión Monetaria* expuesto públicamente en Códigos QR de las máquinas de manufactura, fue extirpado de la vista pública y confinado al **Motor Analítico (Business Intelligence)**. Este motor asíncrono sumariza el inventario (`movimientos`), destila los balances absolutos de la `nómina_historica` pagada y contabiliza todos los repuestos averiados para brindar una sábana gigante de Big Data procesable en tiempo real a la gerencia, inyectado sobre `Chart.js`.

### Mantenimiento Extendido (UI/UX Select2 & Post-Limpieza)
El control industrial requería mayor flexibilidad interactiva. Se ancló la librería **Select2** para predecir nombres de máquinas reduciendo fricción (Scrolls), se tipificó el *Mantenimiento Autónomo (Limpieza Rutinaria)* permitiendo un trackeo histórico sin afectar el ciclo del mantenimiento preventivo pesado, y se creó la arquitectura de **Spool Mágico**. Ahora la interfaz `QR_Maquinas` inyecta Casillas Selectivas por cada dispositivo en el Dom, filtrando y pre-ocultando con el atributo `@media print` las fíchas irrelevantes y ahorrando consumibles de papel en oficina al oprimir imprimir.

- **Perspectiva Futura:** Fase 3 (Producción P2P: Expansión de deuda/entregas hacia Eslabones de Empaque / Anilladores). Integración con puntos de venta Directos.
