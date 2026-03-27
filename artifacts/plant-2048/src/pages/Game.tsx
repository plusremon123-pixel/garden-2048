/* ============================================================
 * Game.tsx
 * 게임 화면 페이지 컴포넌트
 *
 * Props:
 *  - themeId:        현재 테마
 *  - player:         현재 플레이어 데이터 (XP 계산에 사용)
 *  - onEarnXp:       XP 지급 콜백 (App에서 전달)
 *  - onEarnCoins:    코인 추가 콜백 (App에서 전달)
 *  - onSpendCoins:   코인 차감 콜백 (App에서 전달)
 *  - onHome:         홈 화면으로 이동 콜백
 *  - updateMission:  미션 진행 업데이트 콜백 (App에서 전달)
 * ============================================================ */

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useGame } from "@/hooks/useGame";
import { useShop } from "@/hooks/useShop";
import { useLoadout, type LoadoutRuntime, type LoadoutItemState } from "@/hooks/useLoadout";
import { Board } from "@/components/Board";
import { Header } from "@/components/Header";
import { Modal } from "@/components/Modal";
import { GameEndModal } from "@/components/GameEndModal";
import { ShopModal } from "@/components/ShopModal";
import { LoadoutModal } from "@/components/LoadoutModal";
import { BackgroundLayer } from "@/components/BackgroundLayer";
import { PlayerData, getLevelGoal } from "@/utils/playerData";
import { ShopItem, ShopItemId, SHOP_ITEMS, type Inventory } from "@/utils/shopData";
import { CARDS, LOADOUT_ITEMS } from "@/utils/loadoutData";
import { ApplyXpResult } from "@/hooks/usePlayer";
import { MissionId, WeeklyMissionId } from "@/utils/missionData";
import {
  getCurrentWeekCategory,
  addDogamItem,
  loadDogamCollection,
  MAX_ITEM_COUNT,
  type DogamItem,
} from "@/utils/dogamData";
import {
  incrementGameCount,
  shouldShowInterstitialAd,
  markInterstitialAdShown,
} from "@/utils/adService";
import { recordGameScore } from "@/utils/rankingData";
import { getStageConfig } from "@/utils/stageData";

interface GameProps {
  themeId?:              string;   // 하위 호환 유지 (미사용)
  isActive?:             boolean;  // App에서 게임 화면이 보이는지 여부
  player:                PlayerData;
  onEarnXp:              (xp: number) => ApplyXpResult;
  onClearLevel:          () => void;
  onEarnCoins:           (coins: number) => void;
  onSpendCoins:          (amount: number) => boolean;
  onHome:                () => void;
  onThemeChange?:        (id: string) => void;  // 하위 호환 유지 (미사용)
  updateMission:         (id: MissionId, inc?: number) => void;
  updateWeeklyMission:   (id: WeeklyMissionId, inc?: number) => void;
}

export default function Game({
  isActive = true,
  player,
  onEarnXp,
  onClearLevel,
  onEarnCoins,
  onSpendCoins,
  onHome,
  updateMission,
  updateWeeklyMission,
}: GameProps) {
  /* ── 스테이지 설정 (없으면 일반 모드) ──────────────────── */
  const stageConfig = getStageConfig(player.clearedLevel + 1) ?? undefined;

  const {
    activeTiles,
    graveyard,
    score,
    bestScore,
    highestTile,
    hasLost,
    hasWon,
    showWinModal,
    canUndo,
    turnsLeft,
    maxTurns,
    moveCount,
    handleMove,
    resetGame,
    playOn,
    undoMove,
    removeTileById,
    spawnTileAt,
    boardClean,
    setScoreMultiplier,
  } = useGame(stageConfig);

  /* ── 로드아웃 상태 ───────────────────────────────────── */
  const {
    selectedCard, setSelectedCard,
    selectedItems, toggleItem,
    isReady, buildRuntime,
    runtime,
    toggleCardActive, consumeCard,
    activateClover, decrementClover,
    consumeItem,
  } = useLoadout();

  /* 게임 시작 전 로드아웃 선택 모달 */
  const [showLoadout, setShowLoadout] = useState(false);

  /* 게임 화면이 활성화될 때 런타임이 없으면 로드아웃 모달 표시 */
  useEffect(() => {
    if (isActive && runtime.card === null) {
      setShowLoadout(true);
    }
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  /* 로드아웃 확정 → 런타임 초기화 + 게임 시작 */
  const handleLoadoutStart = () => {
    buildRuntime();
    setShowLoadout(false);
  };

  /* ── 타겟 선택 콜백 상태 ─────────────────────────────── *
   * 타일 / 빈 칸 선택 시 실행할 콜백을 저장.
   * null이 아니면 해당 선택 모드가 활성화된 상태.
   * ──────────────────────────────────────────────────── */
  const [tileSelectCb, setTileSelectCb] = useState<((id: string) => void) | null>(null);
  const [emptyCellSelectCb, setEmptyCellSelectCb] = useState<((x: number, y: number) => void) | null>(null);

  /* ── 클로버: 이동마다 버프 턴 감소 ──────────────────────── */
  useEffect(() => {
    if (moveCount === 0) return;
    decrementClover();
  }, [moveCount]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── 클로버: 버프 만료 시 점수 배율 초기화 ──────────────── */
  useEffect(() => {
    setScoreMultiplier(runtime.cloverTurnsLeft > 0 ? 1.2 : 1.0);
  }, [runtime.cloverTurnsLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── 상점 상태 ───────────────────────────────────────── */
  const { inventory, addToInventory, useFromInventory } = useShop();
  const [showShop, setShowShop] = useState(false);

  /* ── 일반 모달 상태 ──────────────────────────────────── */
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showHomeConfirm,  setShowHomeConfirm]  = useState(false);

  /* ── 게임 종료 모달 상태 ─────────────────────────────── */
  const xpAwardedRef = useRef(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [endIsWin,  setEndIsWin]  = useState(false);
  const [endScore,  setEndScore]  = useState(0);
  const [endTile,   setEndTile]   = useState(0);
  const [playerSnapshot, setPlayerSnapshot] = useState<PlayerData>(player);

  /* ── 도감 드롭 추적 (판 단위 리셋) ──────────────────────── */
  const droppedItemsThisRunRef  = useRef<string[]>([]);
  const droppedCountThisRunRef  = useRef(0);
  const sessionDogamItemsRef    = useRef<DogamItem[]>([]); // 이번 판 수집 아이템 전체

  /* ── 광고 오버레이 상태 ───────────────────────────────── */
  const [showAdOverlay, setShowAdOverlay] = useState(false);

  const [dogamDrop, setDogamDrop] = useState<{
    item:     DogamItem;
    newCount: number;
  } | null>(null);
  const [dogamFillPct,       setDogamFillPct]       = useState(0);
  const [endSessionDogamItems, setEndSessionDogamItems] = useState<DogamItem[]>([]);

  /* ── 미션: 64 타일 달성 / 128 타일 달성 (중복 방지 ref) ── */
  const mission64ReportedRef  = useRef(false);
  const mission128ReportedRef = useRef(false);
  useEffect(() => {
    if (highestTile >= 64 && !mission64ReportedRef.current) {
      mission64ReportedRef.current = true;
      updateMission("reach_64");
    }
    if (highestTile >= 128 && !mission128ReportedRef.current) {
      mission128ReportedRef.current = true;
      updateMission("reach_128");
      updateWeeklyMission("tile_128x3");
    }
  }, [highestTile]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── 도감 드롭: 1000점마다 1개, 최대 5개 ───────────────── */
  useEffect(() => {
    // 1000점 단위로 드롭 수 계산
    const targetDropCount = Math.min(5, Math.floor(score / 1000));
    if (targetDropCount <= droppedCountThisRunRef.current) return;

    const category  = getCurrentWeekCategory();
    const remaining = category.items.filter(
      (it) => !droppedItemsThisRunRef.current.includes(it.id),
    );
    if (remaining.length === 0) {
      droppedCountThisRunRef.current++;
      return;
    }

    const picked = remaining[Math.floor(Math.random() * remaining.length)];
    droppedItemsThisRunRef.current = [...droppedItemsThisRunRef.current, picked.id];
    droppedCountThisRunRef.current++;

    const prevCount = loadDogamCollection()[picked.id] ?? 0;
    addDogamItem(picked.id);
    const newCount  = prevCount + 1;
    const prevPct   = Math.min(100, Math.round((prevCount / MAX_ITEM_COUNT) * 100));
    const newPct    = Math.min(100, Math.round((newCount  / MAX_ITEM_COUNT) * 100));

    sessionDogamItemsRef.current = [...sessionDogamItemsRef.current, picked];

    setDogamDrop({ item: picked, newCount });
    setDogamFillPct(prevPct);
    setTimeout(() => setDogamFillPct(newPct), 50);
    setTimeout(() => { setDogamDrop(null); setDogamFillPct(0); }, 2000);
  }, [score]); // eslint-disable-line react-hooks/exhaustive-deps

  /* hasLost / showWinModal 변화 감지 → 종료 모달 트리거 */
  useEffect(() => {
    if ((hasLost || showWinModal) && !xpAwardedRef.current && !showEndModal) {
      xpAwardedRef.current = true;
      setEndIsWin(showWinModal);
      setEndScore(score);
      setEndTile(highestTile);
      setPlayerSnapshot({ ...player });
      setEndSessionDogamItems([...sessionDogamItemsRef.current]);
      setShowEndModal(true);

      /* 미션: 3판 플레이 */
      updateMission("play_3");
    }
  }, [hasLost, showWinModal]); // eslint-disable-line react-hooks/exhaustive-deps

  const tilesList    = Object.values(activeTiles);
  const numberTiles  = tilesList.filter(
    (t) => t.tileType !== "soil" && t.tileType !== "thorn",
  );

  /* ── 카드 버튼 클릭 ──────────────────────────────────── */
  const handleCardClick = () => {
    const { card } = runtime;
    if (!card || card.usesLeft <= 0) return;

    if (card.isActive) {
      /* 취소 */
      toggleCardActive();
      setTileSelectCb(null);
      setEmptyCellSelectCb(null);
      return;
    }

    const cardDef = CARDS.find((c) => c.id === card.id)!;

    switch (cardDef.targetMode) {
      case "tile":
        toggleCardActive();
        setTileSelectCb(() => (tileId: string) => {
          removeTileById(tileId);
          consumeCard();
          updateMission("use_item");
          updateWeeklyMission("use_item_5");
        });
        break;
      case "empty":
        toggleCardActive();
        setEmptyCellSelectCb(() => (x: number, y: number) => {
          spawnTileAt(x, y);
          consumeCard();
          updateMission("use_item");
          updateWeeklyMission("use_item_5");
        });
        break;
      case "instant":
        activateClover(3);
        setScoreMultiplier(1.2);
        updateMission("use_item");
        updateWeeklyMission("use_item_5");
        break;
    }
  };

  /* ── 로드아웃 아이템 버튼 클릭 ───────────────────────── */
  const handleLoadoutItemClick = (idx: 0 | 1) => {
    const item = runtime.items[idx];
    if (!item || item.usesLeft <= 0) return;

    switch (item.id) {
      case "undo":
        if (!canUndo) return;
        undoMove();
        consumeItem(idx);
        updateMission("use_item");
        updateWeeklyMission("use_item_5");
        break;
      case "clean":
        if (numberTiles.length <= 4) return;
        boardClean();
        consumeItem(idx);
        updateMission("use_item");
        updateWeeklyMission("use_item_5");
        break;
      case "remove":
        setTileSelectCb(() => (tileId: string) => {
          removeTileById(tileId);
          consumeItem(idx);
          updateMission("use_item");
          updateWeeklyMission("use_item_5");
        });
        break;
    }
  };

  /* ── 게임 종료 모달 확인 ─────────────────────────────── */
  const handleEndConfirm = (
    earnedXp:    number,
    earnedCoins: number,
    action:      "reset" | "home"
  ) => {
    /* 스테이지 클리어 판정 */
    if (stageConfig) {
      /* 스테이지 모드: 목표 타일 달성 = 클리어 */
      if (endIsWin) onClearLevel();
    } else {
      /* 일반 모드: 점수 목표 달성 = 클리어 */
      if (endScore >= getLevelGoal(player.clearedLevel + 1)) onClearLevel();
    }

    /* XP 지급 → 레벨업 아이템 보상 처리 */
    const result = onEarnXp(earnedXp);
    for (const reward of result.rewards) {
      if (reward.type === "item") {
        addToInventory(reward.itemId as ShopItemId, reward.qty);
      }
    }

    /* 게임 코인 지급 */
    onEarnCoins(earnedCoins);

    /* 랭킹 점수 기록 (누적 + 최고점 갱신) */
    recordGameScore(endScore);

    /* 일일 미션: 500점 달성 */
    if (endScore >= 500) updateMission("score_500");

    /* 주간 미션: 판 완료 / 점수 달성 */
    updateWeeklyMission("play_10");
    if (endScore >= 5000) updateWeeklyMission("score_5000");

    /* 광고: 5판마다 1회 (첫 3판 제외) */
    const adCount = incrementGameCount();
    if (shouldShowInterstitialAd(adCount)) {
      markInterstitialAdShown();
      setShowAdOverlay(true);
      setTimeout(() => setShowAdOverlay(false), 2000);
    }

    setShowEndModal(false);
    xpAwardedRef.current           = false;
    mission64ReportedRef.current   = false;
    mission128ReportedRef.current  = false;
    droppedItemsThisRunRef.current  = [];
    droppedCountThisRunRef.current  = 0;
    sessionDogamItemsRef.current    = [];

    setTileSelectCb(null);
    setEmptyCellSelectCb(null);

    if (action === "reset") {
      buildRuntime(); // 같은 로드아웃으로 재시작
      resetGame();
    } else {
      resetGame();
      setShowLoadout(true); // 홈 → 다시 로드아웃 선택
      onHome();
    }
  };

  /* ── 새 게임 / 홈 버튼 처리 ──────────────────────────── */
  const handleResetRequest = () => {
    if (showEndModal) return;
    setShowResetConfirm(true);
  };

  const handleHomeRequest = () => {
    if (showEndModal) return;
    if (score > 0 && !hasLost && !showWinModal) {
      setShowHomeConfirm(true);
    } else {
      onHome();
    }
  };

  const confirmReset = () => {
    setShowResetConfirm(false);
    xpAwardedRef.current           = false;
    mission64ReportedRef.current   = false;
    mission128ReportedRef.current  = false;
    droppedItemsThisRunRef.current  = [];
    droppedCountThisRunRef.current  = 0;
    sessionDogamItemsRef.current    = [];
    setTileSelectCb(null);
    setEmptyCellSelectCb(null);
    buildRuntime(); // 같은 로드아웃으로 재시작
    resetGame();
  };

  const confirmHome = () => {
    setShowHomeConfirm(false);
    xpAwardedRef.current           = false;
    mission64ReportedRef.current   = false;
    mission128ReportedRef.current  = false;
    droppedItemsThisRunRef.current  = [];
    droppedCountThisRunRef.current  = 0;
    sessionDogamItemsRef.current    = [];
    setTileSelectCb(null);
    setEmptyCellSelectCb(null);
    setShowLoadout(true); // 홈 → 다시 로드아웃 선택
    resetGame();
    onHome();
  };

  /* ── 타일 선택 제거 상태 ─────────────────────────────── */
  const [selectingTile, setSelectingTile]           = useState(false);
  const [pendingRemoveTile, setPendingRemoveTile]   = useState<{ id: string; value: number } | null>(null);

  /* ── 인벤토리바 구매 확인 팝업 상태 (portal 렌더용) ───── */
  const [pendingBuy, setPendingBuy] = useState<ShopItem | null>(null);

  const handleConfirmBuy = () => {
    if (!pendingBuy) return;
    handleBuy(pendingBuy);
    setPendingBuy(null);
  };

  /* ── 상점: 구매 처리 ─────────────────────────────────── */
  const handleBuy = (item: ShopItem) => {
    const success = onSpendCoins(item.cost);
    if (!success) return;

    if (item.consumable) {
      addToInventory(item.id);
    } else {
      addToInventory(item.id, 1);
    }
  };

  /* ── 타일 선택 제거: 타일 클릭 시 확인 대기 ─────────── */
  const handleTileSelectClick = (tileId: string) => {
    const tile = (activeTiles as Record<string, { id: string; value: number }>)[tileId];
    if (!tile) return;
    setPendingRemoveTile({ id: tileId, value: tile.value });
  };

  const handleConfirmRemoveTile = () => {
    if (!pendingRemoveTile) return;
    const consumed = useFromInventory("remove_tile");
    if (consumed) {
      removeTileById(pendingRemoveTile.id);
      updateMission("use_item");
      updateWeeklyMission("use_item_5");
    }
    setPendingRemoveTile(null);
    setSelectingTile(false);
  };

  const handleCancelRemoveTile = () => {
    setPendingRemoveTile(null);
    setSelectingTile(false);
    /* 아이템 미소비 — 인벤토리 유지 */
  };

  /* ── 보드 이벤트 라우터 ───────────────────────────────── */

  /** 타일 클릭: 로드아웃 콜백 우선, 없으면 기존 상점 remove_tile 흐름 */
  const handleBoardTileClick = (tileId: string) => {
    if (tileSelectCb) {
      tileSelectCb(tileId);
      setTileSelectCb(null);
    } else if (selectingTile) {
      handleTileSelectClick(tileId);
    }
  };

  /** 빈 칸 클릭: 해바라기 카드 전용 */
  const handleBoardEmptyCellClick = (x: number, y: number) => {
    if (emptyCellSelectCb) {
      emptyCellSelectCb(x, y);
      setEmptyCellSelectCb(null);
    }
  };

  const boardTileSelectMode  = tileSelectCb !== null || selectingTile;
  const boardEmptyCellMode   = emptyCellSelectCb !== null;

  /* ── 상점: 아이템 사용 처리 ──────────────────────────── */
  const handleUseItem = (itemId: ShopItemId) => {
    if (itemId === "undo" && !canUndo) return;
    /* board_clean: 5개 이상일 때만 사용 가능 */
    if (itemId === "board_clean" && numberTiles.length <= 4) return;
    if (itemId === "remove_tile" && numberTiles.length === 0) return;

    /* remove_tile: 아이템 소비 없이 선택 모드 진입 */
    if (itemId === "remove_tile") {
      setSelectingTile(true);
      setShowShop(false);
      return;
    }

    const consumed = useFromInventory(itemId);
    if (!consumed) return;

    switch (itemId) {
      case "undo":        undoMove();   break;
      case "board_clean": boardClean(); break;
    }

    updateMission("use_item");
    updateWeeklyMission("use_item_5");
    setShowShop(false);
  };

  const gameContent = (
    <div className="relative min-h-[100dvh] w-full flex flex-col items-center bg-background overflow-hidden">

      {/* ── 배경 + 콘텐츠 영역 ─────────────────────────────── */}
      <div className="relative flex-1 w-full flex flex-col items-center overflow-hidden">

        <BackgroundLayer highestTile={highestTile} />

        <div className="relative z-10 w-full flex flex-col flex-1 items-center">
          {/* ── 상단 AD 배너 ────────────────────────────────── */}
          <div className="w-full h-10 bg-white/55 backdrop-blur-sm flex items-center justify-center text-[11px] font-medium text-foreground/25 flex-shrink-0">
            AD
          </div>

          <div className="w-full max-w-[500px] flex flex-col flex-1 px-4 pb-4">

            <Header
              score={score}
              bestScore={bestScore}
              player={player}
              onReset={handleResetRequest}
              onHome={handleHomeRequest}
              onShop={() => setShowShop(true)}
            />

            {/* ── 목표 점수 배너 ─────────────────────────────── */}
            <GoalBanner
              score={score}
              stageGoal={
                stageConfig
                  ? stageConfig.goal.targetValue
                  : getLevelGoal(player.clearedLevel + 1)
              }
              turnsLeft={stageConfig ? turnsLeft : undefined}
              maxTurns={stageConfig ? maxTurns : undefined}
              goalTile={stageConfig ? stageConfig.goal.targetValue : undefined}
            />

            <main className="w-full flex-1 flex flex-col justify-center relative">
              <Board
                tiles={tilesList}
                graveyard={graveyard}
                onSwipe={(dir) => {
                  /* 선택 모드 중 스와이프 → 선택 모드 취소 */
                  if (boardTileSelectMode) {
                    setSelectingTile(false);
                    setTileSelectCb(null);
                    return;
                  }
                  if (boardEmptyCellMode) {
                    setEmptyCellSelectCb(null);
                    return;
                  }
                  /* 이동 시 도감 오버레이 즉시 닫기 */
                  if (dogamDrop) { setDogamDrop(null); setDogamFillPct(0); }
                  handleMove(dir);
                }}
                themeId="plant"
                selectMode={boardTileSelectMode}
                onTileClick={handleBoardTileClick}
                emptyCellSelectMode={boardEmptyCellMode}
                onEmptyCellClick={handleBoardEmptyCellClick}
              />

              {/* ── 도감 획득 오버레이 (보드 중앙, 2초 or 이동 시 닫힘) ── */}
              {dogamDrop && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div
                    className="rounded-2xl px-8 py-5 flex flex-col items-center gap-2 animate-modal-slide-up"
                    style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
                  >
                    <span className="text-5xl">{dogamDrop.item.emoji}</span>
                    <p className="text-white font-bold text-sm mt-1">
                      📖 {dogamDrop.item.name} 수집!
                    </p>
                    <div className="flex items-center gap-2 w-36">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                        <div
                          className="h-full bg-emerald-400 rounded-full"
                          style={{
                            width: `${dogamFillPct}%`,
                            transition: "width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-white/70 font-bold shrink-0">
                        {dogamDrop.newCount}/{MAX_ITEM_COUNT}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </main>

            {/* ── 액션 바 (보드 아래) ──────────────────────────── */}
            <ActionBar
              runtime={runtime}
              inventory={inventory}
              player={player}
              canUndo={canUndo}
              hasSeedTiles={numberTiles.length > 4}
              hasTiles={numberTiles.length > 0}
              onCardClick={handleCardClick}
              onItemClick={handleLoadoutItemClick}
              onShopUse={handleUseItem}
              onRequestBuy={setPendingBuy}
            />

          </div>
        </div>
      </div>

      {/* ── 로드아웃 선택 모달 (게임 시작 전, 게임 화면이 활성일 때만) ── */}
      {showLoadout && isActive && (
        <LoadoutModal
          selectedCard={selectedCard}
          selectedItems={selectedItems}
          isReady={isReady}
          onSelectCard={setSelectedCard}
          onToggleItem={toggleItem}
          onStart={handleLoadoutStart}
        />
      )}

      {/* ── 모달 레이어 ──────────────────────────────────── */}

      <ShopModal
        isOpen={showShop}
        player={player}
        inventory={inventory}
        inGame={true}
        onClose={() => setShowShop(false)}
        onBuy={handleBuy}
        onUse={handleUseItem}
      />

      <GameEndModal
        isOpen={showEndModal}
        isWin={endIsWin}
        score={endScore}
        highestTile={endTile}
        player={playerSnapshot}
        collectedDogamItems={endSessionDogamItems}
        onConfirm={handleEndConfirm}
      />

      {/* 승리 후 계속 플레이 */}
      {!showEndModal && showWinModal && (
        <Modal
          isOpen={true}
          type="success"
          title="전설의 꽃이 피었어요!"
          description="계속 더 높은 타일에 도전해보세요!"
          primaryAction={{ label: "계속 플레이", onClick: playOn }}
          secondaryAction={{ label: "새 게임", onClick: resetGame }}
        />
      )}

      <Modal
        isOpen={showResetConfirm}
        type="info"
        title="새 게임 시작"
        description="진행 중인 게임이 초기화됩니다. 정말 다시 시작할까요?"
        primaryAction={{ label: "네, 다시 할래요", onClick: confirmReset }}
        secondaryAction={{ label: "취소", onClick: () => setShowResetConfirm(false) }}
      />

      <Modal
        isOpen={showHomeConfirm}
        type="info"
        title="홈으로 돌아가기"
        description="진행 중인 게임이 종료됩니다. 홈 화면으로 돌아갈까요?"
        primaryAction={{ label: "홈으로", onClick: confirmHome }}
        secondaryAction={{ label: "계속 플레이", onClick: () => setShowHomeConfirm(false) }}
      />

    </div>
  );

  /* ── Portal 레이어: transform 부모를 탈출하여 viewport 기준 렌더 ── */
  return (
    <>
      {gameContent}

      {/* ── 아이템 구매 확인 팝업 ─────────────────────────── */}
      {pendingBuy && createPortal(
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
          onClick={() => setPendingBuy(null)}
        >
          <div
            className="w-full max-w-[300px] bg-white rounded-3xl p-6 shadow-2xl animate-modal-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-3xl">
                {pendingBuy.emoji}
              </div>
            </div>
            <h3 className="text-base font-black text-foreground text-center mb-1">
              {pendingBuy.name} 구매
            </h3>
            <p className="text-xs text-foreground/45 text-center mb-1">
              {pendingBuy.description}
            </p>
            <p className="text-sm font-bold text-amber-600 text-center mb-5">
              🪙 {pendingBuy.cost.toLocaleString()} 코인
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPendingBuy(null)}
                className="flex-1 py-2.5 rounded-2xl bg-board text-foreground/60 font-bold text-sm hover:bg-cell active:scale-95 transition-all"
              >
                취소
              </button>
              <button
                onClick={handleConfirmBuy}
                className="flex-[2] py-2.5 rounded-2xl bg-primary text-white font-bold text-sm shadow-sm hover:bg-primary-hover active:scale-95 transition-all"
              >
                구매하기
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── 타일 삭제 확인 팝업 ───────────────────────────── */}
      {pendingRemoveTile && createPortal(
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
          onClick={handleCancelRemoveTile}
        >
          <div
            className="w-full max-w-[300px] bg-white rounded-3xl p-6 shadow-2xl animate-modal-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-3xl">
                🌿
              </div>
            </div>
            <h3 className="text-base font-black text-foreground text-center mb-1">
              타일 삭제
            </h3>
            <p className="text-xs text-foreground/45 text-center mb-5">
              값 <span className="font-bold text-foreground/70">{pendingRemoveTile.value}</span>인 타일을 삭제할까요?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleCancelRemoveTile}
                className="flex-1 py-2.5 rounded-2xl bg-board text-foreground/60 font-bold text-sm hover:bg-cell active:scale-95 transition-all"
              >
                취소
              </button>
              <button
                onClick={handleConfirmRemoveTile}
                className="flex-[2] py-2.5 rounded-2xl bg-red-500 text-white font-bold text-sm shadow-sm hover:bg-red-600 active:scale-95 transition-all"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── 인터스티셜 광고 오버레이 ──────────────────────── */}
      {showAdOverlay && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80">
          <div className="bg-white rounded-2xl px-12 py-8 text-center shadow-2xl">
            <p className="text-xs font-medium text-foreground/30 mb-1">광고</p>
            <p className="text-2xl font-black text-foreground/20">AD</p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

/* ============================================================
 * ActionBar
 * 하단 4-슬롯 액션 바
 *
 * [상점 Undo] | [로드아웃 카드] | [로드아웃 아이템 0] | [로드아웃 아이템 1]
 *
 * - 상점 Undo: 기존 인벤토리 구매/사용 (하위 호환 유지)
 * - 카드 슬롯: 선택한 로드아웃 카드, 남은 사용 횟수
 * - 아이템 슬롯 0/1: 선택한 로드아웃 아이템
 * ============================================================ */
interface ActionBarProps {
  runtime:      LoadoutRuntime;
  inventory:    Inventory;
  player:       PlayerData;
  canUndo:      boolean;
  hasSeedTiles: boolean;
  hasTiles:     boolean;
  onCardClick:  () => void;
  onItemClick:  (idx: 0 | 1) => void;
  onShopUse:    (itemId: ShopItemId) => void;
  onRequestBuy: (item: ShopItem) => void;
}

function ActionBar({
  runtime, inventory, player, canUndo, hasSeedTiles, hasTiles,
  onCardClick, onItemClick, onShopUse, onRequestBuy,
}: ActionBarProps) {
  const undoShopItem  = SHOP_ITEMS.find((i) => i.id === "undo")!;
  const undoCount     = inventory["undo"] ?? 0;
  const undoCanAfford = player.coins >= undoShopItem.cost;
  const undoBlocked   = undoCount > 0 && !canUndo;
  const undoActive    = undoCount > 0 && !undoBlocked;

  const { card, items, cloverTurnsLeft } = runtime;

  /* 카드 버튼 상태 */
  const cardDef      = card ? CARDS.find((c) => c.id === card.id) : null;
  const cardExhausted = !card || card.usesLeft <= 0;

  return (
    <div className="mb-3 px-1">
      {/* 클로버 버프 배너 */}
      {cloverTurnsLeft > 0 && (
        <div className="flex items-center justify-center gap-1.5 mb-2 py-1 rounded-xl bg-emerald-50 border border-emerald-200">
          <span className="text-sm">🍀</span>
          <span className="text-xs font-bold text-emerald-600">
            점수 +20% 활성 중
          </span>
          <span className="text-xs text-emerald-500 font-semibold">
            ({cloverTurnsLeft}턴 남음)
          </span>
        </div>
      )}

      <div className="flex items-stretch">
        {/* ── 슬롯 1: 상점 되돌리기 ─────────────────────── */}
        <div className="flex items-center flex-1">
          <button
            onClick={() => {
              if (undoActive) { onShopUse("undo"); return; }
              if (undoCount === 0 && undoCanAfford) { onRequestBuy(undoShopItem); return; }
            }}
            disabled={undoBlocked || (undoCount === 0 && !undoCanAfford)}
            title={undoBlocked ? "되돌릴 이동이 없습니다" : undefined}
            className={[
              "flex flex-col items-center gap-0.5 flex-1 py-2 px-1 transition-all active:scale-95",
              undoActive ? "opacity-100 hover:opacity-80"
              : undoBlocked ? "opacity-25 cursor-not-allowed"
              : undoCount === 0 && undoCanAfford ? "opacity-70 hover:opacity-90"
              : "opacity-30 cursor-not-allowed",
            ].join(" ")}
          >
            <span className="text-2xl leading-none">{undoShopItem.emoji}</span>
            <span className="text-[11px] font-semibold text-foreground/70 leading-tight">
              되돌리기
            </span>
            {undoCount > 0 ? (
              <span className={["text-[10px] font-bold leading-tight",
                undoBlocked ? "text-foreground/30" : "text-primary"].join(" ")}>
                ×{undoCount}
              </span>
            ) : (
              <span className="text-[10px] font-bold text-amber-500 leading-tight">
                🪙{undoShopItem.cost}
              </span>
            )}
          </button>
        </div>

        <div className="w-px bg-foreground/15 shrink-0 self-stretch" />

        {/* ── 슬롯 2: 로드아웃 카드 ──────────────────────── */}
        <div className="flex items-center flex-1">
          <button
            onClick={onCardClick}
            disabled={cardExhausted}
            title={cardDef ? `${cardDef.name}: ${cardDef.description}` : undefined}
            className={[
              "flex flex-col items-center gap-0.5 flex-1 py-2 px-1 rounded-lg transition-all active:scale-95",
              cardExhausted ? "opacity-30 cursor-not-allowed"
              : card?.isActive
                ? "opacity-100 bg-primary/10 ring-1 ring-primary/40"
                : "opacity-100 hover:opacity-80",
            ].join(" ")}
          >
            <span className="text-2xl leading-none">{cardDef?.emoji ?? "❓"}</span>
            <span className="text-[11px] font-semibold text-foreground/70 leading-tight">
              {cardDef?.name ?? "카드"}
            </span>
            <span className={[
              "text-[10px] font-bold leading-tight",
              card?.isActive ? "text-primary animate-pulse"
              : cardExhausted ? "text-foreground/30"
              : "text-primary",
            ].join(" ")}>
              {card?.isActive ? "선택 중..." : card ? `×${card.usesLeft}` : "×0"}
            </span>
          </button>
        </div>

        <div className="w-px bg-foreground/15 shrink-0 self-stretch" />

        {/* ── 슬롯 3: 로드아웃 아이템 0 ─────────────────── */}
        <LoadoutItemSlot
          item={items[0]}
          idx={0}
          canUndo={canUndo}
          hasSeedTiles={hasSeedTiles}
          hasTiles={hasTiles}
          onClick={() => onItemClick(0)}
        />

        <div className="w-px bg-foreground/15 shrink-0 self-stretch" />

        {/* ── 슬롯 4: 로드아웃 아이템 1 ─────────────────── */}
        <LoadoutItemSlot
          item={items[1]}
          idx={1}
          canUndo={canUndo}
          hasSeedTiles={hasSeedTiles}
          hasTiles={hasTiles}
          onClick={() => onItemClick(1)}
        />
      </div>
    </div>
  );
}

/* ── 로드아웃 아이템 슬롯 ────────────────────────────────── */
interface LoadoutItemSlotProps {
  item:         LoadoutItemState | null;
  idx:          0 | 1;
  canUndo:      boolean;
  hasSeedTiles: boolean;
  hasTiles:     boolean;
  onClick:      () => void;
}

function LoadoutItemSlot({
  item, canUndo, hasSeedTiles, hasTiles, onClick,
}: LoadoutItemSlotProps) {
  if (!item) return (
    <div className="flex flex-col items-center gap-0.5 flex-1 py-2 px-1 opacity-20">
      <span className="text-2xl leading-none">❓</span>
      <span className="text-[11px] font-semibold text-foreground/70 leading-tight">없음</span>
    </div>
  );

  const itemDef  = LOADOUT_ITEMS.find((i) => i.id === item.id)!;
  const depleted = item.usesLeft <= 0;

  const blocked =
    !depleted && (
      (item.id === "undo"   && !canUndo) ||
      (item.id === "clean"  && !hasSeedTiles) ||
      (item.id === "remove" && !hasTiles)
    );

  const blockMsg: Record<string, string> = {
    undo:   "되돌릴 이동이 없습니다",
    clean:  "타일이 5개 이상일 때 사용 가능",
    remove: "제거할 타일이 없습니다",
  };

  return (
    <button
      onClick={onClick}
      disabled={depleted || blocked}
      title={blocked ? blockMsg[item.id] : `${itemDef.name} 사용`}
      className={[
        "flex flex-col items-center gap-0.5 flex-1 py-2 px-1 transition-all active:scale-95",
        depleted ? "opacity-20 cursor-not-allowed"
        : blocked ? "opacity-25 cursor-not-allowed"
        : "opacity-100 hover:opacity-80",
      ].join(" ")}
    >
      <span className="text-2xl leading-none">{itemDef.emoji}</span>
      <span className="text-[11px] font-semibold text-foreground/70 leading-tight">
        {itemDef.name}
      </span>
      <span className={[
        "text-[10px] font-bold leading-tight",
        depleted ? "text-foreground/30"
        : blocked ? "text-foreground/30"
        : "text-emerald-500",
      ].join(" ")}>
        ×{item.usesLeft}
      </span>
    </button>
  );
}

/* ============================================================
 * GoalBanner
 * 목표 배너 — Header 아래, Board 위
 *
 * - stageConfig 있음: 타일 목표 + 남은 턴 표시
 * - stageConfig 없음: 기존 점수 목표 표시
 * ============================================================ */
interface GoalBannerProps {
  score:      number;
  stageGoal:  number;
  turnsLeft?: number;
  maxTurns?:  number;
  goalTile?:  number;
}

function GoalBanner({ score, stageGoal, turnsLeft, maxTurns, goalTile }: GoalBannerProps) {
  /* ── 스테이지 모드: 타일 목표 + 턴 카운터 ─────────────── */
  if (goalTile !== undefined && turnsLeft !== undefined && maxTurns !== undefined) {
    const turnPct    = maxTurns > 0 ? Math.min(100, Math.round((turnsLeft / maxTurns) * 100)) : 0;
    const turnsUrgent = turnsLeft <= 3;

    return (
      <div className="mb-2 px-3 py-2 rounded-xl flex items-center gap-2 bg-white/60 border border-foreground/8 transition-all">
        <span className="text-base">🎯</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-foreground/70">
            목표:{" "}
            <span className="text-primary font-black">{goalTile}</span> 타일 달성
          </p>
          <div className="mt-1 h-1 bg-foreground/10 rounded-full overflow-hidden">
            <div
              className={[
                "h-full rounded-full transition-all duration-300",
                turnsUrgent ? "bg-red-400" : "bg-primary",
              ].join(" ")}
              style={{ width: `${turnPct}%` }}
            />
          </div>
        </div>
        <div className="flex-shrink-0 text-right ml-1">
          <p className={[
            "text-sm font-black leading-tight",
            turnsUrgent ? "text-red-500" : "text-foreground/70",
          ].join(" ")}>
            {turnsLeft}
          </p>
          <p className="text-[10px] text-foreground/35 leading-tight">남은 턴</p>
        </div>
      </div>
    );
  }

  /* ── 일반 모드: 점수 목표 ──────────────────────────────── */
  const achieved = score >= stageGoal;
  const pct      = Math.min(100, Math.round((score / stageGoal) * 100));
  return (
    <div
      className={[
        "mb-2 px-3 py-2 rounded-xl flex items-center gap-2 transition-all",
        achieved
          ? "bg-emerald-50 border border-emerald-200"
          : "bg-white/60 border border-foreground/8",
      ].join(" ")}
    >
      <span className="text-base">{achieved ? "✅" : "🎯"}</span>
      <div className="flex-1 min-w-0">
        {achieved ? (
          <p className="text-xs font-bold text-emerald-600">
            목표 달성! {stageGoal.toLocaleString()}점을 넘었어요
          </p>
        ) : (
          <>
            <p className="text-xs font-bold text-foreground/70">
              {score === 0
                ? `${stageGoal.toLocaleString()}점을 넘어보세요!`
                : `현재 ${score.toLocaleString()} / ${stageGoal.toLocaleString()}`}
            </p>
            <div className="mt-1 h-1 bg-foreground/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
