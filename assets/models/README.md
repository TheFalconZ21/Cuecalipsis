# Models

Propiedad de Dev 4. Modelos 3D y exportaciones compartidas; respetar pivotes en la base, presupuesto low-poly y jerarquías documentadas en `dev4.pdf`.

## Enemigos de nivel 1

`src/modules/art-vfx-ui/LevelOneEnemyModels.ts` contiene modelos low-poly procedurales
de Three.js para `carabinero` y `patrulla-a-pie`. Se crean con
`createLevelOneEnemyModel(kind)` (o con una de las dos funciones específicas), y
devuelven un `THREE.Group` con el origen en el suelo, altura aproximada de 1.8
unidades y frente hacia -Z. Las piezas son mallas separadas para permitir animación
procedural posterior. Los detalles son genéricos y no incluyen insignias ni texto.

Para ver ambos a la vez en el navegador, inicia el servidor con `npm run dev` y abre
`http://localhost:5173/models.html`. Se pueden rotar y acercar con el mouse o con
gestos táctiles.

## Prop del completo italiano

`src/modules/art-vfx-ui/ChileanCompletoModel.ts` exporta
`createChileanCompletoModel()`, un completo low-poly de pan, vienesa, tomate, palta
y mayo. El origen está en la base y las piezas facetadas se mantienen separadas
para facilitar futuras variaciones visuales. También aparece en `models.html` junto
a los modelos del nivel 1.
