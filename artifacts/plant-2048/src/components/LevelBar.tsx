/* ============================================================
 * LevelBar.tsx
 * 레벨 + XP 진행 바 컴포넌트
 *
 * size="large"  → 홈 화면 상단 (큼직하게)
 * size="small"  → 게임 화면 헤더 (컴팩트)
 * ============================================================ */

import { PlayerData, xpForNextLevel, xpProgress } from "@/utils/playerData";

interface LevelBarProps {
  player: PlayerData;
  size?: "large" | "small";
  /** 애니메이션 후 채워질 XP를 미리 보여줄 때 사용 (GameEndModal 전용) */
  previewXp?: number;
  /** 미리 보기 레벨 (레벨업된 경우) */
  previewLevel?: number;
}

export function LevelBar({
  player,
  size = "large",
  previewXp,
  previewLevel,
}: LevelBarProps) {
  const displayLevel = previewLevel ?? player.level;
  const displayXp    = previewXp   ?? player.xp;
  const needed       = xpForNextLevel(displayLevel);
  const pct          = Math.min((displayXp / needed) * 100, 100);

  if (size === "small") {
    return (
      <div className="flex items-center gap-2 min-w-0">
        {/* 레벨 뱃지 */}
        <span className="shrink-0 text-[11px] font-display font-bold bg-primary/15 text-primary px-2 py-0.5 rounded-full">
          Lv.{displayLevel}
        </span>
        {/* 진행 바 */}
        <div className="flex-1 h-1.5 bg-board rounded-full overflow-hidden min-w-[60px]">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        {/* XP 텍스트 */}
        <span className="shrink-0 text-[10px] text-foreground/40 font-medium">
          {displayXp}/{needed}
        </span>
      </div>
    );
  }

  /* size === "large" */
  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* 상단 행: 레벨 + XP 수치 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-display font-bold bg-primary/15 text-primary px-2.5 py-0.5 rounded-full">
            Lv.{displayLevel}
          </span>
          <span className="text-xs text-foreground/50 font-medium">
            {displayXp.toLocaleString()} / {needed.toLocaleString()} XP
          </span>
        </div>
        <span className="text-xs text-foreground/40 font-medium">
          총 {player.totalXp.toLocaleString()} XP
        </span>
      </div>

      {/* XP 바 */}
      <div className="w-full h-3 bg-board rounded-full overflow-hidden shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
