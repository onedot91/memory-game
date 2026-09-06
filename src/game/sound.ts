class DungeonSound {
  private context: AudioContext | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private music = 0.18;
  private effects = 0.2;
  private lastEffectAt = -Infinity;
  private step = 0;
  private scene = 0;
  private boss = false;
  private active = false;
  private contextReady() {
    if (!this.context) this.context = new AudioContext();
    if (this.context.state === 'suspended') void this.context.resume().catch(() => {});
    return this.context;
  }
  private tone(frequency: number, duration: number, volume: number, shape: OscillatorType = 'triangle', delay = 0) {
    if (!volume || !this.active) return;
    const ctx = this.contextReady();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = shape; osc.frequency.value = frequency;
    const start = ctx.currentTime + delay;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume * 0.12, start + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    gain.gain.linearRampToValueAtTime(0, start + duration + 0.012);
    osc.connect(gain); gain.connect(ctx.destination); osc.start(start); osc.stop(start + duration + 0.015);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }
  start() {
    this.active = true;
    this.contextReady();
    if (this.timer) return;
    this.timer = setInterval(() => {
      if (document.hidden || !this.active || !this.music) return;
      const scales = [[0, 7, 12, 10, 7, 3, 5, 10], [0, 3, 7, 12, 10, 7, 3, 5], [0, 5, 8, 12, 15, 12, 8, 7]];
      const base = this.scene === 1 ? 146.83 : this.scene === 2 ? 130.81 : 164.81;
      const note = scales[Math.min(2, Math.max(0, this.scene))][Math.floor(this.step / 2) % 8];
      if (this.step % 2 === 0) this.tone(base * 2 ** (note / 12), this.boss ? 0.16 : 0.42, this.music * 0.55);
      if (this.step % 4 === 0) this.tone(base / 2, 0.42, this.music * 0.65, 'sine');
      if (this.boss && this.step % 2) this.tone(base * 2, 0.045, this.music * 0.18, 'square');
      this.step++;
    }, 175);
  }
  configure(music: number, effects: number, scene = 0, boss = false) { this.music = music; this.effects = effects; this.scene = scene; this.boss = boss; }
  effect(kind: 'correct' | 'wrong' | 'reveal' | 'choice' | 'victory') {
    if (!this.active || !this.effects) return;
    const now = performance.now();
    if (now - this.lastEffectAt < 180) return;
    this.lastEffectAt = now;
    if (kind === 'correct') this.tone(392, 0.075, this.effects * 0.2, 'sine');
    if (kind === 'wrong') this.tone(220, 0.09, this.effects * 0.16, 'sine');
    if (kind === 'reveal') this.tone(196, 0.1, this.effects * 0.18, 'sine');
    if (kind === 'choice') this.tone(440, 0.075, this.effects * 0.14, 'sine');
    if (kind === 'victory') [392, 494].forEach((frequency, i) => this.tone(frequency, 0.1, this.effects * 0.15, 'sine', i * 0.13));
  }
  stop() { this.active = false; if (this.timer) clearInterval(this.timer); this.timer = null; if (this.context?.state === 'running') void this.context.suspend(); }
}
export const dungeonSound = new DungeonSound();
