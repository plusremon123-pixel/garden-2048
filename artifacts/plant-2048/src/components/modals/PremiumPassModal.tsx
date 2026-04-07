/* ============================================================
 * PremiumPassModal.tsx
 * 프리미엄 패스 구독 팝업
 * ============================================================ */

import { createPortal } from "react-dom";
import { useTranslation } from "@/i18n";

interface PremiumPassModalProps {
  isPostTrial?: boolean;
  onBuy:        () => void;
  onClose:      () => void;
}

export function PremiumPassModal({ isPostTrial = false, onBuy, onClose }: PremiumPassModalProps) {
  const { t } = useTranslation();

  const benefits = [
    { emoji: "🚫", textKey: "premium.removeAds" },
    { emoji: "💎", textKey: "premium.premiumCards" },
    { emoji: "🪙", textKey: "premium.doubleCoins" },
    { emoji: "🌟", textKey: "premium.autoGoldBoost" },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">

        {/* 상단 배너 */}
        <div className="px-6 pt-6 pb-4 text-center" style={{ background: "linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)" }}>
          <div className="text-4xl mb-2">💎</div>
          <h2 className="text-lg font-black text-amber-900">{t("premium.title")}</h2>
          {isPostTrial ? (
            <p className="text-xs text-amber-800/70 mt-1">{t("premium.freeTrialExpired")}</p>
          ) : (
            <p className="text-xs text-amber-800/70 mt-1">{t("premium.freeTrialCta")}</p>
          )}
        </div>

        {/* 혜택 목록 */}
        <div className="px-6 py-4 flex flex-col gap-2.5">
          {benefits.map(({ emoji, textKey }) => (
            <div key={textKey} className="flex items-center gap-3">
              <span className="text-lg shrink-0">{emoji}</span>
              <p className="text-sm text-foreground/75">{t(textKey)}</p>
            </div>
          ))}
        </div>

        {/* 가격 */}
        <div className="mx-5 mb-3 rounded-2xl bg-amber-50 border border-amber-200 p-3 text-center">
          <p className="text-xl font-black text-amber-700">{t("premium.price")}</p>
          <p className="text-xs text-amber-600/60 mt-0.5">{t("premium.pricePer")}</p>
        </div>

        {/* 버튼 */}
        <div className="px-5 pb-6 pt-2 flex flex-col gap-2">
          <button
            onClick={onBuy}
            className="w-full py-4 rounded-2xl font-black text-sm tracking-widest bg-amber-400 text-amber-900 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
          >
            {t("premium.continueUse")}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-sm text-foreground/40 hover:text-foreground/60 transition-colors"
          >
            {t("premium.later")}
          </button>
        </div>

      </div>
    </div>,
    document.body,
  );
}
