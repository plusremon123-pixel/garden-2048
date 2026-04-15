/* ============================================================
 * ItemsModal.tsx
 * 아이템 보관함 팝업 — 계절 테마 지원
 * ============================================================ */

import { BaseModal } from "./BaseModal";
import { SHOP_ITEMS, type Inventory } from "@/utils/shopData";
import type { Season } from "@/utils/seasonData";
import { SEASON_THEMES } from "@/utils/seasonTheme";
import { useTranslation } from "@/i18n";

interface ItemsModalProps {
  inventory: Inventory;
  onClose:   () => void;
  season?:   Season;
}

export function ItemsModal({ inventory, onClose, season = "spring" }: ItemsModalProps) {
  const { t } = useTranslation();
  const theme = SEASON_THEMES[season];
  const consumableItems = SHOP_ITEMS.filter((i) => i.consumable);
  const totalCount = consumableItems.reduce(
    (sum, i) => sum + (inventory[i.id] ?? 0),
    0,
  );

  return (
    <BaseModal
      iconSrc="/menu-card.png"
      title={t("item.title")}
      onClose={onClose}
      season={season}
    >
      {/* ── 요약 카드 */}
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-4"
        style={{ background: theme.panelColor, border: `1px solid ${theme.borderColor}50` }}
      >
        <span className="text-2xl">🎒</span>
        <div className="flex-1">
          <p className="text-xs" style={{ color: theme.textMuted }}>{t("item.owned")}</p>
          <p className="text-base font-black" style={{ color: theme.btnPrimary }}>
            {t("item.total", { count: totalCount })}
          </p>
        </div>
        <p
          className="text-[10px] rounded-full px-2.5 py-1"
          style={{ color: theme.textMuted, background: theme.popupBg, border: `1px solid ${theme.borderColor}40` }}
        >
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
              className="rounded-2xl p-3.5 transition-all"
              style={{
                background: hasItem ? theme.panelColor : theme.panelColor + "60",
                border: `1px solid ${hasItem ? theme.borderColor + "60" : "transparent"}`,
              }}
            >
              <div className="flex items-center gap-3">
                {/* 아이콘 */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-all"
                  style={{
                    background: hasItem ? theme.btnPrimary + "20" : theme.borderColor + "30",
                    opacity: hasItem ? 1 : 0.5,
                  }}
                >
                  {item.emoji}
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p
                      className="text-sm font-bold"
                      style={{ color: hasItem ? theme.textPrimary : theme.textMuted }}
                    >
                      {item.name}
                    </p>
                    {hasItem && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: theme.btnPrimary + "20", color: theme.btnPrimary }}
                      >
                        ×{qty}
                      </span>
                    )}
                  </div>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: hasItem ? theme.textSecondary : theme.textMuted }}
                  >
                    {item.description}
                  </p>
                </div>

                {/* 수량 표시 (0일 때) */}
                {!hasItem && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                    style={{ background: theme.borderColor + "30", color: theme.textMuted }}
                  >
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
