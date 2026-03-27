/* ============================================================
 * LoadoutModal.tsx
 * 게임 시작 전 카드 1개 + 아이템 2개 선택 모달
 *
 * - 카드 영역: 3종 중 1개 선택
 * - 아이템 영역: 3종 중 2개 선택
 * - 시작 버튼: 카드 1 + 아이템 2 모두 선택 시 활성화
 * ============================================================ */

import { createPortal } from "react-dom";
import { CARDS, LOADOUT_ITEMS, CardId, LoadoutItemId } from "@/utils/loadoutData";

interface LoadoutModalProps {
  selectedCard:  CardId | null;
  selectedItems: [LoadoutItemId | null, LoadoutItemId | null];
  isReady:       boolean;
  onSelectCard:  (id: CardId) => void;
  onToggleItem:  (id: LoadoutItemId) => void;
  onStart:       () => void;
}

export function LoadoutModal({
  selectedCard,
  selectedItems,
  isReady,
  onSelectCard,
  onToggleItem,
  onStart,
}: LoadoutModalProps) {
  const selectedItemSet = new Set(selectedItems.filter(Boolean));

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[88dvh] animate-in slide-in-from-bottom-4 duration-300">

        {/* ── 헤더 ────────────────────────────────────────── */}
        <div className="px-6 pt-6 pb-3 border-b border-board shrink-0">
          <h2 className="text-lg font-display font-bold text-foreground">🌿 출발 준비</h2>
          <p className="text-xs text-foreground/45 mt-0.5">
            카드 1개와 아이템 2개를 선택하고 게임을 시작하세요
          </p>
        </div>

        {/* ── 스크롤 영역 ─────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-5">

          {/* ── 카드 선택 ──────────────────────────────────── */}
          <section>
            <SectionLabel
              title="카드 선택"
              badge="1개"
              done={selectedCard !== null}
            />
            <div className="grid grid-cols-3 gap-2 mt-2">
              {CARDS.map((card) => {
                const selected = selectedCard === card.id;
                return (
                  <button
                    key={card.id}
                    onClick={() => onSelectCard(card.id)}
                    className={[
                      "flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all active:scale-95",
                      selected
                        ? "border-primary bg-primary/8 shadow-sm"
                        : "border-board bg-board/50 hover:border-foreground/20",
                    ].join(" ")}
                  >
                    <span className="text-3xl leading-none">{card.emoji}</span>
                    <span className={[
                      "text-xs font-bold leading-tight",
                      selected ? "text-primary" : "text-foreground/70",
                    ].join(" ")}>
                      {card.name}
                    </span>
                    <span className="text-[10px] text-foreground/45 leading-tight text-center">
                      {card.description}
                    </span>
                    <span className={[
                      "text-[9px] font-semibold px-1.5 py-0.5 rounded-full",
                      selected
                        ? "bg-primary/15 text-primary"
                        : "bg-foreground/8 text-foreground/35",
                    ].join(" ")}>
                      ×{card.maxUses}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 선택한 카드 설명 */}
            {selectedCard && (() => {
              const card = CARDS.find((c) => c.id === selectedCard)!;
              return (
                <p className="mt-2 text-[11px] text-primary/70 bg-primary/6 rounded-xl px-3 py-2">
                  {card.emoji} {card.detail}
                </p>
              );
            })()}
          </section>

          {/* ── 아이템 선택 ────────────────────────────────── */}
          <section>
            <SectionLabel
              title="아이템 선택"
              badge="2개"
              done={selectedItems[0] !== null && selectedItems[1] !== null}
            />
            <div className="grid grid-cols-3 gap-2 mt-2">
              {LOADOUT_ITEMS.map((item) => {
                const selected = selectedItemSet.has(item.id);
                const slotIdx  = selectedItems.indexOf(item.id as LoadoutItemId);
                return (
                  <button
                    key={item.id}
                    onClick={() => onToggleItem(item.id)}
                    className={[
                      "flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all active:scale-95",
                      selected
                        ? "border-emerald-400 bg-emerald-50 shadow-sm"
                        : "border-board bg-board/50 hover:border-foreground/20",
                    ].join(" ")}
                  >
                    <span className="text-3xl leading-none">{item.emoji}</span>
                    <span className={[
                      "text-xs font-bold leading-tight",
                      selected ? "text-emerald-700" : "text-foreground/70",
                    ].join(" ")}>
                      {item.name}
                    </span>
                    <span className="text-[10px] text-foreground/45 leading-tight text-center">
                      {item.description}
                    </span>
                    <span className={[
                      "text-[9px] font-semibold px-1.5 py-0.5 rounded-full",
                      selected
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-foreground/8 text-foreground/35",
                    ].join(" ")}>
                      {selected ? `슬롯 ${slotIdx + 1}` : `×${item.maxUses}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

        </div>

        {/* ── 하단 버튼 ────────────────────────────────────── */}
        <div className="px-5 pb-6 pt-3 shrink-0 border-t border-board">
          {/* 선택 진행 상태 */}
          <div className="flex items-center justify-center gap-4 mb-3">
            <SelectionChip
              label="카드"
              done={selectedCard !== null}
              emoji={selectedCard ? CARDS.find((c) => c.id === selectedCard)!.emoji : undefined}
            />
            <span className="text-foreground/20 text-sm">+</span>
            <SelectionChip
              label="아이템 1"
              done={selectedItems[0] !== null}
              emoji={selectedItems[0] ? LOADOUT_ITEMS.find((i) => i.id === selectedItems[0])!.emoji : undefined}
            />
            <span className="text-foreground/20 text-sm">+</span>
            <SelectionChip
              label="아이템 2"
              done={selectedItems[1] !== null}
              emoji={selectedItems[1] ? LOADOUT_ITEMS.find((i) => i.id === selectedItems[1])!.emoji : undefined}
            />
          </div>

          <button
            onClick={onStart}
            disabled={!isReady}
            className={[
              "w-full py-4 rounded-2xl font-black text-base tracking-widest transition-all duration-200",
              isReady
                ? "bg-primary text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
                : "bg-board text-foreground/25 cursor-not-allowed",
            ].join(" ")}
          >
            {isReady ? "게임 시작 🌱" : "카드와 아이템을 선택하세요"}
          </button>
        </div>

      </div>
    </div>,
    document.body,
  );
}

/* ── 섹션 레이블 ─────────────────────────────────────────── */
function SectionLabel({
  title, badge, done,
}: { title: string; badge: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/40">
        {title}
      </span>
      <span className={[
        "text-[10px] font-bold px-2 py-0.5 rounded-full",
        done
          ? "bg-emerald-100 text-emerald-600"
          : "bg-foreground/8 text-foreground/35",
      ].join(" ")}>
        {badge}
      </span>
      {done && <span className="text-emerald-500 text-xs">✓</span>}
    </div>
  );
}

/* ── 선택 상태 칩 ────────────────────────────────────────── */
function SelectionChip({
  label, done, emoji,
}: { label: string; done: boolean; emoji?: string }) {
  return (
    <div className={[
      "flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl border transition-all",
      done
        ? "border-primary/30 bg-primary/6"
        : "border-foreground/10 bg-board/50",
    ].join(" ")}>
      <span className="text-base leading-none">
        {done && emoji ? emoji : "❓"}
      </span>
      <span className={[
        "text-[9px] font-semibold leading-none",
        done ? "text-primary" : "text-foreground/30",
      ].join(" ")}>
        {label}
      </span>
    </div>
  );
}
