/* ============================================================
 * loadoutData.ts
 * 게임 시작 전 로드아웃 선택 시스템 데이터
 *
 * 카드: 전략형 능력, 식물 고유 스킬 (1개 선택)
 * 아이템: 즉시 사용 소모형 기능 (2개 선택)
 *
 * ✏️ 확장 포인트:
 *   - CARDS 배열에 새 카드 추가
 *   - LOADOUT_ITEMS 배열에 새 아이템 추가
 *   - maxUses 조정으로 밸런스 변경
 * ============================================================ */

export type CardId =
  | "cactus" | "sunflower" | "clover"
  | "golden_sunflower" | "life_tree" | "premium_remove";
export type LoadoutItemId = "undo" | "clean" | "remove";

/** 카드 타겟 방식 */
export type CardTargetMode =
  | "tile"    // 보드에서 타일 1개 선택
  | "empty"   // 보드에서 빈 칸 1개 선택
  | "instant"; // 즉시 발동 (타겟 없음)

export interface CardDef {
  id:          CardId;
  name:        string;
  emoji:       string;
  description: string;
  detail:      string;
  targetMode:  CardTargetMode;
  maxUses:     number;
  isPremium?:  boolean;
}

export interface LoadoutItemDef {
  id:          LoadoutItemId;
  name:        string;
  emoji:       string;
  description: string;
  maxUses:     number;
}

/** 선택 가능한 카드 3종 */
export const CARDS: CardDef[] = [
  {
    id:          "cactus",
    name:        "선인장",
    emoji:       "🌵",
    description: "타일 1개 제거",
    detail:      "원하는 타일을 1개 골라 즉시 제거합니다",
    targetMode:  "tile",
    maxUses:     1,
  },
  {
    id:          "sunflower",
    name:        "해바라기",
    emoji:       "🌻",
    description: "빈 칸에 2 타일 생성",
    detail:      "빈 칸을 선택해 씨앗(2) 타일을 심습니다",
    targetMode:  "empty",
    maxUses:     2,
  },
  {
    id:          "clover",
    name:        "클로버",
    emoji:       "🍀",
    description: "3턴 점수 +20%",
    detail:      "즉시 발동 · 3턴 동안 획득 점수가 20% 증가합니다",
    targetMode:  "instant",
    maxUses:     2,
  },
  /* ── 프리미엄 카드 3종 (구독 전용) ──────────────────────── */
  {
    id:          "golden_sunflower",
    name:        "황금 해바라기",
    emoji:       "🌻✨",
    description: "원하는 위치에\n4 생성",
    detail:      "빈 칸을 선택해 4 타일을 심습니다",
    targetMode:  "empty",
    maxUses:     2,
    isPremium:   true,
  },
  {
    id:          "life_tree",
    name:        "생명의 나무",
    emoji:       "🌳",
    description: "낮은 타일 자동\n정리",
    detail:      "즉시 발동 · 보드에서 가장 낮은 타일 2개를 제거합니다",
    targetMode:  "instant",
    maxUses:     1,
    isPremium:   true,
  },
  {
    id:          "premium_remove",
    name:        "프리미엄 제거",
    emoji:       "💎",
    description: "장애물 포함\n원하는 타일 제거",
    detail:      "장애물(흙·가시) 포함 모든 타일을 제거할 수 있습니다",
    targetMode:  "tile",
    maxUses:     1,
    isPremium:   true,
  },
];

/* ============================================================
 * 카드 컬렉션 — 9장 전체 카드 도감
 *
 * status:
 *   "active"      → 레벨 조건을 충족하면 획득/활성화 가능
 *   "coming_soon" → 서비스 준비중 (비공개 콘텐츠)
 * ============================================================ */

export type CardCollectionStatus = "active" | "coming_soon" | "premium";

/** 카드 컬러 테마 (획득 시 카드 배경 색상) */
export type CardColor =
  | "emerald" | "amber"  | "green"
  | "yellow"  | "rose"   | "orange"
  | "pink"    | "purple" | "teal"
  | "gold";

export interface CardCollectionDef {
  collectionId:  string;
  /** 로드아웃 CARDS 배열의 id와 연결 (없으면 null) */
  loadoutId:     CardId | null;
  name:          string;
  emoji:         string;
  description:   string;
  detail:        string;
  /** 해금 레벨 (0 = 시작 카드, 항상 보유) */
  unlockLevel:   number;
  status:        CardCollectionStatus;
  color:         CardColor;
}

export const CARD_COLLECTION: CardCollectionDef[] = [
  /* ── 시작 카드 3종 (Lv.1, 항상 보유) ─────────────────── */
  {
    collectionId: "cactus",
    loadoutId:    "cactus",
    name:         "선인장",
    emoji:        "🌵",
    description:  "타일 1개 제거",
    detail:       "원하는 타일을 1개 골라 즉시 제거합니다",
    unlockLevel:  0,
    status:       "active",
    color:        "emerald",
  },
  {
    collectionId: "sunflower",
    loadoutId:    "sunflower",
    name:         "해바라기",
    emoji:        "🌻",
    description:  "빈 칸에\n씨앗 심기",
    detail:       "빈 칸을 선택해 씨앗(2) 타일을 심습니다",
    unlockLevel:  0,
    status:       "active",
    color:        "amber",
  },
  {
    collectionId: "sprout",
    loadoutId:    "clover",
    name:         "새싹",
    emoji:        "🌱",
    description:  "3턴 점수 +20%",
    detail:       "즉시 발동 · 3턴 동안 획득 점수가 20% 증가합니다",
    unlockLevel:  0,
    status:       "active",
    color:        "green",
  },

  /* ── Lv.100 해금 카드 3종 ─────────────────────────────── */
  {
    collectionId: "dandelion",
    loadoutId:    null,
    name:         "민들레",
    emoji:        "🌼",
    description:  "빈 칸 2곳에 씨앗 생성",
    detail:       "빈 칸 2개를 골라 씨앗 타일을 심습니다",
    unlockLevel:  100,
    status:       "active",
    color:        "yellow",
  },
  {
    collectionId: "rose",
    loadoutId:    null,
    name:         "장미",
    emoji:        "🌹",
    description:  "5번 이동 점수 +30%",
    detail:       "다음 5번의 이동 동안 획득 점수가 30% 증가합니다",
    unlockLevel:  100,
    status:       "active",
    color:        "rose",
  },
  {
    collectionId: "mushroom",
    loadoutId:    null,
    name:         "버섯",
    emoji:        "🍄",
    description:  "같은 타일 2개 합치기",
    detail:       "같은 숫자의 타일 2개를 선택해 즉시 합칩니다",
    unlockLevel:  100,
    status:       "active",
    color:        "orange",
  },

  /* ── 프리미엄 카드 3종 (구독 전용) ─────────────────────── */
  {
    collectionId: "golden_sunflower",
    loadoutId:    "golden_sunflower",
    name:         "황금 해바라기",
    emoji:        "🌻✨",
    description:  "원하는 위치에\n4 생성",
    detail:       "빈 칸을 선택해 4 타일을 심습니다",
    unlockLevel:  0,
    status:       "premium",
    color:        "gold",
  },
  {
    collectionId: "life_tree",
    loadoutId:    "life_tree",
    name:         "생명의 나무",
    emoji:        "🌳",
    description:  "낮은 타일 자동\n정리",
    detail:       "즉시 발동 · 보드에서 가장 낮은 타일 2개를 제거합니다",
    unlockLevel:  0,
    status:       "premium",
    color:        "gold",
  },
  {
    collectionId: "premium_remove",
    loadoutId:    "premium_remove",
    name:         "프리미엄 제거",
    emoji:        "💎",
    description:  "장애물 포함\n원하는 타일 제거",
    detail:       "장애물(흙·가시) 포함 모든 타일을 제거할 수 있습니다",
    unlockLevel:  0,
    status:       "premium",
    color:        "gold",
  },

  /* ── Lv.400 해금 카드 3종 (서비스 준비중) ───────────── */
  {
    collectionId: "cherry",
    loadoutId:    null,
    name:         "벚꽃",
    emoji:        "🌸",
    description:  "업데이트 예정",
    detail:       "서비스 준비중입니다",
    unlockLevel:  400,
    status:       "coming_soon",
    color:        "pink",
  },
  {
    collectionId: "lotus",
    loadoutId:    null,
    name:         "연꽃",
    emoji:        "🪷",
    description:  "업데이트 예정",
    detail:       "서비스 준비중입니다",
    unlockLevel:  400,
    status:       "coming_soon",
    color:        "purple",
  },
  {
    collectionId: "bamboo",
    loadoutId:    null,
    name:         "대나무",
    emoji:        "🎋",
    description:  "업데이트 예정",
    detail:       "서비스 준비중입니다",
    unlockLevel:  400,
    status:       "coming_soon",
    color:        "teal",
  },
];

/** 선택 가능한 아이템 3종 */
export const LOADOUT_ITEMS: LoadoutItemDef[] = [
  {
    id:          "undo",
    name:        "되돌리기",
    emoji:       "↩️",
    description: "이전 이동 취소",
    maxUses:     2,
  },
  {
    id:          "clean",
    name:        "보드 청소",
    emoji:       "🧹",
    description: "상위 4개 타일만 남김",
    maxUses:     1,
  },
  {
    id:          "remove",
    name:        "타일 제거",
    emoji:       "🗑️",
    description: "타일 1개 선택 제거",
    maxUses:     1,
  },
];
