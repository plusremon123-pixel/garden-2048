/* ============================================================
 * adConfig.ts
 * AdMob 광고 ID 중앙 관리
 *
 * ⚠️  실제 출시 전 반드시 Production IDs로 교체!
 *     Test IDs 로 출시하면 AdMob 정책 위반 → 계정 정지 가능
 *
 * 🧪 Test IDs (Google 공식, 개발 중 자유롭게 사용 가능)
 *     https://developers.google.com/admob/android/test-ads
 * ============================================================ */

/* 환경 판정 — vite 빌드 시 MODE=production 이면 실제 ID 사용 */
const isProduction = import.meta.env.PROD;

/** ✏️ Production App/Unit IDs — AdMob 콘솔에서 앱 등록 후 발급받은 값 입력 */
const PRODUCTION = {
  APP_ID:         "ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY",   // TODO: 교체
  BANNER:         "ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY",   // TODO: 교체
  INTERSTITIAL:   "ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY",   // TODO: 교체
  REWARDED:       "ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY",   // TODO: 교체
  REWARDED_INT:   "ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY",   // TODO: 교체
};

/** 🧪 Test IDs (Google 공식 테스트 계정 — 개발/디버그 전용) */
const TEST = {
  APP_ID:         "ca-app-pub-3940256099942544~3347511713",
  BANNER:         "ca-app-pub-3940256099942544/6300978111",
  INTERSTITIAL:   "ca-app-pub-3940256099942544/1033173712",
  REWARDED:       "ca-app-pub-3940256099942544/5224354917",
  REWARDED_INT:   "ca-app-pub-3940256099942544/5354046379",
};

export const AD_IDS = isProduction ? PRODUCTION : TEST;

/** AdMob App ID (AndroidManifest.xml meta-data 값과 일치해야 함) */
export const ADMOB_APP_ID = AD_IDS.APP_ID;
