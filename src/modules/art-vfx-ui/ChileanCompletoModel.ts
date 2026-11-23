import * as THREE from 'three';

/** Completo italiano low-poly: pan, tomate, palta y mayo. Origen al nivel del suelo. */
export function createChileanCompletoModel(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'prop-completo-italiano';

  const mat = (color: string, roughness = 0.94) => new THREE.MeshStandardMaterial({
    color, roughness, flatShading: true,
  });
  const bread = mat('#d99542');
  const crust = mat('#a95f2c');
  const crumb = mat('#f4c778');
  const avocado = mat('#398b48');
  const avocadoLight = mat('#83b94c');
  const tomato = mat('#d94235');
  const tomatoLight = mat('#f26c4e');
  const mayo = mat('#fff0cb');

  function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, y: number, z = 0): THREE.Mesh {
    const item = new THREE.Mesh(geometry, material);
    item.position.set(0, y, z);
    item.castShadow = true;
    item.receiveShadow = true;
    root.add(item);
    return item;
  }

  // Pan de completo alargado, con extremos redondeados y miga visible en la abertura.
  const lower = mesh(new THREE.CapsuleGeometry(0.34, 0.96, 3, 7), crust, 0.19);
  lower.rotation.z = Math.PI / 2;
  lower.scale.set(0.76, 0.72, 0.72);
  const base = mesh(new THREE.CapsuleGeometry(0.31, 0.98, 2, 7), bread, 0.24);
  base.rotation.z = Math.PI / 2;
  base.scale.set(0.76, 0.68, 0.62);

  // Salchicha asomando por ambos lados de la palta y el tomate.
  const sausage = mesh(new THREE.CapsuleGeometry(0.105, 1.12, 2, 6), crust, 0.40);
  sausage.rotation.z = Math.PI / 2;
  sausage.scale.set(0.9, 1, 0.9);
  const sausageHighlight = mesh(new THREE.CapsuleGeometry(0.07, 0.96, 2, 5), tomatoLight, 0.47, -0.012);
  sausageHighlight.rotation.z = Math.PI / 2;

  // Láminas de tomate y abanico de palta en la hendidura.
  for (const x of [-0.43, -0.16, 0.16, 0.43]) {
    const slice = new THREE.CylinderGeometry(0.19, 0.19, 0.035, 7);
    const disk = new THREE.Mesh(slice, tomato);
    disk.position.set(x, 0.51, -0.045);
    disk.rotation.z = x * 0.18;
    disk.castShadow = true;
    root.add(disk);
    const center = new THREE.IcosahedronGeometry(0.105, 0);
    const flesh = new THREE.Mesh(center, tomatoLight);
    flesh.position.set(x, 0.536, -0.045);
    flesh.scale.set(1, 0.28, 0.8);
    root.add(flesh);
  }
  for (let i = 0; i < 7; i++) {
    const x = (i - 3) * 0.135;
    const wedge = mesh(new THREE.IcosahedronGeometry(0.18, 0), i % 2 ? avocado : avocadoLight, 0.59, 0.045);
    wedge.position.x = x;
    wedge.scale.set(0.85, 0.38, 0.72);
    wedge.rotation.z = (i - 3) * 0.035;
    const skin = mesh(new THREE.IcosahedronGeometry(0.185, 0), avocado, 0.55, 0.075);
    skin.position.x = x;
    skin.scale.set(0.85, 0.16, 0.74);
  }

  // Hilos de mayo en zigzag, colocados por encima de los ingredientes.
  for (let i = 0; i < 9; i++) {
    const x = (i - 4) * 0.13;
    const drop = mesh(new THREE.IcosahedronGeometry(0.055, 0), mayo, 0.68 + (i % 2) * 0.035, i % 2 ? -0.07 : 0.14);
    drop.position.x = x;
    drop.scale.set(1.35, 0.55, 0.75);
  }

  // Migas facetadas como acento de pan tostado.
  for (const [x, z] of [[-0.54, 0.17], [-0.31, -0.2], [0.28, 0.19], [0.53, -0.14]] as const) {
    const crumbBit = new THREE.Mesh(new THREE.TetrahedronGeometry(0.045), crumb);
    crumbBit.position.set(x, 0.34, z);
    crumbBit.castShadow = true;
    root.add(crumbBit);
  }

  return root;
}
