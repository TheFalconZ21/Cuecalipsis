import * as THREE from 'three';

/** Sol caricaturesco low-poly inspirado en el dibujo de referencia. Frente hacia -Z. */
export function createSunModel(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'sun-character';

  const mat = (color: string, roughness = 0.88) => new THREE.MeshStandardMaterial({ color, roughness, flatShading: true });
  const gold = mat('#efc85f');
  const rayMat = mat('#d9953e');
  const ink = mat('#382217');
  const white = mat('#fff8e9');
  const iris = mat('#7d3e1e');
  const blue = mat('#43b8c6');
  const tooth = mat('#fffdf4');

  // Eight irregular rays sit behind the round face.
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.08;
    const ray = new THREE.Group();
    const points: [number, number][] = [[0, 0.91], [-0.20, 1.28], [-0.08, 1.52], [0.12, 1.57], [0.28, 1.31], [0.15, 0.93]];
    const shape = new THREE.Shape();
    shape.moveTo(points[0][0], points[0][1]);
    for (let p = 1; p < points.length; p++) shape.lineTo(points[p][0], points[p][1]);
    shape.closePath();
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), rayMat);
    mesh.position.z = 0;
    mesh.castShadow = true;
    ray.add(mesh);
    ray.rotation.z = a;
    root.add(ray);
  }

  const face = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), gold);
  face.scale.set(1.02, 1.02, 0.3);
  face.position.z = -0.04;
  face.castShadow = true;
  face.receiveShadow = true;
  root.add(face);

  const disk = (x: number, y: number, z: number, rx: number, ry: number, material: THREE.Material, detail = 16) => {
    const mesh = new THREE.Mesh(new THREE.CircleGeometry(1, detail), material);
    mesh.position.set(x, y, z);
    mesh.scale.set(rx, ry, 1);
    root.add(mesh);
    return mesh;
  };
  const stroke = (coords: [number, number][], color: THREE.Material, radius = 0.025, z = -0.36) => {
    const curve = new THREE.CatmullRomCurve3(coords.map(([x, y]) => new THREE.Vector3(x, y, z)));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(12, coords.length * 5), radius, 7, false), color);
    mesh.castShadow = true;
    root.add(mesh);
    return mesh;
  };

  // Eyes, expressive slanted brows and a small pointed nose.
  for (const side of [-1, 1]) {
    disk(side * 0.39, 0.32, -0.32, 0.19, 0.24, ink);
    disk(side * 0.39, 0.32, -0.35, 0.145, 0.19, white);
    disk(side * 0.35, 0.31, -0.38, 0.082, 0.12, iris);
    disk(side * 0.33, 0.34, -0.4, 0.038, 0.06, ink);
    disk(side * 0.42, 0.39, -0.41, 0.035, 0.045, white, 12);
    stroke([[side * 0.12, 0.69], [side * 0.31, 0.81], [side * 0.59, 0.75]], ink, 0.055);
    // Cheek spirals and tiny freckles.
    disk(side * 0.69, -0.14, -0.34, 0.22, 0.22, mat('#f4d66e'));
    stroke([[side * 0.56, -0.12], [side * 0.62, -0.02], [side * 0.75, 0.01], [side * 0.83, -0.09], [side * 0.79, -0.20], [side * 0.68, -0.22], [side * 0.64, -0.14], [side * 0.71, -0.10]], ink, 0.021, -0.38);
  }
  stroke([[-0.09, 0.62], [-0.05, 0.37], [0, 0.20], [0.10, 0.10], [-0.10, 0.02], [-0.17, -0.08]], ink, 0.034);
  stroke([[0.02, 0.18], [0.20, 0.10]], ink, 0.022);

  // Big curved grin, turquoise lip and separated bright teeth.
  const smile = new THREE.Shape();
  smile.moveTo(-0.68, -0.34);
  smile.quadraticCurveTo(0, -0.70, 0.68, -0.34);
  smile.quadraticCurveTo(0.04, -1.02, -0.68, -0.34);
  const mouth = new THREE.Mesh(new THREE.ShapeGeometry(smile, 20), ink);
  mouth.position.z = -0.40;
  root.add(mouth);
  const lip = new THREE.Shape();
  lip.moveTo(-0.66, -0.34);
  lip.quadraticCurveTo(0, -0.48, 0.66, -0.34);
  lip.lineTo(0.57, -0.48);
  lip.quadraticCurveTo(0, -0.62, -0.57, -0.48);
  lip.closePath();
  const lipMesh = new THREE.Mesh(new THREE.ShapeGeometry(lip, 18), blue);
  lipMesh.position.z = -0.43;
  root.add(lipMesh);
  for (let i = -2; i <= 2; i++) {
    const x = i * 0.205;
    const yTop = -0.48 + Math.abs(i) * 0.034;
    const yBottom = -0.64 + Math.abs(i) * 0.085;
    const t = new THREE.Mesh(new THREE.PlaneGeometry(0.19, yTop - yBottom), tooth);
    t.position.set(x, (yTop + yBottom) / 2, -0.45);
    root.add(t);
    if (i < 2) stroke([[x + 0.095, yTop], [x + 0.095, yBottom]], ink, 0.009, -0.46);
  }
  stroke([[-0.42, -0.78], [-0.18, -0.85], [0.12, -0.85], [0.38, -0.77]], ink, 0.024);
  // Warm cheek creases and a few brow wrinkles complete the hand-drawn feel.
  stroke([[-0.76, 0.24], [-0.62, 0.18]], ink, 0.018);
  stroke([[0.75, 0.25], [0.62, 0.18]], ink, 0.018);
  stroke([[-0.78, -0.01], [-0.65, -0.04]], ink, 0.015);
  stroke([[0.78, -0.01], [0.66, -0.05]], ink, 0.015);

  root.scale.setScalar(0.85);
  return root;
}
