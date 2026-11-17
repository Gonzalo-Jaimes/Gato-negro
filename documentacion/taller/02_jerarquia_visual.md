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
- Breakpoints: 4 KPIs → 2×2 en tableta → 1 columna en móvil.

## 4. Comparación (se completará con la captura "después")

| | Antes | Después |
|---|---|---|
| Primer elemento bajo el título | Selects de la gráfica | Balance Neto |
| Métrica clave visible sin scroll | No | Sí |
| Controles con label | 0 de 2 | 2 de 2 |
