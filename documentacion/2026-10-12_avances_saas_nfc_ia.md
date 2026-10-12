# 📝 Registro de Avances y Actualizaciones - Octubre 2026

Este documento compila las recientes optimizaciones, rediseños y componentes agregados al ecosistema **ERP Gato Negro**, así como la adopción formal de flujo de trabajo colaborativo por ramas solicitado por la tutoría de proyecto.

---

## 1. 🔀 Adopción de Flujo Git por Ramas (Branch Workflow)
Atendiendo las recomendaciones del tutor académico:
- Se suspendieron los commits directos sobre la rama `main`.
- Se adoptó el modelo de ramas de características (`feature/*`) con commits semánticos y mensajes descriptivos antes de fusionar.
- **Ramas recientes integradas y versionadas:**
  - `feature/nfc-splash-screen`: Pantalla de bienvenida interactiva y responsive móvil para el inicio de sesión vía NFC.
  - `feature/landing-saas-dark-neko`: Rediseño oscuro/naranja con mascota interactiva para la oferta comercial SaaS.
  - `feature/propuesta-ia-excel-sync`: Documentación, arquitectura del puente bidireccional de Excel e integración de Redes Neuronales.

---

## 2. 📱 Pantalla de Bienvenida NFC (Splash Screen Responsive)
- **Vista dedicada:** [splash_nfc.ejs](file:///c:/Users/gonza/OneDrive/Desktop/gato/views/splash_nfc.ejs) diseñada para la lectura de tags/tarjetas NFC físicas de operarios.
- **Fondo de Video Optimizado:** Integración del video corporativo [nfc_bg.mp4](file:///c:/Users/gonza/OneDrive/Desktop/gato/public/nfc_bg.mp4) con reproducción en bucle (`autoplay muted loop playsinline`) y superposición de gradiente oscuro.
- **Ajuste Responsive:** Corrección del `meta viewport` (`width=device-width, initial-scale=1.0`) en componentes compartidos [src/lib/shared.js](file:///c:/Users/gonza/OneDrive/Desktop/gato/src/lib/shared.js) para eliminar el problema de tipografía microscópica en dispositivos móviles Android/iOS.
- **Tarjeta de Bienvenida Dinámica:** Tarjeta con efecto glassmorphism, indicador de rol, conteo regresivo automático de 2 segundos y botón de ingreso inmediato con sonido visual de confirmación.

---

## 3. 🐱 SaaS Landing Page y Dinamismo de Marca (Dark & Orange)
- **Rediseño Estético:** [views/landing.ejs](file:///c:/Users/gonza/OneDrive/Desktop/gato/views/landing.ejs) actualizado completamente con la paleta de marca:
  - Fondo negro carbón y gris grafito (`#0a0a0c`, `#131419`).
  - Acentos ámbar y naranja tabaco (`#f59e0b`, `#f97316`).
  - Tarjetas de características SaaS (Kardex en tiempo real, control de torcedores/envolvedoras, liquidación de nómina automática, control NFC).
- **Mascota Interactiva (Oneko / Gato Negro Seguidor del Cursor):**
  - Integración de script de animación de gatito en tiempo real vía jsDelivr (`adryd325/oneko.js`).
  - Aplicación de filtro CSS dinámico (`filter: invert(1) hue-rotate(180deg)`) para transformar al gato blanco clásico de escritorio en un **gato negro con detalles estilizados**, respetando la identidad del ERP.
  - Comportamiento no intrusivo (`pointer-events: none`) para evitar bloquear botones, inputs o enlaces del usuario.
- **Canales de Conversión SaaS:**
  - Correo directo a administración: `gonzaloandres577@gmail.com`.
  - Botón de WhatsApp flotante con mensaje preconfigurado: *"¡Hola Gonzalo! Estoy interesado en el SaaS, ¿me podrías dar más información?"*.

---

## 4. 🔀 Modularización y Ajuste de Enrutamiento
- Redirección del root `/` hacia la landing page de presentación comercial SaaS.
- Ajuste de middlewares de autenticación para redirigir peticiones no autorizadas directamente a `/login` en lugar de crear bucles hacia la landing.
- Limpieza y estandarización de rutas en [server.js](file:///c:/Users/gonza/OneDrive/Desktop/gato/server.js) y controladores modulares bajo `src/routes/`.
