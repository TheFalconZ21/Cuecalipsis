import * as THREE from 'three';
import './preview.css';
import { eventBus } from '../../core/EventBus';
import type { Unsubscribe } from '../../core/EventBus';
import type { CuecaStep, UpgradeChoice, Vector2XZ } from '../../core/GameContracts';
import type { LevelOneEnemyKind } from './HordeLevelOne';
import { HordeLevelOne } from './HordeLevelOne';
import { HORDE_BALANCE, HordeDirector } from './HordeDirector';

const viewport = required<HTMLDivElement>('viewport');
const waveLabel = required<HTMLElement>('wave-label');
const waveCount = required<HTMLElement>('wave-count');
const healthValue = required<HTMLElement>('health-value');
const healthFill = required<HTMLDivElement>('health-fill');
const levelValue = required<HTMLElement>('level-value');
const experienceValue = required<HTMLElement>('experience-value');
const experienceFill = required<HTMLDivElement>('experience-fill');
const nextStepLabel = required<HTMLElement>('next-step-label');
const skillValue = required<HTMLElement>('skill-value');
const skillFill = required<HTMLDivElement>('skill-fill');
const zapateoLevelLabel = required<HTMLElement>('zapateo-level');
const escobilladoLevelLabel = required<HTMLElement>('escobillado-level');
const levelUpOverlay = required<HTMLElement>('level-up-overlay');
const choiceLevel = required<HTMLElement>('choice-level');
const upgradeChoices = required<HTMLDivElement>('upgrade-choices');
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
const huasoRig = createHuaso();
const player = huasoRig.root;
scene.add(player);
const keys = new Set<string>();
const enemyViews = new Map<string, EnemyView>();
const projectiles: Projectile[] = [];
const shotGeometry = new THREE.SphereGeometry(0.16, 8, 6);
const shotMaterial = new THREE.MeshStandardMaterial({ color: '#f3a363', emissive: '#7b2815', emissiveIntensity: 1.5 });
const attackGeometry = new THREE.RingGeometry(0.3, HORDE_BALANCE.attackRange, 36);
attackGeometry.rotateX(-Math.PI / 2);
const attackMaterial = new THREE.MeshBasicMaterial({ color: '#f2bd74', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
const attackMarker = new THREE.Mesh(attackGeometry, attackMaterial);
attackMarker.position.y = 0.08;
scene.add(attackMarker);
const sweepGeometry = new THREE.CircleGeometry(
  HORDE_BALANCE.attackRange,
  36,
  Math.PI / 2 - HORDE_BALANCE.escobilladoHalfAngleRadians,
  HORDE_BALANCE.escobilladoHalfAngleRadians * 2,
);
sweepGeometry.rotateX(-Math.PI / 2);
const sweepMaterial = new THREE.MeshBasicMaterial({ color: '#ffe27a', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
const sweepMarker = new THREE.Mesh(sweepGeometry, sweepMaterial);
sweepMarker.position.y = 0.085;
sweepMarker.visible = false;
scene.add(sweepMarker);
const sweepOutlinePoints: THREE.Vector3[] = [new THREE.Vector3(0, 0, 0)];
const outlineStart = Math.PI / 2 - HORDE_BALANCE.escobilladoHalfAngleRadians;
for (let index = 0; index <= 28; index += 1) {
  const angle = outlineStart + (index / 28) * HORDE_BALANCE.escobilladoHalfAngleRadians * 2;
  sweepOutlinePoints.push(new THREE.Vector3(Math.cos(angle) * HORDE_BALANCE.attackRange, Math.sin(angle) * HORDE_BALANCE.attackRange, 0));
}
sweepOutlinePoints.push(new THREE.Vector3(0, 0, 0));
const sweepOutlineGeometry = new THREE.BufferGeometry().setFromPoints(sweepOutlinePoints);
sweepOutlineGeometry.rotateX(-Math.PI / 2);
const sweepOutline = new THREE.Line(sweepOutlineGeometry, new THREE.LineBasicMaterial({ color: '#fff2bd', transparent: true, opacity: 0, depthWrite: false }));
sweepOutline.position.y = 0.1;
sweepOutline.visible = false;
scene.add(sweepOutline);

const vueltaShield = createVueltaShield();
player.add(vueltaShield);

let horde = new HordeLevelOne(eventBus, getAttackDirection);
let elapsed = 0;
let previousTime = 0;
let playerHealth: number = HORDE_BALANCE.playerHealth;
let invulnerableFor = 0;
let attackCooldown = 0;
let escobilladoCooldown = 0;
let dashCooldown = 0;
let dashFor = 0;
let alive = true;
let score = 0;
let playerLevel = 1;
let experience = 0;
let skillCharge = 0;
let levelUpPaused = false;
let upgradeLevels = { zapateo: 0, escobillado: 0, vuelta: 0 };
let vueltaActive = false;
let vueltaElapsed = 0;
let vueltaCooldown = 0;
let vueltaDuration: number = HORDE_BALANCE.vueltaDurationSeconds;
let vueltaRadius: number = HORDE_BALANCE.vueltaRadius;
let vueltaStartAngle = Math.PI;
const vueltaCenter = new THREE.Vector3();
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
    grantExperience(HORDE_BALANCE.experiencePerEnemy);
    showToast('Enemigo derribado · experiencia obtenida');
  }),
  eventBus.on('OnBasicStepAttack', ({ step, judgement, position }) => {
    nextStepLabel.textContent = step;
    skillCharge = Math.min(HORDE_BALANCE.skillChargeMaximum, skillCharge + (judgement === 'PERFECT'
      ? HORDE_BALANCE.skillChargePerfect
      : HORDE_BALANCE.skillChargeGood));
    if (skillCharge >= HORDE_BALANCE.skillChargeMaximum) unleashSuperior(step, position);
  }),
  eventBus.on('OnBeat', ({ isStrongBeat, subdivisionIndex }) => {
    if (HORDE_BALANCE.rhythm.source === 'strong-beat' && isStrongBeat && subdivisionIndex === HORDE_BALANCE.rhythm.strongBeatSubdivision) {
      strongBeatWindow = 0.22;
    }
  }),
  eventBus.on('OnLevelUpReady', ({ choices }) => showUpgradeChoices(choices)),
  eventBus.on('OnGamePauseChanged', ({ paused, reason }) => {
    if (reason !== 'LevelUp') return;
    levelUpPaused = paused;
    levelUpOverlay.hidden = !paused;
  }),
];

if (HORDE_BALANCE.rhythm.source === 'strong-beat') {
  rhythmNote.textContent = 'Disparos en pulsos fuertes · conecta el reloj musical por OnBeat';
}

document.getElementById('restart')?.addEventListener('click', resetRun);
upgradeChoices.addEventListener('click', handleUpgradeChoiceClick);
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
  warning: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
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
  const warning = new THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>(
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
  if (alive && !levelUpPaused) {
    elapsed += dt;
    strongBeatWindow = Math.max(0, strongBeatWindow - dt);
    attackCooldown = Math.max(0, attackCooldown - dt);
    escobilladoCooldown = Math.max(0, escobilladoCooldown - dt);
    dashCooldown = Math.max(0, dashCooldown - dt);
    vueltaCooldown = Math.max(0, vueltaCooldown - dt);
    invulnerableFor = Math.max(0, invulnerableFor - dt);
    dashFor = Math.max(0, dashFor - dt);

    if (vueltaActive) updateVuelta(dt);
    else movePlayer(dt);
    updateCuecaMotion(dt);
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
    if (dx * dx + dz * dz < 0.68) {
      if (vueltaActive) showToast('¡La vuelta desvió el disparo!');
      else if (invulnerableFor <= 0 && dashFor <= 0) {
        playerHealth = Math.max(0, playerHealth - HORDE_BALANCE.projectileDamage);
        invulnerableFor = HORDE_BALANCE.playerHitInvulnerabilitySeconds;
        showToast('¡Te llegó un disparo! Sigue moviéndote');
        if (playerHealth === 0) {
          alive = false;
          director.finish();
          status.textContent = `Fin de la partida · sobreviviste hasta la oleada ${director.snapshot.wave}.`;
        }
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
  if (levelUpPaused) return;
  if (['KeyW','KeyA','KeyS','KeyD','KeyE','KeyQ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft','ShiftRight'].includes(event.code)) event.preventDefault();
  if (keys.has(event.code) || !alive) return;
  keys.add(event.code);
  if (event.code === 'Space' && attackCooldown === 0 && !activeCuecaMove) attack();
  if (event.code === 'KeyE' && escobilladoCooldown === 0 && !activeCuecaMove) escobillado();
  if (event.code === 'KeyQ' && vueltaCooldown === 0 && !activeCuecaMove) startVuelta();
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
  startCuecaMove('Zapateo');
  zapateoVisualElapsed = 0;
  attackMarker.position.set(player.position.x, 0.08, player.position.z);
  attackMarker.scale.setScalar(HORDE_BALANCE.attackMarkerStartScale);
  attackMaterial.opacity = 0.82;
  attackMaterial.color.set('#f2bd74');
  attackVisualTargetScale = 1 + upgradeLevels.zapateo * HORDE_BALANCE.zapateoUpgradeRangeFactor;
  attackVisualDuration = HORDE_BALANCE.zapateoAnimationSeconds;
  attackMarker.visible = true;
  eventBus.emit('OnBasicStepAttack', {
    step: 'Zapateo', judgement: 'GOOD', position: { x: player.position.x, z: player.position.z },
  });
  showToast('¡Zapateo! Pisotón circular');
}

function escobillado(): void {
  escobilladoCooldown = HORDE_BALANCE.escobilladoCooldownSeconds;
  startCuecaMove('Escobillado');
  const direction = getAttackDirection('Escobillado')!;
  const attackPosition = {
    x: player.position.x + direction.x * HORDE_BALANCE.escobilladoOriginOffset,
    z: player.position.z + direction.z * HORDE_BALANCE.escobilladoOriginOffset,
  };
  sweepMarker.position.set(attackPosition.x, 0.07, attackPosition.z);
  sweepMarker.rotation.y = player.rotation.y;
  sweepMarker.scale.setScalar(HORDE_BALANCE.attackMarkerStartScale);
  escobilladoVisualElapsed = 0;
  sweepMaterial.opacity = 0.72;
  sweepMarker.geometry.dispose();
  sweepMarker.geometry = createSweepGeometry(getEscobilladoRange(), getEscobilladoHalfAngle());
  sweepOutline.position.set(attackPosition.x, 0.105, attackPosition.z);
  sweepOutline.rotation.y = player.rotation.y;
  sweepOutline.geometry.dispose();
  sweepOutline.geometry = createSweepOutlineGeometry(getEscobilladoRange(), getEscobilladoHalfAngle());
  sweepOutline.scale.setScalar(HORDE_BALANCE.attackMarkerStartScale);
  sweepVisualTargetScale = 1;
  sweepMaterial.color.set('#ffe27a');
  (sweepOutline.material as THREE.LineBasicMaterial).color.set('#fff2bd');
  (sweepOutline.material as THREE.LineBasicMaterial).opacity = 1;
  sweepOutline.visible = true;
  sweepMarker.visible = true;
  eventBus.emit('OnBasicStepAttack', {
    step: 'Escobillado', judgement: 'GOOD', position: attackPosition,
  });
  showToast('¡Escobillado! Barrido hacia donde miras');
}

function startVuelta(): void {
  const safeRadius = HORDE_BALANCE.arenaRadius - 1;
  const distanceFromCenter = Math.hypot(player.position.x, player.position.z);
  vueltaRadius = Math.min(HORDE_BALANCE.vueltaRadius, Math.max(HORDE_BALANCE.vueltaMinimumRadius, (safeRadius - distanceFromCenter) / 2));
  const right = new THREE.Vector2(Math.cos(player.rotation.y), -Math.sin(player.rotation.y));
  vueltaCenter.set(player.position.x + right.x * vueltaRadius, 0, player.position.z + right.y * vueltaRadius);
  vueltaStartAngle = Math.PI;
  vueltaElapsed = 0;
  vueltaDuration = HORDE_BALANCE.vueltaDurationSeconds + upgradeLevels.vuelta * HORDE_BALANCE.vueltaUpgradeDurationSeconds;
  vueltaActive = true;
  vueltaShield.visible = true;
  vueltaCooldown = HORDE_BALANCE.vueltaCooldownSeconds;
  startCuecaMove('Vuelta');
  showToast('¡Vuelta! Escudo activo durante la trayectoria circular');
}

function updateVuelta(dt: number): void {
  vueltaElapsed = Math.min(vueltaDuration, vueltaElapsed + dt);
  const progress = vueltaElapsed / vueltaDuration;
  const angle = vueltaStartAngle + Math.PI * 2 * progress;
  player.position.set(
    vueltaCenter.x + Math.cos(angle) * vueltaRadius,
    0,
    vueltaCenter.z + Math.sin(angle) * vueltaRadius,
  );
  const tangentX = -Math.sin(angle);
  const tangentZ = Math.cos(angle);
  player.rotation.y = Math.atan2(-tangentX, -tangentZ);
  if (progress < 1) return;

  vueltaActive = false;
  vueltaShield.visible = false;
  if (activeCuecaMove === 'Vuelta') activeCuecaMove = null;
  resetHuasoPose();
}

type CuecaMove = 'Zapateo' | 'Escobillado' | 'Vuelta';
let activeCuecaMove: CuecaMove | null = null;
let cuecaMoveElapsed = 0;
let cuecaMoveDuration = 0;
let zapateoVisualElapsed = 0;
let escobilladoVisualElapsed = 0;
let attackVisualTargetScale = 1;
let attackVisualDuration: number = HORDE_BALANCE.zapateoAnimationSeconds;
let sweepVisualTargetScale = 1;

function startCuecaMove(move: CuecaMove): void {
  activeCuecaMove = move;
  cuecaMoveElapsed = 0;
  cuecaMoveDuration = move === 'Zapateo'
    ? HORDE_BALANCE.zapateoAnimationSeconds
    : move === 'Escobillado'
      ? HORDE_BALANCE.escobilladoAnimationSeconds
      : vueltaDuration;
}

function getAttackDirection(step: CuecaStep): Vector2XZ | undefined {
  if (step !== 'Escobillado') return undefined;
  return { x: -Math.sin(player.rotation.y), z: -Math.cos(player.rotation.y) };
}

function getEscobilladoRange(): number {
  return HORDE_BALANCE.attackRange * (1 + upgradeLevels.escobillado * HORDE_BALANCE.escobilladoUpgradeRangeFactor);
}

function getEscobilladoHalfAngle(): number {
  return HORDE_BALANCE.escobilladoHalfAngleRadians + upgradeLevels.escobillado * HORDE_BALANCE.escobilladoUpgradeWidthRadians;
}

function createSweepGeometry(radius: number, halfAngle: number): THREE.CircleGeometry {
  const geometry = new THREE.CircleGeometry(radius, 36, Math.PI / 2 - halfAngle, halfAngle * 2);
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

function createSweepOutlineGeometry(radius: number, halfAngle: number): THREE.BufferGeometry {
  const points: THREE.Vector3[] = [new THREE.Vector3(0, 0, 0)];
  const start = Math.PI / 2 - halfAngle;
  for (let index = 0; index <= 32; index += 1) {
    const angle = start + (index / 32) * halfAngle * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
  }
  points.push(new THREE.Vector3(0, 0, 0));
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

function updateCuecaMotion(dt: number): void {
  if (activeCuecaMove) {
    cuecaMoveElapsed = Math.min(cuecaMoveDuration, cuecaMoveElapsed + dt);
    const progress = cuecaMoveDuration > 0 ? cuecaMoveElapsed / cuecaMoveDuration : 1;
    const beatPhase = progress * Math.PI * 4;

    if (activeCuecaMove === 'Zapateo') {
      const leftAccent = Math.max(0, Math.sin(beatPhase));
      const rightAccent = Math.max(0, -Math.sin(beatPhase));
      huasoRig.leftLeg.position.y = 0.65 + leftAccent * 0.12;
      huasoRig.rightLeg.position.y = 0.65 + rightAccent * 0.12;
      huasoRig.leftLeg.rotation.x = -leftAccent * 0.24;
      huasoRig.rightLeg.rotation.x = -rightAccent * 0.24;
      const bodyAccent = Math.max(leftAccent, rightAccent);
      huasoRig.torso.position.y = 0.72 + bodyAccent * 0.045;
      huasoRig.torso.scale.y = 1 - bodyAccent * 0.035;
      huasoRig.leftArm.rotation.z = -0.14 - bodyAccent * 0.08;
      huasoRig.rightArm.rotation.z = 2.25 + bodyAccent * 0.04;
    } else if (activeCuecaMove === 'Escobillado') {
      const sweep = Math.sin(beatPhase);
      const sideSweep = Math.abs(sweep) * HORDE_BALANCE.escobilladoLegMaxRadians;
      huasoRig.leftLeg.rotation.z = -sideSweep;
      huasoRig.rightLeg.rotation.z = sideSweep;
      huasoRig.leftLeg.rotation.x = -Math.max(0, sweep) * 0.12;
      huasoRig.rightLeg.rotation.x = -Math.max(0, -sweep) * 0.12;
      huasoRig.torso.rotation.y = sweep * 0.12;
      huasoRig.torso.position.y = 0.72 + Math.abs(sweep) * 0.025;
      huasoRig.leftArm.rotation.z = -0.24 - sweep * 0.2;
      huasoRig.rightArm.rotation.z = 2.25 + sweep * 0.08;
    } else {
      const turnAccent = Math.sin(beatPhase);
      huasoRig.leftLeg.rotation.z = -turnAccent * 0.12;
      huasoRig.rightLeg.rotation.z = turnAccent * 0.12;
      huasoRig.torso.rotation.z = Math.sin(beatPhase * 0.5) * 0.08;
      huasoRig.leftArm.rotation.z = -0.24 + turnAccent * 0.12;
      huasoRig.rightArm.rotation.z = 2.25 + turnAccent * 0.08;
    }

    if (progress >= 1) {
      activeCuecaMove = null;
      resetHuasoPose();
    }
  }

  if (attackMarker.visible) {
    const progress = Math.min(1, (zapateoVisualElapsed += dt) / attackVisualDuration);
    attackMarker.scale.setScalar(HORDE_BALANCE.attackMarkerStartScale + attackVisualTargetScale * progress);
    attackMaterial.opacity = 0.82 * (1 - progress);
    if (progress >= 1) {
      attackMarker.visible = false;
      attackMaterial.color.set('#f2bd74');
    }
  }
  if (sweepMarker.visible) {
    const progress = Math.min(1, (escobilladoVisualElapsed += dt) / HORDE_BALANCE.escobilladoAnimationSeconds);
    const scale = HORDE_BALANCE.attackMarkerStartScale + progress * sweepVisualTargetScale;
    sweepMarker.scale.setScalar(scale);
    sweepOutline.scale.setScalar(scale);
    sweepMaterial.opacity = 0.72 * (1 - progress);
    (sweepOutline.material as THREE.LineBasicMaterial).opacity = 1 - progress;
    if (progress >= 1) {
      sweepMarker.visible = false;
      sweepOutline.visible = false;
    }
  }
  updateHandkerchief();
}

function resetHuasoPose(): void {
  huasoRig.leftLeg.position.y = 0.65;
  huasoRig.rightLeg.position.y = 0.65;
  huasoRig.leftLeg.rotation.set(0, 0, 0);
  huasoRig.rightLeg.rotation.set(0, 0, 0);
  huasoRig.torso.position.set(0, 0.72, 0);
  huasoRig.torso.rotation.set(0, 0, 0);
  huasoRig.torso.scale.set(1, 1, 1);
  huasoRig.leftArm.rotation.set(0, 0, -0.14);
  huasoRig.rightArm.rotation.set(0, 0, 2.25);
  huasoRig.scarf.rotation.set(0, 0, 0);
  huasoRig.scarf.position.set(0, -0.55, 0);
}

function updateHandkerchief(): void {
  const phase = (elapsed / HORDE_BALANCE.scarfOrbitSeconds) * Math.PI * 2;
  const radius = HORDE_BALANCE.scarfOrbitRadius;
  huasoRig.scarf.position.set(radius * Math.sin(phase), -0.55, radius * HORDE_BALANCE.scarfOrbitDepthRatio * Math.sin(phase * 2));
  huasoRig.scarf.rotation.set(0, phase * 0.8, Math.sin(phase * 2) * 0.2);
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
  levelValue.textContent = `Nivel ${playerLevel}`;
  experienceValue.textContent = `${experience} / ${experienceThreshold()}`;
  experienceFill.style.width = `${Math.min(100, (experience / experienceThreshold()) * 100)}%`;
  skillValue.textContent = `${Math.round(skillCharge * 100)}%`;
  skillFill.style.width = `${Math.min(100, skillCharge * 100)}%`;
  zapateoLevelLabel.textContent = `Zapateo ${upgradeLevels.zapateo === 0 ? 'base' : `Niv. ${upgradeLevels.zapateo}`}`;
  escobilladoLevelLabel.textContent = `Escobillado ${upgradeLevels.escobillado === 0 ? 'base' : `Niv. ${upgradeLevels.escobillado}`}`;
  if (alive && wave.breakSecondsRemaining === 0) status.textContent = `Derribados: ${score} · máximo ${HORDE_BALANCE.maximumAlive} enemigos a la vez.`;
}

function resetRun(): void {
  if (levelUpPaused) eventBus.emit('OnGamePauseChanged', { paused: false, reason: 'LevelUp' });
  eventBus.emit('OnGameReset', {});
  keys.clear();
  horde.dispose();
  for (const view of enemyViews.values()) { scene.remove(view.root); disposeObject(view.root); }
  enemyViews.clear();
  for (const projectile of projectiles) scene.remove(projectile.mesh);
  projectiles.length = 0;
  horde = new HordeLevelOne(eventBus, getAttackDirection);
  director = new HordeDirector(spawnEnemy);
  player.position.set(0, 0, 0);
  playerHealth = HORDE_BALANCE.playerHealth;
  score = 0;
  playerLevel = 1;
  experience = 0;
  skillCharge = 0;
  upgradeLevels = { zapateo: 0, escobillado: 0, vuelta: 0 };
  horde.setUpgradeLevels(upgradeLevels);
  levelUpPaused = false;
  elapsed = 0;
  previousTime = 0;
  invulnerableFor = attackCooldown = escobilladoCooldown = dashCooldown = dashFor = 0;
  vueltaCooldown = vueltaElapsed = 0;
  vueltaDuration = HORDE_BALANCE.vueltaDurationSeconds;
  vueltaActive = false;
  vueltaShield.visible = false;
  activeCuecaMove = null;
  attackMarker.visible = false;
  sweepMarker.visible = sweepOutline.visible = false;
  levelUpOverlay.hidden = true;
  upgradeChoices.replaceChildren();
  resetHuasoPose();
  alive = true;
  status.textContent = 'Muévete, esquiva y baila para despejar la plaza.';
}

function showToast(message: string): void {
  toast.textContent = message;
  toast.classList.add('visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 1100);
}

function experienceThreshold(): number {
  return HORDE_BALANCE.experienceBaseThreshold + (playerLevel - 1) * HORDE_BALANCE.experienceThresholdPerLevel;
}

function grantExperience(amount: number): void {
  experience += amount;
  if (experience < experienceThreshold() || levelUpPaused) return;
  experience -= experienceThreshold();
  playerLevel += 1;
  const choices = buildUpgradeChoices();
  eventBus.emit('OnLevelUpReady', { choices });
  eventBus.emit('OnGamePauseChanged', { paused: true, reason: 'LevelUp' });
}

function buildUpgradeChoices(): [UpgradeChoice, UpgradeChoice, UpgradeChoice] {
  const definitions: Array<{ id: 'zapateo' | 'escobillado' | 'vuelta'; name: string; description: string }> = [
    { id: 'zapateo', name: 'Zapateo sísmico', description: 'Aumenta el daño y el radio del pisotón.' },
    { id: 'escobillado', name: 'Escobillado envolvente', description: 'Alarga el barrido y amplía su arco frontal.' },
    { id: 'vuelta', name: 'Vuelta protectora', description: 'Mantiene un poco más el escudo mientras completas el círculo.' },
  ];
  return definitions.map(({ id, name, description }) => {
    const currentLevel = upgradeLevels[id];
    const capped = currentLevel >= HORDE_BALANCE.maximumUpgradeLevel;
    return {
      id,
      name: capped ? `${name} · al máximo` : name,
      description: capped ? 'Esta mejora ya alcanzó su nivel máximo.' : description,
      currentLevel,
      nextLevel: capped ? currentLevel : currentLevel + 1,
    };
  }) as [UpgradeChoice, UpgradeChoice, UpgradeChoice];
}

function showUpgradeChoices(choices: [UpgradeChoice, UpgradeChoice, UpgradeChoice]): void {
  choiceLevel.textContent = String(playerLevel);
  upgradeChoices.replaceChildren();
  for (const choice of choices) {
    const button = document.createElement('button');
    button.className = 'upgrade-choice';
    button.type = 'button';
    button.dataset.upgrade = choice.id;
    button.disabled = choice.nextLevel === choice.currentLevel;
    button.innerHTML = `<strong>${choice.name}</strong><small>Nivel ${choice.currentLevel} → ${choice.nextLevel}<br>${choice.description}</small>`;
    upgradeChoices.appendChild(button);
  }
}

function handleUpgradeChoiceClick(event: MouseEvent): void {
  if (!levelUpPaused || !(event.target instanceof HTMLElement)) return;
  const button = event.target.closest<HTMLButtonElement>('button[data-upgrade]');
  if (!button || button.disabled) return;
  const id = button.dataset.upgrade;
  if (id === 'zapateo') upgradeLevels.zapateo = Math.min(HORDE_BALANCE.maximumUpgradeLevel, upgradeLevels.zapateo + 1);
  else if (id === 'escobillado') upgradeLevels.escobillado = Math.min(HORDE_BALANCE.maximumUpgradeLevel, upgradeLevels.escobillado + 1);
  else if (id === 'vuelta') upgradeLevels.vuelta = Math.min(HORDE_BALANCE.maximumUpgradeLevel, upgradeLevels.vuelta + 1);
  else return;

  horde.setUpgradeLevels(upgradeLevels);
  eventBus.emit('OnGamePauseChanged', { paused: false, reason: 'LevelUp' });
  showToast(`Mejora aplicada · ${button.querySelector('strong')?.textContent ?? 'Cueca'}`);
  if (experience >= experienceThreshold()) grantExperience(0);
}

function unleashSuperior(step: CuecaStep, position: Vector2XZ): void {
  const nextStep = nextCuecaStep(step);
  skillCharge = 0;
  eventBus.emit('OnSuperiorStepUnleashed', { completedStep: step, nextStep, position });
  if (step === 'Escobillado') {
    sweepMarker.position.set(position.x, 0.09, position.z);
    sweepMarker.rotation.y = player.rotation.y;
    sweepMarker.geometry.dispose();
    sweepMarker.geometry = createSweepGeometry(getEscobilladoRange() * HORDE_BALANCE.superiorRangeMultiplier, HORDE_BALANCE.superiorEscobilladoHalfAngleRadians);
    sweepOutline.geometry.dispose();
    sweepOutline.geometry = createSweepOutlineGeometry(getEscobilladoRange() * HORDE_BALANCE.superiorRangeMultiplier, HORDE_BALANCE.superiorEscobilladoHalfAngleRadians);
    sweepOutline.position.copy(sweepMarker.position);
    sweepOutline.rotation.y = player.rotation.y;
    sweepVisualTargetScale = 1;
    sweepMarker.scale.setScalar(HORDE_BALANCE.attackMarkerStartScale);
    sweepOutline.scale.setScalar(HORDE_BALANCE.attackMarkerStartScale);
    sweepMaterial.color.set('#fff0a0');
    sweepMaterial.opacity = 0.9;
    (sweepOutline.material as THREE.LineBasicMaterial).opacity = 1;
    sweepMarker.visible = sweepOutline.visible = true;
    escobilladoVisualElapsed = 0;
  } else {
    attackMarker.position.set(position.x, 0.095, position.z);
    attackMarker.scale.setScalar(HORDE_BALANCE.attackMarkerStartScale);
    attackVisualTargetScale = HORDE_BALANCE.superiorRangeMultiplier;
    attackVisualDuration = HORDE_BALANCE.superiorAnimationSeconds;
    attackMaterial.color.set('#fff0a0');
    attackMaterial.opacity = 0.95;
    attackMarker.visible = true;
    zapateoVisualElapsed = 0;
  }
  nextStepLabel.textContent = nextStep;
  showToast(`¡${step} superior! Golpe de gran alcance`);
}

function nextCuecaStep(step: CuecaStep): CuecaStep {
  const sequence: CuecaStep[] = ['MediaLuna', 'Escobillado', 'Zapateo', 'Remate'];
  return sequence[(sequence.indexOf(step) + 1) % sequence.length];
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

function createVueltaShield(): THREE.Group {
  const shield = new THREE.Group();
  shield.visible = false;
  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(0.78, 16, 12),
    new THREE.MeshBasicMaterial({ color: '#69d4d4', transparent: true, opacity: 0.16, wireframe: true, depthWrite: false }),
  );
  shell.position.y = 0.88;
  shell.scale.set(0.9, 1.28, 0.9);
  shield.add(shell);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.82, 0.045, 6, 36),
    new THREE.MeshBasicMaterial({ color: '#8ce3dc', transparent: true, opacity: 0.95, depthWrite: false }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.08;
  shield.add(ring);
  return shield;
}

interface HuasoRig {
  root: THREE.Group;
  torso: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  scarf: THREE.Group;
}

function createHuaso(): HuasoRig {
  const root = new THREE.Group();
  const trouserMaterial = new THREE.MeshStandardMaterial({ color: '#49372a', flatShading: true });
  const bootMaterial = new THREE.MeshStandardMaterial({ color: '#26201c', flatShading: true });
  const shirtMaterial = new THREE.MeshStandardMaterial({ color: '#eee0c4', flatShading: true });
  const ponchoMaterial = new THREE.MeshStandardMaterial({ color: '#893e31', side: THREE.DoubleSide, flatShading: true });
  const skinMaterial = new THREE.MeshStandardMaterial({ color: '#c8865d', flatShading: true });
  const hatMaterial = new THREE.MeshStandardMaterial({ color: '#39291e', flatShading: true });
  const scarfMaterial = new THREE.MeshStandardMaterial({ color: '#d58a45', side: THREE.DoubleSide, flatShading: true });

  const leftLeg = createCuecaLeg(-0.17, trouserMaterial, bootMaterial);
  const rightLeg = createCuecaLeg(0.17, trouserMaterial, bootMaterial);
  root.add(leftLeg, rightLeg);

  const torso = new THREE.Group();
  torso.position.y = 0.72;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.42, 0.78, 7), shirtMaterial);
  body.position.y = 0.25; body.castShadow = true; torso.add(body);
  const poncho = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.5, 0.32, 7, 1, true), ponchoMaterial);
  poncho.position.y = 0.27; poncho.castShadow = true; torso.add(poncho);
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.27, 1), skinMaterial);
  head.position.y = 0.75; head.castShadow = true; torso.add(head);
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.43, 0.11, 10), hatMaterial);
  hat.position.y = 1.01; hat.castShadow = true; torso.add(hat);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.29, 0.22, 8), hatMaterial);
  crown.position.y = 1.16; torso.add(crown);

  const neckerchief = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.065, 5, 8), scarfMaterial);
  neckerchief.rotation.x = Math.PI / 2;
  neckerchief.position.y = 0.61;
  torso.add(neckerchief);

  const leftArm = createCuecaArm(-1, shirtMaterial);
  const rightArm = createCuecaArm(1, shirtMaterial);
  rightArm.rotation.z = 2.25;
  const scarf = createHandkerchief(scarfMaterial);
  scarf.position.set(0, -0.55, 0);
  rightArm.add(scarf);
  torso.add(leftArm, rightArm);
  root.add(torso);
  return { root, torso, leftLeg, rightLeg, leftArm, rightArm, scarf };
}

function createCuecaLeg(side: number, trousers: THREE.Material, boots: THREE.Material): THREE.Group {
  const pivot = new THREE.Group();
  pivot.position.set(side * 0.17, 0.65, 0);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.105, 0.52, 6), trousers);
  leg.position.y = -0.26; leg.castShadow = true; pivot.add(leg);
  const boot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.32), boots);
  boot.position.set(0, -0.55, -0.055); boot.castShadow = true; pivot.add(boot);
  return pivot;
}

function createCuecaArm(side: -1 | 1, shirt: THREE.Material): THREE.Group {
  const pivot = new THREE.Group();
  pivot.position.set(side * 0.36, 1.08, 0);
  pivot.rotation.z = side * -0.14;
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.54, 6), shirt);
  arm.position.y = -0.24; arm.castShadow = true; pivot.add(arm);
  const hand = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 0), new THREE.MeshStandardMaterial({ color: '#c8865d', flatShading: true }));
  hand.position.y = -0.51; pivot.add(hand);
  return pivot;
}

function createHandkerchief(material: THREE.Material): THREE.Group {
  const handkerchief = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-0.09, 0);
  shape.lineTo(0.09, 0);
  shape.lineTo(0.3, -0.34);
  shape.lineTo(0.02, -0.66);
  shape.lineTo(-0.25, -0.36);
  shape.closePath();
  const cloth = new THREE.Mesh(new THREE.ShapeGeometry(shape), material);
  cloth.position.z = 0.015;
  cloth.castShadow = true;
  handkerchief.add(cloth);
  const hem = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.025, 0.025), new THREE.MeshStandardMaterial({ color: '#f4d99b', flatShading: true }));
  hem.position.set(0.01, -0.22, 0.035);
  handkerchief.add(hem);
  return handkerchief;
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
