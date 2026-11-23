import * as THREE from 'three';

export interface HuasoRig {
  root: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  leftFoot: THREE.Group;
  rightFoot: THREE.Group;
  rightHand: THREE.Group;
}

/** Huaso low-poly para cámara cenital, con el origen en la planta de las botas. */
export function createHuasoRig(): HuasoRig {
  const root = new THREE.Group();
  root.name = 'huaso-cueca';

  const materials = {
    skin: new THREE.MeshStandardMaterial({ color: '#b77d59', roughness: 0.94, flatShading: true }),
    poncho: new THREE.MeshStandardMaterial({ color: '#a13e32', roughness: 0.96, flatShading: true }),
    ponchoEdge: new THREE.MeshStandardMaterial({ color: '#d8b467', roughness: 0.94, flatShading: true }),
    trousers: new THREE.MeshStandardMaterial({ color: '#292d2c', roughness: 0.95, flatShading: true }),
    boots: new THREE.MeshStandardMaterial({ color: '#36291f', roughness: 0.98, flatShading: true }),
    straw: new THREE.MeshStandardMaterial({ color: '#c49b55', roughness: 1, flatShading: true }),
    shirt: new THREE.MeshStandardMaterial({ color: '#ece1c7', roughness: 0.95, flatShading: true }),
    scarf: new THREE.MeshStandardMaterial({ color: '#f1e7d0', roughness: 0.9, flatShading: true, side: THREE.DoubleSide }),
  };
  const add = (parent: THREE.Group, geometry: THREE.BufferGeometry, material: THREE.Material, position: [number, number, number]) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const torso = new THREE.Group();
  torso.position.y = 1.04;
  root.add(torso);
  add(torso, new THREE.BoxGeometry(0.42, 0.55, 0.28), materials.shirt, [0, 0.16, 0]);
  const poncho = add(torso, new THREE.CylinderGeometry(0.46, 0.32, 0.58, 8, 1), materials.poncho, [0, 0.12, 0]);
  poncho.scale.z = 0.73;
  add(torso, new THREE.CylinderGeometry(0.465, 0.465, 0.035, 8), materials.ponchoEdge, [0, -0.17, 0]);

  const head = new THREE.Group();
  head.position.set(0, 0.57, -0.015);
  torso.add(head);
  add(head, new THREE.IcosahedronGeometry(0.19, 1), materials.skin, [0, 0, 0]);
  add(head, new THREE.CylinderGeometry(0.16, 0.18, 0.045, 9), materials.straw, [0, 0.17, 0]);
  add(head, new THREE.CylinderGeometry(0.095, 0.12, 0.17, 7), materials.straw, [0, 0.26, 0]);

  const leftFoot = new THREE.Group();
  leftFoot.position.set(-0.14, 0.11, 0.09);
  add(leftFoot, new THREE.BoxGeometry(0.18, 0.20, 0.33), materials.boots, [0, 0, 0]);
  root.add(leftFoot);
  const rightFoot = new THREE.Group();
  rightFoot.position.set(0.14, 0.11, 0.09);
  add(rightFoot, new THREE.BoxGeometry(0.18, 0.20, 0.33), materials.boots, [0, 0, 0]);
  root.add(rightFoot);
  for (const side of [-1, 1]) {
    add(root, new THREE.CylinderGeometry(0.09, 0.075, 0.72, 5), materials.trousers, [side * 0.14, 0.48, 0]);
  }

  const armGeometry = new THREE.CylinderGeometry(0.075, 0.09, 0.42, 5);
  const leftArm = add(torso, armGeometry, materials.poncho, [-0.31, 0.03, 0]);
  leftArm.rotation.z = -0.34;
  const rightHand = new THREE.Group();
  rightHand.position.set(0.39, -0.02, 0.02);
  torso.add(rightHand);
  const rightArm = add(torso, armGeometry, materials.poncho, [0.31, 0.03, 0]);
  rightArm.rotation.z = 0.34;
  add(rightHand, new THREE.IcosahedronGeometry(0.075, 0), materials.skin, [0, -0.23, 0]);
  const pañuelo = add(rightHand, new THREE.PlaneGeometry(0.38, 0.26), materials.scarf, [0.23, -0.26, 0.03]);
  pañuelo.rotation.y = -0.34;
  pañuelo.rotation.z = -0.28;

  return { root, torso, head, leftFoot, rightFoot, rightHand };
}

export function createHuasoModel(): THREE.Group {
  return createHuasoRig().root;
}
