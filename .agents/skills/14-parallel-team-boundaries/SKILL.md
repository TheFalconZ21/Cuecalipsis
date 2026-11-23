---
name: parallel-team-boundaries
description: >-
  Protege el trabajo simultáneo de los 4 desarrolladores restringiendo la edición de archivos exclusivamente a la carpeta del rol activo.
---
# Fronteras de Desarrollo en Paralelo (Zero-Conflict)
## Reglas de Aislamiento de Directorios
1. **Zonas Exclusivas de Escritura:**
   - **Dev 1:** Solo puede crear/editar en `src/modules/rhythm-player/` y
`assets/audio/`.
   - **Dev 2:** Solo puede crear/editar en `src/modules/scale-world/`.
   - **Dev 3:** Solo puede crear/editar en `src/modules/combat-hordes/`.
   - **Dev 4:** Solo puede crear/editar en `src/modules/art-vfx-ui/`,
`assets/models/`, `assets/shaders/` y `assets/ui/`.
2. **Prohibición de Cruce:** Jamás edites un archivo dentro de la carpeta de otro
desarrollador. Si necesitas un dato o disparar un comportamiento externo, usa
exclusivamente `src/core/EventBus`.
3. **Protección de `src/core/`:** Los contratos en `core/` son compartidos; solo
pueden añadirse nuevos eventos o campos de forma aditiva (retrocompatible) sin
romper firmas existentes.
