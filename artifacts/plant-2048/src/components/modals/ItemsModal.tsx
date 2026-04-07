/* ============================================================
 * ItemsModal.tsx
 * 아이템 보관함 팝업 — 보유 아이템 현황 및 설명
 * (구매는 상점 팝업에서)
 * ============================================================ */

import { BaseModal } from "./BaseModal";
import { SHOP_ITEMS, type Inventory } from "@/utils/shopData";
import { useTranslation } from "@/i18n";

interface ItemsModalProps {
  inventory: Inventory;
  onClose:   () => void;
}

export function ItemsModal({ inventory, onClose }: ItemsModalProps) {
  const { t } = useTranslation();
  const consumableItems = SHOP_ITEMS.filter((i) => i.consumable);
  const totalCount = consumableItems.reduce(
    (sum, i) => sum + (inventory[i.id] ?? 0),
    0,
  );

  return (
    <BaseModal icon="🎒" iconSrc="/icons/icon-card.png" title={t("item.title")} onClose={onClose}>
      {/* ── 요약 카드 */}
      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 mb-4">
        <span className="text-2xl">🎒</span>
        <div className="flex-1">
          <p className="text-xs text-foreground/50">{t("item.owned")}</p>
          <p className="text-base font-black text-emerald-600">
            {t("item.total", { count: totalCount })}
          </p>
        </div>
        <p className="text-[10px] text-foreground/35 bg-white/70 rounded-full px-2.5 py-1 border border-foreground/6">
          {t("item.useDuring")}
        </p>
      </div>

      {/* ── 아이템 목록 */}
      <div className="flex flex-col gap-3 pb-2">
        {consumableItems.map((item) => {
          const qty     = inventory[item.id] ?? 0;
          const hasItem = qty > 0;

          return (
            <div
              key={item.id}
              className={[
                "rounded-2xl p-3.5 border transition-all",
                hasItem
                  ? "bg-white border-foreground/10 shadow-sm"
                  : "bg-foreground/3 border-transparent",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                {/* 아이콘 */}
                <div className={[
                  "w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-all",
                  hasItem ? "bg-primary/10" : "bg-foreground/8 opacity-35",
                ].join(" ")}>
                  {item.emoji}
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={[
                      "text-sm font-bold",
                      hasItem ? "text-foreground" : "text-foreground/30",
                    ].join(" ")}>
                      {item.name}
                    </p>
                    {hasItem && (
                      <span className="text-[10px] bg-primary/12 text-primary font-bold px-1.5 py-0.5 rounded-full">
                        ×{qty}
                      </span>
                    )}
                  </div>
                  <p className={[
                    "text-xs mt-0.5",
                    hasItem ? "text-foreground/50" : "text-foreground/25",
                  ].join(" ")}>
                    {item.description}
                  </p>
                </div>

                {/* 수량 표시 (0일 때) */}
                {!hasItem && (
                  <div className="w-8 h-8 rounded-full bg-foreground/8 flex items-center justify-center text-xs font-black text-foreground/20 flex-shrink-0">
                    ×0
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </BaseModal>
  );
}
