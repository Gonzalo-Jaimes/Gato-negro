# Diseño e Implementación de un Sistema Web para la Automatización del Control de Producción e Inventario (ERP) en la Fábrica de Tabacos Gato Negro

**Nombre del Autor:** Gonzalo Jaimes  
**Institución:** Universidad de Pamplona, Sede Villa del Rosario  
**Programa:** Ingeniería Mecatrónica  
**Fecha de Actualización:** Marzo de 2026 (Versión 2.2 - Final)

---

## Resumen
El presente informe documenta el proceso exhaustivo de modernización tecnológica e implementación de un sistema web integral (ERP) para la "Fábrica de Tabacos Gato Negro", una manufacturera pyme. Se aborda la problemática inicial (Versión 0) caracterizada por procesos manuales basados en archivos Excel obsoletos que fragmentaban la contabilidad y generaban una dependencia humana crítica y un alto margen de error. La solución desarrollada utiliza una arquitectura web basada en Node.js, Express.js y Supabase (PostgreSQL), logrando la automatización del control físico del Kardex en tiempo real, protección criptográfica de datos, el desacople puro entre la bodega y la facturación administrativa, y cálculos predictivos de mantenimiento.
**Palabras clave:** ERP, Node.js, Inventario, Automatización, MVC, Manufactura, Mecatrónica, Backend Serverless.

---

## 1. Introducción
La Fábrica de Tabacos Gato Negro operaba bajo un ecosistema de producción tradicional donde el núcleo administrativo y de logística dependía en su totalidad de métodos manuales. Toda la trazabilidad de los materiales, la contabilidad de la materia prima armada en las mesas de empaque y la asignación de pagos a los empleados fabricantes dependían exclusivamente del esfuerzo de un solo supervisor general ("Gregorio").

Este diseño centralizado y humano generaba un embudo de botella o "punto único de fallo" (*Single Point of Failure*): el conteo físico intermitente resultaba extenuante, propiciando números negativos fantasmas y "fugas" de material; los cierres de semana eran insostenibles y representaban un riesgo operativo inminente. Por ende, la transición a una arquitectura en la nube (*Cloud-based ERP*) se volvió imperativa para garantizar la continuidad empresarial, distribuir responsabilidades de forma asíncrona y llevar una nómina a prueba de fallos mediante algoritmos parametrizados.

### 1.1 Objetivo General
Desarrollar e implementar una plataforma web centralizada para la automatización de la contabilidad, logística, control de calidad e inventario de la Fábrica de Tabacos Gato Negro, mitigando la dependencia humana y estructurando un flujo empresarial escalable.

### 1.2 Objetivos Específicos
- **Sistematización de Operarios:** Migrar al personal (Fabriquines) desde las sábanas de cálculo convencionales (Excel) hacia una base de datos relacional segura en la nube (Supabase).
- **Protección Antifraude:** Diseñar barreras transaccionales que bloqueen despachos ficticios de insumos y digitalicen el flujo físico real del Kardex al instante de la recepción.
- **Desacople Administrativo:** Separar contundentemente la recolección física de tabacos en bodega respecto a la impresión y pago de facturas financieras u honorarios.
- **Auditoría de Control de Calidad:** Revelar historiales continuos ("Lotes en Mesa") para ubicar deficiencias puntuales producidas por empleados durante la semana activa de trabajo antes de su comercialización.
- **Digitalizar el Mantenimiento Industrial:** Construir un submódulo analítico que registre mantenimientos correctivos y alerte sobre preventivos a la maquinaria pesada mediante escaneo de Código QR.

---

## 2. Metodología y Stack Tecnológico
Durante la fase de ingeniería, se aplicaron metodologías de desarrollo ágil iterativo (Scrum/Kanban) con versionamiento continuo, comenzando desde la fase de recolección de requisitos matemáticos (Versión 1.0) hasta catapultarse al estado de producción *Enterprise-Ready* de la rama V2.2.

- **Frontend / Vista:** Motor de plantillas dinámico EJS, inyectando variables SQL nativamente al renderizar. Se utilizó CSS Vanilla responsivo para compatibilidad en teléfonos celulares e inyección de *Dark Mode* por accesibilidad en zonas de manufactura.
- **Backend / Controlador (Cerebro):** Runtime asíncrono Node.js empleando el Framework Express.js para el control total sobre las rutas, sesiones REST y ejecución de algoritmos físico-matemáticos.
- **Capa de Persistencia / Modelo:** Migración absoluta hacia Supabase (Database as a Service en base PostgresQL) garantizando cero pérdida de datos (Zero-Downtime) e integridad referencial forzada.

---

## 3. Desarrollo e Implementación Constante (V0 -> V2.2)

El proceso constructivo de este software demandó múltiples refinaciones arquitectónicas. A continuación, se explican desde los pilares funcionales de la Fase I hasta los esquemas superiores de estabilización empresarial.

### 3.1 Módulo de Trazabilidad y Mantenimiento de Máquinas
Se reemplazaron las hojas de novedades de taller impresas por Fichas Técnicas integrales accesibles vía QR local. El sistema cruza las fechas de último servicio mecánico de las máquinas despalilladoras con su histórico, consolidando la inversión monetaria (gastos de repuestos) que cada máquina le costó a la empresa.

### 3.2 Sistematización P2P y Roles Logísticos (V1.8)
Se orquestó un panel C.R.U.D para matricular nuevos empleados y se unificó la entrega de materiales a una modalidad de *Recepción Diaria Acumulativa* (Lunes a Sábado). En este módulo, el Almacenista ingresa rápidamente las cestas plásticas devueltas por el empleado, y su aporte de tabacos diarios. El Servidor entonces ejecuta internamente el descuento de deudas y factoriza las obligaciones biológicas pendientes. 

### 3.3 Seguridad Absoluta y Criptografía Web (V2.0)
Al notar la vulnerabilidad que representaban las redes compartidas en fábrica, se purgó drásticamente el uso de contraseñas de texto plano. Se codificó un sistema basado en el motor `Bcrypt` que cifra en *Hashes* de 10 iteraciones los pines de los administradores. Asimismo, se forjaron Bitácoras Inmutables (`movimientos`) que escanean la sesión del usuario para "firmar" qué miembro del equipo eliminó de la existencia algún despacho crítico.

### 3.4 Desacople Administrativo de Nóminas (V2.1)
El cuello de botella logístico persistía debido a una mala práctica de diseño: al recepcionar la carga del Sábado, el sistema obligaba al almacenista a generar un PDF e imprimir recibos de pago. Se rediseñó este comportamiento radicalmente:
Ahora el almacén solo "Cierra Acumulados Numéricamente" y toda la data final es interceptada por el módulo `/nomina` (El ecosistema Contable). Allí, de forma ordenada, la oficinista administrativa puede revisar las deducciones de nómina del equipo, inyectar el voucher PDF a la impresora, pagar los sueldos en su tiempo designado y "Archivar" legalmente el ciclo salarial sin estresar las operaciones de bodega.

### 3.5 El Kardex Inteligente y Dashboard Anti-Fugas (V2.2)
El pilar maestro del sistema fue re-escrito en su totalidad para combatir desbalances fantasmas de inventario.
1. **Barreras Transaccionales:** Previene que el almacenista entregue Cestas, Capas o Capotes en calidad de préstamo si la bodega física no posee saldo positivo suficiente.
2. **Kardex Diferencial en Vivo:** Eliminando la dependencia del "cierre sabatino", el sistema ahora deduce proactivamente cualquier ingreso de Tabacos, Retorno de Cestas, Mermas reciclables (Vena y Recorte) e incluso las Ventas Extraordinarias de materia prima. Cada que el usuario presiona "Guardar Edición" el lunes, martes, etc., el motor genera inmediatamente un ticket impreso en el libro mayor (`Kardex`).
3. **Control Analítico (Lotes en Mesa):** Escanea los despachos semanales para mostrarle al área de Envolvedores (Control de Calidad) qué tabacos específicos depositó un obrero en su mesa, dotando a la empresa de una capacidad de investigación contra desperfectos insuperable.

---

## 4. Conclusiones
El Proyecto Gato Negro superó exitosamente los paradigmas manuales empresariales, culminando en un ERP Transaccional en tiempo real (**V2.2.0**). La dependencia centralizada de la gerencia hacia las sumas de cálculo humanas fue pulverizada, sustituyéndose por componentes matemáticos distribuidos, trazabilidad de componentes físicos al milímetro y escudos cibernéticos antifraude. Como es natural de proyectos escalables en la nube, el sistema sienta bases imperturbables (API-Ready) propicias para futuras ramas funcionales como integración de Pasarelas Múltiples de Venta e Inteligencia Artificial corporativa.

---

## Referencias Bibliográficas
1. Express.js. (n.d.). *Fast, minimalist web framework for Node.js*. Recuperado de https://expressjs.com/
2. Supabase. (n.d.). *The open source Firebase alternative: Postgres DB*. Recuperado de https://supabase.com/
3. Node.js. (n.d.). *Node.js is an open-source, cross-platform JavaScript runtime*. Recuperado de https://nodejs.org/
4. Vercel. (n.d.). *Develop, preview, ship frontend infrastructure*. Recuperado de https://vercel.com/
