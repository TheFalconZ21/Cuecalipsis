import { eventBus, type TypedEventBus, type Unsubscribe } from '../../core/EventBus';
import type { CuecaStep, GameEvents } from '../../core/GameContracts';

const STEPS: readonly CuecaStep[] = ['MediaLuna', 'Escobillado', 'Zapateo', 'Remate'];
const STEP_LABELS: Record<CuecaStep, string> = {
  MediaLuna: 'Media Luna',
  Escobillado: 'Escobillado',
  Zapateo: 'Zapateo',
  Remate: 'Remate',
};

export interface CombatHUDOptions {
  /** The DOM node that owns this visual overlay. */
  root: HTMLElement;
  /** Optional scoped bus for a game instance or preview. */
  bus?: TypedEventBus<GameEvents>;
}

/** Event driven presentation for the rhythm, XP and current cueca attack HUD. */
export class CombatHUD {
  private readonly root: HTMLElement;
  private readonly bus: TypedEventBus<GameEvents>;
  private readonly unsubs: Unsubscribe[];
  private readonly beatNodes: HTMLSpanElement[];
  private readonly stepNodes: HTMLSpanElement[];
  private readonly xpFill: HTMLDivElement;
  private readonly xpCurrent: HTMLSpanElement;
  private readonly xpNext: HTMLSpanElement;
  private readonly xpLevel: HTMLSpanElement;
  private readonly beatCount: HTMLSpanElement;
  private readonly judgement: HTMLSpanElement;
  private readonly combo: HTMLSpanElement;
  private readonly selectedStep: HTMLSpanElement;
  private disposed = false;

  constructor(options: CombatHUDOptions) {
    this.root = options.root;
    this.bus = options.bus ?? eventBus;
    this.root.classList.add('cueca-hud');
    this.root.setAttribute('aria-label', 'Interfaz de combate');
    this.root.innerHTML = `
      <header class="cueca-hud__top" aria-label="Progreso y ataque actual">
        <section class="cueca-xp" aria-label="Experiencia">
          <div class="cueca-xp__heading">
            <div class="cueca-xp__level">RANGO <strong data-xp-level>01</strong></div>
            <div class="cueca-xp__numbers"><span data-xp-current>0</span><i>/</i><span data-xp-next>100</span> XP</div>
          </div>
          <div class="cueca-xp__track" role="progressbar" aria-label="Experiencia del rango" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
            <div class="cueca-xp__fill" data-xp-fill></div>
            <span class="cueca-xp__shine" aria-hidden="true"></span>
          </div>
          <div class="cueca-xp__caption">CAMINO DE LA CUECA</div>
        </section>

        <section class="cueca-attack" aria-label="Rotación de ataques">
          <div class="cueca-attack__wheel" role="img" aria-label="Rueda de ataques">
            <span class="cueca-attack__step" data-wheel-step="MediaLuna">Media Luna</span>
            <span class="cueca-attack__step" data-wheel-step="Escobillado">Escobillado</span>
            <span class="cueca-attack__step" data-wheel-step="Zapateo">Zapateo</span>
            <span class="cueca-attack__step" data-wheel-step="Remate">Remate</span>
            <span class="cueca-attack__hub" aria-hidden="true"><i></i></span>
          </div>
          <div class="cueca-attack__caption">PASO ACTIVO <strong data-selected-step>Media Luna</strong></div>
        </section>
      </header>

      <footer class="cueca-rhythm" aria-label="Compás de cueca 6/8">
        <div class="cueca-rhythm__label"><span>COMPÁS</span><strong>6 <i>/</i> 8</strong></div>
        <div class="cueca-rhythm__rail" role="img" aria-label="Avance del compás">
          <span class="cueca-rhythm__beat is-strong" data-beat="0"><i></i></span>
          <span class="cueca-rhythm__beat" data-beat="1"><i></i></span>
          <span class="cueca-rhythm__beat" data-beat="2"><i></i></span>
          <span class="cueca-rhythm__beat is-strong" data-beat="3"><i></i></span>
          <span class="cueca-rhythm__beat" data-beat="4"><i></i></span>
          <span class="cueca-rhythm__beat" data-beat="5"><i></i></span>
          <span class="cueca-rhythm__rail-progress" data-beat-progress></span>
        </div>
        <div class="cueca-rhythm__readout"><strong data-beat-count>01</strong><span>/ 06</span><em data-judgement>EN ESPERA</em></div>
        <div class="cueca-rhythm__combo"><span>RACHA</span><strong data-combo>× 00</strong></div>
      </footer>`;

    this.beatNodes = [...this.root.querySelectorAll<HTMLSpanElement>('[data-beat]')];
    this.stepNodes = [...this.root.querySelectorAll<HTMLSpanElement>('[data-wheel-step]')];
    this.xpFill = this.require<HTMLDivElement>('[data-xp-fill]');
    this.xpCurrent = this.require<HTMLSpanElement>('[data-xp-current]');
    this.xpNext = this.require<HTMLSpanElement>('[data-xp-next]');
    this.xpLevel = this.require<HTMLSpanElement>('[data-xp-level]');
    this.beatCount = this.require<HTMLSpanElement>('[data-beat-count]');
    this.judgement = this.require<HTMLSpanElement>('[data-judgement]');
    this.combo = this.require<HTMLSpanElement>('[data-combo]');
    this.selectedStep = this.require<HTMLSpanElement>('[data-selected-step]');

    this.unsubs = [
      this.bus.on('OnBeat', ({ subdivisionIndex, isStrongBeat }) => this.showBeat(subdivisionIndex, isStrongBeat)),
      this.bus.on('OnInputEvaluated', ({ judgement, combo }) => this.showJudgement(judgement, combo)),
      this.bus.on('OnBasicStepAttack', ({ step }) => this.showStep(step)),
      this.bus.on('OnSuperiorStepUnleashed', ({ nextStep }) => this.showStep(nextStep)),
      this.bus.on('OnGameReset', () => this.reset()),
    ];
    this.showStep('MediaLuna');
    this.showBeat(0, true);
  }

  /** XP is owned by the game host; this view only formats and displays it. */
  setExperience(current: number, threshold: number, level = 1): void {
    if (this.disposed) return;
    const safeThreshold = Number.isFinite(threshold) ? Math.max(1, threshold) : 1;
    const safeCurrent = Number.isFinite(current) ? Math.max(0, Math.min(current, safeThreshold)) : 0;
    const safeLevel = Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 1;
    const progress = (safeCurrent / safeThreshold) * 100;
    this.xpCurrent.textContent = Math.floor(safeCurrent).toLocaleString('es-CL');
    this.xpNext.textContent = Math.floor(safeThreshold).toLocaleString('es-CL');
    this.xpLevel.textContent = String(safeLevel).padStart(2, '0');
    this.xpFill.style.width = `${progress}%`;
    const track = this.root.querySelector<HTMLElement>('.cueca-xp__track');
    track?.setAttribute('aria-valuemax', String(Math.floor(safeThreshold)));
    track?.setAttribute('aria-valuenow', String(Math.floor(safeCurrent)));
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const unsubscribe of this.unsubs) unsubscribe();
    this.root.replaceChildren();
    this.root.classList.remove('cueca-hud');
    this.root.removeAttribute('aria-label');
  }

  private showBeat(index: number, strong: boolean): void {
    this.beatNodes.forEach((node, i) => {
      node.classList.toggle('is-current', i === index);
      node.classList.toggle('is-strong-hit', i === index && strong);
    });
    this.beatCount.textContent = String(index + 1).padStart(2, '0');
    const progress = this.root.querySelector<HTMLElement>('[data-beat-progress]');
    if (progress) progress.style.width = `${(index / 5) * 100}%`;
  }

  private showJudgement(result: 'PERFECT' | 'GOOD' | 'MISS', combo: number): void {
    if (this.disposed) return;
    this.judgement.textContent = result === 'PERFECT' ? 'A TIEMPO' : result === 'GOOD' ? 'BIEN' : 'FUERA';
    this.judgement.dataset.result = result.toLowerCase();
    this.combo.textContent = `× ${String(Math.max(0, combo)).padStart(2, '0')}`;
  }

  private showStep(step: CuecaStep): void {
    this.stepNodes.forEach((node) => {
      const active = node.dataset.wheelStep === step;
      node.classList.toggle('is-active', active);
      node.setAttribute('aria-current', active ? 'step' : 'false');
    });
    this.selectedStep.textContent = STEP_LABELS[step];
    this.root.querySelector<HTMLElement>('.cueca-attack__wheel')?.setAttribute('aria-label', `Ataque actual: ${STEP_LABELS[step]}`);
  }

  private reset(): void {
    this.setExperience(0, 100, 1);
    this.showStep(STEPS[0]);
    this.showBeat(0, true);
    this.judgement.textContent = 'EN ESPERA';
    delete this.judgement.dataset.result;
    this.combo.textContent = '× 00';
  }

  private require<T extends Element>(selector: string): T {
    const element = this.root.querySelector<T>(selector);
    if (!element) throw new Error(`No se encontró el elemento HUD ${selector}`);
    return element;
  }
}
