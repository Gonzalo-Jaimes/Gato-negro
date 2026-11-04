> Etiquetas: #negocio #operaciones #logistica #erp #flujo-completo

# 🔄 Línea de Producción Completa en la Plataforma (End-to-End)

Este documento describe paso a paso toda la línea de producción de la **[[EMPRESA_GATO_NEGRO|Fábrica de Tabacos Gato Negro]]** dentro del ERP, desde el ingreso y entrega de materia prima hasta el empaquetado final en bultos y cajas.

---

## 🗺️ Diagrama General del Flujo

```mermaid
flowchart TD
    B["0. Bodega e Inventario Global<br/>(/bodega y /movimientos)"] --> F1["1. Despacho de Material a Fabriquines<br/>(/despacho -> /bodega)"]
    F1 --> F2["2. Búsqueda y Entrega de Tabacos (Lunes a Sábado)<br/>(/recepcion_diaria)"]
    F2 -->|Suma 'Tabacos' al Inventario| A1["3. Proceso de Anillado (Gato / Intabaca)<br/>(/anilladores/despacho -> /anilladores/recepcion)"]
    A1 -->|Tabacos Anillados (Marca)| E1["4. Proceso de Envoltura (Gato / Intabaca)<br/>(/envolvedoras/despacho -> /envolvedoras/control)"]
    E1 -->|Tabacos Envueltos (Marca)| P1["5. Proceso de Empaquetado (Bultos 25/50 y Cajas)<br/>(/empacadores/recepcion)"]
    F2 -.->|Liquidación Semanal| N["Nómina y Facturación<br/>(/nomina)"]
    A1 -.->|Liquidación Semanal| N
    E1 -.->|Liquidación Semanal| N
    P1 -.->|Liquidación Semanal| N
```

---

## 📦 Etapa 0: Abastecimiento en Bodega Central y Kardex
Antes de iniciar la línea con los operarios, la materia prima y los insumos deben existir en el sistema:

1. **Ingreso al Kardex (`/movimientos`):**
   - Se registran las entradas de **Materia Prima** (`Capa`, `Capote`, `Picadura`), **Herramientas** (`Cestas Rojas`, `Cestas Negras`, etc.) e **Insumos / Papelería** (`Anillos (Gato)`, `Anillos (Intabaca)`, `Papel de Envoltura`, `Goma`, `Periódico`).
2. **Procesamiento de Picadura (`/bodega`):**
   - La hoja bruta se procesa y fracciona en **Sacas Estandarizadas** (`35 kg`, `28 kg`, `21 kg`, `14 kg`, `7 kg` o sobrantes) dentro de las tablas `lotes_picadura` y `sacos_picadura`.

---

## 🌿 Etapa 1: Entrega de Material a Fabriquines (Asignación de Tarea)
El ciclo productivo arranca cuando se le asigna la meta semanal al **Fabriquín** (artesano que arma el tabaco en bola).

* **Pantalla:** Despacho de Tareas (`/despacho` — vista `views/produccion/despacho.ejs`).
* **Fórmula automática por cada 1,000 tabacos de meta:**
  * **Capa:** `1.0 kg`
  * **Capote:** `1.8 kg`
  * **Picadura:** `7.0 kg`
  * **Cestas prestadas:** `1 cesta por cada 1,250 tabacos` (seleccionando el color de cesta).
* **Flujo en plataforma:**
  1. El administrador selecciona al fabriquín, define la **Meta de Tabacos** (ej. `5,000` tabacos) y registra insumos adicionales (goma, periódico, préstamos/abonos).
  2. Se genera la **Hoja de Despacho** imprimible (`views/produccion/hoja_despacho.ejs`) y queda una orden pendiente en `despachos_registro`.
  3. En **Bodega (`/bodega`)**, el encargado selecciona las sacas físicas de picadura y confirma los kilos reales de Capa y Capote entregados (`/entregar_sacos` o `/confirmar_entrega_bodega`).
  4. El sistema suma automáticamente la meta a la **Deuda de Tabacos (`deuda_tabacos`)** del fabriquín y habilita su tarjeta en la recepción diaria.

---

## 🔍 Etapa 2: Búsqueda y Recepción Diaria de Tabacos (Fabriquines)
Durante la semana (de **Lunes a Sábado**), los fabriquines van entregando las cestas de tabacos armados y devolviendo las mermas.

* **Pantalla:** Recepción Diaria de Fabriquines (`/recepcion_diaria` — vista `views/produccion/fabriquines_diario.ejs`).
* **Búsqueda en Tiempo Real:**
  * En la parte superior de la pantalla hay un **buscador instantáneo por nombre o código del fabriquín** que filtra las tarjetas activas y muestra el contador de resultados en vivo.
* **Registro Progresivo (Lunes a Sábado):**
  * En la tarjeta del fabriquín se digitan por día:
    * **Cestas entregadas** (`lun_cestas` ... `sab_cestas`) — cada cesta equivale a **1,250 tabacos**.
    * **Tabacos entregados** (`lun_tabacos` ... `sab_tabacos`).
    * **Mermas y Extras:** Kilos de **Vena** (`$3,500 COP/kg`), kilos de **Recorte** (`$6,500 COP/kg`) y **Tabacos Extras** (`$230 COP/ud`).
* **Impacto en Inventario (Motor Diferencial en Vivo):**
  * Cada vez que se pulsa **"Guardar"** (`/recepcion_diaria_guardar`), el sistema calcula la diferencia contra el guardado anterior e inyecta automáticamente en el **Inventario Global (`/inventario`)** y en el **Kardex (`/movimientos`)**:
    * Entrada de `Tabacos` (categoría *En Proceso*).
    * Retorno de las `Cestas` del color correspondiente.
    * Entrada de `Vena`, `Recorte` y `Tabacos Extras (Ventas)`.
* **Cierre / Liquidación Semanal:**
  * Al finalizar la semana, se pulsa **"Liquidar Semana"** (`/liquidar_semana/:id`).
  * Se calcula el pago (`Tabacos × $85 COP + Recorte + Vena + Extras`), se descuenta la cantidad entregada de la `deuda_tabacos` del fabriquín y se envía el recibo al módulo de **Nómina (`/nomina`)**.

---

## 💍 Etapa 3: Proceso de Anillado (Gato Negro e Intabaca)
Una vez los tabacos están en el inventario, pasan al área de **Anilladores**, quienes colocan la vitola (anillo) según la marca solicitada (**Gato** o **Intabaca**).

* **Pantallas del Módulo:**
  * Inventario y Personal: `/anilladores/inventario` (`views/produccion/anilladores_inventario.ejs`)
  * Despacho de Trabajo: `/anilladores/despacho` (`views/produccion/anilladores_despacho.ejs`)
  * Recepción Semanal (L-S): `/anilladores/recepcion` (`views/produccion/anilladores_recepcion.ejs`)
  * Tareas por Cestas / Papelitos: `/anilladores` (`views/produccion/anilladores.ejs`)
* **Paso 3.1 — Despacho a Anillador:**
  1. Se selecciona el anillador (ej. *Jesús Utah*), la cantidad de tabacos a trabajar, el **Modelo de Anillo** (`Anillos (Gato)` o `Anillos (Intabaca)`), los **Paquetes de Anillos** (cada paquete equivale a **500 anillos**, el sistema multiplica `× 500` automáticamente) y la cantidad de pega de yuca.
  2. El sistema valida que exista stock suficiente en el Inventario Global, descuenta los tabacos y los anillos, registra la `SALIDA` en el Kardex y suma el compromiso a `deuda_tabacos` y `deuda_anillos` del anillador.
* **Paso 3.2 — Recepción y Liquidación de Anillados:**
  1. En `/anilladores/recepcion`, se registran de **Lunes a Sábado** las cestas (`1,500 tabacos anillados por cesta`) y unidades entregadas, junto con la **merma de anillos** y **merma de tabacos partidos**.
  2. Al pulsar **"Liquidar Semana"** (`/anilladores/liquidar_semana/:id`), el sistema:
     * Descuenta los tabacos entregados y las mermas de la deuda del anillador.
     * Suma los tabacos terminados al Inventario Global como **`Tabacos Anillados (Gato)`** o **`Tabacos Anillados (Intabaca)`**.

---

## 🌯 Etapa 4: Proceso de Envoltura (Envolvedoras)
Los tabacos entran al área de **Envolvedoras**, donde se recubren con su capa protectora de papel celofán manteniendo la separación por marca (**Gato** o **Intabaca**).

* **Pantallas del Módulo:**
  * Asignar Semana (Despacho): `/envolvedoras/despacho` (`views/produccion/envolvedoras_despacho.ejs`)
  * Control y Recepción Semanal (L-S): `/envolvedoras/control` (`views/produccion/envolvedoras_control.ejs`)
* **Paso 4.1 — Asignación Semanal y Descuento de Papel:**
  1. Se selecciona la envolvedora (ej. *René Hamilton* o *Jakeline*), la **Marca** (`Gato` o `Intabaca`), las **Cestas Asignadas** (`1,250 tabacos por cesta`) y los gramos/kilos de **Papel de Envoltura** (universal para ambas marcas).
  2. El sistema descuenta automáticamente del Inventario Global los `Tabacos Anillados (Marca)` y el `Papel de Envoltura`, registrando la salida en el Kardex.
  3. Si a una misma envolvedora se le asigna trabajo de **Gato** y de **Intabaca**, el sistema crea **tarjetas independientes por marca** para evitar cruces.
* **Paso 4.2 — Búsqueda, Control Diario (Lunes a Sábado) y Liquidación:**
  1. En `/envolvedoras/control` se cuenta con un **buscador en tiempo real** para localizar rápidamente la tarjeta de la envolvedora.
  2. De Lunes a Sábado se registran:
     * **Cestas IN:** Cestas que se lleva.
     * **Cestas OUT / Tabacos OUT:** Cestas y tabacos envueltos que entrega terminados.
     * **Papel Extra / Papel Sobrante:** Ajustes de papel durante la semana.
  3. Al pulsar **"Liquidar"** (`/liquidar_envolvedora/:id`), el sistema:
     * Ingresa la producción terminada al Inventario Global como **`Tabacos Envueltos (Gato)`** o **`Tabacos Envueltos (Intabaca)`**.
     * Envía la cuenta de cobro (`Cestas OUT × Precio por Cesta`) a `produccion_fabriquines` para pago en **Nómina (`/nomina`)**.

---

## 📦 Etapa 5: Proceso de Empaquetado Final (Empacadores)
El último eslabón toma los tabacos ya anillados y envueltos para sellarlos en **Cajas (de 25 o 50 tabacos)** y armar los **Bultos Maestros** listos para despacho en camión.

* **Pantallas del Módulo:**
  * Recepción Semanal de Empacadores: `/empacadores/recepcion` (`views/produccion/empaque_recepcion.ejs`)
  * Despacho y Órdenes de Empaque: `/despachos_empaque` (`views/produccion/empaque_despacho.ejs`)
* **Equivalencias Oficiales de Empaque en el Sistema:**
  * **1 Caja de 25:** `25 tabacos`
  * **1 Caja de 50:** `50 tabacos`
  * **1 Bulto de 25:** `84 cajas × 25 tabacos` = **2,100 tabacos**
  * **1 Bulto de 50:** `42 cajas × 50 tabacos` = **2,100 tabacos**
* **Registro Diario (Lunes a Sábado) y Liquidación:**
  1. En la tarjeta de cada empacador (ej. *José Jurado*, *Martín*, *Frank*) dentro de `/empacadores/recepcion`, se registran día por día (`Lunes` a `Sábado`):
     * **Bultos de 25** terminados (`lun_bultos_25` ... `sab_bultos_25`)
     * **Bultos de 50** terminados (`lun_bultos_50` ... `sab_bultos_50`)
     * **Cajas Sueltas de 25** (`lun_cajas_25` ... `sab_cajas_25`)
     * **Cajas Sueltas de 50** (`lun_cajas_50` ... `sab_cajas_50`)
  2. La tarjeta calcula en tiempo real el total de tabacos empacados con la fórmula:
     $$\text{Total Tabacos} = (\text{Bultos}_{25} \times 2100) + (\text{Bultos}_{50} \times 2100) + (\text{Cajas}_{25} \times 25) + (\text{Cajas}_{50} \times 50)$$
  3. Al pulsar **"Liquidar Semana"** (`/empacadores/liquidar_semana/:id`) o recibir el pedido en `/recibir_empaque/:id`, se consolida el total de tabacos empacados, se suman al inventario de **Producto Terminado** (`Bultos de 50`, `Bultos de 25`, `Cajas de 50`, `Cajas de 25` por marca) y se genera el pago correspondiente para **Nómina**.

---

## 🧪 Ejemplo Práctico de Trazabilidad Completa en Plataforma

Siguiendo el caso real operativo de la fábrica:

1. **Entrega de Material (`/despacho` → `/bodega`):**
   * Se le asigna tarea a **Alcides** y se le despachan sus sacas de picadura, capa, capote y cestas.
2. **Búsqueda y Entrega de Tabacos (`/recepcion_diaria`):**
   * Se busca a **"Alcides"** en la barra de búsqueda superior, se registran sus entregas de lunes a sábado y al guardar entran los **`Tabacos`** al inventario global.
3. **Anillado (`/anilladores/despacho` → `/anilladores/recepcion`):**
   * Se le entregan los tabacos y paquetes de 500 anillos al anillador **Jesús Utah**.
   * Utah anilla la mitad con marca **Intabaca** y la otra mitad con marca **Gato**, quedando registrados en inventario por separado.
4. **Envoltura (`/envolvedoras/despacho` → `/envolvedoras/control`):**
   * Se le asignan los lotes separados por marca (Gato e Intabaca) más el Papel de Envoltura a **René**.
   * Se busca a **"René"** en el control diario, se registran sus cestas terminadas y al liquidar pasan al inventario como **Tabacos Envueltos (Gato)** y **Tabacos Envueltos (Intabaca)**.
5. **Empaquetado (`/empacadores/recepcion`):**
   * Se entregan los tabacos listos a **José Jurado**, quien los empaca durante la semana en **Bultos de 25** (84 paquetes × 25 = 2,100 uds), **Bultos de 50** (42 paquetes × 50 = 2,100 uds) y cajas sueltas, cerrando el ciclo hasta el camión de despacho.

---

## 🗂️ Resumen Técnico de Rutas y Tablas por Eslabón

| Etapa | Rol Operativo | Rutas Principales | Vistas (`views/produccion/`) | Tablas en Supabase |
| :--- | :--- | :--- | :--- | :--- |
| **0. Bodega** | Bodeguero / Admin | `/bodega`, `/movimientos`, `/inventario` | `picadura.ejs`, `admin/movimientos_kardex.ejs` | `inventario`, `movimientos`, `lotes_picadura`, `sacos_picadura` |
| **1. Despacho MP** | Fabriquín | `/despacho`, `/despachar_tarea` | `despacho.ejs`, `hoja_despacho.ejs` | `empleados_fabriquines`, `despachos_registro`, `prestamos_fabriquines` |
| **2. Recepción Tabaco** | Fabriquín | `/recepcion_diaria`, `/liquidar_semana/:id` | `fabriquines_diario.ejs` | `recepcion_diaria`, `produccion_fabriquines` |
| **3. Anillado** | Anillador | `/anilladores/despacho`, `/anilladores/recepcion` | `anilladores_despacho.ejs`, `anilladores_recepcion.ejs` | `empleados_anilladores`, `recepcion_diaria_anilladores`, `tareas_anilladores` |
| **4. Envoltura** | Envolvedora | `/envolvedoras/despacho`, `/envolvedoras/control` | `envolvedoras_despacho.ejs`, `envolvedoras_control.ejs` | `empleados_envolvedoras`, `recepcion_envolvedoras` |
| **5. Empaquetado** | Empacador | `/empacadores/recepcion`, `/despachos_empaque` | `empaque_recepcion.ejs`, `empaque_despacho.ejs` | `empleados_empacadores`, `recepcion_empacadores`, `pedidos` |
