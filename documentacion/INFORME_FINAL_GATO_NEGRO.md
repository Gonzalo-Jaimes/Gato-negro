# DISEÑO E IMPLEMENTACIÓN DE UN SISTEMA WEB HÍBRIDO PARA LA AUTOMATIZACIÓN DEL CONTROL DE PRODUCCIÓN E INVENTARIO (ERP) EN LA FÁBRICA DE TABACOS GATO NEGRO

---

&nbsp;

&nbsp;

**GONZALO JAIMES BASTOS**

&nbsp;

&nbsp;

&nbsp;

**UNIVERSIDAD DE PAMPLONA**  
**FACULTAD DE INGENIERÍAS Y ARQUITECTURA**  
**PROGRAMA DE INGENIERÍA MECATRÓNICA**  
**VILLA DEL ROSARIO, NORTE DE SANTANDER**  
**2026**

---

&nbsp;

&nbsp;

# DISEÑO E IMPLEMENTACIÓN DE UN SISTEMA WEB HÍBRIDO PARA LA AUTOMATIZACIÓN DEL CONTROL DE PRODUCCIÓN E INVENTARIO (ERP) EN LA FÁBRICA DE TABACOS GATO NEGRO

&nbsp;

**GONZALO JAIMES BASTOS**

&nbsp;

*Informe de Proyecto de Grado presentado como requisito parcial para optar al título de Ingeniero Mecatrónico*

&nbsp;

**Directores:**  
**Ing. DAIRON SALCEDO**  
**Ing. JEISSON MARTÍNEZ**  
*Ingenieros Mecatrónicos*

&nbsp;

&nbsp;

**UNIVERSIDAD DE PAMPLONA**  
**FACULTAD DE INGENIERÍAS Y ARQUITECTURA**  
**PROGRAMA DE INGENIERÍA MECATRÓNICA**  
**VILLA DEL ROSARIO, NORTE DE SANTANDER**  
**2026**

---

## NOTA DE ACEPTACIÓN

&nbsp;

_________________________________  
Firma del Director: Ing. Dairon Salcedo

&nbsp;

_________________________________  
Firma del Codirector: Ing. Jeisson Martínez

&nbsp;

_________________________________  
Firma del Jurado

&nbsp;

Villa del Rosario, Norte de Santander, Marzo de 2026

---

## DEDICATORIA

A la Fábrica de Tabacos Gato Negro, a su equipo humano de supervisores, licenciadas contables e ingenieras industriales, cuya labor diaria inspiró cada línea de código de este sistema.

A mis tutores Ing. Dairon Salcedo e Ing. Jeisson Martínez, por su guía académica y su confianza en este proyecto de transformación digital.

---

## AGRADECIMIENTOS

Al Señor Gregorio y al equipo administrativo de Gato Negro, por abrir las puertas de la empresa y brindar toda la información logística y contable necesaria para el levantamiento de requerimientos.

A la Universidad de Pamplona, Sede Villa del Rosario, por proveer la formación técnica y científica base de esta intervención.

A los Ingenieros Dairon Salcedo y Jeisson Martínez, directores del proyecto, por su permanente orientación metodológica y técnica durante el proceso investigativo.

---

## TABLA DE CONTENIDO

1. [Introducción y Contexto](#1-introducción-y-contexto)  
   1.1 [Situación Problemática y Diagnóstico Inicial](#11-situación-problemática-y-diagnóstico-inicial)  
   1.2 [Objetivos de la Intervención](#12-objetivos-de-la-intervención)  
2. [Justificación](#2-justificación)  
3. [Marco Teórico y Referencial](#3-marco-teórico-y-referencial)  
4. [Planteamiento del Problema](#4-planteamiento-del-problema)  
5. [Diseño Arquitectónico y Metodología](#5-diseño-arquitectónico-y-metodología)  
   5.1 [Metodología de Desarrollo](#51-metodología-de-desarrollo)  
   5.2 [Lógica Algebraica Corporativa (Reglas de Negocio)](#52-lógica-algebraica-corporativa-reglas-de-negocio)  
   5.3 [Diagrama del Ecosistema Transaccional](#53-diagrama-del-ecosistema-transaccional)  
6. [Desarrollo Funcional e Implementación (V1.0 – V2.4)](#6-desarrollo-funcional-e-implementación-v10--v24)  
   6.1 [Módulo Predictivo de Mantenimiento de Máquinas](#61-módulo-predictivo-de-mantenimiento-de-máquinas)  
   6.2 [Módulo de Despacho y Fabriquines](#62-módulo-de-despacho-y-fabriquines)  
   6.3 [Módulo de Recepción Diaria y Subproductos](#63-módulo-de-recepción-diaria-y-subproductos)  
   6.4 [Módulo de Nómina Contable](#64-módulo-de-nómina-contable)  
   6.5 [Módulo de Inventario Global y Kardex](#65-módulo-de-inventario-global-y-kardex)  
   6.6 [Módulo de Historial y Trazabilidad Logística](#66-módulo-de-historial-y-trazabilidad-logística)  
   6.7 [Dashboard Analítico BI](#67-dashboard-analítico-bi)  
   6.8 [Sistema de Fichas Técnicas y Códigos QR](#68-sistema-de-fichas-técnicas-y-códigos-qr)  
   6.9 [Reestructuración Modular del Menú (Fase 3)](#69-reestructuración-modular-del-menú-fase-3)  
7. [Análisis de Resultados y Troubleshooting](#7-análisis-de-resultados-y-troubleshooting)  
8. [Conclusiones](#8-conclusiones)  
9. [Recomendaciones](#9-recomendaciones)  
10. [Glosario](#10-glosario)  
11. [Referencias Bibliográficas](#11-referencias-bibliográficas)  
12. [Anexos Visuales](#-anexos-visuales-del-desarrollo-conjunto)  

---

## LISTA DE FIGURAS

| Figura | Descripción | Sección |
|--------|-------------|---------|
| Fig. 1–7 | Capturas del Módulo de Mantenimiento Predictivo (V1.x) | §6.1 |
| Fig. 8–14 | Capturas del Módulo de Recepción Diaria y Fabriquines (V1.8) | §6.2–6.3 |
| Fig. 15–23 | Capturas del Inventario Global y Kardex Transaccional (V2.2) | §6.5 |
| Fig. 24–29 | Capturas del Módulo de Nómina y Liquidación Semanal (V2.1) | §6.4 |
| Fig. 30–35 | Capturas del Sistema de Fichas Técnicas y Códigos QR (V1.8) | §6.8 |
| Fig. 36–43 | Documentación base: Excels y registros previos al ERP | §4 |
| Fig. 44–55 | Dashboard Analítico BI con Chart.js (V2.3) | §6.7 |
| Fig. 56–69 | Fase 3 – Menú Modular e Historial de Entregas (V2.4) | §6.6–6.9 |

---

## RESUMEN

El presente informe documenta el proceso de modernización tecnológica e implementación de un sistema web integral tipo **ERP (Enterprise Resource Planning)** para la *Fábrica de Tabacos Gato Negro*, ubicada en la zona industrial del municipio de Villa del Rosario, Norte de Santander. Se aborda la problemática inicial caracterizada por una profunda desincronización administrativa, el uso de hojas de cálculo aisladas en Excel y un software *legacy* de escritorio (Anubis), los cuales generaban cuellos de botella críticos y dependencias humanas en el supervisor general.

La solución desarrollada utiliza una arquitectura web basada en **Node.js**, **Express.js** y **Supabase (PostgreSQL)**, apuntando hacia una futura estructura de sincronización híbrida (Offline/Online) dadas las limitantes de conectividad en planta. El sistema alcanzó la versión **V2.4** en producción activa, integrando módulos de: Inventario Global con motor transaccional, Nómina contable descentralizada, Mantenimiento predictivo de máquinas con QR, Recepción diaria de fabriquines, Historial de trazabilidad logística Big Data, y un Dashboard Analítico BI con gráficas dinámicas.

**Palabras clave:** ERP, Node.js, Automatización, MVC, Manufactura, Supabase, Offline-First, Mecatrónica Industrial.

---

**ABSTRACT**

This report documents the technological modernization and full implementation of an ERP (Enterprise Resource Planning) web system for Fábrica de Tabacos Gato Negro. The initial situation was characterized by deep administrative desynchronization, isolated Excel spreadsheets, and a legacy desktop software (Anubis), generating critical bottlenecks and centralized human dependencies. The solution is built on Node.js, Express.js, and Supabase (PostgreSQL) with a hybrid Offline/Online synchronization architecture. Version V2.4 is currently live in production, integrating Global Inventory, Payroll, Predictive Maintenance with QR Codes, Daily Receiving, Logistics Traceability History, and a BI Analytics Dashboard.

**Keywords:** ERP, Node.js, Automation, MVC, Manufacturing, Supabase, Offline-First, Mechatronic Engineering.

---

## 1. Introducción y Contexto

Históricamente, la Fábrica de Tabacos Gato Negro ha mantenido un control riguroso de su inventario y producción, pero operando bajo un modelo tecnológico obsoleto y altamente centralizado. El control de la logística, la entrada y salida de materia prima, y los cálculos de producción recaían casi en su totalidad sobre el supervisor general, quien procesaba esta información mediante hojas de cálculo en Excel y un software de base de datos de escritorio *legacy* (Anubis), alojado en un solo equipo local.

Aunque este método lograba mantener los números al día, generaba fricciones operativas significativas que limitaban fuertemente la escalabilidad de la empresa y la comunicación transparente entre los diferentes departamentos administrativos y de planta.

### 1.1 Situación Problemática y Diagnóstico Inicial

* **Silos de Información Interdepartamental:** El personal de gerencia administrativa (Licenciada Omaira, equipo de tesorería e Ingeniera Industrial) no tiene visibilidad en tiempo real de los procesos de bodega hasta que el supervisor exporta e imprime datos manualmente los fines de semana.  
* **Centralización Operativa (Cuello de Botella):** El supervisor debe realizar en la mente y apuntes manuales todas las sumas y desdoblamientos matemáticos de materias primas que ingresan y salen durante las tandas de producción masivas.  
* **Gestión Manual de Subproductos:** Los retornos como Vena y Recorte se controlan correctamente, pero el proceso era completamente manual: el operario entrega el peso, se anota en Excel, y se entrega un voucher recortado con tijera. Funcional pero ineficiente para un equipo de 47+ trabajadores.  
* **Vulnerabilidad ante la Conectividad:** Al migrar a plataforma web, existe el riesgo de detener producciones si ocurre caída de internet ISP en la zona industrial. El sistema debe concebirse como arquitectura híbrida con capacidad Offline.

### 1.2 Objetivos de la Intervención

**Objetivo General:**  
Desarrollar e implementar una plataforma web ERP para la automatización total del control de producción e inventarios, eliminando los silos de información y modernizando la infraestructura tecnológica de la Fábrica de Tabacos Gato Negro.

**Objetivos Específicos:**
1. Integrar verticalmente los departamentos de bodega y administración en una base de datos centralizada, propiciando flujo de decisiones en tiempo real.
2. Diseñar los cimientos de una arquitectura de sincronización híbrida (Local/Nube) garantizando continuidad operativa ante cortes de internet.
3. Digitalizar y encriptar la facturación cruzada de deudas prestacionales de empleados y cobros de mermas/subproductos, erradicando el comprobante en papel.
4. Implementar un submódulo analítico con Códigos QR para la vigilancia del mantenimiento industrial del taller despalillador.
5. Desarrollar un sistema de trazabilidad histórica de entregas por fabriquín, buscable por empleado, fecha y estado de liquidación.

---

## 2. Justificación

La adopción de tecnologías web en empresas del sector manufacturero colombiano representa un paso obligado para su competitividad en el mediano y largo plazo. En el contexto particular de Gato Negro, la intervención se justifica por:

* **Impacto Económico Directo:** La digitalización del inventario evita pérdidas por descuadres de Kardex que antes solo se detectaban al final de cada semana.  
* **Rigor Laboral:** El sistema garantiza el cálculo matemático exacto de las deudas de tabacos por fabriquín, eliminando errores humanos en las entregas de materia prima y en los descuentos de merma (Vena y Recorte).  
* **Escalabilidad Industrial:** La arquitectura modular diseñada permite incorporar nuevas áreas productivas (Anilladores, Envolvedoras, Empacadores) sin reescribir el núcleo del sistema.  
* **Descentralización Contable:** El equipo de tesorería puede auditar nóminas, pagos y rezagos desde cualquier dispositivo sin depender del supervisor logístico.  
* **Pertinencia Mecatrónica:** La integración de sensores informáticos (lectores QR, impresoras POS, bases de datos serverless) junto a la lógica de control de procesos industriales constituye un caso de estudio genuinamente mecatrónico.

---

## 3. Marco Teórico y Referencial

* **Sistemas ERP y Planificación de Manufactura:** Los *Enterprise Resource Planning* son sistemas estructurales cuyo núcleo gravita en la centralización contable, logística y de Recursos Humanos. Instauran el teorema de *SSOT (Single Source Of Truth)*, garantizando que jamás existan dos reportes con cifras discordantes en la misma fecha.

* **Arquitectura de Software MVC (Modelo-Vista-Controlador):** Patrón histórico en el desarrollo de software relacional. Facilita el desarrollo, prueba y mantenimiento aislando estrictamente la fachada visual EJS (*Vista*), la lógica matemática Express (*Controlador*) y la base de datos PostgreSQL (*Modelo*).

* **Tecnologías Centrales (Node.js & Express.js):** Node.js posibilita correr JavaScript directamente en servidores en un comportamiento asíncrono y de un solo hilo, altamente resistente a caídas. Express.js regula el enrutamiento de peticiones HTTP semánticas (`GET`/`POST`). EJS alimenta las vistas del lado del servidor.

* **Sistemas Relacionales en la Nube (Supabase / PostgreSQL):** El servicio *Database As A Service Cloud* ofrecido por Supabase otorga concurrencia, índices de encriptación severa e integridad de campos ante ataques externos. Supera ampliamente las limitantes de SQLite local.

* **Arquitectura Offline-First / PWA:** En contextos industriales rurales, la interfaz debe funcionar bajo caché embebida (IndexedDB / Local Caching). Cuando la red local colapsa, Gato Negro continúa operando; al restablecer internet, los registros pendientes se sincronizan con Supabase mediante *workers* asíncronos en background.

* **Criptografía de Backend (BCrypt):** Técnica de *Key Derivation* con múltiples rondas de *Salting y Hashing* sobre contraseñas, haciéndolas imposibles de revertir o leer desde la base de datos.

* **Visualización de Datos BI (Chart.js):** Librería JavaScript para renderizado dinámico de gráficas financieras. Permite a los administradores interpretar visualmente KPIs de producción, consumo de materias primas y costos de mantenimiento sin exportar a Excel.

---

## 4. Planteamiento del Problema

La Fábrica de Tabacos Gato Negro, con más de 47 operarios activos entre fabriquines, anilladores, envolvedoras y empacadores, opera en un entorno donde la toma de decisiones administrativas depende de un flujo de información que hasta la intervención de este proyecto era:

1. **Tardío:** La información de producción tardaba entre 3 y 7 días en llegar a la administración central, impidiendo decisiones en tiempo real.
2. **Centralizado:** Un único supervisor concentraba toda la cadena de información logística, convirtiéndose en un *single point of failure* crítico.
3. **Propenso a Error:** Los cálculos manuales de Capa, Capote, Picadura, Vena y Recorte por empleado generaban discrepancias frecuentes en los pagos semanales.
4. **Opaco Contablemente:** Las licenciadas de contabilidad y la ingeniera industrial carecían de visibilidad sobre el inventario real de materias primas, imposibilitando la planificación de compras y la auditoria de costos.

La formulación del problema central es: **¿Cómo puede un sistema web ERP modular eliminar los cuellos de botella logísticos y los silos de información interdepartamental en la Fábrica de Tabacos Gato Negro, garantizando además la continuidad operativa ante interrupciones de conectividad?**

---

## 5. Diseño Arquitectónico y Metodología

### 5.1 Metodología de Desarrollo

El proyecto se ejecutó bajo la metodología **Agile / Scrum**, con iteraciones semanales orientadas a entrega de valor funcional. Esto garantizó la integración escalonada de módulos sin fracturar las operaciones simultáneas ni obligar al cierre temporal de la empresa.

Cada sprint cubría el ciclo completo: levantamiento de requerimientos → diseño de base de datos → programación → prueba en ambiente de desarrollo → despliegue en producción (Vercel + Supabase). El control de versiones se realizó mediante Git, con despliegue continuo (CI/CD) en Vercel Edge Network.

### 5.2 Lógica Algebraica Corporativa (Reglas de Negocio)

Cada endpoint del sistema está dictaminado bajo las normativas orgánicas establecidas internamente en Gato Negro. Tasa aplicativa sobre cada **1,000 tabacos** producidos:

| Material | Constante por 1,000 tabs |
|----------|--------------------------|
| Capa (hoja exterior) | 1.0 Kg |
| Capote (hoja intermedia) | 1.8 Kg |
| Picadura (relleno) | 7.0 Kg |
| Cestas plásticas | 1 cesta / 1,250 tabacos |
| Precio base de empaque por tabaco | $85 COP |
| Merma Recorte (compra a operario) | $6,500 COP/Kg |
| Merma Vena (compra a operario) | $3,500 COP/Kg |
| Cesta plástica (penalización si se pierde) | $225,000 COP |

### 5.3 Diagrama del Ecosistema Transaccional

```text
┌─────────────────────────────────────────────────────────────┐
│                    NAVEGADOR DEL USUARIO                    │
│           (HTML5 + CSS Vanilla + Dark Mode EJS)             │
└─────────────────────┬──────────────────▲────────────────────┘
                 (1) HTTP POST        (5) Renderizado EJS
┌─────────────────────▼──────────────────┴────────────────────┐
│                    NODO LOCAL (EXPRESS.JS)                  │
│  - Sesiones encriptadas BCrypt                              │
│  - Controladores V2.4 (Motor Transaccional Anti-Negativos)  │
│  - Motor de Reportes PDF / Excel                           │
└─────────────────────┬──────────────────▲────────────────────┘
                 (2) API Push         (4) Data Response
┌─────────────────────▼──────────────────┴────────────────────┐
│              CAPA DE SINCRONIZACIÓN HÍBRIDA                 │
│    (IndexedDB Caché Local / Pila Encolada Offline-First)    │
└─────────────────────┬──────────────────▲────────────────────┘
                 (3) RESTful / Supabase SDK Async
┌─────────────────────▼──────────────────┴────────────────────┐
│            SUPABASE CLOUD (POSTGRES DB SERVERLESS)          │
│  » inventario            » nomina_central                   │
│  » recepcion_diaria      » movimientos (Kardex/Auditor)     │
│  » empleados_fabriquines » mantenimiento_talleres           │
│  » maquinas              » accesos_usuarios                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Desarrollo Funcional e Implementación (V1.0 – V2.4)

Todo lo documentado en este capítulo concierne a los módulos actualmente en **producción estable operativa** en la plataforma Gato Negro ERP V2.4.

### 6.1 Módulo Predictivo de Mantenimiento de Máquinas

Se desplegó un tablero de inventario de máquinas despalilladoras. Cada máquina recibió una etiqueta *sticker QR*, que al ser escaneada con un dispositivo móvil dirige al mecánico a una ficha técnica digital donde puede asentar bitácoras con: tipo de intervención (preventivo/correctivo), descripción de la falla, repuestos instalados y costo de la reparación. Funciones destacadas:

* Búsqueda por nombre o código al momento de registrar órdenes de trabajo.
* **Mantenimiento Autónomo:** Registro de limpiezas post-producción (picadura acumulada en máquinas tras jornadas largas).
* Impresión QR selectiva: el administrador puede marcar con checkbox exactamente las máquinas que necesita imprimir, evitando generar resmas innecesarias.
* **Blindaje financiero:** Los costos de mantenimiento solo son visibles para roles administrativos y el Dashboard BI. Las fichas QR públicas no exponen los valores invertidos por máquina.

*Ver Figuras 1–7 en sección de Anexos.*

### 6.2 Módulo de Despacho y Fabriquines

El módulo reemplazó el proceso manual de entrega de materia prima a fabriquines. El supervisor busca al empleado por código (F01, F10) o nombre mediante un **campo de búsqueda con filtrado en tiempo real**, selecciona la cantidad de tabacos a asignar y el sistema:

1. Calcula automáticamente los kilogramos de Capa, Capote y Picadura a extraer de bodega.
2. Sugiere la cantidad de cestas físicas a prestar (1 cesta cada 1,250 tabacos).
3. Genera e imprime automáticamente un **Formato de Despacho** con los datos del fabriquín, fecha, saldo anterior y nueva deuda total.
4. Inyecta los movimientos de descuento al Kardex de Inventario en tiempo real.

*Ver Figuras 8–14 en sección de Anexos.*

### 6.3 Módulo de Recepción Diaria y Subproductos

Activo de lunes a sábado, este módulo gestiona las devoluciones diarias. El supervisor selecciona al fabriquín y registra:

* Tabacos producidos devueltos (que descuentan su deuda).
* Cestas devueltas (que actualizan el inventario de cestas físicas en bodega).
* Peso de Recorte en Kg (merma que se compra al fabriquín a $6,500/Kg e inyecta al inventario).
* Peso de Vena en Kg (merma comprada a $3,500/Kg e inyectada al inventario).

Motor anti-spam implementado: el sistema bloquea recepciones duplicadas en el mismo minuto para el mismo fabriquín, evitando el doble registro.

*Ver Figuras 8–14 en sección de Anexos.*

### 6.4 Módulo de Nómina Contable

Bajo la V2.1, al liquidar un fabriquín el sábado, los datos salariales migran automáticamente al módulo `/nomina`, reservado para la Licenciada Omaira. Ella puede:

* Revisar el monto a pagar a cada operario.
* Auditar los rezagos (deudas de vales o adelantos previos).
* Otorgar nuevos vales/adelantos cargables a la deuda.
* Generar e imprimir el comprobante PDF oficial de la semana.
* Cerrar la nómina como *"Archivada"* para que pase al historial contable.

*Ver Figuras 24–29.*

### 6.5 Módulo de Inventario Global y Kardex

El inventario consolida en tiempo real todos los materiales de bodega. El motor transaccional V2.2 realiza el siguiente ciclo por cada despacho o recepción:

1. Calcula el diferencial entre stock actual y movimiento.
2. Verifica que el resultado no sea negativo (bloqueo anti-sobregiro).
3. Inyecta el movimiento como registro en la tabla `movimientos` (Kardex de auditoría).
4. Actualiza el campo `cantidad_actual` en `inventario`.

El inventario muestra las categorías: Cestas (Azules, Negras, Rojas), Tabacos (Normales, Anillados), Materia Prima (Capa, Capote, Vena, Recorte, Material), y Empaque (Papel Envoltura).

*Ver Figuras 15–23.*

### 6.6 Módulo de Historial y Trazabilidad Logística

Creado en la **Fase 3 (V2.4)**, este módulo extrae la información de entregas del inventario y la presenta en una tabla dedicada de auditoría. Funcionalidades:

* Búsqueda en tiempo real por nombre de fabriquín, semana, fecha o estado.
* Columnas: Fabriquín, Semana (rango de fechas), Tabacos producidos, Cestas devueltas, Recorte acumulado (Kg), Vena acumulada (Kg), Estado.
* Estados: **"Semana Abierta (Sin Liquidar)"** para semanas activas, **"✔ Liquidada y Pagada"** para semanas cerradas.
* Compatible con cualquier estado de base de datos (no solo el string `"liquidado"` sino cualquier valor diferente de `"pendiente"`).

*Ver Figuras 56–69.*

### 6.7 Dashboard Analítico BI

Panel exclusivo para administradores que visualiza con **Chart.js** los KPIs críticos de la operación:

* Gráfica de líneas: evolución semanal de tabacos recibidos.
* Gráfica de barras: consumo de materias primas por período.
* Gráfica circular (Pie): distribución de mermas (Vena vs. Recorte).
* Indicadores de costos de mantenimiento por máquina (solo visible para admin).
* Filtros por rango de fechas.

*Ver Figuras 44–55.*

### 6.8 Sistema de Fichas Técnicas y Códigos QR

Cada máquina del taller despalillador tiene un código QR único generado por el sistema. El módulo `/maquinas/qrs` permite:

* Buscar máquinas por nombre o código.
* Seleccionar individualmente cuáles QR imprimir mediante checkboxes.
* Imprimir fichas técnicas públicas (sin costos) y fichas administrativas completas.
* La ficha técnica pública incluye: descripción de la máquina, bitácoras de mantenimiento, fecha de último servicio, pero **NO los costos invertidos**.

*Ver Figuras 30–35.*

### 6.9 Reestructuración Modular del Menú (Fase 3)

La versión V2.4 introduce un menú lateral completamente rediseñado, organizado por áreas industriales:

| Sección | Descripción |
|---------|-------------|
| 🏢 Central de Negocios | Inventario, Movimientos, Nómina, BI, Empleados |
| 🏭 Área Fabriquines | Despacho, Recepción Diaria, Historial |
| 💍 Área Anilladores | (En desarrollo) |
| 🍬 Área Empacado | Recepción de Empaque Físico |
| ⚙️ Mantenimiento | Máquinas, Órdenes de Trabajo, QR |
| 🔐 Accesos | Usuarios del Sistema |

El menú es **colapsable mediante acordeones** y guarda **memoria posicional dinámica**: al navegar entre páginas, el panel correspondiente se mantiene abierto automáticamente mediante JavaScript.

*Ver Figuras 56–69.*

---

## 7. Análisis de Resultados y Troubleshooting

El proceso de desarrollo demandó superar diversas fracturas técnicas. Se documentan los casos más relevantes:

### Caso 01 – Desdoblamiento de Materiales en el Inventario
**Descripción:** Supabase retornaba registros duplicados del mismo material con capitalización diferente ("Capa" vs "capa"), destruyendo la vista agregada.  
**Solución:** Controlador `Array.reduce` con normalización `i.toLowerCase().trim()` sobre los códigos DOM. Resultado: consolidación correcta de todos los materiales.

### Caso 02 – Valores No Numéricos (`NaN`) en Cálculos de Nómina
**Descripción:** Si el supervisor enviaba campos vacíos accidentalmente (Tab + Enter), el servidor Express.js crasheaba los cálculos de pago.  
**Solución:** Sanitización: `parseFloat(req.body.valor) || 0`, forzando un valor neutro ante entradas vacías.

### Caso 03 – Incompatibilidad del Modo Oscuro con la Impresora POS
**Descripción:** Las facturas térmicas salían negras por el background oscuro de la aplicación.  
**Solución:** Directiva CSS `@media print { * { background: transparent !important; color: black !important; } }`.

### Caso 04 – Estados Inconsistentes en Base de Datos Histórica
**Descripción:** Semanas antiguas en Supabase tenían el estado `"pagado_y_archivado"` en lugar de `"liquidado"`, por lo que la vista de historial no las reconocía como pagadas.  
**Solución:** Cambio de la lógica de comparación de `=== 'liquidado'` a `!== 'pendiente'`, detectando como cerrada cualquier semana con estado diferente de pendiente.

### Caso 05 – Cálculo Erróneo de Cestas por Despacho
**Descripción:** La fórmula original usaba `Math.ceil(tabacos / 1000)`. La regla real de Gato Negro es 1,250 tabacos por cesta.  
**Solución:** Actualización de la constante: `Math.ceil(tabacos / 1250)`.

---

## 8. Conclusiones

1. La implementación del ERP Gato Negro V2.4 eliminó efectivamente el cuello de botella informativo que recaía sobre el supervisor general, descentralizando el acceso a datos críticos hacia el equipo administrativo.
2. El motor transaccional anti-negativos garantiza la integridad del inventario en tiempo real, evitando sobredespachos de materias primas sin stock físico en bodega.
3. La arquitectura modular por áreas (Fabriquines, Anilladores, Empacadoras) sienta las bases para la incorporación futura de nuevos departamentos sin reescribir el núcleo del sistema.
4. El sistema de trazabilidad histórica permite auditar con precisión todas las entregas por fabriquín, semana y estado de liquidación, proveyendo evidencia contable inmutable.
5. La separación entre ficha técnica pública (QR) y panel administrativo protege la confidencialidad de los costos de inversión en mantenimiento.
6. La migración de Anubis a Node.js/Supabase representa un salto generacional en la infraestructura tecnológica de la empresa, pasando de un sistema local sin backups a uno cloud-nativo con alta disponibilidad.

---

## 9. Recomendaciones

1. **Implementar la Arquitectura Offline-First (Prioridad Alta):** Instalar ServiceWorkers en los módulos de Recepción y Despacho para garantizar operabilidad durante cortes de internet. Es el reto técnico pendiente más crítico.
2. **Expandir el módulo de Anilladores (Prioridad Media):** Con la estructura modular del menú ya establecida, el siguiente eslabón industrial a digitalizar es el control de anillado, incluyendo consumo de bobinas, adhesivos y goma.
3. **Integrar módulo de Empacadores y SKU de salida (Prioridad Media):** Crear la interfaz de cartones/cajas para descontar empaladoras y generar SKUs de inventario para venta mayorista.
4. **Realizar backups programados de Supabase (Prioridad Alta):** Configurar exportaciones periódicas automáticas de las tablas críticas a almacenamiento local o Google Drive.
5. **Capacitación del equipo administrativo:** Programar sesiones de entrenamiento para que la totalidad del personal administrativo use el sistema de forma autónoma.
6. **Evaluar migración a PWA certificada:** Para mejorar la experiencia en dispositivos móviles de los supervisores de planta.

---

## 10. Glosario

| Término | Definición |
|---------|-----------|
| **ERP** | Enterprise Resource Planning. Sistema de gestión empresarial integrado. |
| **Fabriquín** | Trabajador artesanal que manufactura tabacos a mano dentro de la fábrica. |
| **Kardex** | Registro sistemático de entradas y salidas de inventario. |
| **Vena** | Subproducto de la hoja de tabaco (nervio central). Se compra al fabriquín como merma. |
| **Recorte** | Excedente de hoja de tabaco generado en la manufactura. Se compra al fabriquín como merma. |
| **Cesta** | Recipiente plástico estandarizado en el que se almacenan los tabacos durante la producción. |
| **Rezago** | Deuda de un fabriquín con la empresa por material no devuelto o adelantos de nómina. |
| **Nómina Semanal** | Liquidación de pagos de producción de lunes a sábado por cada fabriquín. |
| **Despalilladora** | Máquina industrial del taller que separa la vena de la hoja de tabaco. |
| **Supabase** | Plataforma cloud de base de datos PostgreSQL serverless con API REST. |
| **BCrypt** | Algoritmo criptográfico de derivación de clave para protección de contraseñas. |
| **QR** | Código de respuesta rápida (Quick Response). Etiqueta 2D escaneable con cámara. |
| **Offline-First** | Arquitectura de software que prioriza el funcionamiento sin conexión a internet. |
| **IndexedDB** | Base de datos local del navegador para almacenamiento offline de grandes volúmenes. |
| **Kardex Anti-Negativos** | Motor transaccional que impide que el stock de un material caiga por debajo de cero. |
| **BI** | Business Intelligence. Análisis visual de datos empresariales para toma de decisiones. |
| **SKU** | Stock Keeping Unit. Unidad mínima de inventario de producto terminado para venta. |
| **MVC** | Modelo-Vista-Controlador. Patrón arquitectónico de separación de responsabilidades. |

---

## 11. Referencias Bibliográficas

* Express.js documentation. (n.d.). *Fast, minimalist web framework for Node.js*. Recuperado de https://expressjs.com/  
* Joyent. (n.d.). *Node.js documentation (Open-source, cross-platform JavaScript runtime)*. Recuperado de https://nodejs.org/  
* Pressman, R. S. (2010). *Ingeniería del Software: un enfoque práctico* (7.a ed.). McGraw Hill.  
* Supabase. (n.d.). *PostgreSQL Remote Database Docs*. Recuperado de https://supabase.com/docs  
* Vercel Cloud Network. (n.d.). *Develop, preview, ship*. Recuperado de https://vercel.com/docs  
* Chart.js. (n.d.). *Simple yet flexible JavaScript charting library*. Recuperado de https://www.chartjs.org/docs/  
* Icontec. (2018). *Norma Técnica Colombiana NTC 1486: Documentación, presentación de tesis, trabajos de grado y otros trabajos de investigación*. Instituto Colombiano de Normas Técnicas.  
* Universidad de Pamplona. (2024). *Reglamento de Trabajos de Grado – Facultad de Ingenierías y Arquitectura*. Villa del Rosario.  

---

## 📸 Anexos Visuales del Desarrollo Conjunto

> Capturas de pantalla organizadas cronológicamente por módulo funcional. Cada figura corresponde al estado real de la plataforma en su momento de desarrollo e implementación.

### 🔧 Módulo de Mantenimiento Predictivo de Máquinas (V1.x)

**Figura 1** — *media__1773943931277.png*

![Figura 1](anexos/media__1773943931277.png)

**Figura 2** — *media__1773946090234.png*

![Figura 2](anexos/media__1773946090234.png)

**Figura 3** — *media__1773946414831.png*

![Figura 3](anexos/media__1773946414831.png)

**Figura 4** — *media__1773946515336.png*

![Figura 4](anexos/media__1773946515336.png)

**Figura 5** — *media__1773950633203.png*

![Figura 5](anexos/media__1773950633203.png)

**Figura 6** — *media__1773951085918.png*

![Figura 6](anexos/media__1773951085918.png)

**Figura 7** — *media__1773951731273.png*

![Figura 7](anexos/media__1773951731273.png)

---

### ⚖️ Módulo de Recepción Diaria y Fabriquines (V1.8)

**Figura 8** — *media__1773963063176.png*

![Figura 8](anexos/media__1773963063176.png)

**Figura 9** — *media__1773964418216.png*

![Figura 9](anexos/media__1773964418216.png)

**Figura 10** — *media__1773964903973.png*

![Figura 10](anexos/media__1773964903973.png)

**Figura 11** — *media__1773964933431.png*

![Figura 11](anexos/media__1773964933431.png)

**Figura 12** — *media__1773965197343.png*

![Figura 12](anexos/media__1773965197343.png)

**Figura 13** — *media__1773965216478.png*

![Figura 13](anexos/media__1773965216478.png)

**Figura 14** — *media__1773965631334.png*

![Figura 14](anexos/media__1773965631334.png)

---

### 📦 Inventario Global y Motor Transaccional Kardex (V2.2)

**Figura 15** — *media__1774148818316.png*

![Figura 15](anexos/media__1774148818316.png)

**Figura 16** — *media__1774148823856.png*

![Figura 16](anexos/media__1774148823856.png)

**Figura 17** — *media__1774148851383.png*

![Figura 17](anexos/media__1774148851383.png)

**Figura 18** — *media__1774156382011.png*

![Figura 18](anexos/media__1774156382011.png)

**Figura 19** — *media__1774157671244.png*

![Figura 19](anexos/media__1774157671244.png)

**Figura 20** — *media__1774157683936.png*

![Figura 20](anexos/media__1774157683936.png)

**Figura 21** — *media__1774157696414.png*

![Figura 21](anexos/media__1774157696414.png)

**Figura 22** — *media__1774157739916.png*

![Figura 22](anexos/media__1774157739916.png)

**Figura 23** — *media__1774157763823.png*

![Figura 23](anexos/media__1774157763823.png)

---

### 💰 Módulo de Nómina Contable y Liquidación Semanal (V2.1)

**Figura 24** — *media__1774158267250.png*

![Figura 24](anexos/media__1774158267250.png)

**Figura 25** — *media__1774158320814.png*

![Figura 25](anexos/media__1774158320814.png)

**Figura 26** — *media__1774158350516.png*

![Figura 26](anexos/media__1774158350516.png)

**Figura 27** — *media__1774158389640.png*

![Figura 27](anexos/media__1774158389640.png)

**Figura 28** — *media__1774158422105.png*

![Figura 28](anexos/media__1774158422105.png)

**Figura 29** — *media__1774158700383.png*

![Figura 29](anexos/media__1774158700383.png)

---

### 🖨️ Sistema de Fichas Técnicas y Códigos QR (V1.8)

**Figura 30** — *media__1774159335926.png*

![Figura 30](anexos/media__1774159335926.png)

**Figura 31** — *media__1774159400908.png*

![Figura 31](anexos/media__1774159400908.png)

**Figura 32** — *media__1774159430273.png*

![Figura 32](anexos/media__1774159430273.png)

**Figura 33** — *media__1774159469964.png*

![Figura 33](anexos/media__1774159469964.png)

**Figura 34** — *media__1774159906243.png*

![Figura 34](anexos/media__1774159906243.png)

**Figura 35** — *media__1774159963873.png*

![Figura 35](anexos/media__1774159963873.png)

---

### 📊 Documentación Base: Excels y Registros Previos al ERP

**Figura 36** — *media__1774319598444.jpg*

![Figura 36](anexos/media__1774319598444.jpg)

**Figura 37** — *media__1774319619271.png*

![Figura 37](anexos/media__1774319619271.png)

**Figura 38** — *media__1774319671345.png*

![Figura 38](anexos/media__1774319671345.png)

**Figura 39** — *media__1774319723211.png*

![Figura 39](anexos/media__1774319723211.png)

**Figura 40** — *media__1774322412517.png*

![Figura 40](anexos/media__1774322412517.png)

**Figura 41** — *media__1774322441916.png*

![Figura 41](anexos/media__1774322441916.png)

**Figura 42** — *media__1774322688064.png*

![Figura 42](anexos/media__1774322688064.png)

**Figura 43** — *media__1774322831541.png*

![Figura 43](anexos/media__1774322831541.png)

---

### 📈 Dashboard Analítico BI con Chart.js (V2.3)

**Figura 44** — *media__1774491845412.png*

![Figura 44](anexos/media__1774491845412.png)

**Figura 45** — *media__1774491950272.png*

![Figura 45](anexos/media__1774491950272.png)

**Figura 46** — *media__1774492085082.png*

![Figura 46](anexos/media__1774492085082.png)

**Figura 47** — *media__1774492210176.png*

![Figura 47](anexos/media__1774492210176.png)

**Figura 48** — *media__1774492263355.png*

![Figura 48](anexos/media__1774492263355.png)

**Figura 49** — *media__1774493937918.png*

![Figura 49](anexos/media__1774493937918.png)

**Figura 50** — *media__1774494351792.png*

![Figura 50](anexos/media__1774494351792.png)

**Figura 51** — *media__1774533205858.png*

![Figura 51](anexos/media__1774533205858.png)

**Figura 52** — *media__1774540251756.png*

![Figura 52](anexos/media__1774540251756.png)

**Figura 53** — *media__1774541378549.png*

![Figura 53](anexos/media__1774541378549.png)

**Figura 54** — *media__1774541408538.png*

![Figura 54](anexos/media__1774541408538.png)

**Figura 55** — *media__1774542232860.png*

![Figura 55](anexos/media__1774542232860.png)

---

### 🏭 Fase 3 – Menú Modular por Áreas e Historial de Entregas (V2.4)

**Figura 56** — *media__1774877227606.png*

![Figura 56](anexos/media__1774877227606.png)

**Figura 57** — *media__1774879879746.png*

![Figura 57](anexos/media__1774879879746.png)

**Figura 58** — *media__1774879917611.png*

![Figura 58](anexos/media__1774879917611.png)

**Figura 59** — *media__1774879983155.png*

![Figura 59](anexos/media__1774879983155.png)

**Figura 60** — *media__1774880637465.png*

![Figura 60](anexos/media__1774880637465.png)

**Figura 61** — *media__1774880731950.png*

![Figura 61](anexos/media__1774880731950.png)

**Figura 62** — *media__1774881285365.png*

![Figura 62](anexos/media__1774881285365.png)

**Figura 63** — *media__1774882222601.png*

![Figura 63](anexos/media__1774882222601.png)

**Figura 64** — *media__1774882515113.png*

![Figura 64](anexos/media__1774882515113.png)

**Figura 65** — *media__1774882623247.png*

![Figura 65](anexos/media__1774882623247.png)

**Figura 66** — *media__1774883922604.png*

![Figura 66](anexos/media__1774883922604.png)

**Figura 67** — *media__1774883941355.png*

![Figura 67](anexos/media__1774883941355.png)

**Figura 68** — *media__1774884248448.png*

![Figura 68](anexos/media__1774884248448.png)

**Figura 69** — *media__1774884506081.png*

![Figura 69](anexos/media__1774884506081.png)

---

*Fin del documento — Gato Negro ERP V2.4 | Universidad de Pamplona | 2026*
