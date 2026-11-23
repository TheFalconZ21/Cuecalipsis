---
name: katamari-scaling
description: >-
  Gestiona el crecimiento del jugador alimentado por destrucción de enemigos y entorno (Apocalipsis), bloqueando el salto de Tier mediante Jefes Guardianes (Boss Gatekeepers) y controlando la cámara dinámica top-down.
---
# Sistema de Escala por Destrucción y Candados de Jefe
## Reglas Técnicas Obligatorias
1. **Crecimiento por Destrucción (Medidor de Apocalipsis):**
   - El nivel y tamaño del jugador aumentan exclusivamente al derrotar enemigos y
destruir estructuras del entorno (`OnEnemyDestroyed`, `OnPropTrampled`), nunca por
pulsar al ritmo en vacío.
   - Dentro de cada Tier, el jugador crece suavemente entre `1.0x` y `4.5x` según
su `currentApocalypse`.
2. **Candado de Escala por Jefe (`isScaleCapped = true`):**
   - Cada Tier (1: Pueblo/Ciudad, 2: Metrópoli/Rascacielos, 3: Continental, 4:
Planetario/Cósmico) tiene un tope de crecimiento (`maxTierApocalypse`) en
`GameConfigs.json`.
   - Al alcanzar el 100% del Tier actual, **se congela el crecimiento
(`isScaleCapped = true`)** y se emite `OnBossGateTriggered(currentTier)` para
invocar al Jefe Guardián de esa escala.
   - El jugador no puede seguir creciendo ni avanzar de Tier hasta recibir
`OnBossDefeated(currentTier)`, momento en que se rompe el candado, se re-normaliza
el contenedor de mundo a `1.0x` y se emite `OnScaleTierChanged(newTier)`.
3. **Destrucción por Contacto (Trampling sin Física Bloqueante):**
   - Usa detección radial en el plano XZ o triggers ligeros (prohibido usar
`RigidBody` pesados en cientos de edificios).
   - Todo prop o enemigo menor con `requiredScaleToCrush <= currentTotalScale` se
destruye al contacto sin frenar al huaso, sumando Apocalipsis y emitiendo
`OnPropTrampled(position, tier)`.
4. **Cámara Elástica y Anti-Oclusión:**
   - Mantén inclinación top-down fija (`60°–75°`) e interpola la distancia con
`SmoothDamp` / `Lerp` exponencial para que el huaso ocupe siempre entre el `12%` y
`18%` del alto de pantalla.
   - Reduce inmediatamente la altura u opacidad de cualquier edificio alto que se
interponga en el cono entre la cámara y el jugador.
