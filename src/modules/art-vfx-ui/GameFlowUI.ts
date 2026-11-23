import { eventBus, type TypedEventBus, type Unsubscribe } from '../../core/EventBus';
import type { GameEvents, GameState, OnLevelUpReadyPayload, UpgradeChoice } from '../../core/GameContracts';

export interface HuasoChoice {
  id: string;
  name: string;
  archetype: string;
  bpm: number;
}

export interface GameFlowUIOptions {
  root: HTMLElement;
  characters: readonly HuasoChoice[];
  bus?: TypedEventBus<GameEvents>;
  onStart?: () => void;
  onCharacterSelected?: (id: string) => void;
  onUpgradeSelected?: (choice: UpgradeChoice) => void;
  onRetry?: () => void;
  onReturnToMenu?: () => void;
}

type Screen = GameState | 'Onboarding' | 'LevelUp';

/** Reactive presentation only; state transitions and gameplay remain in the host. */
export class GameFlowUI {
  private readonly root: HTMLElement;
  private readonly options: GameFlowUIOptions;
  private readonly bus: TypedEventBus<GameEvents>;
  private readonly unsubscribers: Unsubscribe[];
  private screen: Screen = 'Onboarding';
  private choices: readonly UpgradeChoice[] = [];
  private pendingChoice: string | null = null;
  private pendingCharacter: string | null = null;
  private disposed = false;

  constructor(options: GameFlowUIOptions) {
    this.options = options;
    this.root = options.root;
    this.bus = options.bus ?? eventBus;
    this.root.classList.add('cueca-flow');
    this.unsubscribers = [
      this.bus.on('OnGameStateChanged', ({ current }) => this.showState(current)),
      this.bus.on('OnLevelUpReady', (payload) => this.showUpgradeChoices(payload)),
    ];
    this.render();
  }

  /** Called by the game host only after the selected upgrade has been applied. */
  confirmUpgradeApplied(choiceId: string): void {
    if (this.disposed || this.pendingChoice !== choiceId) return;
    this.pendingChoice = null;
    this.screen = 'Playing';
    this.choices = [];
    this.root.classList.remove('is-confirming');
    this.render();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const unsubscribe of this.unsubscribers) unsubscribe();
    this.root.removeEventListener('click', this.onClick);
    this.root.replaceChildren();
    this.root.classList.remove('cueca-flow', 'is-confirming');
  }

  private showState(state: GameState): void {
    if (this.disposed) return;
    this.screen = state;
    if (state !== 'LevelUpPause') {
      this.choices = [];
      this.pendingChoice = null;
      this.root.classList.remove('is-confirming');
    }
    if (state !== 'CharacterSelect') this.pendingCharacter = null;
    this.render();
  }

  private showUpgradeChoices(payload: OnLevelUpReadyPayload): void {
    if (this.disposed || this.pendingChoice) return;
    this.choices = payload.choices;
    this.screen = 'LevelUp';
    this.render();
  }

  private render(): void {
    this.root.innerHTML = '';
    this.root.removeEventListener('click', this.onClick);
    const content = this.screen === 'Onboarding' || this.screen === 'MainMenu' ? this.mainMenu()
      : this.screen === 'CharacterSelect' ? this.characterSelect()
        : this.screen === 'Victory' ? this.endScreen(true)
          : this.screen === 'GameOver' ? this.endScreen(false)
            : this.screen === 'LevelUp' || this.screen === 'LevelUpPause' ? this.upgradeScreen()
              : null;
    if (!content) return;
    this.root.append(content);
    this.root.addEventListener('click', this.onClick);
    this.root.setAttribute('aria-live', 'polite');
  }

  private mainMenu(): HTMLElement {
    return this.panel('PORTADA · CUECALIPSIS', 'La plaza está despierta.', `
      <p class="cueca-flow__copy">El compás ya suena al otro lado de la cordillera.</p>
      <button class="cueca-flow__button cueca-flow__button--primary" data-action="start">Entrar a la rueda <span>↗</span></button>
      <p class="cueca-flow__footnote">ACCIÓN RÍTMICA · 6/8 · CHILE COSMICO</p>`);
  }

  private characterSelect(): HTMLElement {
    const cards = this.options.characters.map((character, index) => `
      <button class="cueca-flow__character" data-action="character" data-id="${escapeHtml(character.id)}" ${this.pendingCharacter ? 'disabled' : ''}>
        <span class="cueca-flow__number">0${index + 1}</span>
        <span class="cueca-flow__character-name">${escapeHtml(character.name)}</span>
        <span class="cueca-flow__character-style">${escapeHtml(character.archetype)}</span>
        <span class="cueca-flow__bpm">${Math.floor(character.bpm)} <small>BPM</small></span>
        <span class="cueca-flow__arrow" aria-hidden="true">↗</span>
      </button>`).join('');
    return this.panel('ELIGE TU HUASO', '¿Quién lleva la cueca?', `
      <p class="cueca-flow__copy">Cinco formas de encender la misma plaza.</p>
      <div class="cueca-flow__characters">${cards}</div>
      <p class="cueca-flow__footnote">EL PULSO CAMBIA · LA RUEDA SIGUE EN 6/8</p>`);
  }

  private upgradeScreen(): HTMLElement {
    const cards = this.choices.map((choice, index) => `
      <button class="cueca-flow__upgrade" data-action="upgrade" data-id="${escapeHtml(choice.id)}" ${this.pendingChoice ? 'disabled' : ''}>
        <span class="cueca-flow__number">${String(index + 1).padStart(2, '0')} / MEJORA</span>
        <strong>${escapeHtml(choice.name)}</strong>
        <span class="cueca-flow__copy">${escapeHtml(choice.description)}</span>
        <small>NV. ${choice.currentLevel} <i>→</i> ${choice.nextLevel}</small>
      </button>`).join('');
    const message = this.choices.length
      ? '<p class="cueca-flow__copy">Una carta para seguir bailando.</p>'
      : '<p class="cueca-flow__copy">Las cartas vienen en camino.</p>';
    const waiting = this.pendingChoice ? '<p class="cueca-flow__waiting">La plaza confirma la mejora…</p>' : '';
    return this.panel('NUEVO GIRO · NIVEL', 'Que no se corte la cueca.', `
      ${message}<div class="cueca-flow__upgrades">${cards}</div>${waiting}`);
  }

  private endScreen(victory: boolean): HTMLElement {
    const title = victory ? 'Zapateo Divino Cósmico' : 'La plaza quedó en silencio';
    const copy = victory ? 'El último compás todavía vibra bajo los pies.' : 'Se acabó esta vuelta. La siguiente puede sonar distinto.';
    const action = victory ? 'Otra vuelta' : 'Intentar otra vez';
    return this.panel(victory ? 'FIN DE LA CUECA' : 'HASTA AQUÍ LLEGÓ', title, `
      <p class="cueca-flow__copy">${copy}</p>
      <button class="cueca-flow__button cueca-flow__button--primary" data-action="retry">${action} <span>↗</span></button>
      ${victory ? '<button class="cueca-flow__button" data-action="menu">Salir a la portada</button>' : ''}`);
  }

  private panel(kicker: string, title: string, body: string): HTMLElement {
    const section = document.createElement('section');
    section.className = 'cueca-flow__panel';
    section.setAttribute('role', 'dialog');
    section.setAttribute('aria-modal', 'true');
    section.innerHTML = `
      <div class="cueca-flow__ornament" aria-hidden="true">✳</div>
      <p class="cueca-flow__kicker">${kicker}</p>
      <h1>${title}</h1>
      ${body}`;
    return section;
  }

  private readonly onClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>('button[data-action]');
    if (!button || button.disabled) return;
    switch (button.dataset.action) {
      case 'start': this.options.onStart?.(); break;
      case 'character': {
        const id = button.dataset.id;
        if (id && !this.pendingCharacter) {
          this.pendingCharacter = id;
          button.classList.add('is-picked');
          this.root.querySelectorAll<HTMLButtonElement>('[data-action="character"]').forEach((item) => { item.disabled = true; });
          this.options.onCharacterSelected?.(id);
        }
        break;
      }
      case 'upgrade': {
        const choice = this.choices.find((item) => item.id === button.dataset.id);
        if (!choice || this.pendingChoice) return;
        this.pendingChoice = choice.id;
        this.root.classList.add('is-confirming');
        this.render();
        this.options.onUpgradeSelected?.(choice);
        break;
      }
      case 'retry': this.options.onRetry?.(); break;
      case 'menu': this.options.onReturnToMenu?.(); break;
    }
  };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
}
