# Cuecalipsis

## Estado del proyecto

Este repositorio está en fase de preparación. Los PDF de la raíz son documentos de contexto, no código fuente ni contratos implementados. Antes de programar una mecánica, inspecciona `src/core/` y su módulo para comprobar qué existe realmente.

## Arquitectura acordada

- Juego 3D de acción roguelike y ritmo, con cámara cenital/isométrica y compás de cueca 6/8.
- Cuatro módulos independientes bajo `src/modules/`; cada desarrollador es dueño de su módulo.
- La comunicación entre módulos se realiza mediante contratos/eventos compartidos de `src/core/`, no mediante imports internos entre módulos.
- Parámetros de balance centralizados en `src/core/GameConfigs.json` cuando se implemente.
- Priorizar una versión jugable pequeña y fallbacks procedurales antes de contenido o dependencias complejas.

## Propiedad de archivos

| Rol | Carpeta exclusiva de trabajo | Rama sugerida |
|---|---|---|
| Dev 1 — Rhythm & Player | `src/modules/rhythm-player/`, `assets/audio/` | `dev1/rhythm` |
| Dev 2 — Scale & World | `src/modules/scale-world/` | `dev2/scale` |
| Dev 3 — Combat & Hordes | `src/modules/combat-hordes/` | `dev3/combat` |
| Dev 4 — Art, VFX & UI | `src/modules/art-vfx-ui/`, `assets/models/`, `assets/shaders/`, `assets/ui/` | `dev4/art-vfx` |

No editar archivos de otro rol. `src/core/` y la raíz son compartidos: cambiar contratos o configuración requiere coordinación entre roles; mantener los cambios aditivos y retrocompatibles. Los merges de integración deben seguir `core → Dev 1 → Dev 2 → Dev 3 → Dev 4`.

## Acuerdos pendientes

Las decisiones abiertas están anotadas en el módulo que las debe resolver:

- Dev 1: duración de la corchea y significado del BPM, en `src/modules/rhythm-player/DECISIONS.md`.
- Dev 2: cantidad/alcance de Tiers y candados de jefes, en `src/modules/scale-world/DECISIONS.md`.
- Dev 3: cinco niveles de hordas y su relación con los Tiers, en `src/modules/combat-hordes/DECISIONS.md`.

No inferir una decisión definitiva de las recomendaciones que aparecen en los PDF. Una vez acordada, registrar el resultado en `src/core/GameConfigs.json` y actualizar esta documentación si cambia la arquitectura.

## Reglas de implementación

- Un solo dueño por mecánica: `RhythmClock` (Dev 1), `ScaleManager`/estado macro (Dev 2), pools y hordas (Dev 3), representación visual (Dev 4).
- Evitar medir ritmo con `deltaTime`; el dueño del reloj debe escoger y documentar la interpretación del BPM antes de implementar la duración de corchea.
- Mantener datos de balance fuera de la lógica y reutilizar contratos/configuración compartidos.
- Los módulos de arte son reactivos: no deciden daño ni progresión de estado.
- Para esta etapa, documentar discrepancias y contratos propuestos; no crear implementaciones ficticias en `src/core/`.

## Contexto de referencia

Los PDF originales (`general.pdf`, `dev1.pdf`…`dev4.pdf`, `skills.pdf`) quedan en la raíz como material de consulta. `src/core/README.md` describe cómo convertir sus acuerdos en contratos implementados.
