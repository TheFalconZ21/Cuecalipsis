import * as THREE from 'three';
import { createLevelOneEnemyModel } from './LevelOneEnemyModels';

export type LevelTwoEnemyKind = 'gope' | 'blindado-ligero' | 'helicoptero';

const colors = {
  armor: new THREE.MeshStandardMaterial({ color: '#202729', roughness: 0.9, flatShading: true }),
  armorEdge: new THREE.MeshStandardMaterial({ color: '#53605f', roughness: 0.95, flatShading: true }),
  glass: new THREE.MeshStandardMaterial({ color: '#283e45', roughness: 0.35, metalness: 0.2, flatShading: true }),
  tire: new THREE.MeshStandardMaterial({ color: '#242424', roughness: 1, flatShading: true }),
  warning: new THREE.MeshStandardMaterial({ color: '#b84d3e', roughness: 0.9, flatShading: true }),
};

function part(parent: THREE.Group, geometry: THREE.BufferGeometry, material: THREE.Material, position: [number, number, number]): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function createGope(): THREE.Group {
  const root = createLevelOneEnemyModel('carabinero');
  root.name = 'enemy-gope';
  part(root, new THREE.BoxGeometry(0.51, 0.47, 0.35), colors.armor, [0, 1.22, 0.08]);
  part(root, new THREE.IcosahedronGeometry(0.23, 0), colors.armor, [0, 1.92, 0]);
  const shield = part(root, new THREE.BoxGeometry(0.48, 0.54, 0.08), colors.armorEdge, [-0.43, 0.98, -0.04]);
  shield.rotation.z = -0.12;
  part(root, new THREE.BoxGeometry(0.09, 0.14, 0.02), colors.warning, [-0.43, 1.13, 0.014]);
  root.scale.setScalar(1.04);
  return root;
}

function createLightArmoredVehicle(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'enemy-blindado-ligero';
  const hull = part(root, new THREE.BoxGeometry(1.6, 0.54, 1.04), colors.armor, [0, 0.67, 0]);
  hull.rotation.y = 0.03;
  part(root, new THREE.BoxGeometry(0.8, 0.38, 0.86), colors.armorEdge, [0, 1.12, -0.02]);
  part(root, new THREE.BoxGeometry(0.5, 0.18, 0.06), colors.glass, [0, 1.2, 0.42]);
  const turret = part(root, new THREE.CylinderGeometry(0.29, 0.34, 0.2, 7), colors.armor, [0, 1.37, -0.13]);
  turret.rotation.y = Math.PI / 7;
  const cannon = part(root, new THREE.CylinderGeometry(0.055, 0.055, 0.56, 6), colors.armorEdge, [0, 1.38, -0.53]);
  cannon.rotation.x = Math.PI / 2;
  for (const side of [-1, 1]) {
    for (const z of [-0.36, 0.36]) {
      const wheel = part(root, new THREE.CylinderGeometry(0.23, 0.23, 0.18, 8), colors.tire, [side * 0.82, 0.27, z]);
      wheel.rotation.z = Math.PI / 2;
    }
  }
  return root;
}

function createHelicopter(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'enemy-helicoptero';
  const body = part(root, new THREE.IcosahedronGeometry(0.56, 1), colors.armor, [0, 0.95, 0]);
  body.scale.set(1, 0.72, 1.24);
  part(root, new THREE.IcosahedronGeometry(0.35, 0), colors.glass, [0, 1.1, 0.43]).scale.set(0.92, 0.76, 0.7);
  const tail = part(root, new THREE.BoxGeometry(0.14, 0.14, 0.92), colors.armorEdge, [0, 1.03, -0.97]);
  tail.rotation.x = -0.08;
  part(root, new THREE.BoxGeometry(0.68, 0.08, 0.16), colors.armor, [0, 1.34, -1.34]);
  const rotor = part(root, new THREE.BoxGeometry(2.1, 0.035, 0.11), colors.armorEdge, [0, 1.55, 0]);
  rotor.rotation.y = 0.35;
  part(root, new THREE.BoxGeometry(0.08, 0.08, 0.66), colors.armor, [0, 1.55, 0]);
  part(root, new THREE.BoxGeometry(0.08, 0.45, 0.08), colors.armorEdge, [-0.15, 0.61, -0.04]);
  part(root, new THREE.BoxGeometry(0.08, 0.45, 0.08), colors.armorEdge, [0.15, 0.61, -0.04]);
  return root;
}

/** Modelos compactos de la segunda horda; todos apoyan la silueta en Y=0. */
export function createLevelTwoEnemyModel(kind: LevelTwoEnemyKind): THREE.Group {
  switch (kind) {
    case 'gope': return createGope();
    case 'blindado-ligero': return createLightArmoredVehicle();
    case 'helicoptero': return createHelicopter();
  }
}
