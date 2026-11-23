---
name: hackathon-mvp-guard
description: >-
  Reglas de priorización para hackatón: evita sobre-ingeniería, exige fallbacks procedurales inmediatos y protege el bucle jugable de principio a fin.
---
# Guardarraíl de Hackatón (MVP First)
## Directrices de Ejecución
1. **Fallbacks Procedurales sin Bloqueos:** Si un modelo `.glb`, textura o pista
`.ogg` aún no está en la carpeta `assets/`, genera inmediatamente un constructo
procedural (primitivas compuestas con pivote en `0,0,0` o pitch-shift de la pista
base) para que el código sea 100% funcional y probable al instante.
2. **Prioridad de Vertical Slice:** Asegura siempre en este orden estricto:
   1. Reloj 6/8 + movimiento + evaluación de input.
   2. Crecimiento de escala Tier 1->4 + cámara dinámica.
   3. Pool de balas + oleadas + 4 pasos de cueca.
   4. Jefes, mejoras Roguelike y pantallas de flujo completo.
3. **Cero Dependencias Frágiles:** No introduzcas librerías externas innecesarias,
bases de datos remotas ni configuraciones que requieran pasos manuales complejos
para compilar.
2. Bloque de Ingeniería, Datos y Flujo Git (Skills 06 a 08)
