# Dev 2 — Scale, Camera, World & Game Flow

Propiedad de la progresión de escala, cámara, escenarios, aplastamiento de entorno y flujo macro. Los cambios visibles a otros módulos se publican mediante contratos compartidos de `src/core/`.

Lee `DECISIONS.md` y acuerda la estructura de Tiers/candados antes de implementar umbrales o saltos de escala.

## Prototipo gris de Tier 1

El módulo contiene una referencia procedural acotada de Pueblo/Ciudad: `WorldStageController`, `ScaleManager`, `TramplingSystem` y `DynamicCameraController`. Los valores de crecimiento, resistencia/recompensa de props y cámara que no están definidos en `GameConfigs.json` se agrupan en `PROTOTYPE_DEFAULTS`; son valores de demostración, no balance aprobado.

El host del juego crea estas piezas y llama `trampling.update(deltaSeconds)` y `camera.update(deltaSeconds)` desde su ciclo de render. `ScaleManager` es la fuente de escala y recibe `OnEnemyDestroyed`, `OnPropTrampled`, `OnBossDefeated` y `OnGameReset` por `EventBus`. `TramplingSystem` usa comprobaciones XZ y empuja suavemente los objetos que aún superan la escala del jugador. La cámara consulta la escala mediante `getPlayerScale`, así evita duplicar estado.

Ejemplo de montaje en el host (la integración con `src/main.ts` queda fuera del módulo Dev 2):

```ts
const stage = new WorldStageController({ scene });
const scale = new ScaleManager({ onScaleChanged: (value) => player.scale.setScalar(value) });
const trampling = new TramplingSystem({ player, scaleManager: scale, targets: stage.trampleTargets });
const camera = new DynamicCameraController({ scene, camera: gameCamera, player, getPlayerScale: () => scale.currentTotalScale });

// En el ciclo de render, con deltaSeconds del frame:
trampling.update(deltaSeconds);
camera.update(deltaSeconds);
```

Al desmontar, llamar `camera.dispose()`, `trampling.dispose()`, `scale.dispose()` y `stage.dispose()` para limpiar suscripciones y recursos.

La derrota del guardián de Tier 1 publica la transición a Tier 2 como demostración del contrato; el contenido y balance de Tier 2 siguen pendientes de acuerdo. No hay lógica de enemigos, reloj rítmico ni control de movimiento en este módulo.
