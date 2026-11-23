---
name: single-source-of-truth
description: >-
  Obliga a localizar y reutilizar las fuentes únicas de verdad del proyecto antes de escribir, modificar o extender cualquier mecánica.
---
# Control de Fuente Única de Verdad (DRY)
## Protocolo de Inspección Previa Obligatoria
1. **Búsqueda Antes de Escritura:** Antes de crear una clase, función, estado o
variable, inspecciona `src/core/` y el módulo correspondiente para verificar si esa
responsabilidad ya existe.
2. **Un Solo Dueño por Mecánica:**
   - Nunca crees temporizadores paralelos fuera de `RhythmClock`.
   - Nunca almacenes copias desincronizadas de la escala o del Tier fuera de
`ScaleManager`.
   - Nunca crees pools secundarios fuera de `CombatPoolManager`.
3. **Limpieza Inmediata:** Al refactorizar o actualizar una función existente,
actualiza sus referencias y elimina el código muerto en el mismo paso para no dejar
rutas duplicadas.
