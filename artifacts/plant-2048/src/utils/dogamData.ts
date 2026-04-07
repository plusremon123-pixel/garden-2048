/* ============================================================
 * dogamData.ts
 * 도감 이벤트 — 주차별 순환 컬렉션 데이터
 *
 * 카테고리 순서: 도시락 → 과일 → 음료 → 바다생물 (ISO 주차 % 4)
 * 누적 최대 200개 / 아이템
 * localStorage key: plant2048_dogam
 * ============================================================ */

export const MAX_ITEM_COUNT = 200;

export interface DogamItem {
  id:    string;
  name:  string;
  emoji: string;
}

export interface DogamCategory {
  id:    string;
  name:  string;
  emoji: string;
  items: DogamItem[];
}

export const DOGAM_CATEGORIES: DogamCategory[] = [
  {
    id: "dosirak", name: "도시락", emoji: "🍱",
    items: [
      { id: "dosi_sandwich",  name: "샌드위치",   emoji: "🥪" },
      { id: "dosi_bread",     name: "빵",         emoji: "🍞" },
      { id: "dosi_ham",       name: "햄",         emoji: "🥩" },
      { id: "dosi_fried_egg", name: "계란후라이", emoji: "🍳" },
      { id: "dosi_fork",      name: "포크",       emoji: "🍴" },
    ],
  },
  {
    id: "fruit", name: "과일", emoji: "🍎",
    items: [
      { id: "fruit_apple",       name: "사과",   emoji: "🍎" },
      { id: "fruit_banana",      name: "바나나", emoji: "🍌" },
      { id: "fruit_grape",       name: "포도",   emoji: "🍇" },
      { id: "fruit_strawberry",  name: "딸기",   emoji: "🍓" },
      { id: "fruit_watermelon",  name: "수박",   emoji: "🍉" },
    ],
  },
  {
    id: "drink", name: "음료", emoji: "🥤",
    items: [
      { id: "drink_juice",  name: "주스",     emoji: "🧃" },
      { id: "drink_coffee", name: "커피",     emoji: "☕" },
      { id: "drink_tea",    name: "차",       emoji: "🍵" },
      { id: "drink_soda",   name: "탄산음료", emoji: "🥤" },
      { id: "drink_water",  name: "물",       emoji: "💧" },
    ],
  },
  {
    id: "sea", name: "바다생물", emoji: "🌊",
    items: [
      { id: "sea_clam",    name: "조개",   emoji: "🐚" },
      { id: "sea_crab",    name: "게",     emoji: "🦀" },
      { id: "sea_shrimp",  name: "새우",   emoji: "🦐" },
      { id: "sea_octopus", name: "문어",   emoji: "🐙" },
      { id: "sea_fish",    name: "물고기", emoji: "🐟" },
    ],
  },
];

/* ── ISO 주차 기반 카테고리 인덱스 (0~3) ──────────────────── */
export function getCurrentWeekCategoryIndex(): number {
  const now = new Date();
  const d   = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo    = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo % 4;
}

export function getCurrentWeekCategory(): DogamCategory {
  return DOGAM_CATEGORIES[getCurrentWeekCategoryIndex()];
}

/* ── localStorage ──────────────────────────────────────────── */
export type DogamCollection = Record<string, number>; // itemId → count
const STORAGE_KEY = "plant2048_dogam";

export function loadDogamCollection(): DogamCollection {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function saveDogamCollection(col: DogamCollection): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(col));
}

/* 아이템 1개 추가 (200 상한 적용), 갱신된 collection 반환 */
export function addDogamItem(itemId: string): DogamCollection {
  const col = loadDogamCollection();
  const cur = col[itemId] ?? 0;
  if (cur >= MAX_ITEM_COUNT) return col;
  const next = { ...col, [itemId]: cur + 1 };
  saveDogamCollection(next);
  return next;
}
