/* ============================================================
 * adService.ts
 * 광고 Mock 서비스
 *
 * 실제 광고 SDK (AdMob, Google AdSense 등)를 연결할 때는
 * watchAd() 내부 구현만 교체하면 됩니다.
 * 외부 인터페이스(Promise<boolean>)는 동일하게 유지됩니다.
 * ============================================================ */

/** Mock 광고 시청 시간 (ms) */
const AD_DURATION_MS = 2000;

/** Mock 성공률 (0 ~ 1). 테스트 시 1.0 = 항상 성공 */
const AD_SUCCESS_RATE = 1.0;

/**
 * 광고를 시청한다.
 * - 실제 SDK 연결 전까지 일정 시간 대기 후 결과를 반환하는 mock
 * @returns 광고 시청 성공 여부
 */
export const watchAd = (): Promise<boolean> =>
  new Promise((resolve) =>
    setTimeout(() => resolve(Math.random() < AD_SUCCESS_RATE), AD_DURATION_MS)
  );

/**
 * 광고 가용 여부 확인 (mock: 항상 true)
 * 실 SDK에서는 광고 로드 상태를 확인합니다.
 */
export const isAdAvailable = (): boolean => true;
