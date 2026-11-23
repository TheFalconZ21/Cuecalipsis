import { eventBus as sharedEventBus } from '../../core/EventBus';
import type { GameEvents, OnBasicStepAttackPayload, Vector2XZ } from '../../core/GameContracts';
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
  private readonly unsubscribeAttack: Unsubscribe;
  private nextEnemyNumber = 1;

  constructor(private readonly bus: TypedEventBus<GameEvents> = sharedEventBus) {
    this.unsubscribeAttack = bus.on('OnBasicStepAttack', (payload) => this.handleAttack(payload));
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
    this.unsubscribeAttack();
    this.enemies.clear();
  }

  private handleAttack(attack: OnBasicStepAttackPayload): void {
    const damage = attack.judgement === 'PERFECT'
      ? PROTOTYPE_DEFAULTS.perfectAttackDamage
      : PROTOTYPE_DEFAULTS.goodAttackDamage;
    const radiusSquared = PROTOTYPE_DEFAULTS.attackRadius ** 2;

    for (const enemy of [...this.enemies.values()]) {
      const dx = enemy.position.x - attack.position.x;
      const dz = enemy.position.z - attack.position.z;
      if (dx * dx + dz * dz > radiusSquared) continue;

      enemy.health = Math.max(0, enemy.health - damage);
      this.bus.emit('OnEnemyDamaged', {
        enemyId: enemy.id,
        damage,
        source: `BasicStep:${attack.step}:${attack.judgement}`,
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
