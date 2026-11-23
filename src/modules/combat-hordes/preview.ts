import * as THREE from 'three';
import './preview.css';
import { eventBus } from '../../core/EventBus';
import type { Unsubscribe } from '../../core/EventBus';
import type { LevelOneEnemyKind } from './HordeLevelOne';
import { HordeLevelOne } from './HordeLevelOne';
import { HORDE_BALANCE, HordeDirector } from './HordeDirector';

const viewport = required<HTMLDivElement>('viewport');
const waveLabel = required<HTMLElement>('wave-label');
const waveCount = required<HTMLElement>('wave-count');
const healthValue = required<HTMLElement>('health-value');
const healthFill = required<HTMLDivElement>('health-fill');
const status = required<HTMLElement>('status');
const toast = required<HTMLElement>('toast');
const rhythmNote = required<HTMLElement>('rhythm-note');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#17120f');
scene.fog = new THREE.Fog('#17120f', 28, 54);
const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 90);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
viewport.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight('#fff1d7', '#423329', 2.2));
const sun = new THREE.DirectionalLight('#ffe2ac', 3.1);
sun.position.set(-10, 18, 9);
sun.castShadow = true;
scene.add(sun);

createArena();
const player = createHuaso();
scene.add(player);
const keys = new Set<string>();
const enemyViews = new Map<string, EnemyView>();
const projectiles: Projectile[] = [];
const shotGeometry = new THREE.SphereGeometry(0.16, 8, 6);
const shotMaterial = new THREE.MeshStandardMaterial({ color: '#f3a363', emissive: '#7b2815', emissiveIntensity: 1.5 });
const attackGeometry = new THREE.RingGeometry(0.3, HORDE_BALANCE.attackRange, 36);
attackGeometry.rotateX(-Math.PI / 2);
const attackMarker = new THREE.Mesh(attackGeometry, new THREE.MeshBasicMaterial({ color: '#f2bd74', transparent: true, opacity: 0, side: THREE.DoubleSide }));
attackMarker.position.y = 0.08;
scene.add(attackMarker);

let horde = new HordeLevelOne();
let elapsed = 0;
let previousTime = 0;
let playerHealth = HORDE_BALANCE.playerHealth;
let invulnerableFor = 0;
let attackCooldown = 0;
let dashCooldown = 0;
let dashFor = 0;
let alive = true;
let score = 0;
let strongBeatWindow = 0;
let lastRhythmShot = -10;
let toastTimer = 0;
let requestId = 0;
let director = new HordeDirector(spawnEnemy);
let disposed = false;
const unsubscribers: Unsubscribe[] = [
  eventBus.on('OnEnemyDestroyed', ({ enemyId }) => {
    const view = enemyViews.get(enemyId);
    if (!view) return;
    scene.remove(view.root);
    disposeObject(view.root);
    enemyViews.delete(enemyId);
    score += 1;
    showToast('¡Zapateo! Enemigo derribado');
  }),
  eventBus.on('OnBeat', ({ isStrongBeat, subdivisionIndex }) => {
    if (HORDE_BALANCE.rhythm.source === 'strong-beat' && isStrongBeat && subdivisionIndex === HORDE_BALANCE.rhythm.strongBeatSubdivision) {
      strongBeatWindow = 0.22;
    }
  }),
];

if (HORDE_BALANCE.rhythm.source === 'strong-beat') {
  rhythmNote.textContent = 'Disparos en pulsos fuertes · conecta el reloj musical por OnBeat';
}

document.getElementById('restart')?.addEventListener('click', resetRun);
window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', (event) => keys.delete(event.code));
window.addEventListener('blur', () => keys.clear());
window.addEventListener('resize', resize);
window.addEventListener('beforeunload', dispose, { once: true });
requestId = requestAnimationFrame(frame);

interface EnemyView {
  root: THREE.Group;
  kind: LevelOneEnemyKind;
  fireTimer: number;
  telegraph: number;
  warning: THREE.Mesh;
}
interface Projectile { mesh: THREE.Mesh; velocity: THREE.Vector3 }

function spawnEnemy(kind: LevelOneEnemyKind): void {
  const index = enemyViews.size;
  const angle = (index * 2.399 + elapsed * 0.42) % (Math.PI * 2);
  const radius = HORDE_BALANCE.spawnRadius - (index % 2) * 1.2;
  const position = { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius };
  const enemy = horde.spawnEnemy(kind, position);
  const root = createOfficer(kind);
  root.position.set(position.x, 0, position.z);
  const warning = new THREE.Mesh(
    new THREE.RingGeometry(0.38, 0.54, 24),
    new THREE.MeshBasicMaterial({ color: '#ff8554', transparent: true, opacity: 0, side: THREE.DoubleSide }),
  );
  warning.rotation.x = -Math.PI / 2;
  warning.position.y = 0.09;
  root.add(warning);
  scene.add(root);
  enemyViews.set(enemy.id, { root, kind, fireTimer: 1.1 + Math.random() * 1.4, telegraph: -1, warning });
}

function frame(now: number): void {
  if (disposed) return;
  const dt = Math.min(0.04, previousTime === 0 ? 0 : (now - previousTime) / 1000);
  previousTime = now;
  elapsed += dt;
  strongBeatWindow = Math.max(0, strongBeatWindow - dt);
  attackCooldown = Math.max(0, attackCooldown - dt);
  dashCooldown = Math.max(0, dashCooldown - dt);
  invulnerableFor = Math.max(0, invulnerableFor - dt);
  dashFor = Math.max(0, dashFor - dt);

  if (alive) {
    movePlayer(dt);
    director.update(dt, enemyViews.size);
    updateEnemies(dt);
    updateProjectiles(dt);
  }
  updateCamera();
  updateHud();
  renderer.render(scene, camera);
  requestId = requestAnimationFrame(frame);
}

function movePlayer(dt: number): void {
  const move = new THREE.Vector3(
    Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft')),
    0,
    Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp')),
  );
  if (move.lengthSq() > 0) {
    move.normalize();
    const speed = dashFor > 0 ? HORDE_BALANCE.dashSpeed : 6.5;
    player.position.addScaledVector(move, speed * dt);
    player.rotation.y = Math.atan2(-move.x, -move.z);
  }
  const distance = Math.hypot(player.position.x, player.position.z);
  const safeRadius = HORDE_BALANCE.arenaRadius - 1;
  if (distance > safeRadius) { player.position.x *= safeRadius / distance; player.position.z *= safeRadius / distance; }
  player.position.y = 0;
}

function updateEnemies(dt: number): void {
  for (const view of enemyViews.values()) {
    const dx = player.position.x - view.root.position.x;
    const dz = player.position.z - view.root.position.z;
    const distance = Math.max(0.001, Math.hypot(dx, dz));
    view.root.rotation.y = Math.atan2(-dx, -dz);
    if (distance > 7.5) {
      view.root.position.x += (dx / distance) * HORDE_BALANCE.enemySpeed * dt;
      view.root.position.z += (dz / distance) * HORDE_BALANCE.enemySpeed * dt;
    }

    if (view.telegraph >= 0) {
      view.telegraph -= dt;
      view.warning.material.opacity = 0.35 + Math.sin(elapsed * 16) * 0.2;
      const rhythmReady = HORDE_BALANCE.rhythm.source === 'timer' || (strongBeatWindow > 0 && elapsed - lastRhythmShot >= HORDE_BALANCE.rhythm.minimumSecondsBetweenShots);
      if (view.telegraph <= 0 && rhythmReady) {
        fireAtPlayer(view, dx, dz, distance);
        view.telegraph = -1;
        view.warning.material.opacity = 0;
      }
    } else {
      view.fireTimer -= dt;
      if (view.fireTimer <= 0) {
        view.telegraph = 0.65;
        view.warning.material.opacity = 0.4;
      }
    }
  }
}

function fireAtPlayer(view: EnemyView, dx: number, dz: number, distance: number): void {
  const direction = new THREE.Vector3(dx / distance, 0, dz / distance);
  const mesh = new THREE.Mesh(shotGeometry, shotMaterial);
  mesh.position.set(view.root.position.x, 1.05, view.root.position.z);
  scene.add(mesh);
  projectiles.push({ mesh, velocity: direction.multiplyScalar(HORDE_BALANCE.projectileSpeed) });
  view.fireTimer = HORDE_BALANCE.enemyShotEverySeconds + Math.random() * 0.65;
  lastRhythmShot = elapsed;
  strongBeatWindow = 0;
}

function updateProjectiles(dt: number): void {
  for (let index = projectiles.length - 1; index >= 0; index -= 1) {
    const projectile = projectiles[index];
    projectile.mesh.position.addScaledVector(projectile.velocity, dt);
    const dx = projectile.mesh.position.x - player.position.x;
    const dz = projectile.mesh.position.z - player.position.z;
    if (dx * dx + dz * dz < 0.68 && invulnerableFor <= 0 && dashFor <= 0) {
      playerHealth = Math.max(0, playerHealth - HORDE_BALANCE.projectileDamage);
      invulnerableFor = HORDE_BALANCE.playerHitInvulnerabilitySeconds;
      showToast('¡Te llegó un disparo! Sigue moviéndote');
      if (playerHealth === 0) {
        alive = false;
        director.finish();
        status.textContent = `Fin de la partida · sobreviviste hasta la oleada ${director.snapshot.wave}.`;
      }
      removeProjectile(index);
    } else if (Math.hypot(projectile.mesh.position.x, projectile.mesh.position.z) > HORDE_BALANCE.arenaRadius + 3) {
      removeProjectile(index);
    }
  }
}

function removeProjectile(index: number): void {
  scene.remove(projectiles[index].mesh);
  projectiles.splice(index, 1);
}

function onKeyDown(event: KeyboardEvent): void {
  if (['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft','ShiftRight'].includes(event.code)) event.preventDefault();
  if (keys.has(event.code) || !alive) return;
  keys.add(event.code);
  if (event.code === 'Space' && attackCooldown === 0) attack();
  if ((event.code === 'ShiftLeft' || event.code === 'ShiftRight') && dashCooldown === 0) {
    if (!keys.has('KeyW') && !keys.has('KeyA') && !keys.has('KeyS') && !keys.has('KeyD')) {
      player.position.z -= 2.1;
    }
    dashFor = HORDE_BALANCE.dashDurationSeconds;
    dashCooldown = HORDE_BALANCE.dashCooldownSeconds;
  }
}

function attack(): void {
  attackCooldown = HORDE_BALANCE.attackCooldownSeconds;
  attackMarker.position.set(player.position.x, 0.08, player.position.z);
  (attackMarker.material as THREE.MeshBasicMaterial).opacity = 0.62;
  window.setTimeout(() => { if (!disposed) (attackMarker.material as THREE.MeshBasicMaterial).opacity = 0; }, 160);
  eventBus.emit('OnBasicStepAttack', {
    step: 'Zapateo', judgement: 'GOOD', position: { x: player.position.x, z: player.position.z },
  });
}

function updateCamera(): void {
  const target = new THREE.Vector3(player.position.x, 0, player.position.z);
  camera.position.lerp(new THREE.Vector3(target.x + 0.5, 22, target.z + 25), 0.06);
  camera.lookAt(target.x, 0.4, target.z);
}

function updateHud(): void {
  const wave = director.snapshot;
  waveLabel.textContent = `Oleada ${wave.wave}`;
  waveCount.textContent = wave.breakSecondsRemaining > 0
    ? `Plaza despejada · siguiente en ${Math.ceil(wave.breakSecondsRemaining)} s`
    : `Enemigos ${enemyViews.size} activos · ${wave.spawned} / ${wave.total} enviados`;
  healthValue.textContent = `${playerHealth}%`;
  healthFill.style.width = `${playerHealth}%`;
  if (alive && wave.breakSecondsRemaining === 0) status.textContent = `Derribados: ${score} · máximo ${HORDE_BALANCE.maximumAlive} enemigos a la vez.`;
}

function resetRun(): void {
  horde.dispose();
  for (const view of enemyViews.values()) { scene.remove(view.root); disposeObject(view.root); }
  enemyViews.clear();
  for (const projectile of projectiles) scene.remove(projectile.mesh);
  projectiles.length = 0;
  horde = new HordeLevelOne();
  director = new HordeDirector(spawnEnemy);
  player.position.set(0, 0, 0);
  playerHealth = HORDE_BALANCE.playerHealth;
  score = 0;
  elapsed = 0;
  previousTime = 0;
  invulnerableFor = attackCooldown = dashCooldown = dashFor = 0;
  alive = true;
  status.textContent = 'Muévete, esquiva y baila para despejar la plaza.';
}

function showToast(message: string): void {
  toast.textContent = message;
  toast.classList.add('visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 1100);
}

function createArena(): void {
  const ground = new THREE.Mesh(new THREE.CircleGeometry(HORDE_BALANCE.arenaRadius, 64), new THREE.MeshStandardMaterial({ color: '#927b59', roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(5, 48), new THREE.MeshStandardMaterial({ color: '#c5a477', roughness: 1 }));
  plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.02; scene.add(plaza);
  for (const [radius, color] of [[1.3,'#a8513a'],[1.55,'#3e7181'],[HORDE_BALANCE.arenaRadius - 0.4,'#684a35']] as const) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, radius > 10 ? 0.2 : 0.035, 6, 64), new THREE.MeshStandardMaterial({ color, roughness: 0.8 }));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.05; scene.add(ring);
  }
  for (let i = 0; i < 16; i += 1) {
    const angle = i / 16 * Math.PI * 2;
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.25, 0.35), new THREE.MeshStandardMaterial({ color: i % 2 ? '#8c5739' : '#bd9a68' }));
    post.position.set(Math.cos(angle) * 20.3, 0.62, Math.sin(angle) * 20.3); post.castShadow = true; scene.add(post);
  }
}

function createHuaso(): THREE.Group {
  const root = new THREE.Group();
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.42, 0.78, 7), new THREE.MeshStandardMaterial({ color: '#eee0c4', flatShading: true }));
  torso.position.y = 0.9; torso.castShadow = true; root.add(torso);
  const poncho = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.5, 0.32, 7, 1, true), new THREE.MeshStandardMaterial({ color: '#893e31', side: THREE.DoubleSide, flatShading: true }));
  poncho.position.y = 0.94; root.add(poncho);
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.27, 1), new THREE.MeshStandardMaterial({ color: '#c8865d', flatShading: true }));
  head.position.y = 1.47; root.add(head);
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.43, 0.11, 10), new THREE.MeshStandardMaterial({ color: '#39291e', flatShading: true }));
  hat.position.y = 1.73; root.add(hat);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.29, 0.22, 8), hat.material); crown.position.y = 1.88; root.add(crown);
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.065, 5, 9), new THREE.MeshStandardMaterial({ color: '#d58a45' }));
  scarf.rotation.x = Math.PI / 2; scarf.position.y = 1.26; root.add(scarf);
  return root;
}

function createOfficer(kind: LevelOneEnemyKind): THREE.Group {
  const root = new THREE.Group();
  const isPatrol = kind === 'patrulla-a-pie';
  const uniform = new THREE.MeshStandardMaterial({ color: isPatrol ? '#344657' : '#405540', flatShading: true });
  const skin = new THREE.MeshStandardMaterial({ color: '#bd8967', flatShading: true });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.72, 0.34), uniform); body.position.y = 1.05; body.castShadow = true; root.add(body);
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.23, 1), skin); head.position.y = 1.58; root.add(head);
  const hat = new THREE.Mesh(isPatrol ? new THREE.SphereGeometry(0.26, 8, 5) : new THREE.CylinderGeometry(0.2,0.22,0.12,7), uniform);
  hat.position.y = 1.84; root.add(hat);
  for (const side of [-1,1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.095,0.55,6), uniform); leg.position.set(side*0.15,0.3,0); root.add(leg);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.07,0.55,6), uniform); arm.position.set(side*0.36,1.13,-0.12); arm.rotation.z = side * -0.4; root.add(arm);
  }
  const rifle = new THREE.Mesh(new THREE.BoxGeometry(0.13,0.12,0.78), new THREE.MeshStandardMaterial({ color: '#252322', metalness: 0.35, roughness: 0.7 }));
  rifle.position.set(0.42,1.12,-0.47); root.add(rifle);
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.18,0.17,0.23), new THREE.MeshStandardMaterial({ color: '#60442d' }));
  stock.position.set(0.42,1.12,-0.12); root.add(stock);
  if (isPatrol) {
    const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.32,0.32,0.08,6), new THREE.MeshStandardMaterial({ color: '#67777a', metalness: 0.2 }));
    shield.position.set(-0.44,1.02,-0.12); shield.rotation.x = Math.PI/2; root.add(shield);
  }
  return root;
}

function resize(): void { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8)); }
function disposeObject(root: THREE.Object3D): void {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) material.dispose();
  });
}
function dispose(): void {
  disposed = true; cancelAnimationFrame(requestId); clearTimeout(toastTimer);
  window.removeEventListener('keydown', onKeyDown); window.removeEventListener('resize', resize);
  for (const unsubscribe of unsubscribers) unsubscribe();
  horde.dispose(); renderer.dispose();
}
function required<T extends HTMLElement>(id: string): T { const element = document.getElementById(id); if (!(element instanceof HTMLElement)) throw new Error(`Falta #${id} en preview.html`); return element as T; }
