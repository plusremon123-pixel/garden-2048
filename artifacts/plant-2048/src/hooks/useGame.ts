import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, initializeGame, moveBoard } from '@/utils/gameUtils';

const BEST_SCORE_KEY = 'plant2048_bestScore';
const ANIMATION_DURATION = 150;

export function useGame() {
  const [gameState, setGameState] = useState<GameState>(initializeGame);
  const [bestScore, setBestScore] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [continuePlaying, setContinuePlaying] = useState(false);
  
  // Ref to hold latest state for event listeners
  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  // Load best score on mount
  useEffect(() => {
    const saved = localStorage.getItem(BEST_SCORE_KEY);
    if (saved) setBestScore(parseInt(saved, 10));
  }, []);

  // Update best score
  useEffect(() => {
    if (gameState.score > bestScore) {
      setBestScore(gameState.score);
      localStorage.setItem(BEST_SCORE_KEY, gameState.score.toString());
    }
  }, [gameState.score, bestScore]);

  const clearGraveyard = useCallback(() => {
    setGameState(prev => ({ ...prev, graveyard: [] }));
    setIsAnimating(false);
  }, []);

  const handleMove = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (isAnimating) return;
    
    // Block moves if game over, or won (unless opted to continue)
    if (stateRef.current.hasLost) return;
    if (stateRef.current.hasWon && !continuePlaying) return;

    const { newState, moved } = moveBoard(stateRef.current, direction);
    
    if (moved) {
      setIsAnimating(true);
      setGameState(newState);
      setTimeout(clearGraveyard, ANIMATION_DURATION);
    }
  }, [isAnimating, continuePlaying, clearGraveyard]);

  const resetGame = useCallback(() => {
    setGameState(initializeGame());
    setContinuePlaying(false);
    setIsAnimating(false);
  }, []);

  const playOn = useCallback(() => {
    setContinuePlaying(true);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowUp': handleMove('UP'); break;
        case 'ArrowDown': handleMove('DOWN'); break;
        case 'ArrowLeft': handleMove('LEFT'); break;
        case 'ArrowRight': handleMove('RIGHT'); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove]);

  return {
    ...gameState,
    bestScore,
    resetGame,
    handleMove,
    playOn,
    showWinModal: gameState.hasWon && !continuePlaying
  };
}
