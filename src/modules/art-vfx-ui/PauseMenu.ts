import { eventBus, type TypedEventBus } from '../../core/EventBus';
import type { GameEvents } from '../../core/GameContracts';

export interface PauseMenuOptions {
  host: HTMLElement;
  setTimeScale: (scale: number) => void;
  restart: () => void;
  enterMainMenu: () => void;
  startGame: () => void;
  pauseDurationSeconds?: number;
  panelDropDurationSeconds?: number;
  bus?: TypedEventBus<GameEvents>;
}

export const PAUSE_MENU_DEFAULTS = {
  pauseDurationSeconds: 0.82,
  panelDropDurationSeconds: 0.72,
} as const;

type Phase = 'playing' | 'pausing' | 'paused' | 'resuming' | 'main-menu';
type View = 'pause' | 'settings' | 'main-menu';

/** Presents a pause flow and changes the host's game-time scale. */
export class PauseMenu {
  private readonly options: PauseMenuOptions;
  private readonly bus: TypedEventBus<GameEvents>;
  private readonly root: HTMLDivElement;
  private readonly stylesheet: HTMLLinkElement;
  private readonly pauseDurationMs: number;
  private readonly dropDurationMs: number;
  private phase: Phase = 'playing';
  private view: View = 'pause';
  private timeScaleFrame: number | null = null;
  private timeScaleGeneration = 0;
  private disposed = false;

  constructor(options: PauseMenuOptions) {
    this.options = options;
    this.bus = options.bus ?? eventBus;
    this.pauseDurationMs = Math.max(0.1, options.pauseDurationSeconds ?? PAUSE_MENU_DEFAULTS.pauseDurationSeconds) * 1000;
    this.dropDurationMs = Math.max(0.1, options.panelDropDurationSeconds ?? PAUSE_MENU_DEFAULTS.panelDropDurationSeconds) * 1000;
    this.root = document.createElement('div');
    this.root.className = 'pause-menu';
    this.root.setAttribute('aria-live', 'polite');
    this.root.style.setProperty('--pause-duration', `${this.pauseDurationMs}ms`);
    this.root.style.setProperty('--panel-drop-duration', `${this.dropDurationMs}ms`);
    this.stylesheet = document.createElement('link');
    this.stylesheet.rel = 'stylesheet';
    this.stylesheet.href = new URL('./pause-menu.css', import.meta.url).href;
    document.head.append(this.stylesheet);
    options.host.append(this.root);
    window.addEventListener('keydown', this.onKeyDown, true);
    this.root.addEventListener('click', this.onClick);
    this.root.addEventListener('input', this.onInput);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.cancelTimeScaleAnimation();
    this.options.setTimeScale(1);
    window.removeEventListener('keydown', this.onKeyDown, true);
    this.root.removeEventListener('click', this.onClick);
    this.root.removeEventListener('input', this.onInput);
    this.root.remove();
    this.stylesheet.remove();
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.code === 'Escape') {
      if (this.phase === 'playing') this.beginPause();
      else if (this.phase === 'paused' && this.view === 'settings') this.showView('pause');
      else if (this.phase === 'paused' && this.view === 'pause') this.resume();
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }

    if (this.phase === 'playing' || this.phase === 'main-menu') return;
    if (event.target instanceof HTMLInputElement) return;

    const buttons = [...this.root.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && buttons.length > 0) {
      const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const next = (current + direction + buttons.length) % buttons.length;
      buttons[next].focus();
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }

    if (!this.root.contains(event.target as Node)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };

  private readonly onClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>('button[data-action]');
    if (!button) return;

    switch (button.dataset.action) {
      case 'resume': this.resume(); break;
      case 'settings': this.showView('settings'); break;
      case 'back': this.showView('pause'); break;
      case 'restart': this.restart(); break;
      case 'main-menu': this.mainMenu(); break;
      case 'start-game': this.options.startGame(); break;
    }
  };

  private readonly onInput = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.name !== 'volume') return;
    const value = this.root.querySelector<HTMLOutputElement>('[data-volume]');
    if (value) value.value = `${target.value}%`;
  };

  private beginPause(): void {
    this.phase = 'pausing';
    this.view = 'pause';
    this.showView('pause');
    requestAnimationFrame(() => this.root.classList.add('is-open'));
    this.animateTimeScale(1, 0, this.pauseDurationMs, () => {
      this.phase = 'paused';
      this.bus.emit('OnGamePauseChanged', { paused: true, reason: 'Manual' });
      this.root.querySelector<HTMLButtonElement>('[data-action="resume"]')?.focus({ preventScroll: true });
    });
  }

  private resume(): void {
    if (this.phase !== 'paused') return;
    this.phase = 'resuming';
    this.bus.emit('OnGamePauseChanged', { paused: false, reason: 'Manual' });
    this.root.classList.remove('is-open');
    this.animateTimeScale(0, 1, this.pauseDurationMs, () => {
      this.phase = 'playing';
      this.root.classList.remove('is-visible');
      this.root.replaceChildren();
    });
  }

  private showView(view: View): void {
    this.view = view;
    this.root.classList.add('is-visible');
    if (view === 'settings') {
      this.root.innerHTML = `
        <section class="pause-menu__panel" role="dialog" aria-modal="true" aria-labelledby="pause-title">
          <p class="pause-menu__eyebrow">AJUSTES</p>
          <h1 id="pause-title">Settings</h1>
          <label class="pause-menu__volume" for="pause-volume"><span>Volumen</span><output data-volume>70%</output></label>
          <input id="pause-volume" name="volume" type="range" min="0" max="100" value="70" aria-label="Volumen de muestra">
          <p class="pause-menu__note">Control visual de ejemplo · audio aún no conectado</p>
          <button class="pause-menu__button" type="button" data-action="back">Back</button>
        </section>`;
    } else if (view === 'main-menu') {
      this.root.innerHTML = `
        <section class="pause-menu__panel pause-menu__panel--home" role="dialog" aria-modal="true" aria-labelledby="pause-title">
          <p class="pause-menu__eyebrow">CUECALIPSIS</p>
          <h1 id="pause-title">Main Menu</h1>
          <p class="pause-menu__note">La plaza espera el próximo baile.</p>
          <button class="pause-menu__button pause-menu__button--primary" type="button" data-action="start-game">Iniciar partida</button>
        </section>`;
    } else {
      this.root.innerHTML = `
        <section class="pause-menu__panel" role="dialog" aria-modal="true" aria-labelledby="pause-title">
          <p class="pause-menu__eyebrow">CUECALIPSIS · ENCUENTRO EN CURSO</p>
          <h1 id="pause-title">En pausa</h1>
          <nav class="pause-menu__actions" aria-label="Menú de pausa">
            <button class="pause-menu__button pause-menu__button--primary" type="button" data-action="resume">Resume</button>
            <button class="pause-menu__button" type="button" data-action="settings">Settings</button>
            <button class="pause-menu__button" type="button" data-action="restart">Restart</button>
            <button class="pause-menu__button" type="button" data-action="main-menu">Main Menu</button>
          </nav>
          <p class="pause-menu__hint">ESC <span>·</span> volver al baile</p>
        </section>`;
    }
    requestAnimationFrame(() => this.root.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true }));
  }

  private restart(): void {
    this.cancelTimeScaleAnimation();
    this.options.setTimeScale(1);
    this.bus.emit('OnGamePauseChanged', { paused: false, reason: 'Manual' });
    this.bus.emit('OnGameReset', {});
    this.options.restart();
  }

  private mainMenu(): void {
    this.cancelTimeScaleAnimation();
    this.options.setTimeScale(1);
    this.bus.emit('OnGamePauseChanged', { paused: false, reason: 'Manual' });
    this.bus.emit('OnGameStateChanged', { previous: 'Playing', current: 'MainMenu' });
    this.phase = 'main-menu';
    this.options.enterMainMenu();
    this.showView('main-menu');
    this.root.classList.add('is-open');
    this.root.querySelector<HTMLButtonElement>('[data-action="start-game"]')?.focus({ preventScroll: true });
  }

  private animateTimeScale(from: number, to: number, durationMs: number, complete: () => void): void {
    this.cancelTimeScaleAnimation();
    const generation = this.timeScaleGeneration;
    const startedAt = performance.now();
    // Wall-clock timing keeps this animation moving while the game clock approaches zero.
    const frame = (now: number): void => {
      if (this.disposed || generation !== this.timeScaleGeneration) return;
      const progress = Math.min(1, (now - startedAt) / durationMs);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      this.options.setTimeScale(from + (to - from) * easeOut);
      if (progress < 1) this.timeScaleFrame = requestAnimationFrame(frame);
      else {
        this.timeScaleFrame = null;
        complete();
      }
    };
    this.timeScaleFrame = requestAnimationFrame(frame);
  }

  private cancelTimeScaleAnimation(): void {
    this.timeScaleGeneration += 1;
    if (this.timeScaleFrame !== null) cancelAnimationFrame(this.timeScaleFrame);
    this.timeScaleFrame = null;
  }
}
