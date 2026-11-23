---
name: purposeful-efficient-vfx
description: >-
  Garantiza que cada animación y efecto visual aporte inmersión, feedback de precisión e intensidad rítmica manteniendo un costo mínimo en GPU y CPU.
---
# VFX y Animaciones Eficientes con Propósito
## 1. Regla de Triple Propósito
Todo efecto visual debe cumplir simultáneamente con: (a) reforzar la temática de
cueca cósmica, (b) dar feedback inmediato de precisión (`PERFECT/GOOD`) o daño, y
(c) escalar su intensidad visual (grosor, brillo, radio) en proporción directa al
medidor de **Enjundia**.
## 2. Presupuesto Técnico y Alternativas Ligeras
- **Cero Overdraw Masivo:** Prohibido apilar múltiples planos transparentes
gigantes.
- **Ondas de Zapateo y Remate por Shader:** Implementar como un único quad/anillo
horizontal en `Y = 0.03` con shader procedural de anillo expansivo.
- **Estela del Pañuelo:** Usar un `TrailRenderer` / cinta de geometría de máximo
`8` a `10` vértices con material *Unlit*.
- **Límite de Partículas:** Máximo `12` partículas simples (sin colisión física ni
luces dinámicas) por impacto y máximo `150` activas globales en su propio pool.
- **Scale Culling:** Al recibir `OnScaleTierChanged`, desactivar automáticamente
los micro-efectos de polvo o chispas de Tiers inferiores que ya no son legibles a
la nueva distancia de cámara.
4. Bloque de Gobernanza, QA y Equipo de 4 Devs (Skills 12 a 15)
