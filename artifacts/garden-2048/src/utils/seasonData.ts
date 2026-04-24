/* ============================================================
 * seasonData.ts
 * 계절 판별 유틸 — stage 번호 기준으로 spring/summer/autumn/winter 반환
 * 이 파일 한 곳에서 계절 관련 모든 상수를 관리한다.
 * ============================================================ */

export type Season = "spring" | "summer" | "autumn" | "winter";

/**
 * stage 번호 → 계절
 *   1  ~ 249  = spring   (249 클리어 시 전환)
 *   250 ~ 499  = summer   (499 클리어 시 전환)
 *   500 ~ 749  = autumn   (749 클리어 시 전환)
 *   750 ~ 1000 = winter
 */
export function getSeason(stage: number): Season {
  if (stage <= 249) return "spring";
  if (stage <= 499) return "summer";
  if (stage <= 749) return "autumn";
  return "winter";
}

/** 계절별 홈 배경 SVG 경로 */
export const SEASON_BG: Record<Season, string> = {
  spring: "/home_bg_1.svg",
  summer: "/home_bg_2.svg",
  autumn: "/home_3.svg",    // public 폴더 실제 파일명 기준
  winter: "/home_bg_4.svg",
};

/**
 * 계절별 노드 이미지 CSS filter
 * - 기존 stage_ready/stay/end.svg 에셋을 그대로 사용하면서
 *   계절 톤을 입혀 배경과 자연스럽게 어울리도록 조정
 * - "none" = 필터 없음 (spring 기준 원본)
 */
export const SEASON_NODE_FILTER: Record<Season, string> = {
  spring: "none",
  summer: "saturate(1.18) brightness(1.06) hue-rotate(5deg)",
  autumn: "sepia(0.38) hue-rotate(-18deg) saturate(1.22) brightness(0.96)",
  winter: "saturate(0.52) hue-rotate(198deg) brightness(0.90)",
};

/**
 * 계절별 glow 색상 (STAY 노드 드롭섀도우용)
 */
export const SEASON_STAY_GLOW: Record<Season, string> = {
  spring: "rgba(230,190,30,0.95)",   // 노란 빛
  summer: "rgba(255,160,40,0.95)",   // 주황 빛
  autumn: "rgba(220,100,30,0.95)",   // 붉은 빛
  winter: "rgba(130,200,255,0.95)",  // 차가운 파랑 빛
};

/**
 * 계절별 STAY pulse ring 색상
 */
export const SEASON_PULSE_COLOR: Record<Season, string> = {
  spring: "rgba(255,210,60,0.7)",
  summer: "rgba(255,160,60,0.7)",
  autumn: "rgba(220,110,40,0.7)",
  winter: "rgba(140,210,255,0.7)",
};
