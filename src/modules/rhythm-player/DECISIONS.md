# Decisiones acordadas — Dev 1

Estas decisiones reemplazan las recomendaciones anteriores que aparezcan en los manuales y skills del proyecto para ritmo, carga de habilidad y controles.

## Reloj y métrica

- Duración de cada corchea: `60 / BPM / 3` segundos.
- En esta convención, el BPM de cada pista se expresa en negras con puntillo: tres corcheas por pulso.
- Cada compás tiene seis corcheas, índices `0–5`; los pulsos fuertes son `0` y `3`.
- Al inicio se integra una sola pista: cueca tradicional, a `85 BPM` en negras con puntillo (`127.5 BPM` contando negras).
- Con esa configuración, cada corchea dura `60 / 85 / 3 ≈ 0.2353 s`; los pulsos fuertes `0` y `3` quedan separados por tres corcheas.
- El análisis de `La Rosa con el Clavel.mp3` estimó `83–85 BPM` en negras con puntillo; se fija `85 BPM` como valor inicial. El reloj lee el valor desde configuración, no lo hardcodea.

## Ataque básico y carga

- `Space` ejecuta el ataque básico de la sección coreográfica actual.
- Atinar al pulso otorga daño bonus. `PERFECT` (`±45 ms`) hace crítico; `GOOD` (`>45 ms` y `≤95 ms`) da bonus sin crítico; `MISS` (`>95 ms`) no otorga bonus rítmico. Se conservan inicialmente esas ventanas, salvo que el balance del track requiera ajuste.
- La carga de la habilidad superior aumenta al dañar enemigos y destruir el escenario. No aumenta por acertar inputs sin causar ese daño/destrucción. Los valores por daño y por prop se balancean en `GameConfigs.json`.

## Habilidad superior y secciones

- `C` activa la habilidad superior cuando está disponible; no se dispara automáticamente al llenar la barra.
- La habilidad superior cambia con la sección actual de la cueca (por ejemplo, Escobillado o Zapateo) y usa la variante correspondiente a esa sección al momento de activarla.
- Cambiar de sección no vacía ni reinicia la carga acumulada.
- La activación consume la carga disponible; después vuelve a acumularse mediante daño a enemigos y destrucción del entorno.

## Alcance inicial y controles

- Un único arquetipo/pista jugable: cueca tradicional.
- `WASD`: movimiento.
- `Space`: ataque básico e input de ritmo.
- `C`: habilidad superior manual.

## Pendiente antes de integrar

- Confirmar el punto de loop de la pista tradicional definitiva y validar que el track mantenga los `85 BPM` acordados.
- Acordar con Dev 3 cómo `OnEnemyDamaged`/`OnEnemyDestroyed` y con Dev 2 cómo `OnPropTrampled` alimentan la carga, mediante contratos de `src/core/`.
- Definir valores de carga por daño/destrucción y escalado de crítico/bonus en la configuración compartida.
