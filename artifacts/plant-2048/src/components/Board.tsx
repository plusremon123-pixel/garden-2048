/* ============================================================
 * Board.tsx
 * 4×4 게임 보드 컴포넌트
 *
 * - 빈 셀 배경 그리드
 * - 활성 타일 + 사라지는 타일(그레이브야드) 렌더링
 * - 터치 스와이프 이벤트 처리
 * ============================================================ */

import { useRef, useEffect } from "react";
import { Tile } from "./Tile";
import { TileData } from "@/utils/gameUtils";

interface BoardProps {
  tiles: TileData[];
  graveyard: TileData[];
  onSwipe: (dir: "UP" | "DOWN" | "LEFT" | "RIGHT") => void;
  themeId?: string;
}

export function Board({ tiles, graveyard, onSwipe, themeId = "plant" }: BoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);

  /* ── 터치 스와이프 처리 ─────────────────────────────── */
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    /* 보드 위에서는 페이지 스크롤 방지 */
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!startX || !startY) return;

      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      /* 최소 스와이프 거리: 40px */
      if (Math.max(absDx, absDy) > 40) {
        if (absDx > absDy) {
          onSwipe(dx > 0 ? "RIGHT" : "LEFT");
        } else {
          onSwipe(dy > 0 ? "DOWN" : "UP");
        }
      }

      startX = 0;
      startY = 0;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [onSwipe]);

  return (
    <div className="relative w-full max-w-[500px] aspect-square mx-auto">
      <div
        ref={boardRef}
        className="absolute inset-0 bg-board rounded-2xl p-[var(--board-gap)] shadow-inner touch-none"
      >
        {/* 빈 셀 배경 그리드 */}
        <div className="grid grid-cols-4 grid-rows-4 w-full h-full gap-[var(--board-gap)]">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={`cell-${i}`} className="bg-cell rounded-xl md:rounded-2xl" />
          ))}
        </div>

        {/* 합쳐지는 중인 타일 (뒤에 렌더, z-0) */}
        {graveyard.map((tile) => (
          <Tile key={tile.id} data={tile} themeId={themeId} isGhost />
        ))}

        {/* 활성 타일 */}
        {tiles.map((tile) => (
          <Tile key={tile.id} data={tile} themeId={themeId} />
        ))}
      </div>
    </div>
  );
}
