# Decisiones acordadas — Dev 1

Estas decisiones reemplazan las recomendaciones anteriores que aparezcan en los manuales y skills del proyecto para ritmo, carga de habilidad y controles.

## Reloj y métrica

- `RhythmClock` de Dev 1 es la única fuente de verdad temporal para música y gameplay. El tiempo de cada pulso se deriva de `AudioContext.currentTime` y de un origen de audio común; temporizadores solo despiertan al planificador y nunca cuentan beats.
- Duración de cada corchea: `60 / BPM / 3` segundos.
- En esta convención, el BPM de cada pista se expresa en negras con puntillo: tres corcheas por pulso.
- Cada compás tiene seis corcheas, índices `0–5`; los pulsos fuertes son `0` y `3`.
- Al inicio se integra una sola pista: cueca tradicional, a `85 BPM` en negras con puntillo (`127.5 BPM` contando negras).
- Con esa configuración, cada corchea dura `60 / 85 / 3 ≈ 0.2353 s`; los pulsos fuertes `0` y `3` quedan separados por tres corcheas.
- El análisis de `La Rosa con el Clavel.mp3` estimó `83–85 BPM` en negras con puntillo; se fija `85 BPM` como valor inicial. El reloj lee el valor desde configuración, no lo hardcodea.

## Ataque básico y carga

- `Space` ejecuta el ataque básico de la sección coreográfica actual.
- En cada compás de 6/8 hay inicialmente tres slots rítmicos válidos para atacar, seleccionados entre sus seis corcheas. Las mejoras podrán habilitar slots adicionales, hasta un máximo de seis. Los índices de los tres slots iniciales se fijarán contra la pista definitiva.
- La evaluación se hace respecto al slot válido más cercano: `PERFECT` (`±45 ms`) aplica el crítico; `GOOD` (`>45 ms` y `≤95 ms`) aplica bonus sin crítico; fuera de `±95 ms` es `MISS`. Los multiplicadores exactos se balancean en la configuración compartida.
- Un `MISS` igualmente ejecuta el ataque, pero con daño muy reducido. El multiplicador de penalización queda por balancear en la configuración compartida.
- El ataque requiere una pulsación nueva de `Space`: mantener la tecla presionada no repite ni carga ataques. Se rearma al soltarla.
- La implementación de prueba usa `0.2x` como daño de `MISS`, solo como valor provisional para el prototipo.
- La carga de la habilidad superior aumenta al dañar enemigos y destruir el escenario. No aumenta por acertar inputs sin causar ese daño/destrucción. Los valores por daño y por prop se balancean en `GameConfigs.json`.

## Habilidad superior y secciones

- Cada sección musical dura ocho pulsos de negra con puntillo, equivalentes a cuatro compases de 6/8. El cambio ocurre en un límite de sección definido por el reloj común.
- El reloj publica cada pulso con su `audioTime` objetivo, compás, corchea, acento y sección. La música se programa contra el mismo origen; gameplay y enemigos consumen esos eventos/tiempos y no implementan relojes propios.
- `C` activa la habilidad superior cuando está disponible; no se dispara automáticamente al llenar la barra.
- La habilidad superior cambia con la sección actual de la cueca (por ejemplo, Escobillado o Zapateo) y usa la variante correspondiente a esa sección al momento de activarla.
- Cambiar de sección no vacía ni reinicia la carga acumulada.
- La activación consume la carga disponible; después vuelve a acumularse mediante daño a enemigos y destrucción del entorno.

## Alcance inicial y controles

- Un único arquetipo/pista jugable: cueca tradicional.
- `WASD`: movimiento.
- `Space`: ataque básico e input de ritmo.
- `C`: habilidad superior manual.

## Guía visual y reglas de integración

- El HUD muestra un compás minimalista de seis corcheas sincronizado con la melodía; marca los pulsos fuertes `0` y `3`, resalta los tres slots válidos y comunica el resultado del input (`PERFECT`, `GOOD` o `MISS`). Dev 4 es responsable de la presentación; Dev 1 publica el estado del reloj y el juicio para que el HUD no implemente un reloj paralelo.
- El jugador inicia con `100 HP` y `10 ATK` en nivel 1. El daño base crece según nivel y mejoras; enemigos y elementos destruibles escalan con el nivel del jugador. La run termina cuando los HP del jugador llegan a `0` o menos.
- Enemigos y elementos del escenario tienen HP. Destruirlos entrega XP y carga para la habilidad superior, una sola vez por objetivo destruido. Los contratos de eventos y los valores de escalado/recompensa deben acordarse en `src/core/` con los roles propietarios.
- El tamaño inicial del jugador y su crecimiento por nivel pertenecen al rol encargado de escala; la cantidad y progresión de hordas al rol encargado de combate. Dev 1 consume esos datos y no define sus curvas.

## Pendiente antes de integrar

- Pista seleccionada: `assets/audio/music/La Pena que Me Quema - 43s.mp3`, `85 BPM`; se reproduce una vez y al terminar detiene el reloj. No se hace loop porque su duración (42,984 s) no es un múltiplo de las secciones de 5,647 s.
- Los slots `[0, 2, 4]`, multiplicadores PERFECT `2x` / GOOD `1.45x` / MISS `0.2x` y carga `8%` por daño, `12%` por baja y `18%` por prop destruido quedan provisionales para el primer balance.
- Integrar el reloj y `RhythmEventBridge` en el host de partida Three.js, conservándolo como dueño único del tiempo musical.
- Validar con Dev 3 los slots de ataque y conectar `OnWeakStepAttack` para que los MISS causen daño reducido; el contrato ya está declarado, pero combate aún debe consumirlo.
- Conectar `RhythmEventBridge` al host de partida pasando el paso de cueca actual, la posición del jugador y el handler de habilidad superior; `src/main.ts` sigue siendo el montaje 3D de ejemplo.
- Conectar con Dev 2 la carga de habilidad por daño/destrucción de elementos del escenario y acordar la semántica global de pausa/reinicio.
- Balancear los multiplicadores y carga provisionales contra el combate real; los valores iniciales viven en `GameConfigs.json`.
