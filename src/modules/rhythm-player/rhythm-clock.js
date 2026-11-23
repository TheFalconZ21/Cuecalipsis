/*
 * Cuecalipsis RhythmClock
 * AudioContext.currentTime is the only clock source. Timers only wake the
 * scheduler; beat positions are always derived from the DSP timeline.
 */
(() => {
  "use strict";

  const DEFAULT_CONFIG = Object.freeze({
    bpm: 85,
    subdivisionsPerBar: 6,
    subdivisionsPerDottedQuarter: 3,
    strongSubdivisions: Object.freeze([0, 3]),
    validAttackSubdivisions: Object.freeze([0, 2, 4]),
    perfectWindowMs: 45,
    goodWindowMs: 95,
    audioOffsetMs: 0,
    sectionDottedQuarterBeats: 8,
    sectionNames: Object.freeze(["Media Luna", "Escobillado", "Zapateo", "Remate"]),
    scheduleAheadSeconds: 0.12,
    schedulerWakeMs: 8,
    missDamageMultiplier: 0.2
  });

  class RhythmClock {
    constructor(overrides = {}) {
      this.config = Object.freeze({ ...DEFAULT_CONFIG, ...overrides });
      this.eighthSeconds = 60 / this.config.bpm / this.config.subdivisionsPerDottedQuarter;
      this._validateConfig();
      this._context = null;
      this._listeners = new Map();
      this._validAttackSubdivisions = [...this.config.validAttackSubdivisions];
      this._running = false;
      this._hasStarted = false;
      this._epoch = 0;
      this._nextScheduledIndex = 0;
      this._nextEmittedIndex = 0;
      this._lastScheduledSection = -1;
      this._lastEmittedSection = -1;
      this._timer = null;
      this._trackBuffer = null;
      this._trackOptions = { loop: true, offset: 0 };
      this._trackSource = null;
    }

    _validateConfig() {
      const c = this.config;
      if (!(c.bpm > 0)) throw new RangeError("bpm debe ser mayor que 0");
      if (c.subdivisionsPerBar !== 6 || c.subdivisionsPerDottedQuarter !== 3) {
        throw new RangeError("RhythmClock requiere compás 6/8 y tres corcheas por negra con puntillo");
      }
      if (!Array.isArray(c.validAttackSubdivisions) || c.validAttackSubdivisions.length < 1 || c.validAttackSubdivisions.length > 6) {
        throw new RangeError("validAttackSubdivisions debe incluir entre uno y seis slots");
      }
      const slots = new Set(c.validAttackSubdivisions);
      if (slots.size !== c.validAttackSubdivisions.length || [...slots].some(i => !Number.isInteger(i) || i < 0 || i > 5)) {
        throw new RangeError("Los slots de ataque deben ser índices únicos entre 0 y 5");
      }
    }

    get running() { return this._running; }
    get audioContext() { return this._context; }
    get startAudioTime() { return this._epoch; }
    get validAttackSubdivisions() { return [...this._validAttackSubdivisions]; }

    unlockAttackSlot(subdivisionIndex) {
      if (!Number.isInteger(subdivisionIndex) || subdivisionIndex < 0 || subdivisionIndex > 5) {
        throw new RangeError("El slot de ataque debe ser un índice entre 0 y 5");
      }
      if (!this._validAttackSubdivisions.includes(subdivisionIndex)) {
        this._validAttackSubdivisions.push(subdivisionIndex);
        this._validAttackSubdivisions.sort((a, b) => a - b);
        this._emit("attackSlotsChanged", this.validAttackSubdivisions);
      }
    }

    on(eventName, listener) {
      if (typeof listener !== "function") throw new TypeError("listener debe ser una función");
      const listeners = this._listeners.get(eventName) || new Set();
      listeners.add(listener);
      this._listeners.set(eventName, listeners);
      return () => listeners.delete(listener);
    }

    _emit(eventName, payload) {
      const listeners = this._listeners.get(eventName);
      if (!listeners) return;
      for (const listener of [...listeners]) {
        try { listener(payload); }
        catch (error) { console.error("RhythmClock listener error:", eventName, error); }
      }
    }

    setTrackBuffer(buffer, options = {}) {
      if (this._hasStarted) throw new Error("La pista debe asignarse antes de iniciar el reloj");
      if (!buffer || typeof buffer.duration !== "number") throw new TypeError("Se esperaba un AudioBuffer");
      this._trackBuffer = buffer;
      this._trackOptions = { ...this._trackOptions, ...options };
    }

    async start() {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error("Este navegador no ofrece Web Audio");
      this._context = this._context || new AudioContextClass();
      await this._context.resume();

      if (!this._hasStarted) {
        this._epoch = this._context.currentTime + this.config.scheduleAheadSeconds;
        this._nextScheduledIndex = 0;
        this._nextEmittedIndex = 0;
        this._lastScheduledSection = -1;
        this._lastEmittedSection = -1;
        this._hasStarted = true;
        this._startTrackAtEpoch();
        this._emit("started", { audioTime: this._epoch, bpm: this.config.bpm });
      }

      if (!this._running) {
        this._running = true;
        this._pump();
      }
      return this.getSnapshot();
    }

    async pause() {
      if (!this._running) return;
      this._running = false;
      clearTimeout(this._timer);
      this._timer = null;
      await this._context.suspend();
      this._emit("paused", this.getSnapshot());
    }

    async stop() {
      this._running = false;
      clearTimeout(this._timer);
      this._timer = null;
      if (this._trackSource) {
        try { this._trackSource.stop(); } catch (_) { /* Ya se había detenido. */ }
        this._trackSource = null;
      }
      if (this._context && this._context.state === "running") await this._context.suspend();
      this._hasStarted = false;
      this._epoch = 0;
      this._nextScheduledIndex = 0;
      this._nextEmittedIndex = 0;
      this._lastScheduledSection = -1;
      this._lastEmittedSection = -1;
      this._emit("stopped", { audioTime: this._context ? this._context.currentTime : 0 });
    }

    _startTrackAtEpoch() {
      if (!this._trackBuffer) return;
      const source = this._context.createBufferSource();
      source.buffer = this._trackBuffer;
      source.loop = Boolean(this._trackOptions.loop);
      source.connect(this._context.destination);
      source.start(this._epoch, this._trackOptions.offset || 0);
      this._trackSource = source;
    }

    _makeBeat(index, phase) {
      const c = this.config;
      const dottedQuarterBeatIndex = Math.floor(index / c.subdivisionsPerDottedQuarter);
      const barIndex = Math.floor(index / c.subdivisionsPerBar);
      const sectionIndex = Math.floor(dottedQuarterBeatIndex / c.sectionDottedQuarterBeats) % c.sectionNames.length;
      const beat = {
        phase,
        audioTime: this._epoch + index * this.eighthSeconds,
        absoluteSubdivisionIndex: index,
        subdivisionIndex: index % c.subdivisionsPerBar,
        barIndex,
        barNumber: barIndex + 1,
        dottedQuarterBeatIndex,
        sectionIndex,
        sectionName: c.sectionNames[sectionIndex],
        sectionBeatIndex: dottedQuarterBeatIndex % c.sectionDottedQuarterBeats,
        isStrong: c.strongSubdivisions.includes(index % c.subdivisionsPerBar),
        isValidAttack: this._validAttackSubdivisions.includes(index % c.subdivisionsPerBar),
        bpm: c.bpm
      };
      return Object.freeze(beat);
    }

    _pump() {
      if (!this._running || !this._context) return;
      const now = this._context.currentTime;
      const scheduleUntil = now + this.config.scheduleAheadSeconds;

      while (this._epoch + this._nextScheduledIndex * this.eighthSeconds <= scheduleUntil) {
        const beat = this._makeBeat(this._nextScheduledIndex++, "scheduled");
        if (beat.sectionIndex !== this._lastScheduledSection) {
          this._lastScheduledSection = beat.sectionIndex;
          this._emit("sectionScheduled", beat);
        }
        this._emit("beatScheduled", beat);
      }
      while (this._epoch + this._nextEmittedIndex * this.eighthSeconds <= now) {
        const beat = this._makeBeat(this._nextEmittedIndex++, "occurred");
        if (beat.sectionIndex !== this._lastEmittedSection) {
          this._lastEmittedSection = beat.sectionIndex;
          this._emit("sectionChanged", beat);
        }
        this._emit("beat", beat);
      }

      // This timeout only wakes the scheduler. AudioContext.currentTime decides every beat.
      this._timer = setTimeout(() => this._pump(), this.config.schedulerWakeMs);
    }

    getSnapshot() {
      if (!this._context || !this._hasStarted) {
        return { running: false, audioTime: 0, subdivisionIndex: -1, barIndex: -1, beatProgress: 0, sectionIndex: 0 };
      }
      const audioTime = this._context.currentTime;
      const position = (audioTime - this._epoch) / this.eighthSeconds;
      const index = Math.max(0, Math.floor(position));
      const fraction = Math.max(0, Math.min(1, position - index));
      const beat = this._makeBeat(index, "snapshot");
      return { ...beat, running: this._running, audioTime, beatProgress: fraction };
    }

    _inputAudioTime(eventTimestamp) {
      const eventPerfTime = Number.isFinite(eventTimestamp) ? eventTimestamp : performance.now();
      const outputTime = this._context.getOutputTimestamp ? this._context.getOutputTimestamp() : null;
      let audioTime;
      if (outputTime && Number.isFinite(outputTime.performanceTime) && outputTime.performanceTime > 0) {
        audioTime = outputTime.contextTime + (eventPerfTime - outputTime.performanceTime) / 1000;
      } else {
        audioTime = this._context.currentTime + (eventPerfTime - performance.now()) / 1000;
      }
      return audioTime - this.config.audioOffsetMs / 1000;
    }

    judgeInput(eventTimestamp) {
      if (!this._running || !this._hasStarted) {
        return { result: "MISS", errorMs: null, target: null, damageMultiplier: this.config.missDamageMultiplier };
      }
      const inputAudioTime = this._inputAudioTime(eventTimestamp);
      const position = (inputAudioTime - this._epoch) / this.eighthSeconds;
      const approximateBar = Math.floor(position / this.config.subdivisionsPerBar);
      let nearest = null;
      for (let bar = approximateBar - 1; bar <= approximateBar + 1; bar++) {
        if (bar < 0) continue;
        for (const subdivisionIndex of this._validAttackSubdivisions) {
          const absoluteSubdivisionIndex = bar * this.config.subdivisionsPerBar + subdivisionIndex;
          const audioTime = this._epoch + absoluteSubdivisionIndex * this.eighthSeconds;
          const errorMs = (inputAudioTime - audioTime) * 1000;
          if (!nearest || Math.abs(errorMs) < Math.abs(nearest.errorMs)) {
            nearest = { audioTime, errorMs, absoluteSubdivisionIndex };
          }
        }
      }
      if (!nearest) return { result: "MISS", errorMs: null, target: null, damageMultiplier: this.config.missDamageMultiplier };

      const absoluteError = Math.abs(nearest.errorMs);
      const result = absoluteError <= this.config.perfectWindowMs ? "PERFECT"
        : absoluteError <= this.config.goodWindowMs ? "GOOD" : "MISS";
      const target = this._makeBeat(nearest.absoluteSubdivisionIndex, "target");
      const damageMultiplier = result === "PERFECT" ? 2 : result === "GOOD" ? 1.45 : this.config.missDamageMultiplier;
      const judgment = { result, errorMs: nearest.errorMs, target, inputAudioTime, damageMultiplier };
      this._emit("judgment", judgment);
      return judgment;
    }
  }

  window.CuecalipsisRhythmClock = window.CuecalipsisRhythmClock || new RhythmClock();
  window.CuecalipsisRhythmClockDefaults = DEFAULT_CONFIG;
})();
