# PROPUESTA DE INVESTIGACIÓN: SEMILLERO DE INVESTIGACIÓN (UNIPAMPLONA) 🐈‍⬛

---

**TÍTULO DE LA PROPUESTA:**  
DISEÑO E IMPLEMENTACIÓN DE UN SISTEMA ERP HÍBRIDO CON ASISTENTE VIRTUAL INTELIGENTE (BCB) PARA LA OPTIMIZACIÓN DE RECURSOS Y TRAZABILIDAD EN LA MANUFACTURA ARTESANAL TABACALERA.

**Línea de Investigació**n:  
Automatización, Control y Sistemas Inteligentes (Sujeto a las líneas del Programa de Ingeniería Mecatrónica).

**Nombre del Tutor:**  
(Por favor, completar con el nombre de tu tutor asignado en la Unipamplona, ej: Ing. Dairon Salcedo).

**Nombre del Semillero(s):**  
(Completar con el nombre del semillero al que perteneces).

**Sede:**  
Sede Villa del Rosario.

**Grupo(s) de Investigación:**  
GIMUP (Grupo de Investigación en Mecatrónica Universidad de Pamplona) / Otros relacionados.

**Facultad:**  
Facultad de Ingenierías y Arquitectura.

**Duración:**  
12 meses.

---

### Resumen
El proyecto aborda la brecha digital en la industria manufacturera artesanal de la región, tomando como caso de estudio la Fábrica de Tabacos Gato Negro. La investigación se centra en la transición de un modelo administrativo manual y centralizado (basado en papel y hojas de cálculo aisladas) hacia un ecosistema digital integral (ERP). La innovación principal radica en una arquitectura híbrida *Offline-First* que garantiza la continuidad operativa en zonas de baja conectividad, integrada con un Asistente Virtual Inteligente denominado *Black Cat Bot* (BCB). Este asistente utiliza lógica de procesamiento de lenguaje natural para permitir el registro de producción, mermas y mantenimiento industrial directamente desde dispositivos móviles, eliminando cuellos de botella y proporcionando analítica de datos en tiempo real para la toma de decisiones gerenciales.

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
1. Centralizar la base de datos operativa en una arquitectura de nube (Supabase) con capacidad de sincronización local para asegurar operatividad 24/7.
2. Implementar un módulo de gestión de nómina automatizado que liquide pagos por destajo eliminando el uso de comprobantes físicos.
3. Diseñar e integrar un asistente conversacional (BCB) para la captura de datos y reportes de mantenimiento preventivo mediante dispositivos móviles.
4. Desarrollar un tablero de Business Intelligence (BI) para la visualización de KPIs de producción y costos financieros.

---

### Antecedentes y Justificación
La industria tabacalera en la región ha operado históricamente bajo procesos tradicionales con poca intervención de las TIC. Gato Negro representa un entorno de ingeniería complejo con más de 50 operarios y flujos constantes de materia prima frágil. La justificación técnica de este proyecto radica en la aplicación de la ingeniería mecatrónica fuera del taller mecánico, aplicándola a la **Mejora de Procesos** mediante la integración de software y hardware móvil. El impacto socioeconómico se traduce en pagos más justos y precisos para los trabajadores y una mayor competitividad para la empresa al evitar fugas de material no registradas.

### Impacto esperado
*   **Empresarial:** Eliminación del 95% del uso de papel en registros de producción e inventario. Reducción sustancial de descuadres en bodega.
*   **Investigativo:** Generación de un modelo replicable de ERP liviano para PYMES de manufactura artesanal en Colombia y Venezuela.
*   **Formativo:** Aplicación real de tecnologías de vanguardia (Node.js, PostgreSQL, Artificial Intelligence integration) en problemas industriales tangibles.

---

### Marco teórico
El proyecto se fundamenta en tres pilares:
1.  **Enterprise Resource Planning (ERP):** Sistemas de planificación que garantizan el principio de *Single Source of Truth* (SSOT).
2.  **Arquitectura MVC y Web API:** Uso de Node.js y Express para la construcción de una lógica robusta y escalable.
3.  **Conversational AI (LLM Integration):** El uso de interfaces de lenguaje natural para la interacción con bases de datos, permitiendo que usuarios no técnicos (operarios de planta) alimenten el sistema sin curvas de aprendizaje complejas.

### Metodología
Se utilizará la metodología ágil **Scrum** con iteraciones periódicas (Sprints), permitiendo ciclos de desarrollo medibles y adaptables:
*   **Fase 1 (Diagnóstico):** Levantamiento de requerimientos, estudios de los flujos de tabacos reales de la empresa y análisis del software delegado (Anubis) y plantillas de Excel actuales. Levantamiento de manuales e inventario de maquinaria.
*   **Fase 2 (Núcleo y Tablas):** Migración a base de datos en Supabase y estandarización del control de Empleados, Fabriquines y Anilladores.
*   **Fase 3 (Lógica de Negocio):** Implementación de módulos logísticos: Despachos, Recepción (Mermas/Vena/Recorte), Nómina, Vales/Rezagos, y Dashboard analítico para la gerencia.
*   **Fase 4 (Integración AI y Entrega):** Programación del Asistente Virtual BCB conectado a WhatsApp para control de mantenimientos y recolección de métricas. Ensayos y despliegue del modo Claro/Oscuro en la Interfaz UI.

---

### Cronograma de actividades (12 Meses)

| Tiempo Estimado | Actividades a Desarrollar |
| --- | --- |
| **Mes 1 - Mes 2** | • **Levantamiento de Requerimientos:** Entrevistas con personal, revisión de procesos manuales actuales (hojas en papel y tablas de Excel).<br>• Estudio de la lógica algorítmica de la fábrica y fallas del sistema anterior (Anubis). |
| **Mes 3 - Mes 4** | • **Gestión de Maquinaria:** Creación del catálogo completo de maquinaria, fichas técnicas y modelo de mantenimiento industrial.<br>• Diseño de la arquitectura de la base de datos relacional (Supabase). |
| **Mes 5 - Mes 6** | • **Módulo de Bodega y Empleados:** Programación del listado general de Fabriquines, Anilladores y Empleados.<br>• Desarrollo de interfaces frontend de **Despachos** (entregas de materia prima). |
| **Mes 7 - Mes 8** | • **Módulo de Nómina y Producción:** Implementación del sistema de Recepción Diaria y automatización de descuentos por Mermas (Vena/Recorte).<br>• Diseño de panel para control de Deudas, pago de Rezagos y Vales. |
| **Mes 9 - Mes 10** | • **Analítica y UI:** Integración de gráficas financieras (Cierre Diario y Dashboard Analítico).<br>• Pruebas de concepto para temas visuales (Modo Claro/Oscuro en la plataforma completa y despliegue inicial en servidores Vercel). |
| **Mes 11 - Mes 12** | • **Cerebro Inteligente (BCB):** Codificación y despliegue del bot de WhatsApp para reportes automáticos de la fábrica.<br>• Auditorías de seguridad, entrega del Manual de Usuario y redacción del Informe de Proyecto de Grado final. |

### Presupuesto
*   **Servidores y API:** Gestión de créditos de nube (Supabase, Vercel).
*   **Hardware:** Dispositivos móviles inteligentes para supervisores.
*   **Recursos Humanos:** Investigador principal y Desarrollador.

---

### Resultados esperados
1.  Software ERP funcional desplegado en producción.
2.  Manual de usuario digital interactivo.
3.  Artículo científico para la revista de investigación de la Unipamplona.
4.  Ponencia en el Encuentro Regional de Semilleros de Investigación.

### Estrategia de Difusión
Presentación del sistema en la exposición de proyectos de la FIA (Facultad de Ingenierías), creación de un video demostrativo de la interacción con el bot BCB y publicación de los logros técnicos en el repositorio institucional.

---

**Nombre Estudiantes Participantes:**  
Gonzalo Jaimes Bastos  
Identificación: (Tu ID)  
Programa: Ingeniería Mecatrónica  
Correo electrónico: (Tu Correo Unipamplona)

---
**Firma y nombre del Tutor** | **Firma y nombre del Director de Grupo**
