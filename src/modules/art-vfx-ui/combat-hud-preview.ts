import { eventBus } from '../../core/EventBus';
import type { CuecaStep, InputJudgement } from '../../core/GameContracts';
import { CombatHUD } from './CombatHUD';

const root = document.querySelector<HTMLElement>('#combat-hud');
const nextBeatButton = document.querySelector<HTMLButtonElement>('#beat-next');
const nextStepButton = document.querySelector<HTMLButtonElement>('#step-next');
const addXpButton = document.querySelector<HTMLButtonElement>('#xp-add');
if (!root || !nextBeatButton || !nextStepButton || !addXpButton) throw new Error('Faltan elementos de la vista previa HUD.');

const hud = new CombatHUD({ root });
const steps: readonly CuecaStep[] = ['MediaLuna', 'Escobillado', 'Zapateo', 'Remate'];
let subdivision = 0;
let stepIndex = 0;
let combo = 8;
let xp = 64;
const level = 3;
const xpThreshold = 100;

nextBeatButton.addEventListener('click', () => {
  subdivision = (subdivision + 1) % 6;
  eventBus.emit('OnBeat', {
    subdivisionIndex: subdivision as 0 | 1 | 2 | 3 | 4 | 5,
    isStrongBeat: subdivision === 0 || subdivision === 3,
    beatProgress: subdivision / 6,
    audioTimeSeconds: performance.now() / 1000,
  });
});

document.querySelectorAll<HTMLButtonElement>('[data-judgement]').forEach((button) => {
  button.addEventListener('click', () => {
    const judgement = button.dataset.judgement as InputJudgement;
    combo = judgement === 'MISS' ? 0 : combo + 1;
    eventBus.emit('OnInputEvaluated', { judgement, offsetMs: 0, skillChargeDelta: 0, combo });
  });
});

nextStepButton.addEventListener('click', () => {
  stepIndex = (stepIndex + 1) % steps.length;
  const step = steps[stepIndex];
  eventBus.emit('OnBasicStepAttack', { step, judgement: 'GOOD', position: { x: 0, z: 0 } });
});

addXpButton.addEventListener('click', () => {
  xp = Math.min(xpThreshold, xp + 12);
  hud.setExperience(xp, xpThreshold, level);
});

hud.setExperience(xp, xpThreshold, level);

window.addEventListener('pagehide', () => hud.dispose(), { once: true });
