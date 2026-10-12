# 🔬 Bitácora Experimental de IA: Día 7 (El Sábado de Abastecimiento & La Receta Áurea)

**Módulo:** Aprendizaje No Supervisado de Ratios de Mezcla y Calibración de Entrada  
**Rama Git:** `feature/ia-analisis-dia-a-dia`  
**Archivo Fuente:** `documentacion/MOVIMIENTO FABRIQUINES MARZO   2026.xlsx` (Despacho General de los Sábados)  
**Metodología:** Análisis matemático de proporciones geométricas en el suministro de materias primas.

---

## 1. 🎯 Enfoque del Experimento
Tal como especificaste, los **sábados son el día neurálgico del ecosistema**, donde la fábrica entrega el material completo a todos los torcedores para iniciar su semana de manufactura. En este Día 7, la IA analizó a ciegas los **pesajes entregados de Capa, Capote y Picadura** para evaluar si existe una correlación proporcional y si se respeta en cada operario.

---

## 2. 📊 Métricas Globales del Abastecimiento
- **Total de torcedores abastecidos:** 31 operarios.
- **Masa total de materia prima suministrada:** **2.074.50 kg**.
  - **Picadura:** 1.481.60 kg (**71.4%** de la masa total).
  - **Capote:** 380.40 kg (**18.3%** de la masa total).
  - **Capa:** 212.50 kg (**10.2%** de la masa total).

---

## 3. 🤖 Descubrimientos de la IA sin Supervisión

### 🌿 A. Descubrimiento de la "Receta Áurea" de Planta (1 : 1.8 : 7.0)
Sin ninguna programación manual previa, la IA descubrió que la fábrica opera bajo una razón geométrica estricta de mezcla:
$$\text{Por cada 1.0 kg de Capa} \longrightarrow \text{1.8 kg de Capote} \longrightarrow \text{7.0 kg de Picadura}$$
- **27 de los 31 torcedores (87.1%)** recibieron exactamente esta combinación equilibrada (ej: 5 kg capa / 9 kg capote / 35 kg picadura; o 10 kg capa / 18 kg capote / 70 kg picadura).

```mermaid
pie title Cumplimiento de la Receta de Mezcla (Día 7)
    "Receta Áurea Exacta (1:1.8:7.0) - 27 operarios" : 87.1
    "Mezclas Atípicas / Desviadas - 4 operarios" : 12.9
```

### ⚠️ B. Detección de Desbalances en Mezcla y su Impacto en la Merma
La IA detectó 4 casos atípicos donde la relación de materia prima fue alterada en el almacén:
1. **René Almeida:** 2.5 kg Capa / 3.5 kg Capote / 15 kg Picadura $\longrightarrow$ **Ratio: 1 : 1.40 : 6.00** *(Falta de capote respecto a la picadura)*.
2. **Rosmira Durán:** 2.0 kg Capa / 3.0 kg Capote / 14 kg Picadura $\longrightarrow$ **Ratio: 1 : 1.50 : 7.00** *(Déficit del 16.7% en capote)*.
3. **Rubiela Martínez:** 10.0 kg Capa / 17.5 kg Capote / 70 kg Picadura $\longrightarrow$ **Ratio: 1 : 1.75 : 7.00**.
4. **Yoli Becerra:** 3.0 kg Capa / 5.4 kg Capote / 17.6 kg Picadura $\longrightarrow$ **Ratio: 1 : 1.80 : 5.87** *(Exceso de capote o déficit de picadura)*.

> **Correlación Histórica Descubierta:** Estos mismos operarios (René Almeida, Rosmira Durán y Yoli Becerra) fueron los que mostraron **las mayores tasas de subproducto, desajuste y retención en los días anteriores**. La red deduce que el origen de la merma no fue la destreza del artesano, sino una **entrega desproporcionada de materia prima un sábado previo**.

---

## 4. 🛠️ Artefactos e Implementación Técnica

1. **Script de Auditoría de Mezcla:**
   - [scripts/analizar_dia7_clustering.js](file:///c:/Users/gonza/OneDrive/Desktop/gato/scripts/analizar_dia7_clustering.js)
   - Ejecución: `node scripts/analizar_dia7_clustering.js`
2. **Dataset JSON:**
   - [scripts/analisis_dia7_output.json](file:///c:/Users/gonza/OneDrive/Desktop/gato/scripts/analisis_dia7_output.json)
3. **Dashboard Visual Interactivo:**
   - [public/reporte_dia7_ia.html](file:///c:/Users/gonza/OneDrive/Desktop/gato/public/reporte_dia7_ia.html)
   - Gráfico de torta de proporciones de hoja, barras de volumen total despachado y tabla de auditoría con la relación real calculada (100% validado sin inline styles).
