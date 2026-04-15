/* ============================================================
 * missionData.ts
 * 일일 미션 시스템 데이터 & localStorage 영속성
 *
 * ✏️ 수정 포인트:
 *   - DAILY_MISSIONS: 미션 목록, 목표 수치, 코인 보상 변경
 * ============================================================ */

export type MissionId     = "play_3" | "reach_64" | "use_item" | "score_500" | "reach_128";
export type MissionStatus = "incomplete" | "complete" | "claimed";

export interface Mission {
  id:          MissionId;
  title:       string;
  description: string;
  target:      number;      /* 달성 목표 수치 */
  reward:      number;      /* 코인 보상 ✏️ */
  emoji:       string;
}

export interface MissionState {
  id:       MissionId;
  progress: number;         /* 현재 진행 수치 */
  status:   MissionStatus;
}

/** ✏️ 미션 목록 — 목표/보상/설명을 자유롭게 수정하세요 */
export const DAILY_MISSIONS: Mission[] = [
  { id: "play_3",    title: "mission.daily.play_3.title",    description: "mission.daily.play_3.desc",    target: 3, reward: 50,  emoji: "🎮" },
  { id: "reach_64",  title: "mission.daily.reach_64.title",  description: "mission.daily.reach_64.desc",  target: 1, reward: 70,  emoji: "🌿" },
  { id: "use_item",  title: "mission.daily.use_item.title",  description: "mission.daily.use_item.desc",  target: 1, reward: 30,  emoji: "🎒" },
  { id: "score_500", title: "mission.daily.score_500.title", description: "mission.daily.score_500.desc", target: 1, reward: 40,  emoji: "⭐" },
  { id: "reach_128", title: "mission.daily.reach_128.title", description: "mission.daily.reach_128.desc", target: 1, reward: 100, emoji: "🌿" },
];

/* ── localStorage ────────────────────────────────────────── */

const MISSIONS_KEY = "plant2048_daily_missions";

interface StoredMissions {
  date:   string;           /* YYYY-MM-DD */
  states: MissionState[];
}

const todayStr = (): string => new Date().toISOString().slice(0, 10);

const defaultStates = (): MissionState[] =>
  DAILY_MISSIONS.map((m) => ({
    id:       m.id,
    progress: 0,
    status:   "incomplete" as MissionStatus,
  }));

export const loadDailyMissions = (): MissionState[] => {
  try {
    const raw = localStorage.getItem(MISSIONS_KEY);
    if (!raw) return defaultStates();
    const stored: StoredMissions = JSON.parse(raw);
    /* 날짜가 바뀌면 초기화 */
    if (stored.date !== todayStr()) return defaultStates();
    return stored.states;
  } catch {
    return defaultStates();
  }
};

export const saveDailyMissions = (states: MissionState[]): void => {
  try {
    localStorage.setItem(
      MISSIONS_KEY,
      JSON.stringify({ date: todayStr(), states })
    );
  } catch { /* noop */ }
};

/**
 * 미션 진행도를 1(또는 inc 만큼) 증가시킨다.
 * - 이미 complete / claimed 상태인 미션은 변경하지 않는다.
 * @returns 변경된 새 배열 (불변)
 */
export const advanceMission = (
  states: MissionState[],
  id:     MissionId,
  inc     = 1,
): MissionState[] =>
  states.map((s) => {
    if (s.id !== id || s.status !== "incomplete") return s;
    const mission  = DAILY_MISSIONS.find((m) => m.id === id)!;
    const newProg  = s.progress + inc;
    const done     = newProg >= mission.target;
    return {
      ...s,
      progress: Math.min(newProg, mission.target),
      status:   done ? "complete" : "incomplete",
    };
  });

/* ── 주간 미션 ──────────────────────────────────────────────── */

export type WeeklyMissionId =
  | "play_10"
  | "score_5000"
  | "tile_128x3"
  | "use_item_5"
  | "ad_reward_3";

export interface WeeklyMission {
  id:          WeeklyMissionId;
  title:       string;
  description: string;
  target:      number;
  reward:      number;
  emoji:       string;
}

export interface WeeklyMissionState {
  id:       WeeklyMissionId;
  progress: number;
  status:   MissionStatus;
}

export const WEEKLY_MISSIONS: WeeklyMission[] = [
  { id: "play_10",     title: "mission.weekly.play_10.title",     description: "mission.weekly.play_10.desc",     target: 10, reward: 150, emoji: "🎮" },
  { id: "score_5000",  title: "mission.weekly.score_5000.title",  description: "mission.weekly.score_5000.desc",  target: 1,  reward: 200, emoji: "🌟" },
  { id: "tile_128x3",  title: "mission.weekly.tile_128x3.title",  description: "mission.weekly.tile_128x3.desc",  target: 3,  reward: 180, emoji: "🌿" },
  { id: "use_item_5",  title: "mission.weekly.use_item_5.title",  description: "mission.weekly.use_item_5.desc",  target: 5,  reward: 120, emoji: "🎒" },
  { id: "ad_reward_3", title: "mission.weekly.ad_reward_3.title", description: "mission.weekly.ad_reward_3.desc", target: 3,  reward: 100, emoji: "📺" },
];

const WEEKLY_MISSIONS_KEY = "plant2048_weekly_missions";

/** ISO 주차 문자열 (YYYY-Www) */
const thisWeekStr = (): string => {
  const d   = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - day);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
};

interface StoredWeeklyMissions {
  week:   string;
  states: WeeklyMissionState[];
}

const defaultWeeklyStates = (): WeeklyMissionState[] =>
  WEEKLY_MISSIONS.map((m) => ({
    id:       m.id,
    progress: 0,
    status:   "incomplete" as MissionStatus,
  }));

export const loadWeeklyMissions = (): WeeklyMissionState[] => {
  try {
    const raw = localStorage.getItem(WEEKLY_MISSIONS_KEY);
    if (!raw) return defaultWeeklyStates();
    const stored: StoredWeeklyMissions = JSON.parse(raw);
    if (stored.week !== thisWeekStr()) return defaultWeeklyStates();
    return stored.states;
  } catch {
    return defaultWeeklyStates();
  }
};

export const saveWeeklyMissions = (states: WeeklyMissionState[]): void => {
  try {
    localStorage.setItem(
      WEEKLY_MISSIONS_KEY,
      JSON.stringify({ week: thisWeekStr(), states }),
    );
  } catch { /* noop */ }
};

export const advanceWeeklyMission = (
  states: WeeklyMissionState[],
  id:     WeeklyMissionId,
  inc     = 1,
): WeeklyMissionState[] =>
  states.map((s) => {
    if (s.id !== id || s.status !== "incomplete") return s;
    const mission = WEEKLY_MISSIONS.find((m) => m.id === id)!;
    const newProg = s.progress + inc;
    const done    = newProg >= mission.target;
    return {
      ...s,
      progress: Math.min(newProg, mission.target),
      status:   done ? "complete" : "incomplete",
    };
  });
