> Etiquetas: #negocio #operaciones #logistica

# 📖 Diccionario de Datos y Eslabones de Producción

Este documento explica la terminología interna de la [[EMPRESA_GATO_NEGRO|Fábrica Gato Negro]] para que el sistema y los agentes de IA entiendan el contexto logístico.

## Eslabones de Producción (Roles)

1. **Fabriquín:** Es el artesano base. Recibe la materia prima cruda (Capa, Capote, Picadura) y arma los tabacos "en bola".
2. **Envolvedor:** Recibe el tabaco del fabriquin y le aplica la hoja exterior y el celofán protector.
3. **Anillador:** Operario encargado de colocar la vitola (etiqueta corporativa del Gato Negro) al cigarro ya envuelto. También actúa como custodio de las cestas entre el área de envoltura y su propio proceso.
4. **Empacador:** Toma los tabacos terminados y los sella en Cajas (de 25 o 50 unidades) y Bultos Maestros para su despacho a mayoristas.

## Personal Operativo (Roles Actuales - Julio 2026)

| Nombre           | Rol Principal   | Roles Adicionales       |
|------------------|-----------------|-------------------------|
| Jesús Utah       | Anillador       | —                       |
| José Jurado      | Anillador       | Empacador               |
| Martín           | Anillador       | Empacador               |
| Jhonathan        | Anillador       | —                       |
| Jhoni            | Anillador       | —                       |
| Jakeline         | Anilladora      | Envolvedora             |
| Frank            | Anillador       | Empacador               |
| Francisco        | Anillador       | —                       |

## Conceptos Operativos

- **La Cesta:** Es la unidad de medida logística y de transporte dentro de la planta.
  - Para los _Fabriquines_, 1 cesta siempre contiene **1,250 tabacos normales**.
  - Para los _Anilladores_, 1 cesta contiene **1,500 tabacos anillados**.
  - Se prestan cestas de distintos colores (ej. Cestas Rojas, Cestas Negras) para auditoría visual.
- **La Tarea / Meta:** Es la cantidad de tabacos que el administrador exige al fabriquin para la semana.
- **Mermas:** Residuos del proceso de fabricación que se retornan a la bodega.
  - _Vena:_ El tallo central de la hoja de tabaco. Se paga al operario para incentivar su devolución.
  - _Recorte:_ Trozos de hoja sobrantes. También se pagan.
  - _Rezago:_ Tabacos mal armados o defectuosos que son devueltos para descuento o reproceso.
- **Deuda Rotativa:** En Gato Negro, la materia prima se entrega "a crédito". Si un fabriquin pide 1000 tabacos en material y solo entrega 800 físicos, se le genera una "Deuda de 200 Tabacos" para la próxima semana.

## Sistema de Trazabilidad por Papelitos

El flujo de custodia física de las cestas entre áreas funciona así:

```
Fabriquines (Alcides: 5 cestas, Blanca: 4, René: 1)
        ↓  cada uno entrega su papelito con la cantidad
Anillador (ej: Utah): recibe 10 cestas + papelitos de cada fabriquín
        ↓  entrega papelitos a Gregorio (Admin) como COMPROBANTE
        ↓  devuelve 10 cestas anilladas + papel "Utah" adjunto
Envolvedoras: reciben cestas con el papel que identifica al anillador
        ↓  si la cesta está incompleta → regresa a Utah para completar
Inventario Global: se actualiza automáticamente en cada etapa
```

- **Papelito:** Comprobante físico manual que acompaña la cesta. Identifica quién hizo qué y cuánto. En el sistema digital el equivalente es el campo `anillador_nombre` en la tabla `tareas_anilladores`.

## Empaque y Logística de Despacho

- **Bulto de 25:** 84 cajas × 25 tabacos = **2,100 tabacos** por bulto
- **Bulto de 50:** 42 cajas × 50 tabacos = **2,100 tabacos** por bulto
- **Capacidad del Camión:** 220 bultos máximo
- **Carga típica de viaje:** 180 bultos×50 + 30 bultos×25 = 210 bultos = **441,000 tabacos**
- **Marcas producidas:** Gato Negro e Intabaca (mismo proceso, diferentes anillos/vitolas)
