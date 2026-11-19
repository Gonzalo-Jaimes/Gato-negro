# Fase 7 · Guía de ejecución y guion de sustentación

## 1. Cómo ejecutar el producto en local

Requisitos: Node.js 20 o superior y acceso a internet (la base de datos es Supabase en la nube).

```bash
git checkout feature/taller-mejoramiento
npm install
```

Crear `.env` copiando `.env.example`. Para el taller basta con (el código tiene valores por defecto para Supabase en desarrollo):

| Variable | Para qué | Nota |
|---|---|---|
| `SESSION_SECRET` | Firma de la sesión | **Recomendado** fijarla (cualquier texto largo): sin ella la clave es aleatoria y la sesión se pierde en cada reinicio |
| `SUPABASE_URL`, `SUPABASE_KEY` | Base de datos | Opcionales en local (valores por defecto en `src/lib/shared.js`) |
| `TELEGRAM_TOKEN` | Bot de Telegram | El token actual está **rechazado (401)**: el bot no arranca, la web sí. Dejarlo vacío silencia el aviso |
| `GEMINI_API_KEY` | Análisis con IA | Opcional |

```bash
npm start
```

Abrir `http://localhost:3000` (si el puerto está ocupado, definir `PORT`). Iniciar sesión con un usuario **administrador** real; las credenciales no están en el repositorio.

**Rutas para la demostración:** `/analitica`, `/empleados`, `/despacho`, `/movimientos`, `/bodega`, `/guia_estilos` (solo administrador). Como trabajador (anillador, empacador o fabriquín): `/cierre_diario`.

**Regenerar el informe en PDF:**

```bash
python -I documentacion/taller/build_pdf.py
```

Usa `markdown-it-py` y Chrome o Edge instalados. Salida: `documentacion/taller/Informe_Taller_SaaS.pdf`. Los datos de portada están en `documentacion/taller/portada.json`.

## 2. Antes de la sustentación (lista de 10 minutos)
- [ ] La app arranca y se puede iniciar sesión como administrador. **Probarlo el mismo día**, con la red del salón si es posible.
- [ ] Tener abierto en pestañas: `/analitica`, `/empleados`, `/despacho`, `/movimientos`, `/bodega`, `/guia_estilos`.
- [ ] Tener el commit original `a24fbc5` ejecutándose en otro puerto (opcional, para mostrar el «antes» en vivo): `git worktree add C:/gn_antes a24fbc5`, enlazar `node_modules`, copiar `.env`, `PORT=3002 node server.js`.
- [ ] El PDF abierto en las comparaciones (`08`) y en la matriz (`11`).
- [ ] **No** mostrar ni ejecutar acciones destructivas ni de pago (borrar, liquidar, registrar salida): trabajar con búsquedas, filtros, validaciones y confirmaciones que se cancelan.
- [ ] Tener a mano las fichas de IA y el experimento (`07`).
- [ ] Si se hicieron las pruebas con usuarios, las hojas de registro y una frase de cada participante.

## 3. Guion de 10 minutos

| Min | Tema | Qué mostrar | Qué decir (idea clave) |
|:-:|---|---|---|
| 0:00 | Punto de partida | Capturas «antes» (`08`), hallazgos 19–21 | No empezamos de cero: diagnosticamos una SaaS real. 21 hallazgos medidos; los más graves eran fallos que impedían trabajar (gráfica rota, errores 500, botones bloqueados por el CSP) |
| 1:30 | Arquitectura de información | Menú lateral nuevo; abrir un grupo con teclado | 19 → 24 enlaces, 12 a un clic, ordenado por la cadena de producción; 6 páginas huérfanas ahora alcanzables |
| 2:30 | Sistema de diseño | `/guia_estilos`; activar modo oscuro | 82 tokens y una sola definición por componente; el modo oscuro solo cambia variables. Contraste calculado, no supuesto |
| 4:00 | Formulario crítico | `/empleados`: enviar vacío, escribir mal y bien | Etiquetas visibles, mensajes que dicen cómo corregir, mismas reglas en servidor y navegador. Mostrar el foco al primer campo inválido |
| 5:00 | Tabla | `/movimientos`: buscar «88193514» en empleados, filtro Salidas + «capa», orden, paginación | 254 movimientos; en móvil se convierte en tarjetas (mostrar en ancho 375) |
| 6:00 | 7 estados | Quitar la red simulada o usar «Actualizar» con el servidor detenido (opcional); sin resultados y confirmación de borrado cancelada | Cargando, vacío, error con reintento, sin permisos, sin resultados |
| 7:00 | Accesibilidad | Despacho con solo teclado (↑ ↓ Enter) y la auditoría | Antes solo funcionaba con ratón. Cifras: controles sin etiqueta 53 → 0; textos bajo el contraste 21 → 0 en Kardex |
| 8:00 | IA | Tabla de la comparación de prompts | 6/20 frente a 18/20; la IA se equivocó varias veces y lo detectamos probando; declarar el sesgo del experimento |
| 9:00 | Cierre | Matriz de cumplimiento | Qué falta, sin ocultarlo: pruebas con usuarios, Bodega en móvil, Lighthouse |

## 4. Preguntas difíciles y respuestas honestas

| Pregunta | Respuesta |
|---|---|
| ¿Mejoró la usabilidad? | Quitamos barreras medibles (etiquetas, contraste, teclado, errores). Si hay pruebas con usuarios, citar sus tiempos; si no, decir que están pendientes |
| ¿Qué hizo la IA y qué hicieron ustedes? | Casi todo el código lo escribió la IA bajo nuestras decisiones: línea base, alcance, permisos, formato, qué se prueba con datos reales. Ver `07`, sección 2 |
| ¿Por qué un kit propio y no una librería? | Eliminamos jQuery/DataTables (sin integridad, en inglés por el CSP) y no añadimos dependencias; el costo es que los errores son nuestros: encontramos 5 y los corregimos |
| ¿Por qué se relajó el CSP? | Helmet bloqueaba los 98 manejadores en línea; se alineó con la política de scripts existente. Es una concesión temporal; lo correcto es migrarlos (quedan 87) |
| ¿Probaron en la base real? | Solo lectura (48 empleados, 254 movimientos). Altas y bajas se probaron con respuestas simuladas y con envíos inválidos al servidor |
| ¿Por qué Lighthouse no? | Corre en un navegador aparte sin la sesión; usamos una auditoría propia, más estrecha y reproducible |
| ¿Qué falta? | Ver la sección 4 de `11_matriz_de_cumplimiento.md` |

## 5. Si algo falla en vivo
- **Pantalla en blanco o 500:** abrir `/login`, volver a entrar; mirar la consola del servidor. Las rutas de administración redirigen si la sesión caducó.
- **El bot de Telegram imprime 401:** es esperado; no afecta a la web.
- **Sin internet:** la app no carga datos (Supabase) ni las fuentes. Tener las capturas del PDF como respaldo.
- **El puerto 3000 está ocupado:** `PORT=3001 npm start`.
