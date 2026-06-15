import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  ENDLESS_CONFIGS,
  loadEndlessSave,
  type EndlessDifficulty,
} from "@/utils/endlessModeData";
import { useTranslation } from "@/i18n";
import type { Season } from "@/utils/seasonData";
import { assetUrl } from "@/utils/assets";

const DESIGN_W = 928;
const DESIGN_H = 1694;

type Layout = {
  offsetX: number;
  offsetY: number;
  renderW: number;
  renderH: number;
  scale: number;
};

type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

const DIFF_ORDER: EndlessDifficulty[] = ["easy", "normal", "hard"];

const DIFF_PANEL: Record<EndlessDifficulty, string> = {
  easy: assetUrl("/endless-select/easy-panel.png"),
  normal: assetUrl("/endless-select/normal-panel.png"),
  hard: assetUrl("/endless-select/hard-panel.png"),
};

const DIFF_PLANT: Record<EndlessDifficulty, string> = {
  easy: assetUrl("/endless-select/plant-sprout.png"),
  normal: assetUrl("/endless-select/plant-sunflower.png"),
  hard: assetUrl("/endless-select/plant-cactus.png"),
};

const DIFF_CHECK: Record<EndlessDifficulty, string> = {
  easy: assetUrl("/endless-select/check-easy.png"),
  normal: assetUrl("/endless-select/check-normal.png"),
  hard: assetUrl("/endless-select/check-hard.png"),
};

const DIFF_RECT: Record<EndlessDifficulty, Rect> = {
  easy: { x: 200, y: 473, w: 527, h: 208 },
  normal: { x: 200, y: 681, w: 527, h: 214 },
  hard: { x: 200, y: 895, w: 527, h: 199 },
};

const CHECK_RECT: Record<EndlessDifficulty, Rect> = {
  easy: { x: 569, y: 528, w: 96, h: 96 },
  normal: { x: 568, y: 728, w: 92, h: 92 },
  hard: { x: 570, y: 939, w: 96, h: 96 },
};

const TEXT_COLOR: Record<EndlessDifficulty, string> = {
  easy: "#2f7f24",
  normal: "#c15d11",
  hard: "#9f2c22",
};

const PLANT_RECT: Record<EndlessDifficulty, Rect> = {
  easy: { x: 294, y: 537, w: 67, h: 68 },
  normal: { x: 288, y: 720, w: 82, h: 108 },
  hard: { x: 288, y: 925, w: 78, h: 110 },
};

const DIFF_TEXT_POS: Record<EndlessDifficulty, { titleTop: string; sizeTop: string }> = {
  easy: { titleTop: "34%", sizeTop: "70%" },
  normal: { titleTop: "34%", sizeTop: "62%" },
  hard: { titleTop: "34%", sizeTop: "70%" },
};

interface EndlessDifficultyModalProps {
  onStart: (difficulty: EndlessDifficulty) => void;
  onContinue: (difficulty: EndlessDifficulty) => void;
  onClose: () => void;
  season?: Season;
}

function calcLayout(containerW: number, containerH: number): Layout {
  const scale = Math.max(containerW / DESIGN_W, containerH / DESIGN_H);
  const renderW = DESIGN_W * scale;
  const renderH = DESIGN_H * scale;
  return {
    offsetX: (containerW - renderW) / 2,
    offsetY: (containerH - renderH) / 2,
    renderW,
    renderH,
    scale,
  };
}

function place(rect: Rect, layout: Layout): CSSProperties {
  return {
    position: "absolute",
    left: layout.offsetX + rect.x * layout.scale,
    top: layout.offsetY + rect.y * layout.scale,
    width: rect.w * layout.scale,
    height: rect.h * layout.scale,
  };
}

function placeSafe(rect: Rect, layout: Layout, minLeft = 12, minTop = 12): CSSProperties {
  const left = layout.offsetX + rect.x * layout.scale;
  const top = layout.offsetY + rect.y * layout.scale;
  return {
    position: "absolute",
    left: Math.max(minLeft, left),
    top: Math.max(minTop, top),
    width: rect.w * layout.scale,
    height: rect.h * layout.scale,
  };
}

function fitFont(px: number, layout: Layout, min = 12) {
  return `${Math.max(min, px * layout.scale)}px`;
}

function getSavedHighestTile(save: ReturnType<typeof loadEndlessSave>) {
  if (!save) return 0;

  const boardTiles = save.board
    .flat()
    .map((tile) => tile?.value ?? 0);
  const activeTiles = Object.values(save.activeTiles).map((tile) => tile.value);
  return Math.max(0, ...boardTiles, ...activeTiles);
}

function ImageButton({
  rect,
  src,
  alt,
  onClick,
  layout,
  safePosition = false,
  children,
  className = "",
  onPointerDown,
  onPointerUp,
  onPointerLeave,
}: {
  rect: Rect;
  src: string;
  alt: string;
  onClick: () => void;
  layout: Layout;
  safePosition?: boolean;
  children?: ReactNode;
  className?: string;
  onPointerDown?: () => void;
  onPointerUp?: () => void;
  onPointerLeave?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      className={`transition-transform active:scale-[0.985] ${className}`}
      style={{
        ...(safePosition ? placeSafe(rect, layout) : place(rect, layout)),
        border: "none",
        background: "transparent",
        padding: 0,
        cursor: "pointer",
        zIndex: 10,
      }}
      aria-label={alt}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "fill",
          display: "block",
          pointerEvents: "none",
        }}
      />
      {children}
    </button>
  );
}

export function EndlessDifficultyModal({
  onStart,
  onContinue,
  onClose,
}: EndlessDifficultyModalProps) {
  const { t } = useTranslation();
  const save = loadEndlessSave();
  const savedHighestTile = getSavedHighestTile(save);
  const savedPhase = save ? Math.min(save.claimedPhases.length + 1, 3) : 1;
  const rootRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<EndlessDifficulty>("normal");
  const [layout, setLayout] = useState<Layout>(() =>
    calcLayout(window.innerWidth, window.innerHeight),
  );
  const [pressedStart, setPressedStart] = useState(false);

  useEffect(() => {
    const recalc = () => {
      const el = rootRef.current;
      setLayout(
        calcLayout(el?.clientWidth ?? window.innerWidth, el?.clientHeight ?? window.innerHeight),
      );
    };

    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);

  const startGame = () => onStart(selected);

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 z-[140] overflow-hidden"
      style={{ background: "#8fcf61" }}
    >
      <img
        src={assetUrl("/endless-select/intro-bg-stone-calm.png")}
        alt=""
        draggable={false}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center center",
          pointerEvents: "none",
        }}
      />

      <ImageButton
        rect={{ x: 42, y: 46, w: 104, h: 104 }}
        src={assetUrl("/endless-select/back-normal.png")}
        alt="back"
        onClick={onClose}
        layout={layout}
        safePosition
      />

      <div
        style={{
          ...place({ x: 104, y: 150, w: 720, h: 236 }, layout),
          zIndex: 5,
          pointerEvents: "none",
        }}
      >
        <img
          src={assetUrl("/endless-select/title-blank.png")}
          alt=""
          draggable={false}
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            color: "#fff8e8",
            fontSize: fitFont(82, layout, 38),
            fontWeight: 1000,
            lineHeight: 1,
            textAlign: "center",
            letterSpacing: 0,
            textShadow:
              "0 3px 0 #5c2d0e, 0 -2px 0 #5c2d0e, 2px 0 0 #5c2d0e, -2px 0 0 #5c2d0e, 0 7px 12px rgba(66,31,8,0.28)",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `translateY(${8 * layout.scale}px)`,
          }}
        >
          {t("endless.title")}
        </div>
      </div>

      {DIFF_ORDER.map((diff) => {
        const config = ENDLESS_CONFIGS[diff];
        const textPos = DIFF_TEXT_POS[diff];
        return (
          <ImageButton
            key={diff}
            rect={DIFF_RECT[diff]}
            src={DIFF_PANEL[diff]}
            alt={t(`endless.diff.${diff}`)}
            onClick={() => setSelected(diff)}
            layout={layout}
          >
            <span
              style={{
                position: "absolute",
                left: "54%",
                top: textPos.titleTop,
                transform: "translate(-50%, -50%)",
                color: TEXT_COLOR[diff],
                fontSize: fitFont(43, layout, 22),
                fontWeight: 1000,
                lineHeight: 1,
                letterSpacing: 0,
                textShadow: "0 3px 0 rgba(255,255,255,0.82), 0 5px 8px rgba(99,50,11,0.14)",
                pointerEvents: "none",
                whiteSpace: "nowrap",
              }}
            >
              {t(`endless.diff.${diff}`)}
            </span>
            <span
              style={{
                position: "absolute",
                left: "54%",
                top: textPos.sizeTop,
                transform: "translate(-50%, -50%)",
                color: "#fff",
                fontSize: fitFont(21, layout, 13),
                fontWeight: 1000,
                lineHeight: 1,
                textShadow: "0 2px 0 rgba(70,42,12,0.45)",
                pointerEvents: "none",
                whiteSpace: "nowrap",
              }}
            >
              {config.boardSize}×{config.boardSize}
            </span>
          </ImageButton>
        );
      })}

      {DIFF_ORDER.map((diff) => (
        <img
          key={`plant-${diff}`}
          src={DIFF_PLANT[diff]}
          alt=""
          draggable={false}
          style={{
            ...place(PLANT_RECT[diff], layout),
            zIndex: 15,
            objectFit: "contain",
            pointerEvents: "none",
          }}
        />
      ))}

      {DIFF_ORDER.map((diff) =>
        selected === diff ? (
          <img
            key={`check-${diff}`}
            src={DIFF_CHECK[diff]}
            alt=""
            draggable={false}
            style={{
              ...place(CHECK_RECT[diff], layout),
              zIndex: 16,
              objectFit: "contain",
              pointerEvents: "none",
              filter: "drop-shadow(0 3px 4px rgba(80,60,20,0.2))",
            }}
          />
        ) : null,
      )}

      <ImageButton
        rect={{ x: 163, y: 1125, w: 602, h: 187 }}
        src={assetUrl("/endless-select/start-blank.png")}
        alt={t("endless.start")}
        onClick={startGame}
        layout={layout}
        onPointerDown={() => setPressedStart(true)}
        onPointerUp={() => setPressedStart(false)}
        onPointerLeave={() => setPressedStart(false)}
        className={pressedStart ? "scale-[0.975]" : ""}
      >
        <span
          style={{
            position: "absolute",
            inset: 0,
            color: "#fff",
            fontSize: fitFont(58, layout, 28),
            fontWeight: 1000,
            lineHeight: 1,
            letterSpacing: 0,
            textShadow:
              "0 3px 0 #88441a, 0 -1px 0 #88441a, 2px 0 0 #88441a, -2px 0 0 #88441a, 0 6px 8px rgba(111,50,13,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: 18 * layout.scale,
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          START
        </span>
      </ImageButton>

      {save && (
        <div style={{ ...place({ x: 146, y: 1336, w: 637, h: 199 }, layout), zIndex: 12 }}>
          <img
            src={assetUrl("/endless-select/saved-panel-blank.png")}
            alt=""
            draggable={false}
            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
          />
          <img
            src={DIFF_PLANT[save.difficulty]}
            alt=""
            draggable={false}
            style={{
              position: "absolute",
              left: "6.8%",
              top: "25%",
              width: "13.5%",
              height: "54%",
              objectFit: "contain",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "16.2%",
              top: "16%",
              width: "48%",
              color: "#5b3518",
              fontWeight: 1000,
              fontSize: fitFont(21, layout, 11),
              lineHeight: 1.22,
              pointerEvents: "none",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {t("endless.savedGame")}
          </div>
          <div
            style={{
              position: "absolute",
              left: "16.2%",
              top: "45%",
              width: "49%",
              color: "#8b6540",
              fontWeight: 900,
              fontSize: fitFont(13, layout, 8),
              lineHeight: 1.45,
              pointerEvents: "none",
              whiteSpace: "normal",
            }}
          >
            <div>
              Stage {savedPhase} · {t(`endless.diff.${save.difficulty}`)}{" "}
              {ENDLESS_CONFIGS[save.difficulty].boardSize}×
              {ENDLESS_CONFIGS[save.difficulty].boardSize}
            </div>
            <div>
              {t("game.bestScore")}: {savedHighestTile.toLocaleString()} · {t("game.score")}:{" "}
              {save.score.toLocaleString()}
            </div>
          </div>
          <button
            onClick={() => onContinue(save.difficulty)}
            aria-label={t("endless.continue")}
            style={{
              position: "absolute",
              right: "7.2%",
              top: "15%",
              width: "25%",
              height: "30%",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "#fff",
              fontSize: fitFont(18, layout, 10),
              fontWeight: 1000,
              textShadow: "0 2px 0 rgba(51,101,18,0.5)",
              whiteSpace: "nowrap",
            }}
          >
            {t("endless.continue")}
          </button>
          <button
            onClick={startGame}
            aria-label={t("endless.restart")}
            style={{
              position: "absolute",
              right: "7.2%",
              bottom: "17%",
              width: "25%",
              height: "28%",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "#805022",
              fontSize: fitFont(16, layout, 10),
              fontWeight: 950,
              whiteSpace: "nowrap",
            }}
          >
            {t("endless.restart")}
          </button>
        </div>
      )}
    </div>
  );
}
