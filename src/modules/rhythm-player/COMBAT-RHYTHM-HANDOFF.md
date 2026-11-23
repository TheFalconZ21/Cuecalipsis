# Handoff Dev 1 → Dev 3: inputs rítmicos

Los contratos compartidos ahora distinguen estos resultados:

- `OnBasicStepAttack`: acierto `GOOD` o `PERFECT`, incluye `damageMultiplier`; combate debe aplicar ese valor al daño base.
- `OnWeakStepAttack`: fallo `MISS`, incluye posición, paso, offset y multiplicador provisional `0.2`.
- `OnSkillChargeChanged`: la barra rítmica escucha el daño efectivo, baja de enemigo y destrucción de props; la UI debe leer el total de este evento.
- `OnBeatScheduled`: permite preparar telegráficos en `targetAudioTimeSeconds`.
- `OnBeat`: pulso ocurrido, incluye subdivisión, compás, sección, BPM y hora DSP.
- `OnSectionScheduled` y `OnSectionChanged`: transición futura y transición ocurrida usando el mismo `AudioContext.currentTime`.

`HordeLevelOne` actualmente escucha `OnBasicStepAttack` y `OnSuperiorStepUnleashed`, pero aún no escucha `OnWeakStepAttack` ni usa `damageMultiplier`. Para cumplir el consenso, Dev 3 debe conectar ambos eventos al mismo resolver de ataque básico y aplicar el multiplicador al daño base. No conviertas el fallo en `GOOD`: HUD/combo deben conservar el juicio `MISS`.

Los valores de ataque `[0, 2, 4]` y el `0.2x` están marcados provisionales en `GameConfigs.json`; se pueden balancear sin cambiar el contrato.
