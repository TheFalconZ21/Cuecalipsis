---
name: role-task-router
description: >-
  Configura automáticamente las skills activas, permisos de carpetas y contratos del EventBus según cuál de los 4 desarrolladores solicita la tarea.
---
# Enrutador de Roles del Equipo
## Mapa de Contexto por Rol
Identifica el rol indicado por el usuario al inicio del prompt y aplica su perfil:
- **Perfil Dev 1 (`rhythm-player`):** Activa skills `01`, `03`, `06`, `17`. Emite
`OnBeat`, `OnInputEvaluated`, `OnBasicStepAttack`, `OnSuperiorStepUnleashed`.
Escucha `OnGamePauseChanged`, `OnGameReset`.
- **Perfil Dev 2 (`scale-world`):** Activa skills `02`, `05`, `06`, `17`. Emite
`OnApocalypseGained`, `OnBossGateTriggered`, `OnScaleTierChanged`,
`OnPropTrampled`, `OnGameStateChanged`. Escucha `OnEnemyDestroyed`,
`OnBossDefeated`.
- **Perfil Dev 3 (`combat-hordes`):** Activa skills `04`, `06`, `16`. Emite
`OnEnemyDamaged`, `OnEnemyDestroyed`, `OnPlayerHit`, `OnAttackTelegraph`,
`OnBossSpawned`, `OnBossDefeated`, `OnLevelUpReady`. Escucha `OnBeat`,
`OnBasicStepAttack`, `OnSuperiorStepUnleashed`, `OnBossGateTriggered`,
`OnScaleTierChanged`.
- **Perfil Dev 4 (`art-vfx-ui`):** Activa skills `07`, `09`, `10`, `11`. 100%
reactivo al `EventBus`; actualiza mallas, animaciones procedurales, shaders y
vistas UI (con `pointer-events: none` / `Mouse Filter = Ignore` en elementos
decorativos del HUD).
5. Bloque de Progresión Roguelike, Flujo Macro y Demo (Skills 16 y 17)
