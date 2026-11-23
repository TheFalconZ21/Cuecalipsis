---
name: cueca-state-machine
description: >-
  Implementa la cola de rotación de pasos (Media Luna, Escobillado, Zapateo, Remate) donde cada acierto rítmico ejecuta el ataque básico y carga la barra para lanzar la Habilidad Superior antes de rotar al siguiente paso.
---
# Máquina de Rotación Activa: Pie de Cueca
## Ciclo de Rotación por Carga (`SkillCharge` 0% a 100%)
El jugador tiene un único paso activo en rotación. Cada input acertado en el compás
`6/8` ejecuta el **Ataque Básico** del paso activo (emitiendo `OnBasicStepAttack`)
y suma carga a `currentSkillCharge`. Al llegar al `100%`, el jugador lanza la
**Habilidad Superior** de ese paso, vacía la barra y rota automáticamente al
siguiente paso en la cola (emitiendo `OnSuperiorStepUnleashed(completedStep,
nextStep)`):
1. **Media Luna (Movilidad y Corte Circular):**
   - *Ataque Básico:* Desplazamiento en arco con corte de pañuelo y evasión ligera.
   - *Habilidad Superior (Media Luna Suprema):* Barrido circular masivo con `0.35s`
de *i-frames* que refleja proyectiles y corta a toda la horda circundante.
2. **Escobillado (DPS Rápido Perforante):**
   - *Ataque Básico:* Ráfaga corta de daño frontal/radial alrededor de los pies en
cada corchea acertada.
   - *Habilidad Superior (Escobillado Frenético):* Tormenta de patadas de alta
velocidad que perfora blindajes pesados y levanta escombros dañinos.
3. **Zapateo (Control de Masas y Demolición):**
   - *Ataque Básico:* Pisotón sísmico que genera un anillo de daño local y empuja
enemigos cercanos.
   - *Habilidad Superior (Zapateo Cataclísmico):* Grieta tectónica expansiva de
gran radio que aturde hordas y demuele estructuras del nivel.
4. **Remate (Impacto Crítico y Purga):**
   - *Ataque Básico:* Golpe seco concentrado de alto daño con giro de pañuelo.
   - *Habilidad Superior (Remate Apocalíptico):* Explosión radial de pantalla
completa que destruye proyectiles enemigos activos y aplica daño crítico masivo.
