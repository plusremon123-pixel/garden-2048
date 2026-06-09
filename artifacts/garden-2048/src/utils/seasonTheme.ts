/* ============================================================
 * seasonTheme.ts
 * 사계절 UI 테마 시스템 — 모든 화면/팝업의 색상 기준
 * ============================================================ */

import { Season } from "./seasonData";

export interface SeasonTheme {
  /* 배경 */
  backgroundColor: string;
  panelColor:      string;
  popupBg:         string;

  /* 보드 */
  boardColor: string;
  cellColor:  string;

  /* 버튼 */
  btnPrimary:      string;
  btnPrimaryText:  string;
  btnPrimaryHover: string;
  btnSecondary:    string;
  btnSecondaryText:string;

  /* 텍스트 */
  textPrimary:   string;
  textSecondary: string;
  textMuted:     string;

  /* 강조 */
  accentColor: string;
  borderColor: string;
  shadow:      string;

  /* 팝업 헤더 */
  popupHeaderBg:   string;
  popupHeaderText: string;

  /* CSS 변수 주입용 (HSL 값, hsl() 없이) */
  cssVars: {
    background:   string;
    foreground:   string;
    board:        string;
    cell:         string;
    primary:      string;
    primaryHover: string;
  };
}

const GARDEN_THEME = {
  backgroundColor:   "#FFF8EA",
  boardColor:        "#B98045",
  cellColor:         "#E8D0A8",
  panelColor:        "rgba(255,248,232,0.92)",
  popupBg:           "#FFF8EA",
  btnPrimary:        "#F59E0B",
  btnPrimaryText:    "#FFFDF7",
  btnPrimaryHover:   "#D97706",
  btnSecondary:      "#F5E3C4",
  btnSecondaryText:  "#4C2E0C",
  textPrimary:       "#4C2E0C",
  textSecondary:     "#74502A",
  textMuted:         "#A98258",
  accentColor:       "#63A35C",
  borderColor:       "#E0BD83",
  shadow:            "rgba(96,58,18,0.16)",
  popupHeaderBg:     "linear-gradient(180deg, #FFF1D0 0%, #FFE2A6 100%)",
  popupHeaderText:   "#4C2E0C",
} as const;

const GARDEN_CSS_VARS = {
  background:   "38 100% 96%",
  foreground:   "27 74% 17%",
  board:        "28 45% 50%",
  cell:         "34 55% 78%",
  primary:      "38 92% 50%",
  primaryHover: "32 95% 44%",
} as const;

export const SEASON_THEMES: Record<Season, SeasonTheme> = {
  spring: {
    ...GARDEN_THEME,
    panelColor: "rgba(255,248,232,0.94)",
    popupBg: "#FFF8EA",
    accentColor: "#63A35C",
    cssVars: { ...GARDEN_CSS_VARS },
  },
  summer: {
    ...GARDEN_THEME,
    backgroundColor: "#FFFBE3",
    panelColor: "rgba(255,250,221,0.94)",
    popupBg: "#FFFBE8",
    accentColor: "#4F9A37",
    borderColor: "#E8C76F",
    cssVars: { ...GARDEN_CSS_VARS, background: "52 100% 95%" },
  },
  autumn: {
    ...GARDEN_THEME,
    backgroundColor: "#FFF2DC",
    panelColor: "rgba(255,239,216,0.94)",
    popupBg: "#FFF3E2",
    accentColor: "#C56A2D",
    borderColor: "#DFA86A",
    cssVars: { ...GARDEN_CSS_VARS, background: "31 100% 94%" },
  },
  winter: {
    ...GARDEN_THEME,
    backgroundColor: "#F0F8FF",
    panelColor: "rgba(246,252,255,0.94)",
    popupBg: "#F6FBFF",
    btnSecondary: "#E3F2FD",
    accentColor: "#5E9BC8",
    borderColor: "#BBD8EA",
    shadow: "rgba(38,78,112,0.14)",
    cssVars: { ...GARDEN_CSS_VARS, background: "204 100% 97%", primary: "38 88% 52%" },
  },
};

/**
 * 현재 계절의 CSS 변수를 document.documentElement에 주입한다.
 * App.tsx의 useEffect에서 호출하면 전체 앱에 즉시 반영된다.
 */
export function applySeasonCssVars(season: Season): void {
  const vars = SEASON_THEMES[season].cssVars;
  const root = document.documentElement;
  root.style.setProperty("--background",          vars.background);
  root.style.setProperty("--foreground",          vars.foreground);
  root.style.setProperty("--board",               vars.board);
  root.style.setProperty("--cell",                vars.cell);
  root.style.setProperty("--primary",             vars.primary);
  root.style.setProperty("--primary-hover",       vars.primaryHover);
  root.style.setProperty("--primary-foreground",  "0 0% 100%");
}
