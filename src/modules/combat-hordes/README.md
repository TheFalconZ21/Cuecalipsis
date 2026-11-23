# Dev 3 — Combat, Hordes, Bosses & Upgrades

Propiedad de pools, enemigos/proyectiles, patrones de combate, jefes y mejoras. Consume ritmo y escala desde contratos compartidos; emite resultados de combate y progresión por `src/core/`.

Lee `DECISIONS.md` y coordina con Dev 2 la relación entre las cinco hordas y los Tiers antes de fijar spawners o progresión.

## Vista jugable de la horda 1

Con `npm run dev`, abre `/src/modules/combat-hordes/preview.html`. El prototipo incluye al huaso, fuerzas públicas con fusiles y avisos de disparo, proyectiles esquivables y ataques de zapateo. Controles: WASD/flechas para moverse, Espacio para atacar y Shift para esquivar. Reiniciar vuelve a la primera oleada.

El balance temporal está agrupado en `HordeDirector.ts` (`HORDE_BALANCE`): la primera oleada trae tres enemigos, cada nueva oleada añade uno hasta nueve y nunca hay más de cuatro enemigos activos. La pausa entre oleadas, velocidad, salud, daño y cadencia se editan allí. Son valores iniciales para probar, no balance aprobado.

La cadencia de disparos usa temporizador porque aún no hay música ni reloj de ritmo. Para conectarla después, cambia `rhythm.source` de `timer` a `strong-beat`; el prototipo ya escucha `OnBeat` del bus compartido y permite elegir la subdivisión fuerte. El telegráfico permanece antes del disparo y `minimumSecondsBetweenShots` limita ráfagas simultáneas.
