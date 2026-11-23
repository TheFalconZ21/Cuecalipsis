import * as THREE from 'three';
import { createCarabineroModel, createPatrullaAPieModel } from './modules/art-vfx-ui/LevelOneEnemyModels';
import { createChileanCompletoModel } from './modules/art-vfx-ui/ChileanCompletoModel';
import { createChileanEmpanadaModel, createChileanSopaipillaModel } from './modules/art-vfx-ui/ChileanStreetFoodModels';
import { createSunModel } from './modules/art-vfx-ui/SunModel';
import './models-preview.css';

const container = document.querySelector<HTMLElement>('#preview');
if (!container) throw new Error('No se encontró #preview');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#17120f');
scene.fog = new THREE.Fog('#17120f', 10, 24);

const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);
const cameraTarget = new THREE.Vector3(0, 0.92, 0);
let cameraRadius = 15.5;
let cameraAzimuth = 0.51;
let cameraPolar = 1.28;

function updateCamera(): void {
  camera.position.set(
    cameraTarget.x + cameraRadius * Math.sin(cameraPolar) * Math.sin(cameraAzimuth),
    cameraTarget.y + cameraRadius * Math.cos(cameraPolar),
    cameraTarget.z + cameraRadius * Math.sin(cameraPolar) * Math.cos(cameraAzimuth),
  );
  camera.lookAt(cameraTarget);
}
updateCamera();

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
container.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight('#f4e8d3', '#493d35', 2.1));
const keyLight = new THREE.DirectionalLight('#fff1d9', 3.5);
keyLight.position.set(-3, 7, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
scene.add(keyLight);

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(8, 48),
  new THREE.MeshStandardMaterial({ color: '#302820', roughness: 1, flatShading: true }),
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.015;
floor.receiveShadow = true;
scene.add(floor);

const grid = new THREE.GridHelper(16, 32, '#75614b', '#493c30');
grid.position.y = 0.006;
scene.add(grid);

const carabinero = createCarabineroModel();
carabinero.position.x = 0;
carabinero.rotation.y = 0.15;
scene.add(carabinero);

const patrol = createPatrullaAPieModel();
patrol.position.x = 2.7;
patrol.rotation.y = -0.15;
scene.add(patrol);

const completo = createChileanCompletoModel();
completo.position.x = -5.4;
completo.rotation.y = -0.22;
scene.add(completo);

const sun = createSunModel();
sun.position.x = -2.7;
sun.position.y = 1.32;
scene.add(sun);

const empanada = createChileanEmpanadaModel();
empanada.position.x = 2.7;
empanada.rotation.y = -0.28;
scene.add(empanada);

const sopaipilla = createChileanSopaipillaModel();
sopaipilla.position.x = 5.4;
sopaipilla.rotation.y = 0.18;
scene.add(sopaipilla);

let dragging = false;
let lastPointerX = 0;
let lastPointerY = 0;
renderer.domElement.addEventListener('pointerdown', (event) => {
  dragging = true;
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
  renderer.domElement.setPointerCapture(event.pointerId);
});
renderer.domElement.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  cameraAzimuth -= (event.clientX - lastPointerX) * 0.006;
  cameraPolar = THREE.MathUtils.clamp(cameraPolar + (event.clientY - lastPointerY) * 0.004, 0.35, 1.65);
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
  updateCamera();
});
renderer.domElement.addEventListener('pointerup', () => { dragging = false; });
renderer.domElement.addEventListener('pointercancel', () => { dragging = false; });
renderer.domElement.addEventListener('wheel', (event) => {
  event.preventDefault();
  cameraRadius = THREE.MathUtils.clamp(cameraRadius + event.deltaY * 0.008, 5.2, 15);
  updateCamera();
}, { passive: false });

function resize(): void {
  const width = container!.clientWidth;
  const height = container!.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(container);
resize();

renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});

window.addEventListener('beforeunload', () => {
  resizeObserver.disconnect();
  renderer.dispose();
});
