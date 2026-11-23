# Dev 1 — Rhythm & Player

Propiedad del reloj DSP 6/8, evaluación de precisión, máquina de pasos de cueca, movimiento/arquetipos y audio. Comunica cambios a otros roles usando contratos acordados en `src/core/`.

## Reloj único

`rhythm-clock.js` exporta una única instancia `CuecalipsisRhythmClock`, dueña del tiempo musical del prototipo. Usa `AudioContext.currentTime` como única fuente temporal; los temporizadores solo despiertan el planificador. Publica `beatScheduled` antes del pulso, con el `audioTime` exacto, y `beat` al llegar a ese tiempo. Publica `sectionScheduled` y `sectionChanged` en los límites de sección. Cada evento rítmico incluye `audioTime`, `absoluteSubdivisionIndex`, `subdivisionIndex`, `barIndex`, `sectionIndex`, `isStrong`, `isValidAttack` y `bpm`. Los consumidores consultan `getSnapshot()` para progreso continuo y `judgeInput(event.timeStamp)` para evaluar inputs.

- La música se asigna con `setTrackBuffer(buffer, { loop, offset })` antes de `start()` y se programa para el mismo `startAudioTime` del reloj.
- El gameplay usa `judgeInput()` y programa acciones en los `audioTime` publicados; no calcula su propio BPM.
- Los enemigos deben suscribirse a `beatScheduled` para telegrafiar/encolar acciones con el tiempo objetivo, y usar el mismo reloj para resolverlas. No deben tener temporizadores o relojes rítmicos locales.
- `beatScheduled` permite preparar una acción futura; `beat` marca que el tiempo objetivo ya llegó. En ambos casos `audioTime` es el dato temporal autoritativo.
- La sección dura ocho pulsos de negra con puntillo (24 corcheas, cuatro compases de 6/8).
- El prototipo configura temporalmente los slots válidos `[0, 2, 4]`; sus índices siguen pendientes de validar contra la pista definitiva. Las mejoras pueden llamar `unlockAttackSlot(index)` para habilitar más posiciones, hasta las seis corcheas.

El juego usa Three.js y `src/core/EventBus`. El reloj permanece como dueño único del tiempo musical y `RhythmEventBridge.ts` publica sus eventos al núcleo compartido; ningún otro módulo debe crear un reloj rítmico paralelo.

## Pista activa y prototipo

La pista configurada es `assets/audio/music/La Pena que Me Quema - 43s.mp3`, en `GameConfigs.json`. El HUD de prueba carga el archivo con `fetch` y `AudioContext.decodeAudioData`; la fuente de música y el reloj comparten el mismo `AudioContext` y `startAudioTime`. Pulsa **Iniciar cueca** para cargar y reproducir. La opción elegida es reproducir una vez; al terminar, el reloj se detiene y **Reset** permite empezar otra vez.

`RhythmEventBridge.ts` adapta `RhythmClock` al `EventBus` tipado y adjunta Space/C a keydown no repetido. `SkillChargeMeter.ts` es dueño de la carga: suma el daño efectivo y destrucciones publicados por combate/escala, y consume el 100% cuando el host activa C. El host debe inyectar el paso de cueca y la posición actuales del jugador. Ver [`RHYTHM-INTEGRATION.md`](./RHYTHM-INTEGRATION.md) y [`COMBAT-RHYTHM-HANDOFF.md`](./COMBAT-RHYTHM-HANDOFF.md).

El preview de HUD aún contiene arena de combate simulada; no es la integración del juego final. El montaje Three.js de `src/main.ts`, el consumidor del evento de MISS en combate y la carga de habilidad desde destrucción del escenario requieren coordinación con sus dueños.
