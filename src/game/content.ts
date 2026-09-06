import { CIVIL_CATEGORIES, NUMBER_CATEGORIES } from '../data';
import type { DungeonId, RelicId, WeaponId } from './types';

export const BALANCE = { hp: 12, damage: 6, missDamage: 2, bossMissDamage: 3, turnMs: 600, recoveryQuestions: 3, restHeal: 4, spacing: 3, intervals: [1, 3, 7, 14] };
export const CATEGORIES = [...CIVIL_CATEGORIES, ...NUMBER_CATEGORIES];
export const ITEMS = CATEGORIES.flatMap(category => category.items.map((item, index) => ({
  ...item, id: `${category.id}:${item.num || index + 1}`, categoryId: category.id,
  category: category.category, number: item.num || String(index + 1).padStart(2, '0'),
})));
export const itemById = (id: string) => ITEMS.find(item => item.id === id);

export const DUNGEONS: Array<{ id: DungeonId; title: string; subtitle: string; description: string; color: string; dark: string; enemies: string[]; boss: string; hp: number; bossHp: number }> = [
  { id: 'library', title: '잊힌 서고', subtitle: 'THE FORGOTTEN ARCHIVE', description: '잠든 기록을 깨우고, 봉인된 사서에게 도전하세요.', color: '#75dcc8', dark: '#163b3c', enemies: ['먹물 책벌레', '떠도는 사서', '서고 경비병'], boss: '봉인된 사서', hp: 8, bossHp: 36 },
  { id: 'forge', title: '태엽 공방', subtitle: 'THE CLOCKWORK FOUNDRY', description: '멈춘 태엽 사이로 기억의 불씨를 옮기세요.', color: '#efb369', dark: '#57392c', enemies: ['갑옷 인형', '수리 드론', '분열 기계'], boss: '태엽 거인', hp: 10, bossHp: 48 },
  { id: 'abyss', title: '망각의 심연', subtitle: 'THE HOLLOW BELOW', description: '흩어진 기억을 이어 망각의 군주를 마주하세요.', color: '#c3a1ef', dark: '#403255', enemies: ['허공의 분신', '사슬 망령', '수정 파수꾼'], boss: '망각의 군주', hp: 12, bossHp: 60 },
];
export const WEAPONS: Array<{ id: WeaponId; name: string; label: string; description: string; unlock: number; color: string }> = [
  { id: 'pistol', name: '기억 권총', label: '균형', description: '한 대상에게 피해 6', unlock: 0, color: '#e8c477' },
  { id: 'rifle', name: '관통 소총', label: '관통', description: '주 대상 5 · 다음 대상 3', unlock: 10, color: '#9ec6c5' },
  { id: 'tesla', name: '연쇄 전기총', label: '연쇄', description: '세 대상에게 피해 4 · 2 · 2', unlock: 25, color: '#91c6ee' },
  { id: 'shotgun', name: '파편 산탄총', label: '확산', description: '주 대상 5 · 나머지 각 1', unlock: 50, color: '#e9a276' },
  { id: 'cannon', name: '공명 대포', label: '충전', description: '정답 두 번마다 피해 14', unlock: 80, color: '#c3a1ef' },
  { id: 'wand', name: '수호 완드', label: '보호', description: '피해 4 · 정답 세 번마다 보호막 1', unlock: 120, color: '#95d4a8' },
];

export const RELICS: Array<{ id: RelicId; name: string; description: string; max: number; type: string }> = [
  { id: 'power', name: '새겨진 탄환', description: '단계마다 주 대상 피해 +1', max: 3, type: '공격' },
  { id: 'focus', name: '사서의 단안경', description: '생존한 적이 하나일 때 단계마다 피해 +2', max: 3, type: '집중' },
  { id: 'streak', name: '공명의 잉크', description: '연속 정답 추가 피해를 단계마다 +2', max: 3, type: '연속' },
  { id: 'slayer', name: '봉인의 파편', description: '보스에게 단계마다 피해 +2', max: 3, type: '보스' },
  { id: 'pierce', name: '꿰뚫는 깃펜', description: '두 번째 적에게 피해 2 추가 · 중복 불가', max: 1, type: '관통' },
  { id: 'chain', name: '번개의 책갈피', description: '다른 모든 적에게 피해 1 추가 · 중복 불가', max: 1, type: '연쇄' },
  { id: 'ward', name: '수호자의 인장', description: '정답 세 번마다 단계만큼 보호막 회복', max: 3, type: '보호' },
  { id: 'armor', name: '은빛 제본', description: '받는 피해 -1 · 최소 피해 1 · 중복 불가', max: 1, type: '방어' },
  { id: 'heal', name: '새벽의 물약', description: '즉시 체력 3 회복 · 이후 방 완료마다 단계만큼 회복', max: 3, type: '회복' },
  { id: 'vitality', name: '심장의 문장', description: '단계마다 최대 체력 +2 · 체력 2 회복', max: 3, type: '생명' },
  { id: 'opener', name: '첫 장의 불꽃', description: '각 방 첫 공격에 단계마다 피해 +3', max: 3, type: '선제' },
  { id: 'shelter', name: '안식의 등불', description: '방에 입장할 때 단계마다 보호막 +1', max: 3, type: '안식' },
];

export const ROOM_NAMES = ['문턱', '회랑', '갈림길', '깊은 방', '수호자의 방', '봉인의 방'];
export const ENEMY_TRAITS = [
  ['정답 공격에 무리가 흩어집니다.', '다음 공격을 예고하는 적부터 자동 조준합니다.', '첫 공격을 막는 갑옷 2를 가집니다.'],
  ['갑옷 2가 첫 공격 피해를 흡수합니다.', '두 번째 오답마다 다른 적의 체력을 1 회복합니다.', '체력이 절반 이하가 되면 작은 기계로 분열합니다.'],
  ['첫 공격에 분신이 걷히고 보호막 1이 사라집니다.', '주변 적과 연결되어 연쇄 공격에 추가 피해를 받습니다.', '세 턴마다 보호막 1을 다시 얻습니다.'],
];

export function dungeonById(id: DungeonId) { return DUNGEONS.find(dungeon => dungeon.id === id) || DUNGEONS[0]; }
export function weaponById(id: WeaponId) { return WEAPONS.find(weapon => weapon.id === id) || WEAPONS[0]; }
