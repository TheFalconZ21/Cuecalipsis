---
name: roguelike-upgrades-synergies
description: >-
  Implementa el sistema de mejoras pasivas automáticas y evolución de sinergias estilo Vampire Survivors enlazado al compás 6/8.
---
# Upgrades Roguelike y Sinergias Absurdas
## Reglas Técnicas Obligatorias
1. **Armas Pasivas Ancladas al Pulso:** Cada mejora pasiva (*Pañuelos Orbitales
Cortantes*, *Chupalla Búmeran*, *Lluvia de Empanadas Explosivas*, *Ondas de
Pandero*, *Espuelas Relámpago*) se implementa como un modificador modular que
dispara en los pulsos fuertes (`0` y `3`) de `OnBeat` usando proyectiles del
`CombatPoolManager`.
2. **Selección de Nivel sin Desincronizar:** Al llenar el umbral de experiencia,
emite `OnLevelUpReady(threeRandomUpgrades)` para pausar la acción y mostrar 3
cartas. Al seleccionar una carta, reanuda la partida sincronizando con el siguiente
pulso fuerte del `RhythmClock`.
3. **Sinergias Evolucionadas:** Cuando dos mejoras complementarias alcanzan su
nivel máximo, se fusionan automáticamente en una super-arma cósmica definida en
`GameConfigs.json`.
