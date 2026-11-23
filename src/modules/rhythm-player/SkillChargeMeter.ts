import { eventBus } from '../../core/EventBus';
import type { CuecaStep, GameEvents, Vector2XZ } from '../../core/GameContracts';
import type { TypedEventBus, Unsubscribe } from '../../core/EventBus';

export interface SkillChargeTuning {
  enemyDamagePercentPerPoint: number;
  enemyDefeatBonusPercent: number;
  propDestroyedPercent: number;
}

const DEFAULT_TUNING: SkillChargeTuning = {
  enemyDamagePercentPerPoint: 8,
  enemyDefeatBonusPercent: 12,
  propDestroyedPercent: 18,
};

/** Dueño de la carga de habilidad superior; solo recibe eventos de resultados. */
export class SkillChargeMeter {
  private value = 0;
  private readonly unsubscribers: Unsubscribe[];
  private readonly tuning: SkillChargeTuning;

  constructor(
    private readonly bus: TypedEventBus<GameEvents> = eventBus,
    tuning: SkillChargeTuning = DEFAULT_TUNING,
  ) {
    this.tuning = { ...tuning };
    this.unsubscribers = [
      bus.on('OnEnemyDamaged', ({ damage }) => this.add(damage * this.tuning.enemyDamagePercentPerPoint, 'EnemyDamage')),
      bus.on('OnEnemyDestroyed', () => this.add(this.tuning.enemyDefeatBonusPercent, 'EnemyDefeated')),
      bus.on('OnPropTrampled', () => this.add(this.tuning.propDestroyedPercent, 'PropDestroyed')),
      bus.on('OnGameReset', () => this.reset()),
    ];
  }

  get charge(): number { return this.value; }

  activate(completedStep: CuecaStep, nextStep: CuecaStep, position: Vector2XZ): boolean {
    if (this.value < 100) return false;
    const consumed = this.value;
    this.value = 0;
    this.bus.emit('OnSkillChargeChanged', { amount: -consumed, total: this.value, source: 'SuperiorActivated' });
    this.bus.emit('OnSuperiorStepUnleashed', { completedStep, nextStep, position });
    return true;
  }

  reset(): void {
    if (this.value === 0) return;
    const previous = this.value;
    this.value = 0;
    this.bus.emit('OnSkillChargeChanged', { amount: -previous, total: 0, source: 'Reset' });
  }

  dispose(): void {
    for (const unsubscribe of this.unsubscribers) unsubscribe();
    this.unsubscribers.length = 0;
  }

  private add(amount: number, source: 'EnemyDamage' | 'EnemyDefeated' | 'PropDestroyed'): void {
    if (!Number.isFinite(amount) || amount <= 0 || this.value >= 100) return;
    const previous = this.value;
    this.value = Math.min(100, this.value + amount);
    this.bus.emit('OnSkillChargeChanged', { amount: this.value - previous, total: this.value, source });
  }
}
