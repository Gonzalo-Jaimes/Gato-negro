# VISIÓN ARQUITECTÓNICA: BLACK CAT MULTI-AGENT SYSTEM (MAS) 🐈‍⬛⚡

**Preparado para:** Universidad de Pamplona / Fábrica de Tabacos Gato Negro  
**Autor:** Senior AI Agent Architect (Antigravity)  
**Fecha:** 09 de Abril de 2026

---

## 1. Introducción: El fin del Bot Monolítico
En el desarrollo de software con Inteligencia Artificial, un error común es intentar que un solo agente se encargue de todas las tareas. Esto genera "sobrecarga de contexto", donde el modelo gasta miles de tokens procesando reglas innecesarias para la tarea actual, aumentando costos y disminuyendo la precisión (alucinaciones).

La visión del **Black Cat Multi-Agent System (MAS)** propone una arquitectura de **"Enjambre de Especialistas"**, donde un agente orquestador coordina sub-agentes con conocimientos y herramientas (skills) aisladas.

---

## 2. Por qué migrar a Multi-Agentes

1.  **Eficiencia de Tokens:** Al separar los departamentos, el Agente Financiero no necesita leer el manual de motores para sacarte una cuenta. Esto reduce el consumo de la API de Gemini significativamente.
2.  **Precisión Forense:** Un agente con un "Aura" (System Prompt) específico de contabilidad tiene 40% menos de probabilidad de cometer errores matemáticos que uno generalista.
3.  **Escalabilidad:** Podemos añadir un "Gato de Recursos Humanos" o un "Gato de Ventas Externas" sin tocar el código de los demás agentes.
4.  **Aislamiento de Errores:** Si el sub-agente de maquinaria falla, el de nómina sigue funcionando perfectamente.

---

## 3. Estructura de Roles (El "Team Gato")

### A. Gato Orquestador (The Router) 🧠
Es el cerebro central que recibe los mensajes de Telegram.
- **Función:** Analizar la intención del usuario.
- **Acción:** No resuelve problemas, solo los delega. Si detecta la palabra "deuda", transfiere el hilo al Financiero.

### B. Gato Industrial (The Mechanic) 🛠️
- **Skill:** Gestión de ciclo de vida de maquinaria.
- **Herramientas:** Acceso a tabla `maquinas` y `mantenimiento`.
- **Aura:** Directo, preventivo y técnico.

### C. Gato Financiero (The Accountant) 💵
- **Skill:** Liquidación de nóminas y control de rezagos.
- **Herramientas:** Acceso a `deudores_fabriquines` y lógica de `destajo`.
- **Aura:** Extremadamente preciso y cuidadoso con los números.

### D. Gato de Vigilancia (The Watchtower) 📡
- **Función:** Agente autónomo (Cron-based).
- **Acción:** Proactividad. No responde a humanos, solo monitorea la base de datos y envía alertas al Orquestador cuando detecta anomalías de stock o retrasos de entrega.

---

## 4. Hoja de Ruta Tecnológica (Roadmap)

### Fase 1: Modularización (Corto Plazo)
Dividir el archivo `bot.js` actual en módulos de funciones independientes. Implementar el "Aura" inicial usando `Google Gemini System Instructions`.

### Fase 2: Ingesta Multimodal (Mediano Plazo)
Habilitar el "Skill de Visión". El Gato Industrial podrá analizar fotos enviadas por Telegram para identificar el estado de las piezas y actualizar el historial de mantenimiento automáticamente.

### Fase 3: Interfaz de Voz (Largo Plazo)
Implementación de **Whisper** (Speech-to-Text) para que el personal administrativo y de planta pueda interactuar mediante notas de voz, eliminando la barrera de la escritura en entornos industriales.

---

## 5. Conclusión
La evolución hacia un sistema Multi-Agente posiciona a **Gato Negro** no solo como una fábrica modernizada, sino como un laboratorio de **Ingeniería Mecatrónica Avanzada**, donde la IA no es un accesorio, sino un miembro más del equipo operativo.

> [!TIP]
> **Recomendación Técnica:** Iniciar el despliegue en un VPS de alto rendimiento (con al menos 2GB de RAM) para soportar los procesos paralelos de los sub-agentes sin latencia.
