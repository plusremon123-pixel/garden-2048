/* ============================================================
 * EndlessGame.tsx
 * 무한 모드 게임 화면
 *
 * - 카드 / 아이템 시스템 없음 (단순 룰)
 * - 5×5 (easy) 또는 6×6 (normal/hard) 보드
 * - 3단계 목표 시스템 + 단계별 보상
 * - 자동 저장 (이어하기 지원)
 * - 게임 오버: 이어하기 (광고) / 새로 시작
 * ============================================================ */

import { useEffect, useRef, useState, useCallback } from "react";
import { useGame }          from "@/hooks/useGame";
import { Board }            from "@/components/Board";
import { BackgroundLayer }  from "@/components/BackgroundLayer";
import { useTranslation }   from "@/i18n";
import { isObstacle }       from "@/utils/gameUtils";
import type { TileData }    from "@/utils/gameUtils";
import {
  ENDLESS_CONFIGS,
  loadEndlessSave,
  saveEndlessState,
  clearEndlessSave,
  checkNewPhaseAchieved,
  type EndlessDifficulty,
  type EndlessSaveData,
} from "@/utils/endlessModeData";
import type { ShopItemId }  from "@/utils/shopData";
import { loadInventory, saveInventory } from "@/utils/shopData";
import { EndlessRewardModal }  from "@/components/modals/EndlessRewardModal";
import { EndlessGameOverModal } from "@/components/modals/EndlessGameOverModal";

/* ── 간단한 인벤토리 추가 헬퍼 ─────────────────────────────── */
function addItem(itemId: ShopItemId, qty: number) {
  const inv = loadInventory();
  inv[itemId] = (inv[itemId] ?? 0) + qty;
  saveInventory(inv);
}

/* ── Props ─────────────────────────────────────────────────── */
interface EndlessGameProps {
  difficulty:  EndlessDifficulty;
  resumeSave?: EndlessSaveData | null;
  onHome:      () => void;
  onEarnCoins: (coins: number) => void;
}

/* ── 메인 컴포넌트 ─────────────────────────────────────────── */
export default function EndlessGame({
  difficulty, resumeSave, onHome, onEarnCoins,
}: EndlessGameProps) {
  const { t }    = useTranslation();
  const config   = ENDLESS_CONFIGS[difficulty];
  const gridSize = config.boardSize;

  /* ── 게임 초기 상태 구성 ─────────────────────────────────── */
  const initialGameState = resumeSave ? {
    board:        resumeSave.board,
    activeTiles:  resumeSave.activeTiles,
    graveyard:    [],
    score:        resumeSave.score,
    hasWon:       false,
    hasLost:      false,
    boardSize:    gridSize,
  } : undefined;

  const {
    board, activeTiles, graveyard,
    score, hasLost,
    highestTile, isAnimating,
    handleMove, resetGame, undoMove,
  } = useGame(undefined, gridSize, initialGameState);

  /* ── 보상 단계 추적 ─────────────────────────────────────── */
  const [claimedPhases, setClaimedPhases] = useState<number[]>(
    resumeSave?.claimedPhases ?? [],
  );
  const [pendingReward, setPendingReward] = useState<{ phase: 1|2|3 } | null>(null);
  const [showGameOver,  setShowGameOver]  = useState(false);
  const prevHighestRef                   = useRef<number>(-1);

  /* ── tilesList ───────────────────────────────────────────── */
  const tilesList = Object.values(activeTiles as Record<string, TileData>);
  const graveyardList = graveyard as TileData[];

  /* ── 자동 저장 ───────────────────────────────────────────── */
  useEffect(() => {
    if (hasLost) return; // 종료 후엔 저장 안 함
    saveEndlessState({
      difficulty,
      board,
      activeTiles: activeTiles as Record<string, TileData>,
      score,
      claimedPhases,
    });
  }, [board, score, claimedPhases, hasLost, difficulty]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── 단계 달성 감지 ─────────────────────────────────────── */
  useEffect(() => {
    if (prevHighestRef.current < 0) {
      prevHighestRef.current = highestTile;
      return;
    }
    if (highestTile <= prevHighestRef.current) return;
    prevHighestRef.current = highestTile;

    if (pendingReward) return; // 이미 보상 팝업 열려있음

    const achieved = checkNewPhaseAchieved(highestTile, config, claimedPhases);
    if (achieved !== null) {
      setPendingReward({ phase: achieved as 1|2|3 });
    }
  }, [highestTile]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── 게임 오버 감지 ─────────────────────────────────────── */
  useEffect(() => {
    if (hasLost && !pendingReward) {
      setShowGameOver(true);
    }
  }, [hasLost, pendingReward]);

  /* ── 보상 수령 ───────────────────────────────────────────── */
  const handleClaimReward = useCallback((gold: number) => {
    const phase = pendingReward!.phase;
    onEarnCoins(gold);
    setClaimedPhases((prev) => [...prev, phase]);
    setPendingReward(null);
    if (hasLost) setShowGameOver(true);
  }, [pendingReward, hasLost, onEarnCoins]);

  const handleClaimWithItem = useCallback((gold: number, itemId: ShopItemId) => {
    const phase = pendingReward!.phase;
    onEarnCoins(gold);
    addItem(itemId, 1);
    setClaimedPhases((prev) => [...prev, phase]);
    setPendingReward(null);
    if (hasLost) setShowGameOver(true);
  }, [pendingReward, hasLost, onEarnCoins]);

  /* ── 이어하기 (되돌리기) ────────────────────────────────── */
  const handleContinue = useCallback(() => {
    setShowGameOver(false);
    undoMove();
  }, [undoMove]);

  /* ── 새로 시작 ───────────────────────────────────────────── */
  const handleRestart = useCallback(() => {
    clearEndlessSave();
    setClaimedPhases([]);
    setPendingReward(null);
    setShowGameOver(false);
    prevHighestRef.current = -1;
    resetGame();
  }, [resetGame]);

  /* ── 홈으로 ─────────────────────────────────────────────── */
  const handleHome = useCallback(() => {
    // 현재 상태는 자동저장됨 (이어하기 가능)
    onHome();
  }, [onHome]);

  /* ── 현재 단계 / 다음 목표 ──────────────────────────────── */
  const currentPhaseIdx = claimedPhases.length; // 0,1,2,3
  const nextGoal        = currentPhaseIdx < 3 ? config.goals[currentPhaseIdx] : null;
  const prevGoal        = currentPhaseIdx > 0 ? config.goals[currentPhaseIdx - 1] : 0;
  const progressPct     = nextGoal
    ? Math.min(100, Math.round(((highestTile - prevGoal) / (nextGoal - prevGoal)) * 100))
    : 100;

  const difficultyLabel: Record<EndlessDifficulty, string> = {
    easy:   "🌱",
    normal: "🌿",
    hard:   "🌵",
  };

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col items-center bg-background overflow-hidden">

      <div className="relative flex-1 w-full flex flex-col items-center overflow-hidden">
        <BackgroundLayer highestTile={highestTile} />

        <div className="relative z-10 w-full flex flex-col flex-1 items-center">

          {/* AD 상단 배너 */}
          <div className="w-full h-10 bg-white/55 backdrop-blur-sm flex items-center justify-center text-[11px] font-medium text-foreground/25 flex-shrink-0">
            AD
          </div>

          <div className="w-full max-w-[500px] flex flex-col flex-1 px-4 pb-6">

            {/* ── 헤더 ────────────────────────────────────────── */}
            <div className="flex items-center justify-between py-2 gap-2">
              <button
                onClick={handleHome}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-board hover:bg-cell active:scale-95 transition-all text-sm font-bold text-foreground/70"
              >
                🏠 {t("game.homeBtn")}
              </button>

              {/* 난이도 + 점수 */}
              <div className="flex items-center gap-2">
                <span className="text-lg">{difficultyLabel[difficulty]}</span>
                <div className="bg-white/60 border border-foreground/10 rounded-xl px-3 py-1.5 text-center">
                  <p className="text-[10px] text-foreground/40 leading-none">{t("game.score")}</p>
                  <p className="text-sm font-black text-foreground leading-tight">{score.toLocaleString()}</p>
                </div>
                <div className="bg-white/60 border border-foreground/10 rounded-xl px-3 py-1.5 text-center">
                  <p className="text-[10px] text-foreground/40 leading-none">{t("game.best")}</p>
                  <p className="text-sm font-black text-foreground leading-tight">{highestTile.toLocaleString()}</p>
                </div>
              </div>

              <button
                onClick={handleRestart}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-board hover:bg-cell active:scale-95 transition-all text-sm font-bold text-foreground/70"
              >
                ↺
              </button>
            </div>

            {/* ── 단계 진행 배너 ──────────────────────────────── */}
            <div className="mb-2 px-3 py-2 rounded-xl flex items-center gap-2 bg-white/60 border border-foreground/8 transition-all">
              <span className="text-base">🎯</span>
              <div className="flex-1 min-w-0">
                {nextGoal ? (
                  <>
                    <p className="text-xs font-bold text-foreground/70">
                      {t("endless.phase", { n: currentPhaseIdx + 1 })} — {nextGoal.toLocaleString()} {t("endless.tileGoal")}
                    </p>
                    <div className="mt-1 h-1 bg-foreground/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-xs font-bold text-emerald-600">
                    🏆 {t("endless.allCleared")}
                  </p>
                )}
              </div>
              {/* 단계 뱃지 */}
              <div className="flex gap-1 flex-shrink-0">
                {[1, 2, 3].map((n) => (
                  <span
                    key={n}
                    className={[
                      "w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center",
                      claimedPhases.includes(n)
                        ? "bg-primary text-white"
                        : "bg-foreground/10 text-foreground/30",
                    ].join(" ")}
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>

            {/* ── 게임 보드 ───────────────────────────────────── */}
            <main className="w-full flex-1 flex flex-col justify-center">
              <Board
                tiles={tilesList}
                graveyard={graveyardList}
                gridSize={gridSize}
                onSwipe={handleMove}
                themeId="plant"
              />
            </main>

          </div>
        </div>
      </div>

      {/* ── 단계 보상 모달 ──────────────────────────────────── */}
      {pendingReward && (
        <EndlessRewardModal
          phase={pendingReward.phase}
          config={config}
          onClaim={handleClaimReward}
          onClaimWithItem={handleClaimWithItem}
        />
      )}

      {/* ── 게임 오버 모달 ──────────────────────────────────── */}
      {showGameOver && !pendingReward && (
        <EndlessGameOverModal
          score={score}
          highestTile={highestTile}
          onContinue={handleContinue}
          onRestart={handleRestart}
          onHome={handleHome}
        />
      )}

    </div>
  );
}
