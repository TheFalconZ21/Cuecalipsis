# Handoff Dev 3: mejoras elegibles al subir de nivel

Solicitado por el equipo como catálogo inicial de mejoras. Este documento define comportamiento esperado; no fija números de balance que aún no se hayan acordado.

## Flujo de progresión

- Cuando el jugador alcanza un nivel nuevo, preparar tres cartas distintas entre las mejoras elegibles y emitir la solicitud para mostrar la selección (`OnLevelUpReady`, evento propuesto; `src/core/EventBus` aún no existe).
- Pausar la simulación de combate mientras la selección está abierta. Al confirmar una carta, validarla y concederla una sola vez.
- Reanudar la simulación en el siguiente pulso fuerte (corchea 0 o 3) del reloj compartido. No avanzar el audio ni crear un reloj por carta; la pausa/reanudo debe respetar el contrato global cuando se defina.
- Las ocho mejoras del catálogo son candidatas para el sorteo. Resolver qué hacer si ya fueron obtenidas, no son elegibles o no quedan tres opciones.
- Leer balance desde `GameConfigs.json` cuando exista. Duraciones, daños, probabilidades, cooldowns y límites no deben quedar hardcodeados en la presentación de Dev 4.

## Catálogo inicial

### La señora interesante

**Disparador:** activación de la habilidad superior (`OnSuperiorStepUnleashed`).

**Efecto:** aparece una señora interesante que distrae a los enemigos y altera temporalmente su prioridad de objetivo.

**Balance por definir:** duración, radio, reglas de retarget, número de señoras simultáneas y resistencia de jefes.

### Baila sin cesar

**Disparador:** el jugador causa daño a un enemigo (`OnEnemyDamaged`).

**Efecto:** ese enemigo entra en estado de baile durante `0.5 s`.

**Balance por definir:** si los golpes renuevan la duración, interacción con ataques enemigos en progreso y resistencia de jefes. El estado de daño/combate pertenece a Dev 3; animación y feedback a Dev 4.

### Rin Rin Raja

**Disparador:** un ataque del jugador causa daño desde la espalda del enemigo.

**Efecto:** concede velocidad de movimiento e invulnerabilidad temporales.

**Balance por definir:** arco que cuenta como espalda, magnitud y duración de ambos buffs y cooldown. Resolver primero el daño del golpe activador y después otorgar invulnerabilidad.

### Tangananica-Tanganana

**Efecto:** la mejora elige una orientación activa, derecha o izquierda. Atacar hacia esa orientación aumenta el daño. En cada cambio de compás tiene un `50 %` de probabilidad de cambiar a la orientación opuesta.

**Sincronía:** medir el cambio usando `barIndex`/límite de compás del `RhythmClock` compartido; no usar temporizadores locales.

**Balance/interpretación por definir:** bonus de daño y si “derecha/izquierda” se mide respecto de la orientación del jugador, el vector hacia el objetivo o el input de movimiento. Elegir la orientación inicial al adquirir la carta.

### Dinosaurio Anacleto

**Disparador propuesto:** usar la habilidad superior mientras la sección actual es `Remate`.

**Efecto:** cae un meteorito y causa daño masivo en un área.

**Confirmar:** si “efectuar el Remate” significa activar la habilidad superior en esa sección o usar otro ataque de Remate. La sección dura ocho pulsos de negra con puntillo (cuatro compases de 6/8), según el reloj acordado.

**Balance por definir:** daño, radio, punto de impacto, telemetría y reglas de impacto a jefes.

### Guacala

**Disparador:** cooldown periódico mientras la mejora esté activa.

**Efecto:** lanza o genera una comida aleatoria entre completo, sopaipilla y empanada. Reutilizar los efectos de comida existentes.

**Balance por definir:** intervalo, tipo de generación/lanzamiento, posición y recogida, distribución de tipos y límite de comida en el escenario. Medir el cooldown en tiempo de juego o pulsos del reloj compartido para respetar pausa y sincronía.

### Mi muñeca me habló

**Efecto:** invoca una muñeca aliada que orbita alrededor del jugador y replica sus ataques.

**Balance por definir:** radio/velocidad orbital, qué ataques replica, retraso, selección de objetivo, daño de la réplica y límite de muñecas.

### Arwrarwrirwrarwro

**Efecto:** invoca zombies aliados de poca vida que ayudan en combate y pueden infectar enemigos con una probabilidad configurable.

**Balance por definir:** cantidad, vida, duración, daño, probabilidad de infección, efecto y duración de infección, propagación y límite de invocaciones.

## Dependencias de otros módulos

- **Dev 1:** el `RhythmClock` compartido informa compás, sección y tiempos absolutos. Las mejoras rítmicas consumen esa fuente única.
- **Dev 2:** colaborar cuando el efecto interactúe con props, escala o estado del escenario.
- **Dev 4:** representar cartas/selección, distracción, baile, meteorito, muñeca y zombies. No decidir daño ni conceder mejoras.
- Los eventos anteriores son nombres descriptivos/propuestos hasta que se acuerde su payload en `src/core/`.

