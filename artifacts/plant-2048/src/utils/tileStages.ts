/* ============================================================
 * tileStages.ts
 * 최고 타일 값에 따른 성장 단계 데이터
 *
 * ✏️ 수정 포인트:
 *   - 각 단계의 name, description, nextGoal, bg, textColor 자유롭게 수정
 *   - 새 단계 추가 시 tile 값에 맞게 배열에 추가
 * ============================================================ */

export interface TileStage {
  tile: number;
  emoji: string;
  name: string;
  description: string;  /* 위 박스: 짧은 설명 */
  nextGoal: string;     /* 아래 박스: 다음 목표 또는 현재 단계 문구 */
  bg: string;           /* CSS gradient (inline style용) */
  bgBottom: string;     /* 아래 박스용 약간 다른 gradient */
  textColor: string;    /* 주요 텍스트 색상 */
  subColor: string;     /* 보조 텍스트 색상 */
}

export const TILE_STAGES: TileStage[] = [
  {
    tile: 2,
    emoji: "🌰",
    name: "씨앗",
    description: "새로운 시작이에요",
    nextGoal: "다음 목표: 싹 틔우기 →",
    bg:       "linear-gradient(135deg, #f5ede0 0%, #e8d9c4 100%)",
    bgBottom: "linear-gradient(135deg, #ede3d5 0%, #ddd0b8 100%)",
    textColor: "#7d5c45",
    subColor:  "#a0826a",
  },
  {
    tile: 4,
    emoji: "🌱",
    name: "싹",
    description: "작은 생명이 움텄어요",
    nextGoal: "더 자라면 새싹이 돼요 →",
    bg:       "linear-gradient(135deg, #eef7e2 0%, #d9eebc 100%)",
    bgBottom: "linear-gradient(135deg, #e4f2d5 0%, #ccdfac 100%)",
    textColor: "#4a7c3f",
    subColor:  "#6b9a5e",
  },
  {
    tile: 8,
    emoji: "🪴",
    name: "새싹",
    description: "쑥쑥 자라고 있어요",
    nextGoal: "잎사귀가 나올 때까지 →",
    bg:       "linear-gradient(135deg, #d8f0d0 0%, #b8dfa8 100%)",
    bgBottom: "linear-gradient(135deg, #cce8c4 0%, #a8d498 100%)",
    textColor: "#2e7d32",
    subColor:  "#4caf50",
  },
  {
    tile: 16,
    emoji: "🍃",
    name: "잎",
    description: "싱그러운 잎이 돋았어요",
    nextGoal: "화분에 옮겨 볼까요? →",
    bg:       "linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%)",
    bgBottom: "linear-gradient(135deg, #bbdcbc 0%, #98c99a 100%)",
    textColor: "#1b5e20",
    subColor:  "#388e3c",
  },
  {
    tile: 32,
    emoji: "🪴",
    name: "작은 화분",
    description: "화분에 자리를 잡았어요",
    nextGoal: "꽃봉오리가 맺힐 거예요 →",
    bg:       "linear-gradient(135deg, #b2dfdb 0%, #80cbc4 100%)",
    bgBottom: "linear-gradient(135deg, #a5d7d3 0%, #70bdb6 100%)",
    textColor: "#004d40",
    subColor:  "#00796b",
  },
  {
    tile: 64,
    emoji: "🌸",
    name: "꽃봉오리",
    description: "곧 꽃이 필 것 같아요!",
    nextGoal: "드디어 꽃이 피어날 거예요 →",
    bg:       "linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)",
    bgBottom: "linear-gradient(135deg, #f8dae5 0%, #f4afc6 100%)",
    textColor: "#880e4f",
    subColor:  "#c2185b",
  },
  {
    tile: 128,
    emoji: "🌺",
    name: "꽃",
    description: "예쁜 꽃이 활짝 피었어요",
    nextGoal: "더 크고 화려한 꽃으로 →",
    bg:       "linear-gradient(135deg, #f48fb1 0%, #f06292 100%)",
    bgBottom: "linear-gradient(135deg, #f07ea4 0%, #e85080 100%)",
    textColor: "#fff",
    subColor:  "rgba(255,255,255,0.8)",
  },
  {
    tile: 256,
    emoji: "🌷",
    name: "큰 꽃",
    description: "크고 아름다운 꽃이에요!",
    nextGoal: "반짝이는 꽃이 기다려요 →",
    bg:       "linear-gradient(135deg, #e1bee7 0%, #ce93d8 100%)",
    bgBottom: "linear-gradient(135deg, #d8b0e2 0%, #c47fd4 100%)",
    textColor: "#4a148c",
    subColor:  "#7b1fa2",
  },
  {
    tile: 512,
    emoji: "✨",
    name: "반짝 꽃",
    description: "빛나는 꽃이에요, 대단해요!",
    nextGoal: "희귀한 꽃까지 도전해봐요 →",
    bg:       "linear-gradient(135deg, #c5cae9 0%, #9fa8da 100%)",
    bgBottom: "linear-gradient(135deg, #bac0e4 0%, #9099d0 100%)",
    textColor: "#1a237e",
    subColor:  "#303f9f",
  },
  {
    tile: 1024,
    emoji: "🌟",
    name: "희귀 꽃",
    description: "세상에 드문 꽃을 키웠어요!",
    nextGoal: "전설까지 단 한 단계 남았어요 →",
    bg:       "linear-gradient(135deg, #fff9c4 0%, #fff176 100%)",
    bgBottom: "linear-gradient(135deg, #f5eeaa 0%, #f0e34a 100%)",
    textColor: "#f57f17",
    subColor:  "#ff8f00",
  },
  {
    tile: 2048,
    emoji: "🌸",
    name: "전설의 꽃",
    description: "마침내 전설의 꽃이 피었어요!",
    nextGoal: "🏆 당신은 식물 2048 마스터!",
    bg:       "linear-gradient(135deg, #ffe082 0%, #ffab91 50%, #f48fb1 100%)",
    bgBottom: "linear-gradient(135deg, #ffcc80 0%, #ff8a65 50%, #f06292 100%)",
    textColor: "#fff",
    subColor:  "rgba(255,255,255,0.9)",
  },
];

/**
 * highestTile에 해당하는 단계를 반환한다.
 * 2048 이상이어도 마지막 단계(2048)를 반환한다.
 */
export const getStage = (highestTile: number): TileStage => {
  /* 내림차순으로 순회하다가 tile ≤ highestTile인 첫 항목 반환 */
  const sorted = [...TILE_STAGES].sort((a, b) => b.tile - a.tile);
  return sorted.find((s) => highestTile >= s.tile) ?? TILE_STAGES[0];
};
