/* ============================================================
 * playerData.ts
 * 플레이어 데이터 타입, XP/레벨 공식, 레벨 보상 테이블
 *
 * ✏️ 수정 포인트:
 *   - xpForNextLevel(): 레벨업 필요 XP 조정
 *   - calculateGameXp(): XP 획득 공식 조정
 *   - LEVEL_REWARDS: 레벨별 보상 추가/수정
 * ============================================================ */

/* ── 플레이어 데이터 구조 ───────────────────────────────── */
export interface PlayerData {
  level:        number;
  xp:           number;        /* 현재 레벨 내 누적 XP */
  totalXp:      number;        /* 전체 누적 XP */
  coins:        number;
  clearedLevel: number;        /* 클리어한 맵 스테이지 번호 (0 = 아직 없음) */
}

/* ── 레벨별 목표 점수 테이블 ─────────────────────────────
 * ✏️ 수정 포인트: 스테이지별 목표 점수를 여기서 변경하세요
 * ──────────────────────────────────────────────────────── */
export const LEVEL_GOALS: Record<number, number> = {
  1:  300,
  2:  600,
  3:  1000,
  4:  1500,
  5:  2200,
  6:  3000,
  7:  4200,
  8:  5600,
  9:  7500,
  10: 10000,
};

/** 테이블에 없는 레벨은 공식으로 계산 (11 이상) */
export const getLevelGoal = (level: number): number =>
  LEVEL_GOALS[level] ?? Math.round(300 * Math.pow(1.4, level - 1));

/* ── 레벨업 보상 ────────────────────────────────────────── */

/** 코인 보상 */
export interface CoinReward {
  type:        "coins";
  amount:      number;
  description: string;
}

/** 아이템 보상 (소모품 지급) */
export interface ItemReward {
  type:        "item";
  itemId:      string;   /* ShopItemId */
  qty:         number;
  description: string;
}

export type Reward = CoinReward | ItemReward;

/**
 * 레벨별 보상 테이블
 * 키: 도달하면 받는 레벨 번호
 * ✏️ 여기서 보상을 자유롭게 추가/수정하세요
 */
export const LEVEL_REWARDS: Record<number, Reward[]> = {
  2:  [
        { type: "coins", amount: 50,  description: "첫 레벨업 축하!" },
        { type: "item",  itemId: "undo",         qty: 1, description: "되돌리기 1개" },
      ],
  3:  [
        { type: "coins", amount: 50,  description: "꾸준히 성장 중!" },
        { type: "item",  itemId: "remove_tile",  qty: 1, description: "타일 제거 1개" },
      ],
  4:  [
        { type: "coins", amount: 70,  description: "레벨 4 도달!" },
        { type: "item",  itemId: "spawn_sprout", qty: 1, description: "씨앗 소환 1개" },
      ],
  5:  [
        { type: "coins", amount: 100, description: "레벨 5 달성!" },
        { type: "item",  itemId: "board_clean",  qty: 1, description: "보드 청소 1개" },
      ],
  7:  [{ type: "coins", amount: 80,  description: "어느새 7레벨" }],
  10: [{ type: "coins", amount: 200, description: "레벨 10 마일스톤!" }],
  15: [{ type: "coins", amount: 200, description: "15레벨 고수!" }],
  20: [{ type: "coins", amount: 500, description: "레벨 20 전설!" }],
};

/* ── XP 공식 ────────────────────────────────────────────── */

/**
 * 현재 레벨에서 다음 레벨로 가는 데 필요한 XP
 * 공식: 60 + (level - 1) × 25
 */
export const xpForNextLevel = (level: number): number =>
  60 + (level - 1) * 25;

/**
 * 게임 한 판 종료 시 지급할 XP 계산
 *
 * @param score       최종 점수
 * @param highestTile 이번 판 최고 타일 값 (예: 256)
 * @param won         2048 달성 여부
 */
export const calculateGameXp = (
  score: number,
  highestTile: number,
  won: boolean
): number => {
  const baseXp    = 10;                                              /* 참여 기본 XP */
  const scoreXp   = Math.floor(score / 40);                         /* 점수 XP */
  const tileBonus = highestTile >= 2
    ? Math.floor(Math.log2(highestTile) * 3) : 0;                  /* 최고 타일 보너스 */
  const winBonus  = won ? 50 : 0;                                   /* 2048 도달 보너스 */

  return baseXp + scoreXp + tileBonus + winBonus;
};

/* ── XP 적용 및 레벨업 처리 ─────────────────────────────── */

export interface ApplyXpResult {
  newPlayer: PlayerData;
  levelsGained: number;
  rewards: Reward[];
}

/**
 * 플레이어에게 XP를 추가하고 레벨업/보상을 처리한다.
 * 순수 함수 — 부작용 없음.
 */
export const applyXp = (player: PlayerData, xpToAdd: number): ApplyXpResult => {
  let { level, xp, totalXp, coins, clearedLevel } = { ...player };
  totalXp += xpToAdd;

  let remaining    = xpToAdd;
  let levelsGained = 0;
  const rewards: Reward[] = [];

  while (remaining > 0) {
    const needed = xpForNextLevel(level);
    if (xp + remaining >= needed) {
      remaining -= needed - xp;
      xp         = 0;
      level     += 1;
      levelsGained++;

      /* 레벨업 보상 지급 — 코인은 즉시 반영, 아이템은 rewards 배열로 반환 */
      const levelRewards = LEVEL_REWARDS[level] ?? [];
      for (const reward of levelRewards) {
        if (reward.type === "coins") coins += reward.amount;
        rewards.push(reward);
      }
      /* item 보상의 실제 인벤토리 추가는 호출자(Game.tsx)에서 처리 */
    } else {
      xp += remaining;
      remaining = 0;
    }
  }

  return {
    newPlayer: { level, xp, totalXp, coins, clearedLevel },
    levelsGained,
    rewards,
  };
};

/**
 * XP를 추가하되 한 판에서 최대 maxLevels(=1)레벨까지만 올라간다.
 * 남는 XP는 다음 레벨 필요치 - 1 로 캡핑해 이월된다.
 */
export const applyXpCapped = (
  player: PlayerData,
  xpToAdd: number,
  maxLevels = 1,
): ApplyXpResult => {
  let { level, xp, totalXp, coins, clearedLevel } = { ...player };
  totalXp += xpToAdd;

  let remaining    = xpToAdd;
  let levelsGained = 0;
  const rewards: Reward[] = [];

  while (remaining > 0) {
    const needed = xpForNextLevel(level);
    if (levelsGained >= maxLevels) {
      /* 레벨 캡 도달 — 남은 XP는 다음 레벨 직전까지만 저장 */
      xp = Math.min(xp + remaining, needed - 1);
      break;
    }
    if (xp + remaining >= needed) {
      remaining -= needed - xp;
      xp         = 0;
      level     += 1;
      levelsGained++;
      const levelRewards = LEVEL_REWARDS[level] ?? [];
      for (const reward of levelRewards) {
        if (reward.type === "coins") coins += reward.amount;
        rewards.push(reward);
      }
    } else {
      xp += remaining;
      remaining = 0;
    }
  }

  return {
    newPlayer: { level, xp, totalXp, coins, clearedLevel },
    levelsGained,
    rewards,
  };
};

/* ── XP 진행률 (0~1) ────────────────────────────────────── */
export const xpProgress = (player: PlayerData): number => {
  const needed = xpForNextLevel(player.level);
  return Math.min(player.xp / needed, 1);
};

/* ── localStorage 영속성 ────────────────────────────────── */
export const PLAYER_STORAGE_KEY = "plant2048_player";

const DEFAULT_PLAYER: PlayerData = { level: 1, xp: 0, totalXp: 0, coins: 0, clearedLevel: 0 };

export const loadPlayerData = (): PlayerData => {
  try {
    const raw = localStorage.getItem(PLAYER_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PLAYER };
    const parsed = JSON.parse(raw) as Partial<PlayerData>;
    return {
      level:        parsed.level        ?? 1,
      xp:           parsed.xp           ?? 0,
      totalXp:      parsed.totalXp      ?? 0,
      coins:        parsed.coins        ?? 0,
      clearedLevel: parsed.clearedLevel ?? 0,
    };
  } catch {
    return { ...DEFAULT_PLAYER };
  }
};

export const savePlayerData = (data: PlayerData): void => {
  try {
    localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* noop */
  }
};
