export interface MainMenuUIOptions {
  root: HTMLElement;
  onPlay: () => void | Promise<void>;
}

type MenuScreen = 'home' | 'settings';

/** Menú inicial ligero; el juego se monta solo después de elegir Play. */
export class MainMenuUI {
  private readonly options: MainMenuUIOptions;
  private screen: MenuScreen = 'home';
  private volume = this.readVolume();

  constructor(options: MainMenuUIOptions) {
    this.options = options;
    options.root.classList.add('cueca-main-menu');
    options.root.addEventListener('click', this.onClick);
    options.root.addEventListener('input', this.onInput);
    this.render();
  }

  dispose(): void {
    this.options.root.removeEventListener('click', this.onClick);
    this.options.root.removeEventListener('input', this.onInput);
    this.options.root.replaceChildren();
    this.options.root.classList.remove('cueca-main-menu');
  }

  private render(): void {
    this.options.root.innerHTML = this.screen === 'home' ? this.homeScreen() : this.settingsScreen();
    this.options.root.querySelector<HTMLInputElement>('[data-volume]')?.setAttribute('value', String(this.volume));
    this.updateVolumeLabel();
  }

  private homeScreen(): string {
    return `
      <main class="cueca-menu__layout" aria-label="Menú principal">
        <div class="cueca-menu__sun" aria-hidden="true"></div>
        <section class="cueca-menu__card">
          <img class="cueca-menu__logo" src="/assets/ui/cuecalipsis-fiesta-chilena.webp" alt="Cuecalipsis" />
          <p class="cueca-menu__eyebrow">EL FIN DEL MUNDO, AL RITMO DE CUECA</p>
          <h1>La plaza está despierta.</h1>
          <p class="cueca-menu__copy">Junta la rueda. Que empiece el zapateo.</p>
          <div class="cueca-menu__actions">
            <button class="cueca-menu__button cueca-menu__button--play" data-action="play">Play <span aria-hidden="true">↗</span></button>
            <button class="cueca-menu__button" data-action="settings">Settings</button>
            <button class="cueca-menu__button cueca-menu__button--quiet" data-action="exit">Salir</button>
          </div>
          <p class="cueca-menu__status" data-status aria-live="polite">CUECA CÓSMICA · 6/8</p>
        </section>
        <span class="cueca-menu__stamp" aria-hidden="true">SANTIAGO · 6/8</span>
      </main>`;
  }

  private settingsScreen(): string {
    return `
      <main class="cueca-menu__layout" aria-label="Ajustes">
        <div class="cueca-menu__sun" aria-hidden="true"></div>
        <section class="cueca-menu__card cueca-menu__card--settings">
          <p class="cueca-menu__eyebrow">ANTES DE SALIR A LA RUEDA</p>
          <h1>Settings</h1>
          <label class="cueca-menu__volume" for="menu-volume"><span>Volumen general</span><strong data-volume-label></strong></label>
          <input id="menu-volume" data-volume type="range" min="0" max="100" step="1" value="${this.volume}" />
          <button class="cueca-menu__button" data-action="back">Volver</button>
        </section>
        <span class="cueca-menu__stamp" aria-hidden="true">SANTIAGO · 6/8</span>
      </main>`;
  }

  private readonly onClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>('button[data-action]');
    if (!button) return;
    switch (button.dataset.action) {
      case 'play': void this.startGame(button); break;
      case 'settings': this.screen = 'settings'; this.render(); break;
      case 'back': this.screen = 'home'; this.render(); break;
      case 'exit': this.exitGame(); break;
    }
  };

  private readonly onInput = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.dataset.volume === undefined) return;
    this.volume = Math.max(0, Math.min(100, Number(target.value) || 0));
    try { localStorage.setItem('cuecalipsis-volume', String(this.volume)); } catch { /* El ajuste sigue visible aunque el navegador bloquee almacenamiento. */ }
    this.updateVolumeLabel();
    window.dispatchEvent(new CustomEvent('cuecalipsis:volume-change', { detail: { volume: this.volume / 100 } }));
  };

  private async startGame(button: HTMLButtonElement): Promise<void> {
    button.disabled = true;
    const status = this.options.root.querySelector<HTMLElement>('[data-status]');
    if (status) status.textContent = 'ABRIENDO LA PLAZA…';
    try {
      await this.options.onPlay();
    } catch (error) {
      button.disabled = false;
      if (status) status.textContent = error instanceof Error ? error.message : 'No se pudo abrir la partida.';
    }
  }

  private exitGame(): void {
    window.close();
    window.setTimeout(() => {
      if (!window.closed) {
        const status = this.options.root.querySelector<HTMLElement>('[data-status]');
        if (status) status.textContent = 'Cierra esta pestaña para salir de Cuecalipsis.';
      }
    }, 80);
  }

  private readVolume(): number {
    try {
      const saved = localStorage.getItem('cuecalipsis-volume');
      if (saved === null) return 70;
      const stored = Number(saved);
      return Number.isFinite(stored) && stored >= 0 && stored <= 100 ? stored : 70;
    } catch {
      return 70;
    }
  }

  private updateVolumeLabel(): void {
    const label = this.options.root.querySelector<HTMLElement>('[data-volume-label]');
    if (label) label.textContent = `${this.volume}%`;
  }
}
