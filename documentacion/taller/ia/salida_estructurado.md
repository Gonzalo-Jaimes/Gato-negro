## 1. Problemas detectados

1. Las etiquetas no tienen `for` ni los inputs `id`: el lector de pantalla no asocia etiqueta y campo, y tocar la etiqueta no da foco.
2. Etiquetas de 11 px: ilegibles en planta y en celular. Además terminan en «:» y usan mayúsculas inconsistentes («Nombre Completo»).
3. El `placeholder` hace de guía de formato («Cédula (V- / CC-)») y desaparece al escribir. Ni el formato ni las reglas quedan visibles.
4. Solo se valida con `required`: no hay reglas de código, nombre ni documento, ni mensajes de error específicos.
5. No hay `aria-invalid`, `aria-describedby`, región de errores ni manejo de foco. El navegador muestra burbujas nativas en inglés o poco claras.
6. Estilos en línea (`style=`), con anchos fijos (`100px`) y la cuadrícula `auto 1fr 1fr auto`, que se rompe en móvil. No usa `.field`, `.input`, `.btn` ni las variables del sistema de diseño.
7. El botón usa una clase inexistente (`premium-btn`), color fijo `#10b981` y texto negro. El símbolo «✚» es decorativo y el texto «Habilitar» no dice que se registra un empleado. La altura táctil no está garantizada (≥ 44 px).
8. Terminología confusa y mixta («Fabriquín», «Cédula», «Documento», «V-/CC-») sin explicar. Tampoco hay estados deshabilitado ni éxito.

## 2. Código final

```html
<h2 id="titulo-alta">Registrar nuevo empleado</h2>

<form id="form-empleado" action="/agregar_empleado" method="POST" class="card" novalidate
      aria-labelledby="titulo-alta">

  <p class="field-hint" id="ayuda-general">
    Todos los campos son obligatorios.
  </p>

  <div class="form-grid">
    <div class="field">
      <label for="codigo">Código</label>
      <input class="input" type="text" id="codigo" name="codigo" required
             maxlength="7" autocomplete="off" autocapitalize="characters"
             spellcheck="false" aria-describedby="codigo-ayuda codigo-error">
      <p class="field-hint" id="codigo-ayuda">De 1 a 3 letras y de 1 a 4 números. Ejemplos: F01, AN12.</p>
      <p class="field-error" id="codigo-error" role="alert" hidden></p>
    </div>

    <div class="field field--ancho">
      <label for="nombre">Nombre completo</label>
      <input class="input" type="text" id="nombre" name="nombre" required
             maxlength="80" autocomplete="name"
             aria-describedby="nombre-ayuda nombre-error">
      <p class="field-hint" id="nombre-ayuda">De 3 a 80 caracteres. Solo letras, espacios, punto, apóstrofo o guion.</p>
      <p class="field-error" id="nombre-error" role="alert" hidden></p>
    </div>

    <div class="field">
      <label for="cedula">Documento de identidad</label>
      <input class="input" type="text" id="cedula" name="cedula" required
             inputmode="text" maxlength="16" autocomplete="off"
             aria-describedby="cedula-ayuda cedula-error">
      <p class="field-hint" id="cedula-ayuda">De 5 a 12 números. Prefijo opcional: CC-, V- o E-. Ejemplo: CC-1020304050.</p>
      <p class="field-error" id="cedula-error" role="alert" hidden></p>
    </div>
  </div>

  <div class="form-acciones">
    <button type="submit" class="btn btn-success" id="btn-guardar">Registrar empleado</button>
  </div>
  <p class="field-hint" id="estado-form" role="status" aria-live="polite"></p>
</form>

<style>
  /* Solo composición: todo el color/espaciado sale de las variables existentes. */
  #form-empleado .form-grid { display: grid; grid-template-columns: 1fr; gap: var(--space-4); }
  #form-empleado .form-acciones { margin-top: var(--space-6); }
  #form-empleado label { display: block; font-size: var(--text-base); font-weight: 600; margin-bottom: var(--space-1); }
  #form-empleado .input { width: 100%; min-height: 44px; font-size: var(--text-base); }
  #form-empleado .btn { min-height: 44px; width: 100%; }
  #form-empleado .field-hint { font-size: var(--text-sm); color: var(--text-muted); margin-top: var(--space-1); }
  #form-empleado .field-error { font-size: var(--text-sm); color: var(--danger); margin-top: var(--space-1); }
  /* No depender solo del color: icono textual antes del mensaje y del éxito */
  #form-empleado .field-error:not([hidden])::before { content: "⚠ Error: "; font-weight: 700; }
  #form-empleado .input.is-valid + .field-hint::after { content: " ✓ Correcto"; color: var(--success); font-weight: 700; }
  /* Foco visible (no se quita el contorno) */
  #form-empleado .input:focus-visible { outline: 3px solid var(--primary); outline-offset: 2px; }
  /* Borde grueso + color para error y éxito */
  #form-empleado .input.is-invalid { border: 2px solid var(--danger); }
  #form-empleado .input.is-valid   { border: 2px solid var(--success); }
  /* Deshabilitado: opaco, cursor y fondo distinto (no solo color) */
  #form-empleado .input:disabled,
  #form-empleado .btn:disabled { opacity: .6; cursor: not-allowed; background-image: repeating-linear-gradient(45deg, transparent 0 6px, rgba(0,0,0,.05) 6px 12px); }

  /* Escritorio: varias columnas */
  @media (min-width: 768px) {
    #form-empleado .form-grid { grid-template-columns: 180px 1fr 1fr; gap: var(--space-6); align-items: start; }
    #form-empleado .btn { width: auto; min-width: 220px; }
  }
</style>

<script>
(function () {
  var form = document.getElementById('form-empleado');
  var btn  = document.getElementById('btn-guardar');
  var estado = document.getElementById('estado-form');

  /* Reglas de negocio -> mensaje específico (qué pasó + cómo corregir) o null */
  var reglas = {
    codigo: function (v) {
      v = (v || '').trim();
      if (!v) return 'Escriba el código del empleado. Ejemplo: F01.';
      if (!/^[A-Za-z]/.test(v)) return 'El código debe empezar por letras. Ejemplo: F01 o AN12.';
      if (!/^[A-Za-z]{1,3}\d{1,4}$/.test(v)) {
        if (/[^A-Za-z0-9]/.test(v)) return 'El código no admite espacios ni símbolos. Use solo letras y números, como F01.';
        if (/^[A-Za-z]{4,}/.test(v)) return 'El código lleva máximo 3 letras al inicio. Ejemplo: AN12.';
        if (/\d/.test(v) === false) return 'Al código le faltan los números. Agregue de 1 a 4 después de las letras, como F01.';
        if (/\d{5,}$/.test(v)) return 'El código lleva máximo 4 números. Quite los que sobren, como AN1234.';
        return 'Use 1 a 3 letras seguidas de 1 a 4 números, sin mezclarlos. Ejemplo: F01.';
      }
      return null;
    },
    nombre: function (v) {
      v = (v || '').trim().replace(/\s+/g, ' ');
      if (!v) return 'Escriba el nombre completo del empleado.';
      if (v.length < 3) return 'El nombre es muy corto (' + v.length + ' caracteres). Escriba al menos 3.';
      if (v.length > 80) return 'El nombre es muy largo (' + v.length + ' caracteres). Redúzcalo a 80 o menos.';
      if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ .'\-]+$/.test(v)) return 'El nombre solo admite letras, espacios, punto, apóstrofo o guion. Quite números y otros símbolos.';
      return null;
    },
    cedula: function (v) {
      v = (v || '').trim().toUpperCase();
      if (!v) return 'Escriba el número de documento. Ejemplo: CC-1020304050.';
      var m = v.match(/^(CC-|V-|E-)?(.*)$/);
      var num = m[2];
      if (/^[A-Z]+-?/.test(num) && !/^\d/.test(num)) return 'El prefijo debe ser CC-, V- o E- (con guion). Ejemplo: CC-1020304050.';
      if (!/^\d+$/.test(num)) return 'Después del prefijo escriba solo números, sin puntos ni espacios.';
      if (num.length < 5) return 'El documento tiene ' + num.length + ' números. Debe tener al menos 5.';
      if (num.length > 12) return 'El documento tiene ' + num.length + ' números. Debe tener 12 o menos.';
      return null;
    }
  };

  var nombres = ['codigo', 'nombre', 'cedula'];

  function mostrar(nombre, msg) {
    var input = form.elements[nombre];
    var err = document.getElementById(nombre + '-error');
    if (msg) {
      err.textContent = msg; err.hidden = false;
      input.classList.add('is-invalid'); input.classList.remove('is-valid');
      input.setAttribute('aria-invalid', 'true');
    } else {
      err.textContent = ''; err.hidden = true;
      input.classList.remove('is-invalid');
      input.classList.toggle('is-valid', input.value.trim() !== '');
      input.removeAttribute('aria-invalid');
    }
  }

  function validarCampo(nombre) {
    var msg = reglas[nombre](form.elements[nombre].value);
    mostrar(nombre, msg);
    return msg;
  }

  /* Validación al salir del campo; al corregir, se re-evalúa mientras escribe */
  nombres.forEach(function (n) {
    var el = form.elements[n];
    el.addEventListener('blur', function () { if (el.value !== '') validarCampo(n); });
    el.addEventListener('input', function () {
      if (el.getAttribute('aria-invalid') === 'true') validarCampo(n);
    });
  });
  /* Normaliza el código a mayúsculas al salir del campo */
  form.elements.codigo.addEventListener('blur', function () {
    this.value = this.value.trim().toUpperCase();
  });

  form.addEventListener('submit', function (e) {
    var primero = null;
    nombres.forEach(function (n) {
      if (validarCampo(n) && !primero) primero = form.elements[n];
    });
    if (primero) {
      e.preventDefault();
      primero.focus();
      estado.textContent = 'Hay campos por corregir. Revise los mensajes en rojo.';
      return;
    }
    /* Normaliza antes de enviar y evita doble envío */
    form.elements.codigo.value = form.elements.codigo.value.trim().toUpperCase();
    form.elements.nombre.value = form.elements.nombre.value.trim().replace(/\s+/g, ' ');
    form.elements.cedula.value = form.elements.cedula.value.trim().toUpperCase();
    btn.disabled = true;
    btn.textContent = 'Guardando…';
    estado.textContent = 'Guardando el empleado…';
    /* El envío continúa como POST normal a /agregar_empleado */
  });
})();
</script>
```

Sobre `UI.form`: escribí el JS con validación propia porque no conozco con certeza la firma de `UI.form` (cómo conecta mensajes, `aria-describedby` y foco). Se puede migrar así, sin cambiar las reglas:

```js
UI.form(document.getElementById('form-empleado'), {
  campos: { codigo: reglas.codigo, nombre: reglas.nombre, cedula: reglas.cedula },
  enviar: async function (datos) { /* fetch POST a /agregar_empleado */ }
});
```

Cada función de `reglas` ya cumple el contrato `(valor) => mensaje | null`. Si usa `UI.form`, conviene quitar mi `submit`, mi `mostrar` y el `<p class="field-error">`, siempre que el helper ya los genere. El `action` y el método POST se mantienen como respaldo si `enviar` no se usa. Ojo: el servidor debe repetir estas mismas validaciones, porque la validación del cliente no es de confianza.

Los 5 estados del campo:
- **Normal:** borde base del `.input`.
- **Foco:** contorno de 3 px (`:focus-visible`).
- **Error:** `.is-invalid`, borde de 2 px, mensaje con el prefijo «⚠ Error:» y `aria-invalid`.
- **Deshabilitado:** `:disabled`, opacidad 60 %, cursor `not-allowed` y rayado.
- **Éxito:** `.is-valid`, borde verde y la marca «✓ Correcto» en la ayuda.

## 3. Verificación

1. **Etiquetas:** toque cada etiqueta («Código», «Nombre completo», «Documento de identidad»): el foco debe pasar a su campo. Ningún campo depende del placeholder; los tres campos no tienen ninguno.
2. **Errores específicos:** escriba `ABCD1` en el código, `Ana3` en el nombre y `XX-123` en el documento, y salga de cada campo. Cada uno debe mostrar un mensaje distinto, con «⚠ Error:», borde grueso y sin depender del color. En las herramientas de desarrollo debe aparecer `aria-invalid="true"`.
3. **Foco al primer inválido:** deje los tres campos vacíos y pulse «Registrar empleado». El foco debe ir a «Código» y el estado debe decir «Hay campos por corregir…». No debe enviarse nada.
4. **Éxito y formato:** `an12`, `Ana María O'Neil-Pérez` y `CC-1020304050` deben quedar con borde verde y «✓ Correcto». Al enviar, el código llega en mayúsculas (`AN12`) y el `POST` va a `/agregar_empleado` con los `name` `codigo`, `nombre` y `cedula`.
5. **Responsive y táctil:** a un ancho menor de 768 px los campos y el botón deben ir en 1 columna a ancho completo; en escritorio, en 3 columnas. Inspeccione que inputs y botón midan al menos 44 px de alto.
6. **Teclado y lector de pantalla:** recorra el formulario con Tab. El foco debe verse siempre (contorno de 3 px). Con un lector de pantalla, cada campo debe anunciar etiqueta, ayuda y error (`aria-describedby`). Al enviar un formulario válido, el botón queda deshabilitado con «Guardando…» y se ve el estado deshabilitado.
