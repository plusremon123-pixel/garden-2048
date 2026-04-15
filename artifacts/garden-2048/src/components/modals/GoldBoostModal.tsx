/* ============================================================
 * GoldBoostModal.tsx
 * 골드 4배 구제 팝업 — 계절 테마 지원
 * ============================================================ */

import { createPortal } from "react-dom";
import { watchAd } from "@/utils/adService";
import { useState } from "react";
import { useTranslation } from "@/i18n";
import type { Season } from "@/utils/seasonData";
import { SEASON_THEMES } from "@/utils/seasonTheme";

interface GoldBoostModalProps {
  isPremium: boolean;
  onBoost:   (multiplier: number) => void;
  onClose:   () => void;
  season?:   Season;
}

export function GoldBoostModal({ isPremium, onBoost, onClose, season = "spring" }: GoldBoostModalProps) {
  const { t } = useTranslation();
  const theme = SEASON_THEMES[season];
  const [watching, setWatching] = useState(false);

  const handleWatchAd = async () => {
    setWatching(true);
    const success = await watchAd();
    setWatching(false);
    if (success) onBoost(4);
    else onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 duration-300 overflow-hidden"
        style={{ background: theme.popupBg }}
      >
        {/* 헤더 — 코인은 항상 골드 컬러 (계절 무관 의미론적 색상) */}
        <div
          className="px-6 pt-6 pb-4 text-center"
          style={{ background: "#fff8e1" }}
        >
          <div className="text-4xl mb-2">🪙✨</div>
          <h2 className="text-lg font-black" style={{ color: "#5D2E0C" }}>
            {isPremium ? t("goldBoost.title") : t("goldBoost.titleStruggle")}
          </h2>
          <p className="text-xs mt-1" style={{ color: "#8D4A1A" }}>
            {isPremium ? t("goldBoost.descPremium") : t("goldBoost.descFree")}
          </p>
        </div>

        {/* 배율 표시 */}
        <div className="px-6 py-5 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border-2"
            style={{ background: "#fff8e1", borderColor: "#FFC107" }}
          >
            <span className="text-2xl">🪙</span>
            <span className="text-xl font-black" style={{ color: "#e65100" }}>× 4</span>
          </div>
          {!isPremium && (
            <p className="text-xs mt-3" style={{ color: theme.textMuted }}>
              {t("goldBoost.adDesc")}
            </p>
          )}
        </div>

        {/* 버튼 */}
        <div className="px-5 pb-6 pt-2 flex flex-col gap-2">
          {isPremium ? (
            <button
              onClick={() => onBoost(4)}
              className="w-full py-4 rounded-2xl font-black text-sm tracking-widest shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
              style={{ background: "#FFC107", color: "#5D2E0C" }}
            >
              {t("goldBoost.ctaPremium")}
            </button>
          ) : (
            <button
              onClick={handleWatchAd}
              disabled={watching}
              className="w-full py-4 rounded-2xl font-black text-sm tracking-widest transition-all duration-200"
              style={watching
                ? { background: theme.panelColor, color: theme.textMuted, cursor: "not-allowed" }
                : { background: "#FFC107", color: "#5D2E0C", boxShadow: "0 4px 12px rgba(255,193,7,0.4)" }
              }
            >
              {watching ? t("goldBoost.watching") : t("goldBoost.ctaFree")}
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-sm transition-colors"
            style={{ color: theme.textMuted }}
          >
            {t("goldBoost.later")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
