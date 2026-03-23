/* ============================================================
 * useAppState.ts
 * 앱 전체 화면 상태 및 테마 선택 상태 관리 훅
 *
 * - currentScreen: 'front' | 'game'
 * - selectedThemeId: 현재 선택된 테마 ID
 * - 선택 테마는 localStorage에 저장됨
 * ============================================================ */

import { useState, useCallback } from "react";
import { THEME_STORAGE_KEY, THEMES } from "@/utils/themes";

export type Screen = "front" | "game";

const loadSavedTheme = (): string => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && THEMES[saved]) return saved;
  } catch {
    /* localStorage 접근 불가 시 기본값 사용 */
  }
  return "plant";
};

export function useAppState() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("front");
  const [selectedThemeId, setSelectedThemeId] = useState<string>(loadSavedTheme);

  /* 테마 선택 - localStorage에도 저장 */
  const selectTheme = useCallback((themeId: string) => {
    if (!THEMES[themeId]) return;
    setSelectedThemeId(themeId);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeId);
    } catch {
      /* noop */
    }
  }, []);

  /* 게임 화면으로 전환 */
  const goToGame = useCallback(() => {
    setCurrentScreen("game");
  }, []);

  /* 진입 화면으로 돌아가기 */
  const goToFront = useCallback(() => {
    setCurrentScreen("front");
  }, []);

  return {
    currentScreen,
    selectedThemeId,
    selectTheme,
    goToGame,
    goToFront,
  };
}
