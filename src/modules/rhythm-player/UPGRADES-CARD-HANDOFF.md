# Handoff: cartas de mejora de nivel

Propuesta registrada por Dev 1 para implementación de progresión por Dev 3 y presentación por Dev 4. No implementa lógica de combate dentro del módulo de ritmo.

## Flujo de selección

- Al subir de nivel, pausar la simulación de combate y presentar tres cartas distintas elegidas al azar del catálogo disponible.
- Al seleccionar una carta, concederla una sola vez y reanudar la simulación en el siguiente pulso fuerte del `RhythmClock` (`subdivisionIndex` 0 o 3). El reloj musical conserva su línea temporal durante la selección; cada módulo debe seguir la regla de pausa que se acuerde en `src/core/`.
- La UI muestra nombre y descripción breve. Dev 4 presenta la selección; Dev 3 decide elegibilidad, selección aleatoria, adquisición, acumulación y efectos.
- Usar `GameConfigs.json` para valores de balance cuando exista. No fijar duraciones, daño, velocidades, probabilidades o cooldowns desde la UI.

## Catálogo propuesto

### La señora interesante

Al activar la habilidad superior, aparece una señora interesante que distrae a los enemigos. Dev 3 define duración, radio, prioridad de objetivo y respuesta de jefes; Dev 4 representa la distracción.

### Baila sin cesar

Cuando el jugador hace daño a un enemigo, este baila durante `0.5 s`. El baile es un estado de control visual/combate; definir si los golpes sucesivos reinician esos `0.5 s` y si jefes resisten el efecto.

### Rin Rin Raja

Hacer daño por la espalda otorga velocidad de movimiento e invulnerabilidad temporales. Definir el arco que cuenta como espalda, magnitud/duración de ambos efectos y si existe cooldown. El golpe que activa la mejora debe resolverse antes de conceder invulnerabilidad.

### Tangananica-Tanganana

La mejora mantiene una orientación activa: derecha o izquierda. Atacar hacia ese lado otorga daño extra. Entre compases de 6/8 hay un `50 %` de probabilidad de cambiar la orientación al lado opuesto. Definir si el lado se mide respecto a la orientación del jugador o al input de movimiento, y el bonus de daño. Usar `barIndex`/límite de compás del reloj para el cambio; no crear un temporizador.

### Dinosaurio Anacleto

Al efectuar el Remate cae un meteorito que causa daño masivo. Propuesta de disparador compatible con las secciones acordadas: activar la habilidad superior mientras la sección actual sea `Remate`. Confirmar con Dev 3 si esa es la intención o si debe dispararse por otro ataque de Remate. Definir radio, daño y objetivos afectados.

### Guacala

Cada cierto tiempo, la mejora lanza una comida aleatoria: completo, sopaipilla o empanada. Reutilizar sus efectos existentes; definir intervalo, trayectoria/posición de aparición, recogida y probabilidad de cada tipo.

### Mi muñeca me habló

Una muñeca acompaña al jugador, se mueve a su alrededor y replica sus ataques. Definir radio/velocidad orbital, selección de objetivo, retraso o cadencia de réplica y daño de la copia.

### Arwrarwrirwrarwro

Invoca zombies aliados de poca vida que ayudan en combate y tienen una probabilidad de infectar enemigos. Definir cantidad, vida, duración, daño, probabilidad y efecto/duración de infección; decidir si la infección se puede acumular o propagar.

## Integración entre módulos

- Dev 1 proporciona la instancia única del `RhythmClock`, sus límites de compás/sección y evaluación de input. Una mejora que se sincronice con música consume esos datos/eventos; no implementa su propio BPM.
- Dev 3 implementa las reglas de nivel, cartas elegibles, efectos y contratos de combate/progresión.
- Dev 4 muestra las cartas y feedback reactivo a eventos, sin aplicar daño ni conceder mejoras por cuenta propia.
- Los nombres de eventos para mostrar la selección, confirmar la carta, pausar y reanudar deben acordarse al definir `src/core/EventBus`; aún no existe ese EventBus.

## Decisiones de balance pendientes de Dev 3

1. Si las cartas tienen niveles, acumulación, evolución o son únicas por run.
2. Valores y duración de cada efecto, cooldowns y límites de invocaciones.
3. Reglas para jefes, inmunidades, renovación de efectos y compatibilidad entre mejoras.
4. Si las tres cartas se sortean sin repetición dentro de la selección y qué pasa cuando no quedan mejoras elegibles.

