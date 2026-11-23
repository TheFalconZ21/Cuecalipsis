/**
 * Fallbacks temporales para el prototipo de Tier 1. Se usan únicamente cuando
 * GameConfigs.json aún no ofrece un valor acordado. No son balance definitivo.
 */
export const PROTOTYPE_DEFAULTS = Object.freeze({
  tierOneApocalypseThreshold: 100,
  minimumScale: 1,
  maximumScale: 4.5,
  tableRequiredScaleToCrush: 1.2,
  tableApocalypseReward: 9,
  fenceRequiredScaleToCrush: 1.05,
  fenceApocalypseReward: 3,
  blockRequiredScaleToCrush: 2.2,
  leftBlockApocalypseReward: 24,
  rightBlockApocalypseReward: 32,
  playerRadiusAtScaleOne: 0.45,
  playerHeightAtScaleOne: 1.8,
  cameraFovDegrees: 60,
  cameraPitchDegrees: 68,
  cameraSubjectScreenHeight: 0.15,
  cameraFollowSharpness: 5.5,
  cameraBeatPulseDistance: 0.12,
  cameraBeatPulseDurationSeconds: 0.12,
  occludedMaterialOpacity: 0.24,
  uncrushablePushSpeed: 1.4,
  uncrushablePushRadius: 0.9,
  defaultPropApocalypseReward: 8,
});
