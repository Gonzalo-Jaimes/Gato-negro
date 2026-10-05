# Módulo Envolvedoras

## 1. Visión General
El módulo de **Envolvedoras** es el componente de Gato Negro encargado de gestionar el último paso del proceso de producción artesanal del tabaco, donde los tabacos ya anillados son cubiertos con su capa final de papel.

Este módulo comparte gran parte de su arquitectura lógica con el **Módulo de Anilladores**, con la diferencia física de que a las envolvedoras se les despacha **Papel** (pesado en kilogramos) en lugar de Anillos y Pega Yuca.

## 2. Flujo Operativo

### 2.1 Despacho y Control Semanal (Matriz)
A diferencia de otras áreas que son estrictamente diarias, las envolvedoras manejan una **Hoja Semanal**:
1. Se asigna una envolvedora a una semana de trabajo.
2. Se le asigna una cantidad de **Cestas** y se calcula el **Papel a entregar** pesando "50 tabacos". (Se calcula: `cestas * 25 grupos * peso_50_tabacos`).
3. Durante los 6 días de la semana (Lunes a Sábado), se registran:
   - **Cestas IN:** Cestas que la envolvedora se lleva para trabajar.
   - **Cestas OUT:** Cestas con trabajo terminado que la envolvedora trae.
   - **Papel Extra:** Papel adicional entregado ese día.

### 2.2 Recepción Diaria Simplificada (Nuevo)
Para facilitar ingresos rápidos al inventario y liquidaciones de mermas diarias, se implementó un formulario de **Recepción de Tabacos Envueltos**:
- El administrador selecciona la envolvedora.
- Ingresa la cantidad de **Tabacos Envueltos (OK)** entregados.
- Registra las mermas: **Merma de Papel** y **Merma de Tabacos (partidos)**.
- El sistema automáticamente ingresa estos tabacos al inventario de *Tabacos Envueltos* y registra el movimiento de entrada en la auditoría.

## 3. Base de Datos
- **recepcion_envolvedoras**: Tabla principal que almacena el Control Semanal (Matriz de Lunes a Sábado).
- **empleados_fabriquines**: Por herencia del sistema anterior, las envolvedoras están registradas en la tabla de fabriquin. Se planea una futura migración para independizar sus datos de deuda (similar a `empleados_anilladores`).
- **inventario**: Actualiza la suma de materiales terminados (`%tabaco%envuelto%`) mediante los endpoints de recepción.

## 4. UI/UX
La interfaz utiliza el diseño de formulario horizontal (cajas expansibles con bordes temáticos `#10b981`), asegurando consistencia visual. Se implementaron correcciones de CSS para el **Modo Oscuro**, previniendo fondos blancos invasivos en las cajas de secciones (`.section-box`).


## 5. Separación por Marcas (Gato vs Intabaca)
Para soportar la producción de múltiples líneas de productos, el módulo ahora rastrea la **Marca** específica que está siendo envuelta.
- Al despachar (asignar semana), el sistema exige seleccionar la **Marca** (Gato o Intabaca).
- El sistema descuenta automáticamente los *Tabacos Anillados (Marca)* del Inventario Global.
- Al liquidar la semana, los tabacos producidos ingresan al Inventario Global como *Tabacos Envueltos (Marca)*.
- Esto requirió agregar una columna `marca` en la tabla `recepcion_envolvedoras`.