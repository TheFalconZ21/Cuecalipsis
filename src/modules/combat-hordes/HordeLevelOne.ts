import { eventBus as sharedEventBus } from '../../core/EventBus';
import type { CuecaStep, GameEvents, OnBasicStepAttackPayload, OnSuperiorStepUnleashedPayload, Vector2XZ } from '../../core/GameContracts';
import type { TypedEventBus, Unsubscribe } from '../../core/EventBus';
import { HORDE_BALANCE } from './HordeDirector';

/**
 * Prototipo de combate del nivel 1 (horda Fuerza pública).
 * Los números se usan solo mientras GameConfigs.json mantenga null los valores
 * de balance; no representan balance aprobado.
 */
export const PROTOTYPE_DEFAULTS = {
  enemyHealth: HORDE_BALANCE.enemyHealth,
  perfectAttackDamage: HORDE_BALANCE.perfectAttackDamage,
  goodAttackDamage: HORDE_BALANCE.goodAttackDamage,
  attackRadius: HORDE_BALANCE.attackRange,
  apocalypseReward: HORDE_BALANCE.apocalypseReward,
} as const;

export type LevelOneEnemyKind = 'carabinero' | 'patrulla-a-pie';

export interface LevelOneEnemy {
  id: string;
  kind: LevelOneEnemyKind;
  position: Vector2XZ;
  health: number;
  maxHealth: number;
}

export interface CuecaUpgradeLevels {
  zapateo: number;
  escobillado: number;
}

export const LEVEL_ONE_HORDE = {
  gameLevel: 1,
  hordeLevel: 1,
  name: 'Fuerza pública',
  enemyKinds: ['carabinero', 'patrulla-a-pie'],
} as const;

/**
 * Lógica independiente de representación y spawns: el juego anfitrión decide
 * cuándo y dónde crear enemigos; los ataques rítmicos resuelven daño aquí.
 */
export class HordeLevelOne {
  private readonly enemies = new Map<string, LevelOneEnemy>();
  private readonly unsubscribers: Unsubscribe[];
  private nextEnemyNumber = 1;
  private upgrades: CuecaUpgradeLevels = { zapateo: 0, escobillado: 0 };

  constructor(
    private readonly bus: TypedEventBus<GameEvents> = sharedEventBus,
    private readonly getAttackDirection?: (step: CuecaStep) => Vector2XZ | undefined,
  ) {
    this.unsubscribers = [
      bus.on('OnBasicStepAttack', (payload) => this.handleAttack(payload)),
      bus.on('OnSuperiorStepUnleashed', (payload) => this.handleSuperiorAttack(payload)),
    ];
  }

  setUpgradeLevels(levels: CuecaUpgradeLevels): void {
    this.upgrades = { ...levels };
  }

  spawnEnemy(kind: LevelOneEnemyKind, position: Vector2XZ, id?: string): LevelOneEnemy {
    const enemyId = id ?? `horde-1-${this.nextEnemyNumber++}`;
    if (this.enemies.has(enemyId)) throw new Error(`Ya existe el enemigo ${enemyId}`);

    const enemy: LevelOneEnemy = {
      id: enemyId,
      kind,
      position: { ...position },
      health: PROTOTYPE_DEFAULTS.enemyHealth,
      maxHealth: PROTOTYPE_DEFAULTS.enemyHealth,
    };
    this.enemies.set(enemyId, enemy);
    return { ...enemy, position: { ...enemy.position } };
  }

  getEnemies(): LevelOneEnemy[] {
    return [...this.enemies.values()].map((enemy) => ({ ...enemy, position: { ...enemy.position } }));
  }

  dispose(): void {
    for (const unsubscribe of this.unsubscribers) unsubscribe();
    this.enemies.clear();
  }

  private handleAttack(attack: OnBasicStepAttackPayload): void {
    const upgradeLevel = attack.step === 'Zapateo'
      ? this.upgrades.zapateo
      : attack.step === 'Escobillado' ? this.upgrades.escobillado : 0;
    const damagePerUpgrade = attack.step === 'Zapateo'
      ? HORDE_BALANCE.zapateoUpgradeDamage
      : attack.step === 'Escobillado' ? HORDE_BALANCE.escobilladoUpgradeDamage : 0;
    const damage = attack.judgement === 'PERFECT'
      ? PROTOTYPE_DEFAULTS.perfectAttackDamage + upgradeLevel * damagePerUpgrade
      : PROTOTYPE_DEFAULTS.goodAttackDamage + upgradeLevel * damagePerUpgrade;
    const rangeFactor = attack.step === 'Zapateo'
      ? HORDE_BALANCE.zapateoUpgradeRangeFactor
      : HORDE_BALANCE.escobilladoUpgradeRangeFactor;
    const radius = PROTOTYPE_DEFAULTS.attackRadius * (1 + upgradeLevel * rangeFactor);
    const direction = attack.step === 'Escobillado' ? this.getAttackDirection?.(attack.step) : undefined;
    const halfAngle = HORDE_BALANCE.escobilladoHalfAngleRadians + upgradeLevel * HORDE_BALANCE.escobilladoUpgradeWidthRadians;

    this.applyAreaDamage({
      center: attack.position,
      radius,
      damage,
      source: `BasicStep:${attack.step}:${attack.judgement}`,
      direction,
      halfAngle,
    });
  }

  private handleSuperiorAttack(attack: OnSuperiorStepUnleashedPayload): void {
    const upgradeLevel = attack.completedStep === 'Zapateo'
      ? this.upgrades.zapateo
      : attack.completedStep === 'Escobillado' ? this.upgrades.escobillado : 0;
    const radius = PROTOTYPE_DEFAULTS.attackRadius * HORDE_BALANCE.superiorRangeMultiplier * (1 + upgradeLevel * HORDE_BALANCE.superiorUpgradeRangeFactor);
    const direction = attack.completedStep === 'Escobillado'
      ? this.getAttackDirection?.(attack.completedStep)
      : undefined;
    this.applyAreaDamage({
      center: attack.position,
      radius,
      damage: Math.max(PROTOTYPE_DEFAULTS.perfectAttackDamage, Math.round(PROTOTYPE_DEFAULTS.perfectAttackDamage * HORDE_BALANCE.superiorDamageMultiplier)),
      source: `SuperiorStep:${attack.completedStep}`,
      direction,
      halfAngle: HORDE_BALANCE.superiorEscobilladoHalfAngleRadians,
    });
  }

  private applyAreaDamage(options: {
    center: Vector2XZ;
    radius: number;
    damage: number;
    source: string;
    direction?: Vector2XZ;
    halfAngle: number;
  }): void {
    const sweepTangent = Math.tan(options.halfAngle);
    for (const enemy of [...this.enemies.values()]) {
      const dx = enemy.position.x - options.center.x;
      const dz = enemy.position.z - options.center.z;
      if (options.direction) {
        const forwardDistance = dx * options.direction.x + dz * options.direction.z;
        const lateralDistance = Math.abs(dx * options.direction.z - dz * options.direction.x);
        if (forwardDistance < 0 || forwardDistance > options.radius || lateralDistance > forwardDistance * sweepTangent) continue;
      } else if (dx * dx + dz * dz > options.radius ** 2) continue;

      enemy.health = Math.max(0, enemy.health - options.damage);
      this.bus.emit('OnEnemyDamaged', {
        enemyId: enemy.id,
        damage: options.damage,
        source: options.source,
        remainingHealth: enemy.health,
      });

      if (enemy.health > 0) continue;
      this.enemies.delete(enemy.id);
      this.bus.emit('OnEnemyDestroyed', {
        enemyId: enemy.id,
        position: { ...enemy.position },
        apocalypseReward: PROTOTYPE_DEFAULTS.apocalypseReward,
        hordeLevel: LEVEL_ONE_HORDE.hordeLevel,
      });
    }
  }
}
