# Núcleo compartido (`src/core/`)

Este espacio alojará los contratos compartidos (`EventBus`, tipos/interfaces de juego y `GameConfigs.json`). Todavía no hay implementaciones: no supongas que los eventos, firmas o esquemas mencionados en los PDF ya existen.

## Coordinación

- Antes de crear o cambiar un evento o campo, revisar todos los módulos que lo emiten/consumen y coordinar con ellos.
- Mantener cambios aditivos y retrocompatibles. Evitar lógica propia de un rol aquí.
- El reloj rítmico, escala/estado macro, combate/pools y presentación pertenecen a sus módulos respectivos.
- Los valores de balance deben residir en `GameConfigs.json`; acordar su esquema con los cuatro roles antes de consumirlo.

## Contratos a definir en la fundación

1. Tipos de eventos y ciclo de vida de sus suscripciones.
2. Contratos para personaje/estado/ataques/escala y opciones de mejora.
3. Esquema versionado de configuración, incluyendo personajes, escala, hordas, jefes y mejoras.
4. Reglas de pausa/reinicio que mantengan sincronizados audio y simulación.

`OnConsumableConsumed` publica `{ consumableId }` cuando el jugador termina de consumir un objeto. El módulo de escala escucha `completo-italiano` para activar su buff temporal; los emisores deben publicar el evento desde la acción real de consumo.

Las ambigüedades de duración de corchea, Tiers y niveles de hordas están asignadas a los documentos `DECISIONS.md` de los roles responsables.

### Contratos rítmicos extendidos (Dev 1)

Los contratos rítmicos se ampliaron de forma aditiva: beats agendados, límites de sección, desbloqueo de slots y fin de pista. `OnBasicStepAttack` puede incluir `damageMultiplier`; `OnWeakStepAttack` distingue un MISS que también debe causar daño reducido. Combate debe mantener ambos juicios y aplicar el multiplicador. El bridge y los pendientes están documentados en `src/modules/rhythm-player/COMBAT-RHYTHM-HANDOFF.md`.
