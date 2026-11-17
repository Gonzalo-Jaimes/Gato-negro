Formulario mejorado (solo texto, sin leer archivos). Cambios principales: estilos inline pasados a clases CSS, `<label for>` enlazado a cada input (accesibilidad), `autocomplete`/`inputmode`/`pattern`/`maxlength` para validar en el cliente, texto de ayuda con `aria-describedby`, grilla responsive (una columna en móvil), foco visible y botón con texto claro (sin emoji como único significado).

HTML:

```html
<section aria-labelledby="titulo-nuevo-empleado" class="card form-empleado">
  <h2 id="titulo-nuevo-empleado">Registrar nuevo empleado</h2>

  <form action="/agregar_empleado" method="POST" class="form-empleado__grid" autocomplete="off">
    <div class="campo campo--codigo">
      <label for="codigo">Código <span aria-hidden="true">*</span></label>
      <input id="codigo" name="codigo" type="text"
             placeholder="Ej: F01" required
             maxlength="10" pattern="[A-Za-z0-9\-]{2,10}"
             autocapitalize="characters" spellcheck="false"
             aria-describedby="ayuda-codigo">
      <small id="ayuda-codigo">2 a 10 caracteres, sin espacios.</small>
    </div>

    <div class="campo">
      <label for="nombre">Nombre completo <span aria-hidden="true">*</span></label>
      <input id="nombre" name="nombre" type="text"
             placeholder="Nombre del Fabriquín" required
             minlength="3" maxlength="80" autocomplete="name">
    </div>

    <div class="campo">
      <label for="cedula">Documento <span aria-hidden="true">*</span></label>
      <input id="cedula" name="cedula" type="text"
             placeholder="V-12345678 / CC-12345678" required
             maxlength="20" pattern="(V|E|CC|CE)-?[0-9]{5,12}"
             inputmode="text" spellcheck="false"
             aria-describedby="ayuda-cedula">
      <small id="ayuda-cedula">Prefijo V-, E- o CC- seguido de números.</small>
    </div>

    <button type="submit" class="premium-btn btn-habilitar">Habilitar empleado</button>
  </form>
</section>
```

CSS:

```css
.form-empleado { margin-bottom: 25px; }
.form-empleado__grid {
  display: grid;
  grid-template-columns: 120px 1fr 1fr auto;
  gap: 12px;
  align-items: start;           /* start, no end: las ayudas no desalinean el botón */
}
.campo { display: flex; flex-direction: column; gap: 4px; }
.campo label { font-size: 12px; font-weight: 600; }
.campo input { width: 100%; box-sizing: border-box; }
.campo small { font-size: 11px; color: #94a3b8; }
.campo input:focus-visible { outline: 2px solid #10b981; outline-offset: 2px; }
.campo input:user-invalid { border-color: #ef4444; }
.btn-habilitar {
  background: #10b981; color: #000; font-weight: 700;
  padding: 12px 20px; align-self: start; margin-top: 20px; /* alinea con los inputs */
}
.btn-habilitar:hover { filter: brightness(1.08); }
.btn-habilitar:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

@media (max-width: 720px) {
  .form-empleado__grid { grid-template-columns: 1fr; }
  .btn-habilitar { margin-top: 0; width: 100%; }
}
```

Notas y recomendaciones:
- Ajusta el `pattern` del documento a los formatos reales que aceptes; si no quieres restringir, quítalo y valida en el servidor.
- Valida siempre también en el backend (código único, longitud, formato); la validación HTML es solo comodidad.
- Si el backend devuelve errores (por ejemplo código duplicado), muéstralos junto al campo con `role="alert"` o `aria-live="polite"`, y evita recargar toda la página (por ejemplo con `fetch` más un toast), coherente con los 7 estados del taller.
- Añade protección CSRF si la app lo soporta (token oculto en el form).
- `autocomplete="off"` en el form evita sugerencias irrelevantes para códigos internos; el nombre conserva `autocomplete="name"` solo si quieres el autocompletado del navegador (puedes quitarlo, ya que registras a terceros).
