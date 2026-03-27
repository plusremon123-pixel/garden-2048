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

export type CardId = "cactus" | "sunflower" | "clover";
export type LoadoutItemId = "undo" | "clean" | "remove";

/** 카드 타겟 방식 */
export type CardTargetMode =
  | "tile"    // 보드에서 타일 1개 선택
  | "empty"   // 보드에서 빈 칸 1개 선택
  | "instant"; // 즉시 발동 (타겟 없음)

export interface CardDef {
  id:         CardId;
  name:       string;
  emoji:      string;
  description: string;
  detail:     string;
  targetMode: CardTargetMode;
  maxUses:    number;
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
