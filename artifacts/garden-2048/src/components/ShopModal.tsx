/* ============================================================
 * ShopModal.tsx
 * 상점 모달 컴포넌트
 *
 * 기능:
 *  - 아이템 목록 표시 (소모품 / 해금 아이템)
 *  - 코인 잔액 표시
 *  - 구매 버튼 (코인 부족 시 비활성화)
 *  - 소모품 인벤토리 보유 수량 표시
 *  - 보유 소모품 "게임 중 사용" 버튼
 * ============================================================ */

import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { SHOP_ITEMS, ShopItem, ShopItemId, Inventory } from "@/utils/shopData";
import { PlayerData } from "@/utils/playerData";

interface ShopModalProps {
  isOpen: boolean;
  player: PlayerData;
  inventory: Inventory;
  /** 게임 화면에서만 아이템 사용 가능 (홈 화면에서는 false) */
  inGame?: boolean;
  onClose: () => void;
  /** 구매 버튼 클릭 → Game에서 코인 차감 + 인벤토리 추가 처리 */
  onBuy: (item: ShopItem) => void;
  /** 사용 버튼 클릭 → Game에서 게임 액션 실행 */
  onUse: (itemId: ShopItemId) => void;
}

export function ShopModal({
  isOpen,
  player,
  inventory,
  inGame = false,
  onClose,
  onBuy,
  onUse,
}: ShopModalProps) {
  if (!isOpen) return null;

  const actionItems = SHOP_ITEMS.filter((i) => i.category === "action");
  const unlockItems = SHOP_ITEMS.filter((i) => i.category === "unlock");

  return createPortal(
    /* ── 오버레이 ───────────────────────────────────────── */
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85dvh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">

        {/* ── 헤더 ────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-board shrink-0">
          <div>
            <h2 className="text-lg font-display font-bold text-foreground">🛒 상점</h2>
            <p className="text-xs text-foreground/50 mt-0.5">코인으로 특별한 아이템을 구매해요</p>
          </div>
          <div className="flex items-center gap-3">
            {/* 코인 잔액 */}
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
              <span className="text-base">🪙</span>
              <span className="text-sm font-bold text-amber-600">
                {player.coins.toLocaleString()}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-board active:scale-95 transition-all text-foreground/50"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── 스크롤 영역 ─────────────────────────────── */}
        <div className="overflow-y-auto flex-1 px-6 py-4 flex flex-col gap-5">

          {/* ── 소모품 아이템 ─────────────────────────── */}
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-foreground/40 mb-3">
              게임 아이템
            </h3>
            <div className="flex flex-col gap-2">
              {actionItems.map((item) => (
                <ShopItemRow
                  key={item.id}
                  item={item}
                  coins={player.coins}
                  count={inventory[item.id] ?? 0}
                  inGame={inGame}
                  onBuy={onBuy}
                  onUse={onUse}
                />
              ))}
            </div>
          </section>

          {/* ── 해금 아이템 ───────────────────────────── */}
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-foreground/40 mb-3">
              해금 아이템
            </h3>
            <div className="flex flex-col gap-2">
              {unlockItems.map((item) => (
                <ShopItemRow
                  key={item.id}
                  item={item}
                  coins={player.coins}
                  count={inventory[item.id] ?? 0}
                  inGame={inGame}
                  onBuy={onBuy}
                  onUse={onUse}
                />
              ))}
            </div>
          </section>

          {/* 코인 획득 안내 */}
          <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 text-center">
            <p className="text-xs text-foreground/50 leading-relaxed">
              💡 게임을 플레이하고 레벨업하면 코인을 획득할 수 있어요!
            </p>
          </div>

        </div>

      </div>
    </div>,
    document.body
  );
}

/* ── 아이템 행 컴포넌트 ───────────────────────────────── */
interface ShopItemRowProps {
  item: ShopItem;
  coins: number;
  count: number;       /* 보유 수량 */
  inGame: boolean;
  onBuy: (item: ShopItem) => void;
  onUse: (itemId: ShopItemId) => void;
}

function ShopItemRow({ item, coins, count, inGame, onBuy, onUse }: ShopItemRowProps) {
  const canAfford  = coins >= item.cost;
  const isUnlocked = !item.consumable && count >= 1;

  return (
    <div className="flex items-center gap-3 bg-board/60 rounded-2xl p-3">
      {/* 이모지 */}
      <div className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shrink-0 shadow-sm text-xl">
        {item.emoji}
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-foreground leading-none">{item.name}</span>
          {/* 소모품 보유 수량 뱃지 */}
          {item.consumable && count > 0 && (
            <span className="text-[10px] font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
              ×{count}
            </span>
          )}
          {/* unlock 완료 뱃지 */}
          {isUnlocked && (
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full">
              보유중
            </span>
          )}
        </div>
        <p className="text-[11px] text-foreground/50 mt-0.5 leading-snug">{item.description}</p>
        {/* 비용 */}
        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs">🪙</span>
          <span className={`text-xs font-bold ${canAfford ? "text-amber-500" : "text-foreground/30"}`}>
            {item.cost.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex flex-col gap-1.5 shrink-0">
        {/* 구매 버튼 — unlock 아이템은 이미 보유 시 숨김 */}
        {!isUnlocked && (
          <button
            onClick={() => onBuy(item)}
            disabled={!canAfford}
            className={[
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
              canAfford
                ? "bg-primary text-white hover:bg-primary-hover active:scale-95 shadow-sm"
                : "bg-board text-foreground/30 cursor-not-allowed",
            ].join(" ")}
          >
            구매
          </button>
        )}
        {/* 사용 버튼 — 소모품 + 게임 중 + 보유 시 */}
        {item.consumable && inGame && count > 0 && (
          <button
            onClick={() => onUse(item.id)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 active:scale-95 transition-all"
          >
            사용
          </button>
        )}
      </div>
    </div>
  );
}
