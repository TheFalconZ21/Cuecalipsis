# Dev 3 — Combat, Hordes, Bosses & Upgrades

Propiedad de pools, enemigos/proyectiles, patrones de combate, jefes y mejoras. Consume ritmo y escala desde contratos compartidos; emite resultados de combate y progresión por `src/core/`.

Lee `DECISIONS.md` y coordina con Dev 2 la relación entre las cinco hordas y los Tiers antes de fijar spawners o progresión.

## Vista jugable de la horda 1

Con `npm run dev`, abre `/src/modules/combat-hordes/preview.html`. Controles: WASD/flechas para moverse, Espacio para Zapateo radial, E para Escobillado hacia donde mira el huaso, Q para completar una Vuelta circular protegida y Shift para esquivar. El huaso sostiene el pañuelo sobre la cabeza y lo hace girar en una figura de ocho. Reiniciar vuelve a la primera oleada y descarta la experiencia y las mejoras.

Cada enemigo derrotado entrega experiencia. Al subir de nivel se pausa la simulación y se muestran tres cartas: Zapateo sísmico, Escobillado envolvente y Vuelta protectora. Las dos primeras incrementan daño y alcance/área de su paso; la tercera alarga el escudo durante el recorrido circular. Cada ataque básico exitoso también carga la barra de habilidad; al llenarla se ejecuta automáticamente un ataque superior radial o frontal según el último paso.

Las teclas de ataque son un adaptador de prueba de la preview y publican `OnBasicStepAttack` con juicio `GOOD`. El daño, la carga y el ataque superior ya consumen los contratos compartidos, para conectarse al evaluador de Dev 1. La sincronización real de ataques aún espera el `RhythmClock` y la decisión de BPM de Dev 1; este prototipo no inventa una subdivisión ni usa `deltaTime` como reloj musical.

El balance temporal está agrupado en `HordeDirector.ts` (`HORDE_BALANCE`): la primera oleada trae tres enemigos, cada nueva oleada añade uno hasta nueve y nunca hay más de cuatro enemigos activos. La pausa entre oleadas, velocidad, salud, daño y cadencia se editan allí. Son valores iniciales para probar, no balance aprobado.

La cadencia de disparos usa temporizador porque aún no hay música ni reloj de ritmo. Para conectarla después, cambia `rhythm.source` de `timer` a `strong-beat`; el prototipo ya escucha `OnBeat` del bus compartido y permite elegir la subdivisión fuerte. El telegráfico permanece antes del disparo y `minimumSecondsBetweenShots` limita ráfagas simultáneas.
