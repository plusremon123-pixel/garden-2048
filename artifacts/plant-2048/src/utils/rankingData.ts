/* ============================================================
 * rankingData.ts
 * 랭킹 Mock 데이터 + Google Play Games Services 연결 포인트
 *
 * 📱 [GPGS 연결 포인트]
 *   실제 랭킹은 GPGS Leaderboard API에서 가져옵니다:
 *   - 일간: LEADERBOARD_ID_DAILY  (timeSpan: 0)
 *   - 주간: LEADERBOARD_ID_WEEKLY (timeSpan: 1)
 *   - 전체: LEADERBOARD_ID_ALL    (timeSpan: 2)
 *
 *   fetchRankings()를 실제 API 호출로 교체하세요.
 * ============================================================ */

export type RankingPeriod = "daily" | "weekly" | "all";

export interface RankingEntry {
  rank:   number;
  name:   string;
  score:  number;
  isMe?:  boolean;
}

/* ── Mock 데이터 ─────────────────────────────────────────── */
const MOCK_RANKINGS: Record<RankingPeriod, RankingEntry[]> = {
  daily: [
    { rank: 1,  name: "🌸 봄이",     score: 18240 },
    { rank: 2,  name: "🌿 나무꾼",   score: 15680 },
    { rank: 3,  name: "🌻 해바라기", score: 12450 },
    { rank: 4,  name: "🍀 클로버",   score: 11200 },
    { rank: 5,  name: "🌱 새싹이",   score: 9870  },
    { rank: 6,  name: "🌲 소나무",   score: 8640  },
    { rank: 7,  name: "🌺 장미",     score: 7520  },
    { rank: 8,  name: "🍁 단풍이",   score: 6380  },
    { rank: 9,  name: "🌵 선인장",   score: 5210  },
    { rank: 10, name: "🎋 대나무",   score: 4890  },
  ],
  weekly: [
    { rank: 1,  name: "🌸 봄이",     score: 98500 },
    { rank: 2,  name: "🎋 대나무",   score: 87200 },
    { rank: 3,  name: "🌻 해바라기", score: 76800 },
    { rank: 4,  name: "🌿 나무꾼",   score: 65400 },
    { rank: 5,  name: "🍁 단풍이",   score: 54200 },
    { rank: 6,  name: "🌺 장미",     score: 49800 },
    { rank: 7,  name: "🍀 클로버",   score: 42500 },
    { rank: 8,  name: "🌲 소나무",   score: 38900 },
    { rank: 9,  name: "🌵 선인장",   score: 31200 },
    { rank: 10, name: "🌱 새싹이",   score: 28700 },
  ],
  all: [
    { rank: 1,  name: "🌸 봄이",     score: 524800 },
    { rank: 2,  name: "🎋 대나무",   score: 487200 },
    { rank: 3,  name: "🌻 해바라기", score: 412600 },
    { rank: 4,  name: "🌿 나무꾼",   score: 385400 },
    { rank: 5,  name: "🍁 단풍이",   score: 356200 },
    { rank: 6,  name: "🌺 장미",     score: 298700 },
    { rank: 7,  name: "🍀 클로버",   score: 254100 },
    { rank: 8,  name: "🌲 소나무",   score: 198500 },
    { rank: 9,  name: "🌵 선인장",   score: 176300 },
    { rank: 10, name: "🌱 새싹이",   score: 154900 },
  ],
};

/* ── 신규 랭킹 서비스 re-export ──────────────────────────── */
export {
  recordGameScore,
  fetchRankingBoard,
  checkPeriodTransitions,
  getPendingRewards,
  claimReward,
  formatRemaining,
  getCurrentPeriodKey,
  PERIOD_LABEL,
  SCORE_TYPE_LABEL,
  type ScoreType,
  type PeriodType,
  type RankingBoardResult,
  type PendingReward,
} from "./rankingService";

const BEST_SCORE_KEY = "plant2048_bestScore";

export const getLocalBestScore = (): number => {
  try {
    return parseInt(localStorage.getItem(BEST_SCORE_KEY) ?? "0", 10) || 0;
  } catch {
    return 0;
  }
};

/**
 * 랭킹 데이터를 가져온다 (현재는 Mock).
 * 내 점수를 삽입해 순위를 계산한다.
 *
 * 📱 [GPGS 연결 포인트]
 *   Capacitor:
 *     const result = await GooglePlayGamesServices.loadLeaderboardScores({
 *       leaderboardID: LEADERBOARD_ID_...,
 *       timeSpan: 0 | 1 | 2,   // DAILY=0, WEEKLY=1, ALL_TIME=2
 *       collection: 0,          // PUBLIC
 *       maxResults: 25,
 *     });
 *     return result.items.map(item => ({
 *       rank:  item.rank,
 *       name:  item.scoreHolderDisplayName,
 *       score: item.rawScore,
 *     }));
 */
export const fetchRankings = (
  period: RankingPeriod,
  myScore: number,
): { entries: RankingEntry[]; myRank: number | null } => {
  /* TODO: 실제 GPGS API 호출로 교체 */
  const base = MOCK_RANKINGS[period].map((e) => ({ ...e }));

  if (myScore <= 0) return { entries: base, myRank: null };

  const myEntry: RankingEntry = { rank: 0, name: "나 🌱", score: myScore, isMe: true };
  const allEntries = [...base, myEntry].sort((a, b) => b.score - a.score);
  allEntries.forEach((e, i) => { e.rank = i + 1; });

  const top10  = allEntries.slice(0, 10);
  const myRank = allEntries.find((e) => e.isMe)?.rank ?? null;

  return { entries: top10, myRank };
};
