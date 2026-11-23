import * as THREE from 'three';
import { PauseMenu } from './modules/art-vfx-ui/PauseMenu';

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

let gameTimeScale = 1;
let gameRunning = true;
const pauseMenu = new PauseMenu({
  host: app,
  setTimeScale: (scale) => { gameTimeScale = THREE.MathUtils.clamp(scale, 0, 1); },
  restart: () => window.location.reload(),
  enterMainMenu: () => { gameRunning = false; },
  startGame: () => window.location.reload(),
});
const gameClock = new THREE.Clock();

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', resize);
window.addEventListener('pagehide', () => {
  pauseMenu.dispose();
  renderer.setAnimationLoop(null);
  renderer.dispose();
}, { once: true });
renderer.setAnimationLoop(() => {
  const scaledDelta = gameClock.getDelta() * gameTimeScale;
  if (gameRunning) huasoPlaceholder.rotation.y += 0.5 * scaledDelta;
  renderer.render(scene, camera);
});
