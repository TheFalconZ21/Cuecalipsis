import type { LevelOneEnemyKind } from './HordeLevelOne';

/** Ajustes temporales del prototipo. Balance centralizado para facilitar iteraciones. */
export const HORDE_BALANCE = {
  firstWaveCount: 3,
  extraEnemiesPerWave: 1,
  maximumWaveCount: 9,
  maximumAlive: 4,
  spawnIntervalSeconds: 1.8,
  waveBreakSeconds: 4.5,
  enemySpeed: 1.15,
  enemyHealth: 2,
  perfectAttackDamage: 2,
  goodAttackDamage: 1,
  apocalypseReward: 1,
  enemyShotEverySeconds: 3.2,
  projectileSpeed: 8,
  projectileDamage: 10,
  playerHealth: 100,
  playerHitInvulnerabilitySeconds: 1.1,
  attackCooldownSeconds: 0.48,
  escobilladoCooldownSeconds: 0.42,
  attackRange: 2.45,
  attackHalfAngleRadians: Math.PI * 0.43,
  escobilladoHalfAngleRadians: Math.PI * 0.24,
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
  experiencePerEnemy: 1,
  experienceBaseThreshold: 3,
  experienceThresholdPerLevel: 2,
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
  alive: number;
  breakSecondsRemaining: number;
  complete: boolean;
}

/** Olas pequeñas y acotadas: crecen gradualmente y limitan enemigos simultáneos. */
export class HordeDirector {
  private wave = 1;
  private spawned = 0;
  private spawnTimer = 0;
  private breakTimer = 0;
  private alive = 0;
  private complete = false;

  constructor(private readonly onSpawn: (kind: LevelOneEnemyKind) => void) {}

  update(deltaSeconds: number, alive: number): void {
    this.alive = alive;
    if (this.complete) return;
    const total = this.waveCount;
    if (this.spawned >= total && alive === 0) {
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
    this.spawnTimer -= deltaSeconds;
    if (this.spawnTimer > 0) return;
    this.onSpawn(this.spawned % 3 === 2 ? 'patrulla-a-pie' : 'carabinero');
    this.spawned += 1;
    this.spawnTimer = HORDE_BALANCE.spawnIntervalSeconds;
  }

  get snapshot(): WaveSnapshot {
    return {
      wave: this.wave,
      total: this.waveCount,
      spawned: this.spawned,
      alive: this.alive,
      breakSecondsRemaining: this.breakTimer,
      complete: this.complete,
    };
  }

  get waveCount(): number {
    return Math.min(HORDE_BALANCE.maximumWaveCount, HORDE_BALANCE.firstWaveCount + (this.wave - 1) * HORDE_BALANCE.extraEnemiesPerWave);
  }

  finish(): void {
    this.complete = true;
  }
}
