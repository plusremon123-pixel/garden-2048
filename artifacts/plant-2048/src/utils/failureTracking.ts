/* ============================================================
 * failureTracking.ts
 * 실패 횟수 추적 · 골드 부스트 / 무료체험 표시 조건 판단
 * ============================================================ */

import { SubscriptionState, isPremiumActive } from "./subscriptionData";

export interface FailureState {
  stageId:          number;        // 현재 추적 스테이지
  failCount:        number;        // 이 스테이지 총 실패 횟수
  consecutiveFails: number;        // 연속 실패 (전역, 스테이지 관계없이)
  goldBoostUsed:    number;        // 이 스테이지 골드 부스트 사용 횟수 (max 2)
  goldBoostDate:    string;        // YYYY-MM-DD (일별 리셋용)
  goldBoostDaily:   number;        // 오늘 골드 부스트 사용 횟수 (max 4)
  lastBoostStage:   number | null; // 직전 골드 부스트를 받은 스테이지 (연속 방지)
}

const KEY = "plant2048_failure_state";

const DEFAULT: FailureState = {
  stageId:          0,
  failCount:        0,
  consecutiveFails: 0,
  goldBoostUsed:    0,
  goldBoostDate:    "",
  goldBoostDaily:   0,
  lastBoostStage:   null,
};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function loadFailureState(): FailureState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveFailureState(s: FailureState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

/** 일별 카운터 리셋이 필요한 경우 처리 후 반환 */
function refreshDaily(s: FailureState): FailureState {
  const today = todayStr();
  if (s.goldBoostDate !== today) {
    return { ...s, goldBoostDate: today, goldBoostDaily: 0 };
  }
  return s;
}

/** 실패 시 호출 — 스테이지가 바뀌면 per-stage 카운터 리셋 */
export function recordFailure(s: FailureState, stageId: number): FailureState {
  const base = stageId !== s.stageId
    ? { ...s, stageId, failCount: 0, goldBoostUsed: 0 }
    : { ...s };
  const next: FailureState = {
    ...base,
    failCount:        base.failCount + 1,
    consecutiveFails: base.consecutiveFails + 1,
  };
  saveFailureState(next);
  return next;
}

/** 승리 시 호출 — 연속 실패 리셋 */
export function recordWin(s: FailureState): FailureState {
  const next: FailureState = { ...s, consecutiveFails: 0 };
  saveFailureState(next);
  return next;
}

/** 골드 부스트 사용 기록 */
export function recordGoldBoost(s: FailureState, stageId: number): FailureState {
  const refreshed = refreshDaily(s);
  const next: FailureState = {
    ...refreshed,
    goldBoostUsed:  refreshed.goldBoostUsed + 1,
    goldBoostDaily: refreshed.goldBoostDaily + 1,
    lastBoostStage: stageId,
  };
  saveFailureState(next);
  return next;
}

/** 이번 게임 시작 전 골드 부스트 모달을 보여줄지 판단 */
export function canShowGoldBoost(s: FailureState, stageId: number): boolean {
  if (s.stageId !== stageId) return false;
  const refreshed = refreshDaily(s);
  const threshold = s.goldBoostUsed === 0 ? 5 : s.goldBoostUsed === 1 ? 8 : 999;
  const dailyOk   = refreshed.goldBoostDaily < 4;
  const noConsec  = refreshed.lastBoostStage !== stageId;
  return (
    s.failCount >= threshold &&
    s.goldBoostUsed < 2      &&
    dailyOk                  &&
    noConsec
  );
}

/** 무료 체험 모달을 보여줄지 판단 */
export function canShowFreeTrial(
  s: FailureState,
  sub: SubscriptionState,
  isObstacleStage: boolean,
): boolean {
  if (sub.trialUsed) return false;
  if (isPremiumActive(sub)) return false;
  return s.consecutiveFails >= 2 || isObstacleStage;
}
