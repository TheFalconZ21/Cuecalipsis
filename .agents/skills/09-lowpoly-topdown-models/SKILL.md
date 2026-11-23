---
name: lowpoly-topdown-models
description: >-
  Controla la generación e implementación de modelos 3D con bajo conteo de polígonos, pivote en el suelo (0,0,0) y silueta reconocible en cámara top-down.
---
# Control de Modelos Low-Poly para Vista Top-Down
## 1. Presupuesto Estricto de Polígonos (Eficiencia)
- **Proyectiles, orbes y props pequeños:** `12` a `80` triángulos máximo.
- **Enemigos comunes (Niveles 1 a 5):** `150` a `600` triángulos máximo.
- **Vehículos y edificios (Tanques Leopard, Helicópteros, Rascacielos):** `400` a
`1,200` triángulos máximo.
- **Huaso protagonista y los 3 Jefes:** `1,500` a `3,500` triángulos máximo.
- **Prohibiciones:** Prohibido usar *Subdivision Surface*, biseles densos o
múltiples materiales por malla. Usar *Flat Shading* y un único Atlas de Paleta
compartido para habilitar *GPU Instancing*.
## 2. Legibilidad en Cámara Cenital / Isométrica (60°–75°)
- **Exageración de silueta superior:** Escalar un `1.3x–1.4x` los elementos clave
vistos desde arriba: el ala circular de la chupalla, la manta sobre los hombros y
el pañuelo en el huaso; torreta y cañón en tanques; rotores en helicópteros; alas y
acordeones luminosos en arcángeles.
- **Contraste figura-fondo:** Mantener suelos en tonos medios/desaturados y asignar
colores de alto contraste en la mitad superior de los personajes y proyectiles.
## 3. Pivote y Jerarquía Articulada
- **Origen en la base `(0, 0, 0)`:** Todo personaje, edificio o prop terrestre debe
tener su pivote exactamente en la planta de los pies / base inferior, con escala
aplicada `(1, 1, 1)` y rotación `(0, 0, 0)`.
- **Nodos separados para código:** Estructurar personajes con nodos hijos limpios
(`Root`, `Torso`, `Head_Chupalla`, `Arm_R_Panuelo`, `Leg_L`, `Leg_R`).
