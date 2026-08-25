/**
 * Hybrid Sound Synthesizer (Web Audio API)
 * - Creamy, deep "Thock" mechanical keystrokes & soft backspace.
 * - Melodic Streak Correct: 도(C5) -> 레(D5) -> 미(E5) -> 솔(G5) -> 라(A5) -> 높은 도(C6)
 * - 1차 오답 경고음 / 2차 오답 정답 공개음
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.45;
  private lastKeyTime: number = 0;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  /**
   * Creamy "Thock" Keystroke Sound
   */
  public playMechanicalKey() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    if (now - this.lastKeyTime < 0.02) return;
    this.lastKeyTime = now;

    const pitch = 0.95 + Math.random() * 0.11;

    // 1. Soft cushion transient noise
    const bufferSize = Math.floor(ctx.sampleRate * 0.012);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(1400 * pitch, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(this.volume * 0.24, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSource.start(now);

    // 2. Warm rounded body "thock"
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(310 * pitch, now);
    osc.frequency.exponentialRampToValueAtTime(85 * pitch, now + 0.038);

    gain.gain.setValueAtTime(this.volume * 0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Backspace / Soft hollow clack
   */
  public playBackspace() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.035);

    gain.gain.setValueAtTime(this.volume * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.045);
  }

  /**
   * [Melodic Streak Correct Sound]
   */
  public playStreakCorrect(streak: number = 0) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    const notes = [
      523.25,  // 1번: 도 (C5)
      587.33,  // 2번: 레 (D5)
      659.25,  // 3번: 미 (E5)
      783.99,  // 4번: 솔 (G5)
      880.00,  // 5번: 라 (A5)
      1046.50, // 6번 이상: 높은 도 (C6)
    ];

    const freqIndex = Math.min(streak, notes.length - 1);
    const mainFreq = notes[freqIndex];

    // Tactile Sub-Kick Slam
    const kickOsc = ctx.createOscillator();
    const kickGain = ctx.createGain();
    kickOsc.type = 'sine';
    kickOsc.frequency.setValueAtTime(140 + freqIndex * 10, now);
    kickOsc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

    kickGain.gain.setValueAtTime(this.volume * 0.38, now);
    kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    kickOsc.connect(kickGain);
    kickGain.connect(ctx.destination);
    kickOsc.start(now);
    kickOsc.stop(now + 0.11);

    // Primary Bell Tone
    const mainOsc = ctx.createOscillator();
    const mainGain = ctx.createGain();
    mainOsc.type = 'sine';
    mainOsc.frequency.setValueAtTime(mainFreq, now);

    mainGain.gain.setValueAtTime(0.01, now);
    mainGain.gain.linearRampToValueAtTime(this.volume * 0.35, now + 0.007);
    mainGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

    mainOsc.connect(mainGain);
    mainGain.connect(ctx.destination);
    mainOsc.start(now);
    mainOsc.stop(now + 0.32);

    // Harmonic Overtone
    const harmOsc = ctx.createOscillator();
    const harmGain = ctx.createGain();
    const harmStart = now + 0.02;

    harmOsc.type = 'sine';
    harmOsc.frequency.setValueAtTime(mainFreq * 1.5, harmStart);

    harmGain.gain.setValueAtTime(0.01, harmStart);
    harmGain.gain.linearRampToValueAtTime(this.volume * 0.18, harmStart + 0.006);
    harmGain.gain.exponentialRampToValueAtTime(0.0001, harmStart + 0.25);

    harmOsc.connect(harmGain);
    harmGain.connect(ctx.destination);
    harmOsc.start(harmStart);
    harmOsc.stop(harmStart + 0.28);
  }

  /**
   * 1차 오답 경고음 (부드러운 노란색/주황색 주의 탭)
   */
  public playFirstWrong() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.1);

    gain.gain.setValueAtTime(this.volume * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  /**
   * 2차 오답 후 정답 공개 알림음 (도-라 저음 하강 후 정답 인계)
   */
  public playRevealAnswer() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(440, now);
    osc1.frequency.exponentialRampToValueAtTime(330, now + 0.12);

    gain1.gain.setValueAtTime(this.volume * 0.28, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.16);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(392, now + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(261.63, now + 0.28);

    gain2.gain.setValueAtTime(this.volume * 0.24, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.32);
  }

  /**
   * Reset subtle slide
   */
  public playReset() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.09);

    gain.gain.setValueAtTime(this.volume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.11);
  }

  /**
   * Stage Clear Grand Victory Arpeggio
   */
  public playStageClear() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    const notes = [
      { f: 523.25, d: 0.08 },
      { f: 659.25, d: 0.08 },
      { f: 783.99, d: 0.08 },
      { f: 1046.50, d: 0.1 },
      { f: 1318.51, d: 0.12 },
      { f: 1567.98, d: 0.3 },
    ];

    let timeOffset = 0;
    notes.forEach((note) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.f, now + timeOffset);

      gain.gain.setValueAtTime(0.01, now + timeOffset);
      gain.gain.linearRampToValueAtTime(this.volume * 0.35, now + timeOffset + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + note.d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + timeOffset);
      osc.stop(now + timeOffset + note.d + 0.02);

      timeOffset += note.d * 0.75;
    });
  }
}

export const sound = new SoundEngine();
