import * as THREE from 'three';
import { eventBus, type Unsubscribe } from '../../core/EventBus';
import type { GameEvents } from '../../core/GameContracts';
import type { TypedEventBus } from '../../core/EventBus';
import { PROTOTYPE_DEFAULTS } from './PrototypeDefaults';

export interface DynamicCameraOptions {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  player: THREE.Object3D;
  /** Source of truth supplied by ScaleManager. */
  getPlayerScale: () => number;
  bus?: TypedEventBus<GameEvents>;
  fovDegrees?: number | null;
}

interface MaterialSnapshot {
  original: THREE.Material | THREE.Material[];
  faded: THREE.Material | THREE.Material[];
}

/** Top-down framing, beat pulse, exponential follow and reversible anti-occlusion. */
export class DynamicCameraController {
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly player: THREE.Object3D;
  private readonly getPlayerScale: () => number;
  private readonly raycaster = new THREE.Raycaster();
  private readonly direction = new THREE.Vector3();
  private readonly target = new THREE.Vector3();
  private readonly desiredPosition = new THREE.Vector3();
  private readonly playerWorldPosition = new THREE.Vector3();
  private readonly currentOccluders = new Set<THREE.Object3D>();
  private readonly nextOccluders = new Set<THREE.Object3D>();
  private readonly materialSnapshots = new Map<THREE.Object3D, MaterialSnapshot>();
  private readonly intersections: THREE.Intersection[] = [];
  private readonly playerHeightAtScaleOne = PROTOTYPE_DEFAULTS.playerHeightAtScaleOne;
  private readonly unsubscribers: Unsubscribe[] = [];
  private readonly targetScreenHeight = PROTOTYPE_DEFAULTS.cameraSubjectScreenHeight;
  private readonly followSharpness = PROTOTYPE_DEFAULTS.cameraFollowSharpness;
  private readonly pitchRadians = THREE.MathUtils.degToRad(PROTOTYPE_DEFAULTS.cameraPitchDegrees);
  private pulseRemaining = 0;
  private disposed = false;

  constructor(options: DynamicCameraOptions) {
    this.scene = options.scene;
    this.camera = options.camera;
    this.player = options.player;
    this.getPlayerScale = options.getPlayerScale;
    this.camera.fov = validFov(options.fovDegrees);
    this.camera.updateProjectionMatrix();
    this.camera.rotation.order = 'YXZ';

    const bus = options.bus ?? eventBus;
    this.unsubscribers.push(bus.on('OnBeat', ({ isStrongBeat }) => {
      if (isStrongBeat) this.pulseRemaining = PROTOTYPE_DEFAULTS.cameraBeatPulseDurationSeconds;
    }));
  }

  update(deltaSeconds: number): void {
    if (this.disposed || !Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return;

    this.player.getWorldPosition(this.playerWorldPosition);
    const scale = Math.max(0.01, this.getPlayerScale());
    const playerHeight = this.playerHeightAtScaleOne * scale;
    const halfFovTangent = Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2);
    const desiredDistance = playerHeight / (2 * this.targetScreenHeight * halfFovTangent);
    const pulse = this.pulseRemaining > 0
      ? PROTOTYPE_DEFAULTS.cameraBeatPulseDistance * Math.min(1, this.pulseRemaining / PROTOTYPE_DEFAULTS.cameraBeatPulseDurationSeconds)
      : 0;
    this.pulseRemaining = Math.max(0, this.pulseRemaining - deltaSeconds);

    const horizontalDistance = (desiredDistance + pulse) * Math.cos(this.pitchRadians);
    const height = (desiredDistance + pulse) * Math.sin(this.pitchRadians);
    this.target.set(this.playerWorldPosition.x, this.playerWorldPosition.y, this.playerWorldPosition.z);
    this.desiredPosition.set(
      this.playerWorldPosition.x,
      this.playerWorldPosition.y + height,
      this.playerWorldPosition.z + horizontalDistance,
    );
    const interpolation = 1 - Math.exp(-this.followSharpness * deltaSeconds);
    this.camera.position.lerp(this.desiredPosition, interpolation);
    this.camera.lookAt(this.target);
    this.updateOcclusion();
  }

  dispose(): void {
    this.disposed = true;
    for (const unsubscribe of this.unsubscribers.splice(0)) unsubscribe();
    for (const object of this.materialSnapshots.keys()) this.restoreObjectMaterial(object);
    this.currentOccluders.clear();
  }

  private updateOcclusion(): void {
    this.direction.subVectors(this.playerWorldPosition, this.camera.position).normalize();
    this.raycaster.set(this.camera.position, this.direction);
    this.raycaster.far = this.camera.position.distanceTo(this.playerWorldPosition) - 0.35;
    this.intersections.length = 0;
    this.raycaster.intersectObjects(this.scene.children, true, this.intersections);
    this.nextOccluders.clear();

    for (const hit of this.intersections) {
      if (hit.object === this.player || this.player.getObjectById(hit.object.id)) continue;
      if (!isRenderable(hit.object)) continue;
      this.nextOccluders.add(hit.object);
      this.fadeObjectMaterial(hit.object);
    }

    for (const object of this.currentOccluders) {
      if (!this.nextOccluders.has(object)) this.restoreObjectMaterial(object);
    }
    this.currentOccluders.clear();
    for (const object of this.nextOccluders) this.currentOccluders.add(object);
  }

  private fadeObjectMaterial(object: THREE.Object3D): void {
    if (this.materialSnapshots.has(object)) return;
    const mesh = object as THREE.Mesh;
    const original = mesh.material;
    const cloneOne = (material: THREE.Material): THREE.Material => {
      const clone = material.clone();
      const transparentMaterial = clone as THREE.Material & { opacity?: number; transparent?: boolean; depthWrite?: boolean };
      if (transparentMaterial.opacity !== undefined) transparentMaterial.opacity = PROTOTYPE_DEFAULTS.occludedMaterialOpacity;
      transparentMaterial.transparent = true;
      transparentMaterial.depthWrite = false;
      return clone;
    };
    const faded = Array.isArray(original) ? original.map(cloneOne) : cloneOne(original);
    mesh.material = faded;
    this.materialSnapshots.set(object, { original, faded });
  }

  private restoreObjectMaterial(object: THREE.Object3D): void {
    const snapshot = this.materialSnapshots.get(object);
    if (!snapshot) return;
    const mesh = object as THREE.Mesh;
    mesh.material = snapshot.original;
    for (const material of Array.isArray(snapshot.faded) ? snapshot.faded : [snapshot.faded]) material.dispose();
    this.materialSnapshots.delete(object);
  }
}

function validFov(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value < 180
    ? value
    : PROTOTYPE_DEFAULTS.cameraFovDegrees;
}

function isRenderable(object: THREE.Object3D): object is THREE.Mesh {
  return (object as THREE.Mesh).isMesh === true;
}
