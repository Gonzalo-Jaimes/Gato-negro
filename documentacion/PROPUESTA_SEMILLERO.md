# PROPUESTA DE INVESTIGACIÓN: SEMILLERO DE INVESTIGACIÓN (UNIPAMPLONA) 🐈‍⬛

---

**TÍTULO DE LA PROPUESTA:**  
DISEÑO E IMPLEMENTACIÓN DE UN SISTEMA ERP HÍBRIDO CON ASISTENTE VIRTUAL INTELIGENTE (BCB) PARA LA OPTIMIZACIÓN DE RECURSOS Y TRAZABILIDAD EN LA MANUFACTURA ARTESANAL TABACALERA.

**Línea de Investigació**n:  
Automatización, Control y Sistemas Inteligentes (Sujeto a las líneas del Programa de Ingeniería Mecatrónica).

**Nombre del Tutor:**  
JEISSON HARVEY MARTINEZ FLOREZ

**Nombre del Semillero(s):**  
ROBOLAB

**Sede:**  
Villa del Rosario

**Grupo(s) de Investigación:**  
LOGOS

**Facultad:**  
Facultad de Ingenierías y Arquitectura.

**Duración:**  
12 meses.

---

### Resumen

El proyecto aborda la brecha digital en la industria manufacturera artesanal de la región, tomando como caso de estudio la Fábrica de Tabacos Gato Negro. La investigación se centra en la transición de un modelo administrativo manual y centralizado (basado en papel y hojas de cálculo aisladas) hacia un ecosistema digital integral (ERP). La innovación principal radica en una arquitectura híbrida _Offline-First_ que garantiza la continuidad operativa en zonas de baja conectividad, integrada con un Asistente Virtual Inteligente denominado _Black Cat Bot_ (BCB). Este asistente utiliza lógica de procesamiento de lenguaje natural para permitir el registro de producción, mermas y mantenimiento industrial directamente desde dispositivos móviles, eliminando cuellos de botella y proporcionando analítica de datos en tiempo real para la toma de decisiones gerenciales.

### Planteamiento del problema o Preguntas de Investigación

¿Cómo puede un sistema web ERP con arquitectura modular e integración de asistentes virtuales inteligentes mitigar la desincronización administrativa, reducir los errores en el cálculo de nóminas por destajo y optimizar la trazabilidad de inventarios en una fábrica de manufactura artesanal con alta rotación de materia prima?

**Problemas detectados:**

1. Silos de información entre las áreas de bodega, producción y administración.
2. Centralización excesiva del flujo de información en un solo supervisor (Single Point of Failure).
3. Errores humanos recurrentes en los cálculos matemáticos de mermas (Vena y Recorte) por empleado.
4. Vulnerabilidad operativa ante interrupciones de conectividad a internet.

---

### Objetivos

**Objetivo General:**  
Desarrollar una infraestructura tecnológica integral (ERP + AI Bot) que automatice el control de producción, inventarios y mantenimiento, transformando la gestión operativa de Gato Negro en un modelo basado en datos y trazabilidad en tiempo real.

**Objetivos Específicos:**

1. **Diagnosticar** los procesos productivos, logísticos y administrativos de la fábrica para mapear los flujos de información e identificar los puntos críticos de falla actuales.
2. **Definir** los requerimientos funcionales y no funcionales de los usuarios para estructurar los subsistemas que conformarán el ERP.
3. **Diseñar** la arquitectura e infraestructura de software, estableciendo el entorno de servidor, alojamiento en la nube y modelo relacional de la base de datos.
4. **Desarrollar** la arquitectura tecnológica del Asistente Virtual Inteligente (IA Bot) y programar su integración con los módulos operativos del ERP.
5. **Evaluar** el desempeño operativo del sistema mediante un estudio comparativo de los tiempos de respuesta y errores de trazabilidad antes y después de la implementación tecnológica.

---

### Antecedentes y Justificación

La industria tabacalera en la región ha operado históricamente bajo procesos tradicionales con poca intervención de las TIC. Gato Negro representa un entorno de ingeniería complejo con más de 50 operarios y flujos constantes de materia prima frágil. La justificación técnica de este proyecto radica en la aplicación de la ingeniería mecatrónica fuera del taller mecánico, aplicándola a la **Mejora de Procesos** mediante la integración de software y hardware móvil. El impacto socioeconómico se traduce en pagos más justos y precisos para los trabajadores y una mayor competitividad para la empresa al evitar fugas de material no registradas.

### Impacto esperado

- **Empresarial:** Eliminación del 95% del uso de papel en registros de producción e inventario. Reducción sustancial de descuadres en bodega.
- **Investigativo:** Generación de un modelo replicable de ERP liviano para PYMES de manufactura artesanal en Colombia y Venezuela.
- **Formativo:** Aplicación real de tecnologías de vanguardia (Node.js, PostgreSQL, Artificial Intelligence integration) en problemas industriales tangibles.

---

### Marco teórico

El proyecto se fundamenta en tres pilares:

1.  **Enterprise Resource Planning (ERP):** Sistemas de planificación que garantizan el principio de _Single Source of Truth_ (SSOT).
2.  **Arquitectura MVC y Web API:** Uso de Node.js y Express para la construcción de una lógica robusta y escalable.
3.  **Conversational AI (LLM Integration):** El uso de interfaces de lenguaje natural para la interacción con bases de datos, permitiendo que usuarios no técnicos (operarios de planta) alimenten el sistema sin curvas de aprendizaje complejas.

### Metodología

Se utilizará la metodología ágil **Scrum** con iteraciones periódicas (Sprints), permitiendo ciclos de desarrollo medibles y adaptables:

**Fase 1: Diagnóstico y Requerimientos**

- **Actividad 1.1:** Realizar entrevistas estructuradas en planta con la administración y los operarios (Fabriquines) para mapear el flujo físico de la materia prima.
- **Actividad 1.2:** Analizar las falencias del software heredado (Anubis) y auditar las plantillas de Excel actuales utilizadas para el control de nómina y mermas.
- **Actividad 1.3:** Documentar los requerimientos funcionales y no funcionales del ERP para establecer los límites técnicos de los subsistemas.

**Fase 2: Diseño de Arquitectura e Infraestructura**

- **Actividad 2.1:** Diseñar el diagrama Entidad-Relación (ER) y estructurar las tablas maestras de la base de datos relacional.
- **Actividad 2.2:** Configurar y desplegar la infraestructura en la nube utilizando Supabase (PostgreSQL) garantizando los protocolos de seguridad.
- **Actividad 2.3:** Estructurar la arquitectura MVC (Modelo-Vista-Controlador) utilizando Node.js y preparar los entornos de servidor para alojamiento en Vercel.

**Fase 3: Desarrollo del ERP e Integración del Asistente (IA Bot)**

- **Actividad 3.1:** Programar la lógica de negocio de los módulos operativos clave: Despachos, Recepción Acumulativa (Vena/Recorte), Inventario y Nómina.
- **Actividad 3.2:** Desarrollar la interfaz gráfica adaptativa (UI/UX) con soporte de modo oscuro para áreas industriales y capacidad _Offline-First_.
- **Actividad 3.3:** Diseñar la arquitectura del asistente conversacional _Black Cat Bot (BCB)_ e integrar su lógica de Procesamiento de Lenguaje Natural (LLM) con la base de datos.

**Fase 4: Pruebas, Evaluación de Desempeño y Despliegue**

- **Actividad 4.1:** Ejecutar pruebas de estrés e integración en la planta de manufactura, midiendo la sincronización de datos en condiciones de conectividad limitada.
- **Actividad 4.2:** Realizar un estudio comparativo de los indicadores de rendimiento (Tiempos de cierre y descuadres de inventario), contrastando el estado _pre-ERP_ con el estado _post-ERP_.
- **Actividad 4.3:** Redactar el manual de usuario técnico, el informe de proyecto de grado final y preparar el artículo de difusión científica.

---

### Cronograma de actividades (12 Meses)

| Tiempo Estimado     | Actividades a Desarrollar                                                                                                                                                                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mes 1 - Mes 2**   | • **Diagnóstico General:** Análisis de los procesos productivos manuales y revisión de fallas del sistema _legacy_ (Anubis).<br>• **Levantamiento de Requerimientos:** Entrevistas y definición de requerimientos funcionales para los subsistemas del ERP. |
| **Mes 3 - Mes 4**   | • **Diseño de Infraestructura:** Configuración de servidores, alojamiento y esquema de la base de datos relacional.<br>• **Diseño de Arquitectura de Software:** Estructuración del backend y frontend de la plataforma.                                    |
| **Mes 5 - Mes 6**   | • **Desarrollo de Subsistemas (Ejecución):** Programación de los módulos core (Nómina, Mantenimiento, Bodega).<br>• Diseño de interfaces de usuario (UI/UX) adaptadas a entornos industriales.                                                              |
| **Mes 7 - Mes 8**   | • **Diseño y Arquitectura IA Bot:** Estructuración e integración del Asistente Virtual Inteligente (BCB) con la base de datos.<br>• Implementación de LLMs para procesamiento de lenguaje natural en tareas logísticas.                                     |
| **Mes 9 - Mes 10**  | • **Pruebas de Integración:** Testeo conjunto de todos los módulos del ERP y el Asistente Virtual.<br>• Auditoría de seguridad y pruebas de sincronización en condiciones de baja conectividad.                                                             |
| **Mes 11 - Mes 12** | • **Evaluación de Desempeño:** Medición comparativa de tiempos, errores matemáticos y eficiencia (Estado pre-ERP vs post-ERP).<br>• Entrega de manuales, redacción del informe final y preparación de artículos de difusión.                                |

### Presupuesto

- **Servidores y API:** Gestión de créditos de nube (Supabase, Vercel).
- **Hardware:** Dispositivos móviles inteligentes para supervisores.
- **Recursos Humanos:** Investigador principal y Desarrollador.

---

### Resultados esperados

1.  Software ERP funcional desplegado en producción.
2.  Manual de usuario digital interactivo.
3.  Artículo científico para la revista de investigación de la Unipamplona.
4.  Ponencia en el Encuentro Regional de Semilleros de Investigación.

### Estrategia de Difusión

Presentación del sistema en la exposición de proyectos de la FIA (Facultad de Ingenierías), creación de un video demostrativo de la interacción con el bot BCB y publicación de los logros técnicos en el repositorio institucional.

---

### Referencias

- Al-Shamlan, H. M., & Al-Mudimigh, A. S. (2011). The Changement Management Strategies and Processes for Successful ERP Implementation: A Case Study of MADAR. _International Journal of Computer Science Issues (IJCSI)_, 8(2), 399-407.
- Davenport, T. H. (1998). Putting the enterprise into the enterprise system. _Harvard Business Review_, 76(4), 121-131.
- Kusiak, A. (2018). Smart manufacturing. _International Journal of Production Research_, 56(1-2), 508-517. https://doi.org/10.1080/00207543.2017.1351644
- Mariani, M. M., Perez-Vega, R., & Wirtz, J. (2022). AI in marketing, consumer research and psychology: A systematic literature review and research agenda. _Psychology & Marketing_, 139, 281-304.
- Mutiara, A. B., Juarna, A., & Priyambodo, T. K. (2020). Progressive Web Apps for Offline-First Data Synchronization in Low Connectivity Environments. _Journal of Computer Science and Information Technology_.
- Zhong, R. Y., Xu, X., Klotz, E., & Newman, S. T. (2017). Intelligent Manufacturing in the Context of Industry 4.0: A Review. _Engineering_, 3(5), 616-630.

---

**Nombre Estudiantes Participantes:**  
Gonzalo Andres Jaimes Jaimes  
Identificación: 1148962922  
Programa: Ingeniería Mecatrónica  
Correo electrónico: gonzalo.jaimes@unipamplona.edu.co

---

**Firma y nombre del Tutor** | **Firma y nombre del Director de Grupo de Investigación**
