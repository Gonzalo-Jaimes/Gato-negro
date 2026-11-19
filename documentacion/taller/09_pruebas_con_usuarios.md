# Fase 6 · Pruebas con usuarios reales

> **Estado: pendiente de ejecutar por el equipo.** La rúbrica exige 3 tareas críticas evaluadas con **3 personas reales ajenas al diseño**, con tiempos, errores, resultados y la mejora prioritaria que descubran. Esas personas y sus resultados no se pueden generar desde el código ni con IA: inventarlos sería falsificar evidencia. Este documento deja **listo el protocolo completo, las tareas, el guion y las hojas de registro**; las tablas de resultados están **vacías a propósito** y se completan durante las sesiones. Al final hay una lista de hipótesis a verificar y una regla para elegir «la mejora prioritaria».

## 1. Objetivo y qué se mide
Comprobar con personas que no participaron en el diseño si las mejoras (formularios claros, tabla con búsqueda, estados y menú nuevo) permiten completar tareas reales **sin ayuda**.

| Medida | Definición | Cómo se registra |
|---|---|---|
| **Éxito** | 1 = completa sin ayuda · 0,5 = completa tras una pista del moderador · 0 = no completa | Observador |
| **Tiempo en tarea** | Desde que termina de leerse el escenario hasta que dice «listo» o se agota el límite | Cronómetro (mm:ss) |
| **Errores** | Cada clic en un elemento equivocado, cada mensaje de error del sistema que reciba y cada vez que pide ayuda | Observador (conteo y nota) |
| **Facilidad percibida (SEQ)** | «En general, esta tarea fue… » de 1 (muy difícil) a 7 (muy fácil) | Se pregunta al terminar cada tarea |
| **Comentarios** | Frases textuales y puntos donde dudó o frunció el ceño | Observador |

## 2. Participantes (3, ajenos al diseño)
Criterio: no haber trabajado en el diseño ni en el desarrollo, y no haber visto antes la pantalla. Conviene variar el perfil, porque el sistema lo usan tipos distintos de personas:

| # | Perfil sugerido | Dispositivo | Por qué |
|---|---|---|---|
| P1 | Persona administrativa con experiencia en hojas de cálculo | Computador | Usuario típico del módulo de administración |
| P2 | Operario o persona de planta | **Celular** (375 px) | Es quien usa el sistema en la fábrica; prueba las tarjetas y los botones de 44 px |
| P3 | Persona con poca experiencia digital | Computador | Detecta jerga y pasos poco claros |

Registrar edad, ocupación y experiencia previa con sistemas similares (sin nombres si la persona prefiere el anonimato) y **pedir consentimiento** para anotar y, si se desea, grabar la pantalla.

## 3. Las tres tareas críticas

Cada tarea se entrega al participante en una **tarjeta impresa** con solo el escenario (nunca nombres de pantallas ni de botones).

### Tarea 1 · Registrar a un trabajador nuevo (Empleados)
- **Escenario:** «Hoy empezó a trabajar Marta Ruiz Gómez. Su documento es CC-52123456 y le toca el código ZZ91. Regístrala en el sistema.» *(Código `ZZ91` para P1, `ZZ92` para P2 y `ZZ93` para P3, para no chocar con registros reales ni entre sí.)*
- **Punto de partida:** sesión de administrador, en el inicio.
- **Éxito:** Marta aparece en la lista con los datos correctos.
- **Límite:** 4 min.
- **Cuidado:** esta tarea **escribe en la base de datos**. Usar códigos de prueba (`ZZ91`, `ZZ92`, `ZZ93`, uno por participante) en lugar de datos reales y **eliminar** esos registros al terminar cada sesión desde la propia pantalla. Requiere que el equipo lo apruebe; si no se quiere escribir, sustituir por una prueba en un entorno de ensayo.

### Tarea 2 · Responder una pregunta con el historial (Kardex)
- **Escenario:** «La dueña quiere saber cuántas veces ha salido material de capa de la bodega y de qué fue la última salida. Dime las dos cosas.»
- **Punto de partida:** inicio.
- **Éxito:** da el número correcto y el detalle de la salida más reciente. *Respuesta de referencia el 17/11/2026: **33** salidas de «capa»; el observador debe recalcularla antes de cada sesión (filtro «Salidas» + búsqueda «capa»), porque el Kardex cambia.*
- **Límite:** 5 min.
- **Seguridad:** solo lectura; no hay riesgo para los datos.

### Tarea 3 · Preparar una asignación de tabacos (Despacho)
- **Escenario:** «A Blanca Alvarado hay que asignarle 2 500 tabacos hoy. Averigua cuántos kilos de capa, capote y picadura se le deben entregar y cuántas cestas.» *(Se pide **averiguar**, no registrar la salida.)*
- **Punto de partida:** inicio.
- **Éxito:** reporta capa 2,5 kg, capote 4,5 kg, picadura 17,5 kg y 2 cestas.
- **Límite:** 5 min.
- **Seguridad:** el participante **no** pulsa «Registrar salida e imprimir»; el moderador lo dice al empezar. Solo lectura.
- **Variante móvil:** P2 la hace en el celular.

## 4. Guion del moderador
1. **Bienvenida (2 min):** «Estamos probando el sistema, no a ti. No hay respuestas incorrectas. Si algo es confuso, es culpa del sistema. Puedes parar cuando quieras.»
2. **Pensar en voz alta:** «Mientras lo haces, cuéntame qué piensas y qué esperas que pase.»
3. **Entregar la tarjeta** y empezar el cronómetro cuando termine de leerla.
4. **Frases neutras permitidas:** «¿Qué esperabas que pasara?», «¿Qué harías ahora?», «Sigue como lo harías normalmente».
5. **Prohibido:** señalar botones, leer el nombre de una pantalla, decir «casi» o «ya casi». Si lleva más de 1 minuto atascado, dar **una** pista general y anotar 0,5.
6. **Al terminar cada tarea:** preguntar el SEQ (1–7) y «¿qué fue lo más confuso?».
7. **Cierre (3 min):** «¿Qué es lo primero que cambiarías?», «¿Qué te gustó?».

## 5. Hoja de registro por participante
*Copiar una por persona. Dejar vacío hasta la sesión.*

**Participante:** P__ · **Fecha:** ____ · **Dispositivo:** ____ · **Moderador/observador:** ____ · **Perfil:** ____________

| Tarea | Éxito (1 / 0,5 / 0) | Tiempo (mm:ss) | Errores (n) | SEQ (1–7) | Dónde dudó / frases textuales |
|---|:-:|:-:|:-:|:-:|---|
| 1 · Registrar trabajador | | | | | |
| 2 · Historial del Kardex | | | | | |
| 3 · Asignación en Despacho | | | | | |

**Lo primero que cambiaría (palabras del participante):** ____________________________________________

## 6. Consolidado (completar al terminar las 3 sesiones)

| Tarea | Éxito medio | Tiempo medio | Tiempo mín.–máx. | Errores por persona | SEQ medio |
|---|:-:|:-:|:-:|:-:|:-:|
| 1 · Registrar trabajador | | | | | |
| 2 · Historial del Kardex | | | | | |
| 3 · Asignación en Despacho | | | | | |

**Cómo leerlo:** con solo 3 personas el análisis es **cualitativo**; los promedios orientan pero no son estadísticamente concluyentes. Un problema que aparece en 2 de 3 personas ya es prioritario.

### Mejora prioritaria descubierta
Listar cada problema observado y puntuarlo:

| Problema observado | Personas afectadas (de 3) | Severidad (0 = no es problema … 4 = catastrófico) | Prioridad = personas × severidad | Cambio propuesto |
|---|:-:|:-:|:-:|---|
| | | | | |

**La mejora prioritaria es la fila con mayor puntaje**; si hay empate, la que impide completar una tarea. Documentar además qué se cambió en el código y volver a probar esa tarea con una persona más (opcional).

## 7. Revisión previa (heurística, **no** es una prueba con usuarios)
Antes de las sesiones se hizo un recorrido cognitivo de las tres tareas para no gastar a los participantes en problemas evidentes. **Son predicciones a verificar, no resultados**:

| Tarea | Posible fricción prevista | Qué observar | Estado |
|---|---|---|---|
| 1 | El prefijo del documento («CC-») puede no entenderse; el código en minúscula | ¿Escribe el documento con o sin prefijo? ¿Lee la ayuda? | A verificar |
| 2 | El botón «Ver detalle» y el filtro «Tipo» pueden pasar desapercibidos | ¿Cuánto tarda en encontrar el detalle? ¿Usa la búsqueda o recorre la lista? | A verificar |
| 3 | El botón verde estaba deshabilitado **sin explicar por qué** | ¿Entiende que debe calcular el pesaje primero? | **Corregido antes de las pruebas**: ahora hay una ayuda visible («Para habilitar el botón verde: elige al fabriquín y pulsa «Calcular pesaje»») que desaparece al calcular |
| 3 | El selector de fabriquín se abre al escribir; alguien podría no saber que hay que elegir de la lista | ¿Elige de la lista o deja el texto escrito? | A verificar |
| Todas | En móvil, la lista de trabajadores son tarjetas: la acción «Eliminar» queda al final de cada una | ¿Toca sin querer «Eliminar»? (hay confirmación) | A verificar |

## 8. Después de las pruebas
1. Completar las tablas y calcular el consolidado.
2. Elegir la mejora prioritaria, implementarla y registrarla en `08_antes_y_despues.md` o en un anexo.
3. Incluir en la sustentación: una frase de cada participante, el tiempo medio por tarea y la mejora que cambió el código.
4. Guardar las hojas de registro (fotos o PDF) como evidencia en `documentacion/taller/evidencia_usuarios/`.
