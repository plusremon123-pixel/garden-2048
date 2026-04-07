/* ============================================================
 * GameEndModal.tsx
 * 게임 종료 결과 모달 — 점수·코인 중심, 최소 UI
 * ============================================================ */

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  PlayerData,
  calculateGameXp,
  getLevelGoal,
} from "@/utils/playerData";
import { calculateGameCoins } from "@/utils/economyUtils";
import { watchAd } from "@/utils/adService";
import { useTranslation } from "@/i18n";

interface GameEndModalProps {
  isOpen:           boolean;
  isWin:            boolean;
  score:            number;
  highestTile:      number;
  player:           PlayerData;
  isPremiumActive?: boolean;
  onConfirm:        (earnedXp: number, earnedCoins: number, action: "reset" | "home") => void;
}

type AdState = "idle" | "watching" | "done";

export function GameEndModal({
  isOpen,
  isWin,
  score,
  highestTile,
  player,
  isPremiumActive = false,
  onConfirm,
}: GameEndModalProps) {
  const { t } = useTranslation();

  const baseXpRef    = useRef(0);
  const gameCoinsRef = useRef(0);

  useEffect(() => {
    if (isOpen) {
      baseXpRef.current    = calculateGameXp(score, highestTile, isWin);
      gameCoinsRef.current = calculateGameCoins(score, highestTile);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const baseXp    = baseXpRef.current;
  const gameCoins = gameCoinsRef.current;

  const [adState,    setAdState]    = useState<AdState>("idle");
  const [multiplied, setMultiplied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setAdState("idle");
    setMultiplied(false);
  }, [isOpen]);

  if (!isOpen) return null;

  /* ── 스테이지 목표 ──────────────────────────────────── */
  const nextStage  = player.clearedLevel + 1;
  const stageGoal  = getLevelGoal(nextStage);
  const stagePassed = score >= stageGoal;

  /* ── 최종 코인 (구독자 자동 2배 or 광고 2배 반영) ──── */
  const finalCoins = gameCoins * ((multiplied || isPremiumActive) ? 2 : 1);

  /* ── 광고 시청 (코인 2배) ──────────────────────────── */
  const handleWatchAd = async () => {
    if (adState !== "idle" || multiplied) return;
    setAdState("watching");
    const success = await watchAd();
    if (success) {
      setMultiplied(true);
      setAdState("done");
    } else {
      setAdState("idle");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">

        {/* ── 결과 헤더 ────────────────────────────────── */}
        <div className="text-center">
          <div className="text-3xl mb-1">{isWin ? "🌸" : "😢"}</div>
          <h2 className="text-lg font-display font-bold text-foreground">
            {isWin ? t("game.stageClear") : t("game.gameOver")}
          </h2>
        </div>

        {/* ── 점수 ─────────────────────────────────────── */}
        <div className="flex gap-3">
          <div className="flex-1 bg-board/60 rounded-2xl py-3 flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-foreground/40 font-medium uppercase tracking-wide">{t("game.score")}</span>
            <span className="text-xl font-display font-bold text-foreground">{score.toLocaleString()}</span>
          </div>
          <div className="flex-1 bg-board/60 rounded-2xl py-3 flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-foreground/40 font-medium uppercase tracking-wide">{t("game.best")}</span>
            <span className="text-xl font-display font-bold text-foreground">{highestTile}</span>
          </div>
        </div>

        {/* ── 스테이지 목표 ────────────────────────────── */}
        <div className={[
          "flex items-center justify-between px-4 py-2.5 rounded-2xl border text-xs",
          stagePassed
            ? "bg-emerald-50 border-emerald-200"
            : "bg-board/60 border-board",
        ].join(" ")}>
          <span className="text-foreground/50">
            {t("game.stageGoal", { stage: nextStage })}
            <span className="ml-1 font-bold text-foreground/70">{t("game.stageGoalPoints", { goal: stageGoal.toLocaleString() })}</span>
          </span>
          {stagePassed ? (
            <span className="font-bold text-emerald-600">🌸 {t("game.stageClear")}</span>
          ) : (
            <span className="text-foreground/40">{t("game.stageShort", { points: (stageGoal - score).toLocaleString() })}</span>
          )}
        </div>

        {/* ── 코인 획득 ────────────────────────────────── */}
        <div className="flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl py-3">
          <span className="text-xl">🪙</span>
          <span className="text-base font-bold text-amber-600">
            {t("game.coinEarned", { coins: finalCoins })}
          </span>
          {multiplied && (
            <span className="text-xs bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">×2</span>
          )}
        </div>

        {/* ── 코인 2배: 구독자 자동 / 비구독자 광고 ──── */}
        {isPremiumActive ? (
          <div className="w-full py-3 rounded-2xl bg-amber-50 border-2 border-amber-300 text-center text-sm font-bold text-amber-600">
            {t("game.premiumDoubleAuto")}
          </div>
        ) : !multiplied ? (
          <button
            onClick={handleWatchAd}
            disabled={adState === "watching"}
            className={[
              "w-full py-3 rounded-2xl font-bold text-sm transition-all duration-200 border-2",
              adState === "watching"
                ? "border-amber-200 bg-amber-50 text-amber-400 cursor-wait"
                : "border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100 active:scale-95",
            ].join(" ")}
          >
            {adState === "watching" ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                {t("game.watchingAd")}
              </span>
            ) : (
              t("game.watchAdDouble")
            )}
          </button>
        ) : (
          <div className="w-full py-3 rounded-2xl bg-amber-50 border-2 border-amber-300 text-center text-sm font-bold text-amber-600">
            {t("game.doubleApplied")}
          </div>
        )}

        {/* ── 액션 버튼 ───────────────────────────────── */}
        <div className="flex gap-3">
          <button
            onClick={() => onConfirm(baseXp, finalCoins, "home")}
            className="flex-1 py-3 rounded-2xl bg-board text-foreground/70 font-bold text-sm hover:bg-cell active:scale-95 transition-all"
          >
            {t("game.home")}
          </button>
          <button
            onClick={() => onConfirm(baseXp, finalCoins, "reset")}
            className="flex-2 flex-[2] py-3 rounded-2xl bg-primary text-white font-bold text-sm shadow-sm hover:bg-primary-hover active:scale-95 transition-all"
          >
            {t("game.newGame")}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
