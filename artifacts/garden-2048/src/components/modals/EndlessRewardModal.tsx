/* ============================================================
 * EndlessRewardModal.tsx
 * 무한 모드 단계 달성 보상 팝업
 *
 * - 1/2단계: 골드 지급
 * - 3단계: 골드 2배 + 광고 시청 시 랜덤 아이템
 * ============================================================ */

import { useState }        from "react";
import { createPortal }    from "react-dom";
import { useTranslation }  from "@/i18n";
import { watchAd }         from "@/utils/adService";
import type { ShopItemId } from "@/utils/shopData";
import type { EndlessDifficulty, EndlessConfig } from "@/utils/endlessModeData";
import { getRandomEndlessItem } from "@/utils/endlessModeData";

interface EndlessRewardModalProps {
  phase:      1 | 2 | 3;
  config:     EndlessConfig;
  onClaim:    (gold: number) => void;
  onClaimWithItem: (gold: number, itemId: ShopItemId) => void;
}

export function EndlessRewardModal({
  phase, config, onClaim, onClaimWithItem,
}: EndlessRewardModalProps) {
  const { t }            = useTranslation();
  const [adState, setAdState] = useState<"idle" | "watching" | "done">("idle");

  const gold        = phase === 3 ? config.goldRewards[2] * 2 : config.goldRewards[phase - 1];
  const isFinalPhase = phase === 3;

  const handleWatchAd = async () => {
    setAdState("watching");
    const ok = await watchAd();
    if (ok) {
      const item = getRandomEndlessItem(config);
      setAdState("done");
      setTimeout(() => onClaimWithItem(gold, item), 300);
    } else {
      setAdState("idle");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-[360px] mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden animate-modal-slide-up">

        {/* 헤더 */}
        <div className="bg-gradient-to-br from-amber-400 to-yellow-500 px-5 pt-6 pb-4 text-center">
          <div className="text-4xl mb-2">
            {phase === 3 ? "🏆" : phase === 2 ? "🎖️" : "🎉"}
          </div>
          <h2 className="text-lg font-black text-white">
            {t("endless.phase", { n: phase })} {t("endless.achieved")}
          </h2>
          <p className="text-sm text-white/80 mt-0.5">
            {config.goals[phase - 1].toLocaleString()} {t("endless.tileReached")}
          </p>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3">

          {/* 골드 보상 */}
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
            <span className="text-2xl">🪙</span>
            <div className="flex-1">
              <p className="text-xs text-foreground/50">{t("endless.goldReward")}</p>
              <p className="text-base font-black text-amber-600">+{gold.toLocaleString()}</p>
            </div>
            {isFinalPhase && (
              <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full">×2</span>
            )}
          </div>

          {/* 3단계: 광고로 아이템 획득 */}
          {isFinalPhase && (
            <div className="bg-primary/5 border border-primary/15 rounded-2xl px-4 py-3">
              <p className="text-xs text-foreground/50 mb-1">{t("endless.adItemHint")}</p>
              <p className="text-sm font-bold text-foreground">{t("endless.randomItem")}</p>
            </div>
          )}

          {/* 버튼 영역 */}
          <div className="flex gap-2 pt-1">
            {isFinalPhase && adState !== "done" && (
              <button
                onClick={handleWatchAd}
                disabled={adState === "watching"}
                className="flex-1 py-3 rounded-2xl bg-foreground/6 border border-foreground/10 text-sm font-bold text-foreground/55 active:scale-95 transition-all disabled:opacity-50"
              >
                {adState === "watching" ? t("endless.watching") : t("endless.watchAdItem")}
              </button>
            )}
            <button
              onClick={() => onClaim(gold)}
              className="flex-1 py-3 rounded-2xl bg-primary text-white text-sm font-bold shadow-sm active:scale-95 transition-all"
            >
              {t("endless.claimGold")}
            </button>
          </div>

        </div>
      </div>
    </div>,
    document.body,
  );
}
