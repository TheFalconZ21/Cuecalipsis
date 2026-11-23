---
name: rhythm-6-8-engine
description: >-
  Implementa y depura el motor rítmico en compás de 6/8, sincronización con reloj de hardware de audio DSP y evaluación de ventanas de precisión (Perfect, Good, Miss).
---
# Motor Rítmico 6/8 (Cueca)
## Reglas Técnicas Obligatorias
1. **Tiempo basado en Audio (DSP):** Calcula el progreso del compás leyendo
exclusivamente el tiempo físico del buffer de audio (`AudioServer` /
`AudioContext.currentTime`) más una variable configurable `audioOffsetMs` para
calibración de latencia. Prohibido usar `deltaTime` o `setInterval` para medir
beats.
2. **Estructura del Compás 6/8:**
   - Un compás consta de 6 subdivisiones de corchea (índices `0` a `5`) agrupadas
en 2 tiempos fuertes compuestos (`0`: pulso 1; `3`: pulso 4).
   - Emite `OnBeat(subdivisionIndex, isStrongBeat)` en `core/EventBus` en cada
corchea.
3. **BPM Dinámico por Arquetipo de Huaso:** Lee el BPM desde
`core/GameConfigs.json`:
   - Huaso MC (Hip Hop): ~100 BPM
   - Huaso Tech (Electrónica): ~126 BPM
   - Huaso Tradicional: ~138 BPM
   - Huaso Metalero: ~165 BPM
   - Huaso Otaku (Nightcore): ~182 BPM
4. **Ventanas de Evaluación de Input:**
   - `PERFECT`: `±45ms` respecto al pulso objetivo (100% de carga de habilidad
`SkillCharge`, daño completo e incrementa combo).
   - `GOOD`: `±95ms` respecto al pulso objetivo (50% de carga `SkillCharge`, daño
base y mantiene combo).
   - `MISS`: `> 95ms` (no resta vida, reinicia multiplicador a `x1` y aplica
cooldown de `0.25s` anti-mashing).
5. **Salida Continua:** Expón siempre `beatProgress` (`0.0` a `1.0`) para alimentar
animaciones procedurales, shaders y HUD.
