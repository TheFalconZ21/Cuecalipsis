import type { LevelOneEnemyKind } from './HordeLevelOne';

/** Ajustes temporales del prototipo. Balance centralizado para facilitar iteraciones. */
export const HORDE_BALANCE = {
  firstWaveCount: 15,
  extraEnemiesPerWave: 0,
  maximumWaveCount: 1,
  initialOfficers: 5,
  maximumAlive: 5,
  waveBreakSeconds: 4.5,
  spawnIntervalSeconds: 0,
  enemySpeed: 1.15,
  enemyHealth: 80,
  perfectAttackDamage: 12,
  goodAttackDamage: 10,
  fastEnemyHealth: 70,
  heavyEnemyHealth: 90,
  tacticalEnemyHealth: 80,
  enemyDamage: 7,
  fastEnemyDamage: 5,
  heavyEnemyDamage: 9,
  tacticalEnemyDamageMinimum: 6,
  tacticalEnemyDamageMaximum: 10,
  officerHealthPerPlayerLevel: 0.01,
  officerDamagePerPlayerLevel: 0.005,
  empanadaDamageMultiplier: 1.5,
  sopaipillaHeal: 25,
  completoScaleMultiplier: 1.25,
  completoDamageReduction: 0.25,
  foodBuffDurationSeconds: 30,
  foodBaseDropChance: 0.1,
  foodDropChanceStep: 0.05,
  foodDropChanceMaximum: 0.3,
  growthPerOfficerKill: 0.01,
  resistancePerOfficerKill: 0.015,
  permanentResistanceMaximum: 0.3,
  senoraDecoyDurationSeconds: 8,
  senoraDecoyDistance: 6,
  bailaDanceDurationSeconds: 0.5,
  rinRinBuffDurationSeconds: 3,
  rinRinInvulnerabilitySeconds: 1.5,
  rinRinSpeedMultiplier: 1.25,
  rinRinCooldownSeconds: 6,
  tangananicaDamageMultiplier: 1.2,
  tangananicaDirectionSwapChance: 0.5,
  anacletoMeteorFlightSeconds: 1.1,
  anacletoMeteorRadius: 5,
  anacletoMeteorDamage: 60,
  guacalaIntervalSeconds: 35,
  maximumFoodPickups: 3,
  munecaOrbitRadius: 1.4,
  munecaDamageMultiplier: 0.3,
  munecaAttackCooldownSeconds: 0.35,
  zombieCount: 2,
  zombieAttackCooldownSeconds: 1.8,
  zombieDamage: 8,
  zombieInfectionChance: 0.15,
  zombieInfectionDurationSeconds: 4,
  zombieInfectionDamage: 2,
  zombieInfectionTickSeconds: 1,
  apocalypseReward: 1,
  enemyShotEverySeconds: 3.2,
  fastShotEverySeconds: 2.35,
  heavyShotEverySeconds: 4.3,
  tacticalShotEverySeconds: 3.0,
  projectileSpeed: 8,
  playerHealth: 100,
  playerHitInvulnerabilitySeconds: 1.1,
  attackCooldownSeconds: 0.48,
  escobilladoCooldownSeconds: 0.42,
  attackRange: 2.45,
  attackHalfAngleRadians: Math.PI * 0.43,
  escobilladoRangeMultiplier: 1.25,
  escobilladoHalfAngleRadians: Math.PI * 0.28,
  escobilladoOriginOffset: 0.9,
  escobilladoAnimationSeconds: 0.52,
  zapateoAnimationSeconds: 0.48,
  escobilladoUpgradeDamage: 1,
  escobilladoUpgradeRangeFactor: 0.14,
  escobilladoUpgradeWidthRadians: 0.035,
  zapateoUpgradeDamage: 1,
  zapateoUpgradeRangeFactor: 0.12,
  superiorDamageMultiplier: 3,
  superiorRangeMultiplier: 1.8,
  superiorUpgradeRangeFactor: 0.08,
  superiorEscobilladoHalfAngleRadians: Math.PI * 0.36,
  superiorAnimationSeconds: 0.68,
  attackMarkerStartScale: 0.12,
  vueltaMinimumRadius: 0.35,
  skillChargePerfect: 0.4,
  skillChargeGood: 0.2,
  skillChargeMaximum: 1,
  experiencePerEnemy: 10,
  experienceBaseThreshold: 70,
  experienceThresholdPerLevel: 10,
  maximumUpgradeLevel: 5,
  vueltaDurationSeconds: 1.15,
  vueltaRadius: 1.15,
  vueltaCooldownSeconds: 1.6,
  vueltaUpgradeDurationSeconds: 0.12,
  escobilladoLegMaxRadians: 0.28,
  scarfOrbitRadius: 0.66,
  scarfOrbitSeconds: 0.72,
  scarfOrbitDepthRatio: 0.48,
  dashSpeed: 13,
  dashDurationSeconds: 0.18,
  dashCooldownSeconds: 1.2,
  arenaRadius: 22,
  spawnRadius: 17,
  rhythm: {
    source: 'timer' as 'timer' | 'strong-beat',
    strongBeatSubdivision: 0,
    minimumSecondsBetweenShots: 0.35,
  },
} as const;

export interface WaveSnapshot {
  wave: number;
  total: number;
  spawned: number;
  defeated: number;
  alive: number;
  breakSecondsRemaining: number;
  complete: boolean;
}

/** Olas pequeñas y acotadas: crecen gradualmente y limitan enemigos simultáneos. */
export class HordeDirector {
  private wave = 1;
  private spawned = 0;
  private defeated = 0;
  private spawnTimer = 0;
  private breakTimer = 0;
  private alive = 0;
  private complete = false;
  private stopped = false;

  constructor(private readonly onSpawn: (kind: LevelOneEnemyKind) => void) {
    variantBag.length = 0;
  }

  update(deltaSeconds: number, alive: number): void {
    this.alive = alive;
    if (this.complete || this.stopped) return;
    const total = this.waveCount;
    if (this.spawned >= total && alive === 0) {
      if (this.wave >= HORDE_BALANCE.maximumWaveCount) {
        this.complete = this.defeated >= total;
        this.breakTimer = 0;
        return;
      }
      if (this.breakTimer === 0) this.breakTimer = HORDE_BALANCE.waveBreakSeconds;
      this.breakTimer = Math.max(0, this.breakTimer - deltaSeconds);
      if (this.breakTimer === 0) {
        this.wave += 1;
        this.spawned = 0;
        this.spawnTimer = 0;
      }
      return;
    }

    if (alive >= HORDE_BALANCE.maximumAlive || this.spawned >= total) return;
    if (this.spawned < HORDE_BALANCE.initialOfficers) {
      while (this.spawned < Math.min(HORDE_BALANCE.initialOfficers, total)) this.spawnNext();
      return;
    }
    this.spawnTimer -= deltaSeconds;
    if (this.spawnTimer > 0) return;
    this.spawnNext();
    this.spawnTimer = HORDE_BALANCE.spawnIntervalSeconds;
  }

  get snapshot(): WaveSnapshot {
    return {
      wave: this.wave,
      total: this.waveCount,
      spawned: this.spawned,
      defeated: this.defeated,
      alive: this.alive,
      breakSecondsRemaining: this.breakTimer,
      complete: this.complete,
    };
  }

  get waveCount(): number {
    return HORDE_BALANCE.firstWaveCount + (this.wave - 1) * HORDE_BALANCE.extraEnemiesPerWave;
  }

  finish(): void {
    this.stopped = true;
  }

  onOfficerDefeated(alive: number): void {
    this.alive = Math.max(0, alive);
    this.defeated = Math.min(HORDE_BALANCE.firstWaveCount, this.defeated + 1);
    this.spawnTimer = 0;
    if (
      this.wave >= HORDE_BALANCE.maximumWaveCount
      && this.spawned >= this.waveCount
      && this.defeated >= this.waveCount
      && this.alive === 0
    ) this.complete = true;
  }

  private spawnNext(): void {
    this.onSpawn(chooseBalancedVariant());
    this.spawned += 1;
  }
}

const VARIANTS: readonly LevelOneEnemyKind[] = ['standard', 'fast', 'heavy', 'tactical'];
const variantBag: LevelOneEnemyKind[] = [];
function chooseBalancedVariant(): LevelOneEnemyKind {
  if (variantBag.length === 0) {
    variantBag.push(...VARIANTS);
    for (let index = variantBag.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [variantBag[index], variantBag[swapIndex]] = [variantBag[swapIndex], variantBag[index]];
    }
  }
  return variantBag.pop()!;
}
