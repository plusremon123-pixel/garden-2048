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

export const SEASON_THEMES: Record<Season, SeasonTheme> = {
  /* ── 봄: 연두·핑크·크림, 밝고 부드러운 파스텔 ───────── */
  spring: {
    backgroundColor:   "#f5fbf6",
    panelColor:        "#e8f5e9",
    popupBg:           "#fdfff8",
    boardColor:        "#c8e6c9",
    cellColor:         "#a5d6a7",
    btnPrimary:        "hsl(142 76% 36%)",
    btnPrimaryText:    "#ffffff",
    btnPrimaryHover:   "hsl(142 72% 29%)",
    btnSecondary:      "#e8f5e9",
    btnSecondaryText:  "#1b5e20",
    textPrimary:       "#1b5e20",
    textSecondary:     "#2e7d32",
    textMuted:         "#66bb6a",
    accentColor:       "#f48fb1",
    borderColor:       "#a5d6a7",
    shadow:            "rgba(76,175,80,0.14)",
    popupHeaderBg:     "#e8f5e9",
    popupHeaderText:   "#1b5e20",
    cssVars: {
      background:   "140 30% 98%",
      foreground:   "142 64% 14%",
      board:        "142 20% 86%",
      cell:         "142 25% 78%",
      primary:      "142 76% 36%",
      primaryHover: "142 72% 29%",
    },
  },

  /* ── 여름: 에메랄드·청록, 생기 있고 시원한 ─────────── */
  summer: {
    backgroundColor:   "#e8f8f5",
    panelColor:        "#d0f0ea",
    popupBg:           "#f0fdf9",
    boardColor:        "#80cbc4",
    cellColor:         "#4db6ac",
    btnPrimary:        "hsl(174 60% 34%)",
    btnPrimaryText:    "#ffffff",
    btnPrimaryHover:   "hsl(174 60% 26%)",
    btnSecondary:      "#d0f0ea",
    btnSecondaryText:  "#004d40",
    textPrimary:       "#004d40",
    textSecondary:     "#00695c",
    textMuted:         "#26a69a",
    accentColor:       "#ffcc02",
    borderColor:       "#4db6ac",
    shadow:            "rgba(0,137,123,0.14)",
    popupHeaderBg:     "#d0f0ea",
    popupHeaderText:   "#004d40",
    cssVars: {
      background:   "174 50% 95%",
      foreground:   "174 70% 15%",
      board:        "174 35% 72%",
      cell:         "174 40% 62%",
      primary:      "174 60% 34%",
      primaryHover: "174 60% 26%",
    },
  },

  /* ── 가을: 오렌지·브라운·머스터드, 따뜻하고 안정 ───── */
  autumn: {
    backgroundColor:   "#fff8f0",
    panelColor:        "#ffecd8",
    popupBg:           "#fffaf4",
    boardColor:        "#ffcc80",
    cellColor:         "#ffa726",
    btnPrimary:        "hsl(24 80% 48%)",
    btnPrimaryText:    "#ffffff",
    btnPrimaryHover:   "hsl(24 80% 38%)",
    btnSecondary:      "#ffecd8",
    btnSecondaryText:  "#5d2e0c",
    textPrimary:       "#5d2e0c",
    textSecondary:     "#8d4a1a",
    textMuted:         "#d4720a",
    accentColor:       "#ffc107",
    borderColor:       "#ffa726",
    shadow:            "rgba(200,80,0,0.14)",
    popupHeaderBg:     "#ffecd8",
    popupHeaderText:   "#5d2e0c",
    cssVars: {
      background:   "34 80% 97%",
      foreground:   "22 70% 21%",
      board:        "38 100% 75%",
      cell:         "38 100% 58%",
      primary:      "24 80% 48%",
      primaryHover: "24 80% 38%",
    },
  },

  /* ── 겨울: 밝은 화이트·블루·연그레이, 차갑고 부드러운 */
  winter: {
    backgroundColor:   "#eef4fb",
    panelColor:        "#ddeaf8",
    popupBg:           "#f4f8fd",
    boardColor:        "#90caf9",
    cellColor:         "#64b5f6",
    btnPrimary:        "hsl(212 72% 42%)",
    btnPrimaryText:    "#ffffff",
    btnPrimaryHover:   "hsl(212 72% 32%)",
    btnSecondary:      "#ddeaf8",
    btnSecondaryText:  "#0d2e66",
    textPrimary:       "#0d2e66",
    textSecondary:     "#1565c0",
    textMuted:         "#64b5f6",
    accentColor:       "#b3e5fc",
    borderColor:       "#64b5f6",
    shadow:            "rgba(21,101,192,0.14)",
    popupHeaderBg:     "#ddeaf8",
    popupHeaderText:   "#0d2e66",
    cssVars: {
      background:   "212 55% 95%",
      foreground:   "212 70% 22%",
      board:        "212 80% 75%",
      cell:         "212 80% 68%",
      primary:      "212 72% 42%",
      primaryHover: "212 72% 32%",
    },
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
