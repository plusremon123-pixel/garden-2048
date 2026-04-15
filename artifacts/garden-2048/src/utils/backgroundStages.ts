/* ============================================================
 * backgroundStages.ts
 * highestTile 기준 배경 단계 데이터 + 진입점 함수
 *
 * 이미지 파일 위치: /public/backgrounds/<name>.png
 *   예) /public/backgrounds/seed.png
 *
 * ✏️ 수정 포인트:
 *   BACKGROUND_STAGES 배열에서 각 단계의
 *   width / maxHeight / fallbackGradient를 조정하세요.
 * ============================================================ */

export interface BackgroundStageConfig {
  /** highestTile 임계값 (이 값 이상이면 이 단계) */
  tile: number;
  /** /public/backgrounds/ 내 이미지 파일명 (확장자 제외) */
  name: string;
  /** 화면 너비 대비 이미지 너비 (낮을수록 작게 등장) */
  width: string;
  /** 이미지 최대 높이 — 초기엔 낮게, 고단계엔 높게 */
  maxHeight: string;
  /** 이미지 로드 실패 시 보여줄 CSS gradient */
  fallbackGradient: string;
  /** fallback용 이모지 */
  fallbackEmoji: string;
}

/**
 * highestTile → 배경 단계 매핑 테이블
 * 내림차순 정렬 필수 (getBackgroundStage가 순서에 의존)
 *
 * 이미지 배치 철학:
 *   - 낮은 단계: 하단 중앙에 작은 식물
 *   - 높은 단계: 화면 하단/양옆을 풍성하게 채움
 */
export const BACKGROUND_STAGES: BackgroundStageConfig[] = [
  {
    tile: 2048,
    name: "legendaryflower",
    width: "100%",
    maxHeight: "100%",
    fallbackGradient: "linear-gradient(to top, #ffb7c5 0%, #ffe4e1 60%, transparent 100%)",
    fallbackEmoji: "🌸",
  },
  {
    tile: 1024,
    name: "rareflower",
    width: "100%",
    maxHeight: "85%",
    fallbackGradient: "linear-gradient(to top, #ffd700 0%, #fff9c4 60%, transparent 100%)",
    fallbackEmoji: "🌟",
  },
  {
    tile: 512,
    name: "sparklingflower",
    width: "100%",
    maxHeight: "75%",
    fallbackGradient: "linear-gradient(to top, #c5cae9 0%, #e8eaf6 60%, transparent 100%)",
    fallbackEmoji: "✨",
  },
  {
    tile: 256,
    name: "bigflower",
    width: "95%",
    maxHeight: "65%",
    fallbackGradient: "linear-gradient(to top, #ce93d8 0%, #f3e5f5 60%, transparent 100%)",
    fallbackEmoji: "🌷",
  },
  {
    tile: 128,
    name: "flower",
    width: "88%",
    maxHeight: "58%",
    fallbackGradient: "linear-gradient(to top, #f48fb1 0%, #fce4ec 60%, transparent 100%)",
    fallbackEmoji: "🌺",
  },
  {
    tile: 64,
    name: "bud",
    width: "78%",
    maxHeight: "50%",
    fallbackGradient: "linear-gradient(to top, #f8bbd0 0%, #fce4ec 60%, transparent 100%)",
    fallbackEmoji: "🌸",
  },
  {
    tile: 32,
    name: "pot",
    width: "68%",
    maxHeight: "44%",
    fallbackGradient: "linear-gradient(to top, #80cbc4 0%, #e0f2f1 60%, transparent 100%)",
    fallbackEmoji: "🪴",
  },
  {
    tile: 16,
    name: "leaf",
    width: "58%",
    maxHeight: "38%",
    fallbackGradient: "linear-gradient(to top, #a5d6a7 0%, #e8f5e9 60%, transparent 100%)",
    fallbackEmoji: "🍃",
  },
  {
    tile: 8,
    name: "sprout2",
    width: "50%",
    maxHeight: "34%",
    fallbackGradient: "linear-gradient(to top, #b8dfa8 0%, #dff0d3 60%, transparent 100%)",
    fallbackEmoji: "🪴",
  },
  {
    tile: 4,
    name: "sprout",
    width: "40%",
    maxHeight: "28%",
    fallbackGradient: "linear-gradient(to top, #c8e6c9 0%, #dff0d3 60%, transparent 100%)",
    fallbackEmoji: "🌱",
  },
  {
    tile: 2,
    name: "seed",
    width: "32%",
    maxHeight: "22%",
    fallbackGradient: "linear-gradient(to top, #d9eebc 0%, #eef7e2 60%, transparent 100%)",
    fallbackEmoji: "🌰",
  },
];

/**
 * highestTile에 맞는 배경 단계를 반환한다.
 * 2048 이상이어도 legendaryflower 단계를 유지한다.
 *
 * @param highestTile - 현재 게임의 최고 타일 값
 */
export function updateBackgroundByHighestTile(
  highestTile: number
): BackgroundStageConfig {
  /* 내림차순 정렬이므로 첫 번째로 tile ≤ highestTile인 항목을 반환 */
  const match = BACKGROUND_STAGES.find((s) => highestTile >= s.tile);
  return match ?? BACKGROUND_STAGES[BACKGROUND_STAGES.length - 1];
}
