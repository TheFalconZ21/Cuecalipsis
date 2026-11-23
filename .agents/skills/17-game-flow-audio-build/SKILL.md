---
name: game-flow-audio-build
description: >-
  Gestiona el ciclo completo de estados (Menú, Selector de Huaso, Partida, Victoria/Derrota), el limitador de voces de audio y los atajos de demostración para el jurado.
---
# Flujo Macro, Limitador de Audio y Demo Mode
## Reglas Técnicas Obligatorias
1. **Máquina de Estados Macro (`GameStateManager`):**
   - Ciclo completo: `MainMenu` -> `CharacterSelect` (5 Huasos) -> `Playing` ->
`LevelUpPause` -> `Victory` (Zapateo Divino y Reset del Universo) / `GameOver`.
   - **Hard Reset Garantizado:** La función `ResetMatch()` debe devolver todos los
objetos activos a sus pools, reiniciar la masa a Tier 1, limpiar estados de jefes y
reiniciar el `RhythmClock` sin duplicar suscripciones del `EventBus`.
2. **Limitador de Concurrencia Acústica (`AudioController`):**
   - Ningún efecto de sonido repetitivo (zapateos, impactos, explosiones) puede
superar las `5` instancias simultáneas en una ventana de `80ms`. Aplica variación
aleatoria de `pitch` (`0.95` a `1.05`) en cada reproducción.
3. **Teclas de Demostración para el Jurado (Showcase Shortcuts):**
   - Mantener habilitados los atajos de depuración: `F1` a `F4` para saltar
instantáneamente a los Tiers 1, 2, 3 o 4; `F5` para invocar a *Fabi, el Dios de la
Cueca*; `F6` para abrir el selector de mejoras; y `[` / `]` para calibrar
`audioOffsetMs` en vivo.
