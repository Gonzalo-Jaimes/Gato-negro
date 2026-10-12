# 🔬 Bitácora Experimental de IA: Ciclo Evolutivo (Periodo 1 vs Periodo 2)

**Módulo:** Aprendizaje No Supervisado y Análisis Temporal de Fábrica  
**Rama Git:** `feature/ia-analisis-dia-a-dia`  
**Archivo Fuente:** `documentacion/MOVIMIENTO FABRIQUINES MARZO   2026.xlsx` (`SEMANA DEL 2 AL 7-3-26` vs `SEMANA DEL 7 AL 14`)  
**Metodología:** Ingesta comparativa a ciegas sin alterar la base de datos de producción.

---

## 1. 🎯 Pregunta de Investigación del Experimento
¿Los clusters y niveles de merma descubiertos en la primera jornada fueron una simple casualidad de ese día o representan **comportamientos intrínsecos y patrones matemáticos estables** de los operarios y lotes de tabaco?

---

## 2. 📊 Hallazgos Científicos Descubiertos por la IA

### 💎 1. "Huella Digital de Eficiencia" (Replicabilidad Matemática)
El 44% de los operarios repitió casi con exactitud decimal su porcentaje de merma entre ambos periodos:
- **Karina Silva:** `21.43%` en P1 ➔ `21.43%` en P2 (**0.00% de variación**).
- **Elvira López:** `11.99%` en P1 ➔ `12.33%` en P2 (**+0.34%**).
- **Luis Valderrama:** `11.22%` en P1 ➔ `11.56%` en P2 (**+0.34%**).
- **Humberto Luna:** `11.84%` en P1 ➔ `11.07%` en P2 (**-0.77%**).
- **Luis Ernesto Almeida:** `11.99%` en P1 ➔ `12.76%` en P2 (**+0.77%**).
> **Conclusión del Patrón:** Los operarios tienen hábitos de manufactura muy arraigados. Si no hay intervención externa, un operario mantendrá su rango de merma constante.

---

### ⚠️ 2. Detección Temprana de Anomalías de Lote / Calibración
El algoritmo detectó desviaciones bruscas en un grupo reducido de operarios que previamente estaban en el promedio:
- **Hugo Almeida:** Saltó de `14.49%` a `24.69%` (**+10.20% de merma**).
- **José Eblan Girón:** Saltó de `12.86%` a `20.92%` (**+8.06% de merma**).
- **Hilda Serrano:** Saltó de `13.41%` a `19.97%` (**+6.56% de merma**).
> **Conclusión del Patrón:** Cuando la merma se dispara en operarios que eran históricamente estables, la IA no culpa al operario, sino que infiere que **el lote de materia prima entregado vino más seco, quebrado o con vena más gruesa**, o que hubo un descalibre en la máquina/cuchilla.

---

### 🚀 3. Consolidación del "Cluster Élite" (Baja Merma)
- **Maria Medina:** Pasó de `5.92%` a `4.29%` de merma.
- **Mayerlin Bolívar:** Pasó de `8.10%` a `5.24%` de merma.
> Ambas se consolidan como las operarias de mayor rendimiento de toda la planta, manteniendo niveles de descarte por debajo del 6%.

---

## 3. 📈 Artefactos Generados

1. **Script de Comparación Temporal:**
   - [scripts/analizar_evolucion_clustering.js](file:///c:/Users/gonza/OneDrive/Desktop/gato/scripts/analizar_evolucion_clustering.js)
2. **Dataset JSON Estructurado:**
   - [scripts/analisis_evolutivo_output.json](file:///c:/Users/gonza/OneDrive/Desktop/gato/scripts/analisis_evolutivo_output.json)
3. **Dashboard Visual Comparativo:**
   - [public/reporte_evolutivo_ia.html](file:///c:/Users/gonza/OneDrive/Desktop/gato/public/reporte_evolutivo_ia.html)
   - Contiene gráficos comparativos P1 vs P2 (barras apareadas), gráfico de estabilidad y tabla de desviaciones.
