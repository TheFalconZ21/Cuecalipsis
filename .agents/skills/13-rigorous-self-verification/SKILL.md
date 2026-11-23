---
name: rigorous-self-verification
description: >-
  Impide entregar código o assets sin antes auditar exhaustivamente todos los requisitos funcionales, límites de rendimiento, ausencia de clipping y casos borde.
---
# Gatekeeper de Auto-Verificación y Pulido Riguroso
## Regla de Auditoría Interna Obligatoria
**Nunca entregues el primer borrador de una solución.** Antes de dar por terminada
tu respuesta, ejecuta esta verificación completa y corrige cualquier hallazgo:
1. **Checklist de Exigencias:** ¿Se cumplen al 100% las restricciones del prompt y
de las skills activas (compás 6/8 DSP, escalado por Tiers, low-poly top-down, `Y >=
0` sin clipping, cero allocs en bucle, aislamiento de carpetas)?
2. **Integridad de Código:** ¿Coinciden exactamente los nombres de eventos de
`core/EventBus`, las interfaces de `GameContracts` y las claves de
`GameConfigs.json`? ¿Están todas las suscripciones limpiadas al destruir o
reiniciar?
3. **Casos Borde:** ¿Qué ocurre al cambiar de BPM, al saltar de Tier 1 a 4, al
pausar en `LevelUpPause` o al hacer `Hard Reset`?
4. **Reporte de Verificación:** Incluye al final de tu respuesta un bloque breve de
4 líneas confirmando: (a) Fuentes de verdad reutilizadas, (b) Archivos
creados/editados dentro del módulo permitido, y (c) Validaciones de rendimiento y
clipping superadas.
