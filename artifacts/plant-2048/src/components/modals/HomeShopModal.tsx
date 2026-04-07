/* ============================================================
 * HomeShopModal.tsx
 * 홈 화면 상점 — 풀페이지 팝업
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
import { useTranslation } from "@/i18n";

interface HomeShopModalProps {
  player:            PlayerData;
  inventory:         Inventory;
  onBuyItem:         (id: ShopItemId, cost: number) => boolean;
  onEarnCoins?:      (amount: number) => void;
  onClose:           () => void;
  isPremiumActive?:  boolean;
  onOpenPremium?:    () => void;
}

export function HomeShopModal({
  player, inventory, onBuyItem, onEarnCoins, onClose,
  isPremiumActive = false, onOpenPremium,
}: HomeShopModalProps) {
  const { t } = useTranslation();
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
    <div className="fixed inset-0 z-[200] flex flex-col bg-white animate-in slide-in-from-right duration-300">

      {/* ── 헤더 ─────────────────────────────────────────────── */}
      <div className="flex items-center px-5 pt-safe-top pt-4 pb-3 border-b border-foreground/8 flex-shrink-0">
        <div className="flex items-center gap-2 flex-1">
          <img src="/icons/icon-shop.png" className="w-6 h-6 object-contain" alt="" draggable={false} />
          <h2 className="text-base font-bold text-foreground">{t("shop.title")}</h2>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-foreground/8 hover:bg-foreground/14 active:scale-95 transition-all text-foreground/50 text-sm font-bold flex-shrink-0"
        >
          ✕
        </button>
      </div>

      {/* ── 본문: flex-1, 스크롤 없음 ──────────────────────── */}
      <div className="flex-1 flex flex-col px-4 py-3 gap-3 min-h-0">

        {/* ── 보유 코인 한 줄 표시 ──────────────────────────── */}
        <div className="flex items-center justify-between flex-shrink-0">
          <span className="text-xs font-semibold text-foreground/50">{t("shop.ownedCoins")}</span>
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
            <span className="text-sm">🪙</span>
            <span className="text-sm font-black text-amber-600">{player.coins.toLocaleString()}</span>
          </div>
        </div>

        {/* ── 도구 섹션 ─────────────────────────────────────── */}
        <section className="flex-shrink-0">
          <SectionTitle emoji="🔧" label={t("shop.tools")} />
          <div className="flex flex-col gap-2 mt-2">
            {toolItems.map((item) => {
              const owned  = inventory[item.id] ?? 0;
              const canBuy = player.coins >= item.cost;
              const tName  = t(`item.${item.id}.name`);
              const tDesc  = t(`item.${item.id}.desc`);
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 bg-board/40 rounded-2xl px-3 py-2.5"
                >
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
                    {item.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-foreground">{tName}</p>
                      {owned > 0 && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-600 font-bold px-1.5 py-0.5 rounded-full">
                          {t("common.ownedCount", { count: owned })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-foreground/40 leading-snug">{tDesc}</p>
                  </div>
                  <button
                    onClick={() => handleBuy(item.id, item.cost, tName)}
                    disabled={!canBuy}
                    className={[
                      "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 flex-shrink-0",
                      canBuy
                        ? "bg-amber-400 hover:bg-amber-500 text-white shadow-sm"
                        : "bg-foreground/8 text-foreground/25 cursor-not-allowed",
                    ].join(" ")}
                  >
                    🪙{item.cost.toLocaleString()}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* 구분선 */}
        <div className="h-px bg-foreground/8 flex-shrink-0" />

        {/* ── 골드 구매 섹션 ────────────────────────────────── */}
        <section className="flex-shrink-0">
          <SectionTitle emoji="🪙" label={t("shop.goldPurchase")} />
          <div className="grid grid-cols-4 gap-2 mt-2">
            {GOLD_SHOP_ITEMS.map((item) => {
              const isBuying = purchasing === item.id;
              const isBest   = item.badge === "베스트" || item.badge === "추천";
              return (
                <button
                  key={item.id}
                  onClick={() => handleGoldPurchase(item.id, item.amount)}
                  disabled={!!purchasing}
                  className={[
                    "relative flex flex-col items-center justify-center gap-1 rounded-2xl py-3 border-2 transition-all active:scale-95",
                    isBest
                      ? "bg-amber-50 border-amber-300"
                      : "bg-board/40 border-foreground/10 hover:border-foreground/20",
                    !!purchasing && !isBuying ? "opacity-50" : "",
                  ].join(" ")}
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
                    <svg className="animate-spin w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  ) : (
                    <span className="text-xl leading-none">🪙</span>
                  )}
                  <p className={[
                    "text-xs font-black leading-tight",
                    isBest ? "text-amber-600" : "text-foreground/70",
                  ].join(" ")}>
                    {item.amount.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-foreground/40 leading-tight">{item.priceLabel}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── 구독 배너 (남은 공간 전체 차지) ──────────────── */}
        <section className="flex-1 flex flex-col pb-safe-bottom pb-2 min-h-0">
          <button
            onClick={() => { onClose(); onOpenPremium?.(); }}
            className={[
              "flex-1 w-full rounded-2xl px-4 flex items-center gap-3 transition-all active:scale-[0.98] border-2",
              isPremiumActive
                ? "bg-amber-50 border-amber-300"
                : "border-amber-300",
            ].join(" ")}
            style={isPremiumActive ? {} : { background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}
          >
            <span className="text-2xl flex-shrink-0">{isPremiumActive ? "💎" : "✨"}</span>
            <div className="flex-1 text-left">
              <p className="text-sm font-black text-amber-900">
                {isPremiumActive ? t("shop.premiumActive") : t("shop.premiumPass")}
              </p>
              <p className="text-xs text-amber-700/60 mt-0.5">
                {isPremiumActive
                  ? t("shop.premiumBenefits")
                  : t("shop.premiumBenefitsFull")}
              </p>
            </div>
            {!isPremiumActive && (
              <span className="text-xs font-black text-amber-700 bg-amber-300 px-2.5 py-1 rounded-full flex-shrink-0">
                {t("common.subscribe")}
              </span>
            )}
          </button>
        </section>

      </div>

      {/* ── 토스트 ───────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-bold px-4 py-2.5 rounded-full shadow-xl z-[300] whitespace-nowrap animate-modal-slide-up">
          {toast}
        </div>
      )}
    </div>,
    document.body,
  );
}

/* ── 섹션 타이틀 ──────────────────────────────────────────── */
function SectionTitle({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm">{emoji}</span>
      <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-px bg-foreground/8" />
    </div>
  );
}
