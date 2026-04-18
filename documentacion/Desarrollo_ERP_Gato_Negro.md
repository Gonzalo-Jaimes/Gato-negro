# PROPUESTA DE INVESTIGACIÓN: SEMILLERO DE INVESTIGACIÓN (UNIPAMPLONA) 🐈‍⬛

---

**TÍTULO DE LA PROPUESTA:**  
DESARROLLO E IMPLEMENTACIÓN DE UN SISTEMA ERP HÍBRIDO CON ASISTENTE VIRTUAL INTELIGENTE (BCB) PARA LA OPTIMIZACIÓN DE RECURSOS Y TRAZABILIDAD EN LA MANUFACTURA ARTESANAL TABACALERA.

**Línea de Investigación:**  
Automatización, Control y Sistemas Inteligentes (Sujeto a las líneas del Programa de Ingeniería Mecatrónica).

**Nombre del Tutor:**  
JEISSON HARVEY MARTINEZ FLOREZ

**Nombre del Semillero(s):**  
ROBOLAB

**Sede:**  
Sede Villa del Rosario (Universidad de Pamplona)

**Ubicación de la Empresa:**
Fábrica de Tabacos Gato Negro. Barrio Pinto Salinas, San Antonio, Estado Táchira (Venezuela).

**Grupo(s) de Investigación:**  
LOGOS

**Facultad:**  
Facultad de Ingenierías y Arquitectura.

**Duración:**  
12 meses.

---

### Resumen

El proyecto aborda la brecha digital en la industria manufacturera artesanal de la región frontera, tomando como caso de estudio la **Fábrica de Tabacos Gato Negro**, ubicada en el Barrio Pinto Salinas de San Antonio del Táchira. La investigación se centra en la transición de un modelo administrativo manual y centralizado (basado en papel y el software *legacy* Anubis) hacia un ecosistema digital integral (ERP). 

La innovación principal radica en una arquitectura híbrida _Offline-First_ que garantiza la continuidad operativa en zonas de baja conectividad, integrada con un Asistente Virtual Inteligente denominado _Black Cat Bot_ (BCB). Este asistente utiliza lógica de procesamiento de lenguaje natural para permitir el registro de producción y mermas directamente desde dispositivos móviles, eliminando cuellos de botella y proporcionando analítica de datos en tiempo real para la toma de decisiones gerenciales.

### Planteamiento del Problema

**Contexto del Caso de Estudio: Fábrica de Tabacos Gato Negro**
La Fábrica de Tabacos Gato Negro, ubicada en el Barrio Pinto Salinas, San Antonio del Táchira (Venezuela), es una industria dedicada a la manufactura y comercialización artesanal de tabacos. Su estructura productiva se compone de las siguientes etapas eslabonadas:
1. **Bodega y Procesamiento Base:** La materia prima en crudo se recibe y procesa internamente (por ejemplo, el tratamiento de la hoja para generar la "picadura picada" que servirá de relleno). Luego, la administración despacha al fabriquin: Capa, Capote, sacas de Picadura e inventario de cestas vacías (para el retorno), además de registrar ventas internas de insumos como goma y periódico.
2. **Manufactura Manual (Fabriquines):** Los artesanos arman los tabacos "en bola" (atados de 50 unidades) y los retornan a la empresa consolidados dentro de las mismas cestas prestadas, a razón de 1,250 tabacos por cesta.
3. **Endulzado:** Etapa de tratamiento donde los tabacos elaborados reciben un baño o aplicación química que aporta saborización y preservación.
4. **Anillado y Envoltura:** Operarios sucesivos colocan el anillo representativo de la marca y recubren el producto con papel de envoltura final.
5. **Empaque y Despacho Logístico:** Se agrupan en cajas de 25 y 50 unidades. Estas se embalan en bultos mayores que son cargados en camiones logísticos para su distribución en toda Venezuela.

En este flujo interviene un engranaje humano claramente definido: equipo de Administración y Bodega, Mecánicos, el núcleo de obreros artesanos (Fabriquines, Anilladores, Envolvedoras, Empacadores), el Supervisor General y el estrato de Contabilidad.

**Estado Actual de los Procesos (Pre-ERP)**
Actualmente, el control logístico (entrega de materia prima, ventas de insumos y recepción de tabacos elaborados y mermas) se ejecuta de forma manual y fragmentada. El personal lleva el control mediante apuntes físicos y comprobantes de papel. Posteriormente, estos datos se transcriben a Excel y a un software heredado (*legacy*) llamado Anubis. El servidor de este sistema reside en un solo ordenador local que alimenta por red a otros 5 computadores dentro de la empresa. Esta anticuada arquitectura provoca asincronía y desorden constante en la información compartida entre los administrativos y la planta obrera. Además, el cierre contable requiere iteraciones de hasta una semana para consolidar todos los reportes (para proceder al pago), impidiendo cualquier auditoría de inventario integral en el momento.

Este panorama actual detona los siguientes **problemas detectados**:

1.  **Silos de información entre las áreas de bodega, producción y administración:** La gerencia contable y de recursos humanos opera "a ciegas" de lunes a viernes, ya que los datos vitales del inventario no están sincronizados en tiempo real. 
    *   *Consecuencia:* Pérdidas de oportunidad estratégica. La empresa no puede anticipar de manera oportuna la compra de materias primas clave, afectando el abastecimiento y distorsionando las previsiones financieras.
2.  **Centralización excesiva del flujo de información en un solo supervisor (Single Point of Failure):** Al concentrar toda la carga intelectual de suma y resta, además del registro de docenas de cestas de tabaco en una sola persona, se crea un embudo crítico de procesamiento.
    *   *Consecuencia:* Riesgo operativo extremo. Si el supervisor general se indispone o ausenta, la fábrica sufre paralizaciones burocráticas y cognitivas severas, cortando de raíz el flujo productivo.
3.  **Errores humanos recurrentes en cálculos matemáticos de producción y mermas:** Controlar matemáticamente la cuota de cientos de materiales, ventas de insumos y mermas (Vena a $3,500/kg y Recorte a $6,500/kg) a mano todos los días para una plantilla concurrente de casi 50 personas vulnera el umbral de error de cualquier encargado.
    *   *Consecuencia:* Fugas monetarias directas y desconfianza. Genera pagos inexactos repetitivos que desangran financieramente a Gato Negro o, en su defecto, mal pagos que frustran al trabajador. Además, un simple error humano rompe por completo la cuadratura del Kardex, creando vacíos de inventario.
4.  **Vulnerabilidad operativa ante interrupciones de conectividad a internet:** La frontera y la zona industrial de San Antonio presentan un índice innegable de inestabilidad eléctrica y de conectividad de los proveedores ISP.
    *   *Consecuencia:* Un software en la nube dependiente 100% de la red se volvería una barrera, paralizando la fábrica y generando pérdidas inmediatas de dinero por hora muerta y frustración del personal obrero que cobra por destajo.

**Pregunta de Investigación:**
Considerando este escenario, *¿Cómo puede un sistema web ERP con arquitectura modular e integración de asistentes virtuales inteligentes mitigar la desincronización administrativa, reducir los errores en el cálculo de nóminas por destajo y optimizar la trazabilidad de inventarios en una fábrica de manufactura artesanal con alta rotación de materia prima?*

---

### Objetivos

**Objetivo General:**  
**Desarrollar** una infraestructura tecnológica integral (ERP + AI Bot) que automatice el control de producción, inventarios y mantenimiento, transformando la gestión operativa de Gato Negro en un modelo basado en datos y trazabilidad en tiempo real.

**Objetivos Específicos:**

1.  **Diagnosticar** los procesos productivos, logísticos y administrativos de la fábrica para mapear los flujos de información e identificar los puntos críticos de falla actuales.
2.  **Definir** los requerimientos funcionales y no funcionales de los usuarios para estructurar los subsistemas que conformarán el ERP.
3.  **Diseñar** la arquitectura e infraestructura de software, estableciendo el entorno de servidor, alojamiento en la nube y modelo relacional de la base de datos.
4.  **Desarrollar** la arquitectura tecnológica del Asistente Virtual Inteligente (IA Bot) y programar su integración con los módulos operativos del ERP.
5.  **Evaluar** el desempeño operativo del sistema mediante un estudio comparativo de los tiempos de respuesta y errores de trazabilidad antes y después de la implementación tecnológica.

---

### Antecedentes y Justificación (Estado del Arte)

La revisión de la literatura reciente evidencia el profundo impacto que los sistemas de gestión integral tienen en el sector empresarial. Un estudio de caso enfocado en una pequeña y mediana empresa (PYME) española demostró que la adopción de herramientas ERP, CRM y computación en la nube transformó radicalmente su gestión administrativa, reemplazando con éxito herramientas arcaicas como Excel y los frágiles registros físicos [7]. En el contexto latinoamericano, una revisión sistemática de 61 artículos concluyó que las soluciones ERP administradas en la nube resultan altamente ventajosas para las PYMES debido a su significativa reducción de costos operacionales, rápida implementación y maleabilidad técnica [6]. En escalas industriales de alta capacidad, la literatura comprueba que la integración de herramientas de Inteligencia Artificial (IA) en estos sistemas corporativos y de cadena de suministro permite mejorar drásticamente la capacidad analítica. Casos reportados de empresas como Unilever, DHL, Walmart y Procter & Gamble establecen referentes donde el uso de IA ha provocado ganancias de eficiencia operativa superiores al 25%, reducciones de costos del 15% y mejoras inmediatas en la precisión de los pronósticos logísticos y de inventarios [1], [3].

A pesar del éxito comercial de las plataformas ERP "SaaS" estandarizadas, estas soluciones genéricas presentan severas deficiencias estructurales al aplicarse a la realidad manufacturera de la frontera colombo-venezolana: no logran operar de forma continua bajo esquemas de desconexión a internet recurrente, ni poseen la arquitectura algorítmica específica requerida para costear y calcular mermas milimétricas (como los pesajes de vena y recorte por destajo obrero). En consecuencia, **este proyecto no busca destacar simplemente por "crear un ERP más"**; su verdadero núcleo innovador radica en construir la arquitectura y la infraestructura técnica fundacional (redes *Offline-First* y bases de datos asíncronas) indispensable para edificar sobre ella toda una estrategia contemporánea de captación, gestión y aprovechamiento de datos.

La justificación técnica de este proyecto radica en la aplicación de la ingeniería mecatrónica fuera del taller mecánico, aplicándola a la **Mejora de Procesos** mediante la integración de software y hardware móvil. El impacto socioeconómico se traduce en pagos más justos y precisos para los trabajadores, y una mayor competitividad para la empresa al evitar fugas de material no registradas. Finalmente, el despliegue del sistema consolida la ineludible transición de la fábrica hacia una cultura gerencial **Data-Driven**. Bajo este paradigma organizacional, la empresa suprime la dependencia humana, garantizando que absolutamente toda decisión comercial u operativa esté premediada por datos exactos extraídos de la planta y procesados en tiempo real por ecosistemas de IA.

### Marco Teórico

Este proyecto se fundamenta sobre un conjunto de pilares teóricos interdisciplinarios que convergen entre la gestión administrativa, la ingeniería de procesos industriales y la arquitectura de software.

**Pilar 1: Sistemas de Planificación de Recursos Empresariales (ERP)**
Un Sistema de Planificación de Recursos Empresariales (ERP, por sus siglas en inglés) es una arquitectura de software integral que centraliza, automatiza y articula la información entre todas las áreas funcionales de una organización [2]. Su integración dentro de una empresa responde a la necesidad de sincronizar el flujo operativo, y su propósito puede desglosarse de la siguiente manera:
*   **¿Para qué se usa?** Para consolidar en una base de datos centralizada (fuente única de la verdad) la información proveniente de recepciones de bodega, contabilidad por destajo y despachos de producto terminado, logrando una trazabilidad absoluta sin silos de datos.
*   **¿Por qué se integra?** Porque el crecimiento en el volumen de nómina de obreros y de flujos de insumos hace ineficiente (y sumamente propensa a errores) la transcripción manual concurrente. Una implementación exitosa de un ERP en la nube (Cloud ERP) mitiga estos problemas destacándose por su compatibilidad de sistema y seguridad de datos apuntalados por la gerencia [2].
*   **¿Quiénes lo usan?** De forma piramidal e interactiva: lo nutren los obreros, supervisores de planta y operarios de bodega (quienes lo usan como interfaz transaccional en tiempo real para sus despachos), para que a su vez contadores, analistas y la gerencia ejecutiva accedan a visualizadores globales para interpretar estadísticamente la rentabilidad general de nómina/producción. 
*   **¿Dónde y Cuándo?** Específicamente en plantas manufactureras o pymes operando con cadenas de valor simultáneas; debiéndose implementar en el preciso momento de escalabilidad donde las falencias de comunicación asíncronas y el papeleo rústico comienzan a generar horas muertas, cuellos de botella y vulnerabilidades lógicas para la empresa.

**Pilar 2: Business Intelligence (BI) y el Paradigma *Data-Driven***
La Inteligencia de Negocios (BI) engloba las estrategias, lógicas de programación y tecnologías orientadas al análisis predictivo del inmenso cúmulo de historiales numéricos forjados en el día a día. En lugar de almacenar bases de datos mudas, el ERP instrumenta técnicas BI (a nivel de Front-End, empleando librerías especializadas en renderizado de gráficos como *Chart.js* o *Canvas*) preprocesando sumatorias estadísticas de las metas productivas vs. insumo perdido. Este engranaje robustece a la tabacalera hacia una filosofía inquebrantable de tipo organizacional: **Data-Driven**. Una organización *Data-Driven* destierra los caprichos administrativos e inercias especulativas en base a "instintos directivos", subordinando la totalidad de su modelo resolutivo y toma estratégica de decisiones hacia el dictamen exacto proporcionado metódicamente por su nube de datos en milisegundos.

**Pilar 3: Filosofía *Lean Manufacturing* (Manufactura Esbelta) e *Industry 4.0***
Derivado inicialmente en la cúspide automotriz nipona, consiste fundamentalmente en un axioma purista orientado a detectar sistemáticamente y erradicar el "Muda" (término japonés para desperdicio). Definiendo desperdicio desde la esfera de procesos: se enjuicia toda interrupción que absorba costos, tiempo intelectual o mano de obra, fallando en sumar valor real y tangencial del producto fabricado, al final de la línea productiva. La literatura contemporánea confirma empíricamente los beneficios y retos de integrar tecnologías de la Industria 4.0 con metodologías Lean [4]. Computacionalmente, durante el viejo ecosistema administrativo prevaleciente de Gato Negro, escribir manualmente pesajes gramo a gramo mediante un bloc de notas improvisado, para que días siguientes un gerente descifre la grafía y re-anote estas estadísticas dentro de hojas tabulares es considerado a niveles corporativos un profundo desperdicio limitante. Suprimir lo que llamaremos de aquí en el documento el "Muda Informativo", maximiza la velocidad intrínseca del engranaje.

**Pilar 4: *IA-Driven Decision Making* e Ingeniería de Software (Arquitectura MVC)**
Los sistemas vanguardistas contemporáneos insertan algoritmos incrustados en inteligencia artificial ya no como curiosas herramientas de soporte ocultas, sino propiciando esquemas directivos **IA-Driven**. Desplegando algoritmos analíticos por Procesamiento de Lenguaje Natural (ejemplificados en la función medular del presente ERP: nuestro Asistente ChatBot *Black Cat Bot* o BCB), logramos edificar un puente conector simplificado; apto cognitivamente para disminuir abruptamente la curva y fricción en la alfabetización digital. Su impacto directo va incluso a potenciar la seguridad laboral, eficiencia operativa y toma de decisiones, a pesar de los desafíos de adopción tecnológica en operarios [8]. El corazón logístico transaccional detractor de vulnerabilidades obliga el apego metodológico a un Patrón de Diseño informático de **Arquitectura MVC (Modelo-Vista-Controlador)**. MVC instaura la deconstrucción e independencia de códigos; un segmento blindado persiste las transacciones y encriptaciones en PostgreSQL asincrónicamente mediante *Supabase* (Modelo), otro bosqueja y renderiza instantáneamente los gráficos (Dark Mode o Light mode según preferencia perceptiva) empleando compilación HTML/EJS (Vista final) para los móviles locales, y una unidad intermedia logarítmica alojada en entornos Cloud y Node.js intercepta inyecciones cibernéticas, sumando la métrica analítica obrera con cada actualización masiva del Kardex (Controlador).

---

### Metodología y Cronograma de Actividades (Gantt)

El proyecto adopta un enfoque de desarrollo estructurado y ágil, dividiendo los 12 meses de duración en cuatro fases iterativas. A continuación, se desglosan las actividades específicas correspondientes:

**Fase 1: Diagnóstico y Requerimientos**
*   **Actividad 1.1:** Realizar entrevistas estructuradas en planta con la administración para mapear el flujo físico de la materia prima.
*   **Actividad 1.2:** Analizar las falencias del software heredado (Anubis) y auditar las plantillas de Excel actuales utilizadas para el control de nómina y mermas.
*   **Actividad 1.3:** Documentar los requerimientos funcionales y no funcionales del ERP para establecer los límites técnicos de los subsistemas.

**Fase 2: Diseño de Arquitectura e Infraestructura**
*   **Actividad 2.1:** Diseñar el diagrama Entidad-Relación (ER) y estructurar las tablas maestras de la base de datos relacional.
*   **Actividad 2.2:** Configurar y desplegar la infraestructura en la nube utilizando Supabase (PostgreSQL) garantizando los protocolos de seguridad.
*   **Actividad 2.3:** Estructurar la arquitectura MVC (Modelo-Vista-Controlador) utilizando Node.js y preparar los entornos de servidor para alojamiento en Vercel.

**Fase 3: Desarrollo del ERP e Integración del Asistente (IA Bot)**
*   **Actividad 3.1:** Programar la lógica de negocio de los módulos operativos clave: Despachos, Recepción Acumulativa (Vena/Recorte), Inventario y Nómina.
*   **Actividad 3.2:** Desarrollar la interfaz gráfica adaptativa (UI/UX) con soporte de modo oscuro para áreas industriales y capacidad Offline-First.
*   **Actividad 3.3:** Diseñar la arquitectura del asistente conversacional Black Cat Bot (BCB) e integrar su lógica de Procesamiento de Lenguaje Natural (LLM) con la base de datos.

**Fase 4: Pruebas, Evaluación de Desempeño y Despliegue**
*   **Actividad 4.1:** Ejecutar pruebas de estrés e integración en la planta de manufactura, midiendo la sincronización de datos en condiciones de conectividad limitada.
*   **Actividad 4.2:** Realizar un estudio comparativo de los indicadores de rendimiento (Tiempos de cierre y descuadres de inventario), contrastando el estado pre-ERP con el estado post-ERP.
*   **Actividad 4.3:** Redactar el manual de usuario técnico, el informe de proyecto de grado final y preparar el artículo de difusión científica.

#### Presentación del Diagrama de Gantt

| Fases y Actividades | M1 | M2 | M3 | M4 | M5 | M6 | M7 | M8 | M9 | M10 | M11 | M12 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Fase 1: Diagnóstico y Requerimientos**| | | | | | | | | | | | |
| Actividad 1.1 | █ | | | | | | | | | | | |
| Actividad 1.2 | █ | █ | | | | | | | | | | |
| Actividad 1.3 | | █ | | | | | | | | | | |
| **Fase 2: Arquitectura e Infraestructura**| | | | | | | | | | | | |
| Actividad 2.1 | | | █ | | | | | | | | | |
| Actividad 2.2 | | | █ | █ | | | | | | | | |
| Actividad 2.3 | | | | █ | | | | | | | | |
| **Fase 3: Desarrollo e Integración IA** | | | | | | | | | | | | |
| Actividad 3.1 | | | | | █ | █ | █ | | | | | |
| Actividad 3.2 | | | | | | █ | █ | █ | | | | |
| Actividad 3.3 | | | | | | | | █ | █ | | | |
| **Fase 4: Pruebas, Despliegue y Cierre**| | | | | | | | | | | | |
| Actividad 4.1 | | | | | | | | | █ | █ | | |
| Actividad 4.2 | | | | | | | | | | █ | █ | |
| Actividad 4.3 | | | | | | | | | | | █ | █ |

---

### Presupuesto Detallado (Estimado en $COP)

El siguiente presupuesto está ajustado a la realidad académica y financiera del proyecto. Para ser viable, se ha planificado una arquitectura que exprime los ecosistemas *Serverless* en "Capa Gratuita" (Free Tier) y aprovecha el código abierto, minimizando los gastos de infraestructura al menos durante su primer año de uso. Por recomendación de los evaluadores, a continuación se tabulan las estimaciones de los costos asociados:

| Rubro | Descripción y Justificación | Costo Mensual | Total Estimado (12 Meses) |
| :--- | :--- | :--- | :--- |
| **Servidores y Almacenamiento (API)** | Alojamiento en Vercel y base de datos PostgreSQL en Supabase. Ambos ecosistemas cubren el ancho de banda necesario actual mediante infraestructura de **Capa Gratuita (Free Tier)**. | $0 COP | **$0 COP** |
| **Licencias de Software de Terceros** | Herramientas de código abierto (VS Code, Node.js) y suscripción mensual a un asistente de programación impulsado por Inteligencia Artificial (Google Gemini Pro). | $20,000 COP | **$240,000 COP** |
| **Dominio Web** | Compra y renovación anual de un dominio personalizado (ej. `gatonegroerp.com` o `.co`) que incluye su asignación DNS a Vercel. | N/A (Pago Anual) | **$80,000 COP** |
| **Hardware en Planta** | Red de 5 computadores de escritorio preexistentes en la fábrica. Dado que el sistema usará el entorno web, la empresa iterará sobre su hardware actual sin inversión adicional. | N/A (Infraestructura Existente) | **$0 COP** |
| **Desplazamiento (Transporte de Campo)** | Gasto proporcional de combustible (motocicleta propia del investigador) calculado exclusivamente para las visitas de campo a San Antonio los días sábados/lunes. | $15,000 COP | **$180,000 COP** |
| **Recursos Humanos (Desarrollador)** | Honorarios de investigación (Investigador principal / Desarrollador). Métrica calculada en base a 20 horas semanales (4 horas interdiarias) dedicadas exclusivamente al proyecto valoradas a $6,818 COP/hora (Tasa formal de empresa). | $545,440 COP | **$6,545,280 COP** |
| **TOTAL VALORACIÓN DEL PROYECTO** | *(El 93% de este presupuesto funge como contrapartida cubierta por la Fábrica Gato Negro mediante la remuneración en horas-hombre del trabajador/investigador).* | | **$7,045,280 COP** |


---

### Resultados Esperados, Métricas de Éxito e Impactos

El desarrollo del **ERP Gato Negro** no representa simplemente una mejora de interfaz, sino que constituye una erradicación completa de la obsolescencia arraigada por métodos rudimentarios como hojas de papel sueltas y el software *legacy* (Anubis). Los resultados de este proyecto se evaluarán con base en tres ejes: tecnológico, logístico y socioeconómico.

#### 1. Entregable Tecnológico y Escalabilidad (Modelo de Licenciamiento)
El proyecto entregará una arquitectura de software 100% nativa en la nube (Web/PWA adaptativa), diseñada bajo infraestructura modular para que su uso no sea exclusivo y bloqueado para una sola entidad, sino que pueda empaquetarse corporativamente bajo el esquema **SaaS (Software como Servicio)** con proyecciones de tres niveles (Licencias):
*   **Tier 1 (Core ERP):** Módulo central que encapsula el Kardex, lógica matemática de despachos, control de bodega, anticipos/deudas y liquidación automatizada de nóminas. Usado administrativamente.
*   **Tier 2 (AI-Bot Integration):** Integra el núcleo ERP con el ecosistema de *Black Cat Bot (BCB)* en Telegram para interacciones de PNL en dispositivos móviles in situ, facilitando el trabajo de supervisores en piso. (Versión piloto actual).
*   **Tier 3 (Predictivo Visual - A Futuro):** Una capa analítica anexa impulsada por Redes Neuronales (Deep Learning) capaz de inferir y pronosticar faltantes estacionales de materia prima en frontera. 

#### 2. Indicadores de Rendimiento (Contraste Antes vs. Después)
El éxito del despliegue en la línea de producción se validará frente a las siguientes métricas cuantificables:
*   **Eficiencia en el Cierre de Nómina por Destajo:** Pasar de un proceso tedioso de conciliación manual y transcripción a Excel que tomaba tradicionalmente varios días (3-5 días hábiles), a un cálculo de nómina determinista con cierre automático en **menos de 5 segundos**.
*   **Rendimiento en Línea de Despachos en Bodega:** Reducir el tiempo de pesaje, anotación de mermas (vena, recorte) y despacho de cestas de 10-15 minutos por trabajador manual en ventanilla, a **menos de 45 segundos** a través del registro asíncrono en sistemas móviles conectados al entorno Supabase.
*   **Supresión de "Muda" (Cero Papel):** Eliminación estimada del **98%** de los comprobantes, post-its y tiquetes impresos, resguardando todo en transacciones con marca de tiempo en PostgreSQL.
*   **Precisión y Cuadratura Matemática:** Reducción comprobable del **100% de errores de cálculo humano** en sumas y restas de balanzas, bloqueando la fuga financiera y descuadres en el inventario final.

#### 3. Impacto Socio-Técnico en los Actores
*   **Rol de Obreros (Fabriquines, Anilladores):** Impacto psicológico y de confianza. La transparencia del sistema asegura que la unidad fabricada (tabaco a destajo) se les pagará con precisión logarítmica, suprimiendo desacuerdos con liquidadores e injusticias obreras.
*   **Rol de Supervisores:** Impacto en la Salud Laboral y Ergonómica. Al descentralizar el ingreso de datos, el supervisor abandona su condena de ser el "Único Punto de Falla" saturado llenando blocs de notas físicos todo el día, transformando su labor a ser un gestor visual dinámico evaluando KPIS métricos.
*   **Rol de Gerencia y Auditores:** Adquisición de la característica **Omnipresencia**. La directiva contable de Gato Negro logrará auditar el flujo de material y dinero sin importar fronteras (24/7), democratizando una gerencia verdaderamente enfocada en crecimiento y no en labores repetitivas.

---

### Estrategia de Difusión

1. **Divulgación audiovisual y recursos digitales.** Se elaborarán contenidos audiovisuales orientados a la explicación del funcionamiento, arquitectura y aplicaciones del sistema ERP.
**Productos:**
*   Video demostrativo del software en operación (uso en planta e integración del bot).
*   Repositorio digital con documentación técnica (manuales y diagrama de base de datos).

2. **Producción de material didáctico y documentos técnicos.** Se generarán recursos formales que respalden el uso académico y operativo del ecosistema.
**Productos:**
*   Manual de usuario para operarios y personal administrativo.
*   Cartillas o folletos explicativos para la inducción y alfabetización digital en la fábrica.

3. **Socialización académica y formación investigativa.** Se promoverá la presentación de resultados en espacios académicos internos y externos.
**Productos:**
*   Talleres prácticos para estudiantes de las materias de instrumentación, automatización o ramas afines.
*   Ponencia oral en eventos de semilleros de investigación.
*   Ponencia tipo póster.

4. **Publicación científica y divulgación escrita.** Se estructurará la producción de conocimiento en formatos publicables.
**Productos:**
*   Redacción de un artículo técnico o científico evaluando el impacto tecnológico en la manufactura.
*   Documento de difusión (memorias del proyecto de grado).

---

### Referencias:

[1] L. G. Aguirre Castillo, F. A. Chamorro Fueltala y H. M. Recalde Araujo, "SPN Innovación en sistemas de gestión de recursos empresariales (ERP) impulsados por inteligencia artificial," *Revista Ingeniería e Innovación del Futuro*, vol. 4, no. 1, 2025. https://doi.org/10.62465/riif.v4n1.2025.124

[2] J. C. Barbieri, M. K. Sott y J. M. Monticelli, "Critical Success Factors for Implementing Cloud ERP in SMEs: A Systematic Review," *World Scientific*, 2023. https://doi.org/10.1142/S0219877024300039

[3] D. J. Calle García, "Uso estratégico de la inteligencia artificial en la gestión de la cadena de suministro empresarial," *Cultura Y Desarrollo*, vol. 27, no. 2, 2024. https://doi.org/10.21503/cyd.v27i2.2620

[4] Global Mainstream Journal, "The integration of Industry 4.0 and Lean Technologies in Manufacturing Industries: A Systematic Literature Review," *IJMISDS*, 2024. https://globalmainstreamjournal.com/index.php/IJMISDS/article/view/164

[5] A. Kusiak, "Smart manufacturing," *International Journal of Production Research*, vol. 56, no. 1-2, pp. 508-517, 2018. https://doi.org/10.1080/00207543.2017.1351644

[6] J. H. Muñoz Ruano, J. M. Segura y J. H. Mendoza, "An ERP System for SMEs in Latin America: Literature review," *Ingeniería Solidaria*, vol. 18, no. 1, 2022. https://doi.org/10.16925/2357-6014.2022.01.01

[7] G. Porporato Daher, R. Galindo Dorado y J. Morcillo García, "Digitalización de los procesos contables y administrativos en las pymes españolas. Un caso de estudio," *Revista de Contabilidad y Tributación. CEF*, no. 478, 2023. https://doi.org/10.51302/rcyt.2023.11465

[8] J. C. Vallejo-Morán y S. J. Núñez Solano, "La Inteligencia Artificial en la Gestión de la Seguridad y Salud Laboral en los Procesos Productivos: Una Revisión Sistemática," *Ciencia y Reflexión*, vol. 4, no. 1, 2025. https://doi.org/10.70747/cr.v4i1.215

---

**Nombre Estudiantes Participantes:**  
Gonzalo Andres Jaimes Jaimes  
Identificación: 1148962922  
Programa: Ingeniería Mecatrócnica  

**Firma y nombre del Tutor:**  
Ing. Jeisson Harvey Martinez Florez
