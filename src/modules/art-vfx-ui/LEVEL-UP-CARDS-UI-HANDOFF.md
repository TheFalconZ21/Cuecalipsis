# Handoff Dev 4: presentación de cartas de nivel

Propuesta de UI para las ocho mejoras del catálogo acordado. Dev 4 representa la selección y sus efectos visuales; Dev 3 conserva el control de elegibilidad, adquisición y gameplay.

## Flujo visual

1. Al recibir `OnLevelUpReady`, mostrar un overlay/modal de nivel nuevo con las tres opciones entregadas por el evento. No sortear ni reemplazar cartas desde la UI.
2. Cada carta muestra el nombre y una descripción corta. Se pueden usar siluetas/ilustraciones provisionales mientras se producen assets; no inventar rarezas, niveles, valores de daño o duraciones.
3. Resaltar foco, hover, selección y estado de confirmación. Tras la selección, bloquear doble envío y cerrar/actualizar el overlay cuando llegue la confirmación acordada desde el núcleo.
4. La UI no pausa el `RhythmClock`, no concede la mejora y no modifica estadísticas. El flujo de juego gestiona la pausa y reanudación en el siguiente pulso fuerte (corchea 0 o 3) usando el reloj compartido.

## Datos y eventos a coordinar

`src/core/EventBus` aún no está implementado; estos nombres/payloads son propuestas para acordar con Dev 3 y Dev 1:

- `OnLevelUpReady`: nivel alcanzado y lista de tres opciones. Datos mínimos por opción: `upgradeId`, `name`, `description` y `iconKey` opcional.
- `OnUpgradeSelected`: `upgradeId` de la opción seleccionada y referencia de run/nivel para evitar doble aplicación.
- Evento de confirmación de mejora aplicada/cierre: nombre y payload pendientes de acordar con Dev 3.

La interfaz debe ser reactiva a estos eventos y no calcular XP, opciones, efectos ni daño. Los elementos decorativos del overlay no deben capturar inputs; solo los controles de selección son interactivos.

## Contenido inicial de las cartas

- **La señora interesante:** distrae a enemigos al activar la habilidad superior.
- **Baila sin cesar:** el enemigo dañado baila durante `0.5 s`.
- **Rin Rin Raja:** atacar por la espalda puede otorgar velocidad e invulnerabilidad.
- **Tangananica-Tanganana:** bonus al atacar hacia la orientación activa, que puede cambiar al lado opuesto entre compases.
- **Dinosaurio Anacleto:** meteorito de daño masivo al efectuar el Remate; el disparador exacto está por confirmar con Dev 3.
- **Guacala:** comida periódica aleatoria: completo, sopaipilla o empanada.
- **Mi muñeca me habló:** una muñeca orbita al jugador y replica ataques.
- **Arwrarwrirwrarwro:** zombies aliados de poca vida con probabilidad de infectar.

Usar el texto de gameplay acordado por Dev 3 cuando esté disponible, evitando prometer valores de balance que aún no se han fijado.

