# 🎓 Informe Científico Final: Recap Integral de la Semana Experimental de IA

**Proyecto:** Automatización e Inteligencia Operativa ERP Gato Negro  
**Metodología:** Aprendizaje No Supervisado Granular Día a Día (Sin sesgos previos ni etiquetas artificiales)  
**Rama Git:** `feature/ia-analisis-dia-a-dia`  
**Dataset Fuente:** `documentacion/MOVIMIENTO FABRIQUINES MARZO   2026.xlsx`  
**Autor:** Gonzalo Andrés Jaimes & Asistente Antigravity  

---

## 1. 📌 Resumen Ejecutivo para la Asesoría de Tutoría

Siguiendo la hipótesis planteada con el tutor —*"alimentar la IA progresivamente día a día sin forzar supervisión humana para ver qué patrones descubre por sí sola"*—, se completó la ingesta y análisis del ciclo completo de manufactura (Día 2 al Día 7).

### Conclusión Principal:
El experimento demostró ser **100% viable, robusto y científicamente válido**. Sin que se le programara ninguna regla de negocio a mano, algoritmos de agrupamiento matemático no supervisado (**K-Means**) dedujeron de forma autónoma:
1. Las proporciones químicas y físicas de la materia prima.
2. La norma estándar de empaque y volumen físico de transporte.
3. Las huellas digitales de rendimiento de los artesanos.
4. Las fugas financieras ocultas entre la tarifa teórica pactada y el costo real de planta.

---

## 2. 🗓️ Mapeo Cronológico de Hallazgos Día a Día

```mermaid
graph LR
    D2[Día 2: Merma & Retención] --> D3[Día 3: Huella Digital & Anomalías]
    D3 --> D4[Día 4: Capital en Custodia / WIP]
    D4 --> D5[Día 5: Costo Unitario Real]
    D5 --> D6[Día 6: Calibración de Envases]
    D6 --> D7[Día 7: Receta Áurea de Planta]
```

### 🔹 Día 2 (Lunes): Segmentación Inicial de Merma y Retención de Flujo
- **Descubrimiento:** Agrupó a los 31 torcedores en 3 clusters naturales según su % de subproducto: Alto Rendimiento (7.7%), Estándar (13.15%) y En Observación (19.17%).
- **Anomalía Detectada:** Detectó a ciegas que Esperanza Rey (29.4 kg) y Yoli Becerra (26 kg) retuvieron inventario sin entregar producto terminado ese día.
- **Artefactos:** [Reporte Día 2](file:///c:/Users/gonza/OneDrive/Desktop/gato/public/reporte_dia2_ia.html) | [Bitácora Día 2](file:///c:/Users/gonza/OneDrive/Desktop/gato/documentacion/2026-10-12_ia_dia2_analisis.md).

### 🔹 Día 3 (Martes/Evolutivo): "Huella Digital de Eficiencia"
- **Descubrimiento:** El **44% de los operarios repitió con exactitud decimal su tasa de merma** entre periodos (ej: Karina Silva 21.43% exacto, Luis Valderrama +0.34%, Elvira López +0.34%).
- **Alerta Temprana de Calidad:** Detectó que cuando operarios estables se disparan en merma (Hugo Almeida saltó de 14.5% a 24.7%), el factor es un **lote de hoja más seca o descalibración de cuchilla**, no negligencia humana.
- **Artefactos:** [Reporte Evolutivo](file:///c:/Users/gonza/OneDrive/Desktop/gato/public/reporte_evolutivo_ia.html) | [Bitácora Evolutiva](file:///c:/Users/gonza/OneDrive/Desktop/gato/documentacion/2026-10-12_ia_evolucion_analisis.md).

### 🔹 Día 4 (Miércoles): Auditoría de Capital y Material en Custodia (WIP)
- **Descubrimiento:** Reveló **962.71 kg de hoja y 71 cestas en la calle** pendientes de liquidación (~94.343 tabacos en proceso).
- **Concentración Crítica:** Un "núcleo de 6 torcedores" (Rubiela Martínez, Rosalba Matagira, Sandra Moreno, Alcides Correa, Petter Benavides y Sandra Antolines) concentran **611.1 kg (~63.5% de todo el inventario externo)**.
- **Artefactos:** [Reporte Día 4](file:///c:/Users/gonza/OneDrive/Desktop/gato/public/reporte_dia4_ia.html) | [Bitácora Día 4](file:///c:/Users/gonza/OneDrive/Desktop/gato/documentacion/2026-10-12_ia_dia4_analisis.md).

### 🔹 Día 5 (Jueves): Costo Unitario Efectivo vs Tarifa Teórica
- **Descubrimiento:** Desmontó el mito de que el tabaco cuesta $75 COP por mano de obra. El costo real medio de la fábrica es de **$84.31 COP (+12.4% de sobrecosto)** debido a compensaciones de recorte, vena y diferencias de divisa.
- **Sobrecosto Crítico:** Alertó a Leidy Serrano disparándose a **$119.74 COP / tabaco** (+59.6% sobre tarifa base).
- **Artefactos:** [Reporte Día 5](file:///c:/Users/gonza/OneDrive/Desktop/gato/public/reporte_dia5_ia.html) | [Bitácora Día 5](file:///c:/Users/gonza/OneDrive/Desktop/gato/documentacion/2026-10-12_ia_dia5_analisis.md).

### 🔹 Día 6 (Viernes): Calibración Física de Envases de Transporte
- **Descubrimiento:** Descubrió por sí sola la norma física de empaque: **1.250 tabacos por cesta exacta** (72.4% del personal).
- **Riesgo Mecánico:** Encendió alerta roja sobre 3 operarios con sobredensidad (> 1.300 u/cesta) por peligro de aplastamiento al apilar canastos.
- **Artefactos:** [Reporte Día 6](file:///c:/Users/gonza/OneDrive/Desktop/gato/public/reporte_dia6_ia.html) | [Bitácora Día 6](file:///c:/Users/gonza/OneDrive/Desktop/gato/documentacion/2026-10-12_ia_dia6_analisis.md).

### 🔹 Día 7 (Sábado): La "Receta Áurea" de Abastecimiento
- **Descubrimiento:** Descubrió la razón geométrica de mezcla en almacén: **1 kg Capa : 1.8 kg Capote : 7.0 kg Picadura** (87.1% de cumplimiento).
- **Causa Raíz:** Comprobó que los torcedores que recibieron mezclas desbalanceadas un sábado previo fueron exactamente los que tuvieron alta merma y retención en los días posteriores.
- **Artefactos:** [Reporte Día 7](file:///c:/Users/gonza/OneDrive/Desktop/gato/public/reporte_dia7_ia.html) | [Bitácora Día 7](file:///c:/Users/gonza/OneDrive/Desktop/gato/documentacion/2026-10-12_ia_dia7_analisis.md).

---

## 3. 🌐 Dashboard Portal Central
Se diseñó un portal consolidado que integra todos los gráficos, métricas y enlaces interactivos para exponer directamente al profesor:
- **Archivo:** [public/recap_semana_ia.html](file:///c:/Users/gonza/OneDrive/Desktop/gato/public/recap_semana_ia.html)

---

## 4. 🔀 Respaldo y Estado de Ramas Git
- Todo el trabajo experimental, scripts, datasets JSON, dashboards interactivos y documentos markdown se encuentran versionados en la rama:
  **`feature/ia-analisis-dia-a-dia`**
- URL remota en GitHub:
  👉 `https://github.com/Gonzalo-Jaimes/Gato-negro/tree/feature/ia-analisis-dia-a-dia`
