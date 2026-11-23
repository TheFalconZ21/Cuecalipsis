---
name: juice-and-game-feel
description: >-
  Implementa respuesta sensorial reactiva (hit-flash, hitstop selectivo, scale punch y telegrafía de ataques) suscrita al EventBus sin acoplar lógica de combate.
---
# Juice, Game Feel y Legibilidad
## Reglas Técnicas Obligatorias
1. **Micro-Feedback Reactivo al EventBus:**
   - **Hit-Flash:** Al recibir `OnEnemyDamaged`, aplica un destello blanco emisivo
durante `0.07s` modificando propiedades de instancia (`MaterialPropertyBlock` /
`instanceColor`), jamás clonando materiales.
   - **Scale Punch:** En cada input `PERFECT`, aplica un pulso elástico breve
(`1.15x -> 1.0x` en `0.12s`) al indicador rítmico y al huaso.
   - **Hitstop Selectivo:** Congela `timeScale = 0.05` durante `35ms`
exclusivamente al activar un **Remate** o derrotar a un Jefe (sin alterar ni
detener el reloj DSP de audio).
2. **Telegrafía Obligatoria:** Todo ataque de área (GOPE, Tanques Leopard) o
embestida de Jefe debe emitir `OnAttackTelegraph(pos, radius, duration)` y dibujar
un marcador claro en el suelo al menos `1.0s` (2 pulsos fuertes) antes de aplicar
daño.
