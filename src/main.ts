import * as THREE from 'three';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) throw new Error('No se encontró el contenedor #app');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#17120f');

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 3, 6);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
app.appendChild(renderer.domElement);

const geometry = new THREE.IcosahedronGeometry(1, 0);
const material = new THREE.MeshStandardMaterial({ color: '#d87936', flatShading: true });
const huasoPlaceholder = new THREE.Mesh(geometry, material);
huasoPlaceholder.position.y = 1;
scene.add(huasoPlaceholder);
scene.add(new THREE.HemisphereLight('#fff1d2', '#47352c', 2));

const light = new THREE.DirectionalLight('#ffffff', 2.5);
light.position.set(3, 5, 4);
scene.add(light);

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', resize);
renderer.setAnimationLoop(() => {
  huasoPlaceholder.rotation.y += 0.005;
  renderer.render(scene, camera);
});
