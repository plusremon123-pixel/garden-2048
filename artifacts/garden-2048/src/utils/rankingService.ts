/* ============================================================
 * rankingService.ts
 * 랭킹 핵심 로직
 *
 * 탭 구조: 누적점수 / 최고점  ×  일별 / 주별 / 월별
 *
 * NPC 점수: 기간키 + NPC ID 기반 결정론적 RNG
 *   → 모달을 닫았다 열어도 점수가 바뀌지 않음
 * ============================================================ */

/* ── 타입 ─────────────────────────────────────────────────── */

export type ScoreType  = "cumulative" | "best";
export type PeriodType = "daily" | "weekly" | "monthly";

export interface RankingEntry {
  rank:   number;
  name:   string;
  score:  number;
  isMe?:  boolean;
}

interface PeriodScore {
  score:     number;
  periodKey: string;
}

interface UserRankingData {
  cumulative: Record<PeriodType, PeriodScore>;
  best:       Record<PeriodType, PeriodScore>;
}

export interface PendingReward {
  type:      PeriodType;
  rank:      number;
  coins:     number;
  periodKey: string;
  claimed:   boolean;
}

export interface RankingBoardResult {
  entries:        RankingEntry[];
  myRank:         number | null;
  myScore:        number;
  scoreToThird:   number | null;
  remainingMs:    number;
  expectedReward: number;
}

/* ── 상수 ─────────────────────────────────────────────────── */

export const PERIOD_LABEL: Record<PeriodType, string> = {
  daily:   "일별",
  weekly:  "주별",
  monthly: "월별",
};

export const SCORE_TYPE_LABEL: Record<ScoreType, string> = {
  cumulative: "누적 점수",
  best:       "최고점",
};

const REWARD_TABLE: Record<PeriodType, Record<1 | 2 | 3, number>> = {
  daily:   { 1: 500,  2: 300,  3: 150  },
  weekly:  { 1: 1500, 2: 1000, 3: 500  },
  monthly: { 1: 5000, 2: 3000, 3: 1500 },
};

const NPC_PLAYERS = [
  { id: "n1",  name: "🌸 봄이",     skill: 1.40 },
  { id: "n2",  name: "🌿 나무꾼",   skill: 1.20 },
  { id: "n3",  name: "🌻 해바라기", skill: 1.10 },
  { id: "n4",  name: "🍀 클로버",   skill: 0.95 },
  { id: "n5",  name: "🌱 새싹이",   skill: 0.85 },
  { id: "n6",  name: "🌲 소나무",   skill: 0.80 },
  { id: "n7",  name: "🌺 장미",     skill: 0.75 },
  { id: "n8",  name: "🍁 단풍이",   skill: 0.70 },
  { id: "n9",  name: "🌵 선인장",   skill: 0.60 },
  { id: "n10", name: "🎋 대나무",   skill: 0.55 },
];

const STORAGE_USER    = "plant2048_ranking_user";
const STORAGE_REWARDS = "plant2048_ranking_rewards";

/* ── 결정론적 RNG (seed → 0~1) ───────────────────────────── */
function seedRng(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return (h >>> 0) / 4294967295;
}

/* ── 기간 키 함수 ─────────────────────────────────────────── */

function getDailyKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getWeeklyKey(d: Date): string {
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7,
  );
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function getMonthlyKey(d: Date): string {
  return d.toISOString().slice(0, 7);
}

export function getCurrentPeriodKey(period: PeriodType): string {
  const now = new Date();
  if (period === "daily")   return getDailyKey(now);
  if (period === "weekly")  return getWeeklyKey(now);
  return getMonthlyKey(now);
}

/* ── 남은 시간 (ms) ───────────────────────────────────────── */
function getRemainingMs(period: PeriodType): number {
  const now = new Date();
  let end: Date;

  if (period === "daily") {
    end = new Date(now);
    end.setHours(24, 0, 0, 0);
  } else if (period === "weekly") {
    const day         = now.getDay();
    const daysUntilSun = day === 0 ? 7 : 7 - day;
    end = new Date(now);
    end.setDate(now.getDate() + daysUntilSun);
    end.setHours(24, 0, 0, 0);
  } else {
    end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  }
  return Math.max(0, end.getTime() - now.getTime());
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) return "0m";
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

/* ── 기간 진행률 (0~1) ────────────────────────────────────── */
function periodProgress(period: PeriodType): number {
  const now    = new Date();
  const hrProg = (now.getHours() + now.getMinutes() / 60) / 24;

  if (period === "daily") {
    return hrProg;
  }
  if (period === "weekly") {
    return (now.getDay() + hrProg) / 7;
  }
  const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return (now.getDate() - 1 + hrProg) / dim;
}

/* ── 시간 가중치 (0.05~1.0) ───────────────────────────────── */
function timeMultiplier(period: PeriodType, progress: number): number {
  if (period === "daily") {
    if (progress < 0.25) return 0.15 + progress * 0.60;
    if (progress < 0.60) return 0.35 + (progress - 0.25) * 1.00;
    return 0.70 + (progress - 0.60) * 0.75;
  }
  if (period === "weekly") {
    return 0.15 + progress * 0.85;
  }
  return 0.12 + progress * 0.88;
}

/* ── NPC 점수 생성 ────────────────────────────────────────── */
function npcCumulativeScore(
  npc:    (typeof NPC_PLAYERS)[0],
  period: PeriodType,
  rng:    number,
  mult:   number,
): number {
  const gamesPerProgress: Record<PeriodType, number> = {
    daily:   14,
    weekly:  80,
    monthly: 300,
  };
  const base      = 5000 * gamesPerProgress[period] * npc.skill * mult;
  const variation = 1 + (rng - 0.5) * 0.30;
  return Math.max(0, Math.round(base * variation));
}

function npcBestScore(
  npc:    (typeof NPC_PLAYERS)[0],
  period: PeriodType,
  rng:    number,
): number {
  const base: Record<PeriodType, number> = {
    daily:   12000,
    weekly:  18000,
    monthly: 24000,
  };
  const variation = 1 + (rng - 0.5) * 0.20;
  return Math.max(0, Math.round(base[period] * npc.skill * variation));
}

/* ── localStorage 헬퍼 ────────────────────────────────────── */

function makeDefaultUserData(): UserRankingData {
  return {
    cumulative: {
      daily:   { score: 0, periodKey: "" },
      weekly:  { score: 0, periodKey: "" },
      monthly: { score: 0, periodKey: "" },
    },
    best: {
      daily:   { score: 0, periodKey: "" },
      weekly:  { score: 0, periodKey: "" },
      monthly: { score: 0, periodKey: "" },
    },
  };
}

function loadUserData(): UserRankingData {
  try {
    const raw = localStorage.getItem(STORAGE_USER);
    if (raw) return JSON.parse(raw) as UserRankingData;
  } catch { /* ignore */ }
  return makeDefaultUserData();
}

function saveUserData(data: UserRankingData): void {
  try { localStorage.setItem(STORAGE_USER, JSON.stringify(data)); } catch { /* ignore */ }
}

function loadRewards(): PendingReward[] {
  try {
    const raw = localStorage.getItem(STORAGE_REWARDS);
    if (raw) return JSON.parse(raw) as PendingReward[];
  } catch { /* ignore */ }
  return [];
}

function saveRewards(rewards: PendingReward[]): void {
  try { localStorage.setItem(STORAGE_REWARDS, JSON.stringify(rewards)); } catch { /* ignore */ }
}

/* ── 공개 API ─────────────────────────────────────────────── */

/**
 * 게임 종료 시 점수 기록
 * 누적 점수 += score, 최고점 = max(기존, score)
 */
export function recordGameScore(score: number): void {
  if (score <= 0) return;
  const data = loadUserData();
  const periods: PeriodType[] = ["daily", "weekly", "monthly"];

  for (const period of periods) {
    const key = getCurrentPeriodKey(period);

    /* 누적 */
    const cum = data.cumulative[period];
    if (cum.periodKey !== key) { cum.score = 0; cum.periodKey = key; }
    cum.score += score;

    /* 최고점 */
    const best = data.best[period];
    if (best.periodKey !== key) { best.score = 0; best.periodKey = key; }
    best.score = Math.max(best.score, score);
  }

  saveUserData(data);
}

/**
 * 랭킹 보드 데이터 조회
 */
export function fetchRankingBoard(
  scoreType:  ScoreType,
  periodType: PeriodType,
): RankingBoardResult {
  const data        = loadUserData();
  const periodKey   = getCurrentPeriodKey(periodType);
  const progress    = periodProgress(periodType);
  const mult        = timeMultiplier(periodType, progress);
  const remainingMs = getRemainingMs(periodType);

  /* 내 점수 */
  const myData  = data[scoreType][periodType];
  const myScore = myData.periodKey === periodKey ? myData.score : 0;

  /* NPC 점수 생성 (결정론적) */
  const allEntries: RankingEntry[] = NPC_PLAYERS.map((npc) => {
    const rng   = seedRng(`${periodKey}${npc.id}${scoreType}`);
    const score =
      scoreType === "cumulative"
        ? npcCumulativeScore(npc, periodType, rng, mult)
        : npcBestScore(npc, periodType, rng);
    return { rank: 0, name: npc.name, score };
  });

  /* 내 항목 삽입 */
  if (myScore > 0) {
    allEntries.push({ rank: 0, name: "나 🌱", score: myScore, isMe: true });
  }

  /* 내림차순 정렬 & 순위 부여 */
  allEntries.sort((a, b) => b.score - a.score);
  allEntries.forEach((e, i) => { e.rank = i + 1; });

  const top10   = allEntries.slice(0, 10);
  const myEntry = allEntries.find((e) => e.isMe);
  const myRank  = myEntry?.rank ?? null;

  /* 3위까지 필요 점수 */
  const third        = allEntries[2]?.score ?? null;
  const scoreToThird = third !== null ? third - myScore : null;

  /* 예상 보상 */
  const expectedReward =
    myRank && myRank <= 3
      ? REWARD_TABLE[periodType][myRank as 1 | 2 | 3]
      : 0;

  return { entries: top10, myRank, myScore, scoreToThird, remainingMs, expectedReward };
}

/**
 * 기간 전환 체크 (기간이 끝났으면 보상 생성 + 점수 초기화)
 */
export function checkPeriodTransitions(): void {
  const data    = loadUserData();
  const rewards = loadRewards();
  const periods: PeriodType[] = ["daily", "weekly", "monthly"];
  let changed = false;

  for (const period of periods) {
    const currentKey = getCurrentPeriodKey(period);
    const cum        = data.cumulative[period];

    if (cum.periodKey && cum.periodKey !== currentKey && cum.score > 0) {
      /* 누적 점수 순위 계산 → 보상 */
      const cumScores = NPC_PLAYERS.map((npc) => {
        const rng = seedRng(`${cum.periodKey}${npc.id}cumulative`);
        return npcCumulativeScore(npc, period, rng, 1.0);
      });
      cumScores.push(cum.score);
      cumScores.sort((a, b) => b - a);
      const cumRank = cumScores.indexOf(cum.score) + 1;

      if (cumRank >= 1 && cumRank <= 3) {
        const coins  = REWARD_TABLE[period][cumRank as 1 | 2 | 3];
        const pKey   = `cum_${cum.periodKey}`;
        if (!rewards.some((r) => r.periodKey === pKey)) {
          rewards.push({ type: period, rank: cumRank, coins, periodKey: pKey, claimed: false });
        }
      }

      /* 최고점 순위 계산 → 보상 */
      const best = data.best[period];
      if (best.periodKey === cum.periodKey && best.score > 0) {
        const bestScores = NPC_PLAYERS.map((npc) => {
          const rng = seedRng(`${best.periodKey}${npc.id}best`);
          return npcBestScore(npc, period, rng);
        });
        bestScores.push(best.score);
        bestScores.sort((a, b) => b - a);
        const bestRank = bestScores.indexOf(best.score) + 1;

        if (bestRank >= 1 && bestRank <= 3) {
          const coins  = REWARD_TABLE[period][bestRank as 1 | 2 | 3];
          const pKey   = `best_${best.periodKey}`;
          if (!rewards.some((r) => r.periodKey === pKey)) {
            rewards.push({ type: period, rank: bestRank, coins, periodKey: pKey, claimed: false });
          }
        }
      }

      /* 점수 초기화 */
      data.cumulative[period] = { score: 0, periodKey: currentKey };
      data.best[period]       = { score: 0, periodKey: currentKey };
      changed = true;
    }
  }

  if (changed) { saveUserData(data); saveRewards(rewards); }
}

/**
 * 미수령 보상 목록 반환
 */
export function getPendingRewards(): PendingReward[] {
  return loadRewards().filter((r) => !r.claimed);
}

/**
 * 보상 수령 → coins 반환 (0이면 이미 수령됨)
 */
export function claimReward(periodKey: string): number {
  const rewards = loadRewards();
  const target  = rewards.find((r) => r.periodKey === periodKey && !r.claimed);
  if (!target) return 0;
  target.claimed = true;
  saveRewards(rewards);
  return target.coins;
}
