# Diseño e Implementación de un Sistema Web Híbrido para la Automatización del Control de Producción e Inventario (ERP) en la Fábrica de Tabacos Gato Negro

**Autor:** Gonzalo Jaimes  
**Docente Evaluador:** [Nombre del Docente]  
**Institución:** Universidad de Pamplona, Sede Villa del Rosario  
**Programa:** Ingeniería Mecatrónica  
**Año:** 2026  

---

## Preliminares (Resumen / Abstract)
El presente informe documenta el proceso de modernización tecnológica e implementación de un sistema web integral (ERP) para la "Fábrica de Tabacos Gato Negro". Se aborda la problemática inicial caracterizada por una profunda desincronización administrativa, el uso de hojas de cálculo aisladas en Excel y un software *legacy* de escritorio (Anubis), lo cual generaba cuellos de botella y dependencias humanas críticas en el supervisor general. La solución desarrollada utiliza una arquitectura web basada en Node.js, Express.js y Supabase (PostgreSQL), apuntando hacia una futura estructura de sincronización híbrida (Offline/Online) debido a limitantes de conectividad en la planta. Asimismo, el proyecto logra la automatización del control del Kardex, la descentralización de la información hacia el equipo administrativo (licenciadas e ingeniera industrial), y cálculos predictivos de mantenimiento mediante escaneo electrónico.

**Palabras clave:** ERP, Node.js, Automatización, MVC, Manufactura Mecatrónica, Arquitectura Offline-First, Supabase.

---

## 1. Introducción y Contexto

Históricamente, la Fábrica de Tabacos Gato Negro ha mantenido un control riguroso de su inventario y producción, pero operando bajo un modelo tecnológico obsoleto y altamente centralizado. El control de la logística, la entrada y salida de materia prima, y los cálculos de producción recaían casi en su totalidad sobre el supervisor general (Gregorio), quien procesaba esta información mediante hojas de cálculo en Excel y un software de base de datos de escritorio legacy (Anubis), alojado en un solo equipo local.

Aunque este método lograba mantener los números al día y evitar el colapso absoluto, generaba fricciones operativas significativas que limitaban fuertemente la escalabilidad de la empresa y la comunicación transparente entre los diferentes departamentos administrativos y de planta.

### 1.1 Puntos Críticos de Fallo Identificados
En lugar de fallas dramáticas por pérdidas monetarias tangibles, la empresa se enfrentaba al estancamiento derivado de problemas en el flujo de los datos y dependencias técnicas:

* **Silos y Fugas de Información Interdepartamental:** El mayor problema actual de la fábrica es la desincronización administrativa. Dado que los datos logísticos se manejan en un entorno local y en planillas separadas, el personal de gerencia administrativa (tales como la Licenciada Omaira, el resto del equipo de tesorería y la Ingeniera Industrial) no tiene visibilidad en tiempo real de los procesos que corren en bodega. Ellas desconocen exactamente qué movimientos físicos ha ejecutado el supervisor logístico hasta que él decide exportar, imprimir y transferir los datos manualmente el fin de semana, rompiendo toda posibilidad de comunicación horizontal y simultánea en la empresa.
* **Centralización Operativa (Cuello de Botella):** El supervisor debe realizar en la mente y apuntes manuales todas las sumas y desdoblamientos matemáticos de la materia prima que ingresa y sale durante las tandas de producción masivas, para luego agotar jornadas enteras transcribiendo todo el flujo algorítmico individualmente al software y a los excels.
* **Gestión Anticuada de Subproductos:** Aunque los retornos de material sobrante como la *Vena* y el *Recorte* se controlan correctamente para su venta (retribución), el proceso de control era completamente manual. El operario entrega el peso físico, este peso se anota en el Excel, y finalmente se le entrega un *voucher* o comprobante impreso que se recorta a mano con tijera. Acusa un sistema funcional, pero mecánicamente ineficiente, lento y poco ecológico para un volumen de personal de 47+ trabajadores.
* **Vulnerabilidad ante la Conectividad (El Reto Offline/Online):** Al migrar a una plataforma web moderna, existe la vulnerabilidad arquitectónica de detener toda la producción física de despachos si ocurren severas caídas del servicio de internet ISP en la zona industrial. Por ello, es mandatorio concebir una arquitectura híbrida superior que permita a los estamentos logísticos laborar de forma completamente local durante apagones informáticos y que posea la inteligencia de empujar o sincronizar (`Push Sync`) estas bases locales con los Clústeres en la Nube una vez restablecida la conexión.

### 1.2 Objetivos de la Intervención
**Objetivo General:**  
Desarrollar e implementar una poderosa plataforma web ERP integral para la automatización total del control de producción e inventarios, eliminando contundentemente los "Silos de Información" y modernizando la infraestructura tecnológica global en la Fábrica de Tabacos Gato Negro.

**Objetivos Específicos:**
1. Integrar verticalmente a los departamentos logísticos de bodega y a la jefatura de administración dentro de una misma Base de Datos Centralizada, propiciando un flujo de decisiones en *Tiempo Real* para las Licenciadas de contabilidad y las ramas de reingeniería Industrial.
2. Diseñar los cimientos de una robusta arquitectura de asimilación Híbrida (Local/Nube) para garantizar bajo cualquier métrica que el despliegue del software web jamás induzca una parálisis operativa de bodega a causa de cortes súbitos de Internet en la zona.
3. Digitalizar, encriptar y empaquetar de forma transaccional la facturación cruzada de deudas prestacionales de los empleados y los cobros de Mermas/Subproductos, erradicando el comprobante de papel a discreción.
4. Implementar un submódulo analítico independiente parametrizado por estática descriptiva y Códigos QR que vigile el mantenimiento industrial del taller despalillador, brindando alertas temporales operacionales a los mecánicos.

---

## 2. Marco Teórico
Todo el desarrollo informático está sólidamente amparado bajo preceptos estandarizados en la ciencia del Software Corporativo.

* **Sistemas ERP y Planificación de Manufactura:** Los *Enterprise Resource Planning* son sistemas estructurales corporativos cuyo núcleo gravita en la centralización contable, logística y de Recursos Humanos. Instauran el teorema de *SSOT (Single Source Of Truth)*, propiciando que jamás existan dos exceles reportando un número de material crudo o dinero discordante el mismo día.
* **Arquitectura de Software MVC (Modelo-Vista-Controlador):** Es un patrón histórico en el desarrollo de software relacional. Facilita el desarrollo, prueba, escalamiento y mantenimiento aislando estrictamente la fachada visual EJS (`Vista`), la lógica matemática de ecuaciones Node (`Controlador`), y la pureza base de datos PostgreSQL (`Modelo`).
* **Tecnologías Centrales (Node.js & Express.js):** *Node.js* posibilita correr la fluidez de JavaScript directamente en los servidores remotos backend en un comportamiento asíncrono y de un solo hilo, siendo altamente resistente a caídas. Su pareja o framework minimalista principal, *Express.js*, toma posesión y regula el enrutamiento de peticiones semánticas del estándar HTTP (`GET` o `POST`). Para nutrir de vida interactiva la pantalla del usuario se usa un motor nativo *EJS* posicionado del lado del servidor.
* **Sistemas Relacionales DB (*Serverless* - PostgresQL & Supabase):** Una corporativa a esta escala no debe tolerar la debilidad del motor local simple tipo `SQLite`. Su traspaso de ecosistema dependió del *Database As A Service Cloud* ofrecido por `Supabase`. Otorga concurrencia, índices de encriptación de variables severas y una integridad de campos inmume a ataques.
* **Arquitectura "Offline-First" PWA / Sincronización Híbrida:** Un concepto cúspide en ingenierías web rurales. En esta redacción, la interfaz funciona bajo una caché embebida en el interior profundo de los motores Chromium (`IndexedDB` o `Local Caching Servers`). Cuando la red local colapsa bajo un despoblado informático sin internet, Gato Negro continuará operando salvaguardando tablas. Solo al instante de reconocer `Ping` seguro hacia Internet, sus workers de background despacharán un arreglo algorítmico asincrónico para clonar idénticamente todos los resultados despachados hacia `Supabase`, proveyendo autonomía insuperable.
* **Criptografía Informática del Backend (`BCrypt`):** Se rige en los fundamentos de `Key Derivation` y ataques de *Dictionary* mediante repetidas rondas matemáticas conocidas como Salting y Hashing sobre las contraseñas para hacerlas imposibles de revertir o ser leídas en la Base de Datos central por técnicos curiosos.

---

## 3. Diseño Arquitectónico y Metodología
### 3.1 Metodología de Desarrollo Constante
El proyecto y levantamiento topográfico de requerimientos se ejecutó abanderando el marco de **Metodologías Ágiles de Desarrollo de Software**. Combinando iteraciones semanales orientadas a Scrum y tableros continuos `Kanban`. Dicho ambiente garantizó la integración escalonada de un proyecto gigantesco sin fracturar las operaciones simultáneas ni obligar a la clausura patronal de la empresa.

### 3.2 Lógica Algebraica Corporativa (Reglas de Negocio)
Cada endpoint es matemáticamente dictaminado bajo las normativas orgánicas establecidas internamente en Gato Negro por las jefaturas contables. A saber (Tasa aplicativa sobre cada **1,000 Pts.** de tabaco producido):  
* Descuento de Capa Física = `1.0 Kg`  
* Descuento de Capote Físico = `1.8 Kg`  
* Descuento de Picadura = `7.0 Kg`  
* Monetización punitiva del Recurso Cestas Plásticas = `$225,000 COP` (Capacidad estricta de `1,500 uds/cesta`).  
* Evaluación Monetaria Base del Empaque Primario del Operario = `$85 COP`.  
* Rentabilización Directa por Mermas Físicas (Inyección positiva al inventario) = `Recorte a $6,500/kg` y `Vena a $3,500/kg`.  

### 3.3 Diagrama del Ecosistema Transaccional de Gato Negro
```text
┌─────────────────────────────────────────────────────────────┐
│                    NAVEGADOR DEL USUARIO                    │
│                 (HTML5 + CSS Vanilla + Modo Oscuro)         │
└─────────────────────┬─────────────────▲─────────────────────┘
                 (1) HTTP POST       (5) Renderizado EJS
┌─────────────────────▼─────────────────┴─────────────────────┐
│                     NODO LOCAL (EXPRESS.JS)                 │
│  - Middleware de Sesiones encriptadas (BCrypt Tokenized)    │
│  - Controladores Algorítmicos V2.2 (Diferenciales)          │
│  - Compilador PDF de Factura MultiTabla                     │
└─────────────────────┬─────────────────▲─────────────────────┘
                 (2) API Push        (4) Data Response
┌─────────────────────▼─────────────────┴─────────────────────┐
│                CAPA DE SINCRONIZACIÓN HÍBRIDA               │
│  (IndexedDB Caché Local / Pila Encolada Offline-First)      │
└─────────────────────┬─────────────────▲─────────────────────┘
                 (3) RESTFul / GraphQL Async (Supabase SDK)
┌─────────────────────▼─────────────────┴─────────────────────┐
│               SUPABASE CLOUD (POSTGRES DB SERVERLESS)       │
│  » inventario                » nomina_central               │
│  » recepcion_diaria          » movimientos (kardex/auditor) │
│  » empleados_fabriquines     » mantenimiento_talleres       │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Desarrollo Funcional y Estado de Implementación (V0 - V2.2)

Todo lo redactado en este bloque concierne a los ecosistemas codificados que **ya transitan en producción estable operativa** dentro de Gato Negro.

### 4.1 Módulo Predictivo de Mantenimiento de Máquinas Despalilladoras
Para liquidar las imprecisiones de los reportes en papel, se desplegó un tablero de inventario en el taller. Todas las máquinas despalilladoras gozan ahora un membrete *Sticker QR*. Al abordarlos con un dispositivo inteligente móvil, el enrutador deriva al mecánico interinamente hasta una interfaz donde puede asentar bitácoras descriptivas con repuestos instalados (Bandas, Ejes, Motores) y el valor numérico. El ERP totaliza sumas para advertir a lo largo de los cuatrimestres cuánto dinero en preventivos y correctivos succionó particular máquina.
`![Dashboard de Mantenimientos por Ficha Técnica Omitido temporalmente]`

### 4.2 Tablero Logístico Central y "Fabriquines" (Módulo Primario)
Se depuraron permanentemente los archivos manuales tipo "Exceles flotantes" mediante una Interfaz Gráfica (Grid Matricial Acumulativa) adaptada al *Dark Mode*.
* **Recepción Lunes a Sábado:** Los trabajadores se paran en rampa diaria. El Sistema consolida de manera acumulada sus devoluciones de canastas vacías, sus empujes de tabaco producido fresco y la contabilidad de Mermas (Venas y Picadura suelta/Recortes).
* **Motor Transaccional "Anti-Negativos" (Inyección en Vivo):** Mediante lógica computacional algorítmica incansable alojada en Express (`Controller de Recepción V2.2`), cada centésima de segundo donde se dispara una acción *"Guardar"* dispara un análisis de deducción transaccional. Esto le evita a Gato Negro esperar hasta el sábado en la tarde (Años oscuros Anubis/Excel), inyectando "Papeletas Electrónicas Comprobatorias" que mantienen sumadas a plenitud las cuotas del Inventario Vivo, a la vez que una barrera virtual niega cualquier despacho al 100% si encuentra que físicamente un elemento crudo logístico está corto de suministro en la realidad.
`![Panel Matricial de Recepción Acumulativa Omitido]`

### 4.3 Rediseño y Desacople Arquitectónico del Módulo de "Nómina"
Un paso disruptivo y exitoso de este ERP fue arrebatarle el poder a la logística frente a la injerencia púdica contable de la Tesorería. Bajo la Fase **V2.1**, cuando Gregorio completa el sábado las validaciones biométricas de tabaco con un trabajador, ya no se presiona al instante un botón para generar e imprimir PDF salariales, ya que Gregorio se encuentra inmerso en labor de almacén. Ahora Gregorio meramente emite el *"Liquidado y Cerrado Semanal"*. Los números financieros migran asincrónicamente e infalible a través de la Nube directamente hacia la ruta/apartado informático de **`/nomina`**. Allí yace el santuario administrativo, dotando a la Licenciada Omaira y oficinistas de un Dashboard reservado para auditar cobros, revisar pasivos de personal general, generar la sábana impresa `V1.8X`, retribuir el efectivo y apretar el veredicto final: *"Archivar Nómina Histórica"*. Cero roces.
`![Módulo de Nomina Contable Omitido]`

### 4.4 Panel Científico de "Control de Calidad (Lotes en Vivo)"
Simultáneo a los progresos de control de deudas, se habilitó un *Submódulo Científico Cíclico*. Muestra incansablemente la suma matemática de cuántos tabacos depositó el Operario/Fabriquín X a las canteras finales del Área de Producción antes de irse el viernes de fábrica, detallando en qué bloque productivo exacto se ubican en todo momento de forma estática en UI hasta culminar la semana laboral, abriendo vía pericial por si en etapas ulteriores lograse develarse producción envolvedora inoperable, rastreando inmediatamente al creador humano original de esta carga y sometiéndolo a reprimenda estadística.

---

## 5. Análisis de Resultados e Intervención de Troubleshooting

El tramo formativo demandó superar incesantemente fracturas biológicas de código. Parte de la labor del arquitecto de un modelo industrial mecatrónico versa en solidificar las tolerancias a *Bugs* Críticos que detonan de las malas formulaciones preexistentes por digitación humana.

* **Caso de Defecto 01: El Desdoblamiento Interfaz por Materiales Sueltos.** 
  Dado que temporalmente Supabase desfasaba la latencia unificadora ante dos presiones idénticas (Latencia Multi-Hilo), el inventario arrojaba `(X) Contenedores Tabacos Físicos` separadamente destruyendo la visión agregada comercial.  
  *Solución Empleada:* Instaurar sobre `inventario.ejs` un controlador de iteraciones nativo tipo `Array.reduce`. Este componente barre incesantemente los códigos DOM provenientes de Cloud y agrupa mediante factorizaciones minúsculas de caracteres `i.toLowerCase().trim()`, permitiendo arrojar innegablemente un único contenedor consolidado al gerente.

* **Caso de Defecto 02: Valores Fantasmales Contables (`NaN`).**
  Si el supervisor involuntariamente digitaba el tabulador en vez del teclado y accionaba `Enter` enviando parámetros *Empty Strings (`""`)*, el Servidor Express.js abortaba los esquemas de pago y sumatorias crasheando toda la línea de comandos matemáticos bajo el acrónimo *Not a Number*.
  *Solución Empleada:* Sanitización lógica condicional en el Backend: `parseFloat(req.body.valor) || 0;`, forzando en cualquier latitud extraña devolver al menos un neutro operacional, mitigando pérdidas millonarias o detenciones catastróficas.

* **Caso de Defecto 03: Obstrucción Contable del Dark Mode frente al Spooler Impresor.**
  Por requerimientos operacionales y ambientales de salud virtual, se obligó el renderizado oscuro general, pero al dictaminar peticiones genéricas del SO (`Ctrl + P`), las máquinas térmicas POS emitían las facturas del obrero recubiertas de pigmentación oscura, inhabilitando la tinta de carbón natural en la hoja de recibo de cobros.
  *Solución Empleada:* Alteración de comportamientos de cascada restrictiva al invocar `@media print { * { background: transparent !important; color: black !important; } }`. Desnudando la capa gráfica oscurecedora para los milisegundos de envío del buffer serial hacia el Hardware POS.

---

## 6. Conclusiones Directas y Hoja de Ruta (Trabajo Futuro V.3.X)

### Conclusiones
La culminación productiva consolidada en el **ERP V2.2** pulverizó al cien por ciento al "Monstruo de Cuello de Botella Logística" que acosaba al Supervisor General y lo empoderó junto al equipo central asumiendo el rol de Gestor. A su vez, erradicó por completo los enormes "Silos de Información de Gregorio". A partir de este hito arquitectónico, los despachos femeninos administrativos (Gerencias CTI, Omaira e Ingeniería Logística Industrial) tienen a un clic de distancia en cualquier monitor el historial de flujo de recursos, finanzas, inventarios en stock real y trazabilidad sin necesidad de incomodar las plantas de personal por transferencias de base de datos (`Excel-to-Flash-Drive`). 

### Trabajo Futuro (Fase de Desarrollo Interina y Expansible)

Tengamos claro que apenas hemos cruzado la cúspide basal o primaria dentro del gigantesco Universo Biológico Industrial que demanda Tabacos Gato Negro. Al futuro inminente, este software ERP escalará para asimilar al 100% de la compañía codificando estos inamovibles peldaños:

1. **La Meta Offline/Online Serverless Embebed:** Constituye el reto mecatrónico informático actual más prominente. Implicará dotar al navegador con la estructura fundamental programable (`ServiceWorkers`) para que el almaceno local (caché local host indexado) detenga las transacciones al perder conexión satelital o alámbrica, permita al supervisor facturar con normalidad natural y se coordine luego con la Base de datos global (`Push Sync Cloud`) tras restablecer protocolos WAN.
2. **Eslabón Complementario a Fabriquines (Envolvedoras):** Desdoblar lo aprendido con "Fabriquines", abriendo interfaces propias donde las "Envolvedoras" exijan la sustracción de la materia producida por el eslabón obrero primario. Contabilizarán con otras reglas de facturación diferentes el refinado externo del cilindro botánico para su eventual cobro al final de viernes por la tarde.
3. **Eslabón Estético Módulo Central (Anilladores):** Asentar el inventario de consumo estático complementario como bobinas, adhesivos gráficos biológicos, gomina, y empalmar el producto derivado contablemente.
4. **Eslabón de Bodegaje Embalaje (Empacadores y Control Mayorista):** Crear una Interfaz para descontar los cartones industriales, cajas embaladoras y transformarlas irrevocablemente bajo algoritmos matemáticos en los Unidades Listas de Inventario para Salida o *SKU*. Enlazar ventas y facturar a proveedores exteriores.

---

## 7. Referencias Bibliográficas (Fuentes Normadas)
* Express.js documentation. (n.d.). *Fast, minimalist web framework for Node.js*. Recuperado de https://expressjs.com/
* Joyent. (n.d.). *Node.js documentation (Open-source, cross-platform JavaScript runtime)*. Recuperado de https://nodejs.org/
* Pressman, R. S. (2010). *Ingeniería del Software: un enfoque práctico*. McGraw Hill. (Conceptos de Patrones MVC y Ciclo de desarrollo en cascada vs Agile Scrum).
* Supabase. (n.d.). *PostgreSQL Remote Database (Open Source Firebase Alternative Platform Docs)*. Recuperado de https://supabase.com/docs
* Vercel Cloud Network. (n.d.). *Develop, preview, ship frontend framework edge functions*. Recuperado de https://vercel.com/docs

---

---

## 📸 Anexos Visuales del Desarrollo Conjunto

> Capturas organizadas cronológicamente por módulo. Cada figura corresponde al estado real de la plataforma en su momento de desarrollo.

### 🔧 Módulo de Mantenimiento Predictivo de Máquinas (V1.x)

**Figura 1** — *media__1773943931277.png*

![Figura 1](anexos/media__1773943931277.png)

**Figura 2** — *media__1773946090234.png*

![Figura 2](anexos/media__1773946090234.png)

**Figura 3** — *media__1773946414831.png*

![Figura 3](anexos/media__1773946414831.png)

**Figura 4** — *media__1773946515336.png*

![Figura 4](anexos/media__1773946515336.png)

**Figura 5** — *media__1773950633203.png*

![Figura 5](anexos/media__1773950633203.png)

**Figura 6** — *media__1773951085918.png*

![Figura 6](anexos/media__1773951085918.png)

**Figura 7** — *media__1773951731273.png*

![Figura 7](anexos/media__1773951731273.png)

### ⚖️ Módulo de Recepción Diaria y Fabriquines (V1.8)

**Figura 8** — *media__1773963063176.png*

![Figura 8](anexos/media__1773963063176.png)

**Figura 9** — *media__1773964418216.png*

![Figura 9](anexos/media__1773964418216.png)

**Figura 10** — *media__1773964903973.png*

![Figura 10](anexos/media__1773964903973.png)

**Figura 11** — *media__1773964933431.png*

![Figura 11](anexos/media__1773964933431.png)

**Figura 12** — *media__1773965197343.png*

![Figura 12](anexos/media__1773965197343.png)

**Figura 13** — *media__1773965216478.png*

![Figura 13](anexos/media__1773965216478.png)

**Figura 14** — *media__1773965631334.png*

![Figura 14](anexos/media__1773965631334.png)

### 📦 Inventario Global y Motor Transaccional Kardex (V2.2)

**Figura 15** — *media__1774148818316.png*

![Figura 15](anexos/media__1774148818316.png)

**Figura 16** — *media__1774148823856.png*

![Figura 16](anexos/media__1774148823856.png)

**Figura 17** — *media__1774148851383.png*

![Figura 17](anexos/media__1774148851383.png)

**Figura 18** — *media__1774156382011.png*

![Figura 18](anexos/media__1774156382011.png)

**Figura 19** — *media__1774157671244.png*

![Figura 19](anexos/media__1774157671244.png)

**Figura 20** — *media__1774157683936.png*

![Figura 20](anexos/media__1774157683936.png)

**Figura 21** — *media__1774157696414.png*

![Figura 21](anexos/media__1774157696414.png)

**Figura 22** — *media__1774157739916.png*

![Figura 22](anexos/media__1774157739916.png)

**Figura 23** — *media__1774157763823.png*

![Figura 23](anexos/media__1774157763823.png)

### 💰 Módulo de Nómina Contable y Liquidación Semanal (V2.1)

**Figura 24** — *media__1774158267250.png*

![Figura 24](anexos/media__1774158267250.png)

**Figura 25** — *media__1774158320814.png*

![Figura 25](anexos/media__1774158320814.png)

**Figura 26** — *media__1774158350516.png*

![Figura 26](anexos/media__1774158350516.png)

**Figura 27** — *media__1774158389640.png*

![Figura 27](anexos/media__1774158389640.png)

**Figura 28** — *media__1774158422105.png*

![Figura 28](anexos/media__1774158422105.png)

**Figura 29** — *media__1774158700383.png*

![Figura 29](anexos/media__1774158700383.png)

### 🖨️ Sistema de Fichas Técnicas y Códigos QR (V1.8)

**Figura 30** — *media__1774159335926.png*

![Figura 30](anexos/media__1774159335926.png)

**Figura 31** — *media__1774159400908.png*

![Figura 31](anexos/media__1774159400908.png)

**Figura 32** — *media__1774159430273.png*

![Figura 32](anexos/media__1774159430273.png)

**Figura 33** — *media__1774159469964.png*

![Figura 33](anexos/media__1774159469964.png)

**Figura 34** — *media__1774159906243.png*

![Figura 34](anexos/media__1774159906243.png)

**Figura 35** — *media__1774159963873.png*

![Figura 35](anexos/media__1774159963873.png)

### 📊 Documentación Base: Excels y Registros Previos al ERP

**Figura 36** — *media__1774319598444.jpg*

![Figura 36](anexos/media__1774319598444.jpg)

**Figura 37** — *media__1774319619271.png*

![Figura 37](anexos/media__1774319619271.png)

**Figura 38** — *media__1774319671345.png*

![Figura 38](anexos/media__1774319671345.png)

**Figura 39** — *media__1774319723211.png*

![Figura 39](anexos/media__1774319723211.png)

**Figura 40** — *media__1774322412517.png*

![Figura 40](anexos/media__1774322412517.png)

**Figura 41** — *media__1774322441916.png*

![Figura 41](anexos/media__1774322441916.png)

**Figura 42** — *media__1774322688064.png*

![Figura 42](anexos/media__1774322688064.png)

**Figura 43** — *media__1774322831541.png*

![Figura 43](anexos/media__1774322831541.png)

### 📈 Dashboard Analítico BI con Chart.js (V2.3)

**Figura 44** — *media__1774491845412.png*

![Figura 44](anexos/media__1774491845412.png)

**Figura 45** — *media__1774491950272.png*

![Figura 45](anexos/media__1774491950272.png)

**Figura 46** — *media__1774492085082.png*

![Figura 46](anexos/media__1774492085082.png)

**Figura 47** — *media__1774492210176.png*

![Figura 47](anexos/media__1774492210176.png)

**Figura 48** — *media__1774492263355.png*

![Figura 48](anexos/media__1774492263355.png)

**Figura 49** — *media__1774493937918.png*

![Figura 49](anexos/media__1774493937918.png)

**Figura 50** — *media__1774494351792.png*

![Figura 50](anexos/media__1774494351792.png)

**Figura 51** — *media__1774533205858.png*

![Figura 51](anexos/media__1774533205858.png)

**Figura 52** — *media__1774540251756.png*

![Figura 52](anexos/media__1774540251756.png)

**Figura 53** — *media__1774541378549.png*

![Figura 53](anexos/media__1774541378549.png)

**Figura 54** — *media__1774541408538.png*

![Figura 54](anexos/media__1774541408538.png)

**Figura 55** — *media__1774542232860.png*

![Figura 55](anexos/media__1774542232860.png)

### 🏭 Fase 3 – Menú Modular por Áreas e Historial de Entregas (V2.4)

**Figura 56** — *media__1774877227606.png*

![Figura 56](anexos/media__1774877227606.png)

**Figura 57** — *media__1774879879746.png*

![Figura 57](anexos/media__1774879879746.png)

**Figura 58** — *media__1774879917611.png*

![Figura 58](anexos/media__1774879917611.png)

**Figura 59** — *media__1774879983155.png*

![Figura 59](anexos/media__1774879983155.png)

**Figura 60** — *media__1774880637465.png*

![Figura 60](anexos/media__1774880637465.png)

**Figura 61** — *media__1774880731950.png*

![Figura 61](anexos/media__1774880731950.png)

**Figura 62** — *media__1774881285365.png*

![Figura 62](anexos/media__1774881285365.png)

**Figura 63** — *media__1774882222601.png*

![Figura 63](anexos/media__1774882222601.png)

**Figura 64** — *media__1774882515113.png*

![Figura 64](anexos/media__1774882515113.png)

**Figura 65** — *media__1774882623247.png*

![Figura 65](anexos/media__1774882623247.png)

**Figura 66** — *media__1774883922604.png*

![Figura 66](anexos/media__1774883922604.png)

**Figura 67** — *media__1774883941355.png*

![Figura 67](anexos/media__1774883941355.png)

**Figura 68** — *media__1774884248448.png*

![Figura 68](anexos/media__1774884248448.png)

**Figura 69** — *media__1774884506081.png*

![Figura 69](anexos/media__1774884506081.png)

