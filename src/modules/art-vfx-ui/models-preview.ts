import * as THREE from 'three';
import { createHuasoRig } from './HuasoModel';
import { createLevelOneEnemyModel } from './LevelOneEnemyModels';
import { createLevelTwoEnemyModel } from './LevelTwoEnemyModels';

const stage = document.querySelector<HTMLElement>('#stage');
const list = document.querySelector<HTMLElement>('#model-list');
const title = document.querySelector<HTMLElement>('#model-name');
if (!stage || !list || !title) throw new Error('Falta el escenario de modelos.');

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-3.1, 3.1, 2.3, -2.3, 0.1, 40);
camera.position.set(5.7, 7.3, 8.6);
camera.lookAt(0, 0.75, 0);
scene.add(new THREE.HemisphereLight('#e9dbb9', '#303631', 2.2));
const keyLight = new THREE.DirectionalLight('#ffe8bd', 2.4);
keyLight.position.set(-4, 8, 5);
scene.add(keyLight);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(3.7, 40),
  new THREE.MeshStandardMaterial({ color: '#55574c', roughness: 1 }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.025;
ground.receiveShadow = true;
scene.add(ground);
const grid = new THREE.GridHelper(7.4, 18, '#b9a578', '#8e8a79');
grid.position.y = -0.018;
(grid.material as THREE.Material).transparent = true;
(grid.material as THREE.Material).opacity = 0.15;
scene.add(grid);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
stage.append(renderer.domElement);
keyLight.castShadow = true;

const huaso = createHuasoRig();
const models: Array<{ name: string; root: THREE.Group }> = [
  { name: 'Huaso de la Cueca', root: huaso.root },
  { name: 'Carabinero · Nivel 1', root: createLevelOneEnemyModel('carabinero') },
  { name: 'Patrulla a pie · Nivel 1', root: createLevelOneEnemyModel('patrulla-a-pie') },
  { name: 'GOPE · Nivel 2', root: createLevelTwoEnemyModel('gope') },
  { name: 'Blindado ligero · Nivel 2', root: createLevelTwoEnemyModel('blindado-ligero') },
  { name: 'Helicóptero · Nivel 2', root: createLevelTwoEnemyModel('helicoptero') },
];
let active = -1;
function showModel(index: number): void {
  if (active >= 0) scene.remove(models[active].root);
  active = index;
  scene.add(models[index].root);
  title!.textContent = models[index].name;
  list!.querySelectorAll('button').forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
}

models.forEach((model, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = model.name;
  button.setAttribute('aria-pressed', 'false');
  button.addEventListener('click', () => showModel(index));
  list!.append(button);
});
showModel(0);

const resize = (): void => {
  const width = stage!.clientWidth;
  const height = stage!.clientHeight;
  const aspect = width / height;
  camera.left = -2.6 * aspect;
  camera.right = 2.6 * aspect;
  camera.top = 2.6;
  camera.bottom = -2.6;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
};
const observer = new ResizeObserver(resize);
observer.observe(stage);
resize();

let frame = 0;
const render = (): void => {
  frame = requestAnimationFrame(render);
  renderer.render(scene, camera);
};
render();
window.addEventListener('pagehide', () => {
  cancelAnimationFrame(frame);
  observer.disconnect();
  renderer.dispose();
}, { once: true });
