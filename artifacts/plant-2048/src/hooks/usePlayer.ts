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
  applyXpCapped,
  loadPlayerData,
  savePlayerData,
} from "@/utils/playerData";

export type { ApplyXpResult };

export function usePlayer() {
  const [player, setPlayer] = useState<PlayerData>(loadPlayerData);

  /**
   * XP를 추가하고, 레벨업/보상 결과를 반환한다.
   * 한 판에 최대 1레벨까지만 올라가며 남는 XP는 이월된다.
   */
  const earnXp = useCallback((xpAmount: number): ApplyXpResult => {
    /* setPlayer 업데이터 안에서 result를 캡처하는 방식은
     * React 18 자동 배치 환경에서 updater가 지연 실행될 경우
     * result가 undefined로 반환될 수 있음.
     * localStorage에서 최신 데이터를 직접 읽어 동기적으로 계산한다. */
    const current = loadPlayerData();
    const result  = applyXpCapped(current, xpAmount);
    savePlayerData(result.newPlayer);
    setPlayer(result.newPlayer);
    return result;
  }, []);

  /**
   * 맵 스테이지 클리어 처리 — clearedLevel + 1
   */
  const clearLevel = useCallback(() => {
    setPlayer((prev) => {
      const updated = { ...prev, clearedLevel: prev.clearedLevel + 1 };
      savePlayerData(updated);
      return updated;
    });
  }, []);

  /**
   * 코인을 차감한다. 잔액 부족 시 false 반환.
   */
  const spendCoins = useCallback((amount: number): boolean => {
    let success = false;
    setPlayer((prev) => {
      if (prev.coins < amount) return prev;
      success = true;
      const updated = { ...prev, coins: prev.coins - amount };
      savePlayerData(updated);
      return updated;
    });
    return success;
  }, []);

  /**
   * 코인을 추가한다.
   */
  const addCoins = useCallback((amount: number) => {
    if (amount <= 0) return;
    setPlayer((prev) => {
      const updated = { ...prev, coins: prev.coins + amount };
      savePlayerData(updated);
      return updated;
    });
  }, []);

  /**
   * 강제로 플레이어 데이터를 재로드한다.
   */
  const reloadPlayer = useCallback(() => {
    setPlayer(loadPlayerData());
  }, []);

  return { player, earnXp, clearLevel, spendCoins, addCoins, reloadPlayer };
}
