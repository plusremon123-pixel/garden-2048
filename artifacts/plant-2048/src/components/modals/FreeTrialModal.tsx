/* ============================================================
 * FreeTrialModal.tsx
 * 1일 무료 체험 안내 팝업
 * ============================================================ */

import { createPortal } from "react-dom";
import { useTranslation } from "@/i18n";

interface FreeTrialModalProps {
  onStart: () => void;
  onClose: () => void;
}

export function FreeTrialModal({ onStart, onClose }: FreeTrialModalProps) {
  const { t } = useTranslation();

  const benefits = [
    { emoji: "🚫", textKey: "premium.adRemove",     subKey: "premium.adRemoveSub" },
    { emoji: "💎", textKey: "premium.premiumCards",  subKey: "premium.premiumCardsSub" },
    { emoji: "🪙", textKey: "premium.doubleCoins",   subKey: "premium.doubleCoinsSub" },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">

        {/* 상단 그라디언트 배너 */}
        <div className="px-6 pt-6 pb-4 text-center" style={{ background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)" }}>
          <div className="text-4xl mb-2">🌿✨</div>
          <h2 className="text-lg font-black text-amber-900">{t("premium.freeTrial")}</h2>
          <p className="text-xs text-amber-700/70 mt-1">{t("premium.freeTrialSub")}</p>
        </div>

        {/* 혜택 목록 */}
        <div className="px-6 py-4 flex flex-col gap-2.5">
          {benefits.map(({ emoji, textKey, subKey }) => (
            <div key={textKey} className="flex items-start gap-3">
              <span className="text-xl mt-0.5 shrink-0">{emoji}</span>
              <div>
                <p className="text-sm font-bold text-foreground">{t(textKey)}</p>
                <p className="text-xs text-foreground/45 mt-0.5">{t(subKey)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 체험 종료 안내 */}
        <p className="text-[10px] text-foreground/35 text-center px-6 pb-2">
          {t("premium.trialDisclaimer")}
        </p>

        {/* 버튼 영역 */}
        <div className="px-5 pb-6 pt-2 flex flex-col gap-2">
          <button
            onClick={onStart}
            className="w-full py-4 rounded-2xl font-black text-sm tracking-widest bg-amber-400 text-amber-900 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
          >
            {t("premium.startTrial")}
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
