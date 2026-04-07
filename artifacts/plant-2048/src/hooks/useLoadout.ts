/* ============================================================
 * useLoadout.ts
 * 게임 시작 전 로드아웃 선택 + 런타임 사용 상태 관리 훅
 *
 * 단계 1 (선택):  selectedCard, selectedItems → isReady
 * 단계 2 (런타임): buildRuntime() 호출 후 runtime 상태로 전환
 * ============================================================ */

import { useState, useCallback } from "react";
import {
  CardId, LoadoutItemId,
  CARDS, LOADOUT_ITEMS,
} from "@/utils/loadoutData";

/* ── 런타임 타입 ─────────────────────────────────────────── */

export interface CardState {
  id:       CardId;
  usesLeft: number;
  isActive: boolean; // 타겟 선택 모드 중
}

export interface LoadoutItemState {
  id:       LoadoutItemId;
  usesLeft: number;
}

export interface LoadoutRuntime {
  card:            CardState | null;
  items:           [LoadoutItemState | null, LoadoutItemState | null];
  cloverTurnsLeft: number; // 클로버 버프 남은 턴
}

/* ── 훅 ──────────────────────────────────────────────────── */

export function useLoadout() {
  /* 선택 단계 */
  const [selectedCard,  setSelectedCard]  = useState<CardId | null>(null);
  const [selectedItems, setSelectedItems] = useState<
    [LoadoutItemId | null, LoadoutItemId | null]
  >([null, null]);

  /* 런타임 단계 */
  const [runtime, setRuntime] = useState<LoadoutRuntime>({
    card:            null,
    items:           [null, null],
    cloverTurnsLeft: 0,
  });

  /* 카드 1개 + 아이템 2개 모두 선택됐을 때 true */
  const isReady =
    selectedCard !== null &&
    selectedItems[0] !== null &&
    selectedItems[1] !== null;

  /* 아이템 2개만 선택됐을 때 true (카드 미해금 구간) */
  const isReadyItemsOnly =
    selectedItems[0] !== null &&
    selectedItems[1] !== null;

  /* ── 선택 단계 조작 ─────────────────────────────────────── */

  /** 아이템 토글 (최대 2개, 이미 선택 시 해제) */
  const toggleItem = useCallback((id: LoadoutItemId) => {
    setSelectedItems((prev) => {
      if (prev[0] === id) return [null, prev[1]];
      if (prev[1] === id) return [prev[0], null];
      if (prev[0] === null) return [id,   prev[1]];
      if (prev[1] === null) return [prev[0], id];
      return prev; // 두 슬롯이 모두 차있으면 무시
    });
  }, []);

  /** 카드 없이 아이템만으로 런타임 초기화 (카드 미해금 구간) */
  const buildRuntimeNoCard = useCallback(() => {
    if (!selectedItems[0] || !selectedItems[1]) return;
    const item0Def = LOADOUT_ITEMS.find((i) => i.id === selectedItems[0])!;
    const item1Def = LOADOUT_ITEMS.find((i) => i.id === selectedItems[1])!;
    setRuntime({
      card:  null,
      items: [
        { id: selectedItems[0], usesLeft: item0Def.maxUses },
        { id: selectedItems[1], usesLeft: item1Def.maxUses },
      ],
      cloverTurnsLeft: 0,
    });
  }, [selectedItems]);

  /** 선택 확정 → 런타임 초기화 (게임 시작 시 호출) */
  const buildRuntime = useCallback(() => {
    if (!selectedCard || !selectedItems[0] || !selectedItems[1]) return;

    const cardDef  = CARDS.find((c) => c.id === selectedCard)!;
    const item0Def = LOADOUT_ITEMS.find((i) => i.id === selectedItems[0])!;
    const item1Def = LOADOUT_ITEMS.find((i) => i.id === selectedItems[1])!;

    setRuntime({
      card:  { id: selectedCard, usesLeft: cardDef.maxUses,  isActive: false },
      items: [
        { id: selectedItems[0], usesLeft: item0Def.maxUses },
        { id: selectedItems[1], usesLeft: item1Def.maxUses },
      ],
      cloverTurnsLeft: 0,
    });
  }, [selectedCard, selectedItems]);

  /* ── 런타임 조작 ─────────────────────────────────────────── */

  /** 카드 타겟 선택 모드 토글 */
  const toggleCardActive = useCallback(() => {
    setRuntime((prev) => {
      if (!prev.card || prev.card.usesLeft <= 0) return prev;
      return { ...prev, card: { ...prev.card, isActive: !prev.card.isActive } };
    });
  }, []);

  /** 카드 사용 완료 (타겟 확정 후 호출) */
  const consumeCard = useCallback(() => {
    setRuntime((prev) => {
      if (!prev.card) return prev;
      return {
        ...prev,
        card: { ...prev.card, usesLeft: prev.card.usesLeft - 1, isActive: false },
      };
    });
  }, []);

  /** 클로버 즉시 발동 (turns 만큼 버프 추가, 스택 가능) */
  const activateClover = useCallback((turns: number) => {
    setRuntime((prev) => {
      if (!prev.card || prev.card.usesLeft <= 0) return prev;
      return {
        ...prev,
        card:            { ...prev.card, usesLeft: prev.card.usesLeft - 1, isActive: false },
        cloverTurnsLeft: prev.cloverTurnsLeft + turns,
      };
    });
  }, []);

  /** 이동 발생 시 클로버 버프 턴 감소 */
  const decrementClover = useCallback(() => {
    setRuntime((prev) => {
      if (prev.cloverTurnsLeft <= 0) return prev;
      return { ...prev, cloverTurnsLeft: prev.cloverTurnsLeft - 1 };
    });
  }, []);

  /** 아이템 소비 */
  const consumeItem = useCallback((idx: 0 | 1) => {
    setRuntime((prev) => {
      const item = prev.items[idx];
      if (!item || item.usesLeft <= 0) return prev;
      const newItems: [LoadoutItemState | null, LoadoutItemState | null] = [
        prev.items[0],
        prev.items[1],
      ];
      newItems[idx] = { ...item, usesLeft: item.usesLeft - 1 };
      return { ...prev, items: newItems };
    });
  }, []);

  return {
    /* 선택 단계 */
    selectedCard,  setSelectedCard,
    selectedItems, toggleItem,
    isReady, isReadyItemsOnly,
    buildRuntime, buildRuntimeNoCard,
    /* 런타임 단계 */
    runtime,
    toggleCardActive,
    consumeCard,
    activateClover,
    decrementClover,
    consumeItem,
  };
}
