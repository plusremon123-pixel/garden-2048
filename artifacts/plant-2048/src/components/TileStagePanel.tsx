/* ============================================================
 * TileStagePanel.tsx
 * 최고 타일 단계에 따라 변하는 장식 패널
 *
 * variant="top"    → 게임 화면 상단 (전체 너비 배너)
 * variant="bottom" → 게임 화면 하단 (콘텐츠 영역 내 카드)
 *
 * highestTile이 바뀔 때마다 배경/텍스트가 전환되고
 * 살짝 확대되는 bump 애니메이션이 실행됩니다.
 * ============================================================ */

import { useEffect, useRef, useState } from "react";
import { getStage, type TileStage } from "@/utils/tileStages";

interface TileStagePanelProps {
  highestTile: number;
  variant: "top" | "bottom";
}

export function TileStagePanel({ highestTile, variant }: TileStagePanelProps) {
  const stage = getStage(highestTile);
  const [bumping, setBumping] = useState(false);
  const prevTileRef = useRef(highestTile);

  /* highestTile이 새 단계로 오르면 bump 애니메이션 실행 */
  useEffect(() => {
    const prev = getStage(prevTileRef.current);
    const next = getStage(highestTile);
    if (next.tile !== prev.tile) {
      setBumping(true);
    }
    prevTileRef.current = highestTile;
  }, [highestTile]);

  const handleAnimationEnd = () => setBumping(false);

  if (variant === "top") {
    return <TopPanel stage={stage} bumping={bumping} onAnimEnd={handleAnimationEnd} />;
  }
  return <BottomPanel stage={stage} bumping={bumping} onAnimEnd={handleAnimationEnd} />;
}

/* ── 상단 패널 (전체 너비 배너) ─────────────────────────── */
function TopPanel({
  stage,
  bumping,
  onAnimEnd,
}: {
  stage: TileStage;
  bumping: boolean;
  onAnimEnd: () => void;
}) {
  return (
    <div
      className={["w-full select-none overflow-hidden", bumping ? "stage-bump" : ""].join(" ")}
      onAnimationEnd={onAnimEnd}
      style={{ background: stage.bg }}
    >
      <div className="w-full max-w-[500px] mx-auto px-4 py-3 flex items-center gap-3">
        {/* 이모지 */}
        <span
          className="text-2xl shrink-0 leading-none"
          style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.15))" }}
        >
          {stage.emoji}
        </span>

        {/* 텍스트 */}
        <div className="flex flex-col min-w-0">
          <span
            className="text-sm font-display font-bold leading-tight truncate"
            style={{ color: stage.textColor }}
          >
            {stage.name}
          </span>
          <span
            className="text-[11px] font-medium leading-tight truncate"
            style={{ color: stage.subColor }}
          >
            {stage.description}
          </span>
        </div>

        {/* 타일 뱃지 */}
        <div className="ml-auto shrink-0">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              background: "rgba(0,0,0,0.12)",
              color: stage.textColor,
            }}
          >
            {stage.tile}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── 하단 패널 (콘텐츠 영역 내 둥근 카드) ──────────────── */
function BottomPanel({
  stage,
  bumping,
  onAnimEnd,
}: {
  stage: TileStage;
  bumping: boolean;
  onAnimEnd: () => void;
}) {
  return (
    <div
      className={[
        "mt-4 w-full rounded-2xl overflow-hidden select-none",
        bumping ? "stage-bump" : "",
      ].join(" ")}
      onAnimationEnd={onAnimEnd}
      style={{ background: stage.bgBottom, minHeight: "52px" }}
    >
      <div className="w-full px-4 py-3 flex items-center gap-3">
        {/* 이모지 */}
        <span
          className="text-xl shrink-0 leading-none"
          style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.12))" }}
        >
          {stage.emoji}
        </span>

        {/* 다음 목표 텍스트 */}
        <span
          className="text-xs font-bold leading-snug"
          style={{ color: stage.textColor }}
        >
          {stage.nextGoal}
        </span>
      </div>
    </div>
  );
}
