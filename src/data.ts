export interface CategoryItem {
  num?: string;
  name: string;
  aliases?: string[];
}

export interface CategoryData {
  id: string;
  category: string;
  group: 'civil' | 'number';
  items: CategoryItem[];
}

export interface TopicGroup {
  id: 'civil' | 'number';
  name: string;
  icon: string;
}

export const TOPIC_GROUPS: TopicGroup[] = [
  { id: 'civil', name: '공무원 핵심 암기', icon: '🏛️' },
  { id: 'number', name: '숫자(00~99) 낱말 암기', icon: '🔢' }
];

// 1. 공무원 핵심 암기 데이터
export const CIVIL_CATEGORIES: CategoryData[] = [
  {
    id: "civil-punishment",
    category: "징계 종류",
    group: "civil",
    items: [
      { num: "01", name: "견책", aliases: ["견책"] },
      { num: "02", name: "감봉", aliases: ["감봉"] },
      { num: "03", name: "정직", aliases: ["정직"] },
      { num: "04", name: "강등", aliases: ["강등"] },
      { num: "05", name: "해임", aliases: ["해임"] },
      { num: "06", name: "파면", aliases: ["파면"] }
    ]
  },
  {
    id: "civil-5misconduct",
    category: "5대 비위",
    group: "civil",
    items: [
      { num: "01", name: "성비위", aliases: ["성비위", "성범죄", "성폭력", "성희롱"] },
      { num: "02", name: "성적조작", aliases: ["성적조작", "성적 조작", "성적비리", "성적 비리"] },
      { num: "03", name: "음주운전", aliases: ["음주운전", "음주", "음주 운전"] },
      { num: "04", name: "학생 폭행", aliases: ["학생 폭행", "학생폭행", "체벌", "폭행"] },
      { num: "05", name: "금품수수 및 횡령", aliases: ["금품수수 및 횡령", "금품수수및횡령", "금품수수", "횡령", "금품 수수", "금품수수 및 유용", "금품·향응수수", "공금횡령"] }
    ]
  },
  {
    id: "civil-8duties",
    category: "8대 의무",
    group: "civil",
    items: [
      { num: "01", name: "선서 의무", aliases: ["선서", "선서의무", "선서 의무", "선서의 의무"] },
      { num: "02", name: "복종의 의무", aliases: ["복종", "복종의무", "복종 의무", "복종의 의무"] },
      { num: "03", name: "비밀 엄수의 의무", aliases: ["비밀엄수", "비밀엄수의무", "비밀 엄수의 의무", "비밀 엄수", "비밀엄수의 의무"] },
      { num: "04", name: "청렴의 의무", aliases: ["청렴", "청렴의무", "청렴 의무", "청렴의 의무"] },
      { num: "05", name: "성실 의무", aliases: ["성실", "성실의무", "성실 의무", "성실의 의무"] },
      { num: "06", name: "품위유지의 의무", aliases: ["품위유지", "품위유지의무", "품위 유지", "품위유지의 의무", "품위 유지의 의무"] },
      { num: "07", name: "친절 공정의 의무", aliases: ["친절공정", "친절공정의무", "친절 공정의 의무", "친절공정의 의무", "친절·공정의 의무", "친절", "공정"] },
      { num: "08", name: "종교 중립의 의무", aliases: ["종교중립", "종교중립의무", "종교 중립의 의무", "종교 중립", "종교중립의 의무"] }
    ]
  },
  {
    id: "civil-4prohibitions",
    category: "4대 금지",
    group: "civil",
    items: [
      { num: "01", name: "직장이탈 금지", aliases: ["직장이탈금지", "직장이탈", "직장 이탈 금지", "직장 이탈", "무단이탈", "무단이탈금지", "직무유기"] },
      { num: "02", name: "정치운동 금지", aliases: ["정치운동금지", "정치운동", "정치 운동 금지", "정치 운동", "정치운동의 금지", "정치활동", "정치활동금지"] },
      { num: "03", name: "영리업무·겸직 금지", aliases: ["영리업무겸직금지", "영리업무·겸직 금지", "영리업무 겸직 금지", "영리업무및겸직금지", "영리업무 및 겸직 금지", "영리업무", "겸직금지", "겸직", "영리업무금지"] },
      { num: "04", name: "집단행위 금지", aliases: ["집단행위금지", "집단행위", "집단 행위 금지", "집단 행위", "집단행위의 금지", "집단행동", "집단행동금지"] }
    ]
  }
];

// 2. 숫자(00~99) 낱말 암기 데이터
export const ALL_NUMBER_ITEMS: CategoryItem[] = [
  // 00 ~ 09
  { num: "00", name: "제로콜라", aliases: ["콜라", "제로", "코카콜라제로", "제로 펩시"] },
  { num: "01", name: "올마이트", aliases: ["올마", "allmight"] },
  { num: "02", name: "영희", aliases: ["영히"] },
  { num: "03", name: "나", aliases: ["나", "저", "me", "나자신"] },
  { num: "04", name: "공사중 🚧", aliases: ["공사중", "공사", "공사 중"] },
  { num: "05", name: "떡잎마을방범대", aliases: ["떡잎방범대", "떡잎마을 방범대", "떡잎마을"] },
  { num: "06", name: "공유", aliases: ["공유", "배우공유", "배우 공유", "도깨비"] },
  { num: "07", name: "럭키 🍀", aliases: ["럭키", "lucky", "행운"] },
  { num: "08", name: "공파리파", aliases: ["공파리파", "공파", "0828"] },
  { num: "09", name: "영구(공구 상자) 🧰", aliases: ["영구", "공구상자", "공구 상자", "공구", "영구(공구 상자)", "영구(공구상자)", "영구공구상자", "영구없다"] },

  // 10 ~ 19
  { num: "10", name: "십자가 ✝️", aliases: ["십자가", "크로스"] },
  { num: "11", name: "젓가락 🥢", aliases: ["젓가락", "젓갈"] },
  { num: "12", name: "시비(깡패) 😎", aliases: ["시비", "깡패", "시비깡패", "시비 (깡패)"] },
  { num: "13", name: "씹상남자", aliases: ["씹상남자", "상남자"] },
  { num: "14", name: "식사(음식) 🍽️", aliases: ["식사", "음식", "식사음식", "밥"] },
  { num: "15", name: "보름달 🌕", aliases: ["보름달", "만월", "달"] },
  { num: "16", name: "16강 축구 🔴", aliases: ["16강 축구", "16강축구", "16강", "축구"] },
  { num: "17", name: "고딩", aliases: ["고딩", "고등학생", "고교생"] },
  { num: "18", name: "ㅆㅂ", aliases: ["ㅆㅂ", "ㅅㅂ", "씨발", "시발", "씨바", "시바"] },
  { num: "19", name: "19금", aliases: ["19금", "십구금", "성인", "청불"] },

  // 20 ~ 29
  { num: "20", name: "새내기 (과잠)", aliases: ["새내기", "과잠", "새내기과잠", "신입생"] },
  { num: "21", name: "선배", aliases: ["선배", "선배님"] },
  { num: "22", name: "백조 🦢🦢(동기)", aliases: ["백조", "동기", "백조(동기)", "백조 (동기)", "백조동기", "swan", "스완"] },
  { num: "23", name: "후배", aliases: ["후배", "후배님"] },
  { num: "24", name: "이사", aliases: ["이사", "이삿짐"] },
  { num: "25", name: "이오몽", aliases: ["이오몽"] },
  { num: "26", name: "비행기 이륙 ✈️", aliases: ["비행기 이륙", "비행기이륙", "이륙", "비행기", "항공기"] },
  { num: "27", name: "큐브", aliases: ["큐브", "루빅스큐브", "루빅큐브"] },
  { num: "28", name: "이빨", aliases: ["이빨", "치아", "이"] },
  { num: "29", name: "이구아나 🦎", aliases: ["이구아나", "파충류"] },

  // 30 ~ 39
  { num: "30", name: "계란 한 판 🥚", aliases: ["계란 한 판", "계란한판", "계란", "달걀한판", "달걀", "계란 한판"] },
  { num: "31", name: "베라 🍦", aliases: ["베라", "배라", "배스킨라빈스", "베스킨라빈스", "배스킨", "베스킨", "아이스크림"] },
  { num: "32", name: "사미인곡 📜", aliases: ["사미인곡", "사미인", "정철"] },
  { num: "33", name: "삼삼드래", aliases: ["삼삼드래", "포켓몬"] },
  { num: "34", name: "심사 (흑백)", aliases: ["심사", "흑백", "심사흑백", "흑백요리사", "심사 (흑백)"] },
  { num: "35", name: "사모님", aliases: ["사모님", "사모"] },
  { num: "36", name: "줄행랑", aliases: ["줄행랑", "도망", "도주"] },
  { num: "37", name: "삼치 물고기 🐟", aliases: ["삼치", "삼치 물고기", "삼치물고기", "물고기", "생선"] },
  { num: "38", name: "38선", aliases: ["38선", "삼팔선", "휴전선"] },
  { num: "39", name: "삶은달걀", aliases: ["삶은달걀", "삶은계란", "삶은 달걀", "삶은 계란"] },

  // 40 ~ 49
  { num: "40", name: "사공 🚣", aliases: ["사공", "뱃사공", "뱃노래"] },
  { num: "41", name: "미사일 🚀 (사일러스)", aliases: ["미사일", "사일러스", "미사일(사일러스)", "미사일 (사일러스)", "미사일사일러스", "사일", "로켓"] },
  { num: "42", name: "연인 ❤️", aliases: ["연인", "연인관계", "연인 관계", "애인", "커플", "사랑"] },
  { num: "43", name: "제주 🍊", aliases: ["제주", "제주도", "감귤", "귤"] },
  { num: "44", name: "뽀뽀 💋", aliases: ["뽀뽀", "키스", "입맞춤"] },
  { num: "45", name: "사오정", aliases: ["사오정"] },
  { num: "46", name: "사육장", aliases: ["사육장", "우리"] },
  { num: "47", name: "AK47 (사치) 🔫", aliases: ["AK47", "ak47", "ak-47", "AK-47", "에이케이47", "에이케이", "사치", "AK47(사치)", "AK47 (사치)", "총"] },
  { num: "48", name: "사팔뜨기 (사시)", aliases: ["사팔뜨기", "사시", "사팔뜨기사시", "사팔이", "사팔"] },
  { num: "49", name: "모래언덕 (사구) 🏖️", aliases: ["모래언덕", "사구", "모래언덕사구", "모래 언덕", "사구(모래언덕)"] },

  // 50 ~ 59
  { num: "50", name: "손오공", aliases: ["손오공", "오공", "goku"] },
  { num: "51", name: "오일 ⛽️", aliases: ["오일", "기름", "석유", "주유", "oil"] },
  { num: "52", name: "오이 🥒", aliases: ["오이"] },
  { num: "53", name: "오삼불고기", aliases: ["오삼불고기", "오삼", "오삼 불고기"] },
  { num: "54", name: "오사쯔", aliases: ["오사쯔", "과자"] },
  { num: "55", name: "느낌표 (!)", aliases: ["느낌표", "!"] },
  { num: "56", name: "에러 (Error)", aliases: ["에러", "error", "Error", "오류"] },
  { num: "57", name: "옻칠", aliases: ["옻칠", "옻"] },
  { num: "58", name: "오빠", aliases: ["오빠"] },
  { num: "59", name: "애기 🍼", aliases: ["애기", "아기", "아가", "baby"] },

  // 60 ~ 69
  { num: "60", name: "환갑", aliases: ["환갑", "회갑", "육순"] },
  { num: "61", name: "욱일기", aliases: ["욱일기", "욱일승천기"] },
  { num: "62", name: "견(개) 🐶", aliases: ["견", "개", "견(개)", "강아지", "반려견", "견개"] },
  { num: "63", name: "빌딩 🏢", aliases: ["빌딩", "63빌딩", "63", "육삼빌딩", "건물"] },
  { num: "64", name: "육사 🪖", aliases: ["육사", "육군사관학교"] },
  { num: "65", name: "노인 👴🏻", aliases: ["노인", "어르신", "할아버지", "할머니"] },
  { num: "66", name: "안경 👓", aliases: ["안경", "육육"] },
  { num: "67", name: "육지 🏝️", aliases: ["육지", "땅", "대륙"] },
  { num: "68", name: "혁명", aliases: ["혁명", "68혁명"] },
  { num: "69", name: "69", aliases: ["69", "육구", "식스나인"] },

  // 70 ~ 79
  { num: "70", name: "칠공주", aliases: ["칠공주", "7공주"] },
  { num: "71", name: "친일 🇯🇵", aliases: ["친일", "친일파"] },
  { num: "72", name: "칠리 🌶️", aliases: ["칠리", "고추", "칠리소스"] },
  { num: "73", name: "잭팟 🎰", aliases: ["잭팟", "777", "jackpot"] },
  { num: "74", name: "질싸", aliases: ["질싸"] },
  { num: "75", name: "치료 🏥", aliases: ["치료", "병원", "진료"] },
  { num: "76", name: "체육 🏋️‍♀️", aliases: ["체육", "운동", "헬스"] },
  { num: "77", name: "칠석 (견우와 직녀)", aliases: ["칠석", "견우와 직녀", "견우와직녀", "견우직녀", "칠월칠석"] },
  { num: "78", name: "칠판", aliases: ["칠판", "흑판", "블랙보드"] },
  { num: "79", name: "친구", aliases: ["친구", "벗", "동무"] },

  // 80 ~ 89
  { num: "80", name: "산 ⛰️", aliases: ["산", "마운틴"] },
  { num: "81", name: "파일 📁", aliases: ["파일", "file", "서류"] },
  { num: "82", name: "파리 🪰", aliases: ["파리", "fly"] },
  { num: "83", name: "타워 🗼", aliases: ["타워", "탑", "83타워", "우방타워"] },
  { num: "84", name: "발사", aliases: ["발사", "슛", "발포"] },
  { num: "85", name: "파라오", aliases: ["파라오", "이집트왕"] },
  { num: "86", name: "발육", aliases: ["발육", "성장"] },
  { num: "87", name: "팔찌", aliases: ["팔찌", "뱅글"] },
  { num: "88", name: "올림픽", aliases: ["올림픽", "88올림픽", "서울올림픽"] },
  { num: "89", name: "팔굽혀펴기", aliases: ["팔굽혀펴기", "푸쉬업", "푸시업", "팔굽혀 펴기"] },

  // 90 ~ 99
  { num: "90", name: "막창", aliases: ["막창", "대창", "곱창"] },
  { num: "91", name: "생일 🥳", aliases: ["생일", "탄일", "생신", "귀빠진날"] },
  { num: "92", name: "구이 🐟", aliases: ["구이", "생선구이"] },
  { num: "93", name: "은하철도 🚈", aliases: ["은하철도", "은하철도999", "은하철도 999", "기차", "열차"] },
  { num: "94", name: "생존 🔥", aliases: ["생존", "서바이벌"] },
  { num: "95", name: "구호 ⚒️", aliases: ["구호", "구호활동"] },
  { num: "96", name: "굴욕 🙈", aliases: ["굴욕", "수치", "모욕"] },
  { num: "97", name: "구찌 (구출)", aliases: ["구찌", "구출", "구찌(구출)", "구찌 (구출)", "구찌구출", "gucci", "Gucci", "구조"] },
  { num: "98", name: "쿠파", aliases: ["쿠파", "bowser"] },
  { num: "99", name: "둘기 🕊️", aliases: ["둘기", "비둘기", "구구"] },
];

export const NUMBER_CATEGORIES: CategoryData[] = [
  {
    id: "num-00-99",
    category: "00 ~ 99",
    group: "number",
    items: ALL_NUMBER_ITEMS
  }
];

export const ALL_CATEGORIES: CategoryData[] = [
  ...CIVIL_CATEGORIES,
  ...NUMBER_CATEGORIES
];

/**
 * Remove all emojis from string
 */
export function stripEmojis(str: string): string {
  if (!str) return "";
  return str
    .replace(/[\u{1F300}-\u{1F9FF}\u{1FA00}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}\u{200D}\u{20E3}]/gu, '')
    .replace(/[🚧🍀💪🧰✝️🥢😎👻🍽️🌕🔴🃏🦢✈️🦎🥚🍦⚽️🐟❤️🍊💋🏖️]/gu, '');
}

/**
 * Normalizes text for lenient yet accurate matching:
 * - Removes all emojis
 * - Removes whitespace and all special symbols / brackets
 * - Lowercases English letters
 */
export function normalizeAnswer(text: string): string {
  if (!text) return "";
  const noEmoji = stripEmojis(text);
  return noEmoji
    .trim()
    .toLowerCase()
    .replace(/[\s·\.,\-_/~`!@#$%^&*()+=|\\\[\]{};:'"<>?（）]/g, "");
}

/**
 * Checks if user input matches target item (or its aliases/parenthesized sub-parts)
 * Fulfills: "채점 시 이모지 없어도 정답 인정"
 */
export function isMatch(input: string, targetName: string, aliases?: string[]): boolean {
  const normInput = normalizeAnswer(input);
  if (!normInput) return false;

  const normTarget = normalizeAnswer(targetName);
  if (normInput === normTarget) return true;

  // 1. Check against explicitly defined aliases
  if (aliases && aliases.length > 0) {
    for (const alias of aliases) {
      if (normInput === normalizeAnswer(alias)) {
        return true;
      }
    }
  }

  // 2. Extract parenthesized parts: e.g. "식사(음식)" -> "식사", "음식"
  const cleanTarget = stripEmojis(targetName).trim();
  const parenMatch = cleanTarget.match(/^([^(（]+)[(（]([^)）]+)[)）]/);
  if (parenMatch) {
    const mainPart = normalizeAnswer(parenMatch[1]);
    const subPart = normalizeAnswer(parenMatch[2]);
    if (normInput === mainPart || normInput === subPart) {
      return true;
    }
  }

  // 3. Korean particle flexibility (의, 및)
  const strippedInput = normInput.replace(/의/g, "").replace(/및/g, "");
  const strippedTarget = normTarget.replace(/의/g, "").replace(/및/g, "");
  if (strippedInput.length >= 2 && strippedInput === strippedTarget) {
    return true;
  }

  return false;
}
