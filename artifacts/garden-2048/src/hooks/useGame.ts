/* ============================================================
 * useGame.ts
 * 2048 게임 로직 훅
 *
 * 반환값:
 *  - highestTile:       레벨 시스템 XP 계산용
 *  - canUndo:           되돌리기 가능 여부
 *  - undoMove:          되돌리기 (상점/로드아웃 아이템)
 *  - removeTileById:    타일 ID로 제거 (상점/로드아웃 아이템)
 *  - spawnSprout:       빈 칸 랜덤 씨앗(2) 추가 (상점 아이템)
 *  - spawnTileAt:       지정 칸에 씨앗(2) 추가 (해바라기 카드)
 *  - boardClean:        씨앗(2) 타일 전체 제거 (상점/로드아웃 아이템)
 *  - turnsLeft:         남은 턴 (-1 = 무제한)
 *  - maxTurns:          최대 턴 (-1 = 무제한)
 *  - moveCount:         이동 횟수 (클로버 버프 턴 추적용)
 *  - setScoreMultiplier: 점수 배율 설정 (클로버 카드용)
 * ============================================================ */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  GameState,
  TileData,
  initializeGame,
  moveBoard,
  generateId,
  isObstacle,
} from "@/utils/gameUtils";
import { StageConfig, initializeStage } from "@/utils/stageData";

const BEST_SCORE_KEY     = "plant2048_bestScore";
const ANIMATION_DURATION = 150;
const MAX_HISTORY        = 5; /* 최대 되돌리기 스택 깊이 */

export function useGame(stageConfig?: StageConfig, boardSize = 4, initialState?: GameState) {
  const [gameState, setGameState] = useState<GameState>(() => {
    if (initialState) return initialState;
    return stageConfig ? initializeStage(stageConfig) : initializeGame(boardSize);
  });
  const [bestScore, setBestScore]             = useState<number>(0);
  const [isAnimating, setIsAnimating]         = useState(false);
  const [continuePlaying, setContinuePlaying] = useState(false);
  /* undo용 이동 히스토리 */
  const [history, setHistory] = useState<GameState[]>([]);
  /* 이동 횟수 카운터 (클로버 버프 턴 추적용) */
  const [moveCount, setMoveCount] = useState(0);
  /* 클로버 카드 점수 배율 (1.0 = 기본, 1.2 = 클로버 활성) */
  const scoreMultiplierRef = useRef(1.0);
  const setScoreMultiplier = useCallback((m: number) => {
    scoreMultiplierRef.current = m;
  }, []);

  /* 최신 상태를 이벤트 리스너에서 참조하기 위한 ref */
  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  /* ── 스테이지 변경 시 재초기화 ────────────────────────── */
  const prevStageIdRef = useRef<number | undefined>(stageConfig?.id);
  useEffect(() => {
    if (prevStageIdRef.current === stageConfig?.id) return;
    prevStageIdRef.current = stageConfig?.id;
    setGameState(stageConfig ? initializeStage(stageConfig) : initializeGame());
    setContinuePlaying(false);
    setIsAnimating(false);
    setHistory([]);
    setMoveCount(0);
    scoreMultiplierRef.current = 1.0;
  }, [stageConfig?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* 최고 점수 로드 */
  useEffect(() => {
    const saved = localStorage.getItem(BEST_SCORE_KEY);
    if (saved) setBestScore(parseInt(saved, 10));
  }, []);

  /* 최고 점수 업데이트 */
  useEffect(() => {
    if (gameState.score > bestScore) {
      setBestScore(gameState.score);
      localStorage.setItem(BEST_SCORE_KEY, gameState.score.toString());
    }
  }, [gameState.score, bestScore]);

  const clearGraveyard = useCallback(() => {
    setGameState((prev) => ({ ...prev, graveyard: [] }));
    setIsAnimating(false);
  }, []);

  /* ── 이동 처리 (히스토리 저장 포함) ──────────────────── */
  const handleMove = useCallback(
    (direction: "UP" | "DOWN" | "LEFT" | "RIGHT") => {
      if (isAnimating) return;
      if (stateRef.current.hasLost) return;
      if (stateRef.current.hasWon && !continuePlaying) return;

      const { newState: rawState, moved } = moveBoard(
        stateRef.current,
        direction,
        stageConfig?.spawnRate,
      );
      if (moved) {
        /* 클로버 점수 배율 적용 */
        let newState = rawState;
        if (scoreMultiplierRef.current !== 1) {
          const gained = rawState.score - stateRef.current.score;
          if (gained > 0) {
            const bonus = Math.round(gained * (scoreMultiplierRef.current - 1));
            newState = { ...rawState, score: rawState.score + bonus };
          }
        }
        /* 이동 전 상태를 히스토리에 보관 (graveyard 제외) */
        setHistory((prev) => [
          ...prev.slice(-(MAX_HISTORY - 1)),
          { ...stateRef.current, graveyard: [] },
        ]);
        setMoveCount((c) => c + 1);
        setIsAnimating(true);
        setGameState(newState);
        setTimeout(clearGraveyard, ANIMATION_DURATION);
      }
    },
    [isAnimating, continuePlaying, stageConfig?.spawnRate, clearGraveyard],
  );

  /* ── 새 게임 ──────────────────────────────────────────── */
  const resetGame = useCallback(() => {
    setGameState(stageConfig ? initializeStage(stageConfig) : initializeGame(boardSize));
    setContinuePlaying(false);
    setIsAnimating(false);
    setHistory([]);
    setMoveCount(0);
    scoreMultiplierRef.current = 1.0;
  }, [stageConfig]);

  /* ── 계속 플레이 ──────────────────────────────────────── */
  const playOn = useCallback(() => {
    setContinuePlaying(true);
  }, []);

  /* ── 되돌리기 (상점 아이템: undo) ────────────────────── */
  const undoMove = useCallback(() => {
    if (isAnimating) return;
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setGameState({ ...last, graveyard: [] });
      return prev.slice(0, -1);
    });
  }, [isAnimating]);

  /* ── 타일 제거 (상점 아이템: remove_tile) ─────────────
   * 지정한 ID의 타일 1개를 제거한다.
   * ──────────────────────────────────────────────────── */
  const removeTileById = useCallback((id: string) => {
    setGameState((prev) => {
      if (!(prev.activeTiles as Record<string, TileData>)[id]) return prev;

      const newActiveTiles = { ...(prev.activeTiles as Record<string, TileData>) };
      delete newActiveTiles[id];

      const newBoard = prev.board.map((row) =>
        row.map((cell) => (cell?.id === id ? null : cell)),
      );

      return { ...prev, activeTiles: newActiveTiles, board: newBoard, graveyard: [] };
    });
  }, []);

  /* ── 씨앗 소환 (상점 아이템: spawn_sprout) ────────────
   * 빈 칸에 값 2인 새 타일을 1개 추가한다.
   * ──────────────────────────────────────────────────── */
  const spawnSprout = useCallback(() => {
    setGameState((prev) => {
      const emptyCells: { x: number; y: number }[] = [];
      prev.board.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell === null) emptyCells.push({ x, y });
        });
      });
      if (emptyCells.length === 0) return prev;

      const pos = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      const newTile: TileData = {
        id: generateId(),
        value: 2,
        x: pos.x,
        y: pos.y,
        isNew: true,
      };

      const newBoard = prev.board.map((row) => [...row]);
      newBoard[pos.y][pos.x] = newTile;

      return {
        ...prev,
        board: newBoard,
        activeTiles: { ...prev.activeTiles, [newTile.id]: newTile },
        graveyard: [],
      };
    });
  }, []);

  /* ── 지정 칸 씨앗 소환 (해바라기 카드: spawnTileAt) ──────
   * 선택한 빈 칸에 값 2인 타일을 추가한다.
   * ──────────────────────────────────────────────────── */
  const spawnTileAt = useCallback((x: number, y: number, value = 2) => {
    setGameState((prev) => {
      if (prev.board[y]?.[x] !== null) return prev; // 빈 칸이 아니면 무시
      const newTile: TileData = {
        id: generateId(),
        value,
        x,
        y,
        isNew: true,
      };
      const newBoard = prev.board.map((row) => [...row]);
      newBoard[y][x] = newTile;
      return {
        ...prev,
        board:       newBoard,
        activeTiles: { ...prev.activeTiles, [newTile.id]: newTile },
        graveyard:   [],
      };
    });
  }, []);

  /* ── 보드 청소 (상점 아이템: board_clean) ─────────────
   * 장애물을 유지하면서 숫자 타일 상위 4개만 남긴다.
   * ──────────────────────────────────────────────────── */
  const boardClean = useCallback(() => {
    setGameState((prev) => {
      const tiles       = Object.values(prev.activeTiles as Record<string, TileData>);
      const obstacles   = tiles.filter((t) => isObstacle(t));
      const numberTiles = tiles.filter((t) => !isObstacle(t));
      if (numberTiles.length <= 4) return prev;

      /* 값 내림차순 정렬 → 상위 4개 ID 유지, 장애물은 항상 유지 */
      const keepIds = new Set([
        ...obstacles.map((t) => t.id),
        ...[...numberTiles]
          .sort((a, b) => b.value - a.value)
          .slice(0, 4)
          .map((t) => t.id),
      ]);

      /* 남길 타일: 애니메이션 플래그 초기화한 새 객체 생성 */
      const newActiveTiles: Record<string, TileData> = {};
      for (const tile of tiles) {
        if (keepIds.has(tile.id)) {
          newActiveTiles[tile.id] = { ...tile, isNew: false, isMerged: false };
        }
      }

      /* board는 newActiveTiles의 cleaned 객체를 참조하도록 재구성 */
      const newBoard = prev.board.map((row) =>
        row.map((cell) =>
          cell && keepIds.has(cell.id) ? newActiveTiles[cell.id] : null,
        ),
      );

      return { ...prev, activeTiles: newActiveTiles, board: newBoard, graveyard: [] };
    });
  }, []);

  /* ── 키보드 컨트롤 ────────────────────────────────────── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
      }
      switch (e.key) {
        case "ArrowUp":    handleMove("UP");    break;
        case "ArrowDown":  handleMove("DOWN");  break;
        case "ArrowLeft":  handleMove("LEFT");  break;
        case "ArrowRight": handleMove("RIGHT"); break;
      }
    };
    window.addEventListener("keydown", handleKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleMove]);

  /* ── 현재 보드 최고 타일 값 계산 (장애물 제외) ─────────── */
  const highestTile = Object.values(
    gameState.activeTiles as Record<string, TileData>,
  ).reduce((max, tile) => (isObstacle(tile) ? max : Math.max(max, tile.value)), 2);

  return {
    ...gameState,
    bestScore,
    highestTile,
    isAnimating,
    turnsLeft: gameState.turnsLeft ?? -1,
    maxTurns:  gameState.maxTurns  ?? -1,
    canUndo:          history.length > 0,
    moveCount,
    resetGame,
    handleMove,
    playOn,
    undoMove,
    removeTileById,
    spawnSprout,
    spawnTileAt,
    boardClean,
    setScoreMultiplier,
    showWinModal: gameState.hasWon && !continuePlaying,
  };
}
