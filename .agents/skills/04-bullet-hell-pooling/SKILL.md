---
name: bullet-hell-pooling
description: >-
  Optimiza el spawning de las 5 oleadas de Cuecatástrofe, los Jefes Guardianes de Escala y patrones de proyectiles bullet-hell sincronizados al 6/8 usando Object Pooling estricto.
---
# Bullet Hell, Hordas y Jefes Guardianes (Zero-Allocation)
## Reglas de Rendimiento y Justicia Jugable
1. **Object Pooling Pre-Calentado:** Pre-aloca al inicio de la escena pools fijos
para `600` proyectiles enemigos, `200` proyectiles del jugador, `150` enemigos y
`100` orbes de Apocalipsis/XP. Prohibido instanciar o destruir objetos en tiempo de
ejecución.
2. **Colisión Matemática 2D (Plano XZ) y Hitbox Justa:**
   - No uses colisionadores físicos 3D (`SphereCollider` + `RigidBody`) para balas
individuales; actualiza posiciones en un arreglo plano y verifica impacto por
distancia al cuadrado en XZ.
   - El radio de colisión real de cada proyectil enemigo debe ser **30% menor** que
su representación visual, e incluir `0.8s` de invulnerabilidad (*i-frames*) en el
jugador tras recibir daño.
3. **Progresión de Hordas por Nivel de Cuecatástrofe (Ajustando `spawnRadius` al
Tier):**
   - `Nivel 1`: Carabineros y patrullas de a pie (disparos lineales lentos).
   - `Nivel 2`: GOPE, blindados ligeros y helicópteros (abanicos de 3–5 balas y
zonas telegrafiadas).
   - `Nivel 3`: Infantería del ejército y tanques Leopard (obuses explosivos en
pulsos 1 y 4).
   - `Nivel 4`: Drones autónomos de alta velocidad, cazas y misiles crucero en
cortina.
   - `Nivel 5`: Querubines cuequeros, arcángeles con acordeones de luz y deidades
celestiales.
   - *Regla de escala:* Al desbloquear un nuevo Tier tras vencer al Jefe, los
enemigos de niveles inferiores pasan a ser aplastables por contacto (*fodder*).
4. **Jefes como Delimitadores de Escala (Scale Gatekeepers):**
   - Escucha `OnBossGateTriggered(tierIndex)` para invocar al Jefe Guardián que
bloquea el paso al siguiente tamaño. Al ser derrotado, emite obligatoriamente
`OnBossDefeated(tierIndex)` para liberar el crecimiento del jugador:
   - **Jefe Ciudad (El Guatón Loyola):** Embestidas rectas telegrafiadas (`1.0s`
antes) y ondas de impacto en el pulso 1.
   - **Jefe Continente (La Consentida):** Anillos rotatorios de proyectiles que
exigen usar la *Media Luna* y sus habilidades superiores.
   - **Jefe Planeta/Cosmos (Fabi, el Dios de la Cueca):** Patrones en las 6
corcheas que exigen dominar la rotación completa de los 4 pasos.
