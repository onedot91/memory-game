export type DungeonId = 'library' | 'forge' | 'abyss';
export type WeaponId = 'pistol' | 'rifle' | 'tesla' | 'shotgun' | 'cannon' | 'wand';
export type RelicId = 'power' | 'focus' | 'streak' | 'slayer' | 'pierce' | 'chain' | 'ward' | 'armor' | 'heal' | 'vitality' | 'opener' | 'shelter';
export type RunPhase = 'question' | 'reveal' | 'reward' | 'route' | 'rest' | 'recovery' | 'victory';

export interface MemoryRecord {
  due: string;
  stage: number;
  correctDays: number;
  lastCorrect: string;
  rewardedDay: string;
  mistakes: number;
}

export interface Enemy {
  id: string;
  kind: number;
  name: string;
  hp: number;
  maxHp: number;
  elite: boolean;
  boss: boolean;
  intent: number;
  armor: number;
  split: boolean;
}

export interface BattleEvent {
  type: 'attack' | 'hit' | 'dodge' | 'guard' | 'heal' | 'charge' | 'defeat' | 'phase';
  target?: string;
  amount?: number;
}

export interface QuestionResult {
  itemId: string;
  sequence: number;
  outcome: 'correct' | 'wrong' | 'revealed';
  review: boolean;
}

export interface Run {
  id: string;
  dungeon: DungeonId;
  categoryId: string;
  weapon: WeaponId;
  room: number;
  phase: RunPhase;
  hp: number;
  maxHp: number;
  shield: number;
  enemies: Enemy[];
  relics: Partial<Record<RelicId, number>>;
  choices: RelicId[];
  rewardsLeft: number;
  rewardedRooms: number[];
  route: 'elite' | 'rest' | null;
  questionId: string;
  questionOrder: string[];
  answers: Record<string, 'correct' | 'revealed'>;
  attemptsById: Record<string, number>;
  attempts: number;
  sequence: number;
  history: string[];
  failed: string[];
  blocked: Record<string, string[]>;
  reviewHealed: string[];
  streak: number;
  streakBonus: number;
  charge: number;
  roomShots: number;
  bossPhase: number;
  bossShield: boolean;
  recoveryDone: number;
  recoverySeen: string[];
  startedAt: number;
  correct: number;
  answered: number;
  reviews: number;
  defeats: number;
  scoreAtStart: number;
  notice: string;
  lastResult: QuestionResult | null;
  events: BattleEvent[];
}

export interface DailyMetrics {
  activeSeconds: number;
  learningSeconds: number;
  submissions: number;
  correct: number;
  retries: number;
  reviewAttempts: number;
  reviewCorrect: number;
  roomsCleared: number;
  roomsStarted: number;
  runsStarted: number;
  runsFinished: number;
  visits: number;
}

export interface Profile {
  version: 1;
  lastCategoryId?: string;
  score: number;
  unlockedDungeon: number;
  memories: Record<string, MemoryRecord>;
  run: Run | null;
  completed: DungeonId[];
  settings: { music: number; effects: number; motion: boolean };
  summaries: Array<{ date: string; dungeon: DungeonId; weapon: WeaponId; correct: number; answered: number; reviews: number; seconds: number; relics: Partial<Record<RelicId, number>> }>;
}

export interface MetricsStore {
  version: 1;
  days: Record<string, { classic: DailyMetrics; dungeon: DailyMetrics }>;
}
