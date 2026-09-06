import Phaser from 'phaser';
import { PALETTES, roomCanvas, spriteCanvas } from './art';
import { DUNGEONS, WEAPONS } from './content';
import type { Run } from './types';

export class DungeonScene extends Phaser.Scene {
  onReady?: () => void;
  private world?: Phaser.GameObjects.Image;
  private hero?: Phaser.GameObjects.Sprite;
  private weapon?: Phaser.GameObjects.Image;
  private actors = new Map<string, Phaser.GameObjects.Sprite>();
  private bars = new Map<string, Phaser.GameObjects.Graphics>();
  private labels = new Map<string, Phaser.GameObjects.Text>();
  private snapshot: Run | null = null;
  private key = '';
  private sequence = -1;
  private theme = 0;
  private reduced = false;
  private torches: Phaser.GameObjects.Graphics[] = [];
  private telemetry?: (fps: number, objects: number) => void;
  constructor() { super('dungeon'); }
  create() {
    for (let theme = 0; theme < 3; theme++) {
      for (let layout = 0; layout < 4; layout++) this.textures.addCanvas(`room-${theme}-${layout}`, roomCanvas(theme, layout));
      for (let kind = 0; kind < 4; kind++) for (let frame = 0; frame < 2; frame++) this.textures.addCanvas(`enemy-${theme}-${kind}-${frame}`, spriteCanvas(kind === 3 ? 'boss' : 'enemy', theme * 3 + kind, theme, 0, 'idle', frame));
    }
    for (let dir = 0; dir < 4; dir++) for (const action of ['idle', 'walk', 'attack', 'hit', 'death']) {
      for (let frame = 0; frame < 4; frame++) this.textures.addCanvas(`hero-${dir}-${action}-${frame}`, spriteCanvas('hero', 0, 0, dir, action, frame));
      this.anims.create({ key: `hero-${dir}-${action}`, frames: Array.from({ length: 4 }, (_, frame) => ({ key: `hero-${dir}-${action}-${frame}` })), frameRate: action === 'idle' ? 3 : 10, repeat: action === 'walk' || action === 'idle' ? -1 : 0 });
    }
    WEAPONS.forEach((_, index) => this.textures.addCanvas(`weapon-${index}`, spriteCanvas('weapon', index)));
    this.world = this.add.image(320, 180, 'room-0-0');
    this.hero = this.add.sprite(180, 224, 'hero-0-idle-0').setScale(1.5).setDepth(250);
    this.weapon = this.add.image(202, 229, 'weapon-0').setScale(0.65).setDepth(252);
    for (const x of [51, 588]) {
      const light = this.add.graphics().setDepth(20);
      light.fillStyle(0x63ffe0, 0.035); light.fillCircle(x, 100, 35); light.fillStyle(0x63ffe0, 0.08); light.fillCircle(x, 100, 18);
      light.fillStyle(0xffd771, 1); light.fillRect(x - 2, 96, 4, 7); light.fillStyle(0xfffece, 1); light.fillRect(x - 1, 95, 2, 5);
      this.torches.push(light);
    }
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.telemetry?.(Math.round(this.game.loop.actualFps), this.children.length) });
    this.hero.play('hero-0-idle');
    if (this.snapshot) this.sync(this.snapshot, !this.reduced);
    this.onReady?.();
  }
  setTelemetry(callback: (fps: number, objects: number) => void) { this.telemetry = callback; }
  sync(run: Run, motion: boolean) {
    this.snapshot = run;
    this.reduced = !motion;
    if (!this.hero || !this.world || !this.weapon) return;
    this.theme = DUNGEONS.findIndex(d => d.id === run.dungeon);
    const roomKey = `${run.id}-${run.room}-${run.defeats}`;
    if (this.key !== roomKey) {
      this.key = roomKey;
      this.sequence = -1;
      this.actors.forEach(actor => actor.destroy()); this.actors.clear();
      this.bars.forEach(bar => bar.destroy()); this.bars.clear();
      this.labels.forEach(label => label.destroy()); this.labels.clear();
      this.world.setTexture(`room-${this.theme}-${run.room % 4}`);
      this.hero.setPosition(180, 224).setAlpha(1).play('hero-0-idle');
    }
    this.weapon.setTexture(`weapon-${WEAPONS.findIndex(w => w.id === run.weapon)}`);
    run.enemies.forEach((enemy, index) => {
      let actor = this.actors.get(enemy.id);
      if (!actor && (enemy.hp > 0 || run.events.some(event => event.target === enemy.id))) {
        const x = enemy.boss ? 421 : 357 + index % 2 * 126;
        const y = enemy.boss ? 213 : 158 + Math.floor(index / 2) * 110 + index % 2 * 44;
        actor = this.add.sprite(x, y, `enemy-${this.theme}-${enemy.kind}-0`).setDepth(y + 25).setScale(enemy.boss ? 1.35 : enemy.elite ? 2.3 : 1.8);
        this.actors.set(enemy.id, actor);
        this.bars.set(enemy.id, this.add.graphics().setDepth(390));
        this.labels.set(enemy.id, this.add.text(x, y - (enemy.boss ? 53 : 38), enemy.boss ? 'BOSS' : enemy.elite ? 'ELITE' : '', { fontFamily: 'monospace', fontSize: '9px', color: enemy.boss ? '#ff74b4' : '#dcff71', fontStyle: 'bold' }).setOrigin(0.5).setDepth(400));
        if (motion) { actor.setAlpha(0); this.tweens.add({ targets: actor, alpha: 1, duration: 260 }); }
      }
      if (!actor) return;
      const bar = this.bars.get(enemy.id)!;
      const width = enemy.boss ? 76 : 40;
      bar.clear();
      if (enemy.hp > 0) {
        bar.fillStyle(0x0b0818); bar.fillRect(actor.x - width / 2 - 1, actor.y + 27, width + 2, 6);
        bar.fillStyle(enemy.boss ? 0xff5ba5 : 0xd5fa78); bar.fillRect(actor.x - width / 2, actor.y + 28, Math.max(0, width * enemy.hp / enemy.maxHp), 3);
        if (enemy.intent === 0) { bar.fillStyle(0xffd46d); bar.fillTriangle(actor.x - 3, actor.y - 31, actor.x + 3, actor.y - 31, actor.x, actor.y - 25); }
        if (enemy.armor > 0 || (enemy.boss && run.bossShield)) { bar.lineStyle(1, 0xaabaff, 0.75); bar.strokeCircle(actor.x, actor.y + 3, enemy.boss ? 43 : 23); }
      }
    });
    if (this.sequence === run.sequence) return;
    const first = this.sequence === -1;
    this.sequence = run.sequence;
    if (first && run.events.length === 0) return;
    for (const event of run.events) {
      if (event.type === 'attack') {
        const target = this.actors.get(event.target || '');
        this.hero.play('hero-0-attack');
        if (target) this.fire(target.x, target.y, run.weapon);
      }
      if (event.type === 'hit' && event.target) {
        const target = this.actors.get(event.target);
        if (!target) continue;
        this.floatText(target.x, target.y - 10, event.amount ? `−${event.amount}` : 'BLOCK', event.amount ? '#fff6ba' : '#bec7ff');
        if (motion) { target.setTint(0xfff1b8).setTintMode(Phaser.TintModes.FILL); this.time.delayedCall(100, () => target.active && target.clearTint()); this.tweens.add({ targets: target, x: target.x + 4, duration: 60, yoyo: true }); }
        this.sparks(target.x, target.y, 0xffcd78);
      }
      if (event.type === 'hit' && !event.target) {
        this.hero.play('hero-0-hit'); this.floatText(180, 195, event.amount ? `−${event.amount}` : 'GUARD', '#ff7bac');
        if (motion) this.cameras.main.shake(90, 0.003);
        const attacker = [...this.actors.values()].find(actor => actor.active && actor.alpha > 0);
        if (attacker) this.projectile(attacker.x, attacker.y, 180, 224, 0xff4a8b);
      }
      if (event.type === 'defeat') {
        const actor = this.actors.get(event.target || '');
        if (actor) { this.sparks(actor.x, actor.y, 0xd5fa78); this.tweens.add({ targets: actor, alpha: 0, y: actor.y + 6, duration: motion ? 240 : 1, onComplete: () => { actor.destroy(); this.actors.delete(event.target!); this.bars.get(event.target!)?.destroy(); this.bars.delete(event.target!); this.labels.get(event.target!)?.destroy(); this.labels.delete(event.target!); } }); }
      }
      if (event.type === 'heal') this.floatText(180, 182, '+1 SHIELD', '#aaffce');
      if (event.type === 'guard') this.floatText(180, 182, 'RECALL!', '#fddd70');
      if (event.type === 'charge') { this.floatText(180, 177, 'CHARGING', '#d2a1ff'); this.sparks(197, 220, 0xcba1ff); }
      if (event.type === 'dodge' && motion) this.tweens.add({ targets: [this.hero, this.weapon], y: '-=5', duration: 100, yoyo: true, delay: 300 });
      if (event.type === 'phase') { this.floatText(420, 121, 'PHASE II', '#ff74bc'); if (motion) this.cameras.main.flash(120, 89, 34, 93); }
    }
    if (run.hp === 0) this.hero.play('hero-0-death');
    else this.time.delayedCall(480, () => { if (this.hero?.active) this.hero.play('hero-0-idle'); });
  }
  private projectile(x: number, y: number, tx: number, ty: number, color: number) {
    const bullet = this.add.graphics().setDepth(350);
    bullet.fillStyle(color, 1); bullet.fillRect(-3, -1, 6, 3); bullet.fillStyle(0xfff8cd); bullet.fillRect(-1, -1, 3, 1); bullet.setPosition(x, y).setRotation(Math.atan2(ty - y, tx - x));
    this.tweens.add({ targets: bullet, x: tx, y: ty, duration: this.reduced ? 80 : 180, onComplete: () => bullet.destroy() });
  }
  private fire(x: number, y: number, weapon: Run['weapon']) {
    const color = weapon === 'tesla' ? 0x85d5ff : weapon === 'wand' ? 0xc5ff79 : 0xffd36f;
    this.sparks(205, 220, color);
    this.projectile(205, 220, x, y, color);
    if (weapon === 'shotgun') { this.projectile(205, 220, x, y - 6, color); this.projectile(205, 220, x, y + 6, color); }
    if (weapon === 'tesla' || weapon === 'rifle') {
      const others = [...this.actors.values()].filter(a => a.x !== x);
      for (const target of others.slice(0, weapon === 'tesla' ? 2 : 1)) this.projectile(x, y, target.x, target.y, color);
    }
  }
  private floatText(x: number, y: number, text: string, color: string) {
    const label = this.add.text(x, y, text, { fontSize: '12px', fontFamily: 'monospace', fontStyle: 'bold', color, stroke: '#100b1b', strokeThickness: 3 }).setOrigin(0.5).setDepth(500);
    this.tweens.add({ targets: label, y: y - (this.reduced ? 0 : 20), alpha: 0, delay: 150, duration: 440, onComplete: () => label.destroy() });
  }
  private sparks(x: number, y: number, color: number) {
    if (this.reduced) return;
    for (let i = 0; i < 7; i++) {
      const particle = this.add.rectangle(x, y, i % 2 + 1, i % 3 + 1, color).setDepth(360);
      const angle = i * Math.PI * 2 / 7;
      this.tweens.add({ targets: particle, x: x + Math.cos(angle) * 18, y: y + Math.sin(angle) * 15, alpha: 0, duration: 220 + i * 15, onComplete: () => particle.destroy() });
    }
  }
  update(time: number) {
    if (!this.reduced) this.torches.forEach((light, index) => light.setAlpha(0.75 + Math.sin(time / 240 + index) * 0.2));
    for (const [id, actor] of this.actors) {
      const enemy = this.snapshot?.enemies.find(e => e.id === id);
      if (enemy && enemy.hp > 0 && actor.active) actor.setTexture(`enemy-${this.theme}-${enemy.kind}-${this.reduced ? 0 : Math.floor(time / 460) % 2}`);
    }
  }
}
