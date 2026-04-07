import { TileData } from "@/utils/gameUtils";
import { THEMES } from "@/utils/themes";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useTranslation } from "@/i18n";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TileProps {
  data: TileData;
  themeId?: string;
  isGhost?: boolean;
  selectMode?: boolean;
  onClick?: () => void;
}

export function Tile({
  data,
  themeId = "plant",
  isGhost = false,
  selectMode = false,
  onClick,
}: TileProps) {
  const { t } = useTranslation();

  // React CSS custom properties need to be casted
  const cssVars = {
    "--x": data.x,
    "--y": data.y,
  } as React.CSSProperties;

  /* ── 장애물 타일 렌더링 ────────────────────────────────── */
  if (data.tileType === "soil") {
    return (
      <div
        className={cn("tile-wrapper", isGhost && "z-0")}
        style={cssVars}
      >
        <div className="tile-inner bg-amber-800/75 text-amber-100">
          <span className="text-xl md:text-2xl leading-none">🪨</span>
          <span className="text-xs md:text-sm font-medium opacity-80 mt-0.5">{t("tile.soil")}</span>
        </div>
      </div>
    );
  }

  if (data.tileType === "thorn") {
    return (
      <div
        className={cn("tile-wrapper", isGhost && "z-0")}
        style={cssVars}
      >
        <div className="tile-inner bg-rose-800/75 text-rose-100">
          <span className="text-xl md:text-2xl leading-none">🌵</span>
          <span className="text-xs md:text-sm font-medium opacity-80 mt-0.5">{t("tile.thorn")}</span>
        </div>
      </div>
    );
  }

  /* ── 일반 숫자 타일 렌더링 ─────────────────────────────── */
  const theme = THEMES[themeId] || THEMES.plant;
  const style = theme.tiles[data.value] || theme.fallback;

  return (
    <div
      className={cn(
        "tile-wrapper",
        data.isNew && !isGhost && "tile-new",
        data.isMerged && !isGhost && "tile-merged",
        isGhost && "z-0",
        selectMode && !isGhost && "cursor-pointer",
      )}
      style={cssVars}
      onClick={!isGhost ? onClick : undefined}
    >
      <div
        className={cn(
          "tile-inner",
          style.bg,
          style.color,
          selectMode &&
            !isGhost &&
            "ring-2 ring-red-400/80 ring-offset-1 hover:ring-4 hover:brightness-95 transition-all",
        )}
      >
        <span className="text-xl md:text-2xl font-bold font-display leading-none">
          {data.value}
        </span>
      </div>
    </div>
  );
}
