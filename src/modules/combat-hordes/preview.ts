import * as THREE from 'three';
import './preview.css';
import { eventBus } from '../../core/EventBus';
import type { Unsubscribe } from '../../core/EventBus';
import type { CuecaStep, UpgradeChoice, Vector2XZ } from '../../core/GameContracts';
import type { LevelOneEnemyKind } from './HordeLevelOne';
import { HordeLevelOne } from './HordeLevelOne';
import { HORDE_BALANCE, HordeDirector } from './HordeDirector';
import { createChileanCompletoModel } from '../art-vfx-ui/ChileanCompletoModel';
import { createChileanEmpanadaModel, createChileanSopaipillaModel } from '../art-vfx-ui/ChileanStreetFoodModels';
import { createSunModel } from '../art-vfx-ui/SunModel';

const viewport = required<HTMLDivElement>('viewport');
const waveLabel = required<HTMLElement>('wave-label');
const waveCount = required<HTMLElement>('wave-count');
const healthValue = required<HTMLElement>('health-value');
const healthFill = required<HTMLDivElement>('health-fill');
const buffStatus = required<HTMLElement>('buff-status');
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
const sunRhythmOverlay = required<HTMLElement>('sun-rhythm-overlay');
const rhythmNotes = required<HTMLDivElement>('rhythm-notes');
const rhythmLane = required<HTMLDivElement>('rhythm-lane');
const rhythmFeedback = required<HTMLElement>('rhythm-feedback');
const sunScoreLabel = required<HTMLElement>('sun-score');
const sunHealthFill = required<HTMLElement>('sun-health-fill');

const scene = new THREE.Scene();
const enemyHealthFullColor = new THREE.Color('#ff3027');
const enemyHealthEmptyColor = new THREE.Color('#171313');
const foodGlowTexture = createFoodGlowTexture();
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
const sunEncounter = createSunModel();
sunEncounter.position.set(0, 12, -2);
sunEncounter.rotation.y = Math.PI;
sunEncounter.scale.setScalar(2.35);
sunEncounter.visible = false;
scene.add(sunEncounter);
const keys = new Set<string>();
const enemyViews = new Map<string, EnemyView>();
const projectiles: Projectile[] = [];
const foodPickups = new Map<string, FoodPickup>();
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
const buffAura = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.055, 8, 32), new THREE.MeshBasicMaterial({ color: '#95ca79', transparent: true, opacity: 0.9 }));
buffAura.rotation.x = -Math.PI / 2;
buffAura.position.y = 0.08;
buffAura.visible = false;
player.add(buffAura);

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
let playerLevel = 1;
let experience = 0;
let foodDropChance: number = HORDE_BALANCE.foodBaseDropChance;
let everDroppedFood = false;
let hasCompleteAppeared = false;
let completoSeconds = 0;
let empanadaSeconds = 0;
let skillCharge = 0;
let levelUpPaused = false;
let upgradeLevels = { zapateo: 0, escobillado: 0, vuelta: 0 };
type SongBuffId = 'la-senora-interesante' | 'baila-sin-cesar' | 'rin-rin-raja' | 'tangananica-tanganana' | 'dinosaurio-anacleto' | 'guacala' | 'mi-muneca-me-hablo' | 'arwrarwrirwrarwro';
const acquiredSongBuffs = new Set<SongBuffId>();
let growthStacks = 0;
let senoraSeconds = 0;
let decoyRoot: THREE.Group | null = null;
let rinRinSeconds = 0;
let rinRinCooldown = 0;
let tangananicaSide: 'left' | 'right' = 'right';
let guacalaCooldown = HORDE_BALANCE.guacalaIntervalSeconds;
let munecaRoot: THREE.Group | null = null;
let munecaCooldown = 0;
let zombieAllies: ZombieAlly[] = [];
let meteorStrikes: MeteorStrike[] = [];
let anacletoCooldown = 0;
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
let sunPhase = false;
let sunPhaseWon = false;
let sunEncounterStarted = false;
let sunEntrance = 0;
let rhythmStartedAt = 0;
let rhythmHits = 0;
let rhythmResolved = 0;
const rhythmOrbElements: HTMLDivElement[] = [];
const RHYTHM_BEAT_MS = 720; // provisional until connected to RhythmClock / final BPM
const RHYTHM_APPROACH_MS = 2200;
const RHYTHM_NOTE_COUNT = 8;
configureHordeBuffs();
const unsubscribers: Unsubscribe[] = [
  eventBus.on('OnEnemyDestroyed', ({ enemyId }) => {
    const view = enemyViews.get(enemyId);
    if (!view) return;
    scene.remove(view.root);
    disposeObject(view.root);
    enemyViews.delete(enemyId);
    director.onOfficerDefeated(enemyViews.size);
    growthStacks += 1;
    updatePlayerGrowthVisual();
    grantExperience(HORDE_BALANCE.experiencePerEnemy);
    showToast(`Enemigo derribado · tamaño +${Math.round(growthStacks * HORDE_BALANCE.growthPerOfficerKill * 100)}% · resistencia +${Math.round(growthStacks * HORDE_BALANCE.resistancePerOfficerKill * 100)}%`);
    maybeDropFood(enemyId, view.root.position);
  }),
  eventBus.on('OnEnemyDamaged', ({ enemyId, source, remainingHealth }) => {
    const view = enemyViews.get(enemyId);
    if (!view) return;
    updateEnemyHealthBar(view, remainingHealth);
    if (acquiredSongBuffs.has('baila-sin-cesar')) view.danceSeconds = HORDE_BALANCE.bailaDanceDurationSeconds;
    if (source === 'Arwrarwrirwrarwro' && Math.random() < HORDE_BALANCE.zombieInfectionChance) {
      view.infectionSeconds = HORDE_BALANCE.zombieInfectionDurationSeconds;
      view.infectionTick = HORDE_BALANCE.zombieInfectionTickSeconds;
      view.infected = true;
    }
    if (acquiredSongBuffs.has('rin-rin-raja') && rinRinCooldown <= 0 && source.startsWith('BasicStep:') && isBehindOfficer(view)) {
      rinRinSeconds = HORDE_BALANCE.rinRinBuffDurationSeconds;
      rinRinCooldown = HORDE_BALANCE.rinRinCooldownSeconds;
      invulnerableFor = Math.max(invulnerableFor, HORDE_BALANCE.rinRinInvulnerabilitySeconds);
      showToast('Rin Rin Raja · velocidad e invulnerabilidad');
    }
  }),
  eventBus.on('OnBasicStepAttack', ({ step, judgement, position }) => {
    nextStepLabel.textContent = step;
    skillCharge = Math.min(HORDE_BALANCE.skillChargeMaximum, skillCharge + (judgement === 'PERFECT'
      ? HORDE_BALANCE.skillChargePerfect
      : HORDE_BALANCE.skillChargeGood));
    if (skillCharge >= HORDE_BALANCE.skillChargeMaximum) unleashSuperior(step, position);
    if (munecaRoot && munecaCooldown <= 0) {
      munecaCooldown = HORDE_BALANCE.munecaAttackCooldownSeconds;
      const baseDamage = judgement === 'PERFECT' ? HORDE_BALANCE.perfectAttackDamage : HORDE_BALANCE.goodAttackDamage;
      horde.damageArea(position, 1.35, Math.max(1, Math.round(baseDamage * HORDE_BALANCE.munecaDamageMultiplier)), 'Mi muñeca me habló');
    }
  }),
  eventBus.on('OnBeat', ({ isStrongBeat, subdivisionIndex }) => {
    if (HORDE_BALANCE.rhythm.source === 'strong-beat' && isStrongBeat && subdivisionIndex === HORDE_BALANCE.rhythm.strongBeatSubdivision) {
      strongBeatWindow = 0.22;
    }
    if (acquiredSongBuffs.has('tangananica-tanganana') && subdivisionIndex === 0 && Math.random() < HORDE_BALANCE.tangananicaDirectionSwapChance) {
      tangananicaSide = tangananicaSide === 'left' ? 'right' : 'left';
    }
  }),
  eventBus.on('OnSuperiorStepUnleashed', ({ completedStep, position }) => {
    if (acquiredSongBuffs.has('la-senora-interesante')) summonSenoraDecoy();
    if (acquiredSongBuffs.has('dinosaurio-anacleto') && anacletoCooldown <= 0) summonAnacletoMeteor(position);
    if (completedStep === 'Remate') nextStepLabel.textContent = 'Remate';
  }),
  eventBus.on('OnLevelUpReady', ({ choices }) => showUpgradeChoices(choices)),
  eventBus.on('OnGamePauseChanged', ({ paused, reason }) => {
    if (reason !== 'LevelUp') return;
    levelUpPaused = paused;
    levelUpOverlay.hidden = !paused;
    if (paused) upgradeChoices.querySelector<HTMLButtonElement>('button[data-upgrade]:not(:disabled)')?.focus();
  }),
  eventBus.on('OnScaleTierChanged', () => clearBuffs()),
  eventBus.on('OnGameStateChanged', ({ current }) => {
    if (current === 'MainMenu' || current === 'CharacterSelect' || current === 'Victory' || current === 'GameOver') {
      clearBuffs();
      clearSongBuffObjects();
    }
  }),
];

if (HORDE_BALANCE.rhythm.source === 'strong-beat') {
  rhythmNote.textContent = 'Disparos en pulsos fuertes · conecta el reloj musical por OnBeat';
}

document.getElementById('restart')?.addEventListener('click', resetRun);
document.getElementById('rhythm-hit')?.addEventListener('click', hitRhythmNote);
document.getElementById('rhythm-retry')?.addEventListener('click', beginSunPhase);
rhythmLane.addEventListener('pointerdown', hitRhythmNote);
upgradeChoices.addEventListener('click', handleUpgradeChoiceClick);
window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', (event) => keys.delete(event.code));
window.addEventListener('blur', () => keys.clear());
window.addEventListener('resize', resize);
window.addEventListener('beforeunload', dispose, { once: true });
requestId = requestAnimationFrame(frame);

interface EnemyView {
  id: string;
  root: THREE.Group;
  kind: LevelOneEnemyKind;
  currentHealth: number;
  maxHealth: number;
  healthBar: THREE.Group;
  healthFill: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  damage: number;
  shotCadence: number;
  fireTimer: number;
  telegraph: number;
  danceSeconds: number;
  infectionSeconds: number;
  infectionTick: number;
  infected: boolean;
  warning: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
}
interface Projectile { mesh: THREE.Mesh; velocity: THREE.Vector3; damage: number }
type FoodKind = 'completo' | 'sopaipilla' | 'empanada';
interface FoodPickup { root: THREE.Group; kind: FoodKind; availableAt: number; glow: THREE.Sprite }
interface ZombieAlly { root: THREE.Group; health: number; attackCooldown: number }
interface MeteorStrike { mesh: THREE.Mesh; position: Vector2XZ; elapsed: number; impacted: boolean }

function spawnEnemy(kind: LevelOneEnemyKind): void {
  const index = enemyViews.size;
  const angle = (index * 2.399 + elapsed * 0.42) % (Math.PI * 2);
  const radius = HORDE_BALANCE.spawnRadius - (index % 2) * 1.2;
  const position = { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius };
  const enemy = horde.spawnEnemy(kind, position, undefined, playerLevel);
  const root = createOfficer(kind);
  root.position.set(position.x, 0, position.z);
  const warning = new THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>(
    new THREE.RingGeometry(0.38, 0.54, 24),
    new THREE.MeshBasicMaterial({ color: '#ff8554', transparent: true, opacity: 0, side: THREE.DoubleSide }),
  );
  warning.rotation.x = -Math.PI / 2;
  warning.position.y = 0.09;
  root.add(warning);
  const healthBar = new THREE.Group();
  healthBar.position.y = 2.05;
  const healthBack = new THREE.Mesh(
    new THREE.PlaneGeometry(1.04, 0.13),
    new THREE.MeshBasicMaterial({ color: '#211a18', transparent: true, opacity: 0.9, depthTest: false, depthWrite: false }),
  );
  const healthFill = new THREE.Mesh(
    new THREE.PlaneGeometry(0.96, 0.075),
    new THREE.MeshBasicMaterial({ color: enemyHealthFullColor, depthTest: false, depthWrite: false }),
  );
  healthFill.position.z = 0.008;
  healthBar.add(healthBack, healthFill);
  root.add(healthBar);
  scene.add(root);
  const shotCadence = kind === 'fast' ? HORDE_BALANCE.fastShotEverySeconds
    : kind === 'heavy' ? HORDE_BALANCE.heavyShotEverySeconds
      : kind === 'tactical' ? HORDE_BALANCE.tacticalShotEverySeconds : HORDE_BALANCE.enemyShotEverySeconds;
  enemyViews.set(enemy.id, { id: enemy.id, root, kind, currentHealth: enemy.health, maxHealth: enemy.maxHealth, healthBar, healthFill, damage: enemy.damage, shotCadence, fireTimer: 0.5 + Math.random() * 0.5, telegraph: -1, danceSeconds: 0, infectionSeconds: 0, infectionTick: 0, infected: false, warning });
}

function updateEnemyHealthBar(view: EnemyView, remainingHealth: number): void {
  view.currentHealth = remainingHealth;
  const ratio = Math.max(0, Math.min(1, remainingHealth / view.maxHealth));
  view.healthFill.scale.x = ratio;
  view.healthFill.position.x = -0.48 * (1 - ratio);
  view.healthFill.material.color.lerpColors(enemyHealthEmptyColor, enemyHealthFullColor, ratio);
}

function frame(now: number): void {
  if (disposed) return;
  const dt = Math.min(0.04, previousTime === 0 ? 0 : (now - previousTime) / 1000);
  previousTime = now;
  if (alive && !levelUpPaused && !sunPhase) {
    elapsed += dt;
    strongBeatWindow = Math.max(0, strongBeatWindow - dt);
    attackCooldown = Math.max(0, attackCooldown - dt);
    escobilladoCooldown = Math.max(0, escobilladoCooldown - dt);
    dashCooldown = Math.max(0, dashCooldown - dt);
    vueltaCooldown = Math.max(0, vueltaCooldown - dt);
    invulnerableFor = Math.max(0, invulnerableFor - dt);
    dashFor = Math.max(0, dashFor - dt);
    updateBuffTimers(dt);
    rinRinCooldown = Math.max(0, rinRinCooldown - dt);
    if (rinRinSeconds > 0) rinRinSeconds = Math.max(0, rinRinSeconds - dt);
    anacletoCooldown = Math.max(0, anacletoCooldown - dt);
    munecaCooldown = Math.max(0, munecaCooldown - dt);

    if (vueltaActive) updateVuelta(dt);
    else movePlayer(dt);
    updateCuecaMotion(dt);
    director.update(dt, enemyViews.size);
    updateEnemies(dt);
    updateProjectiles(dt);
    updateFoodPickups(dt);
    updateSongBuffs(dt);
    updateAllies(dt);
    updateMeteorStrikes(dt);
  }
  if (!sunEncounterStarted && director.snapshot.complete && director.snapshot.defeated >= HORDE_BALANCE.firstWaveCount) beginSunPhase();
  if (sunPhase) updateSunPhase(dt, now);
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
    const speed = dashFor > 0 ? HORDE_BALANCE.dashSpeed : 6.5 * (rinRinSeconds > 0 ? HORDE_BALANCE.rinRinSpeedMultiplier : 1);
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
    const target = senoraSeconds > 0 && decoyRoot ? decoyRoot.position : player.position;
    const dx = target.x - view.root.position.x;
    const dz = target.z - view.root.position.z;
    const distance = Math.max(0.001, Math.hypot(dx, dz));
    view.root.rotation.y = Math.atan2(-dx, -dz);
    view.healthBar.rotation.y = Math.atan2(camera.position.x - view.root.position.x, camera.position.z - view.root.position.z) - view.root.rotation.y;

    if (view.infectionSeconds > 0) {
      view.infectionSeconds = Math.max(0, view.infectionSeconds - dt);
      view.infectionTick -= dt;
      if (view.infectionTick <= 0 && view.infectionSeconds > 0) {
        view.infectionTick += HORDE_BALANCE.zombieInfectionTickSeconds;
        horde.damageArea({ x: view.root.position.x, z: view.root.position.z }, 0.15, HORDE_BALANCE.zombieInfectionDamage, 'ZombieInfection');
      }
      if (view.infectionSeconds === 0) {
        view.infected = false;
        updateEnemyHealthBar(view, view.currentHealth);
      }
    }

    if (view.danceSeconds > 0) {
      view.danceSeconds = Math.max(0, view.danceSeconds - dt);
      view.root.rotation.y += Math.sin(elapsed * 20) * 0.07;
      continue;
    }
    if (distance > 7.5) {
      view.root.position.x += (dx / distance) * HORDE_BALANCE.enemySpeed * dt;
      view.root.position.z += (dz / distance) * HORDE_BALANCE.enemySpeed * dt;
    }
    horde.updateEnemyPosition(view.id, { x: view.root.position.x, z: view.root.position.z });

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
  const tacticalAngle = view.kind === 'tactical' ? (Math.random() - 0.5) * 0.24 : 0;
  direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), tacticalAngle);
  projectiles.push({ mesh, velocity: direction.multiplyScalar(HORDE_BALANCE.projectileSpeed), damage: view.damage });
  view.fireTimer = view.shotCadence + Math.random() * 0.45;
  lastRhythmShot = elapsed;
  strongBeatWindow = 0;
}

function updateProjectiles(dt: number): void {
  for (let index = projectiles.length - 1; index >= 0; index -= 1) {
    const projectile = projectiles[index];
    projectile.mesh.position.addScaledVector(projectile.velocity, dt);
    let hitAlly = false;
    for (let allyIndex = zombieAllies.length - 1; allyIndex >= 0; allyIndex -= 1) {
      const ally = zombieAllies[allyIndex];
      const allyDx = projectile.mesh.position.x - ally.root.position.x;
      const allyDz = projectile.mesh.position.z - ally.root.position.z;
      if (allyDx * allyDx + allyDz * allyDz >= 0.42) continue;
      ally.health -= projectile.damage;
      if (ally.health <= 0) {
        scene.remove(ally.root);
        disposeObject(ally.root);
        zombieAllies.splice(allyIndex, 1);
      }
      removeProjectile(index);
      hitAlly = true;
      break;
    }
    if (hitAlly) continue;
    const dx = projectile.mesh.position.x - player.position.x;
    const dz = projectile.mesh.position.z - player.position.z;
    if (dx * dx + dz * dz < 0.68) {
      if (vueltaActive) showToast('¡La vuelta desvió el disparo!');
      else if (invulnerableFor <= 0 && dashFor <= 0) {
        const permanentReduction = permanentDamageReduction();
        const foodReduction = completoSeconds > 0 ? HORDE_BALANCE.completoDamageReduction : 0;
        const reduction = Math.min(0.5, permanentReduction + foodReduction);
        playerHealth = Math.max(0, playerHealth - Math.max(1, Math.round(projectile.damage * (1 - reduction))));
        invulnerableFor = HORDE_BALANCE.playerHitInvulnerabilitySeconds;
        showToast('¡Te llegó un disparo! Sigue moviéndote');
        if (playerHealth === 0) {
          alive = false;
          director.finish();
          clearBuffs();
          clearSongBuffObjects();
          status.textContent = `Fin de la partida · derrotaste ${director.snapshot.defeated} oficiales.`;
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
  if (sunPhase && event.code === 'Space') { event.preventDefault(); hitRhythmNote(); return; }
  if (levelUpPaused) {
    if (event.code === 'Space' || event.code === 'Enter') {
      event.preventDefault();
      if (event.repeat) return;
      const focusedChoice = document.activeElement instanceof HTMLButtonElement
        && document.activeElement.matches('button[data-upgrade]:not(:disabled)')
        ? document.activeElement
        : undefined;
      const choice = focusedChoice ?? upgradeChoices.querySelector<HTMLButtonElement>('button[data-upgrade]:not(:disabled)');
      choice?.click();
      return;
    }
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.code)) {
      event.preventDefault();
      const choices = [...upgradeChoices.querySelectorAll<HTMLButtonElement>('button[data-upgrade]:not(:disabled)')];
      if (choices.length === 0) return;
      const currentIndex = choices.indexOf(document.activeElement as HTMLButtonElement);
      const step = event.code === 'ArrowLeft' || event.code === 'ArrowUp' ? -1 : 1;
      choices[(currentIndex + step + choices.length) % choices.length].focus();
      return;
    }
    return;
  }
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
  waveLabel.textContent = 'Nivel 1';
  waveCount.textContent = wave.complete
    ? 'Nivel completado · 15 / 15 oficiales'
    : `Oficiales derrotados: ${wave.defeated} / ${wave.total} · ${enemyViews.size} activos`;
  healthValue.textContent = `${playerHealth} / ${HORDE_BALANCE.playerHealth}`;
  healthFill.style.width = `${playerHealth / HORDE_BALANCE.playerHealth * 100}%`;
  levelValue.textContent = `Nivel ${playerLevel}`;
  experienceValue.textContent = `${experience} / ${experienceThreshold()}`;
  experienceFill.style.width = `${Math.min(100, (experience / experienceThreshold()) * 100)}%`;
  skillValue.textContent = `${Math.round(skillCharge * 100)}%`;
  skillFill.style.width = `${Math.min(100, skillCharge * 100)}%`;
  zapateoLevelLabel.textContent = `Zapateo ${upgradeLevels.zapateo === 0 ? 'base' : `Niv. ${upgradeLevels.zapateo}`}`;
  escobilladoLevelLabel.textContent = `Escobillado ${upgradeLevels.escobillado === 0 ? 'base' : `Niv. ${upgradeLevels.escobillado}`}`;
  const activeBuffs = [
    `Crecimiento ${Math.round(growthStacks * HORDE_BALANCE.growthPerOfficerKill * 100)}% · resistencia ${Math.round(permanentDamageReduction() * 100)}%`,
    completoSeconds > 0 ? `Completo ${Math.ceil(completoSeconds)}s · tamaño y resistencia` : '',
    empanadaSeconds > 0 ? `Empanada ${Math.ceil(empanadaSeconds)}s · daño aumentado` : '',
    rinRinSeconds > 0 ? `Rin Rin Raja ${Math.ceil(rinRinSeconds)}s · rápido e invulnerable` : '',
    senoraSeconds > 0 ? `La señora interesante ${Math.ceil(senoraSeconds)}s` : '',
    acquiredSongBuffs.has('tangananica-tanganana') ? `Tangananica · ${tangananicaSide}` : '',
    acquiredSongBuffs.size > 0 ? `Mejoras 31 Minutos: ${[...acquiredSongBuffs].map(songBuffTitle).join(', ')}` : '',
  ].filter(Boolean);
  buffStatus.textContent = activeBuffs.join(' · ');
  buffAura.visible = activeBuffs.length > 0 && (growthStacks > 0 || completoSeconds > 0 || empanadaSeconds > 0 || rinRinSeconds > 0);
  (buffAura.material as THREE.MeshBasicMaterial).color.set(empanadaSeconds > 0 ? '#f18a54' : rinRinSeconds > 0 ? '#6bd5d8' : '#95ca79');
  if (sunPhaseWon) status.textContent = 'El Sol se calmó. La plaza vuelve a estar en silencio.';
  else if (sunPhase) status.textContent = 'Sigue el pulso: apunta al aro y toca ESPACIO.';
  else if (alive && wave.complete) status.textContent = '¡Nivel completado! Derrotaste a los 15 oficiales.';
  else if (alive && !levelUpPaused) status.textContent = `Derribados: ${wave.defeated} · máximo ${HORDE_BALANCE.maximumAlive} oficiales activos.`;
}

function resetRun(): void {
  if (levelUpPaused) eventBus.emit('OnGamePauseChanged', { paused: false, reason: 'LevelUp' });
  eventBus.emit('OnGameReset', {});
  keys.clear();
  horde.dispose();
  for (const view of enemyViews.values()) { scene.remove(view.root); disposeObject(view.root); }
  enemyViews.clear();
  for (const pickup of foodPickups.values()) { scene.remove(pickup.root); disposeObject(pickup.root); }
  foodPickups.clear();
  clearSongBuffObjects();
  acquiredSongBuffs.clear();
  for (const projectile of projectiles) scene.remove(projectile.mesh);
  projectiles.length = 0;
  horde = new HordeLevelOne(eventBus, getAttackDirection);
  director = new HordeDirector(spawnEnemy);
  configureHordeBuffs();
  player.position.set(0, 0, 0);
  playerHealth = HORDE_BALANCE.playerHealth;
  playerLevel = 1;
  experience = 0;
  growthStacks = 0;
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
  clearBuffs();
  guacalaCooldown = HORDE_BALANCE.guacalaIntervalSeconds;
  munecaCooldown = 0;
  anacletoCooldown = 0;
  tangananicaSide = 'right';
  foodDropChance = HORDE_BALANCE.foodBaseDropChance;
  everDroppedFood = false;
  hasCompleteAppeared = false;
  activeCuecaMove = null;
  attackMarker.visible = false;
  sweepMarker.visible = sweepOutline.visible = false;
  levelUpOverlay.hidden = true;
  upgradeChoices.replaceChildren();
  resetHuasoPose();
  alive = true;
  sunPhase = sunPhaseWon = false;
  sunEncounterStarted = false;
  sunEntrance = 0;
  sunEncounter.visible = false;
  sunRhythmOverlay.hidden = true;
  rhythmOrbElements.length = 0;
  rhythmNotes.replaceChildren();
  sunScoreLabel.textContent = '0 / 8';
  sunHealthFill.style.width = '0%';
  status.textContent = 'Muévete, esquiva y baila para despejar la plaza.';
}

function beginSunPhase(): void {
  sunEncounterStarted = true;
  sunPhase = true;
  sunPhaseWon = false;
  sunEntrance = 0;
  sunEncounter.visible = true;
  rhythmStartedAt = performance.now();
  rhythmHits = 0;
  rhythmResolved = 0;
  rhythmOrbElements.length = 0;
  rhythmNotes.replaceChildren();
  for (let index = 0; index < RHYTHM_NOTE_COUNT; index += 1) {
    const orb = document.createElement('div');
    orb.className = 'rhythm-note-orb';
    orb.setAttribute('aria-label', `Pulso ${index + 1}`);
    rhythmNotes.appendChild(orb);
    rhythmOrbElements.push(orb);
  }
  rhythmFeedback.textContent = 'El Sol marca el compás · ¡prepárate!';
  sunScoreLabel.textContent = `0 / ${RHYTHM_NOTE_COUNT}`;
  sunHealthFill.style.width = '0%';
  sunRhythmOverlay.hidden = false;
  (document.getElementById('rhythm-retry') as HTMLButtonElement).hidden = true;
}

function updateSunPhase(dt: number, now: number): void {
  if (!sunPhaseWon) {
    sunEntrance = Math.min(1, sunEntrance + dt / 2.4);
    const eased = 1 - (1 - sunEntrance) ** 3;
    sunEncounter.position.set(0, 12 - eased * 8.6, -2);
    sunEncounter.rotation.z = Math.sin(now / 400) * 0.025;
    sunEncounter.scale.setScalar(2.35 + Math.sin(now / 260) * 0.035);
  }
  const elapsedMs = now - rhythmStartedAt;
  for (let index = 0; index < rhythmOrbElements.length; index += 1) {
    if (rhythmOrbElements[index].classList.contains('hit')) continue;
    const targetAt = RHYTHM_APPROACH_MS + index * RHYTHM_BEAT_MS;
    const progress = (elapsedMs - (targetAt - RHYTHM_APPROACH_MS)) / RHYTHM_APPROACH_MS;
    rhythmOrbElements[index].style.left = `${-5 + progress * 83}%`;
    if (elapsedMs > targetAt + 260) {
      rhythmOrbElements[index].classList.add('hit');
      rhythmResolved += 1;
      rhythmFeedback.textContent = 'Se escapó el pulso · sigue con el siguiente';
    }
  }
  if (rhythmResolved >= RHYTHM_NOTE_COUNT && !sunPhaseWon) {
    sunPhaseWon = rhythmHits >= 6;
    sunPhase = false;
    rhythmFeedback.textContent = sunPhaseWon ? '¡Compás perfecto! El Sol se tranquiliza.' : 'El Sol aún ruge. Reinicia la partida para intentarlo otra vez.';
    (document.getElementById('rhythm-retry') as HTMLButtonElement).hidden = sunPhaseWon;
  }
}

function hitRhythmNote(): void {
  if (!sunPhase || sunPhaseWon) return;
  const now = performance.now();
  const elapsedMs = now - rhythmStartedAt;
  let closest = -1;
  let closestDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < rhythmOrbElements.length; index += 1) {
    if (rhythmOrbElements[index].classList.contains('hit')) continue;
    const targetAt = RHYTHM_APPROACH_MS + index * RHYTHM_BEAT_MS;
    const distance = Math.abs(elapsedMs - targetAt);
    if (distance < closestDistance) { closest = index; closestDistance = distance; }
  }
  if (closest < 0 || closestDistance > 260) {
    rhythmFeedback.textContent = 'Fuera de pulso';
    return;
  }
  rhythmOrbElements[closest].classList.add('hit');
  rhythmResolved += 1;
  rhythmHits += 1;
  sunScoreLabel.textContent = `${rhythmHits} / ${RHYTHM_NOTE_COUNT}`;
  sunHealthFill.style.width = `${Math.min(100, rhythmHits / 6 * 100)}%`;
  rhythmFeedback.textContent = closestDistance < 100 ? '¡Perfecto!' : '¡Bien!';
  if (rhythmHits >= 6) {
    sunPhaseWon = true;
    sunPhase = false;
    for (const orb of rhythmOrbElements) orb.classList.add('hit');
    rhythmFeedback.textContent = '¡Compás perfecto! El Sol se tranquiliza.';
    (document.getElementById('rhythm-retry') as HTMLButtonElement).hidden = true;
  }
}

function showToast(message: string): void {
  toast.textContent = message;
  toast.classList.add('visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 1100);
}

function maybeDropFood(enemyId: string, position: THREE.Vector3): void {
  const defeated = director.snapshot.defeated;
  const guaranteedComplete = defeated === 7 && !hasCompleteAppeared;
  const guaranteedFood = !everDroppedFood && defeated >= HORDE_BALANCE.firstWaveCount - 1;
  if (foodPickups.size >= HORDE_BALANCE.maximumFoodPickups && !guaranteedComplete && !guaranteedFood) return;
  const drops = guaranteedComplete || guaranteedFood || Math.random() < foodDropChance;
  if (!drops) {
    foodDropChance = Math.min(HORDE_BALANCE.foodDropChanceMaximum, foodDropChance + HORDE_BALANCE.foodDropChanceStep);
    return;
  }
  const kinds: FoodKind[] = ['completo', 'sopaipilla', 'empanada'];
  const kind = guaranteedComplete ? 'completo' : kinds[Math.floor(Math.random() * kinds.length)];
  const spawned = spawnFoodPickup(`${enemyId}-food`, kind, { x: position.x + (Math.random() - 0.5) * 1.2, z: position.z + (Math.random() - 0.5) * 1.2 }, guaranteedComplete || guaranteedFood);
  if (spawned) showToast(`¡Apareció ${foodName(kind)}! Recógela`);
}

function spawnFoodPickup(id: string, kind: FoodKind, position: Vector2XZ, guaranteed = false): boolean {
  if (foodPickups.size >= HORDE_BALANCE.maximumFoodPickups && !guaranteed) return false;
  const root = createFoodPickup(kind);
  root.position.set(position.x, 0.1, position.z);
  scene.add(root);
  const glow = root.getObjectByName('food-glow') as THREE.Sprite;
  foodPickups.set(id, { root, kind, availableAt: elapsed + 0.9, glow });
  foodDropChance = HORDE_BALANCE.foodBaseDropChance;
  everDroppedFood = true;
  if (kind === 'completo') hasCompleteAppeared = true;
  return true;
}

function createFoodPickup(kind: FoodKind): THREE.Group {
  const root = kind === 'completo' ? createChileanCompletoModel()
    : kind === 'sopaipilla' ? createChileanSopaipillaModel()
      : createChileanEmpanadaModel();
  const color = kind === 'completo' ? '#e5a74e' : kind === 'sopaipilla' ? '#d98a3d' : '#d4b56f';
  root.scale.setScalar(kind === 'completo' ? 0.68 : 0.76);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(kind === 'completo' ? 0.9 : 0.72, 0.045, 6, 24), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, depthWrite: false }));
  halo.rotation.x = Math.PI / 2;
  halo.position.y = -0.1;
  root.add(halo);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: foodGlowTexture,
    color,
    transparent: true,
    opacity: 0.78,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
  }));
  glow.name = 'food-glow';
  glow.position.y = 0.85;
  glow.scale.set(2.25, 2.25, 1);
  root.add(glow);
  return root;
}

function updateFoodPickups(dt: number): void {
  for (const [id, pickup] of foodPickups) {
    pickup.root.rotation.y += dt * 1.1;
    pickup.root.position.y = 0.1 + Math.sin(elapsed * 3 + id.length) * 0.04;
    const glowPulse = 1 + Math.sin(elapsed * 5 + id.length) * 0.12;
    pickup.glow.scale.set(2.25 * glowPulse, 2.25 * glowPulse, 1);
    pickup.glow.material.opacity = 0.68 + glowPulse * 0.15;
    if (elapsed < pickup.availableAt) continue;
    const dx = pickup.root.position.x - player.position.x;
    const dz = pickup.root.position.z - player.position.z;
    if (dx * dx + dz * dz > 1.25) continue;
    applyFood(pickup.kind);
    scene.remove(pickup.root);
    disposeObject(pickup.root);
    foodPickups.delete(id);
  }
}

function applyFood(kind: FoodKind): void {
  if (kind === 'sopaipilla') {
    const recovered = Math.min(HORDE_BALANCE.sopaipillaHeal, HORDE_BALANCE.playerHealth - playerHealth);
    playerHealth += recovered;
    showToast(recovered > 0 ? `Sopaipilla: +${recovered} de vida` : 'Sopaipilla: ya tienes la vida completa');
    return;
  }
  if (kind === 'completo') {
    completoSeconds = HORDE_BALANCE.foodBuffDurationSeconds;
    updatePlayerGrowthVisual();
    eventBus.emit('OnConsumableConsumed', { consumableId: 'completo-italiano' });
    showToast('Completo: más grande y resistente por 30 s');
    return;
  }
  empanadaSeconds = HORDE_BALANCE.foodBuffDurationSeconds;
  horde.setPlayerDamageMultiplier(HORDE_BALANCE.empanadaDamageMultiplier);
  showToast('Empanada: +50% de daño por 30 s');
}

function updateBuffTimers(dt: number): void {
  if (completoSeconds > 0) {
    completoSeconds = Math.max(0, completoSeconds - dt);
    if (completoSeconds === 0) updatePlayerGrowthVisual();
  }
  if (empanadaSeconds > 0) {
    empanadaSeconds = Math.max(0, empanadaSeconds - dt);
    if (empanadaSeconds === 0) horde.setPlayerDamageMultiplier(1);
  }
}

function clearBuffs(): void {
  completoSeconds = 0;
  empanadaSeconds = 0;
  rinRinSeconds = 0;
  updatePlayerGrowthVisual();
  horde.setPlayerDamageMultiplier(1);
}

function updatePlayerGrowthVisual(): void {
  const permanentScale = 1 + growthStacks * HORDE_BALANCE.growthPerOfficerKill;
  player.scale.setScalar(permanentScale * (completoSeconds > 0 ? HORDE_BALANCE.completoScaleMultiplier : 1));
}

function permanentDamageReduction(): number {
  return Math.min(HORDE_BALANCE.permanentResistanceMaximum, growthStacks * HORDE_BALANCE.resistancePerOfficerKill);
}

function foodName(kind: FoodKind): string {
  return kind === 'completo' ? 'un completo' : kind === 'sopaipilla' ? 'una sopaipilla' : 'una empanada';
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
  const baseChoices: Array<{ id: 'zapateo' | 'escobillado' | 'vuelta'; name: string; description: string }> = [
    { id: 'zapateo', name: 'Zapateo sísmico', description: 'Aumenta el daño y el radio del pisotón.' },
    { id: 'escobillado', name: 'Escobillado envolvente', description: 'Alarga el barrido y amplía su arco frontal.' },
    { id: 'vuelta', name: 'Vuelta protectora', description: 'Mantiene un poco más el escudo mientras completas el círculo.' },
  ];
  const candidates: UpgradeChoice[] = baseChoices
    .filter(({ id }) => upgradeLevels[id] < HORDE_BALANCE.maximumUpgradeLevel)
    .map(({ id, name, description }) => ({ id, name, description, currentLevel: upgradeLevels[id], nextLevel: upgradeLevels[id] + 1 }));
  const songs: Array<{ id: SongBuffId; name: string; description: string }> = [
    { id: 'la-senora-interesante', name: 'La señora interesante', description: 'Tu habilidad superior invoca un señuelo que distrae a los oficiales.' },
    { id: 'baila-sin-cesar', name: 'Baila sin cesar', description: 'Cada golpe hace bailar y detiene al oficial durante medio segundo.' },
    { id: 'rin-rin-raja', name: 'Rin Rin Raja', description: 'Los ataques por la espalda dan velocidad e invulnerabilidad breves.' },
    { id: 'tangananica-tanganana', name: 'Tangananica-Tanganana', description: 'Atacar por el lado activo aumenta el daño; puede cambiar en cada compás.' },
    { id: 'dinosaurio-anacleto', name: 'Dinosaurio Anacleto', description: 'Tu habilidad superior en Remate llama un meteorito explosivo.' },
    { id: 'guacala', name: 'Guacala', description: 'Genera una comida chilena aleatoria cada 35 segundos.' },
    { id: 'mi-muneca-me-hablo', name: 'Mi muñeca me habló', description: 'Una muñeca orbita y replica tus ataques con daño reducido.' },
    { id: 'arwrarwrirwrarwro', name: 'Arwrarwrirwrarwro', description: 'Dos zombies aliados atacan e infectan enemigos ocasionalmente.' },
  ];
  for (const song of songs) {
    if (!acquiredSongBuffs.has(song.id)) candidates.push({ ...song, currentLevel: 0, nextLevel: 1 });
  }
  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [candidates[index], candidates[swapIndex]] = [candidates[swapIndex], candidates[index]];
  }
  return candidates.slice(0, 3) as [UpgradeChoice, UpgradeChoice, UpgradeChoice];
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
  else if (isSongBuffId(id)) {
    acquiredSongBuffs.add(id);
    activateSongBuff(id);
  }
  else return;

  horde.setUpgradeLevels(upgradeLevels);
  configureHordeBuffs();
  eventBus.emit('OnGamePauseChanged', { paused: false, reason: 'LevelUp' });
  showToast(`Mejora aplicada · ${button.querySelector('strong')?.textContent ?? 'Cueca'}`);
  if (experience >= experienceThreshold()) grantExperience(0);
}

const songBuffIds: readonly SongBuffId[] = [
  'la-senora-interesante', 'baila-sin-cesar', 'rin-rin-raja', 'tangananica-tanganana',
  'dinosaurio-anacleto', 'guacala', 'mi-muneca-me-hablo', 'arwrarwrirwrarwro',
];

function isSongBuffId(id: string | undefined): id is SongBuffId {
  return id !== undefined && songBuffIds.includes(id as SongBuffId);
}

function configureHordeBuffs(): void {
  horde.setDamageBonus((enemy, source) => {
    if (!acquiredSongBuffs.has('tangananica-tanganana') || (!source.startsWith('BasicStep:') && !source.startsWith('SuperiorStep:'))) return 1;
    return isOnTangananicaSide(enemy.position) ? HORDE_BALANCE.tangananicaDamageMultiplier : 1;
  });
}

function isOnTangananicaSide(position: Vector2XZ): boolean {
  const rightX = Math.cos(player.rotation.y);
  const rightZ = -Math.sin(player.rotation.y);
  const side = (position.x - player.position.x) * rightX + (position.z - player.position.z) * rightZ;
  return tangananicaSide === 'right' ? side >= 0 : side <= 0;
}

function isBehindOfficer(view: EnemyView): boolean {
  const towardPlayerX = player.position.x - view.root.position.x;
  const towardPlayerZ = player.position.z - view.root.position.z;
  const forwardX = -Math.sin(view.root.rotation.y);
  const forwardZ = -Math.cos(view.root.rotation.y);
  return towardPlayerX * forwardX + towardPlayerZ * forwardZ < -0.35;
}

function activateSongBuff(id: SongBuffId): void {
  if (id === 'tangananica-tanganana') {
    tangananicaSide = Math.random() < 0.5 ? 'left' : 'right';
    configureHordeBuffs();
  } else if (id === 'guacala') {
    guacalaCooldown = HORDE_BALANCE.guacalaIntervalSeconds;
  } else if (id === 'mi-muneca-me-hablo') {
    munecaRoot = createMuneca();
    scene.add(munecaRoot);
  } else if (id === 'arwrarwrirwrarwro') {
    for (let index = 0; index < HORDE_BALANCE.zombieCount; index += 1) {
      const root = createZombieAlly();
      root.position.set(player.position.x + (index ? 1 : -1), 0, player.position.z + 1.2);
      scene.add(root);
      zombieAllies.push({ root, health: 18, attackCooldown: 0.6 + index * 0.5 });
    }
  }
  showToast(`Buff adquirido · ${songBuffTitle(id)}`);
}

function songBuffTitle(id: SongBuffId): string {
  const titles: Record<SongBuffId, string> = {
    'la-senora-interesante': 'La señora interesante',
    'baila-sin-cesar': 'Baila sin cesar',
    'rin-rin-raja': 'Rin Rin Raja',
    'tangananica-tanganana': 'Tangananica-Tanganana',
    'dinosaurio-anacleto': 'Dinosaurio Anacleto',
    guacala: 'Guacala',
    'mi-muneca-me-hablo': 'Mi muñeca me habló',
    arwrarwrirwrarwro: 'Arwrarwrirwrarwro',
  };
  return titles[id];
}

function summonSenoraDecoy(): void {
  if (!decoyRoot) {
    const decoy = createSenoraDecoy();
    decoyRoot = decoy;
    scene.add(decoy);
  }
  const forward = getAttackDirection('Zapateo')!;
  decoyRoot?.position.set(player.position.x + forward.x * HORDE_BALANCE.senoraDecoyDistance, 0, player.position.z + forward.z * HORDE_BALANCE.senoraDecoyDistance);
  senoraSeconds = HORDE_BALANCE.senoraDecoyDurationSeconds;
  showToast('La señora interesante distrae a los oficiales');
}

function createSenoraDecoy(): THREE.Group {
  const root = new THREE.Group();
  const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.48, 1.1, 8), new THREE.MeshStandardMaterial({ color: '#b65c88', flatShading: true }));
  skirt.position.y = 0.62; root.add(skirt);
  const blouse = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), new THREE.MeshStandardMaterial({ color: '#e8d1b6', flatShading: true }));
  blouse.position.y = 1.18; root.add(blouse);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), new THREE.MeshStandardMaterial({ color: '#d29a75', flatShading: true }));
  head.position.y = 1.68; root.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.27, 8, 6), new THREE.MeshStandardMaterial({ color: '#432b2a', flatShading: true }));
  hair.position.set(0, 1.78, -0.03); root.add(hair);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.04, 6, 28), new THREE.MeshBasicMaterial({ color: '#efb7da', transparent: true, opacity: 0.9 }));
  halo.rotation.x = Math.PI / 2; halo.position.y = 0.08; root.add(halo);
  return root;
}

function clearSenoraDecoy(): void {
  if (decoyRoot) {
    scene.remove(decoyRoot);
    disposeObject(decoyRoot);
    decoyRoot = null;
  }
  senoraSeconds = 0;
}

function summonAnacletoMeteor(position: Vector2XZ): void {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.72, 12, 9),
    new THREE.MeshStandardMaterial({ color: '#e65f32', emissive: '#b33b17', emissiveIntensity: 1.6, flatShading: true }),
  );
  mesh.position.set(position.x, 13, position.z);
  scene.add(mesh);
  meteorStrikes.push({ mesh, position: { ...position }, elapsed: 0, impacted: false });
  anacletoCooldown = 8;
  showToast('Dinosaurio Anacleto: ¡meteorito!');
}

function createMuneca(): THREE.Group {
  const root = new THREE.Group();
  const dress = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.68, 7), new THREE.MeshStandardMaterial({ color: '#e8b8a1', flatShading: true }));
  dress.position.y = 0.5; root.add(dress);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshStandardMaterial({ color: '#edcda8', flatShading: true }));
  head.position.y = 0.98; root.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.21, 8, 6), new THREE.MeshStandardMaterial({ color: '#523329', flatShading: true }));
  hair.position.set(0, 1.07, -0.04); root.add(hair);
  return root;
}

function createZombieAlly(): THREE.Group {
  const root = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: '#87a16b', flatShading: true });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.58, 0.3), new THREE.MeshStandardMaterial({ color: '#5b6850', flatShading: true }));
  body.position.y = 0.62; root.add(body);
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 1), skin);
  head.position.y = 1.08; root.add(head);
  return root;
}

function updateSongBuffs(dt: number): void {
  if (senoraSeconds > 0) {
    senoraSeconds = Math.max(0, senoraSeconds - dt);
    if (decoyRoot) decoyRoot.position.y = 0.05 + Math.sin(elapsed * 4) * 0.08;
    if (senoraSeconds === 0) clearSenoraDecoy();
  }
  if (acquiredSongBuffs.has('guacala')) {
    guacalaCooldown -= dt;
    if (guacalaCooldown <= 0) {
      if (foodPickups.size < HORDE_BALANCE.maximumFoodPickups) {
        const kinds: FoodKind[] = ['completo', 'sopaipilla', 'empanada'];
        const kind = kinds[Math.floor(Math.random() * kinds.length)];
        spawnFoodPickup(`guacala-${Math.round(elapsed * 1000)}`, kind, { x: player.position.x + 1.5, z: player.position.z + 1.2 });
        showToast('Guacala: apareció comida');
      }
      guacalaCooldown = HORDE_BALANCE.guacalaIntervalSeconds;
    }
  }
}

function updateAllies(dt: number): void {
  if (munecaRoot) {
    const angle = elapsed * 2.2;
    munecaRoot.position.set(
      player.position.x + Math.cos(angle) * HORDE_BALANCE.munecaOrbitRadius,
      0.15 + Math.sin(elapsed * 4) * 0.08,
      player.position.z + Math.sin(angle) * HORDE_BALANCE.munecaOrbitRadius,
    );
    munecaRoot.rotation.y = -angle;
  }

  for (const ally of zombieAllies) {
    ally.attackCooldown = Math.max(0, ally.attackCooldown - dt);
    const target = nearestEnemy(ally.root.position);
    if (!target) {
      ally.root.position.x += (player.position.x - ally.root.position.x) * Math.min(1, dt * 2);
      ally.root.position.z += (player.position.z - ally.root.position.z) * Math.min(1, dt * 2);
      continue;
    }
    const dx = target.root.position.x - ally.root.position.x;
    const dz = target.root.position.z - ally.root.position.z;
    const distance = Math.max(0.001, Math.hypot(dx, dz));
    ally.root.rotation.y = Math.atan2(-dx, -dz);
    if (distance > 1.4) {
      ally.root.position.x += (dx / distance) * 3.2 * dt;
      ally.root.position.z += (dz / distance) * 3.2 * dt;
    } else if (ally.attackCooldown === 0) {
      ally.attackCooldown = HORDE_BALANCE.zombieAttackCooldownSeconds;
      horde.damageArea({ x: target.root.position.x, z: target.root.position.z }, 0.85, HORDE_BALANCE.zombieDamage, 'Arwrarwrirwrarwro');
    }
  }
}

function nearestEnemy(position: THREE.Vector3): EnemyView | undefined {
  let closest: EnemyView | undefined;
  let closestDistanceSquared = Number.POSITIVE_INFINITY;
  for (const enemy of enemyViews.values()) {
    const dx = enemy.root.position.x - position.x;
    const dz = enemy.root.position.z - position.z;
    const distanceSquared = dx * dx + dz * dz;
    if (distanceSquared >= closestDistanceSquared) continue;
    closest = enemy;
    closestDistanceSquared = distanceSquared;
  }
  return closest;
}

function updateMeteorStrikes(dt: number): void {
  for (let index = meteorStrikes.length - 1; index >= 0; index -= 1) {
    const strike = meteorStrikes[index];
    strike.elapsed += dt;
    if (!strike.impacted) {
      const progress = Math.min(1, strike.elapsed / HORDE_BALANCE.anacletoMeteorFlightSeconds);
      strike.mesh.position.y = 13 * (1 - progress) + 0.5;
      strike.mesh.scale.setScalar(0.7 + progress * 0.45);
      if (progress < 1) continue;
      strike.impacted = true;
      strike.elapsed = 0;
      strike.mesh.position.y = 0.5;
      strike.mesh.scale.setScalar(3.5);
      horde.damageArea(strike.position, HORDE_BALANCE.anacletoMeteorRadius, HORDE_BALANCE.anacletoMeteorDamage, 'Dinosaurio Anacleto');
      continue;
    }
    if (strike.elapsed < 0.3) continue;
    scene.remove(strike.mesh);
    disposeObject(strike.mesh);
    meteorStrikes.splice(index, 1);
  }
}

function clearSongBuffObjects(): void {
  clearSenoraDecoy();
  rinRinSeconds = 0;
  rinRinCooldown = 0;
  munecaCooldown = 0;
  anacletoCooldown = 0;
  guacalaCooldown = HORDE_BALANCE.guacalaIntervalSeconds;
  if (munecaRoot) {
    scene.remove(munecaRoot);
    disposeObject(munecaRoot);
    munecaRoot = null;
  }
  for (const ally of zombieAllies) {
    scene.remove(ally.root);
    disposeObject(ally.root);
  }
  zombieAllies = [];
  for (const strike of meteorStrikes) {
    scene.remove(strike.mesh);
    disposeObject(strike.mesh);
  }
  meteorStrikes = [];
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
  const isFast = kind === 'fast';
  const isHeavy = kind === 'heavy';
  const isTactical = kind === 'tactical';
  const uniform = new THREE.MeshStandardMaterial({ color: isFast ? '#3f6677' : isHeavy ? '#514b42' : isTactical ? '#5b496b' : '#405540', flatShading: true });
  const skin = new THREE.MeshStandardMaterial({ color: '#bd8967', flatShading: true });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.72, 0.34), uniform); body.position.y = 1.05; body.castShadow = true; root.add(body);
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.23, 1), skin); head.position.y = 1.58; root.add(head);
  const hat = new THREE.Mesh(isFast ? new THREE.SphereGeometry(0.26, 8, 5) : new THREE.CylinderGeometry(isHeavy ? 0.25 : 0.2, isHeavy ? 0.27 : 0.22, isHeavy ? 0.17 : 0.12, 7), uniform);
  hat.position.y = 1.84; root.add(hat);
  for (const side of [-1,1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.095,0.55,6), uniform); leg.position.set(side*0.15,0.3,0); root.add(leg);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.07,0.55,6), uniform); arm.position.set(side*0.36,1.13,-0.12); arm.rotation.z = side * -0.4; root.add(arm);
  }
  const rifle = new THREE.Mesh(new THREE.BoxGeometry(0.13,0.12,0.78), new THREE.MeshStandardMaterial({ color: '#252322', metalness: 0.35, roughness: 0.7 }));
  rifle.position.set(0.42,1.12,-0.47); root.add(rifle);
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.18,0.17,0.23), new THREE.MeshStandardMaterial({ color: '#60442d' }));
  stock.position.set(0.42,1.12,-0.12); root.add(stock);
  if (isHeavy) {
    const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.32,0.32,0.08,6), new THREE.MeshStandardMaterial({ color: '#67777a', metalness: 0.2 }));
    shield.position.set(-0.44,1.02,-0.12); shield.rotation.x = Math.PI/2; root.add(shield);
  }
  if (isTactical) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.62,0.12,0.36), new THREE.MeshStandardMaterial({ color: '#d0b563', emissive: '#735b22', emissiveIntensity: 0.25 }));
    stripe.position.y = 1.22; root.add(stripe);
  }
  return root;
}

function resize(): void { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8)); }
function disposeObject(root: THREE.Object3D): void {
  root.traverse((object) => {
    if (object instanceof THREE.Sprite) {
      object.material.dispose();
      return;
    }
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) material.dispose();
  });
}
function createFoodGlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255,255,255,0.95)');
    gradient.addColorStop(0.2, 'rgba(255,245,210,0.72)');
    gradient.addColorStop(0.58, 'rgba(255,210,125,0.24)');
    gradient.addColorStop(1, 'rgba(255,180,80,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
function dispose(): void {
  disposed = true; cancelAnimationFrame(requestId); clearTimeout(toastTimer);
  window.removeEventListener('keydown', onKeyDown); window.removeEventListener('resize', resize);
  for (const unsubscribe of unsubscribers) unsubscribe();
  clearBuffs();
  for (const pickup of foodPickups.values()) disposeObject(pickup.root);
  foodPickups.clear();
  foodGlowTexture.dispose();
  horde.dispose(); renderer.dispose();
}
function required<T extends HTMLElement>(id: string): T { const element = document.getElementById(id); if (!(element instanceof HTMLElement)) throw new Error(`Falta #${id} en preview.html`); return element as T; }
