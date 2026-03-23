/* ============================================================
 * Header.tsx
 * 게임 화면 상단 헤더
 *
 * - 홈 버튼 (FrontScreen으로 복귀)
 * - 현재 테마 표시
 * - 점수 / 최고점수
 * - 새 게임 버튼
 * ============================================================ */

import { RefreshCw, Home } from "lucide-react";
import { THEMES } from "@/utils/themes";

interface HeaderProps {
  score: number;
  bestScore: number;
  themeId: string;
  onReset: () => void;
  onHome: () => void;
}

export function Header({ score, bestScore, themeId, onReset, onHome }: HeaderProps) {
  const theme = THEMES[themeId] ?? THEMES.plant;

  return (
    <header className="flex flex-col gap-3 mb-5 mt-2">

      {/* ── 행 1: 홈 버튼 + 테마 뱃지 + 새게임 버튼 ─── */}
      <div className="flex items-center justify-between">
        {/* 홈으로 버튼 */}
        <button
          onClick={onHome}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-board hover:bg-cell active:scale-95 transition-all text-sm font-medium text-foreground/70"
          aria-label="홈으로"
        >
          <Home className="w-4 h-4" />
          <span>홈</span>
        </button>

        {/* 현재 테마 표시 */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
          <span className="text-base">{theme.emoji}</span>
          <span className="text-xs font-bold text-primary">{theme.name} 테마</span>
        </div>

        {/* 새 게임 버튼 */}
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white hover:bg-primary-hover active:scale-95 transition-all text-sm font-medium shadow-sm"
          aria-label="새 게임"
        >
          <RefreshCw className="w-4 h-4" />
          <span>새 게임</span>
        </button>
      </div>

      {/* ── 행 2: 점수 영역 ───────────────────────────── */}
      <div className="flex items-center justify-center gap-3">
        <ScoreBox label="현재 점수" score={score} />
        <ScoreBox label="최고 점수" score={bestScore} />
      </div>

    </header>
  );
}

function ScoreBox({ label, score }: { label: string; score: number }) {
  return (
    <div className="bg-board px-5 py-2 rounded-xl flex flex-col items-center min-w-[100px]">
      <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-0.5">
        {label}
      </span>
      <span className="text-xl font-display font-bold text-foreground leading-none">
        {score.toLocaleString()}
      </span>
    </div>
  );
}
