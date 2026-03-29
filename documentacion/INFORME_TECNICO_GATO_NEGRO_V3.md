# INFORME TÉCNICO EXHAUSTIVO: ERP GATO NEGRO
**Evolución, Estado Actual y Proyección a Futuro (V.0 -> V.2.2 -> V.3.X)**

**Autor:** Gonzalo Jaimes  
**Institución:** Universidad de Pamplona (Ingeniería Mecatrónica)  
**Fecha:** 26 de Marzo de 2026

---

## 1. Contexto y Problemática Inicial (Fase Zero)

Históricamente, la **Fábrica de Tabacos Gato Negro** ha operado con un modelo de producción fragmentado y dependiente del esfuerzo humano centralizado. Previo a la intervención tecnológica, el control de logística, inventario, cálculos de materia prima e impresiones de pago (nóminas) recaían de forma asfixiante sobre una metodología manual y obsoleta (archivos "sábana" de Excel sueltos y gestión de papel).

### Principales Puntos de Dolor Identificados:
1. **El "Embudo Gregorio":** Todo el cálculo matemático (sumar préstamos de materia prima, restar tabacos devueltos, cobrar cestas) dependía enteramente de los supervisores en los momentos pico, causando retrasos logísticos durante los fines de semana.
2. **Ceguera de Inventario:** Dado que todo se anotaba en paralelo o una vez a la semana, la gerencia no tenía forma de saber cuánta Capa, Capote o Picadura física existía en la planta un día miércoles.
3. **Fugas Económicas (Mermas no calculadas):** Los subproductos como la *Vena* y el *Recorte* se manejaban arbitrariamente sin reflejarse como activos tangibles retribuidos a la "Bodega Maestra", generando disonancia financiera.
4. **Ausencia de Trazabilidad entre Eslabones:** No existía interconexión formal entre el eslabón primario de armado (Fabriquines), y los posteriores (Envolvedores, Anilladores y Empacadores).

---

## 2. Objetivos Centrales de la Intervención
* **Automatización Contable:** Programar fórmulas inviolables que calculen precios base de tabacos, cestas y mermas al milisegundo.
* **Trazabilidad en la Nube:** Proveer un sistema ERP 24/7 responsivo que seccione responsabilidades (Logística vs. Contabilidad).
* **Integración Modular Completa:** Diseñar la arquitectura capaz de asimilar, no solo a los 47 fabriquines actuales, sino abarcar todo el tren de ensamblaje (Envolvedoras > Anilladoras > Empaque).

---

## 3. Estado del Arte: Lo Desarrollado Hasta Ahora (V1.0 a V2.2)

A lo largo de estas arduas semanas, hemos cimentado la *columna vertebral* del ERP construyendo desde cero lo siguiente:

### A. Arquitectura y Seguridad Cloud (El Motor)
* **Base de Datos Serverless (Supabase/PostgreSQL):** Adiós a las bases de datos locales (`SQLite`). Toda la fábrica transa hoy sobre una infraestructura en la nube inquebrantable, blindada contra apagones y pérdida de información.
* **Seguridad Criptográfica (BCrypt):** Implementada en la V2.0, encriptando contraseñas por hashes para anular intromisiones al dashboard.
* **Registro de Auditoría (Logs):** Al eliminar un registro o modificar una recepción, el Kardex `(movimientos)` ahora delata permanentemente "Quién y Cuándo" generó la alteración temporal.

### B. Módulo de Mantenimiento Inteligente
* Creación de perfiles clínicos para la maquinaria despalilladora, donde usando un formato de Código QR cualquier operario puede revisar la Bitácora de Inversión y determinar el desgaste del equipo basándose en preventivos y correctivos reales.

### C. Módulo Core: Eslabón de los "Fabriquines" (Completado)
La proeza más densa de programación recayó acá. Su desarrollo se blindó en varios frentes:

1. **Despacho Dinámico y Anti-Negativos:** 
   * Se instauró el algoritmo donde la tarea dictamina la materia prima. Si se piden 1,000 tabacos, el sistema calcula entregar exactamente `[1kg Capa, 1.8kg Capote, 7kg Picadura]`.
   * **Bloqueo Transaccional:** El mayor arreglo de la *V2.1*. Imposibilita al sistema despachar "Cestas Rojas" o "Capa" si el stock en la vida real no tiene fondos (previene los inventarios en -50), protegiendo la plataforma de fraudes o errores humanos de digitación.
2. **Recepción Acumulativa (Lunes a Sábado):**
   * Grilla matricial donde se digitan ingresos diarios rápidos.
   * **Kardex Diferencial en Vivo (V2.2):** Cada que se pulsa *"Guardar"*, un motor matemático calcula la diferencia respecto al día anterior e inyecta la suma físicamente al instante en la Bodega, manteniendo la visibilidad en planta a tiempo real.
3. **Subproductos Transparentes:** 
   * Ahora, los kilos de "Vena" y "Recorte" devueltos no solo se transforman en dinero ($3,500 y $6,500) para pagarle al operario, sino que entran a formar parte oficial de los "Activos Físicos" del inventario Gato Negro.
   * Se añadieron también "Compras Extras Directas", para manejar producciones asíncronas pagadas a $230/ud.
4. **Desacople Administrativo de Nómina:**
   * La bodega física y el área contable ya no se cruzan. El almacenista logístico simplemente "Cierra Calculadamente" la semana. Automáticamente esa tirilla vuela hacia el Panel de **`/nomina`**, permitiendo que Tesorería imprima, pague y archive a su propio ritmo burocrático.
   * La tirilla es un sistema PDF multi-tabla complejo ("Formato V1.8") inyectado directamente para papel térmico.
5. **Calidad y "Lotes en Mesa":**
   * Vista analítica exclusiva incrustada en Inventario para que la jefatura de los siguientes eslabones sepa *cuántos tabacos totales vivos hay sentados en sus mesas* y de qué fabriquin específico provienen, ayudando al reporte contundente de las devoluciones por tabacos huecos o defectuosos.

---

## 4. Análisis Crítico: Pros y Contras del Ecosistema V2.2

### ✅ Argumentos a Favor (Pros)
1. **Erradicación del Error Matemático:** El cerebro digital jamás se equivoca al cruzar saldos rotativos de meses pasados y sumar subproductos, lo que evita desfalcos corporativos gigantescos a largo plazo.
2. **Trazabilidad Forense Anti-Robos:** Mapear en *Tiempo Real* el intercambio de materia prima garantiza que Gato Negro no regalará Cargas de Material Ficticio.
3. **Productividad Desatada:** Desacoplar Logística y Contabilidad permite procesar a más fabriquines en la mitad del tiempo al no requerir impresiones inmediatas.
4. **Escalabilidad Pura:** Al usar la Nube y Frameworks web, la plataforma actual es expandible globalmente y permite abrir nuevas sucursales o franquicias con "un par de clics".

### ❌ Argumentos en Contra o Limitantes Técnicos (Contras)
1. **Dependencia Total a Internet:** Si Gato Negro pierde hiper-conectividad (Fibra Óptica/Móvil), la producción física podría congelarse pues Supabase requiere `ping` activo al servidor exterior.
2. **Monolítico a Futuro:** El archivo principal, `server.js`, bordea las +1,000 líneas de código. A muy largo plazo (cuando se sumen 4 módulos gigantes más), requerirá por ley una modernización arquitectónica a microservicios si se desea involucrar a múltiples firmas de ingenieros trabajando en simultáneo.

---

## 5. El Horizonte Crítico: Tareas Restantes (V3.0 en Adelante)

El camino de Gato Negro no ha terminado. Lo desarrollado a la fecha domina a la perfección el ecosistema secundario del "Fabriquín" (Materia Prima -> Tabaco Armado). No obstante, para dominar todo el ciclo de manufactura del cigarro, faltan implementar en el software **los siguientes módulos primarios:**

### 🛠️ 5.1 Eslabón: Las Envolvedoras
* **Problemática a atajar:** Reciben el tabaco burdo de la Trazabilidad de Mesa que dejan los Fabriquines. Ellas envuelven y refinan el producto exterior. 
* **Desarrollo Necesario:** 
  1. Crear CRUD de Envolvedores.
  2. Mecanismo de traslado del Kardex de `Tabaco Crudo` hacia la Deuda de "Tarea Asignada a Envolvedora".
  3. Formato dinámico de control de fallas (Si el tabaco del fabriquin X vino hueco, la Envolvedora debe mermarlo).
  4. Liquidación salarial diferente a un precio condicionado por unidad envuelta.

### 🛠️ 5.2 Eslabón: Los Anilladores
* **Problemática a atajar:** Toma el cigarro envuelto y procede a la imposición corporativa (etiquetado/Anillado particular).
* **Desarrollo Necesario:** 
  1. CRUD Independiente e Inventario de *Insumos Gráficos* (Goma, Tinta, Rollos de Anillos).
  2. Traslado de inventario biológico.
  3. Cálculo de merma del anillo o de tabacos partidos durante el forcejeo de maquinación.

### 🛠️ 5.3 Eslabón: Los Empacadores y Despacho Final Comercial
* **Problemática a atajar:** Meten en su embalaje comercial al tabaco, volviéndolo oficialmente un Ítem Comerciable o `SKU`.
* **Desarrollo Necesario:**
  1. Inventario de Cajas de Cartón y Cintas Plásticas.
  2. Módulo de **Ventas a Mayoristas**, donde ocurre el acto final de extraer el inventario masivo terminado para convertirlo a Factura Externa hacia Proveedores/Tiendas externas.

**Conclusión Final:** Gato Negro ha cimentado la base infraestructural más dura (Cuentas exactas y Criptografía de Nube). Aplicar los módulos subsiguientes (Envolvedores y Anilladores) será un proceso fluido replicando y ajustando los sub-sistemas exitosamente ya comprobados en el núcleo del Fabriquín. El objetivo definitivo: "Desde la hoja cruda, hasta la caja de vitrina", es 100% materializable.
