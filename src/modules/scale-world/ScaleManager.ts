import gameConfigs from '../../core/GameConfigs.json';
import { eventBus, type Unsubscribe } from '../../core/EventBus';
import type { GameEvents, TierIndex } from '../../core/GameContracts';
import type { TypedEventBus } from '../../core/EventBus';
import { PROTOTYPE_DEFAULTS } from './PrototypeDefaults';

interface ScaleTierConfig {
  tier: number;
  minScale: number | null;
  maxScale: number | null;
  maxTierApocalypse: number | null;
}

interface GameConfigShape {
  scaleTiers?: ScaleTierConfig[];
}

const tierOneConfig = (gameConfigs as GameConfigShape).scaleTiers?.find(({ tier }) => tier === 1);

export interface ScaleManagerOptions {
  bus?: TypedEventBus<GameEvents>;
  onScaleChanged?: (scale: number) => void;
  apocalypseThreshold?: number | null;
  minScale?: number | null;
  maxScale?: number | null;
}

/** Fuente única del Tier y el crecimiento de escala del módulo Dev 2. */
export class ScaleManager {
  private readonly bus: TypedEventBus<GameEvents>;
  private readonly unsubscribers: Unsubscribe[] = [];
  private readonly onScaleChanged?: (scale: number) => void;
  private readonly apocalypseThreshold: number;
  private readonly minScale: number;
  private readonly maxScale: number;

  private apocalypse = 0;
  private tier: TierIndex = 1;
  private capped = false;
  private scale: number = PROTOTYPE_DEFAULTS.minimumScale;

  constructor(options: ScaleManagerOptions = {}) {
    this.bus = options.bus ?? eventBus;
    this.onScaleChanged = options.onScaleChanged;
    this.apocalypseThreshold = positiveOrFallback(
      options.apocalypseThreshold ?? tierOneConfig?.maxTierApocalypse,
      PROTOTYPE_DEFAULTS.tierOneApocalypseThreshold,
    );
    this.minScale = positiveOrFallback(options.minScale ?? tierOneConfig?.minScale, PROTOTYPE_DEFAULTS.minimumScale);
    this.maxScale = positiveOrFallback(options.maxScale ?? tierOneConfig?.maxScale, PROTOTYPE_DEFAULTS.maximumScale);

    this.unsubscribers.push(
      this.bus.on('OnEnemyDestroyed', (payload) => this.gainApocalypse(payload.apocalypseReward, 'Enemy')),
      this.bus.on('OnPropTrampled', (payload) => this.gainApocalypse(payload.apocalypseGained, 'Prop')),
      this.bus.on('OnBossDefeated', (payload) => this.handleBossDefeated(payload.tier)),
      this.bus.on('OnGameReset', () => this.reset()),
    );
  }

  get currentTier(): TierIndex { return this.tier; }
  get currentApocalypse(): number { return this.apocalypse; }
  get currentTotalScale(): number { return this.scale; }
  get maxTierApocalypse(): number { return this.apocalypseThreshold; }
  get isScaleCapped(): boolean { return this.capped; }

  dispose(): void {
    for (const unsubscribe of this.unsubscribers.splice(0)) unsubscribe();
  }

  reset(): void {
    this.tier = 1;
    this.apocalypse = 0;
    this.capped = false;
    this.scale = this.minScale;
    this.onScaleChanged?.(this.scale);
  }

  private gainApocalypse(amount: number, source: 'Enemy' | 'Prop'): void {
    if (this.tier !== 1 || this.capped || !Number.isFinite(amount) || amount <= 0) return;

    const previousApocalypse = this.apocalypse;
    this.apocalypse = Math.min(this.apocalypseThreshold, this.apocalypse + amount);
    const gained = this.apocalypse - previousApocalypse;
    if (gained <= 0) return;

    const progress = this.apocalypse / this.apocalypseThreshold;
    this.scale = this.minScale + (this.maxScale - this.minScale) * progress;
    this.onScaleChanged?.(this.scale);
    this.bus.emit('OnApocalypseGained', {
      amount: gained,
      source,
      total: this.apocalypse,
      tier: this.tier,
    });

    if (this.apocalypse >= this.apocalypseThreshold) {
      this.capped = true;
      this.bus.emit('OnBossGateTriggered', { tier: this.tier });
    }
  }

  private handleBossDefeated(defeatedTier: TierIndex): void {
    if (defeatedTier !== this.tier || !this.capped) return;

    const previousTier = this.tier;
    this.capped = false;
    this.apocalypse = 0;
    this.scale = this.minScale;
    this.onScaleChanged?.(this.scale);

    // Tier 2 data and its gate remain outside this Tier 1 reference prototype.
    if (previousTier < 4) {
      this.tier = (previousTier + 1) as TierIndex;
      this.bus.emit('OnScaleTierChanged', {
        previousTier,
        newTier: this.tier,
        totalScale: this.scale,
      });
    }
  }
}

function positiveOrFallback(value: number | null | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}
