/* ============================================================
 * usePlayer.ts
 * 플레이어 레벨/XP/코인 상태 관리 훅
 *
 * App.tsx에서 1회 생성 후 필요한 컴포넌트에 props로 전달.
 * localStorage와 항상 동기화됩니다.
 * ============================================================ */

import { useState, useCallback } from "react";
import {
  PlayerData,
  ApplyXpResult,
  applyXp,
  loadPlayerData,
  savePlayerData,
} from "@/utils/playerData";

export type { ApplyXpResult };

export function usePlayer() {
  const [player, setPlayer] = useState<PlayerData>(loadPlayerData);

  /**
   * XP를 추가하고, 레벨업/보상 결과를 반환한다.
   * 상태와 localStorage가 즉시 업데이트됩니다.
   */
  const earnXp = useCallback((xpAmount: number): ApplyXpResult => {
    let result!: ApplyXpResult;
    setPlayer((prev) => {
      result = applyXp(prev, xpAmount);
      savePlayerData(result.newPlayer);
      return result.newPlayer;
    });
    return result;
  }, []);

  /**
   * 강제로 플레이어 데이터를 재로드한다.
   * (다른 탭에서 변경된 경우 등 예외 상황에 사용)
   */
  const reloadPlayer = useCallback(() => {
    setPlayer(loadPlayerData());
  }, []);

  return { player, earnXp, reloadPlayer };
}
