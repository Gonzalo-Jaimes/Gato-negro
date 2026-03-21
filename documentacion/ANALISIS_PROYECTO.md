# Análisis del Proyecto: Gato Negro
## Sistema de Gestión de Inventario y Producción

**Versión**: 1.6.0  
**Fecha de Actualización**: Marzo 2026 (Refactorización de Nómina y Linting)  
**Estado**: En Producción Activa  
**Ambiente de Despliegue**: Vercel (Node.js) + Supabase (Base de Datos)

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura General](#arquitectura-general)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Módulos y Funcionalidades](#módulos-y-funcionalidades)
6. [Base de Datos](#base-de-datos)
7. [Sistema de Roles y Permisos](#sistema-de-roles-y-permisos)
8. [Flujos de Negocio Principales](#flujos-de-negocio-principales)
9. [Características Técnicas Destacadas](#características-técnicas-destacadas)
10. [Consideraciones de Seguridad](#consideraciones-de-seguridad)
11. [Estado y Próximas Mejoras](#estado-y-próximas-mejoras)

---

## 📌 Resumen Ejecutivo

**Gato Negro** es una aplicación web integral diseñada para la gestión de procesos productivos en una empresa manufacturera de tabacos/puros. La plataforma centraliza la administración de:

- **Inventario**: Seguimiento de materias primas con registro de movimientos (Kardex)
- **Producción**: Creación y aprobación de pedidos con cálculo automático de materiales necesarios
- **Distribución**: Sistema de recepción de tareas completadas con control de rezagos
- **Infraestructura**: Gestión de máquinas y equipos con módulo de mantenimiento
- **Usuarios**: Control de acceso basado en roles

La aplicación se caracteriza por su enfoque empresarial, interfaz intuitiva con alertas interactivas y cálculos automatizados para optimizar la cadena de producción.

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                    NAVEGADOR DEL USUARIO                     │
│                    (Frontend - EJS Views)                     │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/HTTPS
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   EXPRESS.JS SERVER                           │
│                   (Backend Logic)                            │
│  - Rutas RESTful                                             │
│  - Gestión de Sesiones                                       │
│  - Lógica de Negocio                                         │
│  - Validaciones                                              │
└─────────────────────┬───────────────────────────────────────┘
                      │ SDK Supabase
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  SUPABASE CLOUD                              │
│            (PostgreSQL + Autenticación)                      │
│                                                              │
│  ├── Tabla: usuarios                                         │
│  ├── Tabla: inventario                                       │
│  ├── Tabla: movimientos (Kardex)                             │
│  ├── Tabla: pedidos                                          │
│  ├── Tabla: maquinas                                         │
│  └── Tabla: mantenimiento                                    │
└──────────────────────────────────────────────────────────────┘
```

### Patrón de Arquitectura
- **Patrón**: MVC (Model-View-Controller)
- **Modelo**: Supabase (Base de Datos)
- **Vista**: Templates EJS
- **Controlador**: Rutas Express.js

---

## 🛠️ Stack Tecnológico

### Backend
| Tecnología | Versión | Propósito |
|-----------|---------|----------|
| Node.js | - | Runtime de JavaScript |
| Express.js | 5.2.1 | Framework web |
| express-session | 1.19.0 | Gestión de sesiones |
| Supabase SDK | 2.99.1 | ORM y conexión a BD |

### Frontend
| Tecnología | Propósito |
|-----------|----------|
| EJS | Motor de plantillas |
| SweetAlert2 | 11.26.22 | Alertas interactivas |
| HTML5 | Estructura |
| CSS3 | Estilos (personalizados) |

### Base de Datos
| Servicio | Propósito |
|---------|----------|
| Supabase | PostgreSQL en la nube |
| SQLite3 | Alternativa local (legacy) |

### Despliegue
| Plataforma | Propósito |
|-----------|----------|
| Vercel | Hosting de aplicación Node.js |
| Supabase Cloud | Alojamiento de BD |

---

## 📁 Estructura del Proyecto

```
gato/
├── 📄 server.js                    # Punto de entrada principal (Express)
├── 📄 app.py                       # Backend alternativo en Flask (Legacy)
├── 📄 database.py                  # Script de inicialización de BD (Legacy)
├── 📄 crear_admin.py               # Script para crear usuario admin
├── 📄 package.json                 # Dependencias Node.js
├── 📄 package-lock.json            # Lock file de dependencias
├── 📄 vercel.json                  # Configuración de despliegue en Vercel
├── 📄 empresa.db                   # Base de datos SQLite3 local (Legacy)
├── 🐧 .git/                        # Control de versiones
├── 📁 public/                      # Archivos estáticos
│   └── img/                        # Recursos de imagen
├── 📁 views/                       # Plantillas EJS
│   ├── 📄 login.ejs                # Pantalla de login
│   ├── 📄 inventario.ejs           # Gestión de inventario
│   ├── 📄 movimientos.ejs          # Kardex/Movimientos
│   ├── 📄 pedidos.ejs              # Creación y aprobación de pedidos
│   ├── 📄 recepcion.ejs            # Recepción de tareas
│   ├── 📄 usuarios.ejs             # Gestión de usuarios
│   ├── 📄 maquinas.ejs             # Inventario de máquinas
│   ├── 📄 mantenimiento.ejs        # Registro de mantenimiento
│   └── 📁 partials/                # Componentes reutilizables
│       ├── 📄 header.ejs           # Encabezado común
│       └── 📄 footer.ejs           # Pie de página común
└── 📁 documentacion/               # Documentación del proyecto
    └── 📄 ANALISIS_PROYECTO.md     # Este archivo
```

**Nota**: Los archivos `.py` y la BD SQLite son legados de una versión anterior con Flask. El proyecto actual utiliza Express.js y Supabase.

---

## 🎯 Módulos y Funcionalidades

### 1. **Autenticación y Control de Acceso**
**Archivo**: `server.js` - Líneas: 65-85

**Funcionalidades**:
- Login con usuario y contraseña
- Validación contra BD Supabase
- Creación de sesiones HTTP
- Logout y cierre de sesión

**Ruta Principal**:
- `GET /` → Página de login
- `POST /login` → Validación de credenciales
- `GET /logout` → Cierre de sesión

---

### 2. **Gestión de Inventario (Kardex)**
**Archivos**: `server.js` - Líneas: 91-252

**Submódulos**:

#### 2.1 Inventario - Vista General
- **Ruta**: `GET /inventario`
- **Acceso**: Solo Admin
- **Funcionalidad**: Visualización de materiales con categorización
- **Información mostrada**: Material, cantidad, categoría

#### 2.2 Movimientos (Kardex)
- **Ruta**: `GET /movimientos`
- **Acceso**: Solo Admin
- **Funcionalidad**: Historial completo de ingresos y salidas
- **Campos**: Fecha, hora, tipo, material, cantidad, usuario, descripción

#### 2.3 Ingresos de Material
- **Ruta**: `POST /agregar_inventario`
- **Funcionalidad**: 
  - Registra entrada de nuevos materiales
  - Actualiza cantidades si el material ya existe
  - Crea movimiento en el Kardex automáticamente
- **Parámetros**: material, cantidad, categoría, descripción

#### 2.4 Salidas de Material
- **Ruta**: `POST /restar_inventario`
- **Funcionalidad**:
  - Descuenta material del inventario
  - Registra salida en Kardex
  - Valida disponibilidad antes de restar
- **Parámetros**: material_id, cantidad_salida, descripcion_salida

#### 2.5 Eliminación
- **Ruta**: `GET /eliminar_inventario/:id`
- **Funcionalidad**: Elimina material del inventario

---

### 3. **Gestión de Pedidos**
**Archivos**: `server.js` - Líneas: 254-385

**Descripción General**:
Sistema de creación, validación y aprobación de pedidos con cálculo automático de materiales necesarios basado en cantidad solicitada.

#### 3.1 Vista de Pedidos
- **Ruta**: `GET /pedidos`
- **Funcionalidades**:
  - Admin: Ve todos los pedidos del sistema
  - Fabriquin/Fabricacion/Envolvedor: Ve solo sus pedidos
  - Cálculo automático de materiales necesarios según tipo de pedido
  
**Cálculos automáticos** (por cada 1500 unidades):
- **Pedidos de Tabacos**:
  - Tripa necesaria: factor × 35 kg
  - Capa necesaria: factor × 9 kg
  - Capote necesario: factor × 5 kg
  - Cestas necesarias: ⌈factor × 3⌉ unidades

- **Pedidos de Envoltura**:
  - Papel necesario: factor × 1.5 kg
  - Tabacos necesarios: cantidad solicitada

#### 3.2 Creación de Pedidos
- **Ruta**: `POST /agregar_pedido`
- **Acceso**: Fabriquin, Fabricacion, Envolvedor
- **Parámetros**: cantidad_tabacos
- **Estado inicial**: "pendiente"

#### 3.3 Rechazo de Pedidos
- **Ruta**: `POST /rechazar_pedido/:id`
- **Acceso**: Admin
- **Cambio de estado**: pendiente → rechazado

#### 3.4 Aprobación de Pedidos (Lógica Avanzada)
- **Ruta**: `POST /aprobar_pedido/:id`
- **Acceso**: Admin
- **Proceso**:
  1. Valida disponibilidad de materiales
  2. Si hay insuficiencia, rechaza con detalles
  3. Si está disponible, decrementa inventario
  4. Registra salidas en el Kardex
  5. Cambia estado a "aprobado"
  
**Validación de Stock**:
```javascript
// Sistema inteligente que busca en nombres similares
if(m.includes('tripa') || m.includes('material')) → busca Tripa
if(m.includes('capa')) → busca Capa
if(m.includes('capote')) → busca Capote
if(m === cestaSeleccionada.toLowerCase()) → busca cesta específica
```

---

### 4. **Recepción de Tareas (Rezagos)**
**Archivos**: `server.js` - Líneas: 387-494

**Descripción General**:
Sistema de recepción y control de tareas completadas, con seguimiento de rezagos (deuda de producción).

#### 4.1 Vista de Recepción
- **Ruta**: `GET /recepcion`
- **Acceso**: Solo Admin
- **Información**:
  - Listado de pedidos aprobados (estado: "aprobado")
  - Resumen de rezagos por fabricante
  - Monto total de deuda pendiente

#### 4.2 Recepción de Tareas
- **Ruta**: `POST /recibir_tarea/:id`
- **Proceso**:
  1. Recibe cantidad de tabacos entregados
  2. Calcula rezago (cantidad solicitada - entregado)
  3. Actualiza estado a "completado"
  4. Incrementa inventario de tabacos
  5. Registra en Kardex con descripción de rezago
  6. Opcionalmente suma cestas devueltas

**Cálculos**:
```
Rezago = Cantidad Original - Tabacos Entregados
- Si Rezago > 0 → El fabriquin debe tabacos
- Si Rezago < 0 → El fabriquin trajo extra
- Si Rezago = 0 → Tarea completada perfectamente
```

#### 4.3 Abono de Deuda
- **Ruta**: `POST /abonar_deuda`
- **Funcionalidad**:
  - Permite abonar deudas de fabricantes sin crear tareas reales
  - Crea "pedido fantasma" con rezago negativo
  - Actualiza inventario de tabacos
  - Registra movimiento en Kardex

---

### 5. **Gestión de Máquinas y Equipos**
**Archivos**: `server.js` - Líneas: 496-529

#### 5.1 Inventario de Máquinas
- **Ruta**: `GET /maquinas`
- **Acceso**: Admin y Mantenimiento
- **Información**: Todas las máquinas del sistema

#### 5.2 Agregar Máquina
- **Ruta**: `POST /agregar_maquina`
- **Parámetros**: nombre, área, marca, modelo, horas_dia, fabricante, código, estado, observaciones
- **Estado**: Almacena en tabla "maquinas"

#### 5.4 Fichas Técnicas y Panel de QRs (Fases 1, 2 y 2.1)
- **Rutas**: 
  - `GET /maquina/:id/qr` → Genera dinámicamente el QR de un equipo (Fase 1).
  - `GET /maquinas/ficha/:id` → Vista pública con el CV e historial clínico de la máquina (Fase 2).
  - `GET /maquinas/qrs` → Panel administrativo para visualizar e imprimir en masa todos los QRs (Fase 2.1).
- **Funcionalidad**: Informatización del mantenimiento corporativo. Los códigos QR vinculan la máquina física con su hoja de vida digital. El panel central unifica la emisión de etiquetas para pegar en los equipos, mientras que el menú agrupado "Equipos y Mtto" facilita la navegación del usuario administrador.

---

### 6. **Módulo de Mantenimiento**
**Archivos**: `server.js` - Líneas: 569-633

#### 6.1 Vista de Mantenimiento
- **Ruta**: `GET /mantenimiento`
- **Acceso**: Admin y Mantenimiento
- **Información**: 
  - Listado de máquinas disponibles
  - Historial de mantenimientos realizados

#### 6.2 Alertas Predictivas e Inversión (Novedad V1.5+)
- **Mecanismo**: El backend (`server.js`) calcula al vuelo los días restantes para el próximo servicio cruzando la `frecuencia_mtto_dias` y la fecha del `ultimo_mtto`. 
- **Semáforo Web**: La interfaz asigna colores (Verde, Amarillo, Rojo) según el grado de urgencia del equipo.
- **Finanzas**: Se totaliza el `costo_mo` (Mano de obra) + `costo_mat` (Materiales), otorgando automáticamente un panel de *Inversión Acumulada Histórica* por máquina.

#### 6.3 Registrar Mantenimiento
- **Ruta**: `POST /agregar_mantenimiento`
- **Parámetros**: 
  - fecha, hora, maquina, tipo, descripcion
  - tiempo_min, costo_mo (mano de obra), costo_mat (materiales)
  - hecho_por, estado

---

### 7. **Gestión de Usuarios**
**Archivos**: `server.js` - Líneas: 541-555

#### 7.1 Lista de Usuarios
- **Ruta**: `GET /usuarios`
- **Acceso**: Solo Admin
- **Información**: ID, usuario, contraseña, rol

#### 7.2 Agregar Usuario
- **Ruta**: `POST /agregar_usuario`
- **Parámetros**: usuario, password, rol

#### 7.3 Eliminar Usuario
- **Ruta**: `GET /eliminar_usuario/:id`

---

### 8. **Módulo de Facturación, Nómina y Cestas (Fase 5)**
**Archivos**: `server.js`, `views/nomina.ejs`, `views/cierre_diario.ejs`, `views/factura.ejs`, `views/recepcion.ejs`

#### 8.1 Flujo Automatizado de Recepción a Nómina
- **Mecanismo**: El administrador recibe tabacos (`GET /recepcion`). Al confirmar (`POST /recibir_tarea/:id`), el sistema inyecta automáticamente la ganancia en pesos colombianos al empleado basado en una tarifa corporativa fija ($150,000 COP por millar / $150 COP unidad).
- **Control de Cestas Plásticas**: Se verifica la relación de tabacos recibidos frente a las cestas devueltas (1 cesta por cada ~500 tabacos). Cestas faltantes se registran automáticamente como deudas físicas/rezagos en el perfil del fabriquin.

#### 8.2 Dashboard del Fabriquín (Cierre Diario)
- **Ruta**: `GET /cierre_diario`
- **Visibilidad**: Exclusivo Fabriquín.
- **Acción**: Sólo lectura. El empleado visualiza su balance semanal a favor, sus deudas de cestas o vales manuales, y el pago neto estimado a cobrar (Totalmente en formato $ COP).

#### 8.3 Panel de Nómina y Recibo de Pago (Admin)
- **Rutas**: `GET /nomina`, `GET /factura_nomina/:usuario`, `POST /pagar_nomina/:usuario`, `POST /agregar_deuda`
- **Visibilidad**: Admin
- **Acción**: Libro mayor para liquidaciones semanales. El administrador asigna vales/rezagos y emite un recibo formal imprimible (`factura.ejs`) que incluye el Documento de Identificación (C.I/RUT) del empleado y áreas firmables para asentar la orden legalmente antes de darle "PAGADO" en sistema.

#### 8.4 Abonos Diferidos y Rezagos Mixtos
- **Ruta**: `POST /abonar_rezago`
- **Mecanismo**: Si un fabriquin entrega incompleto, el sistema guarda una deuda (`rezago`). Posteriormente, el administrador puede saldar tanto Tabacos faltantes como Cestas devueltas desde una misma interfaz unificada. Esto reinyecta el material al Inventario, documenta el movimiento en el Kardex y le ingresa el dinero correspondiente al fabriquin en su Nómina pendiente de la semana.

---

## 🗄️ Base de Datos

### Esquema de Supabase

#### Tabla: `usuarios`
```sql
id              INTEGER (PK, AI)
usuario         TEXT
password        TEXT
rol             TEXT
identificacion  TEXT (Opcional - Documento de Identidad C.I/RUT)
```

**Roles disponibles**:
- `admin` → Acceso total al sistema
- `fabriquin` → Crear pedidos de tabacos
- `fabricacion` → Crear pedidos de tabacos
- `envolvedor` → Crear pedidos de envoltura
- `mantenimiento` → Acceso al módulo de mantenimiento

---

#### Tabla: `inventario`
```sql
id          INTEGER (PK, AI)
material    TEXT
cantidad    FLOAT
categoria   TEXT
```

**Categorías típicas**:
- Materias Primas
- En Proceso
- Productos Terminados

---

#### Tabla: `movimientos` (Kardex)
```sql
id              INTEGER (PK, AI)
fecha           DATE
hora            TIME
tipo_movimiento TEXT ('ENTRADA' | 'SALIDA')
material        TEXT
cantidad        FLOAT
usuario         TEXT
descripcion     TEXT
```

**Registro de auditoría completo** de todos los cambios de inventario.

---

#### Tabla: `pedidos`
```sql
id          INTEGER (PK, AI)
material    TEXT ('Tabacos' | 'Envoltura')
cantidad    INTEGER
usuario     TEXT
fecha       DATE
estado      TEXT ('pendiente' | 'aprobado' | 'rechazado' | 'completado')
entregado   INTEGER (NULLABLE)
rezago      INTEGER (NULLABLE)
```

---

#### Tabla: `maquinas`
```sql
id          INTEGER (PK, AI)
nombre      TEXT
area        TEXT
marca       TEXT
modelo      TEXT
horas_dia   INTEGER
fabricante  TEXT
codigo      TEXT
estado      TEXT
observaciones TEXT
```

---

#### Tabla: `mantenimiento`
```sql
id          INTEGER (PK, AI)
fecha       DATE
hora        TIME
maquina     TEXT
tipo        TEXT
descripcion TEXT
tiempo_min  INTEGER
costo_mo    FLOAT
costo_mat   FLOAT
hecho_por   TEXT
estado      TEXT
```

---

## 👥 Sistema de Roles y Permisos

| Rol | Inventario | Pedidos | Recepción | Máquinas | Mantenimiento | Usuarios |
|-----|-----------|---------|-----------|----------|--------------|----------|
| Admin | ✅ Completo | ✅ Ver/Aprobar | ✅ Completar | ✅ Gestionar | ✅ Ver/Agregar | ✅ Gestionar |
| Fabriquin | ❌ | ✅ Crear | ❌ | ❌ | ❌ | ❌ |
| Fabricacion | ❌ | ✅ Crear | ❌ | ❌ | ❌ | ❌ |
| Envolvedor | ❌ | ✅ Crear | ❌ | ❌ | ❌ | ❌ |
| Mantenimiento | ❌ | ❌ | ❌ | ✅ Ver | ✅ Ver/Agregar | ❌ |

---

## 🔄 Flujos de Negocio Principales

### Flujo 1: Creación y Aprobación de Pedido
```
FABRIQUIN SOLICITA PEDIDO
    ↓
Crea Pedido (POST /agregar_pedido)
    ↓
Estado: PENDIENTE
    ↓
ADMIN REVISA PEDIDO
    ↓
Valida Stock Disponible
    ├─ Si INSUFICIENTE → Rechaza (POST /rechazar_pedido)
    │   └─ Estado: RECHAZADO
    │
    └─ Si SUFICIENTE → Aprueba (POST /aprobar_pedido)
        ├─ Decrementa Inventario
        ├─ Registra Salidas en Kardex
        └─ Estado: APROBADO
```

### Flujo 2: Ciclo de Producción y Entrega
```
FABRIQUIN RECIBE PEDIDO APROBADO
    ↓
Produce Tabacos/Envoltura
    ↓
Entrega al ADMIN
    ↓
ADMIN REGISTRA RECEPCIÓN (POST /recibir_tarea)
    ├─ Ingresa cantidad entregada
    ├─ Sistema calcula rezago
    ├─ Actualiza Inventario
    ├─ Registra en Kardex
    └─ Estado: COMPLETADO
    │
    └─ Si hay rezago → Seguimiento de deuda
        └─ Admin puede abonar deuda (POST /abonar_deuda)
```

### Flujo 3: Gestión de Inventario
```
INGRESO DE MATERIAL
    ↓
(POST /agregar_inventario)
    ├─ Busca si material existe
    ├─ Si existe → Suma a cantidad
    ├─ Si no existe → Crea registro
    └─ Registra ENTRADA en Kardex
    
SALIDA DE MATERIAL
    ↓
(POST /restar_inventario)
    ├─ Valida disponibilidad
    ├─ Resta del inventario
    └─ Registra SALIDA en Kardex
```

---

## ✨ Características Técnicas Destacadas

### 1. **Cálculos Automáticos Inteligentes**
```javascript
// Factor basado en unidad de lote (1500 tabacos)
let factor = pedido.cantidad / 1500;

// Cálculos dinámicos según tipo de pedido
if (material === 'Tabacos') {
    p.tripa_necesaria = +(factor * 35).toFixed(2);
    p.capa_necesaria = +(factor * 9).toFixed(2);
    p.capote_necesario = +(factor * 5).toFixed(2);
    p.cestas_necesarias = Math.ceil(factor * 3);
}
```

**Ventajas**:
- Evita cálculos manuales
- Reduce errores de ingreso
- Visualización previa de materiales necesarios

---

### 2. **Gestión de Zona Horaria (Colombia - UTC-5)**
```javascript
function obtenerHoraColombia() {
    // Fuerza zona horaria de Bogotá
    const opcionesFecha = { timeZone: 'America/Bogota', ... };
    const opcionesHora = { timeZone: 'America/Bogota', ... };
    return { fecha, hora };
}
```

**Por qué**: 
- Sincronización correcta de registros
- Reportes con hora correcta de Colombia
- Auditoría precisa

---

### 3. **Alertas Interactivas con SweetAlert2**
```javascript
const mostrarAlerta = (titulo, texto, icono = 'warning', ruta = '/pedidos') => {
    // Retorna HTML con SweetAlert2 embebido
};
```

**Proporciona**:
- Interfaz amigable
- Feedback inmediato
- Redirección automática

---

### 4. **Validación Inteligente de Stock**
Sistema que busca materiales por aproximación de nombre:
- Busca "tripa" en campos que contengan "tripa" o "material"
- Busca "capa" en campos que contengan "capa"
- Busca "capote" en campos que contengan "capote"

Esto permite flexibilidad en nomenclatura de materiales.

---

### 5. **Seguimiento de Rezagos**
Cálculo automático de deudas:
- Rezago Positivo = el fabricante debe tabacos
- Rezago Negativo = trajo más de lo solicitado
- Rezago Cero = cumplió perfectamente

Resumen acumulado por usuario visible en `/recepcion`.

---

### 6. **Sesiones Seguras**
```javascript
app.use(session({
    secret: 'gato_negro_nube',
    resave: false,
    saveUninitialized: false
}));
```

- Almacenamiento de usuario y rol en sesión
- Validación en cada acceso a ruta protegida
- Logout que destruye la sesión

---

## 🔒 Consideraciones de Seguridad

### ⚠️ Problemas Identificados

1. **Credenciales de Supabase Expuestas**
   - La clave pública está visible en `server.js` (línea 11)
   - **Impacto**: Bajo (es la clave pública, no privada)
   - **Recomendación**: Usar variables de entorno (`.env`)

2. **Contraseñas en Texto Plano**
   - Las contraseñas se almacenan sin hashear
   - **Impacto**: Alto
   - **Recomendación**: Implementar hashing con `bcryptjs`

3. **Validación de Sesión Inconsistente**
   - Algunas rutas validan `req.session.rol`
   - Otras solo validan su existencia
   - **Recomendación**: Crear middleware centralizado de autenticación

4. **Sin CSRF Protection**
   - Las rutas POST no validan tokens CSRF
   - **Recomendación**: Implementar `csurf` middleware

5. **Sin Rate Limiting**
   - No hay protección contra ataques de fuerza bruta
   - **Recomendación**: Implementar `express-rate-limit`

### ✅ Fortalezas

- ✅ Sesiones HTTP seguras
- ✅ Base de datos Supabase con control de acceso
- ✅ Uso de SDK oficial de Supabase
- ✅ Arquitectura separada Frontend/Backend
- ✅ Módulo EJS optimizado: Motor de plantillas validado estáticamente libre de inyecciones sintácticas agresivas, totalmente pasivo frente a Lintering de código de UI / Compatibilidad garantizada para navegadores webkit para impresión (`print-color-adjust`).

---

### Estado Actual: **En Producción Activa / Versión 1.6**

**Características Completadas** ✅:
- Sistema de login y autenticación básica
- Gestión de inventario y kardex
- Creación y aprobación de pedidos
- Módulo de recepción automatizado (Nómina y Cestas Plásticas)
- Gestión de máquinas y Fichas Técnicas (Mantenimiento, Códigos QRs y Visualización móvil)
- Módulo de mantenimiento (Alertas predictivas e inversión acumulada)
- Dashboard de Nómina y Facturación (Pesos Colombianos $ COP y Vales)
- Gestión de usuarios (Con integración de Documentos de Identidad)
- Despliegue en Vercel

**Problemas Conocidos** ⚠️:
- Código de Python y SQLite legacy sin usar
- Exposición de credenciales de BD
- Contraseñas sin encriptación
- Falta de validación CSRF
- Gestión de errores temporal (Uso de try-catch nativo)

### Nuevas Funcionalidades Pendientes (El Plan de Acción)

1. **Sistema de Usuarios Avanzado (Seguridad y Acceso)**
   - *Recuperación*: Configurar envío de correo ("Olvidé mi contraseña").
   - *Registro Nuevos Empleados*: Formulario para fabriquines (aprobación manual del Admin requerida).
   - *Botón de Contacto*: Opción de contacto directo por WhatsApp para nuevos registros.

### Mejoras Técnicas Recomendadas (Prioridad)

#### 🔴 Críticas
1. Implementar hashing de contraseñas con `bcryptjs`
2. Mover credenciales a `.env`
3. Agregar protección CSRF
4. Implementar validación de entrada en todas las rutas

#### 🟠 Altas
5. Crear middleware centralizado de autenticación
6. Agregar rate limiting
7. Validación de tipos con TypeScript (opcional)
8. Tests automatizados

#### 🟡 Medianas
9. Documentación de API
10. Logs estructurados
11. Dashboard de reportes
12. Exportación de datos (CSV/PDF)
13. Mejora de interfaz mobile
14. Modo oscuro

#### 🟢 Bajas
15. Eliminar código legacy Python/SQLite
16. Agregar animaciones
17. Optimización de queries BD
18. Caché con Redis

---

## 📝 Notas de Desarrollo

### Variables de Entorno Necesarias
```
PORT=3000
SUPABASE_URL=https://jgvnqumkzfwruhjglics.supabase.co
SUPABASE_KEY=sb_publishable_XXDhaCrrjj_DVUdxh04wFg_9dwm1_jQ
NODE_ENV=production
SESSION_SECRET=tu_secreto_aqui
```

### Scripts Útiles del Proyecto
```bash
# Iniciar servidor principal
node server.js

# Crear usuario admin por terminal (Legado)
python crear_admin.py

# Limpiar BD y recrear tablas SQLite (Legado)
python database.py

# Scripts de Mantenimiento Supabase (Añadidos en V1.6)
node limpiar_spam.js      # Limpiador de bóveda por spam click
node limpiar_fantasma.js  # Reparador de abonos incompletos en BD
node fix_db.js            # Ajustador de inflación (COP) manual
```

### Zona Horaria por Defecto
- **Región**: Bogotá, Colombia
- **UTC**: UTC-5
- **Formato Fecha**: YYYY-MM-DD
- **Formato Hora**: HH:MM (24 horas)

---

## 📚 Referencias y Documentación

- **Express.js**: https://expressjs.com/
- **Supabase**: https://supabase.com/docs
- **EJS**: https://ejs.co/
- **SweetAlert2**: https://sweetalert2.github.io/
- **Vercel**: https://vercel.com/docs

---

**Documento preparado para control de versiones y auditoría del proyecto.**  
*Última actualización: Marzo 2026*
