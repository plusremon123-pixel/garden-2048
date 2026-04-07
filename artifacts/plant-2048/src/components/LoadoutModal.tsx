/* ============================================================
 * LoadoutModal.tsx
 * 게임 시작 전 스테이지 정보 + 카드 1개 + 아이템 2개 선택 (통합 모달)
 * ============================================================ */

import { useState } from "react";
import { createPortal } from "react-dom";
import { CARDS, LOADOUT_ITEMS, CardId, LoadoutItemId } from "@/utils/loadoutData";
import { useTranslation } from "@/i18n";
import { type StageConfig } from "@/utils/stageData";

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
}: LoadoutModalProps) {
  const { t } = useTranslation();
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
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">

        {/* ── 스테이지 정보 헤더 */}
        {stageLevel !== undefined && (
          <div className="relative px-4 pt-4 pb-3 bg-primary/6 rounded-t-3xl border-b border-primary/10">
            {onClose && (
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-foreground/8 hover:bg-foreground/14 active:scale-95 transition-all text-foreground/40 text-xs"
              >✕</button>
            )}
            <div className="flex items-center gap-3 pr-8">
              <div>
                <p className="text-xs font-bold tracking-widest uppercase text-foreground/35">STAGE</p>
                <p className="text-xl font-black text-foreground leading-none">{stageLevel}</p>
              </div>
              {status && (
                <span className={[
                  "text-xs font-bold px-2 py-0.5 rounded-full shrink-0",
                  status === "done"      ? "bg-emerald-100 text-emerald-600" :
                  status === "current"   ? "bg-amber-100 text-amber-600" :
                  status === "available" ? "bg-sky-100 text-sky-500" :
                  "bg-foreground/8 text-foreground/35",
                ].join(" ")}>
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
          <div className="px-4 pt-4 pb-2.5 border-b border-board flex items-center justify-between">
            <div>
              <h2 className="text-base font-display font-bold text-foreground">{t("loadout.title")}</h2>
              <p className="text-xs text-foreground/40 mt-0.5">
                {cardsUnlocked ? t("loadout.subtitleWithCard") : t("loadout.subtitleItemsOnly")}
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-foreground/8 hover:bg-foreground/14 active:scale-95 transition-all text-foreground/40 text-xs shrink-0"
              >✕</button>
            )}
          </div>
        )}

        {/* ── 본문 */}
        <div className="px-4 py-3 flex flex-col gap-3">

          {/* ── 카드 선택 */}
          {cardsUnlocked && (
            <section>
              <SectionLabel title={t("loadout.selectCard")} badge={t("loadout.cardCount")} done={selectedCard !== null} />

              {/* 기본 카드 */}
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {baseCards.map((card) => {
                  const selected = selectedCard === card.id;
                  return (
                    <div key={card.id} className="relative">
                      <button
                        onClick={() => onSelectCard(card.id)}
                        className={[
                          "w-full aspect-square flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 transition-all active:scale-95",
                          selected
                            ? "border-primary bg-primary/8 shadow-sm"
                            : "border-board bg-board/50 hover:border-foreground/20",
                        ].join(" ")}
                      >
                        <span className="text-2xl leading-none">{card.emoji}</span>
                        <span className={["text-sm font-bold leading-none text-center px-1", selected ? "text-primary" : "text-foreground/70"].join(" ")}>
                          {cardName(card.id)}
                        </span>
                      </button>
                      <button
                        onClick={() => showTooltipFor(card.id, cardDesc(card.id))}
                        className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-foreground/12 hover:bg-foreground/20 flex items-center justify-center text-[8px] font-bold text-foreground/35 transition-all"
                      >?</button>
                      {tooltip === card.id && (
                        <div className="absolute bottom-full right-0 mb-2 z-20 w-28 px-2 py-1.5 bg-foreground/90 text-white text-[10px] leading-snug rounded-xl text-center shadow-lg pointer-events-none">
                          {cardDesc(card.id)}
                          <div className="absolute top-full right-2.5 border-4 border-transparent border-t-foreground/90" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 프리미엄 카드 — 구독 시에만 표시 */}
              {isPremiumActive && (
                <div className="mt-2">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-500/70">{t("loadout.premiumLabel")}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {premiumCards.map((card) => {
                      const selected = selectedCard === card.id;
                      return (
                        <div key={card.id} className="relative">
                          <button
                            onClick={() => onSelectCard(card.id)}
                            className={[
                              "w-full aspect-square flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 transition-all active:scale-95",
                              selected ? "border-amber-400 bg-amber-50 shadow-sm" : "border-amber-200 bg-amber-50/50 hover:border-amber-300",
                            ].join(" ")}
                          >
                            <span className="text-2xl leading-none">{card.emoji}</span>
                            <span className={["text-sm font-bold leading-none text-center px-1", selected ? "text-amber-700" : "text-amber-600/80"].join(" ")}>
                              {cardName(card.id)}
                            </span>
                          </button>
                          <button
                            onClick={() => showTooltipFor(card.id, cardDesc(card.id))}
                            className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-amber-100 hover:bg-amber-200 flex items-center justify-center text-[8px] font-bold text-amber-400 transition-all"
                          >?</button>
                          {tooltip === card.id && (
                            <div className="absolute bottom-full right-0 mb-2 z-20 w-28 px-2 py-1.5 bg-foreground/90 text-white text-[10px] leading-snug rounded-xl text-center shadow-lg pointer-events-none">
                              {cardDesc(card.id)}
                              <div className="absolute top-full right-2.5 border-4 border-transparent border-t-foreground/90" />
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
            <SectionLabel title={t("loadout.selectItem")} badge={t("loadout.itemCount")} done={selectedItems[0] !== null && selectedItems[1] !== null} />
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              {LOADOUT_ITEMS.map((item) => {
                const selected = selectedItemSet.has(item.id);
                const slotIdx  = selectedItems.indexOf(item.id as LoadoutItemId);
                return (
                  <div key={item.id} className="relative">
                    <button
                      onClick={() => onToggleItem(item.id)}
                      className={[
                        "w-full aspect-square flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 transition-all active:scale-95",
                        selected
                          ? "border-emerald-400 bg-emerald-50 shadow-sm"
                          : "border-board bg-board/50 hover:border-foreground/20",
                      ].join(" ")}
                    >
                      <span className="text-2xl leading-none">{item.emoji}</span>
                      <span className={["text-sm font-bold leading-none text-center", selected ? "text-emerald-700" : "text-foreground/70"].join(" ")}>
                        {itemName(item.id)}
                      </span>
                      <span className={[
                        "text-xs font-semibold px-1.5 py-0.5 rounded-full",
                        selected ? "bg-emerald-100 text-emerald-600" : "bg-foreground/8 text-foreground/35",
                      ].join(" ")}>
                        {selected ? `Slot ${slotIdx + 1}` : `×${item.maxUses}`}
                      </span>
                    </button>
                    <button
                      onClick={() => showTooltipFor(item.id, itemDesc(item.id))}
                      className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-foreground/12 hover:bg-foreground/20 flex items-center justify-center text-[8px] font-bold text-foreground/35 transition-all"
                    >?</button>
                    {tooltip === item.id && (
                      <div className="absolute bottom-full right-0 mb-2 z-20 w-28 px-2 py-1.5 bg-foreground/90 text-white text-[10px] leading-snug rounded-xl text-center shadow-lg pointer-events-none">
                        {itemDesc(item.id)}
                        <div className="absolute top-full right-2.5 border-4 border-transparent border-t-foreground/90" />
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
            className={[
              "w-full py-3.5 rounded-2xl font-black text-sm tracking-widest transition-all duration-200",
              isReady
                ? "bg-primary text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
                : "bg-board text-foreground/25 cursor-not-allowed",
            ].join(" ")}
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
function SectionLabel({ title, badge, done }: { title: string; badge: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-bold uppercase tracking-wider text-foreground/40">{title}</span>
      <span className={[
        "text-xs font-bold px-2 py-0.5 rounded-full",
        done ? "bg-emerald-100 text-emerald-600" : "bg-foreground/8 text-foreground/35",
      ].join(" ")}>
        {badge}
      </span>
      {done && <span className="text-emerald-500 text-sm">✓</span>}
    </div>
  );
}
