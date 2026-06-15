/* ============================================================
 * FrontScreen.tsx
 * 홈 화면 — 배경 콘텐츠 영역 기준 좌표계 + 에셋 비율 유지
 * ============================================================ */

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { PlayerData } from "@/utils/playerData";
import {
  MissionState, MissionId, DAILY_MISSIONS,
  WeeklyMissionState, WeeklyMissionId, WEEKLY_MISSIONS,
} from "@/utils/missionData";
import { getAdCoinState, watchAdForCoins } from "@/utils/adService";
import { showBanner, removeBanner } from "@/utils/adProvider";
import { type Inventory, type ShopItemId } from "@/utils/shopData";
import type { SubscriptionState } from "@/utils/subscriptionData";
import type { GameSettings } from "@/hooks/useSettings";
import { useTranslation } from "@/i18n";
import {
  type Season,
  getSeason,
  SEASON_BG,
  SEASON_PULSE_COLOR,
} from "@/utils/seasonData";
import { SEASON_THEMES, type SeasonTheme } from "@/utils/seasonTheme";
import { assetUrl }              from "@/utils/assets";
import { SeasonTransition }       from "./modals/SeasonTransition";
import { ItemsModal }             from "./modals/ItemsModal";
import { CardCollectionModal }    from "./modals/CardCollectionModal";
import { HomeShopModal }          from "./modals/HomeShopModal";
import { SettingsModal }          from "./modals/SettingsModal";
import { PremiumPassModal }       from "./modals/PremiumPassModal";
import { EndlessDifficultyModal } from "./modals/EndlessDifficultyModal";
import type { EndlessDifficulty } from "@/utils/endlessModeData";
import { TutorialModal }          from "./TutorialModal";

/* ============================================================
 * Design constants
 * ============================================================ */
const DESIGN_W = 1120;
const DESIGN_H = 2048;

/* ── Background layout (home-bg.svg fills 100% × 100% of container) ── */
interface BgLayout { offsetX: number; offsetY: number; renderW: number; renderH: number; containerW: number; containerH: number }

function toRenderPoint(designX: number, designY: number, bg: BgLayout) {
  const scaleX = bg.renderW / DESIGN_W;
  const scaleY = bg.renderH / DESIGN_H;
  return { rx: bg.offsetX + designX * scaleX, ry: bg.offsetY + designY * scaleY, scaleX, scaleY };
}

/* ── Stage node template (center anchor in design space) ────── */
type StageNodeTemplate = {
  stage:   number;
  cx:      number;
  cy:      number;
  rx:      number;
  ry:      number;
  offsetX?: number;
  offsetY?: number;
};

/* 10개 노드 — 사용자 지정 SVG ellipse 중심 기준 */
/* stage 진행 방향: 위 → 아래 */
const STAGE_NODE_TEMPLATES: StageNodeTemplate[] = [
  { stage:  1, cx: 519.6, cy:  581.5, rx:  85.1, ry: 68.9 },
  { stage:  2, cx: 627.0, cy:  669.8, rx:  85.1, ry: 68.9 },
  { stage:  3, cx: 604.1, cy:  785.8, rx:  97.2, ry: 78.6 },
  { stage:  4, cx: 494.2, cy:  893.4, rx:  97.2, ry: 78.6 },
  { stage:  5, cx: 595.0, cy: 1007.7, rx:  99.0, ry: 80.4 },
  { stage:  6, cx: 705.4, cy: 1132.2, rx: 100.8, ry: 81.6 },
  { stage:  7, cx: 781.5, cy: 1272.4, rx: 106.8, ry: 86.4 },
  { stage:  8, cx: 697.6, cy: 1439.9, rx:  92.9, ry: 61.7 },
  { stage:  9, cx: 558.2, cy: 1548.1, rx: 108.0, ry: 71.9 },
  { stage: 10, cx: 506.3, cy: 1686.0, rx: 114.1, ry: 75.6 },
];

const LEVELS_PER_PAGE = 10;
const MAX_PAGES       = 5;

/* ── Menu data ─────────────────────────────────────────────── */
interface MenuItemDef {
  key:         string;
  x:           number;
  y:           number;
  iconPng:     string;  // PNG 아이콘 경로
  bgPng:       string;  // PNG 카드 배경 경로
  bgColor:     string;  // 카드 배경색
  textColor:   string;  // 라벨 텍스트 색상
  shadowColor?: string; // 하단 3D 쉐도우 색 (없으면 bgColor 기반 자동)
}

/* ── 계절별 메뉴 카드 색상 ────────────────────────────────── */
const SEASON_MENU_PALETTE: Record<Season, { bg: string; text: string; shadow: string }> = {
  // 봄: 벚꽃 핑크+연두 배경 → 따뜻한 아이보리 크림
  spring: { bg: "#F7EED8", text: "#5A3210", shadow: "rgba(90,50,16,0.50)"  },
  // 여름: 선명한 초록+하늘+해바라기 배경 → 따뜻한 선샤인 크림
  summer: { bg: "#FFF8CA", text: "#5A3C00", shadow: "rgba(90,60,0,0.55)"   },
  // 가을: 짙은 주황/황금 단풍 배경 → 부드러운 황금 크림 (배경보다 밝고 채도 낮게)
  autumn: { bg: "#F5E0A8", text: "#5A2800", shadow: "rgba(90,40,0,0.55)"   },
  // 겨울: 흰눈+연한 파랑 배경 → 아이시 화이트 (배경보다 밝고 따뜻)
  winter: { bg: "#EDF4FB", text: "#1A3858", shadow: "rgba(26,56,88,0.45)"  },
};

/* ── 계절별 START 버튼 CSS filter
 *  원본 SVG 황금/앰버(hue≈38°) 기준 계절 보정
 */
const SEASON_START_FILTER: Record<Season, string> = {
  spring: "saturate(1.05) brightness(1.03)",
  summer: "saturate(1.15) brightness(1.06)",
  autumn: "hue-rotate(-25deg) saturate(1.40) brightness(0.95)",
  winter: "hue-rotate(175deg) saturate(0.80) brightness(1.10)",
};

/* ── 계절별 타이틀 CSS filter ───────────────────────────── */
const SEASON_TITLE_FILTER: Record<Season, string> = {
  spring: "none",                                                         // 원본 유지
  summer: "saturate(1.2) brightness(1.05)",                              // 따뜻한 골드 강조
  autumn: "sepia(0.30) saturate(1.5) hue-rotate(-15deg)",               // 주황-갈색
  winter: "saturate(0.50) hue-rotate(195deg) brightness(1.10)",         // 쿨 블루
};

type NodeStatus = "done" | "current" | "available" | "locked";

/* ── Active modal type ─────────────────────────────────────── */
type ActiveModal = "items" | "cards" | "shop" | "settings" | "premium" | "endless" | null;

/* ── Props ─────────────────────────────────────────────────── */
interface FrontScreenProps {
  player:                 PlayerData;
  selectedThemeId?:       string;
  onSelectTheme?:         (id: string) => void;
  onStartGame:            () => void;
  missions?:              MissionState[];
  onClaimMission?:        (id: MissionId) => number;
  weeklyMissions?:        WeeklyMissionState[];
  onClaimWeeklyMission?:  (id: WeeklyMissionId) => number;
  onEarnCoins?:           (amount: number) => void;
  onAdWatched?:           () => void;
  inventory?:             Inventory;
  onBuyItem?:             (id: ShopItemId, cost: number) => boolean;
  settings?:              GameSettings;
  onToggleSetting?:       (key: keyof GameSettings) => void;
  isPremiumActive?:       boolean;
  subscriptionState?:     SubscriptionState;
  onBuyPremium?:          () => Promise<void>;
  onStartEndless?:        (difficulty: EndlessDifficulty, resume: boolean) => void;
}

const DEFAULT_SETTINGS: GameSettings = {
  sound: true, vibration: true, animation: true, notifications: false,
};

/* ============================================================
 * FrontScreen
 * ============================================================ */
export function FrontScreen({
  player, onStartGame,
  missions = [], onClaimMission,
  weeklyMissions = [], onClaimWeeklyMission,
  onEarnCoins, onAdWatched,
  inventory, onBuyItem,
  settings = DEFAULT_SETTINGS, onToggleSetting,
  isPremiumActive = false, subscriptionState, onBuyPremium,
  onStartEndless,
}: FrontScreenProps) {
  const { t } = useTranslation();
  const containerRef                        = useRef<HTMLDivElement>(null);
  const [bg, setBg]                         = useState<BgLayout>({ offsetX: 0, offsetY: 0, renderW: 0, renderH: 0, containerW: 0, containerH: 0 });
  const [showMissionModal,    setShowMissionModal]    = useState(false);
  const [activeModal,         setActiveModal]         = useState<ActiveModal>(null);
  const [showTutorialReplay,  setShowTutorialReplay]  = useState(false);
// ── 계절 판별 — clearedLevel+1 = 플레이어가 현재 있는 stage 기준 ──
  const season: Season = getSeason(Math.max(1, player.clearedLevel + 1));

  /* ── 계절 전환 애니메이션 ───────────────────────────────────────────
     localStorage 에 마지막으로 머물렀던 계절을 저장하고, FrontScreen이
     마운트되거나 clearedLevel 변경으로 season이 바뀌면 1회 재생한다.
     (초기 진입 시에는 재생하지 않고 현재 계절만 저장) */
  const SEASON_LAST_KEY = "plant2048_last_season";
  const [seasonTransition, setSeasonTransition] =
    useState<{ from: Season; to: Season } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(SEASON_LAST_KEY) as Season | null;
    if (!stored) {
      localStorage.setItem(SEASON_LAST_KEY, season);
      return;
    }
    if (stored !== season) {
      setSeasonTransition({ from: stored, to: season });
    }
  }, [season]);

  const handleSeasonTransitionDone = () => {
    setSeasonTransition((cur) => {
      if (cur) localStorage.setItem(SEASON_LAST_KEY, cur.to);
      return null;
    });
  };

  /* 컨테이너 크기 추적 → BgLayout 업데이트 (cover 모드 기준) */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      // cover: 이미지 비율을 유지하면서 컨테이너를 꽉 채우는 scale 계산
      const scaleX = width  / DESIGN_W;
      const scaleY = height / DESIGN_H;
      const scale  = Math.max(scaleX, scaleY); // cover = 큰 쪽 기준
      const renderW = DESIGN_W * scale;
      const renderH = DESIGN_H * scale;
      // 수평: 중앙 정렬 / 수직: top 정렬 (하단 스테이지 잘림 방지)
      const offsetX = (width  - renderW) / 2;
      const offsetY = Math.max(0, (height - renderH) / 2); // 위쪽 기준 정렬
      setBg({ offsetX, offsetY, renderW, renderH, containerW: width, containerH: height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const closeModal = () => setActiveModal(null);

  const completedDaily  = missions.filter((m) => m.status === "complete").length;
  const completedWeekly = weeklyMissions.filter((m) => m.status === "complete").length;
  const missionBadge    = completedDaily + completedWeekly;

  /* 노드 클릭 */
  const handleNodeSelect = (level: number) => {
    const status: NodeStatus =
      level <= player.clearedLevel      ? "done"      :
      level === player.clearedLevel + 1 ? "current"   :
      level === player.clearedLevel + 2 ? "available" : "locked";
    if (status === "current") onStartGame();
  };

  /* 메뉴 데이터 — 22.svg 디자인 좌표 기준 (1120×2048)
   * textTopRatio: SVG 텍스트 시작 y (카드 공간 기준, 5px 여유) / 179
   *   mission/card: minTextY≈289~502, card-rel≈123, ratio≈0.689 → safe 0.65
   *   infinite:     minTextY≈720,    card-rel≈128, ratio≈0.717 → safe 0.68
   *   shop:         minTextY≈294,    card-rel≈128, ratio≈0.717 → safe 0.68
   *   settings:     minTextY≈502,    card-rel≈123, ratio≈0.687 → safe 0.65
   *   subscribe:    minTextY≈722,    card-rel≈130, ratio≈0.726 → safe 0.69
   */
  const mp = SEASON_MENU_PALETTE[season];
  const normalMenuBg = assetUrl("/ui/home-final/menu-bg/normal.png");
  const purpleMenuBg = assetUrl("/ui/home-final/menu-bg/purple.png");
  const goldMenuBg   = assetUrl("/ui/home-final/menu-bg/gold.png");
  const leftMenuItems: MenuItemDef[] = [
    { key: "mission",  x:  37, y: 166, iconPng: assetUrl("/ui/home-final/icons/menu-mission.png"),  bgPng: normalMenuBg, bgColor: mp.bg, textColor: mp.text, shadowColor: mp.shadow },
    { key: "card",     x:  37, y: 379, iconPng: assetUrl("/ui/home-final/icons/menu-card.png"),     bgPng: normalMenuBg, bgColor: mp.bg, textColor: mp.text, shadowColor: mp.shadow },
    { key: "infinite", x:  37, y: 592, iconPng: assetUrl("/ui/home-final/icons/menu-infinite.png"), bgPng: purpleMenuBg, bgColor: "#7D37B7", textColor: "#FFFFFF", shadowColor: "rgba(87,35,133,0.55)" },
  ];
  const rightMenuItems: MenuItemDef[] = [
    { key: "shop",     x: 906, y: 166, iconPng: assetUrl("/ui/home-final/icons/menu-shop.png"),     bgPng: normalMenuBg, bgColor: mp.bg, textColor: mp.text, shadowColor: mp.shadow },
    { key: "settings", x: 906, y: 379, iconPng: assetUrl("/ui/home-final/icons/menu-settings.png"), bgPng: normalMenuBg, bgColor: mp.bg, textColor: mp.text, shadowColor: mp.shadow },
    ...(!isPremiumActive ? [
      { key: "subscribe", x: 906, y: 592, iconPng: assetUrl("/ui/home-final/icons/menu-subscribe.png"), bgPng: goldMenuBg, bgColor: "#FFAE00", textColor: "#6D1D00", shadowColor: "rgba(239,120,0,0.65)" },
    ] : []),
  ];

  const menuLabel: Record<string, string> = {
    mission:   t("menu.missions"),
    card:      t("menu.cards"),
    infinite:  t("menu.endless"),
    shop:      t("menu.shop"),
    settings:  t("menu.settings"),
    subscribe: isPremiumActive ? t("menu.premium") : t("menu.subscribe"),
  };

  const menuBadge: Partial<Record<string, number>> = {
    mission: missionBadge > 0 ? missionBadge : undefined,
  };

  const menuOnClick: Record<string, () => void> = {
    mission:   () => setShowMissionModal(true),
    card:      () => setActiveModal("cards"),
    infinite:  () => setActiveModal("endless"),
    shop:      () => setActiveModal("shop"),
    settings:  () => setActiveModal("settings"),
    subscribe: () => setActiveModal("premium"),
  };

  const ready = bg.renderW > 0 && bg.renderH > 0;

  return (
    <div ref={containerRef} className="relative h-[100dvh] w-full overflow-hidden">

      {/* ── 계절 전환 애니메이션 오버레이 ────────────────────────────── */}
      {seasonTransition && (
        <SeasonTransition
          from={seasonTransition.from}
          to={seasonTransition.to}
          onDone={handleSeasonTransitionDone}
        />
      )}

      {/* ── 튜토리얼 다시 보기 (설정에서 열릴 때) ──────────────────── */}
      {showTutorialReplay && (
        <TutorialModal onDone={() => setShowTutorialReplay(false)} />
      )}

{/* ── 배경 이미지 — 계절(season)에 따라 새 정원 PNG로 자동 교체 ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:    `url(${SEASON_BG[season]})`,
          backgroundSize:     "cover",
          backgroundPosition: "center top",
          backgroundRepeat:   "no-repeat",
          zIndex: 0,
          opacity:            1,
          transition:         "background-image 0.6s ease, opacity 0.6s ease",
        }}
      />

      {/* ── 상단 HUD 바 (TopHudBar) — bg 렌더 불필요, 항상 표시 ── */}
      <TopHudBar player={player} season={season} />

      {/* ── 좌표 기반 UI (배경 렌더 영역 기준) ───────────────── */}
      {ready && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>

          {/* ── 타이틀 ──────────────────────────────────────── */}
          <HomeTitle bg={bg} season={season} />


          {/* ── 메뉴 버튼 ────────────────────────────────────── */}
          {[...leftMenuItems, ...rightMenuItems].map((item) => (
            <HomeMenuButton
              key={item.key}
              item={item}
              label={menuLabel[item.key] ?? item.key}
              badge={menuBadge[item.key]}
              bg={bg}
              onClick={menuOnClick[item.key]}
            />
          ))}

          {/* ── 스테이지 노드 맵 ─────────────────────────────── */}
          <HomeStageMap
            clearedLevel={player.clearedLevel}
            bg={bg}
            season={season}
            onSelectLevel={handleNodeSelect}
          />

          {/* ── START 버튼 ───────────────────────────────────── */}
          <StartButton bg={bg} season={season} onClick={onStartGame} />

        </div>
      )}

      {/* ── 하단 광고 (portal) ──────────────────────────────── */}
      {createPortal(
        <div className="fixed bottom-0 left-0 right-0 z-[30]">
          <AdBanner />
        </div>,
        document.body,
      )}

      {/* ── 미션 모달 ─────────────────────────────────────────── */}
      {showMissionModal && (
        <MissionModal
          missions={missions}
          weeklyMissions={weeklyMissions}
          onClaimDaily={onClaimMission}
          onClaimWeekly={onClaimWeeklyMission}
          onEarnCoins={onEarnCoins}
          onAdWatched={onAdWatched}
          onClose={() => setShowMissionModal(false)}
          season={season}
        />
      )}


      {activeModal === "cards" && (
        <CardCollectionModal
          player={player}
          subscriptionState={{ isPremium: isPremiumActive, trialUsed: false, trialActive: false, trialExpiry: null }}
          onClose={closeModal}
          onOpenPremium={() => setActiveModal("premium")}
          season={season}
        />
      )}

      {activeModal === "premium" && (
        <PremiumPassModal
          onBuy={async () => { await onBuyPremium?.(); closeModal(); }}
          onClose={closeModal}
          subscriptionState={subscriptionState}
          season={season}
        />
      )}

      {activeModal === "endless" && (
        <EndlessDifficultyModal
          onStart={(diff) => { closeModal(); onStartEndless?.(diff, false); }}
          onContinue={(diff) => { closeModal(); onStartEndless?.(diff, true); }}
          onClose={closeModal}
          season={season}
        />
      )}

      {activeModal === "items" && inventory && (
        <ItemsModal inventory={inventory} onClose={closeModal} season={season} />
      )}

      {activeModal === "shop" && inventory && onBuyItem && (
        <HomeShopModal
          player={player}
          inventory={inventory}
          onBuyItem={onBuyItem}
          onEarnCoins={onEarnCoins}
          onClose={closeModal}
          isPremiumActive={isPremiumActive}
          onOpenPremium={() => setActiveModal("premium")}
          season={season}
        />
      )}

      {activeModal === "settings" && onToggleSetting && (
        <SettingsModal
          settings={settings}
          onToggle={onToggleSetting}
          onClose={closeModal}
          onShowTutorial={() => { closeModal(); setShowTutorialReplay(true); }}
          subscriptionState={subscriptionState}
          onBuyPremium={onBuyPremium}
          season={season}
        />
      )}

    </div>
  );
}

/* ============================================================
 * HomePathOverlay — 실제 노드 좌표를 따라가는 공용 길 레이어
 * ============================================================ */
function HomePathOverlay({ bg, season }: { bg: BgLayout; season: Season }) {
  const pathD = STAGE_NODE_TEMPLATES
    .map((node, index) => `${index === 0 ? "M" : "L"} ${node.cx} ${node.cy}`)
    .join(" ");
  const palette: Record<Season, { base: string; edge: string; shade: string; opacity: number }> = {
    spring: { base: "#F6D38F", edge: "#FFF2C8", shade: "#C78842", opacity: 0.92 },
    summer: { base: "#F3C878", edge: "#FFF0B8", shade: "#BD7F31", opacity: 0.91 },
    autumn: { base: "#E5AA60", edge: "#FFE0A3", shade: "#9A5724", opacity: 0.93 },
    winter: { base: "#DDE8EF", edge: "#FFFFFF", shade: "#91A8B6", opacity: 0.88 },
  };
  const tone = palette[season];

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${DESIGN_W} ${DESIGN_H}`}
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        left: bg.offsetX,
        top: bg.offsetY,
        width: bg.renderW,
        height: bg.renderH,
        zIndex: 4,
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      <path
        d={pathD}
        fill="none"
        stroke="rgba(108,72,32,0.20)"
        strokeWidth={138}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.65}
        transform="translate(0 18)"
      />
      <path
        d={pathD}
        fill="none"
        stroke={tone.shade}
        strokeWidth={128}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.58}
      />
      <path
        d={pathD}
        fill="none"
        stroke={tone.edge}
        strokeWidth={112}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.76}
      />
      <path
        d={pathD}
        fill="none"
        stroke={tone.base}
        strokeWidth={94}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={tone.opacity}
      />
      <path
        d={pathD}
        fill="none"
        stroke="rgba(255,255,255,0.44)"
        strokeWidth={18}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="1 64"
        opacity={0.84}
      />
    </svg>
  );
}

/* ============================================================
 * HomeTitle — title.svg, width 기준 비율 유지
 * ============================================================ */
function HomeTitle({ bg, season }: { bg: BgLayout; season: Season }) {
  const { ry, scaleX } = toRenderPoint(388, 126, bg);
  const w = 390 * scaleX;
  return (
    <img
      src={assetUrl("/ui/home-final/title-garden2048.png")}
      alt="Garden 2048"
      draggable={false}
      style={{
        position:      "absolute",
        left:          "50%",
        transform:     "translateX(-50%)",
        top:           ry,
        width:         w,
        height:        "auto",
        objectFit:     "contain",
        zIndex:        10,
        pointerEvents: "none",
        filter:        season === "spring" ? "none" : SEASON_TITLE_FILTER[season],
        transition:    "filter 0.6s ease",
      }}
    />
  );
}

/* ============================================================
 * TopHudBar — 홈 전체폭 상단 HUD (Gardenscapes / Royal Match 스타일)
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  ❤️ ❤️ ❤️ ❤️ ❤️  (+N)          🪙  12,345           │
 * └─────────────────────────────────────────────────────────┘
 *
 * - position: absolute top-0, full-width (CSS 기준 — bg 좌표 불필요)
 * - 계절 팔레트 그라디언트 + frosted-glass backdrop-blur
 * - 하단 3px 선 + 그림자로 게임 영역과 명확히 구분
 * - safe-area-inset-top 지원 (아이폰 노치/다이나믹 아일랜드)
 * ============================================================ */
function TopHudBar({ player, season }: { player: PlayerData; season: Season }) {
  const palette   = SEASON_MENU_PALETTE[season];
  const lives     = player.lives;
  const MAX_SLOTS = 5;
  const filled    = Math.min(lives, MAX_SLOTS);
  const bonus     = Math.max(0, lives - MAX_SLOTS);

  const frameTone: Record<Season, { line: string; shadow: string; shine: string }> = {
    spring: { line: "#D5A968", shadow: "rgba(96,58,18,0.18)", shine: "rgba(255,250,238,0.94)" },
    summer: { line: "#D8B34E", shadow: "rgba(104,78,12,0.18)", shine: "rgba(255,253,226,0.94)" },
    autumn: { line: "#C98545", shadow: "rgba(112,50,13,0.20)", shine: "rgba(255,244,225,0.94)" },
    winter: { line: "#AFC7D8", shadow: "rgba(39,76,105,0.16)", shine: "rgba(246,252,255,0.94)" },
  };
  const tone = frameTone[season];
  const pillStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    minHeight: 36,
    borderRadius: 9999,
    background: `linear-gradient(180deg, ${tone.shine} 0%, ${palette.bg}E8 100%)`,
    border: `1.5px solid ${tone.line}AA`,
    boxShadow: `0 5px 12px ${tone.shadow}, inset 0 2px 0 rgba(255,255,255,0.72), inset 0 -2px 0 rgba(126,79,28,0.10)`,
  };

  return (
    <div
      style={{
        position:            "absolute",
        top:                 0,
        left:                0,
        right:               0,
        zIndex:              30,
        pointerEvents:       "none",
        /* safe-area — iPhone 노치/다이나믹 아일랜드 */
        paddingTop:          "env(safe-area-inset-top, 0px)",
        background:          "linear-gradient(180deg, rgba(255,250,236,0.72), rgba(255,250,236,0.18) 72%, transparent)",
        transition:          "background 0.6s ease",
      }}
    >
      {/* 내부 행: 좌(생명력) — 우(코인) */}
      <div
        style={{
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "space-between",
          padding:         "10px 16px 8px",
          gap:             8,
        }}
      >
        {/* ── 생명력 필 ─────────────────────────────────────── */}
        {/* 하트 5칸 + +N 보너스를 하나의 pill 안에 배치
            overflow:hidden 으로 pill 밖으로 절대 나가지 않음 */}
        <div
          style={{
            ...pillStyle,
            display:       "flex",
            alignItems:    "center",
            flexWrap:      "nowrap",
            overflow:      "hidden",
            gap:           3,
            padding:       "5px 12px 5px 11px",
          }}
        >
          {/* 하트 슬롯 5칸 */}
          {Array.from({ length: MAX_SLOTS }, (_, i) => (
            <span
              key={i}
              style={{
                width:      "clamp(15px, 4.2vw, 20px)",
                height:     "clamp(15px, 4.2vw, 20px)",
                display:    "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize:   "clamp(14px, 4vw, 18px)",
                lineHeight: 1,
                color:      i < filled ? "#F43F5E" : "rgba(140,98,62,0.20)",
                textShadow: i < filled ? "0 2px 0 #C81E44, 0 3px 7px rgba(196,24,70,0.32), 0 -1px 0 rgba(255,255,255,0.72)" : "none",
                filter:     i < filled ? "drop-shadow(0 1px 1px rgba(104,38,28,0.24))" : "none",
                transition: "opacity 0.3s",
                flexShrink: 0,
              }}
            >♥</span>
          ))}
          {/* 생명력 수 — 항상 pill 안에 표시 (lives > 5 이면 +N, 이하면 총 수) */}
          <span
            style={{
              fontSize:      "clamp(11px, 3.2vw, 15px)",
              fontWeight:    900,
              color:         palette.text,
              lineHeight:    1,
              marginLeft:    5,
              letterSpacing: 0,
              flexShrink:    0,
              whiteSpace:    "nowrap",
              textShadow:    "0 1px 0 rgba(255,255,255,0.74)",
            }}
          >{`+${bonus > 0 ? bonus : lives}`}</span>
        </div>

        {/* ── 코인 필 ───────────────────────────────────────── */}
        <div
          style={{
            ...pillStyle,
            display:       "flex",
            alignItems:    "center",
            gap:           8,
            padding:       "5px 15px 5px 8px",
          }}
        >
          <span
            style={{
              width:      "clamp(22px, 5.6vw, 28px)",
              height:     "clamp(22px, 5.6vw, 28px)",
              borderRadius: "50%",
              display:    "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "radial-gradient(circle at 34% 26%, #FFF6A8 0%, #FCD34D 34%, #E9A51B 68%, #B96B12 100%)",
              border:    "1.5px solid #B96B12",
              boxShadow: "inset 0 2px 0 rgba(255,255,255,0.56), inset 0 -2px 0 rgba(121,62,10,0.22), 0 2px 4px rgba(111,62,10,0.24)",
              color:     "#9A4F0B",
              fontSize:  "clamp(12px, 3.3vw, 16px)",
              fontWeight: 900,
              lineHeight: 1,
              flexShrink: 0,
              textShadow: "0 1px 0 rgba(255,255,255,0.55)",
            }}
          >₩</span>
          <span
            style={{
              fontSize:      "clamp(13px, 3.8vw, 17px)",
              fontWeight:    900,
              color:         palette.text,
              lineHeight:    1,
              letterSpacing: 0,
              textShadow:    "0 1px 0 rgba(255,255,255,0.74)",
            }}
          >
            {player.coins.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * HomeMenuButton — 배경 좌표계 기준 메뉴 카드
 * ============================================================ */
interface HomeMenuButtonProps {
  item:    MenuItemDef;
  label:   string;
  badge?:  number;
  bg:      BgLayout;
  onClick: () => void;
}

function HomeMenuButton({ item, label, badge, bg, onClick }: HomeMenuButtonProps) {
  const { rx, ry, scaleX } = toRenderPoint(item.x, item.y, bg);
  // 시안 메뉴는 배경 PNG + 아이콘 PNG + 텍스트를 별도 레이어로 합성한다.
  // 아이콘 자체에 카드 배경을 포함하지 않아 "박스 안 박스"가 생기지 않는다.
  const cardW      = 166 * scaleX;
  const cardH      = 166 * scaleX;
  const isSpecial  = item.key === "infinite" || item.key === "subscribe";
  const iconSize   = (
    item.key === "settings"  ? 75 :
    item.key === "shop"      ? 78 :
    item.key === "subscribe" ? 78 :
    item.key === "infinite"  ? 82 :
    82
  ) * scaleX;
  const iconTop    = (
    item.key === "shop"      ? 22 :
    item.key === "settings"  ? 23 :
    item.key === "subscribe" ? 23 :
    item.key === "infinite"  ? 18 :
    18
  ) * scaleX;
  const displayLabel =
    item.key === "infinite" && label.replace(/\s/g, "") === "무한게임"
      ? "무한\n게임"
      : label;

  const screenPad  = 6;
  const isLeftMenu = item.x < DESIGN_W / 2;
  const clampedX   = isLeftMenu
    ? Math.max(screenPad, rx)
    : Math.min(bg.containerW - cardW - screenPad, rx);

  return (
    <button
      onClick={onClick}
      onPointerDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.95)"; }}
      onPointerUp={(e)   => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
      onPointerLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
      aria-label={label}
      style={{
        position:      "absolute",
        left:          clampedX,
        top:           ry,
        width:         cardW,
        height:        cardH,
        background:    "transparent",
        border:        "none",
        padding:       0,
        cursor:        "pointer",
        zIndex:        20,
        pointerEvents: "auto",
        transition:    "transform 0.15s ease",
      }}
    >
      {/* 뱃지 — SVG 참고: 49×49px 빨간 원, 카드 우상단 7px 오버플로우 */}
      {badge !== undefined && (
        <span style={{
          position:       "absolute",
          top:            0,
          right:          -7 * scaleX,
          width:          49 * scaleX,
          height:         49 * scaleX,
          background:     "#EB0000",
          color:          "#fff",
          fontSize:       Math.max(11, badge > 9 ? 14 * scaleX : 18 * scaleX),
          fontWeight:     800,
          borderRadius:   "50%",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          zIndex:         2,
        }}>
          {badge}
        </span>
      )}

      <img
        src={item.bgPng}
        alt=""
        draggable={false}
        style={{
          position:      "absolute",
          left:          0,
          top:           0,
          width:         cardW,
          height:        cardH,
          objectFit:     "contain",
          pointerEvents: "none",
        }}
      />

      <img
        src={item.iconPng}
        alt=""
        draggable={false}
        style={{
          position:      "absolute",
          left:          "50%",
          top:           iconTop,
          transform:     "translateX(-50%)",
          width:         iconSize,
          height:        iconSize,
          objectFit:     "contain",
          pointerEvents: "none",
          filter:        "drop-shadow(0 3px 3px rgba(82,42,14,0.20))",
        }}
      />

      <span style={{
        position:      "absolute",
        left:          "50%",
        bottom:        item.key === "infinite" ? 19 * scaleX : 22 * scaleX,
        transform:     "translateX(-50%)",
        width:         cardW - 16 * scaleX,
        fontSize:      Math.max(10, (item.key === "infinite" ? 21 : 23) * scaleX),
        fontWeight:    900,
        color:         item.textColor,
        lineHeight:    item.key === "infinite" ? 1.02 : 1,
        textAlign:     "center",
        whiteSpace:    "pre-line",
        letterSpacing: 0,
        textShadow:    isSpecial
          ? "0 2px 2px rgba(65,26,11,0.46)"
          : "0 1px 0 rgba(255,255,255,0.78), 0 2px 3px rgba(80,45,12,0.14)",
      }}>
        {displayLabel}
      </span>
    </button>
  );
}

/* ============================================================
 * HomeStageMap — 20개 노드 페이지 기반 슬라이드 (부동 윈도우)
 *
 * 기존: MAX_PAGES=5 고정 범위(스테이지 1-100)
 * 수정: actualPage를 중심으로 MAX_PAGES 크기의 윈도우를 부동시켜
 *       스테이지 249/499/749 등 고단계에서도 올바른 노드를 표시한다.
 *
 * ── 윈도우 계산 ──────────────────────────────────────────
 *   actualPage  = floor(clearedLevel / 20)
 *   windowStart = max(0, actualPage - HALF)
 *   visualSlot  = actualPage - windowStart   ← 화면 내 슬롯(0~MAX_PAGES-1)
 *
 * transform 은 visualSlot 기준으로 계산되므로 actualPage가 커져도
 * 항상 [0, MAX_PAGES-1] 범위의 슬롯을 가리킨다.
 * ============================================================ */
function HomeStageMap({
  clearedLevel,
  bg,
  season,
  onSelectLevel,
}: {
  clearedLevel:  number;
  bg:            BgLayout;
  season:        Season;
  onSelectLevel: (level: number) => void;
}) {
  const HALF        = Math.floor(MAX_PAGES / 2);                         // = 2
  const actualPage  = Math.floor(Math.max(0, clearedLevel) / LEVELS_PER_PAGE);
  const windowStart = Math.max(0, actualPage - HALF);                    // 윈도우 첫 페이지 (실제 페이지 번호)
  const visualSlot  = Math.min(actualPage - windowStart, MAX_PAGES - 1); // 윈도우 내 현재 슬롯(0~4)

  return (
    <div
      style={{
        position:      "absolute",
        inset:         0,
        overflow:      "hidden",
        pointerEvents: "none",
        zIndex:        10,  // 메뉴(20) 아래, 타이틀(10)과 동일
      }}
    >
      <div
        style={{
          position:   "absolute",
          top:        0,
          left:       0,
          right:      0,
          height:     `${MAX_PAGES * 100}dvh`,
          transform:  `translateY(-${(MAX_PAGES - 1 - visualSlot) * 100}dvh)`,
          transition: "transform 0.65s cubic-bezier(0.22, 1, 0.36, 1)",
          willChange: "transform",
        }}
      >
        {Array.from({ length: MAX_PAGES }, (_, i) => {
          /* i = 시각적 슬롯 인덱스(고정), pageActual = 실제 페이지 번호(윈도우에 따라 변동) */
          const pageActual = windowStart + i;
          const pageStart  = pageActual * LEVELS_PER_PAGE + 1;

          return (
            <div
              key={i}  /* 시각적 슬롯 키 고정 — 윈도우 이동 시 DOM 재활용 */
              style={{
                position: "absolute",
                top:      `${(MAX_PAGES - 1 - i) * 100}dvh`,
                left:     0,
                right:    0,
                height:   "100dvh",
              }}
            >
              {STAGE_NODE_TEMPLATES.map((tmpl) => {
                const level   = pageStart + (tmpl.stage - 1);
                const perspectiveScale = 0.8 + (tmpl.stage - 1) * (0.3 / (LEVELS_PER_PAGE - 1));
                const status: NodeStatus =
                  level <= clearedLevel      ? "done"      :
                  level === clearedLevel + 1 ? "current"   :
                  level === clearedLevel + 2 ? "available" : "locked";

                const { rx, ry, scaleX } = toRenderPoint(
                  tmpl.cx + (tmpl.offsetX ?? 0),
                  tmpl.cy + (tmpl.offsetY ?? 0),
                  bg,
                );

                return (
                  <StageNode
                    key={level}
                    level={level}
                    status={status}
                    season={season}
                    x={rx}
                    y={ry}
                    scaleX={scaleX}
                    nodeScale={perspectiveScale}
                    depth={tmpl.stage}
                    onClick={() => onSelectLevel(level)}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
 * NODE_ASSETS — 계절/상태별 소형 노드 PNG 경로
 * ============================================================ */
const NODE_ASSETS: Record<Season, Record<NodeStatus, string>> = {
  spring: {
    done:      assetUrl("/nodes/map/final/spring-base.png"),
    current:   assetUrl("/nodes/map/final/spring-base.png"),
    available: assetUrl("/nodes/map/final/spring-base.png"),
    locked:    assetUrl("/nodes/map/final/spring-base.png"),
  },
  summer: {
    done:      assetUrl("/nodes/map/summer-complete.png"),
    current:   assetUrl("/nodes/map/summer-playing.png"),
    available: assetUrl("/nodes/map/summer-before.png"),
    locked:    assetUrl("/nodes/map/summer-before.png"),
  },
  autumn: {
    done:      assetUrl("/nodes/map/autumn-complete.png"),
    current:   assetUrl("/nodes/map/autumn-playing.png"),
    available: assetUrl("/nodes/map/autumn-before.png"),
    locked:    assetUrl("/nodes/map/autumn-before.png"),
  },
  winter: {
    done:      assetUrl("/nodes/map/winter-complete.png"),
    current:   assetUrl("/nodes/map/winter-playing.png"),
    available: assetUrl("/nodes/map/winter-before.png"),
    locked:    assetUrl("/nodes/map/winter-before.png"),
  },
};

const NODE_WAVE_FRAMES: Partial<Record<Season, string[]>> = {
  spring: [
    assetUrl("/nodes/map/animated/spring-playing-wave-1.png"),
    assetUrl("/nodes/map/animated/spring-playing-wave-2.png"),
    assetUrl("/nodes/map/animated/spring-playing-wave-3.png"),
    assetUrl("/nodes/map/animated/spring-playing-wave-4.png"),
  ],
};

const SPRING_PLAY_NODE_ASSETS = {
  left: assetUrl("/nodes/map/final/spring-boy-left.png"),
  right: assetUrl("/nodes/map/final/spring-boy-right.png"),
};

const SPRING_COMPLETE_FLOWERS = assetUrl("/nodes/map/final/spring-complete-flowers.png");

const SPRING_PLAY_NODE_SIDE: Record<number, "left" | "right"> = {
  1: "right",
  2: "left",
  3: "right",
  4: "right",
  5: "left",
  6: "left",
  7: "right",
  8: "right",
  9: "right",
  10: "right",
};

/* ============================================================
 * StageNode — 위치·크기·배지 구조 절대 변경 금지
 * 변경 범위: <NodeSvg> → <img> (PNG asset), button에 float 애니메이션
 * ============================================================ */
interface StageNodeProps {
  level:   number;
  status:  NodeStatus;
  season:  Season;
  x:       number;
  y:       number;
  scaleX:  number;
  nodeScale: number;
  depth:   number;
  onClick: () => void;
}

function StageNode({ level, status, season, x, y, scaleX, nodeScale, depth, onClick }: StageNodeProps) {
  const isDone      = status === "done";
  const isCurrent   = status === "current";
  const isLocked    = status === "locked";
  const [isWaving, setIsWaving] = useState(false);
  const [waveFrame, setWaveFrame] = useState(0);
  const waveTimersRef = useRef<number[]>([]);

  const nodeSize = 176 * scaleX * nodeScale;
  const nodeWidth = nodeSize;
  const nodeHeight = nodeSize;

  const badgeSize     = Math.max(18, 44 * scaleX * nodeScale);
  const badgeFontSize = Math.max(10, 14 * scaleX * nodeScale);
  const waveFrames = NODE_WAVE_FRAMES[season];
  const isSpringCurrent = season === "spring" && isCurrent;
  const playSide = SPRING_PLAY_NODE_SIDE[depth] ?? "right";
  const isSpringDone = season === "spring" && isDone;
  const baseNodeAsset = isCurrent && isWaving && waveFrames && season !== "spring"
      ? waveFrames[waveFrame]
      : NODE_ASSETS[season]?.[status] ?? NODE_ASSETS.spring[status];
  const playOverlayWidth = nodeWidth * 1.62;
  const completeOverlayWidth = nodeWidth * 1.12;

  useEffect(() => {
    setIsWaving(false);
    setWaveFrame(0);
    waveTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    waveTimersRef.current = [];

    return () => {
      waveTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      waveTimersRef.current = [];
    };
  }, [level, status, season]);

  const handleClick = () => {
    if (!isCurrent || isWaving) return;
    setIsWaving(true);
    setWaveFrame(0);

    waveTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    waveTimersRef.current = [];

    const waveSequence = waveFrames
      ? [1, 2, 3, 2, 1, 2, 3, 2, 1, 2, 3, 0]
      : [0];

    waveSequence.forEach((frame, index) => {
      const timerId = window.setTimeout(() => {
        setWaveFrame(frame);
      }, (index + 1) * 110);
      waveTimersRef.current.push(timerId);
    });

    const enterTimerId = window.setTimeout(() => {
      setIsWaving(false);
      setWaveFrame(0);
      waveTimersRef.current = [];
      onClick();
    }, waveFrames ? (waveSequence.length + 1) * 110 : 180);
    waveTimersRef.current.push(enterTimerId);
  };

  return (
    <div
      style={{
        position:      "absolute",
        left:          x,          // ← 절대 변경 금지
        top:           y,          // ← 절대 변경 금지
        width:         nodeWidth,  // ← 절대 변경 금지
        transform:     "translate(-50%, -50%)",
        pointerEvents: isCurrent ? "auto" : "none",
        zIndex:        isCurrent ? 20 + depth : 10 + depth,
      }}
    >
      {/* inner button — float 애니메이션은 여기에만 적용
          (outer div의 translate(-50%,-50%) 위치 기준을 보존하기 위함) */}
      <button
        onClick={handleClick}
        style={{
          display:    "block",
          width:      "100%",
          background: "none",
          border:     "none",
          padding:    0,
          cursor:     isCurrent ? "pointer" : "default",
          position:   "relative",
        }}
        aria-label={`스테이지 ${level}`}
      >
        {/* PNG 노드 아이콘 — 계절별 흙/캐릭터/꽃핀 화단 */}
        <img
          src={baseNodeAsset}
          alt=""
          draggable={false}
          style={{
            display:    "block",
            width:      "100%",
            height:     nodeHeight,
            objectFit:  "contain",
            opacity:    1,
          }}
        />

        {isSpringCurrent && (
          <img
            src={SPRING_PLAY_NODE_ASSETS[playSide]}
            alt=""
            draggable={false}
            style={{
              position: "absolute",
              left: playSide === "right" ? "9%" : "-71%",
              bottom: "36%",
              width: playOverlayWidth,
              height: "auto",
              objectFit: "contain",
              pointerEvents: "none",
              transform: isWaving ? "translateY(-1.5%) rotate(-1deg)" : "none",
              transformOrigin: "50% 85%",
              transition: "transform 110ms ease",
              zIndex: 3,
            }}
          />
        )}

        {isSpringDone && (
          <img
            src={SPRING_COMPLETE_FLOWERS}
            alt=""
            draggable={false}
            style={{
              position: "absolute",
              left: "50%",
              bottom: "43%",
              width: completeOverlayWidth,
              height: "auto",
              objectFit: "contain",
              pointerEvents: "none",
              transform: "translateX(-50%)",
              zIndex: 2,
            }}
          />
        )}

        {/* 배지 + 숫자 — 얼굴을 가리지 않도록 흙 영역 하단에 배치 */}
        <div
          style={{
            position:      "absolute",
            left:          "50%",
            top:           isCurrent ? "77%" : "76%",
            transform:     "translate(-50%, -50%)",
            width:         badgeSize,
            height:        badgeSize,
            borderRadius:  9999,
            // ── 게임 일러스트와 어울리는 earthy 팔레트 (글래스모피즘 제거) ──
            background:    isDone    ? "rgba(122,85,53,0.90)"    // 따뜻한 나무껍질 갈색
                         : isCurrent ? "rgba(240,144,32,0.90)"   // 황금 앰버
                         :             "rgba(168,152,120,0.90)", // 따뜻한 웜 그레이 베이지 (잠금)
            border:        isDone    ? `${Math.max(1, 1.5 * scaleX)}px solid #5A3A20`
                         : isCurrent ? `${Math.max(1, 1.5 * scaleX)}px solid #C06010`
                         :             `${Math.max(1, 1.5 * scaleX)}px solid #887858`,
            boxShadow:     isDone    ? "0 2px 4px rgba(40,20,5,0.45), inset 0 1px 0 rgba(255,255,255,0.12)"
                         : isCurrent ? "0 3px 8px rgba(160,80,10,0.55), inset 0 1px 0 rgba(255,255,255,0.35)"
                         :             "0 2px 4px rgba(60,40,15,0.30), inset 0 1px 0 rgba(255,255,255,0.15)",
            display:       "flex",
            alignItems:    "center",
            justifyContent:"center",
            pointerEvents: "none",
            zIndex:        4,
          }}
        >
          <span style={{
            color:      "#FFFFFF",
            fontSize:   badgeFontSize,
            fontWeight: 800,
            lineHeight: 1,
            textShadow: isDone    ? "0 1px 2px rgba(30,12,3,0.65)"
                      : isCurrent ? "0 1px 3px rgba(100,40,5,0.70)"
                      :             "0 1px 2px rgba(50,30,10,0.50)",
            whiteSpace: "nowrap",
          }}>
            {level}
          </span>
        </div>
      </button>
    </div>
  );
}

/* ============================================================
 * StartButton — start_button.svg + 계절별 CSS filter
 * ============================================================ */
function StartButton({ bg, season, onClick }: { bg: BgLayout; season: Season; onClick: () => void }) {
  const { rx, ry, scaleX } = toRenderPoint(365, 1810, bg);
  const w = 410 * scaleX;

  return (
    <button
      onClick={onClick}
      onPointerDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.95)"; }}
      onPointerUp={(e)   => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
      onPointerLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
      aria-label="START"
      style={{
        position:      "absolute",
        left:          rx,
        top:           ry,
        width:         w,
        background:    "none",
        border:        "none",
        padding:       0,
        cursor:        "pointer",
        zIndex:        25,
        pointerEvents: "auto",
        transition:    "transform 0.15s ease",
      }}
    >
      <img
        src={assetUrl("/ui/home-final/start-button-bg.png")}
        alt=""
        draggable={false}
        style={{
          display:    "block",
          width:      "100%",
          height:     "auto",
          objectFit:  "contain",
          filter:     season === "spring" ? "none" : SEASON_START_FILTER[season],
          transition: "filter 0.6s ease",
        }}
      />
      <span
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -52%)",
          color: "#FFFFFF",
          fontSize: Math.max(24, 54 * scaleX),
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: 0,
          textShadow: "0 3px 0 #8C3C12, 0 5px 10px rgba(95,45,10,0.35)",
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        START
      </span>
    </button>
  );
}

/* ============================================================
 * MissionModal
 * ============================================================ */
interface MissionModalProps {
  missions:        MissionState[];
  weeklyMissions:  WeeklyMissionState[];
  onClaimDaily?:   (id: MissionId) => number;
  onClaimWeekly?:  (id: WeeklyMissionId) => number;
  onEarnCoins?:    (amount: number) => void;
  onAdWatched?:    () => void;
  onClose:         () => void;
  season?:         Season;
}

function MissionModal({ missions, weeklyMissions, onClaimDaily, onClaimWeekly, onEarnCoins, onAdWatched, onClose, season = "spring" }: MissionModalProps) {
  const { t } = useTranslation();
  const theme = SEASON_THEMES[season];
  const [tab, setTab] = useState<"daily" | "weekly">("daily");

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm"
      style={{ background: "rgba(76,46,12,0.30)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col h-[85dvh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
        style={{ background: theme.popupBg }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0"
          style={{ borderBottom: `1px solid ${theme.borderColor}50` }}
        >
          <h2 className="text-lg font-display font-bold flex items-center gap-1.5" style={{ color: theme.textPrimary }}>
            <img src={assetUrl("/menu-mission.png")} className="w-6 h-6 object-contain" alt="" draggable={false} />
            {t("missions.title")}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all text-sm active:scale-95"
            style={{ background: theme.borderColor + "40", color: theme.textSecondary }}
          >✕</button>
        </div>

        <div className="flex gap-1 px-5 pb-3 pt-3 flex-shrink-0">
          {(["daily", "weekly"] as const).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
              style={tab === tabKey
                ? { background: theme.btnPrimary, color: theme.btnPrimaryText }
                : { background: theme.panelColor, color: theme.textMuted }
              }
            >
              {tabKey === "daily" ? t("missions.daily") : t("missions.weekly")}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {tab === "daily"
            ? <DailyMissionList missions={missions} onClaim={onClaimDaily} onEarnCoins={onEarnCoins} onAdWatched={onAdWatched} theme={theme} />
            : <WeeklyMissionList weeklyMissions={weeklyMissions} onClaim={onClaimWeekly} onEarnCoins={onEarnCoins} onAdWatched={onAdWatched} theme={theme} />
          }
        </div>
      </div>
    </div>,
    document.body,
  );
}

function DailyMissionList({ missions, onClaim, onEarnCoins, onAdWatched, theme }: {
  missions: MissionState[]; onClaim?: (id: MissionId) => number;
  onEarnCoins?: (amount: number) => void; onAdWatched?: () => void;
  theme: SeasonTheme;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <FreeCoinsButton onEarnCoins={onEarnCoins} onAdWatched={onAdWatched} />
      {DAILY_MISSIONS.map((mission) => {
        const state = missions.find((s) => s.id === mission.id);
        const status = state?.status ?? "incomplete";
        const prog = state?.progress ?? 0;
        return (
          <div
            key={mission.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all"
            style={{
              background: status === "claimed" ? theme.panelColor : status === "complete" ? theme.btnPrimary + "15" : theme.panelColor,
              opacity: status === "claimed" ? 0.5 : 1,
              border: status === "complete" ? `1px solid ${theme.btnPrimary}40` : `1px solid transparent`,
            }}
          >
            <span className="text-xl flex-shrink-0">{mission.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight" style={{ color: theme.textPrimary }}>{t(mission.title)}</p>
              <p className="text-xs" style={{ color: theme.textMuted }}>{t(mission.description)}</p>
              {/* target>1인 미션은 항상 같은 높이의 진행 바 영역 확보 */}
              {mission.target > 1 && (
                <div className="mt-1 w-full h-1.5 rounded-full overflow-hidden" style={{ background: theme.borderColor + "40" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: status === "incomplete" ? `${(prog / mission.target) * 100}%` : "100%",
                      background: status === "incomplete" ? theme.btnPrimary + "80" : theme.btnPrimary + "40",
                    }}
                  />
                </div>
              )}
            </div>
            <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
              <span className="text-xs font-bold" style={{ color: "#e65100" }}>🪙{mission.reward}</span>
              {/* 고정 높이로 수령 전/후 행 높이 통일 */}
              <div className="h-[22px] flex items-center justify-end">
                {status === "complete" && (
                  <button
                    onClick={() => onClaim?.(mission.id)}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full active:scale-95 transition-all"
                    style={{ background: theme.btnPrimary, color: theme.btnPrimaryText }}
                  >{t("ranking.claimReward")}</button>
                )}
                {status === "claimed" && <span className="text-[10px] font-medium" style={{ color: theme.textMuted }}>✓</span>}
                {status === "incomplete" && mission.target > 1 && <span className="text-[10px]" style={{ color: theme.textMuted }}>{prog}/{mission.target}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WeeklyMissionList({ weeklyMissions, onClaim, onEarnCoins, onAdWatched, theme }: {
  weeklyMissions: WeeklyMissionState[]; onClaim?: (id: WeeklyMissionId) => number;
  onEarnCoins?: (amount: number) => void; onAdWatched?: () => void;
  theme: SeasonTheme;

}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <FreeCoinsButton onEarnCoins={onEarnCoins} onAdWatched={onAdWatched} />
      {WEEKLY_MISSIONS.map((mission) => {
        const state = weeklyMissions.find((s) => s.id === mission.id);
        const status = state?.status ?? "incomplete";
        const prog = state?.progress ?? 0;
        return (
          <div
            key={mission.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all"
            style={{
              background: status === "claimed" ? theme.panelColor : status === "complete" ? theme.btnPrimary + "15" : theme.panelColor,
              opacity: status === "claimed" ? 0.5 : 1,
              border: status === "complete" ? `1px solid ${theme.btnPrimary}40` : `1px solid transparent`,
            }}
          >
            <span className="text-xl flex-shrink-0">{mission.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight" style={{ color: theme.textPrimary }}>{t(mission.title)}</p>
              <p className="text-xs" style={{ color: theme.textMuted }}>{t(mission.description)}</p>
              {/* target>1인 미션은 항상 같은 높이의 진행 바 영역 확보 */}
              {mission.target > 1 && (
                <div className="mt-1 w-full h-1.5 rounded-full overflow-hidden" style={{ background: theme.borderColor + "40" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: status === "incomplete" ? `${(prog / mission.target) * 100}%` : "100%",
                      background: status === "incomplete" ? "#FFC107" + "90" : "#FFC107" + "40",
                    }}
                  />
                </div>
              )}
            </div>
            <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
              <span className="text-xs font-bold" style={{ color: "#e65100" }}>🪙{mission.reward}</span>
              {/* 고정 높이로 수령 전/후 행 높이 통일 */}
              <div className="h-[22px] flex items-center justify-end">
                {status === "complete" && (
                  <button
                    onClick={() => onClaim?.(mission.id)}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full active:scale-95 transition-all"
                    style={{ background: theme.btnPrimary, color: theme.btnPrimaryText }}
                  >{t("ranking.claimReward")}</button>
                )}
                {status === "claimed" && <span className="text-[10px] font-medium" style={{ color: theme.textMuted }}>✓</span>}
                {status === "incomplete" && mission.target > 1 && <span className="text-[10px]" style={{ color: theme.textMuted }}>{prog}/{mission.target}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── FreeCoinsButton ────────────────────────────────────────── */
function FreeCoinsButton({ onEarnCoins, onAdWatched }: { onEarnCoins?: (n: number) => void; onAdWatched?: () => void }) {
  const { t } = useTranslation();
  const [adState, setAdState] = useState<"idle" | "watching">("idle");
  const [adInfo,  setAdInfo]  = useState(getAdCoinState());
  useEffect(() => { setAdInfo(getAdCoinState()); }, []);

  if (adInfo.remaining <= 0) {
    return <div className="w-full py-3 rounded-2xl bg-board/40 border border-board text-center text-xs text-foreground/30 font-medium mb-1">{t("common.watchAd")}</div>;
  }

  const handleWatch = async () => {
    if (adState === "watching") return;
    setAdState("watching");
    const earned = await watchAdForCoins();
    setAdState("idle");
    if (earned > 0) { onEarnCoins?.(earned); onAdWatched?.(); setAdInfo(getAdCoinState()); }
  };

  return (
    <button onClick={handleWatch} disabled={adState === "watching"} className={["w-full py-2.5 rounded-2xl border-2 font-bold text-sm transition-all active:scale-95 mb-1", adState === "watching" ? "border-amber-200 bg-amber-50 text-amber-400 cursor-wait" : "border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100"].join(" ")}>
      {adState === "watching" ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          {t("game.watchingAd")}
        </span>
      ) : `📺 ${t("common.watchAd")} +100 (${adInfo.remaining})`}
    </button>
  );
}

/* ── AdBanner — 웹: 플레이스홀더 / 네이티브: AdMob 하단 배너 표시 ── */
function AdBanner() {
  useEffect(() => {
    let cancelled = false;
    if (!cancelled) void showBanner("bottom");
    return () => {
      cancelled = true;
      void removeBanner();
    };
  }, []);

  return (
    <div
      className="w-full h-10 flex items-center justify-center text-[11px] font-medium select-none flex-shrink-0 border-t border-white/40 bg-white/55 backdrop-blur-sm text-foreground/30"
      aria-hidden="true"
    >
      AD
    </div>
  );
}
