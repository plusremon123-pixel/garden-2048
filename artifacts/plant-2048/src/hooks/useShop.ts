/* ============================================================
 * useShop.ts
 * 상점 인벤토리 상태 관리 훅
 *
 * 역할: 인벤토리 로드/저장, 아이템 추가/사용
 * 실제 구매(코인 차감) 로직은 Game.tsx에서 usePlayer.spendCoins와 연동
 * ============================================================ */

import { useState, useCallback } from "react";
import {
  Inventory,
  ShopItemId,
  loadInventory,
  saveInventory,
} from "@/utils/shopData";

export function useShop() {
  const [inventory, setInventory] = useState<Inventory>(loadInventory);

  /**
   * 인벤토리에 아이템 추가 (구매 성공 후 호출)
   */
  const addToInventory = useCallback((itemId: ShopItemId, quantity = 1) => {
    setInventory((prev) => {
      const updated = { ...prev, [itemId]: (prev[itemId] ?? 0) + quantity };
      saveInventory(updated);
      return updated;
    });
  }, []);

  /**
   * 인벤토리에서 아이템 소비 (사용 버튼 클릭 시)
   * @returns 성공 여부 (수량 부족 시 false)
   */
  const useFromInventory = useCallback((itemId: ShopItemId): boolean => {
    let success = false;
    setInventory((prev) => {
      if ((prev[itemId] ?? 0) <= 0) return prev;
      success = true;
      const updated = { ...prev, [itemId]: prev[itemId] - 1 };
      saveInventory(updated);
      return updated;
    });
    return success;
  }, []);

  /**
   * unlock 아이템 보유 여부 확인
   */
  const hasUnlock = useCallback(
    (itemId: ShopItemId) => (inventory[itemId] ?? 0) >= 1,
    [inventory]
  );

  return { inventory, addToInventory, useFromInventory, hasUnlock };
}
