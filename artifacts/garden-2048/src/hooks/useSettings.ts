/* ============================================================
 * useSettings.ts
 * 게임 설정 상태 관리 훅 (사운드·진동·애니메이션·알림)
 * ============================================================ */

import { useState, useCallback } from "react";

export interface GameSettings {
  sound:         boolean;
  vibration:     boolean;
  animation:     boolean;
  notifications: boolean;
}

const SETTINGS_KEY = "plant2048_settings";

const DEFAULT_SETTINGS: GameSettings = {
  sound:         true,
  vibration:     true,
  animation:     true,
  notifications: false,
};

const loadSettings = (): GameSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    return {
      sound:         parsed.sound         ?? true,
      vibration:     parsed.vibration     ?? true,
      animation:     parsed.animation     ?? true,
      notifications: parsed.notifications ?? false,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
};

const saveSettings = (s: GameSettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch { /* noop */ }
};

export function useSettings() {
  const [settings, setSettings] = useState<GameSettings>(loadSettings);

  const toggleSetting = useCallback((key: keyof GameSettings) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveSettings(next);
      return next;
    });
  }, []);

  return { settings, toggleSetting };
}
