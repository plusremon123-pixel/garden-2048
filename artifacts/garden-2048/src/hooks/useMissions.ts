/* ============================================================
 * useMissions.ts
 * 일일/주간 미션 상태 관리 훅
 *
 * App.tsx에서 1회 생성 → 필요한 컴포넌트에 props로 전달
 * ============================================================ */

import { useState, useCallback } from "react";
import {
  MissionState,
  MissionId,
  DAILY_MISSIONS,
  loadDailyMissions,
  saveDailyMissions,
  advanceMission,
  WeeklyMissionId,
  WeeklyMissionState,
  WEEKLY_MISSIONS,
  loadWeeklyMissions,
  saveWeeklyMissions,
  advanceWeeklyMission,
} from "@/utils/missionData";

export function useMissions() {
  const [missions,       setMissions]       = useState<MissionState[]>(loadDailyMissions);
  const [weeklyMissions, setWeeklyMissions] = useState<WeeklyMissionState[]>(loadWeeklyMissions);

  /* ── 일일 미션 ─────────────────────────────────────────── */

  const updateMission = useCallback((id: MissionId, inc = 1) => {
    setMissions((prev) => {
      const next = advanceMission(prev, id, inc);
      saveDailyMissions(next);
      return next;
    });
  }, []);

  const claimMission = useCallback(
    (id: MissionId): number => {
      const state = missions.find((s) => s.id === id);
      if (!state || state.status !== "complete") return 0;

      const reward = DAILY_MISSIONS.find((m) => m.id === id)!.reward;

      setMissions((prev) => {
        const next = prev.map((s) =>
          s.id === id ? { ...s, status: "claimed" as const } : s
        );
        saveDailyMissions(next);
        return next;
      });

      return reward;
    },
    [missions],
  );

  /* ── 주간 미션 ─────────────────────────────────────────── */

  const updateWeeklyMission = useCallback((id: WeeklyMissionId, inc = 1) => {
    setWeeklyMissions((prev) => {
      const next = advanceWeeklyMission(prev, id, inc);
      saveWeeklyMissions(next);
      return next;
    });
  }, []);

  const claimWeeklyMission = useCallback(
    (id: WeeklyMissionId): number => {
      const state = weeklyMissions.find((s) => s.id === id);
      if (!state || state.status !== "complete") return 0;

      const reward = WEEKLY_MISSIONS.find((m) => m.id === id)!.reward;

      setWeeklyMissions((prev) => {
        const next = prev.map((s) =>
          s.id === id ? { ...s, status: "claimed" as const } : s
        );
        saveWeeklyMissions(next);
        return next;
      });

      return reward;
    },
    [weeklyMissions],
  );

  return {
    missions,
    updateMission,
    claimMission,
    weeklyMissions,
    updateWeeklyMission,
    claimWeeklyMission,
  };
}
