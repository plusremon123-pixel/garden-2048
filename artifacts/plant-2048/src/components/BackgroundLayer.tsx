/* ============================================================
 * BackgroundLayer.tsx
 * highestTile에 따라 배경 이미지가 바뀌는 레이어 컴포넌트
 *
 * 동작:
 *  - 게임 화면 뒤에 절대 위치로 렌더링 (z-index: 0)
 *  - UI/타일을 가리지 않음 (pointer-events: none)
 *  - 단계 변경 시 fade-out → 이미지 교체 → fade-in 전환
 *  - 이미지 로드 실패 시 CSS gradient + 이모지 fallback 표시
 *
 * 이미지 위치: /public/backgrounds/<name>.png
 * ============================================================ */

import { useState, useEffect, useRef } from "react";
import {
  updateBackgroundByHighestTile,
  type BackgroundStageConfig,
} from "@/utils/backgroundStages";

interface BackgroundLayerProps {
  highestTile: number;
}

export function BackgroundLayer({ highestTile }: BackgroundLayerProps) {
  const initial = updateBackgroundByHighestTile(highestTile);

  /* 현재 화면에 표시 중인 단계 설정 */
  const [current, setCurrent] = useState<BackgroundStageConfig>(initial);
  /* crossfade용 불투명도 (0 → 1) */
  const [opacity, setOpacity] = useState(1);
  /* 이미지 로드 실패 여부 */
  const [imgFailed, setImgFailed] = useState(false);

  const prevNameRef = useRef(initial.name);
  const timerA = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerB = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const next = updateBackgroundByHighestTile(highestTile);
    if (next.name === prevNameRef.current) return;

    /* 1) 페이드 아웃 */
    setOpacity(0);

    /* 2) 페이드 아웃 완료 후 이미지 교체 */
    timerA.current = setTimeout(() => {
      setCurrent(next);
      setImgFailed(false);
      prevNameRef.current = next.name;

      /* 3) 다음 프레임에서 페이드 인 시작 */
      timerB.current = setTimeout(() => setOpacity(1), 30);
    }, 280); /* fade-out 지속시간과 일치 */

    return () => {
      if (timerA.current) clearTimeout(timerA.current);
      if (timerB.current) clearTimeout(timerB.current);
    };
  }, [highestTile]);

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none z-0"
      aria-hidden="true"
      style={{
        opacity,
        transition: "opacity 280ms ease-in-out",
      }}
    >
      {imgFailed ? (
        /* ── fallback: CSS gradient + 이모지 ─────────────── */
        <FallbackDisplay config={current} />
      ) : (
        /* ── 실제 배경 이미지 ─────────────────────────────── */
        <img
          key={current.name} /* key 변경 → 이미지 재로드 */
          src={`/backgrounds/${current.name}.png`}
          alt=""
          className="absolute bottom-0 left-1/2"
          style={{
            transform: "translateX(-50%)",
            width: current.width,
            maxHeight: current.maxHeight,
            objectFit: "contain",
            objectPosition: "bottom center",
            display: "block",
          }}
          onError={() => setImgFailed(true)}
        />
      )}
    </div>
  );
}

/* ── Fallback: 이미지가 없을 때 gradient + 이모지 ─────── */
function FallbackDisplay({ config }: { config: BackgroundStageConfig }) {
  return (
    <>
      {/* gradient 배경 */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: config.maxHeight,
          background: config.fallbackGradient,
        }}
      />
      {/* 이모지 */}
      <div
        className="absolute bottom-4 left-1/2"
        style={{
          transform: "translateX(-50%)",
          width: config.width,
          textAlign: "center",
          fontSize: "clamp(2rem, 8vw, 4rem)",
          lineHeight: 1,
          opacity: 0.35,
          userSelect: "none",
        }}
      >
        {config.fallbackEmoji}
      </div>
    </>
  );
}
