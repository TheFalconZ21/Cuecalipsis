# Integración del reloj y la pista

## Configuración y reproducción

`GameConfigs.json` es la fuente de BPM, métrica, slots, ventanas de juicio y ruta del track. Antes de empezar, el host configura el singleton y carga el MP3:

```ts
const config = gameConfig.rhythm;
const clock = window.CuecalipsisRhythmClock;
clock.configure({
  bpm: config.bpm,
  subdivisionsPerBar: config.subdivisionsPerBar,
  subdivisionsPerDottedQuarter: config.subdivisionsPerDottedQuarter,
  strongSubdivisions: config.strongSubdivisions,
  validAttackSubdivisions: config.validAttackSubdivisions,
  perfectWindowMs: config.judgementWindowsMs.perfect,
  goodWindowMs: config.judgementWindowsMs.good,
  audioOffsetMs: config.audioOffsetMs,
  sectionDottedQuarterBeats: config.sectionDottedQuarterBeats,
  sectionNames: config.sectionNames,
  perfectDamageMultiplier: config.damageMultipliers.perfect,
  goodDamageMultiplier: config.damageMultipliers.good,
  missDamageMultiplier: config.damageMultipliers.miss,
});
await clock.loadTrack(trackUrl, { loop: config.playback === 'loop' });
await clock.start(); // Llamar desde una acción del usuario para habilitar Web Audio.
```

`loadTrack` crea/reutiliza el `AudioContext`, lo reanuda desde el gesto del usuario, obtiene la pista y la decodifica. La fuente de audio se programa en `clock.startAudioTime`. `trackEnded` detiene el planificador cuando se reproduce una vez. Pause/resume suspende y reanuda ese mismo contexto; Stop permite reiniciar la pista.

## EventBus e inputs

Crear un `RhythmEventBridge(clock)` al iniciar la partida y llamar a `dispose()` al desmontarla. El bridge publica `OnBeatScheduled`, `OnBeat`, `OnSectionScheduled`, `OnSectionChanged`, `OnInputEvaluated`, `OnBasicStepAttack`, `OnWeakStepAttack`, `OnAttackSlotsChanged` y `OnMusicTrackEnded`. `attachControls(window, getAttackState, onUltimate)` impide repetir ataques al mantener Space y llama `onUltimate` una vez por pulsación de C.

`getAttackState()` debe consultar el estado actual del juego y entregar `{ step, position }`; el bridge no duplica el estado del jugador ni el paso coreográfico. Para subir carga, el emisor de combate debe informar daño efectivo/destrucción por los contratos correspondientes; `OnInputEvaluated.skillChargeDelta` se mantiene en cero.

`SkillChargeMeter` consume `OnEnemyDamaged`, `OnEnemyDestroyed` y `OnPropTrampled`; `GameConfigs.json` contiene sus tasas provisionales (8% por punto de daño efectivo, 12% por baja, 18% por prop destruido). El HUD escucha `OnSkillChargeChanged`. Al pulsar C, el host llama a `meter.activate(step, nextStep, position)`: solo con 100% consume la carga y emite `OnSuperiorStepUnleashed` para la sección/paso actual. Reiniciar la partida emite `OnGameReset` y devuelve la carga a cero.

## Precisión de final

La pista dura 42,984 s. Con 85 BPM de negra con puntillo, una sección de ocho pulsos dura 5,647 s. La pista se reproduce una vez y no se corta ni se repite en una frontera inventada; su final cae dentro de una sección. Confirmar la cadencia/estructura final al probar la canción completa antes de cambiar a loop o de marcar slots rítmicos como definitivos.
