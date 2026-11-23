---
name: git-hackathon-workflow
description: >-
  Estandariza commits atómicos por rol, manejo de las 4 ramas de desarrollo y verificación previa antes de integrar a main.
---
# Flujo Git y Estabilidad de Integración
## Reglas Operativas
1. **Ramas por Desarrollador:** Cada rol trabaja en su rama asignada
(`dev1/rhythm`, `dev2/scale`, `dev3/combat`, `dev4/art-vfx`). La rama `main` debe
mantenerse siempre compilable y jugable.
2. **Commits Atómicos y Semánticos:** Usa prefijos claros indicando módulo:
`feat(rhythm):`, `feat(scale):`, `feat(combat):`, `feat(art-ui):`, `fix(core):`.
3. **Orden de Integración al Cierre de Sprint:** Al fusionar en `main`, respetar la
secuencia `core` -> `Dev 1` -> `Dev 2` -> `Dev 3` -> `Dev 4` y verificar que no
existan conflictos ni archivos modificados fuera de la zona de propiedad.

3. Bloque de Control 3D, Animación y VFX (Skills 09 a 11)
