/* ============================================================
 * useGame.ts
 * 2048 게임 로직 훅
 *
 * 반환값에 highestTile이 추가됨 (레벨 시스템 XP 계산용)
 * ============================================================ */

import { useState, useEffect, useCallback, useRef } from "react";
import { GameState, TileData, initializeGame, moveBoard } from "@/utils/gameUtils";

const BEST_SCORE_KEY    = "plant2048_bestScore";
const ANIMATION_DURATION = 150;

export function useGame() {
  const [gameState, setGameState]       = useState<GameState>(initializeGame);
  const [bestScore, setBestScore]       = useState<number>(0);
  const [isAnimating, setIsAnimating]   = useState(false);
  const [continuePlaying, setContinuePlaying] = useState(false);

  /* 최신 상태를 이벤트 리스너에서 참조하기 위한 ref */
  const stateRef = useRef(gameState);
  stateRef.current = gameState;

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

  const handleMove = useCallback(
    (direction: "UP" | "DOWN" | "LEFT" | "RIGHT") => {
      if (isAnimating) return;
      if (stateRef.current.hasLost) return;
      if (stateRef.current.hasWon && !continuePlaying) return;

      const { newState, moved } = moveBoard(stateRef.current, direction);
      if (moved) {
        setIsAnimating(true);
        setGameState(newState);
        setTimeout(clearGraveyard, ANIMATION_DURATION);
      }
    },
    [isAnimating, continuePlaying, clearGraveyard]
  );

  const resetGame = useCallback(() => {
    setGameState(initializeGame());
    setContinuePlaying(false);
    setIsAnimating(false);
  }, []);

  const playOn = useCallback(() => {
    setContinuePlaying(true);
  }, []);

  /* 키보드 컨트롤 */
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

  /* 현재 보드에서 최고 타일 값 계산 */
  const highestTile = Object.values(gameState.activeTiles as Record<string, TileData>).reduce(
    (max, tile) => Math.max(max, tile.value),
    2
  );

  return {
    ...gameState,
    bestScore,
    highestTile,
    resetGame,
    handleMove,
    playOn,
    showWinModal: gameState.hasWon && !continuePlaying,
  };
}
