/* ============================================================
 * PremiumPassModal.tsx
 * 프리미엄 패스 구독 팝업 — 계절 테마 지원
 * ============================================================ */

import { createPortal } from "react-dom";
import { useTranslation } from "@/i18n";
import type { Season } from "@/utils/seasonData";
import { SEASON_THEMES } from "@/utils/seasonTheme";

interface PremiumPassModalProps {
  isPostTrial?: boolean;
  onBuy:        () => void;
  onClose:      () => void;
  season?:      Season;
}

export function PremiumPassModal({ isPostTrial = false, onBuy, onClose, season = "spring" }: PremiumPassModalProps) {
  const { t } = useTranslation();
  const theme = SEASON_THEMES[season];

  const benefits = [
    { emoji: "🚫", textKey: "premium.removeAds" },
    { emoji: "💎", textKey: "premium.premiumCards" },
    { emoji: "🪙", textKey: "premium.doubleCoins" },
    { emoji: "🌟", textKey: "premium.autoGoldBoost" },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 duration-300 overflow-hidden"
        style={{ background: theme.popupBg }}
      >
        {/* 상단 배너 */}
        <div
          className="px-6 pt-6 pb-4 text-center"
          style={{ background: theme.panelColor }}
        >
          <div className="flex justify-center mb-2">
            <img src="/menu-subscribe.png" className="w-12 h-12 object-contain" alt="" draggable={false} />
          </div>
          <h2 className="text-lg font-black" style={{ color: theme.textPrimary }}>{t("premium.title")}</h2>
          {isPostTrial ? (
            <p className="text-xs mt-1" style={{ color: theme.textSecondary }}>{t("premium.freeTrialExpired")}</p>
          ) : (
            <p className="text-xs mt-1" style={{ color: theme.textSecondary }}>{t("premium.freeTrialCta")}</p>
          )}
        </div>

        {/* 혜택 목록 */}
        <div className="px-6 py-4 flex flex-col gap-2.5">
          {benefits.map(({ emoji, textKey }) => (
            <div key={textKey} className="flex items-center gap-3">
              <span className="text-lg shrink-0">{emoji}</span>
              <p className="text-sm" style={{ color: theme.textSecondary }}>{t(textKey)}</p>
            </div>
          ))}
        </div>

        {/* 가격 박스 */}
        <div
          className="mx-5 mb-3 rounded-2xl p-3 text-center"
          style={{ background: theme.panelColor, border: `1px solid ${theme.borderColor}60` }}
        >
          <p className="text-xl font-black" style={{ color: theme.btnPrimary }}>{t("premium.price")}</p>
          <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{t("premium.pricePer")}</p>
        </div>

        {/* 버튼 */}
        <div className="px-5 pb-6 pt-2 flex flex-col gap-2">
          <button
            onClick={onBuy}
            className="w-full py-4 rounded-2xl font-black text-sm tracking-widest shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
            style={{ background: theme.btnPrimary, color: theme.btnPrimaryText }}
          >
            {t("premium.continueUse")}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-sm transition-colors"
            style={{ color: theme.textMuted }}
          >
            {t("premium.later")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
