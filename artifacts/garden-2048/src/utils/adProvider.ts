/* ============================================================
 * adProvider.ts
 * AdMob SDK Wrapper — native(Capacitor) vs web 폴백 추상화
 *
 * 현재 상태: Mock 구현. `@capacitor-community/admob` 설치 후
 *             아래 TODO 블록을 활성화하면 실제 광고가 표시됨.
 *
 * 설치 명령:
 *   pnpm add @capacitor-community/admob
 *   pnpm exec cap sync android
 *
 * 이후 initAdmob() 이 앱 부팅 시 1회 호출되도록
 * App.tsx 최상단에서 await initAdmob() 추가
 * ============================================================ */

import { Capacitor } from "@capacitor/core";
import { AD_IDS } from "./adConfig";

/** 네이티브 Android/iOS 환경에서만 AdMob 활성화 */
const isNative = () => {
  try { return Capacitor.isNativePlatform(); }
  catch { return false; }
};

let initialized = false;

/** AdMob 초기화 — App 부팅 시 1회 호출 */
export const initAdmob = async (): Promise<void> => {
  if (initialized || !isNative()) return;
  try {
    // ── TODO: @capacitor-community/admob 설치 후 주석 해제 ───
    // const { AdMob } = await import("@capacitor-community/admob");
    // await AdMob.initialize({
    //   testingDevices: [],
    //   initializeForTesting: !import.meta.env.PROD,
    // });
    initialized = true;
  } catch (e) {
    console.warn("[AdMob] init failed", e);
  }
};

/** 인터스티셜 광고 표시 — Promise<성공여부> */
export const showInterstitial = async (): Promise<boolean> => {
  if (!isNative()) return true; // web: mock
  try {
    // ── TODO: @capacitor-community/admob 설치 후 주석 해제 ───
    // const { AdMob } = await import("@capacitor-community/admob");
    // await AdMob.prepareInterstitial({ adId: AD_IDS.INTERSTITIAL });
    // await AdMob.showInterstitial();
    void AD_IDS.INTERSTITIAL;  // 현재 unused 경고 방지
    return true;
  } catch (e) {
    console.warn("[AdMob] interstitial failed", e);
    return false;
  }
};

/** 리워드 광고 표시 — Promise<시청완료여부> */
export const showRewarded = async (): Promise<boolean> => {
  if (!isNative()) return true; // web: mock = 항상 완료
  try {
    // ── TODO: @capacitor-community/admob 설치 후 주석 해제 ───
    // const { AdMob, RewardAdPluginEvents } = await import("@capacitor-community/admob");
    // return new Promise<boolean>(async (resolve) => {
    //   let rewarded = false;
    //   const listener = await AdMob.addListener(
    //     RewardAdPluginEvents.Rewarded,
    //     () => { rewarded = true; }
    //   );
    //   const dismissListener = await AdMob.addListener(
    //     RewardAdPluginEvents.Dismissed,
    //     () => {
    //       listener.remove();
    //       dismissListener.remove();
    //       resolve(rewarded);
    //     }
    //   );
    //   await AdMob.prepareRewardVideoAd({ adId: AD_IDS.REWARDED });
    //   await AdMob.showRewardVideoAd();
    // });
    void AD_IDS.REWARDED;
    return true;
  } catch (e) {
    console.warn("[AdMob] rewarded failed", e);
    return false;
  }
};
