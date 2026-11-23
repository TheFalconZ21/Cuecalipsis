# Decisiones pendientes — Dev 3

## Cinco niveles de hordas frente a Tiers de escala

El catálogo de combate define cinco niveles de hordas (fuerza pública, control antidisturbios, ejército, defensa estratégica y corte celestial), mientras que la progresión de escala se describe como cuatro Tiers. No hay una correspondencia inequívoca entre ambos conteos.

**Dev 3 debe acordar con Dev 2** antes de implementar el `HordeDirector`:

- Si los cinco niveles son cinco etapas dentro de cuatro Tiers o si alguna etapa coincide con una transición.
- En qué orden/condición aparece cada nivel y cómo se desbloquea.
- Qué enemigos de niveles previos se vuelven aplastables al crecer.
- En qué hitos aparecen los tres jefes y qué nivel de hordas los acompaña.
- Cómo se adapta `spawnRadius`/velocidad al Tier actual.

No reducir ni expandir la cantidad de niveles de forma implícita. Mantener la correspondencia acordada en `src/core/GameConfigs.json`.

### Resolución

- Mapeo de cinco niveles a Tiers: _pendiente con Dev 2_
- Aparición y progresión: _pendiente_
- Fodder al crecer: _pendiente_
- Mapeo de jefes: _pendiente con Dev 2_
- Responsable/fecha: _pendiente_
