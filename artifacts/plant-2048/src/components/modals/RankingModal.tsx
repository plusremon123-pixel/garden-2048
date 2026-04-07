/* ============================================================
 * RankingModal.tsx
 * 랭킹 — 풀페이지 화면
 * ============================================================ */

import { useState } from "react";
import { createPortal } from "react-dom";
import {
  fetchRankingBoard,
  formatRemaining,
  type ScoreType,
  type PeriodType,
  type RankingEntry,
  type RankingBoardResult,
} from "@/utils/rankingData";
import { useTranslation } from "@/i18n";

interface RankingModalProps {
  onClose: () => void;
}

const SCORE_TYPES: ScoreType[]  = ["cumulative", "best"];
const PERIOD_TYPES: PeriodType[] = ["daily", "weekly", "monthly"];
const MEDAL = ["🥇", "🥈", "🥉"];

/* ── 남은 시간 색상 ─────────────────────────────────────── */
function remainingColor(ms: number): string {
  const h = ms / 3600000;
  if (h < 1)  return "text-red-500 font-black";
  if (h < 6)  return "text-orange-500 font-bold";
  return "text-foreground/40 font-medium";
}

export function RankingModal({ onClose }: RankingModalProps) {
  const { t } = useTranslation();
  const [scoreType,  setScoreType]  = useState<ScoreType>("cumulative");
  const [periodType, setPeriodType] = useState<PeriodType>("daily");

  const board: RankingBoardResult = fetchRankingBoard(scoreType, periodType);
  const {
    entries, myRank, myScore, scoreToThird, remainingMs, expectedReward,
  } = board;

  /* ── 순위 뱃지 ─────────────────────────────────────────── */
  const rankBadge = (entry: RankingEntry) => (
    <div className={[
      "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0",
      entry.rank === 1 ? "bg-yellow-400 text-white" :
      entry.rank === 2 ? "bg-gray-300 text-gray-700" :
      entry.rank === 3 ? "bg-amber-600/80 text-white" :
                         "bg-foreground/10 text-foreground/45",
    ].join(" ")}>
      {entry.rank <= 3 ? MEDAL[entry.rank - 1] : entry.rank}
    </div>
  );

  /* ── 보상 미리보기 텍스트 ───────────────────────────────── */
  const rewardText = () => {
    if (!myRank) return <span className="text-[10px] text-foreground/35">{t("ranking.noScore")}</span>;
    if (myRank <= 3) return (
      <span className="text-[10px] text-amber-600 font-bold">
        {t("ranking.rewardExpected", { amount: expectedReward.toLocaleString() })}
      </span>
    );
    return <span className="text-[10px] text-foreground/35">{t("ranking.top3Only")}</span>;
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col bg-white animate-in slide-in-from-bottom-4 duration-300">

      {/* ── 헤더 ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 pt-5 pb-3 flex-shrink-0 border-b border-foreground/8">
        <h2 className="flex-1 text-base font-bold text-foreground flex items-center gap-1.5">
          <img src="/icons/icon-ranking.png" className="w-6 h-6 object-contain" alt="" draggable={false} />
          {t("ranking.title")}
        </h2>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-foreground/8 hover:bg-foreground/14 active:scale-95 transition-all text-foreground/50 text-sm font-bold flex-shrink-0"
        >
          ✕
        </button>
      </div>

      {/* ── 1차 탭: 누적점수 / 최고점 ───────────────────────── */}
      <div className="flex gap-1.5 px-4 pt-3 pb-1 flex-shrink-0">
        {SCORE_TYPES.map((st) => (
          <button
            key={st}
            onClick={() => setScoreType(st)}
            className={[
              "flex-1 py-2 rounded-2xl text-xs font-bold transition-all",
              scoreType === st
                ? "bg-primary text-white shadow-sm"
                : "bg-foreground/8 text-foreground/50 hover:bg-foreground/12",
            ].join(" ")}
          >
            {st === "cumulative" ? t("ranking.typeCumulative") : t("ranking.typeBest")}
          </button>
        ))}
      </div>

      {/* ── 2차 탭: 일별 / 주별 / 월별 ─────────────────────── */}
      <div className="flex gap-1.5 px-4 pb-3 flex-shrink-0">
        {PERIOD_TYPES.map((pt) => (
          <button
            key={pt}
            onClick={() => setPeriodType(pt)}
            className={[
              "flex-1 py-1.5 rounded-full text-[11px] font-semibold transition-all",
              periodType === pt
                ? "bg-foreground/15 text-foreground font-bold"
                : "bg-foreground/5 text-foreground/40 hover:bg-foreground/10",
            ].join(" ")}
          >
            {pt === "daily" ? t("ranking.periodDaily") : pt === "weekly" ? t("ranking.periodWeekly") : t("ranking.periodMonthly")}
          </button>
        ))}
      </div>

      {/* ── 내 순위 카드 ─────────────────────────────────────── */}
      <div className="mx-4 mb-3 bg-primary/8 border border-primary/15 rounded-2xl px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/15 rounded-full flex items-center justify-center text-lg flex-shrink-0">
            🌱
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-foreground/50">
              {t("ranking.myScore", { type: scoreType === "cumulative" ? t("ranking.myScoreCumulative") : t("ranking.myScoreBest") })}
            </p>
            <p className="text-lg font-black text-primary leading-tight">
              {myScore > 0 ? myScore.toLocaleString() : "–"}
              {myScore > 0 && <span className="text-xs font-normal text-foreground/40 ml-1">{t("ranking.scoreUnit")}</span>}
            </p>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-[10px] text-foreground/40">{t("ranking.myRank")}</p>
            <p className="text-base font-black text-primary">
              {myRank ? t("ranking.rankUnit", { rank: myRank }) : "–"}
            </p>
          </div>
        </div>

        {/* 하단 정보 행 */}
        <div className="mt-2 pt-2 border-t border-primary/10 flex items-center justify-between gap-2">
          <div className="text-[10px] text-foreground/45">
            {scoreToThird === null ? (
              t("ranking.needScore")
            ) : scoreToThird <= 0 ? (
              <span className="text-emerald-600 font-bold">{t("ranking.top3")}</span>
            ) : (
              t("ranking.needForThird", { score: scoreToThird.toLocaleString() })
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-[10px] text-foreground/35">⏱</span>
            <span className={`text-[10px] ${remainingColor(remainingMs)}`}>
              {formatRemaining(remainingMs)}
            </span>
          </div>
        </div>

        <div className="mt-1.5 flex justify-end">
          {rewardText()}
        </div>
      </div>

      {/* ── 랭킹 리스트 ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="flex flex-col gap-1.5">
          {entries.map((entry: RankingEntry) => (
            <div
              key={`${entry.rank}-${entry.name}`}
              className={[
                "flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all",
                entry.isMe
                  ? "bg-primary/10 border border-primary/25"
                  : "bg-foreground/4 hover:bg-foreground/6",
              ].join(" ")}
            >
              {rankBadge(entry)}

              <p className={[
                "flex-1 text-sm font-semibold truncate",
                entry.isMe ? "text-primary" : "text-foreground",
              ].join(" ")}>
                {entry.name}
                {entry.isMe && (
                  <span className="ml-1 text-[9px] bg-primary/15 text-primary px-1 py-0.5 rounded-full">{t("ranking.me")}</span>
                )}
              </p>

              <div className="text-right flex-shrink-0">
                <p className={[
                  "text-sm font-bold tabular-nums",
                  entry.isMe ? "text-primary" : "text-foreground/55",
                ].join(" ")}>
                  {entry.score > 0 ? entry.score.toLocaleString() : "–"}
                </p>
                {entry.rank <= 3 && (
                  <p className="text-[9px] text-amber-500 font-bold">
                    🪙 {(entry.rank === 1
                          ? { daily: 500, weekly: 1500, monthly: 5000 }
                          : entry.rank === 2
                          ? { daily: 300, weekly: 1000, monthly: 3000 }
                          : { daily: 150, weekly: 500,  monthly: 1500 }
                        )[periodType].toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 안내 문구 */}
        <p className="text-center text-[10px] text-foreground/25 mt-4 px-4">
          {t("ranking.rewardNote")}
        </p>
      </div>

    </div>,
    document.body,
  );
}
