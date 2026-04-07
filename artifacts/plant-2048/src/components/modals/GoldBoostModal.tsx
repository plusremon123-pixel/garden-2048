/* ============================================================
 * GoldBoostModal.tsx
 * 골드 4배 구제 팝업
 * ============================================================ */

import { createPortal } from "react-dom";
import { watchAd } from "@/utils/adService";
import { useState } from "react";
import { useTranslation } from "@/i18n";

interface GoldBoostModalProps {
  isPremium:    boolean;
  onBoost:      (multiplier: number) => void;
  onClose:      () => void;
}

export function GoldBoostModal({ isPremium, onBoost, onClose }: GoldBoostModalProps) {
  const { t } = useTranslation();
  const [watching, setWatching] = useState(false);

  const handleWatchAd = async () => {
    setWatching(true);
    const success = await watchAd();
    setWatching(false);
    if (success) {
      onBoost(4);
    } else {
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">

        {/* 헤더 */}
        <div className="px-6 pt-6 pb-4 text-center" style={{ background: "linear-gradient(135deg, #fef9c3 0%, #fde047 100%)" }}>
          <div className="text-4xl mb-2">🪙✨</div>
          <h2 className="text-lg font-black text-yellow-900">
            {isPremium ? t("goldBoost.title") : t("goldBoost.titleStruggle")}
          </h2>
          <p className="text-xs text-yellow-800/60 mt-1">
            {isPremium
              ? t("goldBoost.descPremium")
              : t("goldBoost.descFree")}
          </p>
        </div>

        {/* 설명 */}
        <div className="px-6 py-5 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border-2 border-yellow-300 bg-yellow-50"
          >
            <span className="text-2xl">🪙</span>
            <span className="text-xl font-black text-yellow-700">× 4</span>
          </div>
          {!isPremium && (
            <p className="text-xs text-foreground/40 mt-3">
              {t("goldBoost.adDesc")}
            </p>
          )}
        </div>

        {/* 버튼 */}
        <div className="px-5 pb-6 pt-2 flex flex-col gap-2">
          {isPremium ? (
            <button
              onClick={() => onBoost(4)}
              className="w-full py-4 rounded-2xl font-black text-sm tracking-widest bg-yellow-400 text-yellow-900 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
            >
              {t("goldBoost.ctaPremium")}
            </button>
          ) : (
            <button
              onClick={handleWatchAd}
              disabled={watching}
              className={[
                "w-full py-4 rounded-2xl font-black text-sm tracking-widest transition-all duration-200",
                watching
                  ? "bg-board text-foreground/25 cursor-not-allowed"
                  : "bg-yellow-400 text-yellow-900 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95",
              ].join(" ")}
            >
              {watching ? t("goldBoost.watching") : t("goldBoost.ctaFree")}
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-sm text-foreground/40 hover:text-foreground/60 transition-colors"
          >
            {t("goldBoost.later")}
          </button>
        </div>

      </div>
    </div>,
    document.body,
  );
}
