import { dayKey, freshProfile, restoreStudyRun } from './engine';
import { CATEGORIES, DUNGEONS, RELICS, WEAPONS, itemById } from './content';
import type { DailyMetrics, MetricsStore, Profile, RunPhase } from './types';

export const PROFILE_KEY = 'retro_cloze_dungeon_v1';
const METRICS_KEY = 'retro_cloze_metrics_v1';
const phases: RunPhase[] = ['question', 'reveal', 'reward', 'route', 'rest', 'recovery', 'victory'];
export function loadProfile(): { profile: Profile; warning: string } {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { profile: freshProfile(), warning: '' };
    const value = JSON.parse(raw) as Profile;
    if (value.version !== 1 || !Number.isFinite(value.score) || value.score < 0 || !Number.isInteger(value.unlockedDungeon) || value.unlockedDungeon < 0 || value.unlockedDungeon > 2 || !value.memories || typeof value.memories !== 'object' || !Array.isArray(value.completed) || !Array.isArray(value.summaries)) throw new Error('Invalid profile');
    const defaults = freshProfile();
    value.settings = {
      music: Number.isFinite(value.settings?.music) ? Math.max(0, Math.min(1, value.settings.music)) : defaults.settings.music,
      effects: Number.isFinite(value.settings?.effects) ? Math.max(0, Math.min(1, value.settings.effects)) : defaults.settings.effects,
      motion: typeof value.settings?.motion === 'boolean' ? value.settings.motion : defaults.settings.motion,
    };
    for (const memory of Object.values(value.memories)) {
      if (!memory || typeof memory.due !== 'string' || !Number.isFinite(memory.stage) || typeof memory.lastCorrect !== 'string') throw new Error('Invalid memory');
    }
    if (value.run) {
      const run = value.run;
      if (!DUNGEONS.some(d => d.id === run.dungeon) || !CATEGORIES.some(c => c.id === run.categoryId) || !WEAPONS.some(w => w.id === run.weapon) || !phases.includes(run.phase) || !itemById(run.questionId) || !Number.isInteger(run.room) || run.room < 0 || run.room > 5 || !Number.isFinite(run.sequence) || !Number.isFinite(run.hp) || !Number.isFinite(run.maxHp) || !Array.isArray(run.enemies) || !Array.isArray(run.history) || !Array.isArray(run.failed) || !Array.isArray(run.reviewHealed) || !Array.isArray(run.rewardedRooms) || !Array.isArray(run.choices) || !run.blocked || typeof run.blocked !== 'object' || !run.relics || typeof run.relics !== 'object') throw new Error('Invalid run');
      if (run.enemies.some(e => !Number.isFinite(e.hp) || !Number.isFinite(e.maxHp) || typeof e.id !== 'string') || Object.values(run.blocked).some(v => !Array.isArray(v)) || Object.entries(run.relics).some(([key, count]) => !RELICS.some(r => r.id === key) || !Number.isFinite(count))) throw new Error('Invalid battle');
      restoreStudyRun(value);
      run.events = [];
    }
    return { profile: value, warning: '' };
  } catch {
    return { profile: freshProfile(), warning: '저장 기록을 읽을 수 없습니다. 기존 기록은 덮어쓰지 않습니다. 기록을 내보낸 뒤 새 기록 시작을 선택하세요.' };
  }
}

export function saveProfile(profile: Profile): string {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); return ''; }
  catch { return '저장 공간에 기록하지 못했습니다. 현재 게임은 유지됩니다. 나가기 전에 기록을 내보내세요.'; }
}
const emptyMetrics = (): DailyMetrics => ({ activeSeconds: 0, learningSeconds: 0, submissions: 0, correct: 0, retries: 0, reviewAttempts: 0, reviewCorrect: 0, roomsCleared: 0, roomsStarted: 0, runsStarted: 0, runsFinished: 0, visits: 0 });
export function readMetrics(): MetricsStore {
  try {
    const parsed = JSON.parse(localStorage.getItem(METRICS_KEY) || 'null') as MetricsStore | null;
    if (parsed?.version === 1 && parsed.days && typeof parsed.days === 'object') return parsed;
  } catch { /* A missing metrics history does not affect game saves. */ }
  return { version: 1, days: {} };
}
export function recordMetrics(mode: 'classic' | 'dungeon', delta: Partial<DailyMetrics>, now = Date.now()): boolean {
  const store = readMetrics();
  const day = dayKey(now);
  store.days[day] ||= { classic: emptyMetrics(), dungeon: emptyMetrics() };
  store.days[day][mode] ||= emptyMetrics();
  for (const [key, value] of Object.entries(delta)) {
    const field = key as keyof DailyMetrics;
    if (typeof value === 'number') store.days[day][mode][field] = (store.days[day][mode][field] || 0) + value;
  }
  try { localStorage.setItem(METRICS_KEY, JSON.stringify(store)); return true; }
  catch { return false; }
}
export function exportFile(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function exportMetrics() {
  const rows = [['date', 'mode', ...Object.keys(emptyMetrics())]];
  for (const [date, modes] of Object.entries(readMetrics().days)) {
    for (const mode of ['classic', 'dungeon'] as const) rows.push([date, mode, ...Object.keys(emptyMetrics()).map(key => String(modes[mode]?.[key as keyof DailyMetrics] || 0))]);
  }
  exportFile(`memory-dungeon-metrics-${dayKey()}.csv`, '\uFEFF' + rows.map(row => row.join(',')).join('\n'), 'text/csv;charset=utf-8');
}

export function studyOrder(categoryId: string): string[] {
  const category = CATEGORIES.find(item => item.id === categoryId);
  if (!category) return [];
  const items = category.items.map((item, index) => ({ name: item.name, id: `${category.id}:${item.num || index + 1}` }));
  try {
    const orders = JSON.parse(localStorage.getItem('retro_cloze_custom_item_order_v1') || '{}');
    const names: unknown = orders[categoryId];
    if (Array.isArray(names)) return [...new Set([...names.flatMap(name => items.filter(item => item.name === name).map(item => item.id)), ...items.map(item => item.id)])];
  } catch { /* Fall back to the original category order. */ }
  return items.map(item => item.id);
}
