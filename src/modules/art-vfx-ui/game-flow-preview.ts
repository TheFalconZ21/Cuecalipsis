import { eventBus } from '../../core/EventBus';
import type { GameState, UpgradeChoice } from '../../core/GameContracts';
import { GameFlowUI, type HuasoChoice } from './GameFlowUI';
import './game-flow-ui.css';

const root = document.querySelector<HTMLElement>('#flow-root');
const status = document.querySelector<HTMLElement>('#status');
const confirmButton = document.querySelector<HTMLButtonElement>('#confirm-upgrade');
if (!root || !status || !confirmButton) throw new Error('Faltan elementos de la vista previa de flujo.');

interface GameConfig {
  characters: HuasoChoice[];
  upgrades: Array<{ id: string; name: string; description: string }>;
}
const configResponse = await fetch(new URL('../../core/GameConfigs.json', import.meta.url));
if (!configResponse.ok) throw new Error('No se pudo leer GameConfigs.json.');
const config = await configResponse.json() as GameConfig;

let currentState: GameState = 'MainMenu';
let selectedUpgrade: UpgradeChoice | null = null;
function setState(next: GameState): void {
  const previous = currentState;
  currentState = next;
  eventBus.emit('OnGameStateChanged', { previous, current: next });
}

const flow = new GameFlowUI({
  root,
  characters: config.characters,
  onStart: () => setState('CharacterSelect'),
  onCharacterSelected: (id) => {
    const character = config.characters.find((item) => item.id === id);
    status!.textContent = character ? `${character.name} · ${character.archetype} · ${character.bpm} BPM` : 'Huaso elegido.';
    setState('Playing');
  },
  onUpgradeSelected: (choice) => {
    selectedUpgrade = choice;
    confirmButton!.hidden = false;
    status!.textContent = `Selección enviada al host: ${choice.name}.`;
  },
  onRetry: () => { confirmButton!.hidden = true; setState('Playing'); },
  onReturnToMenu: () => { confirmButton!.hidden = true; setState('MainMenu'); },
});

document.querySelector<HTMLButtonElement>('#levelup')?.addEventListener('click', () => {
  const choices: [UpgradeChoice, UpgradeChoice, UpgradeChoice] = config.upgrades.slice(0, 3).map((upgrade) => ({
    ...upgrade,
    currentLevel: 0,
    nextLevel: 1,
  })) as [UpgradeChoice, UpgradeChoice, UpgradeChoice];
  setState('LevelUpPause');
  eventBus.emit('OnLevelUpReady', { choices });
});
confirmButton.addEventListener('click', () => {
  if (!selectedUpgrade) return;
  flow.confirmUpgradeApplied(selectedUpgrade.id);
  selectedUpgrade = null;
  confirmButton.hidden = true;
  setState('Playing');
});
document.querySelector<HTMLButtonElement>('#victory')?.addEventListener('click', () => setState('Victory'));
document.querySelector<HTMLButtonElement>('#defeat')?.addEventListener('click', () => setState('GameOver'));
document.querySelector<HTMLButtonElement>('#menu')?.addEventListener('click', () => {
  selectedUpgrade = null;
  confirmButton.hidden = true;
  setState('MainMenu');
});

window.addEventListener('pagehide', () => flow.dispose(), { once: true });
