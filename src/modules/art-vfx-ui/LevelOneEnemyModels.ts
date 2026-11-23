import * as THREE from 'three';

/**
 * Modelos procedurales low-poly de los enemigos de la horda del nivel 1.
 * Origen en el suelo, altura aproximada 1.8 unidades y frente hacia -Z.
 * La geometría es deliberadamente simple para permitir animación por partes.
 */

const palette = {
  skin: '#bd8967',
  darkSkin: '#8d5f49',
  green: '#344b3d',
  greenLight: '#536b4d',
  navy: '#293746',
  navyLight: '#425469',
  black: '#202326',
  boot: '#292725',
  belt: '#302d29',
  brass: '#b9924f',
  shield: '#66747b',
  shieldEdge: '#bec5c1',
  visor: '#303c42',
};

function material(color: string, roughness = 0.92): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, flatShading: true });
}

function part(
  parent: THREE.Group,
  geometry: THREE.BufferGeometry,
  color: string,
  position: THREE.Vector3,
  scale?: THREE.Vector3,
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material(color));
  mesh.position.copy(position);
  if (scale) mesh.scale.copy(scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function box(parent: THREE.Group, color: string, pos: [number, number, number], size: [number, number, number]): THREE.Mesh {
  return part(parent, new THREE.BoxGeometry(...size), color, new THREE.Vector3(...pos));
}

function limb(
  parent: THREE.Group,
  color: string,
  top: [number, number, number],
  bottom: [number, number, number],
  topRadius: number,
  bottomRadius: number,
): THREE.Mesh {
  const a = new THREE.Vector3(...top);
  const b = new THREE.Vector3(...bottom);
  const axis = new THREE.Vector3().subVectors(a, b);
  const mesh = part(
    parent,
    new THREE.CylinderGeometry(topRadius, bottomRadius, axis.length(), 5, 1),
    color,
    a.clone().add(b).multiplyScalar(0.5),
  );
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis.normalize());
  return mesh;
}

function sphere(parent: THREE.Group, color: string, pos: [number, number, number], scale: [number, number, number], detail = 0): THREE.Mesh {
  return part(parent, new THREE.IcosahedronGeometry(1, detail), color, new THREE.Vector3(...pos), new THREE.Vector3(...scale));
}

function buildBody(root: THREE.Group, uniform: string, skin: string, boots: string): void {
  // Piernas y botas: separadas para poder animar cada lado en futuras iteraciones.
  limb(root, uniform, [-0.12, 0.83, 0], [-0.14, 0.22, 0], 0.105, 0.075);
  limb(root, uniform, [0.12, 0.83, 0], [0.14, 0.22, 0], 0.105, 0.075);
  box(root, boots, [-0.14, 0.12, 0.045], [0.17, 0.19, 0.29]);
  box(root, boots, [0.14, 0.12, 0.045], [0.17, 0.19, 0.29]);

  // Tronco, hombros, cuello y cabeza.
  box(root, uniform, [0, 1.19, 0], [0.48, 0.61, 0.29]);
  sphere(root, uniform, [-0.27, 1.39, 0], [0.15, 0.14, 0.16]);
  sphere(root, uniform, [0.27, 1.39, 0], [0.15, 0.14, 0.16]);
  box(root, skin, [0, 1.54, 0], [0.14, 0.15, 0.15]);
  sphere(root, skin, [0, 1.69, 0], [0.18, 0.22, 0.17], 1);

  // Brazos ligeramente abiertos para que la silueta se lea desde cámara cenital.
  limb(root, uniform, [-0.29, 1.37, 0], [-0.39, 0.99, -0.015], 0.105, 0.075);
  limb(root, uniform, [0.29, 1.37, 0], [0.39, 0.99, -0.015], 0.105, 0.075);
  sphere(root, skin, [-0.39, 0.96, -0.015], [0.075, 0.09, 0.075]);
  sphere(root, skin, [0.39, 0.96, -0.015], [0.075, 0.09, 0.075]);
  box(root, palette.belt, [0, 0.91, 0], [0.49, 0.11, 0.32]);
}

function addCap(root: THREE.Group): void {
  const cap = new THREE.Group();
  cap.position.y = 1.86;
  root.add(cap);
  part(cap, new THREE.CylinderGeometry(0.17, 0.18, 0.12, 6), palette.green, new THREE.Vector3(0, 0, 0));
  part(cap, new THREE.CylinderGeometry(0.18, 0.18, 0.025, 6), palette.green, new THREE.Vector3(0, -0.055, 0.015));
  box(cap, palette.brass, [0, -0.005, -0.173], [0.085, 0.045, 0.025]);
}

function addHelmet(root: THREE.Group): void {
  sphere(root, palette.navy, [0, 1.84, 0], [0.22, 0.16, 0.2], 1);
  box(root, palette.navy, [0, 1.76, 0.025], [0.39, 0.035, 0.37]);
  // Visor hacia el frente (-Z).
  box(root, palette.visor, [0, 1.82, -0.174], [0.28, 0.075, 0.025]);
}

function addRadio(root: THREE.Group, side: -1 | 1): void {
  box(root, palette.black, [side * 0.19, 1.04, -0.17], [0.12, 0.2, 0.09]);
  box(root, palette.brass, [side * 0.19, 1.16, -0.17], [0.035, 0.08, 0.02]);
}

/** Policía uniformado con gorra, placa y cinturón de servicio. */
export function createCarabineroModel(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'enemy-carabinero';
  buildBody(root, palette.green, palette.skin, palette.boot);
  addCap(root);
  box(root, palette.greenLight, [0, 1.32, -0.152], [0.19, 0.23, 0.018]); // placa/insignia sin texto
  box(root, palette.brass, [0, 1.31, -0.168], [0.075, 0.075, 0.018]);
  box(root, palette.belt, [0.23, 0.91, -0.02], [0.12, 0.16, 0.12]);
  addRadio(root, -1);
  return root;
}

/** Agente de fuerza pública con casco, chaleco y escudo compacto. */
export function createPatrullaAPieModel(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'enemy-patrulla-a-pie';
  buildBody(root, palette.navy, palette.darkSkin, palette.boot);
  addHelmet(root);
  box(root, palette.navyLight, [0, 1.22, -0.16], [0.4, 0.42, 0.07]); // chaleco
  box(root, palette.shieldEdge, [0, 1.27, -0.204], [0.16, 0.055, 0.016]); // placa genérica
  addRadio(root, 1);

  // Escudo poligonal en el brazo izquierdo; la manilla queda hacia el cuerpo.
  const shield = part(
    root,
    new THREE.CylinderGeometry(0.22, 0.17, 0.07, 5, 1),
    palette.shield,
    new THREE.Vector3(-0.47, 1.02, -0.04),
  );
  shield.rotation.x = Math.PI / 2;
  shield.rotation.z = -0.08;
  box(root, palette.shieldEdge, [-0.47, 1.02, -0.08], [0.045, 0.33, 0.02]);

  // Bastón sujeto al lado derecho, como detalle de lectura a escala pequeña.
  const baton = part(root, new THREE.CylinderGeometry(0.025, 0.025, 0.48, 5), palette.black, new THREE.Vector3(0.43, 0.77, -0.08));
  baton.rotation.z = -0.22;
  return root;
}

/** Crea el modelo asociado a los `kind` de HordeLevelOne. */
export function createLevelOneEnemyModel(kind: 'carabinero' | 'patrulla-a-pie'): THREE.Group {
  return kind === 'carabinero' ? createCarabineroModel() : createPatrullaAPieModel();
}
