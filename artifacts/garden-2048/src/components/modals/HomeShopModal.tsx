/* ============================================================
 * HomeShopModal.tsx
 * 홈 화면 상점 — 풀페이지 팝업 · 계절 테마 지원
 * ============================================================ */

import { useState } from "react";
import { createPortal } from "react-dom";
import {
  SHOP_ITEMS,
  GOLD_SHOP_ITEMS,
  purchaseGoldPack,
  type ShopItemId,
  type Inventory,
} from "@/utils/shopData";
import type { PlayerData } from "@/utils/playerData";
import type { Season } from "@/utils/seasonData";
import { SEASON_THEMES, type SeasonTheme } from "@/utils/seasonTheme";
import { useTranslation } from "@/i18n";

interface HomeShopModalProps {
  player:            PlayerData;
  inventory:         Inventory;
  onBuyItem:         (id: ShopItemId, cost: number) => boolean;
  onEarnCoins?:      (amount: number) => void;
  onClose:           () => void;
  isPremiumActive?:  boolean;
  onOpenPremium?:    () => void;
  season?:           Season;
}

export function HomeShopModal({
  player, inventory, onBuyItem, onEarnCoins, onClose,
  isPremiumActive = false, onOpenPremium,
  season = "spring",
}: HomeShopModalProps) {
  const { t } = useTranslation();
  const theme = SEASON_THEMES[season];
  const [toast,      setToast]      = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const handleBuy = (id: ShopItemId, cost: number, name: string) => {
    if (player.coins < cost) { showToast(t("shop.notEnoughCoins")); return; }
    const ok = onBuyItem(id, cost);
    if (ok) showToast(t("shop.buyComplete", { name }));
    else    showToast(t("shop.purchaseFailed"));
  };

  const handleGoldPurchase = async (productId: string, amount: number) => {
    if (purchasing) return;
    setPurchasing(productId);
    try {
      const result = await purchaseGoldPack(productId);
      if (result.success && result.amount) {
        onEarnCoins?.(result.amount);
        showToast(t("shop.goldCharged", { amount: result.amount.toLocaleString() }));
      } else {
        showToast(t("shop.paymentFailed", { error: result.error ?? t("shop.purchaseFailed") }));
      }
    } catch {
      showToast(t("shop.paymentError"));
    } finally {
      setPurchasing(null);
    }
  };

  const toolItems = SHOP_ITEMS.filter((i) => i.consumable);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex flex-col animate-in slide-in-from-right duration-300"
      style={{ background: theme.popupBg }}
    >
      {/* ── 헤더 */}
      <div
        className="flex items-center px-5 pt-safe-top pt-4 pb-3 flex-shrink-0"
        style={{ borderBottom: `1px solid ${theme.borderColor}50` }}
      >
        <div className="flex items-center gap-2 flex-1">
          <img src="/menu-shop.png" className="w-6 h-6 object-contain" alt="" draggable={false} />
          <h2 className="text-base font-bold" style={{ color: theme.textPrimary }}>{t("shop.title")}</h2>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full active:scale-95 transition-all text-sm font-bold flex-shrink-0"
          style={{ background: theme.borderColor + "50", color: theme.textSecondary }}
        >
          ✕
        </button>
      </div>

      {/* ── 본문 */}
      <div className="flex-1 flex flex-col px-4 py-3 gap-3 min-h-0">

        {/* ── 보유 코인 */}
        <div className="flex items-center justify-between flex-shrink-0">
          <span className="text-xs font-semibold" style={{ color: theme.textMuted }}>{t("shop.ownedCoins")}</span>
          <div className="flex items-center gap-1.5 rounded-full px-3 py-1" style={{ background: "#fff8e1", border: "1px solid #ffe082" }}>
            <span className="text-sm">🪙</span>
            <span className="text-sm font-black" style={{ color: "#e65100" }}>{player.coins.toLocaleString()}</span>
          </div>
        </div>

        {/* ── 도구 섹션 */}
        <section className="flex-shrink-0">
          <SectionTitle emoji="🔧" label={t("shop.tools")} theme={theme} />
          <div className="flex flex-col gap-2 mt-2">
            {toolItems.map((item) => {
              const owned  = inventory[item.id] ?? 0;
              const canBuy = player.coins >= item.cost;
              const tName  = t(`item.${item.id}.name`);
              const tDesc  = t(`item.${item.id}.desc`);
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5"
                  style={{ background: theme.panelColor }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-sm"
                    style={{ background: theme.popupBg }}
                  >
                    {item.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold" style={{ color: theme.textPrimary }}>{tName}</p>
                      {owned > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: theme.btnPrimary + "20", color: theme.btnPrimary }}>
                          {t("common.ownedCount", { count: owned })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-snug" style={{ color: theme.textMuted }}>{tDesc}</p>
                  </div>
                  <button
                    onClick={() => handleBuy(item.id, item.cost, tName)}
                    disabled={!canBuy}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 flex-shrink-0"
                    style={canBuy
                      ? { background: "#FFC107", color: "#5D2E0C" }
                      : { background: theme.borderColor + "40", color: theme.textMuted, cursor: "not-allowed" }
                    }
                  >
                    🪙{item.cost.toLocaleString()}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* 구분선 */}
        <div className="h-px flex-shrink-0" style={{ background: theme.borderColor + "50" }} />

        {/* ── 골드 구매 섹션 */}
        <section className="flex-shrink-0">
          <SectionTitle emoji="🪙" label={t("shop.goldPurchase")} theme={theme} />
          <div className="grid grid-cols-4 gap-2 mt-2">
            {GOLD_SHOP_ITEMS.map((item) => {
              const isBuying = purchasing === item.id;
              const isBest   = item.badge === "베스트" || item.badge === "추천";
              return (
                <button
                  key={item.id}
                  onClick={() => handleGoldPurchase(item.id, item.amount)}
                  disabled={!!purchasing}
                  className="relative flex flex-col items-center justify-center gap-1 rounded-2xl py-3 border-2 transition-all active:scale-95"
                  style={isBest
                    ? { background: "#fff8e1", borderColor: "#FFC107" }
                    : { background: theme.panelColor, borderColor: theme.borderColor + "60" }
                  }
                >
                  {item.badge && (
                    <span className={[
                      "absolute -top-2 -right-1 text-[9px] font-black px-1.5 py-0.5 rounded-full text-white",
                      isBest ? "bg-amber-500" : "bg-emerald-500",
                    ].join(" ")}>
                      {item.badge}
                    </span>
                  )}
                  {isBuying ? (
                    <svg className="animate-spin w-5 h-5" style={{ color: "#FFC107" }} fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  ) : (
                    <span className="text-xl leading-none">🪙</span>
                  )}
                  <p className="text-xs font-black leading-tight" style={{ color: isBest ? "#e65100" : theme.textSecondary }}>
                    {item.amount.toLocaleString()}
                  </p>
                  <p className="text-[10px] leading-tight" style={{ color: theme.textMuted }}>{item.priceLabel}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── 구독 배너 */}
        <section className="flex-1 flex flex-col pb-safe-bottom pb-2 min-h-0">
          <button
            onClick={() => { onClose(); onOpenPremium?.(); }}
            className="flex-1 w-full rounded-2xl px-4 flex items-center gap-3 transition-all active:scale-[0.98] border-2"
            style={isPremiumActive
              ? { background: "#fff8e1", borderColor: "#FFC107" }
              : { background: "linear-gradient(135deg, #fff8e1, #ffe082)", borderColor: "#FFC107" }
            }
          >
            <span className="text-2xl flex-shrink-0">{isPremiumActive ? "💎" : "✨"}</span>
            <div className="flex-1 text-left">
              <p className="text-sm font-black" style={{ color: "#5D2E0C" }}>
                {isPremiumActive ? t("shop.premiumActive") : t("shop.premiumPass")}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#8D4A1A" }}>
                {isPremiumActive ? t("shop.premiumBenefits") : t("shop.premiumBenefitsFull")}
              </p>
            </div>
            {!isPremiumActive && (
              <span className="text-xs font-black px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: "#FFC107", color: "#5D2E0C" }}>
                {t("common.subscribe")}
              </span>
            )}
          </button>
        </section>

      </div>

      {/* ── 토스트 */}
      {toast && (
        <div
          className="fixed bottom-28 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-2.5 rounded-full shadow-xl z-[300] whitespace-nowrap animate-modal-slide-up"
          style={{ background: theme.textPrimary, color: theme.popupBg }}
        >
          {toast}
        </div>
      )}
    </div>,
    document.body,
  );
}

/* ── 섹션 타이틀 */
function SectionTitle({ emoji, label, theme }: {
  emoji: string;
  label: string;
  theme: SeasonTheme;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm">{emoji}</span>
      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: theme.borderColor + "50" }} />
    </div>
  );
}
