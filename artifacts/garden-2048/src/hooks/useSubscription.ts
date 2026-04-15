/* ============================================================
 * useSubscription.ts
 * 구독 / 무료 체험 상태 관리 훅
 * ============================================================ */

import { useState, useCallback, useEffect } from "react";
import {
  SubscriptionState,
  loadSubscription,
  isPremiumActive,
  startFreeTrial,
  expireTrial,
  activatePremium,
  checkTrialExpiry,
} from "@/utils/subscriptionData";

export function useSubscription() {
  const [sub, setSub] = useState<SubscriptionState>(loadSubscription);

  const active = isPremiumActive(sub);

  /* 앱 마운트 & 포커스 시 만료 체크 */
  useEffect(() => {
    const check = () => {
      const expired = checkTrialExpiry(sub);
      if (expired) setSub(expired);
    };
    check();
    window.addEventListener("focus", check);
    return () => window.removeEventListener("focus", check);
  }, [sub]);

  /** 1일 무료 체험 시작 */
  const startTrial = useCallback(() => {
    setSub(startFreeTrial());
  }, []);

  /** 유료 구독 활성화 (실제 결제 플로우는 호출 전에 완료) */
  const buyPremium = useCallback(async () => {
    setSub(activatePremium());
  }, []);

  /** 체험 만료 처리 (게임 종료 시 수동 체크) */
  const checkExpiry = useCallback(() => {
    const expired = checkTrialExpiry(sub);
    if (expired) setSub(expired);
    return expired !== null; // true면 방금 만료됨
  }, [sub]);

  /** 구독 취소 / 초기화 (개발용) */
  const resetSubscription = useCallback(() => {
    setSub(expireTrial({ isPremium: false, trialUsed: false, trialActive: false, trialExpiry: null }));
  }, []);

  return {
    sub,
    active,
    startTrial,
    buyPremium,
    checkExpiry,
    resetSubscription,
  };
}
