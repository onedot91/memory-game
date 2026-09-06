import { isMatch } from '../data';
import { BALANCE, CATEGORIES, DUNGEONS, ITEMS, RELICS, WEAPONS, dungeonById, itemById } from './content';
import type { DungeonId, Enemy, Profile, RelicId, Run, WeaponId } from './types';

export const dayKey = (time = Date.now()) => {
  const date = new Date(time);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const laterDay = (time: number, days: number) => { const date = new Date(time); date.setDate(date.getDate() + days); return dayKey(date.getTime()); };
const level = (run: Run, id: RelicId) => run.relics[id] || 0;

export function freshProfile(): Profile {
  return { version: 1, score: 0, unlockedDungeon: 0, memories: {}, run: null, completed: [], summaries: [], settings: { music: 0.18, effects: 0.2, motion: typeof matchMedia !== 'undefined' ? !matchMedia('(prefers-reduced-motion: reduce)').matches : true } };
}

export function enemiesFor(run: Run): Enemy[] {
  const dungeon = dungeonById(run.dungeon);
  const boss = run.room === 5;
  const elite = run.room === 4 || (run.room === 2 && run.route === 'elite');
  if (boss) return [{ id: `${run.room}-boss`, kind: 3, name: dungeon.boss, hp: dungeon.bossHp, maxHp: dungeon.bossHp, elite: false, boss: true, intent: 0, armor: 0, split: false }];
  return [0, 1, 2].map((kind, index) => {
    const isElite = elite && index === 0;
    const hp = dungeon.hp * (isElite ? 2 : 1);
    return { id: `${run.room}-${kind}`, kind, name: `${isElite ? '정예 ' : ''}${dungeon.enemies[kind]}`, hp, maxHp: hp, elite: isElite, boss: false, intent: (index + run.room) % 3, armor: (run.dungeon === 'library' && kind === 2) || (run.dungeon === 'forge' && kind === 0) ? 2 : run.dungeon === 'abyss' && kind !== 1 ? 1 : 0, split: false };
  });
}

export function roomPlan(run: Run): number[] {
  const count = run.questionOrder.length;
  return count >= 6 ? [0, 1, 2, 3, 4, 5] : count === 5 ? [0, 1, 2, 4, 5] : [0, 1, 4, 5].slice(4 - Math.min(4, count));
}
function roomEnd(run: Run): number {
  const plan = roomPlan(run);
  return Math.ceil((plan.indexOf(run.room) + 1) * run.questionOrder.length / plan.length);
}
export function chooseQuestion(_profile: Profile, run: Run, _now: number): string {
  const current = run.questionOrder.indexOf(run.questionId);
  const pending = run.questionOrder.filter(id => !run.answers[id]);
  if (pending.includes(run.questionId)) return run.questionId;
  return pending.find(id => run.questionOrder.indexOf(id) > current) || pending[0] || run.questionId;
}
export function selectQuestion(profile: Profile, id: string): Profile {
  const old = profile.run;
  if (!old || !['question', 'recovery', 'reward', 'route', 'rest'].includes(old.phase) || !old.questionOrder.includes(id) || old.answers[id] || id === old.questionId) return profile;
  const next = structuredClone(profile);
  next.run!.questionId = id;
  next.run!.attempts = next.run!.attemptsById[id] || 0;
  next.run!.events = [];
  return next;
}

function enterRoom(profile: Profile, now: number) {
  const run = profile.run!;
  run.phase = 'question';
  run.enemies = enemiesFor(run);
  const questions = Math.max(1, roomEnd(run) - Object.keys(run.answers).length);
  const totalHp = run.enemies.reduce((total, enemy) => total + enemy.maxHp, 0);
  const scale = Math.max(1, Math.ceil(questions * BALANCE.damage / totalHp));
  run.enemies.forEach(enemy => { enemy.hp *= scale; enemy.maxHp *= scale; });
  run.bossPhase = 1;
  run.bossShield = run.room === 5;
  run.roomShots = 0;
  run.shield = Math.min(12, run.shield + level(run, 'shelter'));
  run.attempts = 0;
  run.events = [];
  run.notice = run.bossShield ? '봉인의 문제를 기억해내면 보호막이 깨집니다.' : '당신의 기억이 다음 공격을 만듭니다.';
  run.questionId = chooseQuestion(profile, run, now);
  run.attempts = run.attemptsById[run.questionId] || 0;
}

export function startRun(profile: Profile, dungeon: DungeonId, categoryId: string, weapon: WeaponId, now = Date.now(), orderedIds?: string[]): Profile {
  const index = DUNGEONS.findIndex(item => item.id === dungeon);
  const arm = WEAPONS.find(item => item.id === weapon);
  if (index < 0 || index > profile.unlockedDungeon || !arm || arm.unlock > profile.score || !CATEGORIES.some(item => item.id === categoryId)) return profile;
  const next = structuredClone(profile);
  const categoryItems = ITEMS.filter(item => item.categoryId === categoryId).map(item => item.id);
  const questionOrder = [...new Set([...(orderedIds || []).filter(id => categoryItems.includes(id)), ...categoryItems])];
  next.run = { id: `${now}-${Math.random().toString(36).slice(2, 8)}`, dungeon, categoryId, weapon, room: 0, phase: 'question', hp: BALANCE.hp, maxHp: BALANCE.hp, shield: 0, enemies: [], relics: {}, choices: [], rewardsLeft: 0, rewardedRooms: [], route: null, questionId: '', questionOrder, answers: {}, attemptsById: {}, attempts: 0, sequence: 0, history: [], failed: [], blocked: {}, reviewHealed: [], streak: 0, streakBonus: 0, charge: 0, roomShots: 0, bossPhase: 1, bossShield: false, recoveryDone: 0, recoverySeen: [], startedAt: now, correct: 0, answered: 0, reviews: 0, defeats: 0, scoreAtStart: profile.score, notice: '', lastResult: null, events: [] };
  enterRoom(next, now);
  return next;
}

function remember(profile: Profile, run: Run, correct: boolean, now: number) {
  const id = run.questionId;
  const day = dayKey(now);
  const memory = profile.memories[id] || { due: day, stage: 0, correctDays: 0, lastCorrect: '', rewardedDay: '', mistakes: 0 };
  if (correct) {
    if (memory.rewardedDay !== day) { profile.score++; memory.rewardedDay = day; }
    if (memory.lastCorrect !== day) {
      const interval = BALANCE.intervals[Math.min(memory.stage, 3)];
      memory.due = laterDay(now, interval);
      memory.stage = Math.min(3, memory.stage + 1);
      memory.correctDays++;
      memory.lastCorrect = day;
    }
  } else {
    memory.stage = 0;
    memory.due = laterDay(now, 1);
    memory.mistakes++;
  }
  profile.memories[id] = memory;
}

function finishQuestion(run: Run, revealed: boolean) {
  run.answers[run.questionId] = revealed ? 'revealed' : 'correct';
  delete run.attemptsById[run.questionId];
  for (const [id, intervening] of Object.entries(run.blocked)) {
    if (id !== run.questionId && !intervening.includes(run.questionId)) intervening.push(run.questionId);
  }
  run.history.push(run.questionId);
  if (revealed) {
    run.blocked[run.questionId] = [];
    if (!run.failed.includes(run.questionId)) run.failed.push(run.questionId);
  } else {
    run.failed = run.failed.filter(id => id !== run.questionId);
    delete run.blocked[run.questionId];
  }
  run.attempts = 0;
}

function relicChoices(run: Run): RelicId[] {
  const pool = RELICS.filter(relic => level(run, relic.id) < relic.max);
  const seed = [...run.id].reduce((n, char) => n + char.charCodeAt(0), run.room * 17 + run.rewardsLeft * 11);
  return pool.map((relic, i) => ({ id: relic.id, rank: Math.sin(seed + i * 73) })).sort((a, b) => a.rank - b.rank).slice(0, 3).map(relic => relic.id);
}

function completeRoom(profile: Profile, now: number) {
  const run = profile.run!;
  for (const enemy of run.enemies) {
    if (enemy.hp > 0) { enemy.hp = 0; run.events.push({ type: 'defeat', target: enemy.id }); }
  }
  if (run.hp === 0) { run.hp = run.maxHp; run.recoveryDone = 0; }
  run.hp = Math.min(run.maxHp, run.hp + level(run, 'heal'));
  if (Object.keys(run.answers).length === run.questionOrder.length) {
    run.phase = 'victory';
    if (!run.rewardedRooms.includes(5)) {
      run.rewardedRooms.push(5);
      if (!profile.completed.includes(run.dungeon)) profile.completed.push(run.dungeon);
      profile.unlockedDungeon = Math.min(2, Math.max(profile.unlockedDungeon, DUNGEONS.findIndex(item => item.id === run.dungeon) + 1));
      profile.summaries.unshift({ date: dayKey(now), dungeon: run.dungeon, weapon: run.weapon, correct: run.correct, answered: run.answered, reviews: run.reviews, seconds: Math.round((now - run.startedAt) / 1000), relics: { ...run.relics } });
      profile.summaries = profile.summaries.slice(0, 30);
    }
    run.notice = '기억이 돌아왔습니다. 원정 완료!';
  } else {
    run.phase = 'reward';
    run.rewardsLeft = run.room === 2 && run.route === 'elite' ? 2 : 1;
    run.choices = relicChoices(run);
    run.questionId = chooseQuestion(profile, run, now);
    run.attempts = run.attemptsById[run.questionId] || 0;
    run.notice = '방을 정리했습니다. 다음 기억을 위한 힘을 고르세요.';
  }
}

function attack(run: Run) {
  const living = run.enemies.filter(enemy => enemy.hp > 0).sort((a, b) => a.intent - b.intent || a.hp - b.hp);
  let damage = run.weapon === 'rifle' || run.weapon === 'shotgun' ? 5 : run.weapon === 'tesla' || run.weapon === 'wand' ? 4 : 6;
  run.charge++;
  if (run.weapon === 'cannon') {
    if (run.charge % 2) { run.events.push({ type: 'charge' }, { type: 'dodge' }); return; }
    damage = 14;
  }
  damage += level(run, 'power') + (living.length === 1 ? level(run, 'focus') * 2 : 0) + (run.room === 5 ? level(run, 'slayer') * 2 : 0) + (run.roomShots === 0 ? level(run, 'opener') * 3 : 0) + run.streakBonus;
  run.streakBonus = 0;
  const targets = living.map((enemy, index) => {
    let amount = index === 0 ? damage : run.weapon === 'rifle' && index === 1 ? 3 : run.weapon === 'tesla' && index < 3 ? 2 : run.weapon === 'shotgun' ? 1 : 0;
    if (index === 1) amount += level(run, 'pierce') * 2;
    if (index > 0) amount += level(run, 'chain');
    if (amount > 0 && run.dungeon === 'abyss' && enemy.kind === 1 && index > 0) amount++;
    return { enemy, amount };
  });
  run.events.push({ type: 'attack', target: living[0]?.id });
  for (const { enemy, amount } of targets) {
    if (!amount) continue;
    const absorbed = Math.min(enemy.armor, amount);
    enemy.armor -= absorbed;
    const hit = amount - absorbed;
    enemy.hp = Math.max(0, enemy.hp - hit);
    run.events.push({ type: 'hit', target: enemy.id, amount: hit });
    if (!enemy.hp) run.events.push({ type: 'defeat', target: enemy.id });
    if (run.dungeon === 'forge' && enemy.kind === 2 && !enemy.boss && !enemy.split && enemy.hp > 0 && enemy.hp <= enemy.maxHp / 2) {
      enemy.split = true;
      run.enemies.push({ ...enemy, id: `${enemy.id}-split`, name: '작은 분열 기계', hp: 2, maxHp: 2, armor: 0, elite: false, split: true });
    }
  }
  run.roomShots++;
  run.events.push({ type: 'dodge' });
  if (run.weapon === 'wand' && run.charge % 3 === 0) run.shield = Math.min(12, run.shield + 1);
}

export function submitAnswer(profile: Profile, input: string, expectedSequence: number, now = Date.now()): Profile {
  if (!profile.run || profile.run.sequence !== expectedSequence || !input.trim()) return profile;
  let prepared = profile;
  // Optional rewards never interrupt the existing Enter-to-answer learning flow.
  for (let step = 0; step < 4; step++) {
    const run = prepared.run!;
    if (run.phase === 'reward') prepared = takeRelic(prepared, run.choices[0], now);
    else if (run.phase === 'route') prepared = chooseRoute(prepared, 'elite', now);
    else if (run.phase === 'rest') prepared = leaveRest(prepared, now);
    else break;
  }
  const old = prepared.run!;
  if (!['question', 'recovery'].includes(old.phase)) return profile;
  const item = itemById(old.questionId);
  if (!item) return profile;
  const next = structuredClone(prepared);
  const run = next.run!;
  const recovery = run.phase === 'recovery';
  const correct = isMatch(input, item.name, item.aliases);
  const review = Boolean(next.memories[item.id]?.due <= dayKey(now) || run.failed.includes(item.id));
  run.sequence++;
  run.answered++;
  run.events = [];
  run.lastResult = { itemId: item.id, sequence: run.sequence, outcome: correct ? 'correct' : run.attempts === 0 ? 'wrong' : 'revealed', review };
  if (!correct && run.attempts === 0) {
    remember(next, run, false, now);
    run.attempts = 1;
    run.attemptsById[item.id] = 1;
    run.streak = 0;
    run.streakBonus = 0;
    run.notice = '다시 떠올려 보세요. 첫 오답에는 피해를 받지 않습니다.';
    run.events = [{ type: 'guard' }];
    return next;
  }
  if (correct) {
    run.correct++;
    run.streak++;
    if (review) run.reviews++;
    remember(next, run, true, now);
    if (!recovery) {
      if (review && !run.reviewHealed.includes(item.id)) {
        run.reviewHealed.push(item.id); run.shield = Math.min(12, run.shield + 1); run.events.push({ type: 'heal', amount: 1 });
      }
      run.bossShield = false;
      const remaining = Math.max(1, roomEnd(run) - Object.keys(run.answers).length);
      const totalHp = run.enemies.reduce((total, enemy) => total + enemy.hp, 0);
      const volleys = Math.min(100, Math.max(1, Math.ceil(totalHp / remaining / BALANCE.damage)));
      for (let volley = 0; volley < volleys && run.enemies.some(enemy => enemy.hp > 0); volley++) attack(run);
      if (remaining === 1) {
        for (let volley = 0; volley < 100 && run.enemies.some(enemy => enemy.hp > 0); volley++) attack(run);
      }
      if (run.streak % 3 === 0) {
        run.streakBonus = 3 + level(run, 'streak') * 2;
        run.shield = Math.min(12, run.shield + level(run, 'ward'));
      }
    }
    run.notice = review ? '기억 복구! 스스로 떠올린 답이 힘이 됩니다.' : run.streak % 3 === 0 ? '3연속 정답! 다음 공격이 더 강해집니다.' : '정답! 기억을 힘으로 바꿨습니다.';
  } else {
    remember(next, run, false, now);
    run.streak = 0; run.streakBonus = 0;
    if (!recovery) {
      const damage = Math.max(1, (run.room === 5 ? BALANCE.bossMissDamage : BALANCE.missDamage) - level(run, 'armor'));
      const absorbed = Math.min(run.shield, damage);
      run.shield -= absorbed;
      run.hp = Math.max(0, run.hp - (damage - absorbed));
      run.events.push({ type: 'hit', amount: damage - absorbed });
      run.bossShield = false;
      if (run.dungeon === 'forge' && run.enemies.some(enemy => enemy.kind === 1 && enemy.hp > 0)) {
        for (const enemy of run.enemies) if (enemy.hp > 0) enemy.hp = Math.min(enemy.maxHp, enemy.hp + 1);
      }
    }
    run.notice = `정답은 ‘${item.name}’. 확인하고 다음 기억으로 넘어가세요.`;
  }
  finishQuestion(run, !correct);
  if (recovery) {
    run.recoveryDone++;
    run.recoverySeen.push(item.id);
  } else {
    for (const enemy of run.enemies) {
      enemy.intent = (enemy.intent + 2) % 3;
      if (run.dungeon === 'abyss' && enemy.kind === 2 && !enemy.boss && run.sequence % 3 === 0) enemy.armor = 1;
    }
    const boss = run.enemies.find(enemy => enemy.boss);
    if (boss && boss.hp > 0 && boss.hp <= boss.maxHp / 2 && run.bossPhase === 1) {
      run.bossPhase = 2; run.bossShield = true; run.events.push({ type: 'phase' });
      run.notice = '두 번째 봉인! 기억으로 보스의 보호막을 해제하세요.';
    }
  }
  if (!correct) run.phase = 'reveal';
  else settleTurn(next, recovery, now);
  return next;
}

function settleTurn(profile: Profile, recovery: boolean, now: number) {
  const run = profile.run!;
  if (Object.keys(run.answers).length >= roomEnd(run)) {
    if (run.hp === 0 && !recovery) run.defeats++;
    completeRoom(profile, now);
    return;
  }
  if (recovery && run.recoveryDone >= BALANCE.recoveryQuestions) {
    run.hp = run.maxHp;
    run.recoveryDone = 0;
  }
  if (run.hp === 0) {
    if (!recovery) { run.defeats++; run.recoveryDone = 0; }
    run.phase = 'recovery';
  } else run.phase = 'question';
  run.questionId = chooseQuestion(profile, run, now);
  run.attempts = run.attemptsById[run.questionId] || 0;
}

export function acknowledgeReveal(profile: Profile, now = Date.now()): Profile {
  if (profile.run?.phase !== 'reveal') return profile;
  const next = structuredClone(profile);
  const run = next.run!;
  settleTurn(next, run.recoveryDone > 0, now);
  run.events = [];
  return next;
}

function advanceRoom(profile: Profile, now: number) {
  const run = profile.run!;
  const plan = roomPlan(run);
  run.room = plan[plan.indexOf(run.room) + 1] ?? 5;
  run.choices = [];
  if (run.room === 2) { run.phase = 'route'; run.notice = '모험을 이어갈 길을 선택하세요.'; }
  else enterRoom(profile, now);
}

export function takeRelic(profile: Profile, id: RelicId, now = Date.now()): Profile {
  const old = profile.run;
  const relic = RELICS.find(item => item.id === id);
  if (!old || old.phase !== 'reward' || !old.choices.includes(id) || !relic || level(old, id) >= relic.max) return profile;
  const next = structuredClone(profile);
  const run = next.run!;
  run.relics[id] = level(run, id) + 1;
  if (id === 'vitality') { run.maxHp += 2; run.hp = Math.min(run.maxHp, run.hp + 2); }
  if (id === 'heal') run.hp = Math.min(run.maxHp, run.hp + 3);
  run.rewardsLeft--;
  if (run.rewardsLeft > 0) run.choices = relicChoices(run);
  else {
    if (!run.rewardedRooms.includes(run.room)) run.rewardedRooms.push(run.room);
    advanceRoom(next, now);
  }
  return next;
}

export function chooseRoute(profile: Profile, route: 'rest' | 'elite', now = Date.now()): Profile {
  if (profile.run?.phase !== 'route') return profile;
  const next = structuredClone(profile);
  const run = next.run!;
  run.route = route;
  if (route === 'rest') { run.hp = Math.min(run.maxHp, run.hp + BALANCE.restHeal); run.phase = 'rest'; run.notice = '따뜻한 등불 아래에서 체력 4를 회복했습니다.'; }
  else enterRoom(next, now);
  return next;
}

export function leaveRest(profile: Profile, now = Date.now()): Profile {
  if (profile.run?.phase !== 'rest') return profile;
  const next = structuredClone(profile);
  advanceRoom(next, now);
  return next;
}

export function restoreStudyRun(profile: Profile, now = Date.now()): void {
  const run = profile.run;
  if (!run) return;
  const items = ITEMS.filter(item => item.categoryId === run.categoryId).map(item => item.id);
  run.questionOrder ||= items;
  run.answers ||= Object.fromEntries([...new Set(run.history)].filter(id => items.includes(id)).map(id => [id, run.failed.includes(id) ? 'revealed' : 'correct']));
  run.attemptsById ||= run.attempts ? { [run.questionId]: run.attempts } : {};
  if (run.phase !== 'victory' && Object.keys(run.answers).length === run.questionOrder.length) completeRoom(profile, now);
}
