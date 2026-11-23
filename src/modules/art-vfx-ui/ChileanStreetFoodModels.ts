import * as THREE from 'three';

function material(color: string): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.96, flatShading: true });
}

/** Empanada de pino horneada low-poly, con repulgue visible y origen en el suelo. */
export function createChileanEmpanadaModel(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'prop-empanada-de-pino';

  const dough = material('#d99442');
  const crimp = material('#b86b30');
  const seam = material('#efbd70');
  const filling = material('#75452a');

  const outline = new THREE.Shape();
  outline.moveTo(-0.64, 0);
  outline.quadraticCurveTo(-0.59, 0.39, 0, 0.56);
  outline.quadraticCurveTo(0.59, 0.39, 0.64, 0);
  outline.quadraticCurveTo(0.03, -0.12, -0.64, 0);
  const pastry = new THREE.Mesh(new THREE.ExtrudeGeometry(outline, {
    depth: 0.15, bevelEnabled: true, bevelSegments: 2, steps: 1,
    bevelSize: 0.045, bevelThickness: 0.045, curveSegments: 8,
  }), dough);
  pastry.rotation.x = Math.PI / 2;
  pastry.position.y = 0.205;
  pastry.castShadow = pastry.receiveShadow = true;
  root.add(pastry);

  // Oscuros acentos tostados y pequeñas vueltas de masa recorren el borde curvo.
  for (let i = 0; i <= 9; i++) {
    const t = i / 9;
    const x = -0.57 + t * 1.14;
    const z = 0.49 * Math.sin(t * Math.PI);
    const twist = new THREE.Mesh(new THREE.IcosahedronGeometry(0.073, 0), i % 3 === 0 ? seam : crimp);
    twist.position.set(x, 0.29 + 0.025 * Math.sin(t * Math.PI), z);
    twist.scale.set(0.9, 0.55, 0.7);
    twist.rotation.y = -0.35 + t * 0.7;
    twist.castShadow = true;
    root.add(twist);
  }
  // Unas pintas de horno le dan lectura de masa horneada desde la vista cenital.
  for (const [x, z, scale] of [[-0.25, 0.24, 1], [0.16, 0.32, 0.8], [0.38, 0.13, 0.7]] as const) {
    const spot = new THREE.Mesh(new THREE.IcosahedronGeometry(0.055, 0), filling);
    spot.position.set(x, 0.335, z);
    spot.scale.set(scale, 0.22, scale * 0.75);
    root.add(spot);
  }
  return root;
}

/** Sopaipilla chilena de zapallo, redonda y ligeramente irregular, origen en el suelo. */
export function createChileanSopaipillaModel(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'prop-sopaipilla';
  const crust = material('#bd6c2c');
  const fried = material('#e99a3d');
  const toasted = material('#a95926');

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.55, 0.16, 11, 1), crust);
  base.position.y = 0.105;
  base.rotation.y = 0.12;
  base.castShadow = base.receiveShadow = true;
  root.add(base);

  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.535, 0.55, 0.055, 11, 1), fried);
  top.position.y = 0.205;
  top.rotation.y = 0.12;
  top.castShadow = true;
  root.add(top);

  // Tostado irregular y el pequeño agujero central típico.
  for (const [x, z, s] of [[-0.27, 0.12, 1], [0.18, 0.3, 0.8], [0.31, -0.16, 0.9], [-0.2, -0.29, 0.72]] as const) {
    const mark = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), toasted);
    mark.position.set(x, 0.242, z);
    mark.scale.set(s, 0.18, s * 0.7);
    root.add(mark);
  }
  const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.012, 7), toasted);
  hole.position.set(0.015, 0.238, -0.015);
  hole.castShadow = true;
  root.add(hole);
  return root;
}
