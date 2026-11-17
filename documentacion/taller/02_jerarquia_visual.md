# Fase 1 · Jerarquía visual del dashboard (`/analitica`)

Captura base: `capturas/antes/escritorio/1_dashboard_analitica.jpg`

## 1. Esquema actual (orden en la pantalla)

1. Título "Dashboard Analítico y Financiero" + subtítulo gris claro.
2. Tarjeta "BI Dashboard": dos selects (dataset y tipo de gráfica) + gráfica de barras.
3. Tarjeta "Cierre Contable Macro (Acumulado Total)": Ingresos, Nómina, Mtto. Máquinas, Balance Neto.
4. Pie de página.

## 2. Clasificación en 5 niveles

| Nivel | Qué debe cumplir | Elementos hoy | Problema |
|---|---|---|---|
| 1 · Lo primero que debe entender | Estado financiero de un vistazo | **Balance Neto** (−$14.777.850) | Está en la segunda tarjeta, bajo el pliegue |
| 2 · Información relevante | Componentes del balance y producción | Ingresos ($0), Nómina, Mtto. Máquinas; gráfica de tabacos fabricados | Mezclados en el mismo peso visual que los controles |
| 3 · Apoyo | Contexto para interpretar | Subtítulo, leyendas de la gráfica | El subtítulo es el texto más claro: se pierde |
| 4 · Acciones secundarias | Cambiar vista de datos | Selects de dataset y tipo de gráfica | Ocupan el lugar más prominente (arriba) |
| 5 · Auxiliar | Marca y pie | Copyright "© 2026 Gato Negro" | Correcto |

Conclusión: la jerarquía está **invertida**; los controles (nivel 4) preceden a la métrica clave (nivel 1).

## 3. Rediseño propuesto

```
┌────────────────────────────────────────────────────┐
│ Título + periodo                                   │
├────────────┬────────────┬────────────┬─────────────┤
│ BALANCE    │ Ingresos   │ Nómina     │ Mtto.       │  ← niveles 1 y 2 (tarjetas KPI,
│ NETO (grande, con color│            │            │     Balance destacado)
│ semántico + signo)     │            │            │
├────────────┴────────────┴────────────┴─────────────┤
│ Gráfica de producción (nivel 2)                    │
│  [Dataset ▾] [Tipo ▾]  ← controles (nivel 4),      │
│  con <label> visible, a la derecha del título      │
│  Resumen textual accesible de la gráfica (nivel 3) │
├────────────────────────────────────────────────────┤
│ Pie (nivel 5)                                      │
└────────────────────────────────────────────────────┘
```

Cambios a implementar en código (Fase 3–4):
- Mover "Cierre contable" arriba como fila de 4 KPIs; Balance Neto con tamaño mayor y color semántico.
- Controles de la gráfica junto al título de la gráfica, con `<label>` real.
- Texto alternativo de la gráfica (`aria-describedby`) con los valores principales.
- Breakpoints: balance a ancho completo y 3 KPI en fila (escritorio y tableta) → una columna en móvil.

## 4. Comparación (antes frente a después, implementada)

Capturas: `capturas/antes/escritorio/1_dashboard_analitica.jpg` frente a `capturas/despues/escritorio/1_dashboard_analitica.jpg` (también en móvil y tableta).

| Nivel | Antes | Después (`views/admin/analitica.ejs`) |
|---|---|---|
| 1 · Lo primero que debe entenderse | Balance neto en la segunda tarjeta, bajo el pliegue, en un texto de igual peso que los demás | **Balance neto** a ancho completo y tamaño mayor, con símbolo ▼/▲ y «Déficit/Superávit», primer elemento bajo el título |
| 2 · Información relevante | Ingresos, nómina y mantenimiento mezclados en una sola línea; gráfica sin explicación (y, en la versión original, **sin dibujarse**) | Tres KPI en fila y la gráfica con resumen textual («Mayor valor: …, 90 % del total») y tabla alternativa |
| 3 · Apoyo | Subtítulo gris claro, casi ilegible | Subtítulo con el texto atenuado más oscuro (5,73:1) y nota bajo cada KPI |
| 4 · Acciones secundarias | Dos selects **antes** que la métrica, sin etiqueta asociada | Selects junto al título de la gráfica, con `<label for>` visible |
| 5 · Auxiliar | Pie de página | Sin cambio |

| Medida | Antes | Después |
|---|---|---|
| Primer elemento bajo el título | Selects de la gráfica | Balance neto |
| Métrica clave visible sin desplazarse (1366×768, 768×1024 y 375×812) | No | **Sí** (comprobado en las capturas de los 3 tamaños) |
| Controles con etiqueta | 0 de 2 | **2 de 2** |
| La gráfica se dibuja | No (error de JSON) | Sí, en 4 conjuntos de datos y 4 tipos |
