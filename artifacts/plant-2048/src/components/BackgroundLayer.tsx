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

const FADE_MS = 400; /* 크로스페이드 지속시간 */

export function BackgroundLayer({ highestTile }: BackgroundLayerProps) {
  const initial = updateBackgroundByHighestTile(highestTile);

  /* 아래(이전) 레이어 — 항상 opacity 1로 남아있다가 전환 완료 후 교체 */
  const [bottom, setBottom]           = useState<BackgroundStageConfig>(initial);
  const [bottomFailed, setBottomFailed] = useState(false);

  /* 위(새) 레이어 — 전환 시 fade-in, 완료 후 null로 제거 */
  const [top, setTop]               = useState<BackgroundStageConfig | null>(null);
  const [topOpacity, setTopOpacity] = useState(0);
  const [topFailed, setTopFailed]   = useState(false);

  const prevNameRef = useRef(initial.name);
  const timerA = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerB = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const next = updateBackgroundByHighestTile(highestTile);
    if (next.name === prevNameRef.current) return;
    prevNameRef.current = next.name;

    /* 진행 중인 전환 취소 */
    if (timerA.current) clearTimeout(timerA.current);
    if (timerB.current) clearTimeout(timerB.current);

    /* 1) 새 이미지를 투명하게 위에 올림 */
    setTop(next);
    setTopFailed(false);
    setTopOpacity(0);

    /* 2) 한 프레임 후 fade-in 시작 */
    timerA.current = setTimeout(() => setTopOpacity(1), 30);

    /* 3) 전환 완료 후 — bottom을 새 이미지로 교체하고 top 제거 */
    timerB.current = setTimeout(() => {
      setBottom(next);
      setBottomFailed(false);
      setTop(null);
      setTopOpacity(0);
    }, FADE_MS + 50);

    return () => {
      if (timerA.current) clearTimeout(timerA.current);
      if (timerB.current) clearTimeout(timerB.current);
    };
  }, [highestTile]);

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none z-0"
      aria-hidden="true"
    >
      {/* ── 하단 레이어 (이전 이미지, 항상 표시) ────────── */}
      <LayerContent
        config={bottom}
        opacity={1}
        failed={bottomFailed}
        onError={() => setBottomFailed(true)}
      />

      {/* ── 상단 레이어 (새 이미지, 크로스페이드 중에만) ─── */}
      {top && (
        <LayerContent
          config={top}
          opacity={topOpacity}
          fadeDuration={FADE_MS}
          failed={topFailed}
          onError={() => setTopFailed(true)}
        />
      )}
    </div>
  );
}

/* ── 단일 레이어 렌더러 ──────────────────────────────────── */
interface LayerContentProps {
  config:      BackgroundStageConfig;
  opacity:     number;
  fadeDuration?: number;
  failed:      boolean;
  onError:     () => void;
}

function LayerContent({ config, opacity, fadeDuration = 0, failed, onError }: LayerContentProps) {
  return (
    <div
      className="absolute inset-0"
      style={{
        opacity,
        transition: fadeDuration > 0 ? `opacity ${fadeDuration}ms ease-in-out` : undefined,
      }}
    >
      {failed ? (
        <FallbackDisplay config={config} />
      ) : (
        <img
          key={config.name}
          src={`/backgrounds/${config.name}.png`}
          alt=""
          className="absolute bottom-0 left-1/2"
          style={{
            transform:       "translateX(-50%)",
            width:           config.width,
            maxHeight:       config.maxHeight,
            objectFit:       "contain",
            objectPosition:  "bottom center",
            display:         "block",
          }}
          onError={onError}
        />
      )}
    </div>
  );
}

/* ── Fallback: 이미지가 없을 때 gradient + 이모지 ─────── */
function FallbackDisplay({ config }: { config: BackgroundStageConfig }) {
  /* 이모지 크기: width 비율에 따라 동적 계산 (32% → 2rem, 100% → 6rem) */
  const widthNum  = parseInt(config.width);
  const emojiSize = `clamp(1.5rem, ${(widthNum / 100) * 10}vw, ${(widthNum / 100) * 6}rem)`;

  return (
    <>
      {/* 그라디언트 — 하단에서 위로 채워지며 단계마다 높이 증가 */}
      <div
        className="absolute inset-x-0 bottom-0 transition-all duration-500"
        style={{
          height: config.maxHeight,
          background: config.fallbackGradient,
        }}
      />
      {/* 이모지 — 단계마다 커짐 */}
      <div
        className="absolute bottom-0 left-1/2 flex items-end justify-center transition-all duration-500"
        style={{
          transform: "translateX(-50%)",
          width: config.width,
          paddingBottom: "4px",
          fontSize: emojiSize,
          lineHeight: 1,
          opacity: 0.55,
          userSelect: "none",
          filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.12))",
        }}
      >
        {config.fallbackEmoji}
      </div>
    </>
  );
}
