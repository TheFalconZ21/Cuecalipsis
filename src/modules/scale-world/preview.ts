import * as THREE from 'three';
import './preview.css';
import { eventBus } from '../../core/EventBus';
import type { Unsubscribe } from '../../core/EventBus';
import type { TierIndex } from '../../core/GameContracts';
import { DynamicCameraController } from './DynamicCameraController';
import { PROTOTYPE_DEFAULTS } from './PrototypeDefaults';
import { ScaleManager } from './ScaleManager';
import { TramplingSystem } from './TramplingSystem';
import { WorldStageController } from './WorldStageController';

const viewport = requireElement<HTMLDivElement>('viewport');
const scaleValue = requireElement<HTMLElement>('scale-value');
const apocalypseValue = requireElement<HTMLElement>('apocalypse-value');
const progressFill = requireElement<HTMLDivElement>('progress-fill');
const gateStatus = requireElement<HTMLDivElement>('gate-status');
const statusMessage = requireElement<HTMLParagraphElement>('status-message');
const tierBadge = requireElement<HTMLSpanElement>('tier-badge');
const toastMessage = requireElement<HTMLElement>('toast-message');
const enemyButton = requireElement<HTMLButtonElement>('enemy-button');
const beatButton = requireElement<HTMLButtonElement>('beat-button');
const bossButton = requireElement<HTMLButtonElement>('boss-button');
const resetButton = requireElement<HTMLButtonElement>('reset-button');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#17120f');
scene.fog = new THREE.Fog('#17120f', 34, 74);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(0, 12, 18);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.setAttribute('aria-label', 'Prototipo 3D del primer Tier de Cuecalipsis');
viewport.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight('#fff1d7', '#4d3a29', 2.1));
const sun = new THREE.DirectionalLight('#ffe0a4', 3.2);
sun.position.set(-12, 22, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -30;
sun.shadow.camera.right = 30;
sun.shadow.camera.top = 30;
sun.shadow.camera.bottom = -30;
scene.add(sun);

const stage = new WorldStageController({ scene });
const player = createPreviewHuaso();
scene.add(player);

const scaleManager = new ScaleManager({
  onScaleChanged: (scale) => player.scale.setScalar(scale),
});
const tramplingSystem = new TramplingSystem({
  player,
  scaleManager,
  targets: stage.trampleTargets,
});
const cameraController = new DynamicCameraController({
  scene,
  camera,
  player,
  getPlayerScale: () => scaleManager.currentTotalScale,
});

const keysDown = new Set<string>();
const movement = new THREE.Vector3();
const forward = new THREE.Vector3(0, 0, -1);
const right = new THREE.Vector3(1, 0, 0);
let enemySequence = 0;
let elapsedSeconds = 0;
let lastToastTimer = 0;
let animationFrame = 0;
let disposed = false;

function updateHud(): void {
  const progress = scaleManager.currentApocalypse / scaleManager.maxTierApocalypse;
  scaleValue.textContent = `${scaleManager.currentTotalScale.toFixed(2)}×`;
  apocalypseValue.textContent = `${Math.floor(scaleManager.currentApocalypse)} / ${scaleManager.maxTierApocalypse}`;
  progressFill.style.width = `${Math.min(100, progress * 100)}%`;
  tierBadge.textContent = `TIER ${scaleManager.currentTier}`;
  gateStatus.classList.toggle('ready', scaleManager.isScaleCapped);
  gateStatus.lastElementChild!.textContent = scaleManager.isScaleCapped
    ? 'Jefe guardián disponible'
    : 'Jefe guardián bloqueado';
  bossButton.disabled = !scaleManager.isScaleCapped;
  const bossHint = bossButton.querySelector('small');
  if (bossHint) bossHint.textContent = scaleManager.isScaleCapped ? 'Simular victoria para continuar' : 'Se habilita al llenar la barra';
}

function showToast(message: string): void {
  toastMessage.textContent = message;
  window.clearTimeout(lastToastTimer);
  lastToastTimer = window.setTimeout(() => {
    toastMessage.textContent = 'Vista local de desarrollo lista';
  }, 2600);
}

function emitEnemyDestroyed(): void {
  enemySequence += 1;
  eventBus.emit('OnEnemyDestroyed', {
    enemyId: `preview-enemy-${enemySequence}`,
    position: { x: player.position.x, z: player.position.z },
    apocalypseReward: 12,
    hordeLevel: 1,
  });
  statusMessage.textContent = `Destrucción simulada · +12 Apocalipsis (${enemySequence} evento${enemySequence === 1 ? '' : 's'}).`;
  showToast('Enemigo destruido · progreso enviado por EventBus');
  updateHud();
}

function emitStrongBeat(): void {
  eventBus.emit('OnBeat', {
    subdivisionIndex: 0,
    isStrongBeat: true,
    beatProgress: 0,
    audioTimeSeconds: performance.now() / 1000,
  });
  showToast('Pulso fuerte · micro-pulso de cámara');
}

function defeatPreviewBoss(): void {
  if (!scaleManager.isScaleCapped) return;
  const defeatedTier = scaleManager.currentTier;
  eventBus.emit('OnBossDefeated', { bossId: 'preview-guardian', tier: defeatedTier });
  statusMessage.textContent = 'Candado liberado · transición de contrato a Tier 2 (contenido pendiente).';
  showToast('Guardián derrotado · transición de demostración');
  updateHud();
}

function resetPreview(): void {
  eventBus.emit('OnGameReset', {});
  keysDown.clear();
  player.position.set(0, 0, 0);
  enemySequence = 0;
  statusMessage.textContent = 'Tier 1 restaurado. Recorre la plaza y prueba el escenario.';
  showToast('Tier 1 reiniciado · props y escala restaurados');
  updateHud();
}

function movePreviewPlayer(deltaSeconds: number): void {
  movement.set(0, 0, 0);
  if (keysDown.has('KeyW') || keysDown.has('ArrowUp')) movement.add(forward);
  if (keysDown.has('KeyS') || keysDown.has('ArrowDown')) movement.sub(forward);
  if (keysDown.has('KeyD') || keysDown.has('ArrowRight')) movement.add(right);
  if (keysDown.has('KeyA') || keysDown.has('ArrowLeft')) movement.sub(right);
  if (movement.lengthSq() === 0) return;

  movement.normalize();
  const speed = 6 * Math.sqrt(scaleManager.currentTotalScale);
  player.position.addScaledVector(movement, speed * deltaSeconds);
  player.position.y = 0;
  stage.constrainToArena(player.position, PROTOTYPE_DEFAULTS.playerRadiusAtScaleOne * scaleManager.currentTotalScale);
}

function renderFrame(timeMs: number): void {
  if (disposed) return;
  const currentSeconds = timeMs / 1000;
  const deltaSeconds = Math.min(0.05, elapsedSeconds === 0 ? 0 : currentSeconds - elapsedSeconds);
  elapsedSeconds = currentSeconds;

  movePreviewPlayer(deltaSeconds);
  tramplingSystem.update(deltaSeconds);
  cameraController.update(deltaSeconds);
  updateHud();
  renderer.render(scene, camera);
  animationFrame = window.requestAnimationFrame(renderFrame);
}

const unsubscribers: Unsubscribe[] = [
  eventBus.on('OnApocalypseGained', ({ amount, source }) => {
    statusMessage.textContent = `${source === 'Enemy' ? 'Enemigo derrotado' : 'Prop aplastado'} · +${amount} Apocalipsis.`;
  }),
  eventBus.on('OnBossGateTriggered', ({ tier }) => {
    statusMessage.textContent = `Tier ${tier} al máximo · el candado de jefe está activo.`;
    showToast('Umbral alcanzado · jefe guardián habilitado');
  }),
  eventBus.on('OnPropTrampled', ({ propId }) => {
    showToast(`${formatPropName(propId)} aplastado`);
  }),
  eventBus.on('OnScaleTierChanged', ({ newTier }) => {
    statusMessage.textContent = `Transición de demostración al Tier ${newTier}; su contenido no forma parte de este prototipo.`;
  }),
];

enemyButton.addEventListener('click', emitEnemyDestroyed);
beatButton.addEventListener('click', emitStrongBeat);
bossButton.addEventListener('click', defeatPreviewBoss);
resetButton.addEventListener('click', resetPreview);

window.addEventListener('keydown', (event) => {
  if (isTextInput(event.target)) return;
  const key = event.code;
  if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
    event.preventDefault();
    keysDown.add(key);
  }
});
window.addEventListener('keyup', (event) => keysDown.delete(event.code));
window.addEventListener('blur', () => keysDown.clear());
window.addEventListener('resize', resizeRenderer);
window.addEventListener('beforeunload', disposePreview, { once: true });

function resizeRenderer(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
}

function disposePreview(): void {
  disposed = true;
  window.cancelAnimationFrame(animationFrame);
  window.clearTimeout(lastToastTimer);
  for (const unsubscribe of unsubscribers) unsubscribe();
  cameraController.dispose();
  tramplingSystem.dispose();
  scaleManager.dispose();
  stage.dispose();
  renderer.dispose();
}

function createPreviewHuaso(): THREE.Group {
  const huaso = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: '#803c2c', flatShading: true, roughness: 0.8 });
  const shirtMaterial = new THREE.MeshStandardMaterial({ color: '#f0dfbf', flatShading: true, roughness: 0.9 });
  const skinMaterial = new THREE.MeshStandardMaterial({ color: '#c98358', flatShading: true, roughness: 0.9 });
  const hatMaterial = new THREE.MeshStandardMaterial({ color: '#3b2b20', flatShading: true, roughness: 0.95 });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.4, 0.72, 7), shirtMaterial);
  body.position.y = 0.86;
  body.castShadow = true;
  huaso.add(body);

  const poncho = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.35, 7, 1, true), bodyMaterial);
  poncho.position.y = 0.96;
  poncho.castShadow = true;
  huaso.add(poncho);

  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.27, 1), skinMaterial);
  head.position.y = 1.48;
  head.castShadow = true;
  huaso.add(head);

  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.075, 10), hatMaterial);
  brim.position.y = 1.72;
  brim.castShadow = true;
  huaso.add(brim);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.29, 0.25, 8), hatMaterial);
  crown.position.y = 1.86;
  crown.castShadow = true;
  huaso.add(crown);

  const legGeometry = new THREE.CylinderGeometry(0.12, 0.11, 0.52, 6);
  const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
  leftLeg.position.set(-0.19, 0.26, 0);
  leftLeg.castShadow = true;
  huaso.add(leftLeg);
  const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
  rightLeg.position.set(0.19, 0.26, 0);
  rightLeg.castShadow = true;
  huaso.add(rightLeg);

  const neckerchief = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.075, 5, 8), new THREE.MeshStandardMaterial({ color: '#d78a42', flatShading: true }));
  neckerchief.rotation.x = Math.PI / 2;
  neckerchief.position.y = 1.26;
  huaso.add(neckerchief);
  huaso.position.y = 0;
  return huaso;
}

function formatPropName(id: string): string {
  if (id.includes('table')) return 'Mesa';
  if (id.includes('fence')) return 'Cerca';
  return 'Bloque';
}

function isTextInput(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

function requireElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLElement)) throw new Error(`Falta el elemento #${id} en preview.html`);
  return element as T;
}

updateHud();
const hasTierOnePrototype = scaleManager.currentTier === (1 satisfies TierIndex);
statusMessage.textContent = hasTierOnePrototype
  ? `Prototipo listo · el umbral temporal es ${PROTOTYPE_DEFAULTS.tierOneApocalypseThreshold} de Apocalipsis.`
  : 'Prototipo Tier 1.';
animationFrame = window.requestAnimationFrame(renderFrame);
