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

El motor del juego y `src/core/EventBus` aún no existen. Al elegir motor, se debe adaptar este dueño del reloj al reloj DSP nativo y exponer sus eventos al núcleo compartido; no se deben crear relojes paralelos en otros módulos.
