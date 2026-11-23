import * as THREE from 'three';
import { eventBus, type Unsubscribe } from '../../core/EventBus';
import type { GameEvents, TierIndex, Vector2XZ } from '../../core/GameContracts';
import type { TypedEventBus } from '../../core/EventBus';
import { PROTOTYPE_DEFAULTS } from './PrototypeDefaults';
import type { ScaleManager } from './ScaleManager';

export interface TrampleTarget {
  id: string;
  object: THREE.Object3D;
  requiredScaleToCrush: number;
  apocalypseReward?: number;
  /** Approximate horizontal radius used by the light XZ distance check. */
  radius?: number;
}

export interface TramplingSystemOptions {
  player: THREE.Object3D;
  scaleManager: ScaleManager;
  targets: TrampleTarget[];
  bus?: TypedEventBus<GameEvents>;
}

/** Contact checks and gentle pushback in the XZ plane; no rigid bodies or colliders. */
export class TramplingSystem {
  private readonly player: THREE.Object3D;
  private readonly scaleManager: ScaleManager;
  private readonly bus: TypedEventBus<GameEvents>;
  private readonly targets: TrampleTarget[];
  private readonly trampled = new Set<string>();
  private readonly initialPositions = new Map<string, THREE.Vector3>();
  private readonly playerPosition = new THREE.Vector3();
  private readonly targetPosition = new THREE.Vector3();
  private readonly pushDirection = new THREE.Vector3();
  private readonly unsubscribers: Unsubscribe[] = [];
  private readonly initialPlayerRadius: number;

  constructor(options: TramplingSystemOptions) {
    this.player = options.player;
    this.scaleManager = options.scaleManager;
    this.bus = options.bus ?? eventBus;
    this.targets = options.targets;
    this.initialPlayerRadius = PROTOTYPE_DEFAULTS.playerRadiusAtScaleOne;
    this.unsubscribers.push(this.bus.on('OnGameReset', () => this.reset()));
    for (const target of this.targets) {
      this.initialPositions.set(target.id, target.object.position.clone());
    }
  }

  update(deltaSeconds: number): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return;

    this.player.getWorldPosition(this.playerPosition);
    const scale = this.scaleManager.currentTotalScale;
    const playerRadius = this.initialPlayerRadius * scale;

    for (const target of this.targets) {
      if (this.trampled.has(target.id) || !target.object.parent) continue;

      target.object.getWorldPosition(this.targetPosition);
      this.pushDirection.set(
        this.targetPosition.x - this.playerPosition.x,
        0,
        this.targetPosition.z - this.playerPosition.z,
      );
      const distanceSquared = this.pushDirection.lengthSq();
      const contactRadius = playerRadius + (target.radius ?? PROTOTYPE_DEFAULTS.uncrushablePushRadius);
      if (distanceSquared > contactRadius * contactRadius) continue;

      if (target.requiredScaleToCrush <= scale) {
        this.trample(target, this.targetPosition);
        continue;
      }

      // Softly nudge oversized props away instead of blocking the huaso.
      const distance = Math.sqrt(distanceSquared);
      if (distance > 0.0001) this.pushDirection.multiplyScalar(1 / distance);
      else this.pushDirection.set(1, 0, 0);
      target.object.position.x += this.pushDirection.x * PROTOTYPE_DEFAULTS.uncrushablePushSpeed * deltaSeconds;
      target.object.position.z += this.pushDirection.z * PROTOTYPE_DEFAULTS.uncrushablePushSpeed * deltaSeconds;
    }
  }

  reset(): void {
    for (const target of this.targets) {
      const initialPosition = this.initialPositions.get(target.id);
      if (!initialPosition) continue;
      target.object.position.copy(initialPosition);
      target.object.visible = true;
      this.trampled.delete(target.id);
    }
  }

  dispose(): void {
    for (const unsubscribe of this.unsubscribers.splice(0)) unsubscribe();
  }

  private trample(target: TrampleTarget, position: THREE.Vector3): void {
    this.trampled.add(target.id);
    target.object.visible = false;
    const payloadPosition: Vector2XZ = { x: position.x, z: position.z };
    const currentTier = this.scaleManager.currentTier as TierIndex;
    this.bus.emit('OnPropTrampled', {
      propId: target.id,
      position: payloadPosition,
      tier: currentTier,
      apocalypseGained: target.apocalypseReward ?? PROTOTYPE_DEFAULTS.defaultPropApocalypseReward,
    });
  }
}
