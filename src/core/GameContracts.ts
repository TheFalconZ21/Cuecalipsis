/**
 * Contratos compartidos propuestos desde las skills del proyecto.
 * Los campos de balance y las correspondencias aún pendientes están marcados
 * en GameConfigs.json y en DECISIONS.md de sus módulos responsables.
 */
export type GameState = 'MainMenu' | 'CharacterSelect' | 'Playing' | 'LevelUpPause' | 'Victory' | 'GameOver';
export type TierIndex = 1 | 2 | 3 | 4;
export type HordeLevel = 1 | 2 | 3 | 4 | 5;
export type CuecaStep = 'MediaLuna' | 'Escobillado' | 'Zapateo' | 'Remate';
export type InputJudgement = 'PERFECT' | 'GOOD' | 'MISS';

export interface Vector2XZ { x: number; z: number }
export interface OnBeatPayload { subdivisionIndex: 0 | 1 | 2 | 3 | 4 | 5; isStrongBeat: boolean; beatProgress: number; audioTimeSeconds: number }
export interface OnInputEvaluatedPayload { judgement: InputJudgement; offsetMs: number; skillChargeDelta: number; combo: number }
export interface OnBasicStepAttackPayload { step: CuecaStep; judgement: Exclude<InputJudgement, 'MISS'>; position: Vector2XZ }
export interface OnSuperiorStepUnleashedPayload { completedStep: CuecaStep; nextStep: CuecaStep; position: Vector2XZ }
export interface OnApocalypseGainedPayload { amount: number; source: 'Enemy' | 'Prop'; total: number; tier: TierIndex }
export interface OnBossGateTriggeredPayload { tier: TierIndex }
export interface OnScaleTierChangedPayload { previousTier: TierIndex; newTier: TierIndex; totalScale: number }
export interface OnPropTrampledPayload { propId: string; position: Vector2XZ; tier: TierIndex; apocalypseGained: number }
export interface OnEnemyDamagedPayload { enemyId: string; damage: number; source: string; remainingHealth: number }
export interface OnEnemyDestroyedPayload { enemyId: string; position: Vector2XZ; apocalypseReward: number; hordeLevel: HordeLevel }
export interface OnPlayerHitPayload { damage: number; sourceId: string; invulnerableUntilAudioTime: number }
export interface OnAttackTelegraphPayload { sourceId: string; attackId: string; position: Vector2XZ; durationSeconds: number; beatSubdivision?: 0 | 1 | 2 | 3 | 4 | 5 }
export interface OnBossSpawnedPayload { bossId: string; tier: TierIndex; position: Vector2XZ }
export interface OnBossDefeatedPayload { bossId: string; tier: TierIndex }
export interface UpgradeChoice { id: string; name: string; description: string; currentLevel: number; nextLevel: number }
export interface OnLevelUpReadyPayload { choices: [UpgradeChoice, UpgradeChoice, UpgradeChoice] }
export interface OnGamePauseChangedPayload { paused: boolean; reason: 'Manual' | 'LevelUp' | 'System' }
export interface OnGameResetPayload { seed?: number }
export interface OnGameStateChangedPayload { previous: GameState; current: GameState }

/** Mapa canónico de nombres a payloads utilizado por EventBus. */
export interface GameEvents {
  OnBeat: OnBeatPayload;
  OnInputEvaluated: OnInputEvaluatedPayload;
  OnBasicStepAttack: OnBasicStepAttackPayload;
  OnSuperiorStepUnleashed: OnSuperiorStepUnleashedPayload;
  OnApocalypseGained: OnApocalypseGainedPayload;
  OnBossGateTriggered: OnBossGateTriggeredPayload;
  OnScaleTierChanged: OnScaleTierChangedPayload;
  OnPropTrampled: OnPropTrampledPayload;
  OnEnemyDamaged: OnEnemyDamagedPayload;
  OnEnemyDestroyed: OnEnemyDestroyedPayload;
  OnPlayerHit: OnPlayerHitPayload;
  OnAttackTelegraph: OnAttackTelegraphPayload;
  OnBossSpawned: OnBossSpawnedPayload;
  OnBossDefeated: OnBossDefeatedPayload;
  OnLevelUpReady: OnLevelUpReadyPayload;
  OnGamePauseChanged: OnGamePauseChangedPayload;
  OnGameReset: OnGameResetPayload;
  OnGameStateChanged: OnGameStateChangedPayload;
}
