/* ============================================================
 * stageData.ts
 * 스테이지 절차적 생성 시스템 (1 ~ 1000스테이지)
 *
 * 설계 원칙:
 *   - 난이도는 장애물보다 목표값·턴 제한으로 먼저 조정
 *   - 장애물은 전략 요소, 이동을 막는 장치가 아님
 *   - 10판 단위 완급 조절 (쉬움·보통·보통·어려움·보통·보통·쉬움·어려움·보통·숨고르기)
 *   - 1~30: 장애물 없음
 *   - 31+: 가장자리/모서리 배치, 중앙 4칸 금지, 2×2 블로킹 금지
 * ============================================================ */

import {
  GameState,
  TileData,
  generateId,
  createEmptyBoard,
  getEmptyCells,
} from "./gameUtils";

/* ── 타입 ─────────────────────────────────────────────────── */

export interface StageGoal {
  type: "reachTile";
  targetValue: number;
}

export interface InitialTile {
  x: number;
  y: number;
  tileType: "soil" | "thorn";
}

export interface StageConfig {
  id:           number;
  name:         string;
  maxTurns:     number;
  goal:         StageGoal;
  initialTiles: InitialTile[];
  spawnRate?:   number;
}

/* ============================================================
 * 장애물 위치 풀
 *
 * 4×4 보드 좌표 (x: 열, y: 행, 0 기준):
 *   (0,0)(1,0)(2,0)(3,0)
 *   (0,1)(1,1)(2,1)(3,1)
 *   (0,2)(1,2)(2,2)(3,2)
 *   (0,3)(1,3)(2,3)(3,3)
 *
 * 중앙 4칸 (배치 금지): (1,1)(2,1)(1,2)(2,2)
 * 우선 배치: 모서리·하단·가장자리
 * ============================================================ */

type Pos = { x: number; y: number };

/** 단일 장애물용 위치 풀 — 모서리·하단·가장자리 10곳 */
const SINGLE_POOL: Pos[] = [
  { x: 0, y: 3 }, // 하단 좌
  { x: 3, y: 3 }, // 하단 우
  { x: 1, y: 3 }, // 하단 중좌
  { x: 2, y: 3 }, // 하단 중우
  { x: 0, y: 0 }, // 상단 좌
  { x: 3, y: 0 }, // 상단 우
  { x: 0, y: 2 }, // 좌 가장자리 하
  { x: 3, y: 2 }, // 우 가장자리 하
  { x: 0, y: 1 }, // 좌 가장자리 상
  { x: 3, y: 1 }, // 우 가장자리 상
];

/**
 * 이중 장애물용 위치 쌍 풀
 * 규칙: 중앙 4칸 제외, 2×2 블로킹 없음, 서로 대각 또는 충분히 이격
 */
const DOUBLE_POOL: [Pos, Pos][] = [
  [{ x: 0, y: 3 }, { x: 3, y: 3 }], // 하단 양끝
  [{ x: 0, y: 0 }, { x: 3, y: 3 }], // 대각 (↖↘)
  [{ x: 3, y: 0 }, { x: 0, y: 3 }], // 대각 (↗↙)
  [{ x: 0, y: 3 }, { x: 3, y: 1 }], // 하단좌 + 우가장자리상
  [{ x: 3, y: 3 }, { x: 0, y: 1 }], // 하단우 + 좌가장자리상
  [{ x: 1, y: 3 }, { x: 3, y: 0 }], // 하단중 + 상단우
  [{ x: 2, y: 3 }, { x: 0, y: 0 }], // 하단중 + 상단좌
  [{ x: 0, y: 2 }, { x: 3, y: 3 }], // 좌가장자리하 + 하단우
  [{ x: 3, y: 2 }, { x: 0, y: 3 }], // 우가장자리하 + 하단좌
  [{ x: 0, y: 0 }, { x: 2, y: 3 }], // 상단좌 + 하단중
  [{ x: 3, y: 0 }, { x: 1, y: 3 }], // 상단우 + 하단중
  [{ x: 0, y: 1 }, { x: 3, y: 3 }], // 좌가장자리상 + 하단우
];

/**
 * 삼중 장애물용 위치 세트 풀
 * 규칙: 2×2 블로킹 없음, 넓게 분산
 */
const TRIPLE_POOL: [Pos, Pos, Pos][] = [
  [{ x: 0, y: 3 }, { x: 3, y: 3 }, { x: 0, y: 0 }],
  [{ x: 0, y: 3 }, { x: 3, y: 3 }, { x: 3, y: 0 }],
  [{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 1, y: 3 }],
  [{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 2, y: 3 }],
  [{ x: 0, y: 3 }, { x: 3, y: 0 }, { x: 3, y: 2 }],
  [{ x: 3, y: 3 }, { x: 0, y: 0 }, { x: 0, y: 2 }],
  [{ x: 1, y: 3 }, { x: 0, y: 0 }, { x: 3, y: 1 }],
  [{ x: 2, y: 3 }, { x: 3, y: 0 }, { x: 0, y: 1 }],
  [{ x: 0, y: 3 }, { x: 3, y: 1 }, { x: 1, y: 0 }],
  [{ x: 3, y: 3 }, { x: 0, y: 2 }, { x: 2, y: 0 }],
];

/* ============================================================
 * 스테이지 이름 풀 (식물/자연 테마, 60개 → 모듈러 순환)
 * ============================================================ */
const STAGE_NAMES: string[] = [
  "씨앗의 시작",   "새싹 한 줄기",  "흙 속에서",    "첫 뿌리",      "햇살 속으로",
  "물주기",        "꽃봉오리",      "이슬 맺힌 잎",  "바람과 씨앗",  "첫 개화",
  "뿌리를 내리며", "흙과 햇살",     "새벽 안개",     "초록 물결",    "작은 정원",
  "봄비",          "나뭇잎 사이",   "꽃길",          "씨앗 여행",    "싹이 트는 날",
  "거친 흙밭",     "돌 사이 틈새",  "가시덤불",      "바위 정원",    "험한 비탈",
  "구불진 길",     "모래바람",      "건조한 대지",   "벼랑 끝 꽃",  "사막 선인장",
  "깊은 숲",       "덩굴 미로",     "이끼 낀 바위",  "뒤엉킨 뿌리", "그늘진 골짜기",
  "어두운 토양",   "두꺼운 나무껍", "안개 숲",       "산 중턱",      "나무의 기억",
  "철 지난 꽃",    "낙엽 길",       "찬 바람",       "서리 위 새싹", "겨울 정원",
  "얼어붙은 씨앗", "눈 속의 꽃",   "서리꽃",        "빙판 위 뿌리", "눈보라",
  "봄의 귀환",     "해동",          "첫 빗방울",     "젖은 흙냄새", "다시 피는 꽃",
  "절벽의 꽃",     "폭풍 속 새싹",  "천 개의 씨앗",  "전설의 정원",  "꽃의 끝에서",
];

/* ============================================================
 * 목표값 티어 (2의 거듭제곱)
 * ============================================================ */
function getGoalTier(id: number): number {
  if (id <=  5) return 6;   // 64
  if (id <= 15) return 7;   // 128
  if (id <= 30) return 8;   // 256
  if (id <= 55) return 9;   // 512
  if (id <= 90) return 10;  // 1024
  if (id <= 150) return 11; // 2048
  if (id <= 250) return 12; // 4096
  if (id <= 400) return 13; // 8192
  if (id <= 600) return 14; // 16384
  if (id <= 850) return 15; // 32768
  return 16;                // 65536
}

/** 티어별 기본 턴 수 */
const BASE_TURNS: Record<number, number> = {
  6:  85,   // 목표 64  — 스테이지 1~5
  7:  140,  // 목표 128 — 스테이지 6~15
  8:  200,  // 목표 256 — 스테이지 16~30
  9:  270,  // 목표 512 — 스테이지 31~55
  10: 360,  // 목표 1024— 스테이지 56~90
  11: 470,  // 목표 2048— 스테이지 91~150
  12: 610,  // 목표 4096
  13: 780,  // 목표 8192
  14: 980,  // 목표 16384
  15: 1200, // 목표 32768
  16: 1480, // 목표 65536
};

/**
 * 10판 주기 완급 조절 계수
 * 인덱스: (id-1) % 10
 * 0=쉬움, 1=보통, 2=보통, 3=어려움, 4=보통,
 * 5=보통, 6=쉬움,  7=어려움, 8=보통, 9=숨고르기
 */
const RHYTHM: number[] = [1.10, 1.00, 0.95, 0.85, 1.00, 0.90, 1.05, 0.80, 0.95, 1.15];

/** 10판 주기에서 이 판이 "어려운 판"인지 (장애물 수 +1 허용 구간) */
function isHardSlot(id: number): boolean {
  const pos = (id - 1) % 10;
  return pos === 3 || pos === 7; // 4번·8번째 판
}

/** 10판 주기에서 이 판이 보스급인지 (501+ 에서만 의미) */
function isBossSlot(id: number): boolean {
  const pos = (id - 1) % 10;
  return pos === 9; // 10번째 판 (숨고르기이지만 501+에서는 챌린지)
}

/* ============================================================
 * 구간별 장애물 수
 * ============================================================ */
function getObstacleCount(id: number): number {
  if (id <= 30)  return 0;

  if (id <= 80)  return 1;

  if (id <= 150) {
    // 1개 중심, 어려운 슬롯만 2개
    return isHardSlot(id) ? 2 : 1;
  }

  if (id <= 300) {
    // 1~2개: 어려운 슬롯 2개, 나머지 1개
    return isHardSlot(id) ? 2 : 1;
  }

  if (id <= 500) {
    // 2개 중심, 어려운 슬롯만 3개
    return isHardSlot(id) ? 3 : 2;
  }

  if (id <= 700) {
    // 2개 중심, 3개는 제한적 (어려운 슬롯만)
    return isHardSlot(id) ? 3 : 2;
  }

  if (id <= 850) {
    // 2~3개: 기본 2개, 어려운·보스 슬롯 3개
    return (isHardSlot(id) || isBossSlot(id)) ? 3 : 2;
  }

  // 851~1000: 2개 중심, 3개는 챌린지/보스급만
  return isBossSlot(id) ? 3 : 2;
}

/* ============================================================
 * 장애물 타입 결정
 * thorn(가시)은 고난이도 구간에서만 등장
 * ============================================================ */
function getObstacleType(id: number, posInSet: number): "soil" | "thorn" {
  if (id <= 100)  return "soil";
  if (id <= 250)  return posInSet === 0 ? "soil" : "soil"; // 모두 soil
  // 251+: 첫 번째는 soil, 추가 장애물은 thorn 가능
  if (id <= 500)  return posInSet === 0 ? "soil" : (isHardSlot(id) ? "thorn" : "soil");
  return posInSet === 0 ? "soil" : "thorn";
}

/* ============================================================
 * 결정적(deterministic) 인덱스 선택
 * 스테이지 ID로부터 풀 인덱스를 균일하게 분산
 * ============================================================ */
function pickIdx(id: number, poolLen: number, salt: number = 0): number {
  // 간단한 선형 혼합
  return ((id * 31 + salt * 17) >>> 0) % poolLen;
}

/* ============================================================
 * 스테이지 생성
 * ============================================================ */
function generateStage(id: number): StageConfig {
  const tier       = getGoalTier(id);
  const baseTurns  = BASE_TURNS[tier] ?? 600;
  const rhythm     = RHYTHM[(id - 1) % 10];
  const maxTurns   = Math.round(baseTurns * rhythm);
  const targetValue = Math.pow(2, tier);
  const name       = STAGE_NAMES[(id - 1) % STAGE_NAMES.length];
  const count      = getObstacleCount(id);

  const initialTiles: InitialTile[] = [];

  if (count === 1) {
    const pos = SINGLE_POOL[pickIdx(id, SINGLE_POOL.length)];
    initialTiles.push({ x: pos.x, y: pos.y, tileType: getObstacleType(id, 0) });
  } else if (count === 2) {
    const pair = DOUBLE_POOL[pickIdx(id, DOUBLE_POOL.length, 1)];
    pair.forEach((pos, i) =>
      initialTiles.push({ x: pos.x, y: pos.y, tileType: getObstacleType(id, i) }),
    );
  } else if (count === 3) {
    const set = TRIPLE_POOL[pickIdx(id, TRIPLE_POOL.length, 2)];
    set.forEach((pos, i) =>
      initialTiles.push({ x: pos.x, y: pos.y, tileType: getObstacleType(id, i) }),
    );
  }

  return { id, name, maxTurns, goal: { type: "reachTile", targetValue }, initialTiles };
}

/* ============================================================
 * 공개 API
 * ============================================================ */

/** id 범위: 1 ~ 1000 */
export const getStageConfig = (stageId: number): StageConfig | null => {
  if (stageId < 1 || stageId > 1000) return null;
  return generateStage(stageId);
};

/**
 * 스테이지 초기 GameState 생성.
 * 장애물을 먼저 배치한 뒤 랜덤 숫자 타일 2개 추가.
 */
export const initializeStage = (config: StageConfig): GameState => {
  const board = createEmptyBoard();
  const activeTiles: Record<string, TileData> = {};

  /* 장애물 배치 */
  for (const it of config.initialTiles) {
    const tile: TileData = {
      id:       generateId(),
      value:    0,
      x:        it.x,
      y:        it.y,
      tileType: it.tileType,
    };
    board[it.y][it.x] = tile;
    activeTiles[tile.id] = tile;
  }

  /* 랜덤 숫자 타일 2개 */
  for (let i = 0; i < 2; i++) {
    const empty = getEmptyCells(board);
    if (empty.length === 0) break;
    const pos  = empty[Math.floor(Math.random() * empty.length)];
    const tile: TileData = {
      id:       generateId(),
      value:    2,
      x:        pos.x,
      y:        pos.y,
      isNew:    true,
      tileType: "number",
    };
    board[pos.y][pos.x] = tile;
    activeTiles[tile.id] = tile;
  }

  return {
    board,
    activeTiles,
    graveyard:  [],
    score:      0,
    hasWon:     false,
    hasLost:    false,
    turnsLeft:  config.maxTurns,
    maxTurns:   config.maxTurns,
    goalValue:  config.goal.targetValue,
  };
};
