import Phaser from 'phaser';
import { PALETTES, roomCanvas, spriteCanvas } from './art';
import { DUNGEONS, WEAPONS } from './content';
import { sceneLayout } from './sceneLayout';
import type { Enemy, Run } from './types';

type SpriteBounds = { x: number; y: number; width: number; height: number; frameWidth: number; frameHeight: number };

export class DungeonScene extends Phaser.Scene {
  onReady?: () => void;
  private world?: Phaser.GameObjects.Image;
  private hero?: Phaser.GameObjects.Sprite;
  private weapon?: Phaser.GameObjects.Image;
  private shadows?: Phaser.GameObjects.Graphics;
  private effects?: Phaser.GameObjects.Group;
  private actors = new Map<string, Phaser.GameObjects.Sprite>();
  private bars = new Map<string, Phaser.GameObjects.Graphics>();
  private labels = new Map<string, Phaser.GameObjects.Text>();
  private bounds = new Map<string, SpriteBounds>();
  private snapshot: Run | null = null;
  private key = '';
  private sequence = -1;
  private theme = 0;
  private reduced = false;
  private layout = sceneLayout(640, 160);
  private torches: Phaser.GameObjects.Graphics[] = [];
  private telemetry?: (fps: number, objects: number) => void;
  constructor() { super('dungeon'); }
  create() {
    for (let theme = 0; theme < 3; theme++) {
      for (let kind = 0; kind < 4; kind++) for (let frame = 0; frame < 2; frame++) this.addArt(`enemy-${theme}-${kind}-${frame}`, spriteCanvas(kind === 3 ? 'boss' : 'enemy', theme * 3 + kind, theme, 0, 'idle', frame));
    }
    for (let dir = 0; dir < 4; dir++) for (const action of ['idle', 'walk', 'attack', 'hit', 'death']) {
      for (let frame = 0; frame < 4; frame++) this.addArt(`hero-${dir}-${action}-${frame}`, spriteCanvas('hero', 0, 0, dir, action, frame));
      this.anims.create({ key: `hero-${dir}-${action}`, frames: Array.from({ length: 4 }, (_, frame) => ({ key: `hero-${dir}-${action}-${frame}` })), frameRate: action === 'idle' ? 3 : 10, repeat: action === 'walk' || action === 'idle' ? -1 : 0 });
    }
    WEAPONS.forEach((_, index) => this.addArt(`weapon-${index}`, spriteCanvas('weapon', index)));
    this.textures.addCanvas('room', document.createElement('canvas'));
    this.world = this.add.image(0, 0, 'room').setOrigin(0);
    this.shadows = this.add.graphics().setDepth(50);
    this.effects = this.add.group();
    this.hero = this.add.sprite(0, 0, 'hero-0-idle-0');
    this.weapon = this.add.image(0, 0, 'weapon-0');
    this.torches = [this.add.graphics().setDepth(20), this.add.graphics().setDepth(20)];
    this.resizeStage(this.scale.width, this.scale.height);
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.telemetry?.(Math.round(this.game.loop.actualFps), this.children.length) });
    this.hero.play('hero-0-idle');
    this.onReady?.();
  }
  private addArt(key: string, canvas: HTMLCanvasElement) {
    this.textures.addCanvas(key, canvas);
    const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
    let left = canvas.width, top = canvas.height, right = 0, bottom = 0;
    for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) if (pixels[(y * canvas.width + x) * 4 + 3]) {
      left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
    }
    this.bounds.set(key, { x: left, y: top, width: right - left + 1, height: bottom - top + 1, frameWidth: canvas.width, frameHeight: canvas.height });
  }
  setTelemetry(callback: (fps: number, objects: number) => void) { this.telemetry = callback; }
  resizeStage(width: number, height: number) {
    this.layout = sceneLayout(Math.floor(width), Math.floor(height));
    if (!this.world || !this.hero) return;
    this.clearEffects();
    this.redrawRoom();
    this.snapshot?.enemies.filter(enemy => enemy.hp <= 0).forEach(enemy => this.removeEnemy(enemy.id));
    this.positionActors();
    if (this.snapshot) this.drawIndicators(this.snapshot);
    this.hero.play(this.snapshot?.hp === 0 ? 'hero-0-death' : 'hero-0-idle');
  }
  private clearEffects() {
    this.tweens.killAll();
    this.effects?.clear(true, true);
    this.hero?.clearTint();
    this.actors.forEach(actor => actor.clearTint().setAlpha(1));
  }
  private redrawRoom() {
    const { width, height } = this.layout;
    const canvas = roomCanvas(this.theme, (this.snapshot?.room || 0) % 4, width, height);
    const texture = this.textures.get('room') as Phaser.Textures.CanvasTexture;
    texture.setSize(width, height);
    texture.context.clearRect(0, 0, width, height);
    texture.context.drawImage(canvas, 0, 0);
    texture.refresh();
    this.world?.setTexture('room');
    this.torches.forEach((light, index) => {
      const x = index === 0 ? 24 : width - 24;
      light.clear().fillStyle(Phaser.Display.Color.HexStringToColor(PALETTES[this.theme].light).color, 0.06).fillCircle(x, 34, 18);
      light.fillStyle(0xffd771).fillRect(x - 1, 28, 3, 5);
    });
  }
  private place(actor: Phaser.GameObjects.Sprite, key: string, x: number, y: number, height: number) {
    const art = this.bounds.get(key)!;
    actor.setOrigin((art.x + art.width / 2) / art.frameWidth, (art.y + art.height) / art.frameHeight).setScale(height / art.height).setPosition(x, y).setDepth(y + 100);
  }
  private enemyHeight(enemy: Enemy) { return enemy.boss ? this.layout.boss.height : enemy.elite ? this.layout.eliteHeight : this.layout.enemyHeight; }
  private positionActors() {
    if (!this.hero || !this.weapon) return;
    const { hero, weaponWidth } = this.layout;
    this.place(this.hero, 'hero-0-idle-0', hero.x, hero.y, hero.height);
    const arm = this.bounds.get(this.weapon.texture.key)!;
    this.weapon.setOrigin(arm.x / arm.frameWidth, (arm.y + arm.height / 2) / arm.frameHeight).setScale(weaponWidth / arm.width).setPosition(hero.x + 11, hero.y - 22).setDepth(this.hero.depth + 1);
    this.snapshot?.enemies.forEach((enemy, index) => {
      const actor = this.actors.get(enemy.id);
      if (!actor) return;
      const point = enemy.boss ? this.layout.boss : this.layout.enemies[index % this.layout.enemies.length];
      this.place(actor, `enemy-${this.theme}-${enemy.kind}-0`, point.x, point.y, this.enemyHeight(enemy));
    });
  }
  private drawIndicators(run: Run) {
    this.shadows?.clear().fillStyle(0x080713, 0.45).fillEllipse(this.layout.hero.x, this.layout.hero.y + 2, 30, 7);
    run.enemies.forEach(enemy => {
      const actor = this.actors.get(enemy.id), bar = this.bars.get(enemy.id), label = this.labels.get(enemy.id);
      if (!actor || !bar || !label) return;
      const height = this.enemyHeight(enemy), width = enemy.boss ? 76 : enemy.elite ? 48 : 36;
      const bodyWidth = this.bounds.get(`enemy-${this.theme}-${enemy.kind}-0`)!.width * actor.scaleX;
      const top = actor.y - height;
      label.setPosition(actor.x, Math.max(8, top - 12));
      bar.clear(); label.setVisible(enemy.hp > 0);
      if (enemy.hp <= 0) return;
      this.shadows?.fillEllipse(actor.x, actor.y + 2, width, 7);
      bar.fillStyle(0x0b0818).fillRect(actor.x - width / 2 - 1, actor.y + 7, width + 2, 6);
      bar.fillStyle(enemy.boss ? 0xff5ba5 : 0xd5fa78).fillRect(actor.x - width / 2, actor.y + 8, width * enemy.hp / enemy.maxHp, 4);
      if (enemy.intent === 0) {
        const markerX = enemy.boss || enemy.elite ? actor.x - width / 2 - 7 : actor.x;
        bar.fillStyle(0xffd46d).fillTriangle(markerX - 4, top - 10, markerX + 4, top - 10, markerX, top - 4);
      }
      if (enemy.armor > 0 || (enemy.boss && run.bossShield)) bar.lineStyle(1, 0xaabaff, 0.75).strokeEllipse(actor.x, actor.y - height / 2, Math.max(width, bodyWidth) + 18, height + 12);
    });
  }
  private removeEnemy(id: string) {
    this.actors.get(id)?.destroy(); this.actors.delete(id);
    this.bars.get(id)?.destroy(); this.bars.delete(id);
    this.labels.get(id)?.destroy(); this.labels.delete(id);
  }
  sync(run: Run, motion: boolean) {
    this.snapshot = run;
    this.reduced = !motion;
    if (!this.hero || !this.world || !this.weapon) return;
    this.theme = DUNGEONS.findIndex(d => d.id === run.dungeon);
    const roomKey = `${run.id}-${run.room}-${run.defeats}`;
    if (this.key !== roomKey) {
      this.key = roomKey;
      this.sequence = -1;
      this.clearEffects();
      [...this.actors.keys()].forEach(id => this.removeEnemy(id));
      this.redrawRoom();
      this.hero.setAlpha(1).play('hero-0-idle');
    }
    const fresh = this.sequence !== run.sequence;
    this.weapon.setTexture(`weapon-${WEAPONS.findIndex(w => w.id === run.weapon)}`);
    run.enemies.forEach(enemy => {
      if (!this.actors.has(enemy.id) && (enemy.hp > 0 || (fresh && run.events.some(event => event.target === enemy.id)))) {
        const actor = this.add.sprite(0, 0, `enemy-${this.theme}-${enemy.kind}-0`);
        this.actors.set(enemy.id, actor);
        this.bars.set(enemy.id, this.add.graphics().setDepth(390));
        this.labels.set(enemy.id, this.add.text(0, 0, enemy.boss ? 'BOSS' : enemy.elite ? 'ELITE' : '', { fontFamily: 'monospace', fontSize: '11px', color: enemy.boss ? '#ff74b4' : '#dcff71', fontStyle: 'bold' }).setOrigin(0.5).setDepth(400));
        if (motion) { actor.setAlpha(0); this.tweens.add({ targets: actor, alpha: 1, duration: 260 }); }
      }
    });
    this.positionActors();
    this.drawIndicators(run);
    if (!fresh) return;
    this.sequence = run.sequence;
    const hero = this.layout.hero;
    for (const event of run.events) {
      if (event.type === 'attack') {
        const target = this.actors.get(event.target || '');
        this.hero.play('hero-0-attack');
        if (target) this.fire(target, run.weapon);
      }
      if (event.type === 'hit' && event.target) {
        const target = this.actors.get(event.target);
        if (!target) continue;
        const enemy = run.enemies.find(enemy => enemy.id === event.target)!;
        const y = target.y - this.enemyHeight(enemy) / 2;
        const bodyWidth = this.bounds.get(`enemy-${this.theme}-${enemy.kind}-0`)!.width * target.scaleX;
        this.floatText(target.x + bodyWidth / 2 + 18, target.y - this.enemyHeight(enemy) + 12, event.amount ? `−${event.amount}` : 'BLOCK', event.amount ? '#fff6ba' : '#bec7ff');
        if (motion) { target.setTint(0xfff1b8).setTintMode(Phaser.TintModes.FILL); this.time.delayedCall(100, () => target.active && target.clearTint()); this.tweens.add({ targets: target, x: target.x + 4, duration: 60, yoyo: true }); }
        this.sparks(target.x, y, 0xffcd78);
      }
      if (event.type === 'hit' && !event.target) {
        this.hero.play('hero-0-hit'); this.floatText(hero.x, hero.y - hero.height - 12, event.amount ? `−${event.amount}` : 'GUARD', '#ff7bac');
        if (motion) this.cameras.main.shake(90, 0.003);
        const attacker = [...this.actors.values()].find(actor => actor.active && actor.alpha > 0);
        if (attacker) this.projectile(attacker.x, attacker.y - 20, hero.x, hero.y - hero.height / 2, 0xff4a8b);
      }
      if (event.type === 'defeat') {
        const id = event.target || '', actor = this.actors.get(id);
        if (actor) { this.sparks(actor.x, actor.y - 20, 0xd5fa78); this.tweens.add({ targets: actor, alpha: 0, y: actor.y + 6, duration: motion ? 240 : 1, onComplete: () => this.removeEnemy(id) }); }
      }
      if (event.type === 'charge') { this.floatText(hero.x, hero.y - hero.height - 12, 'CHARGING', '#d2a1ff'); this.sparks(this.weapon.x + 14, this.weapon.y, 0xcba1ff); }
      if (event.type === 'dodge' && motion) this.tweens.add({ targets: [this.hero, this.weapon], y: '-=5', duration: 100, yoyo: true, delay: 300 });
      if (event.type === 'phase') { this.floatText(this.layout.width * 0.45, 22, 'PHASE II', '#ff74bc'); if (motion) this.cameras.main.flash(120, 89, 34, 93); }
    }
    const recoveryText = [run.events.some(event => event.type === 'guard') ? 'RECALL!' : '', run.events.some(event => event.type === 'heal') ? '+1 SHIELD' : ''].filter(Boolean).join(' · ');
    if (recoveryText) this.floatText(hero.x, hero.y - hero.height - 12, recoveryText, '#aaffce');
    if (run.hp === 0) this.hero.play('hero-0-death');
    else this.time.delayedCall(480, () => { if (this.hero?.active) this.hero.play('hero-0-idle'); });
  }
  private projectile(x: number, y: number, tx: number, ty: number, color: number) {
    const bullet = this.add.graphics().setDepth(350); this.effects?.add(bullet);
    bullet.fillStyle(color).fillRect(-4, -1, 8, 3).fillStyle(0xfff8cd).fillRect(-1, -1, 3, 1).setPosition(x, y).setRotation(Math.atan2(ty - y, tx - x));
    this.tweens.add({ targets: bullet, x: tx, y: ty, duration: this.reduced ? 80 : 180, onComplete: () => bullet.destroy() });
  }
  private fire(target: Phaser.GameObjects.Sprite, weapon: Run['weapon']) {
    const enemy = this.snapshot!.enemies.find(enemy => this.actors.get(enemy.id) === target)!;
    const x = target.x, y = target.y - this.enemyHeight(enemy) / 2;
    const muzzleX = this.weapon!.x + this.layout.weaponWidth - (weapon === 'wand' ? 8 : 0), muzzleY = this.weapon!.y - (weapon === 'wand' ? 10 : 3);
    const color = weapon === 'tesla' ? 0x85d5ff : weapon === 'wand' ? 0xc5ff79 : 0xffd36f;
    this.sparks(muzzleX, muzzleY, color); this.projectile(muzzleX, muzzleY, x, y, color);
    if (weapon === 'shotgun') { this.projectile(muzzleX, muzzleY, x, y - 6, color); this.projectile(muzzleX, muzzleY, x, y + 6, color); }
    if (weapon === 'tesla' || weapon === 'rifle') {
      const others = [...this.actors.values()].filter(actor => actor !== target);
      for (const other of others.slice(0, weapon === 'tesla' ? 2 : 1)) this.projectile(x, y, other.x, other.y - 20, color);
    }
  }
  private floatText(x: number, y: number, text: string, color: string) {
    const label = this.add.text(x, Math.max(24, y), text, { fontSize: '12px', fontFamily: 'monospace', fontStyle: 'bold', color, stroke: '#100b1b', strokeThickness: 3 }).setOrigin(0.5).setDepth(500);
    this.effects?.add(label);
    label.x = Phaser.Math.Clamp(x, label.width / 2 + 4, this.layout.width - label.width / 2 - 4);
    this.tweens.add({ targets: label, y: Math.max(10, label.y - (this.reduced ? 0 : 14)), alpha: 0, delay: 150, duration: 440, onComplete: () => label.destroy() });
  }
  private sparks(x: number, y: number, color: number) {
    if (this.reduced) return;
    for (let i = 0; i < 7; i++) {
      const particle = this.add.rectangle(x, y, i % 2 + 1, i % 3 + 1, color).setDepth(360); this.effects?.add(particle);
      const angle = i * Math.PI * 2 / 7;
      this.tweens.add({ targets: particle, x: x + Math.cos(angle) * 18, y: y + Math.sin(angle) * 15, alpha: 0, duration: 220 + i * 15, onComplete: () => particle.destroy() });
    }
  }
  update(time: number) {
    if (!this.reduced) this.torches.forEach((light, index) => light.setAlpha(0.75 + Math.sin(time / 240 + index) * 0.2));
    for (const [id, actor] of this.actors) {
      const enemy = this.snapshot?.enemies.find(enemy => enemy.id === id);
      if (enemy && enemy.hp > 0 && actor.active) actor.setTexture(`enemy-${this.theme}-${enemy.kind}-${this.reduced ? 0 : Math.floor(time / 460) % 2}`);
    }
  }
}
