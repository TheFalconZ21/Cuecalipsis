import * as THREE from 'three';
import { PROTOTYPE_DEFAULTS } from './PrototypeDefaults';
import type { TrampleTarget } from './TramplingSystem';

export interface WorldStageOptions {
  scene: THREE.Scene;
}

/** Procedural, bounded Tier 1 Pueblo/Ciudad graybox. */
export class WorldStageController {
  readonly root = new THREE.Group();
  readonly trampleTargets: TrampleTarget[] = [];
  private readonly arenaRadius = 24;
  private readonly ownedGeometries: THREE.BufferGeometry[] = [];
  private readonly ownedMaterials: THREE.Material[] = [];

  constructor({ scene }: WorldStageOptions) {
    scene.add(this.root);
    this.createArena();
    this.createFurnitureAndFences();
    this.createOcclusionBlocks();
  }

  dispose(): void {
    this.root.removeFromParent();
    for (const geometry of this.ownedGeometries) geometry.dispose();
    for (const material of this.ownedMaterials) material.dispose();
    this.ownedGeometries.length = 0;
    this.ownedMaterials.length = 0;
    this.trampleTargets.length = 0;
  }

  private createArena(): void {
    const groundGeometry = new THREE.CircleGeometry(this.arenaRadius, 64);
    groundGeometry.rotateX(-Math.PI / 2);
    const groundMaterial = this.material('#8e7651');
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.receiveShadow = true;
    this.addOwned(groundGeometry, ground);

    const plazaGeometry = new THREE.CircleGeometry(6, 48);
    plazaGeometry.rotateX(-Math.PI / 2);
    const plaza = new THREE.Mesh(plazaGeometry, this.material('#c3a16e'));
    plaza.position.y = 0.015;
    this.addOwned(plazaGeometry, plaza);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(this.arenaRadius - 0.25, 0.25, 6, 64),
      this.material('#69513a'),
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.12;
    this.addOwned(rim.geometry, rim);
  }

  private createFurnitureAndFences(): void {
    const tablePositions: Array<[number, number]> = [[-5, -4], [5, -4], [-6, 5], [6, 5], [0, 10]];
    tablePositions.forEach(([x, z], index) => {
      this.addDestructibleTable(`tier1-table-${index + 1}`, x, z);
    });

    const fenceLines: Array<{ x: number; z: number; count: number; alongX: boolean }> = [
      { x: -15, z: -8, count: 8, alongX: true },
      { x: 15, z: 8, count: 8, alongX: true },
      { x: -8, z: -15, count: 7, alongX: false },
      { x: 8, z: 15, count: 7, alongX: false },
    ];

    let fenceIndex = 0;
    for (const line of fenceLines) {
      for (let index = 0; index < line.count; index += 1) {
        const offset = (index - (line.count - 1) / 2) * 1.25;
        const x = line.x + (line.alongX ? offset : 0);
        const z = line.z + (line.alongX ? 0 : offset);
        this.addDestructibleBox(`tier1-fence-${++fenceIndex}`, x, z, line.alongX ? 1.15 : 0.18, 1.05, line.alongX ? 0.18 : 1.15, '#d5bd8f', PROTOTYPE_DEFAULTS.fenceRequiredScaleToCrush, PROTOTYPE_DEFAULTS.fenceApocalypseReward);
      }
    }
  }

  private createOcclusionBlocks(): void {
    this.addDestructibleBox('tier1-occlusion-block-left', -12, 0, 2.2, 8, 2.2, '#6d7966', PROTOTYPE_DEFAULTS.blockRequiredScaleToCrush, PROTOTYPE_DEFAULTS.leftBlockApocalypseReward);
    this.addDestructibleBox('tier1-occlusion-block-right', 12, -1, 2.2, 11, 2.2, '#647b80', PROTOTYPE_DEFAULTS.blockRequiredScaleToCrush, PROTOTYPE_DEFAULTS.rightBlockApocalypseReward);
  }

  private addDestructibleBox(
    id: string,
    x: number,
    z: number,
    width: number,
    height: number,
    depth: number,
    color: string,
    requiredScaleToCrush: number,
    apocalypseReward: number,
  ): void {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geometry, this.material(color));
    mesh.position.set(x, height / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.addOwned(geometry, mesh);
    this.trampleTargets.push({
      id,
      object: mesh,
      requiredScaleToCrush,
      apocalypseReward,
      radius: Math.max(width, depth) / 2,
    });
  }

  private addDestructibleTable(id: string, x: number, z: number): void {
    const table = new THREE.Group();
    const material = this.material('#a44f35');
    const parts: Array<{ width: number; height: number; depth: number; y: number; x: number; z: number }> = [
      { width: 1.5, height: 0.18, depth: 1.2, y: 0.92, x: 0, z: 0 },
      { width: 0.14, height: 0.82, depth: 0.14, y: 0.41, x: -0.58, z: -0.43 },
      { width: 0.14, height: 0.82, depth: 0.14, y: 0.41, x: 0.58, z: -0.43 },
      { width: 0.14, height: 0.82, depth: 0.14, y: 0.41, x: -0.58, z: 0.43 },
      { width: 0.14, height: 0.82, depth: 0.14, y: 0.41, x: 0.58, z: 0.43 },
    ];

    for (const part of parts) {
      const geometry = new THREE.BoxGeometry(part.width, part.height, part.depth);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(part.x, part.y, part.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.ownedGeometries.push(geometry);
      table.add(mesh);
    }
    table.position.set(x, 0, z);
    this.root.add(table);
    this.trampleTargets.push({
      id,
      object: table,
      requiredScaleToCrush: PROTOTYPE_DEFAULTS.tableRequiredScaleToCrush,
      apocalypseReward: PROTOTYPE_DEFAULTS.tableApocalypseReward,
      radius: 0.85,
    });
  }

  private material(color: THREE.ColorRepresentation): THREE.MeshStandardMaterial {
    const material = new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.92 });
    this.ownedMaterials.push(material);
    return material;
  }

  private addOwned<T extends THREE.Object3D>(geometry: THREE.BufferGeometry, object: T): T {
    this.ownedGeometries.push(geometry);
    this.root.add(object);
    return object;
  }
}
