/* ============================================================
 * LoadoutModal.tsx
 * 게임 시작 전 스테이지 정보 + 카드 1개 + 아이템 2개 선택 (통합 모달)
 * ============================================================ */

import { useState } from "react";
import { createPortal } from "react-dom";
import { CARDS, LOADOUT_ITEMS, CardId, LoadoutItemId } from "@/utils/loadoutData";
import { useTranslation } from "@/i18n";
import { type StageConfig } from "@/utils/stageData";
import type { Season } from "@/utils/seasonData";
import { SEASON_THEMES, type SeasonTheme } from "@/utils/seasonTheme";

interface LoadoutModalProps {
  selectedCard:    CardId | null;
  selectedItems:   [LoadoutItemId | null, LoadoutItemId | null];
  isReady:         boolean;
  cardsUnlocked:   boolean;
  isPremiumActive?: boolean;
  stageLevel?:     number;
  stageConfig?:    StageConfig | null;
  clearedLevel?:   number;
  onSelectCard:    (id: CardId) => void;
  onToggleItem:    (id: LoadoutItemId) => void;
  onStart:         () => void;
  onClose?:        () => void;
  season?:         Season;
}

export function LoadoutModal({
  selectedCard,
  selectedItems,
  isReady,
  cardsUnlocked,
  isPremiumActive = false,
  stageLevel,
  stageConfig,
  clearedLevel = 0,
  onSelectCard,
  onToggleItem,
  onStart,
  onClose,
  season = "spring",
}: LoadoutModalProps) {
  const { t } = useTranslation();
  const theme = SEASON_THEMES[season];
  const [tooltip, setTooltip] = useState<string | null>(null);

  const selectedItemSet = new Set(selectedItems.filter(Boolean));
  const baseCards    = CARDS.filter((c) => !c.isPremium);
  const premiumCards = CARDS.filter((c) => c.isPremium);

  const cardName = (id: string) => t(`card.${id}`) || id;
  const cardDesc = (id: string) => t(`card.desc.${id}`) || "";
  const itemName = (id: string) => t(`item.${id}.name`) || id;
  const itemDesc = (id: string) => t(`item.${id}.desc`) || "";

  const showTooltipFor = (id: string, text: string) => {
    setTooltip(tooltip === id ? null : id);
    if (tooltip !== id) setTimeout(() => setTooltip(null), 2500);
  };

  /* 스테이지 상태 */
  const status = stageLevel !== undefined
    ? stageLevel <= clearedLevel        ? "done"
    : stageLevel === clearedLevel + 1   ? "current"
    : stageLevel === clearedLevel + 2   ? "available"
    : "locked"
    : undefined;

  const soilCount  = stageConfig?.initialTiles.filter((tile) => tile.tileType === "soil").length  ?? 0;
  const thornCount = stageConfig?.initialTiles.filter((tile) => tile.tileType === "thorn").length ?? 0;


  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="w-full max-w-sm rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
        style={{ background: theme.popupBg }}
      >

        {/* ── 스테이지 정보 헤더 */}
        {stageLevel !== undefined && (
          <div
            className="relative px-4 pt-4 pb-3 rounded-t-3xl"
            style={{ background: theme.panelColor, borderBottom: `1px solid ${theme.borderColor}50` }}
          >
            {onClose && (
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full active:scale-95 transition-all text-xs"
                style={{ background: theme.borderColor + "50", color: theme.textSecondary }}
              >✕</button>
            )}
            <div className="flex items-center gap-3 pr-8">
              <div>
                <p className="text-xs font-bold tracking-widest uppercase" style={{ color: theme.textMuted }}>STAGE</p>
                <p className="text-xl font-black leading-none" style={{ color: theme.textPrimary }}>{stageLevel}</p>
              </div>
              {status && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    background: theme.btnPrimary + "20",
                    color: theme.btnPrimary,
                  }}
                >
                  {status === "done" ? t("stage.cleared") :
                   status === "current" ? t("stage.challenging") :
                   status === "available" ? t("stage.unlocked") : t("stage.locked")}
                </span>
              )}
            </div>
          </div>
        )}

        {/* 헤더 (스테이지 정보 없을 때) */}
        {stageLevel === undefined && (
          <div
            className="px-4 pt-4 pb-2.5 flex items-center justify-between"
            style={{ borderBottom: `1px solid ${theme.borderColor}50` }}
          >
            <div>
              <h2 className="text-base font-display font-bold" style={{ color: theme.textPrimary }}>{t("loadout.title")}</h2>
              <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>
                {cardsUnlocked ? t("loadout.subtitleWithCard") : t("loadout.subtitleItemsOnly")}
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-full active:scale-95 transition-all text-xs shrink-0"
                style={{ background: theme.borderColor + "50", color: theme.textSecondary }}
              >✕</button>
            )}
          </div>
        )}

        {/* ── 본문 */}
        <div className="px-4 py-3 flex flex-col gap-3">

          {/* ── 카드 선택 */}
          {cardsUnlocked && (
            <section>
              <SectionLabel title={t("loadout.selectCard")} badge={t("loadout.cardCount")} done={selectedCard !== null} theme={theme} />

              {/* 기본 카드 */}
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {baseCards.map((card) => {
                  const selected = selectedCard === card.id;
                  return (
                    <div key={card.id} className="relative">
                      <button
                        onClick={() => onSelectCard(card.id)}
                        className="w-full aspect-square flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 transition-all active:scale-95"
                        style={selected
                          ? { borderColor: theme.btnPrimary, background: theme.btnPrimary + "15" }
                          : { borderColor: theme.borderColor, background: theme.panelColor }
                        }
                      >
                        <span className="text-2xl leading-none">{card.emoji}</span>
                        <span className="text-sm font-bold leading-none text-center px-1" style={{ color: selected ? theme.btnPrimary : theme.textSecondary }}>
                          {cardName(card.id)}
                        </span>
                      </button>
                      <button
                        onClick={() => showTooltipFor(card.id, cardDesc(card.id))}
                        className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold transition-all"
                        style={{ background: theme.borderColor + "50", color: theme.textMuted }}
                      >?</button>
                      {tooltip === card.id && (
                        <div className="absolute bottom-full right-0 mb-2 z-20 w-28 px-2 py-1.5 text-[10px] leading-snug rounded-xl text-center shadow-lg pointer-events-none"
                          style={{ background: theme.textPrimary, color: theme.popupBg }}
                        >
                          {cardDesc(card.id)}
                          <div className="absolute top-full right-2.5 border-4 border-transparent" style={{ borderTopColor: theme.textPrimary }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 프리미엄 카드 */}
              {isPremiumActive && (
                <div className="mt-2">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#d97706" }}>{t("loadout.premiumLabel")}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {premiumCards.map((card) => {
                      const selected = selectedCard === card.id;
                      return (
                        <div key={card.id} className="relative">
                          <button
                            onClick={() => onSelectCard(card.id)}
                            className="w-full aspect-square flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 transition-all active:scale-95"
                            style={selected
                              ? { borderColor: "#d97706", background: "#fef3c7" }
                              : { borderColor: "#fde68a", background: "#fffbeb" }
                            }
                          >
                            <span className="text-2xl leading-none">{card.emoji}</span>
                            <span className="text-sm font-bold leading-none text-center px-1" style={{ color: selected ? "#92400e" : "#b45309" }}>
                              {cardName(card.id)}
                            </span>
                          </button>
                          <button
                            onClick={() => showTooltipFor(card.id, cardDesc(card.id))}
                            className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold transition-all"
                            style={{ background: "#fde68a", color: "#b45309" }}
                          >?</button>
                          {tooltip === card.id && (
                            <div className="absolute bottom-full right-0 mb-2 z-20 w-28 px-2 py-1.5 text-[10px] leading-snug rounded-xl text-center shadow-lg pointer-events-none"
                              style={{ background: theme.textPrimary, color: theme.popupBg }}
                            >
                              {cardDesc(card.id)}
                              <div className="absolute top-full right-2.5 border-4 border-transparent" style={{ borderTopColor: theme.textPrimary }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ── 아이템 선택 */}
          <section>
            <SectionLabel title={t("loadout.selectItem")} badge={t("loadout.itemCount")} done={selectedItems[0] !== null && selectedItems[1] !== null} theme={theme} />
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              {LOADOUT_ITEMS.map((item) => {
                const selected = selectedItemSet.has(item.id);
                const slotIdx  = selectedItems.indexOf(item.id as LoadoutItemId);
                return (
                  <div key={item.id} className="relative">
                    <button
                      onClick={() => onToggleItem(item.id)}
                      className="w-full aspect-square flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 transition-all active:scale-95"
                      style={selected
                        ? { borderColor: theme.btnPrimary, background: theme.btnPrimary + "15" }
                        : { borderColor: theme.borderColor, background: theme.panelColor }
                      }
                    >
                      <span className="text-2xl leading-none">{item.emoji}</span>
                      <span className="text-sm font-bold leading-none text-center" style={{ color: selected ? theme.btnPrimary : theme.textSecondary }}>
                        {itemName(item.id)}
                      </span>
                      <span
                        className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                        style={selected
                          ? { background: theme.btnPrimary + "20", color: theme.btnPrimary }
                          : { background: theme.borderColor + "40", color: theme.textMuted }
                        }
                      >
                        {selected ? `Slot ${slotIdx + 1}` : `×${item.maxUses}`}
                      </span>
                    </button>
                    <button
                      onClick={() => showTooltipFor(item.id, itemDesc(item.id))}
                      className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold transition-all"
                      style={{ background: theme.borderColor + "50", color: theme.textMuted }}
                    >?</button>
                    {tooltip === item.id && (
                      <div className="absolute bottom-full right-0 mb-2 z-20 w-28 px-2 py-1.5 text-[10px] leading-snug rounded-xl text-center shadow-lg pointer-events-none"
                        style={{ background: theme.textPrimary, color: theme.popupBg }}
                      >
                        {itemDesc(item.id)}
                        <div className="absolute top-full right-2.5 border-4 border-transparent" style={{ borderTopColor: theme.textPrimary }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

        </div>

        {/* ── 시작 버튼 */}
        <div className="px-4 pb-5 pt-1 shrink-0">
          <button
            onClick={onStart}
            disabled={!isReady}
            className="w-full py-3.5 rounded-2xl font-black text-sm tracking-widest transition-all duration-200 active:scale-95"
            style={isReady
              ? { background: theme.btnPrimary, color: theme.btnPrimaryText, boxShadow: `0 4px 12px ${theme.btnPrimary}50` }
              : { background: theme.panelColor, color: theme.textMuted, cursor: "not-allowed" }
            }
          >
            {isReady ? t("loadout.startReady") : cardsUnlocked ? t("loadout.startNeedCard") : t("loadout.startNeedItem")}
          </button>
        </div>

      </div>
    </div>,
    document.body,
  );
}

/* ── 섹션 레이블 */
function SectionLabel({ title, badge, done, theme }: {
  title: string;
  badge: string;
  done: boolean;
  theme: SeasonTheme;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>{title}</span>
      <span
        className="text-xs font-bold px-2 py-0.5 rounded-full"
        style={done
          ? { background: theme.btnPrimary + "20", color: theme.btnPrimary }
          : { background: theme.borderColor + "40", color: theme.textMuted }
        }
      >
        {badge}
      </span>
      {done && <span className="text-sm" style={{ color: theme.btnPrimary }}>✓</span>}
    </div>
  );
}
