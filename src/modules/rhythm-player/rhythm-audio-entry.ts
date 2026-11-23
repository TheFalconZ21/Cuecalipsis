/// <reference types="vite/client" />

import configText from '../../core/GameConfigs.json?raw';
import './rhythm-clock.js';
import { eventBus } from '../../core/EventBus';
import { RhythmEventBridge, type RhythmClockPort } from './RhythmEventBridge';

interface RhythmConfig {
  bpm: number;
  subdivisionsPerBar: number;
  subdivisionsPerDottedQuarter: number;
  strongSubdivisions: number[];
  validAttackSubdivisions: number[];
  judgementWindowsMs: { perfect: number; good: number };
  audioOffsetMs: number;
  sectionDottedQuarterBeats: number;
  sectionNames: string[];
  damageMultipliers: { perfect: number; good: number; miss: number };
  playback: 'once' | 'loop';
}

interface TrackCharacter { id: string; track: string; bpm: number }
interface AudioGameConfig { rhythm: RhythmConfig; characters: TrackCharacter[] }

interface RhythmClockRuntime extends RhythmClockPort {
  configure(config: Record<string, unknown>): void;
  loadTrack(url: string, options: { loop: boolean }): Promise<{ durationSeconds: number }>;
  start(): Promise<unknown>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  getSnapshot(): { running: boolean; audioTime: number; subdivisionIndex: number; sectionIndex: number };
  readonly running: boolean;
  on(eventName: string, listener: (payload: any) => void): () => void;
}

declare global {
  interface Window { CuecalipsisRhythmClock: RhythmClockRuntime }
}

const gameConfig = JSON.parse(configText) as AudioGameConfig;
const rhythm = gameConfig.rhythm;
const traditional = gameConfig.characters.find(({ id }) => id === 'huaso-tradicional');
if (!traditional) throw new Error('Falta la pista del huaso tradicional en GameConfigs.json.');
const audioAssets = import.meta.glob<string>('../../../assets/audio/music/*.mp3', {
  eager: true,
  query: '?url',
  import: 'default',
});
const trackUrl = audioAssets[`../../../${traditional.track}`];
if (!trackUrl) throw new Error(`No se encontró el archivo configurado: ${traditional.track}`);
const clock = window.CuecalipsisRhythmClock;
const button = document.querySelector<HTMLButtonElement>('#music-toggle');
const status = document.querySelector<HTMLElement>('#rhythm-note');

if (!clock || !button) {
  throw new Error('No se pudo inicializar la pista de cueca en el prototipo.');
}
const musicButton = button;
const trackBpm = traditional.bpm;

clock.configure({
  bpm: rhythm.bpm,
  subdivisionsPerBar: rhythm.subdivisionsPerBar,
  subdivisionsPerDottedQuarter: rhythm.subdivisionsPerDottedQuarter,
  strongSubdivisions: rhythm.strongSubdivisions,
  validAttackSubdivisions: rhythm.validAttackSubdivisions,
  perfectWindowMs: rhythm.judgementWindowsMs.perfect,
  goodWindowMs: rhythm.judgementWindowsMs.good,
  audioOffsetMs: rhythm.audioOffsetMs,
  sectionDottedQuarterBeats: rhythm.sectionDottedQuarterBeats,
  sectionNames: rhythm.sectionNames,
  perfectDamageMultiplier: rhythm.damageMultipliers.perfect,
  goodDamageMultiplier: rhythm.damageMultipliers.good,
  missDamageMultiplier: rhythm.damageMultipliers.miss,
});

const bridge = new RhythmEventBridge(clock);
let loaded = false;
let ended = false;
let startedByUser = false;
let busy = false;

function show(message: string): void {
  if (status) status.textContent = message;
}

async function startMusic(): Promise<void> {
  if (busy) return;
  busy = true;
  musicButton.disabled = true;
  try {
    if (!loaded) {
      show('Cargando cueca...');
      await clock.loadTrack(trackUrl, { loop: rhythm.playback === 'loop' });
      loaded = true;
    }
    if (ended) {
      await clock.stop();
      ended = false;
    }
    await clock.start();
    startedByUser = true;
    musicButton.textContent = 'Ⅱ Pausar cueca';
    musicButton.setAttribute('aria-label', 'Pausar la cueca');
    show(`Cueca sonando · ${trackBpm} BPM · 6/8`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al reproducir la cueca';
    show(message);
    musicButton.textContent = '▶ Reintentar cueca';
  } finally {
    busy = false;
    musicButton.disabled = false;
  }
}

musicButton.addEventListener('click', () => {
  if (clock.running) {
    void clock.pause().then(() => {
      musicButton.textContent = '▶ Reanudar cueca';
      musicButton.setAttribute('aria-label', 'Reanudar la cueca');
      show('Cueca pausada');
    });
  } else {
    void startMusic();
  }
});

clock.on('trackEnded', () => {
  ended = true;
  musicButton.textContent = '▶ Repetir cueca';
  musicButton.setAttribute('aria-label', 'Repetir la cueca');
  show('Cueca terminada');
});

eventBus.on('OnGamePauseChanged', ({ paused }) => {
  if (!startedByUser) return;
  if (paused && clock.running) void clock.pause();
  else if (!paused && !clock.running && !ended) void clock.start();
});

eventBus.on('OnGameReset', () => {
  if (!startedByUser) return;
  void clock.stop().then(() => {
    ended = false;
    return clock.start();
  });
});

window.addEventListener('beforeunload', () => {
  bridge.dispose();
}, { once: true });
