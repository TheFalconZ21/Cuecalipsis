---
name: clipping-free-animation
description: >-
  Impone restricciones matemáticas en animaciones procedurales y de esqueleto para impedir clipping con el suelo (Y >= 0) y auto-interpenetración del modelo.
---
# Animación Procedural Libre de Clipping
## 1. Cero Clipping con el Suelo (Ground Clamping `Y >= 0`)
- **Restricción absoluta de altura:** Ningún nodo ni vértice del modelo (`Leg_L`,
`Leg_R`, `Poncho`, `Chupalla`) puede descender por debajo de `localPosition.y =
0.0` respecto al pivote raíz en ningún fotograma.
- **Zapateo y Rebote Rectificado:** Deriva todo movimiento vertical de funciones
rectificadas sincronizadas con `beatProgress`: `footY = Math.max(0.0,
Math.sin(phase) * stepAmplitude)`.
- **Squash & Stretch Seguro:** Cualquier compresión elástica vertical debe escalar
desde el pivote en el piso `(0, 0, 0)` sin empujar las botas bajo el plano `Y = 0`.
Prohibido usar *Root Motion* que desplace el nodo físico del jugador.
## 2. Cero Auto-Clipping (Prevención de Interpenetración)
- **Separación de volúmenes:** Mantener un margen mínimo de `0.05` unidades entre
extremidades y torso en reposo.
- **Límites angulares (Clamping):**
  - **Pañuelo y Brazo Derecho:** La trayectoria en figura de ocho del pañuelo debe
orbitar siempre fuera del cilindro de la chupalla y del torso (`orbitRadius >
chupallaRadius + 0.15`).
  - **Piernas (Escobillado):** Limitar el movimiento lateral para que `Leg_L` y
`Leg_R` jamás crucen el eje central `X = 0`.
  - **Cabeza / Chupalla:** Limitar inclinación máxima (*pitch/roll*) a `±15°` para
que el ala ancha de la chupalla nunca corte los hombros.
