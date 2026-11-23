---
name: data-driven-configs
description: >-
  Separa todos los parámetros de balanceo (BPM, umbrales de escala, oleadas, vida de jefes y armas pasivas) en src/core/GameConfigs.json.
---
# Arquitectura Data-Driven
## Reglas Técnicas Obligatorias
1. **Prohibido Hardcodear Números de Balanceo:** Ningún script de lógica puede
contener constantes fijas para BPM, daño, tiempos de recarga, radios de explosión o
masa requerida por Tier.
2. **Fuente Central en `src/core/GameConfigs.json`:** Estructura y consume
secciones tipadas para:
   - `characters`: ID, nombre, BPM base, ruta de pista `.ogg`, multiplicador de
Enjundia.
   - `scaleTiers`: Tier (`1–4`), umbral de masa, rango de escala visual (`1.0–
4.5`), distancia/FOV de cámara y factor de velocidad.
   - `hordeWaves` y `bosses`: Vida máxima, velocidad, cadencia por pulso y
recompensa de masa.
   - `upgrades`: ID, nombre, descripción, estadísticas por nivel (`1–5`) y par de
sinergia.
