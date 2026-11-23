# Dev 2 — Scale, Camera, World & Game Flow

Propiedad de la progresión de escala, cámara, escenarios, aplastamiento de entorno y flujo macro. Los cambios visibles a otros módulos se publican mediante contratos compartidos de `src/core/`.

Lee `DECISIONS.md` y acuerda la estructura de Tiers/candados antes de implementar umbrales o saltos de escala.

## Prototipo gris de Tier 1

El módulo contiene una referencia procedural acotada de Pueblo/Ciudad: `WorldStageController`, `ScaleManager`, `TramplingSystem` y `DynamicCameraController`. Los valores de crecimiento, resistencia/recompensa de props y cámara que no están definidos en `GameConfigs.json` se agrupan en `PROTOTYPE_DEFAULTS`; son valores de demostración, no balance aprobado.

El host del juego crea estas piezas y llama `scale.update(deltaSeconds)`, `trampling.update(deltaSeconds)` y `camera.update(deltaSeconds)` desde su ciclo de render. `ScaleManager` es la fuente de escala y recibe `OnEnemyDestroyed`, `OnPropTrampled`, `OnBossDefeated`, `OnConsumableConsumed`, `OnGameReset`, `OnScaleTierChanged` y `OnGameStateChanged` por `EventBus`. `TramplingSystem` usa comprobaciones XZ y empuja suavemente los objetos que aún superan la escala del jugador. La cámara consulta la escala mediante `getPlayerScale`, así evita duplicar estado.

El host también debe llamar `scale.update(deltaSeconds)` en cada frame. Cuando se consuma el completo italiano, emitir `OnConsumableConsumed` con `{ consumableId: 'completo-italiano' }`; `ScaleManager` aumenta la escala total 1,25× durante 30 segundos y luego restaura la escala de progresión. Comer otro completo refresca la duración. Ambos valores están en `GameConfigs.json`; el buff se limpia al reiniciar, terminar la partida o cambiar de Tier.

La cámara apunta al centro del cuerpo y excluye al jugador de la oclusión para mantenerlo legible. Anticipa levemente su desplazamiento con un seguimiento suavizado, de modo que las trayectorias curvas no empujen al huaso contra el borde del encuadre. El escenario marca el punto inicial con anillos y cuatro hitos de color cueca, despeja un espacio para las figuras y usa caminos anchos como guía. `constrainToArena` expone el borde del graybox para que el host limite el movimiento sin transferir su propiedad a Dev 2; la vista de prueba lo usa para no perder al personaje fuera de la arena.

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
