import { eventBus } from '../../core/EventBus';
import type { CuecaStep, GameEvents, Vector2XZ } from '../../core/GameContracts';
import type { TypedEventBus, Unsubscribe } from '../../core/EventBus';

type BeatSubdivision = 0 | 1 | 2 | 3 | 4 | 5;
type RhythmResult = 'PERFECT' | 'GOOD' | 'MISS';

interface RhythmBeat {
  audioTime: number;
  absoluteSubdivisionIndex: number;
  subdivisionIndex: BeatSubdivision;
  barIndex: number;
  sectionIndex: number;
  sectionName: string;
  dottedQuarterBeatIndex: number;
  isStrong: boolean;
  isValidAttack: boolean;
  bpm: number;
}

interface RhythmJudgement {
  result: RhythmResult;
  errorMs: number | null;
  target: RhythmBeat | null;
  damageMultiplier: number;
}

export interface RhythmClockPort {
  on(eventName: string, listener: (payload: any) => void): Unsubscribe;
  judgeInput(eventTimestamp: number): RhythmJudgement;
}

export interface RhythmAttackState { step: CuecaStep; position: Vector2XZ }

/**
 * Traduce los eventos de RhythmClock a contratos compartidos. No mantiene
 * tiempos ni progreso musical propios: todo procede del AudioContext del reloj.
 */
export class RhythmEventBridge {
  private readonly unsubscribers: Unsubscribe[] = [];
  private combo = 0;

  constructor(
    private readonly clock: RhythmClockPort,
    private readonly bus: TypedEventBus<GameEvents> = eventBus,
  ) {
    this.unsubscribers.push(
      clock.on('beatScheduled', (beat: RhythmBeat) => {
        const payload = this.toBeatPayload(beat);
        bus.emit('OnBeatScheduled', { ...payload, targetAudioTimeSeconds: beat.audioTime });
      }),
      clock.on('beat', (beat: RhythmBeat) => bus.emit('OnBeat', this.toBeatPayload(beat))),
      clock.on('sectionScheduled', (beat: RhythmBeat) => bus.emit('OnSectionScheduled', this.toSectionPayload(beat))),
      clock.on('sectionChanged', (beat: RhythmBeat) => bus.emit('OnSectionChanged', this.toSectionPayload(beat))),
      clock.on('attackSlotsChanged', (slots: number[]) => bus.emit('OnAttackSlotsChanged', { subdivisions: slots as BeatSubdivision[] })),
      clock.on('trackEnded', ({ audioTime, snapshot }: { audioTime: number; snapshot: RhythmBeat }) => {
        bus.emit('OnMusicTrackEnded', {
          audioTimeSeconds: audioTime,
          finalSubdivisionIndex: snapshot.subdivisionIndex,
          finalSectionIndex: snapshot.sectionIndex,
        });
      }),
    );
  }

  /** Evalúa el timestamp real del keydown y publica el ataque de esa pulsación. */
  evaluateBasicAttack(eventTimestamp: number, state: RhythmAttackState): RhythmJudgement {
    const result = this.clock.judgeInput(eventTimestamp);
    this.combo = result.result === 'MISS' ? 0 : this.combo + 1;
    this.bus.emit('OnInputEvaluated', {
      judgement: result.result,
      offsetMs: result.errorMs ?? 0,
      skillChargeDelta: 0,
      combo: this.combo,
      damageMultiplier: result.damageMultiplier,
      targetAudioTimeSeconds: result.target?.audioTime,
    });

    if (result.result === 'MISS') {
      this.bus.emit('OnWeakStepAttack', {
        step: state.step,
        judgement: 'MISS',
        position: state.position,
        damageMultiplier: result.damageMultiplier,
        offsetMs: result.errorMs ?? 0,
      });
    } else {
      this.bus.emit('OnBasicStepAttack', {
        step: state.step,
        judgement: result.result,
        position: state.position,
        damageMultiplier: result.damageMultiplier,
      });
    }
    return result;
  }

  /** Espacio/C disparan solo en keydown; repetir por mantener la tecla no cuenta. */
  attachControls(
    target: Window,
    getAttackState: () => RhythmAttackState,
    onUltimate?: () => void,
  ): Unsubscribe {
    let spaceDown = false;
    let ultimateDown = false;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        if (spaceDown || event.repeat) return;
        spaceDown = true;
        this.evaluateBasicAttack(event.timeStamp, getAttackState());
      } else if (event.code === 'KeyC') {
        if (ultimateDown || event.repeat) return;
        ultimateDown = true;
        onUltimate?.();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') spaceDown = false;
      if (event.code === 'KeyC') ultimateDown = false;
    };
    const onBlur = () => { spaceDown = false; ultimateDown = false; };
    target.addEventListener('keydown', onKeyDown);
    target.addEventListener('keyup', onKeyUp);
    target.addEventListener('blur', onBlur);
    return () => {
      target.removeEventListener('keydown', onKeyDown);
      target.removeEventListener('keyup', onKeyUp);
      target.removeEventListener('blur', onBlur);
      onBlur();
    };
  }

  dispose(): void {
    for (const unsubscribe of this.unsubscribers) unsubscribe();
    this.unsubscribers.length = 0;
  }

  private toBeatPayload(beat: RhythmBeat) {
    return {
      subdivisionIndex: beat.subdivisionIndex,
      isStrongBeat: beat.isStrong,
      beatProgress: 0,
      audioTimeSeconds: beat.audioTime,
      absoluteSubdivisionIndex: beat.absoluteSubdivisionIndex,
      barIndex: beat.barIndex,
      sectionIndex: beat.sectionIndex,
      sectionName: this.toCuecaStep(beat.sectionName),
      isValidAttack: beat.isValidAttack,
      bpm: beat.bpm,
    };
  }

  private toSectionPayload(beat: RhythmBeat) {
    return {
      sectionIndex: beat.sectionIndex,
      sectionName: this.toCuecaStep(beat.sectionName),
      dottedQuarterBeatIndex: beat.dottedQuarterBeatIndex,
      audioTimeSeconds: beat.audioTime,
    };
  }

  private toCuecaStep(sectionName: string): CuecaStep {
    if (sectionName === 'Media Luna') return 'MediaLuna';
    if (sectionName === 'Escobillado') return 'Escobillado';
    if (sectionName === 'Zapateo') return 'Zapateo';
    return 'Remate';
  }
}
