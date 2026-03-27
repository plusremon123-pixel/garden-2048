/* ============================================================
 * FrontScreen.tsx
 * 홈 화면 — Candy Crush 스타일 레벨 맵 UI
 *
 * 레이아웃 (단일 화면):
 *   [AD 상단]
 *   [헤더: 타이틀 + 코인]
 *   [XP바]
 *   [레벨 맵 flex-1 — 좌/우 아이콘 메뉴 오버레이]
 *   [게임 시작 버튼]
 *   [AD 하단]
 * ============================================================ */

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  PlayerData, LEVEL_REWARDS, xpForNextLevel, xpProgress,
} from "@/utils/playerData";
import {
  MissionState, MissionId, DAILY_MISSIONS,
  WeeklyMissionState, WeeklyMissionId, WEEKLY_MISSIONS,
} from "@/utils/missionData";
import { getAdCoinState } from "@/utils/adService";
import { type Inventory, type ShopItemId } from "@/utils/shopData";
import type { GameSettings } from "@/hooks/useSettings";
import { type PendingReward, PERIOD_LABEL } from "@/utils/rankingData";
import { getStageConfig } from "@/utils/stageData";
import { RankingModal }   from "./modals/RankingModal";
import { ItemsModal }     from "./modals/ItemsModal";
import { HomeShopModal }  from "./modals/HomeShopModal";
import { SettingsModal }  from "./modals/SettingsModal";
import { DogamModal }     from "./modals/DogamModal";

/* ── 활성 모달 타입 ────────────────────────────────────────── */
type ActiveModal = "ranking" | "items" | "shop" | "settings" | "dogam" | null;

/* ── Props ─────────────────────────────────────────────────── */
interface FrontScreenProps {
  player:                 PlayerData;
  selectedThemeId?:       string;    // 테마 기능 제거 (하위 호환 유지)
  onSelectTheme?:         (id: string) => void;
  onStartGame:            () => void;
  missions?:              MissionState[];
  onClaimMission?:        (id: MissionId) => number;
  weeklyMissions?:        WeeklyMissionState[];
  onClaimWeeklyMission?:  (id: WeeklyMissionId) => number;
  onEarnCoins?:           (amount: number) => void;
  onAdWatched?:           () => void;
  /* 상점 / 아이템 */
  inventory?:             Inventory;
  onBuyItem?:             (id: ShopItemId, cost: number) => boolean;
  /* 설정 */
  settings?:              GameSettings;
  onToggleSetting?:       (key: keyof GameSettings) => void;
  /* 랭킹 보상 */
  rankingRewards?:        PendingReward[];
  onClaimRankingReward?:  (periodKey: string) => void;
}

const DEFAULT_SETTINGS: GameSettings = {
  sound: true, vibration: true, animation: true, notifications: false,
};

export function FrontScreen({
  player, onStartGame,
  missions = [], onClaimMission,
  weeklyMissions = [], onClaimWeeklyMission,
  onEarnCoins, onAdWatched,
  inventory,
  onBuyItem,
  settings = DEFAULT_SETTINGS,
  onToggleSetting,
  rankingRewards = [],
  onClaimRankingReward,
}: FrontScreenProps) {
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [activeModal,      setActiveModal]      = useState<ActiveModal>(null);
  const [selectedLevel,    setSelectedLevel]    = useState<number | null>(null);

  const closeModal = () => setActiveModal(null);

  const completedDaily  = missions.filter((m) => m.status === "complete").length;
  const completedWeekly = weeklyMissions.filter((m) => m.status === "complete").length;
  const missionBadge    = completedDaily + completedWeekly;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">

      {/* ── 풀스크린 배경 레이어 ────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "url(/home-bg.png)",
          backgroundSize: "100% 100%",
          backgroundPosition: "top left",
          backgroundRepeat: "no-repeat",
          zIndex: 0,
        }}
      />
      {/* 잎 장식 레이어 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <span className="absolute top-[7%]  left-[4%]  text-5xl opacity-20 rotate-[-25deg] select-none">🍃</span>
        <span className="absolute top-[12%] right-[3%] text-4xl opacity-20 rotate-[35deg]  select-none">🌿</span>
        <span className="absolute top-[30%] left-[2%]  text-3xl opacity-15 rotate-[15deg]  select-none">🌱</span>
        <span className="absolute top-[38%] right-[2%] text-3xl opacity-15 rotate-[-12deg] select-none">🌱</span>
        <span className="absolute bottom-[28%] left-[3%]  text-4xl opacity-20 rotate-[8deg]  select-none">🍃</span>
        <span className="absolute bottom-[18%] right-[3%] text-4xl opacity-20 rotate-[-20deg] select-none">🌿</span>
      </div>

      {/* ── 전체 뷰포트 인터랙션 레이어 ────────────────────── */}
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] z-[1] pointer-events-none">

        {/* 헤더 */}
        <div className="absolute top-0 left-0 right-0 z-[20] pointer-events-auto">
          <AdBanner position="top" />
          <div className="flex items-center justify-between px-5 pt-3 pb-1.5">
            <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
              Plant 2048
            </h1>
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200/80 rounded-full px-3 py-1.5 shadow-sm">
              <span className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-xs shadow-inner">🪙</span>
              <div className="flex flex-col leading-none">
                <span className="text-[9px] text-amber-600/60 font-semibold tracking-wide">Coin</span>
                <span className="text-sm font-black text-amber-600">{player.coins.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 레벨 맵 */}
        <LevelMap
          player={player}
          selectedLevel={selectedLevel}
          onSelectLevel={setSelectedLevel}
        />

        {/* 왼쪽 메뉴: 미션·랭킹·도감 */}
        <SideMenu
          side="left"
          items={[
            {
              label: "미션", emoji: "📋", imageSrc: "/icons/icon-mission.png",
              badge: missionBadge > 0 ? missionBadge : undefined,
              onClick: () => setShowMissionModal(true),
            },
            { label: "랭킹", emoji: "🏆", imageSrc: "/icons/icon-ranking.png", onClick: () => setActiveModal("ranking") },
            { label: "도감", emoji: "📖", imageSrc: "/icons/icon-book.png",   onClick: () => setActiveModal("dogam")   },
          ]}
        />

        {/* 오른쪽 메뉴: 아이템·상점·설정 */}
        <SideMenu
          side="right"
          items={[
            { label: "카드",   emoji: "🃏", imageSrc: "/icons/icon-card.png", onClick: () => setActiveModal("items")    },
            { label: "상점",   emoji: "🏪", imageSrc: "/icons/icon-shop.png", onClick: () => setActiveModal("shop")     },
            { label: "설정",   emoji: "⚙️",                                   onClick: () => setActiveModal("settings") },
          ]}
        />

        {/* ── START 버튼 ───────────────────────────────── */}
        <div
          className="absolute z-[5] px-5 w-full pointer-events-auto"
          style={{ left: "50%", top: "84.8%", transform: "translate(-50%, -50%)" }}
        >
          <button
            onClick={onStartGame}
            className="w-full py-4 rounded-full bg-primary text-white font-black text-xl tracking-widest shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
          >
            START
          </button>
        </div>
      </div>

      {/* ── 하단 광고 (portal → transform 격리 문제 방지) ── */}
      {createPortal(
        <div className="fixed bottom-0 left-0 right-0 z-[30]">
          <AdBanner position="bottom" />
        </div>,
        document.body,
      )}

      {/* ── 미션 모달 ─────────────────────────────────────── */}
      {showMissionModal && (
        <MissionModal
          missions={missions}
          weeklyMissions={weeklyMissions}
          onClaimDaily={onClaimMission}
          onClaimWeekly={onClaimWeeklyMission}
          onEarnCoins={onEarnCoins}
          onAdWatched={onAdWatched}
          onClose={() => setShowMissionModal(false)}
        />
      )}

      {/* ── 랭킹 모달 ─────────────────────────────────────── */}
      {activeModal === "ranking" && (
        <RankingModal onClose={closeModal} />
      )}

      {/* ── 아이템 모달 ───────────────────────────────────── */}
      {activeModal === "items" && inventory && (
        <ItemsModal inventory={inventory} onClose={closeModal} />
      )}

      {/* ── 홈 상점 모달 ──────────────────────────────────── */}
      {activeModal === "shop" && inventory && onBuyItem && (
        <HomeShopModal
          player={player}
          inventory={inventory}
          onBuyItem={onBuyItem}
          onEarnCoins={onEarnCoins}
          onClose={closeModal}
        />
      )}

      {/* ── 설정 모달 ─────────────────────────────────────── */}
      {activeModal === "settings" && onToggleSetting && (
        <SettingsModal
          settings={settings}
          onToggle={onToggleSetting}
          onClose={closeModal}
        />
      )}

      {/* ── 도감 모달 ─────────────────────────────────────── */}
      {activeModal === "dogam" && (
        <DogamModal onClose={closeModal} />
      )}

      {/* ── 스테이지 정보 팝업 ────────────────────────────────── */}
      {selectedLevel !== null && (
        <StageInfoPopup
          level={selectedLevel}
          clearedLevel={player.clearedLevel}
          onClose={() => setSelectedLevel(null)}
          onStart={() => { setSelectedLevel(null); onStartGame(); }}
        />
      )}

      {/* ── 랭킹 보상 팝업 (portal, 순차 표시) ──────────────── */}
      {rankingRewards.length > 0 && onClaimRankingReward && createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-[300px] bg-white rounded-3xl p-6 shadow-2xl animate-modal-slide-up text-center">
            <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
              🏆
            </div>
            <h3 className="text-base font-black text-foreground mb-1">랭킹 보상!</h3>
            <p className="text-xs text-foreground/50 mb-1">
              {PERIOD_LABEL[rankingRewards[0].type]} 누적 점수 {rankingRewards[0].rank}위
            </p>
            <p className="text-2xl font-black text-amber-500 mb-5">
              🪙 {rankingRewards[0].coins.toLocaleString()}
            </p>
            <button
              onClick={() => onClaimRankingReward(rankingRewards[0].periodKey)}
              className="w-full py-3 rounded-2xl bg-primary text-white font-black text-sm shadow-sm hover:bg-primary-hover active:scale-95 transition-all"
            >
              수령하기
            </button>
            {rankingRewards.length > 1 && (
              <p className="mt-2 text-[10px] text-foreground/35">
                +{rankingRewards.length - 1}개 보상 더 있음
              </p>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

/* ============================================================
 * SideMenu — 좌/우 4개 아이콘 수직 버튼
 * ============================================================ */
interface SideMenuItem {
  label:     string;
  emoji:     string;
  imageSrc?: string;   // /icons/*.png 경로 지정 시 이미지로 렌더
  badge?:    number;
  onClick:   () => void;
}

interface SideMenuProps {
  side:  "left" | "right";
  items: SideMenuItem[];
}

function SideMenu({ side, items }: SideMenuProps) {
  return (
    <div
      className={[
        "absolute top-[18%] flex flex-col gap-2.5 z-10 pointer-events-auto",
        side === "left" ? "left-1.5" : "right-1.5",
      ].join(" ")}
    >
      {items.map((item) => (
        <button
          key={item.label}
          onClick={item.onClick}
          className="relative flex flex-col items-center justify-center w-[68px] py-2.5 rounded-2xl bg-white shadow-md hover:shadow-lg active:scale-95 transition-all duration-150 border border-black/5"
        >
          {item.badge !== undefined && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-400 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
              {item.badge}
            </span>
          )}
          {item.imageSrc
            ? <img src={item.imageSrc} className="w-9 h-9 object-contain mb-1" alt={item.label} draggable={false} />
            : <span className="text-2xl leading-none mb-1">{item.emoji}</span>
          }
          <span className="text-[10px] font-bold text-foreground/55 leading-none">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ============================================================
 * XpBar — 간결한 레벨 XP 진행 바
 * ============================================================ */
function XpBar({ player }: { player: PlayerData }) {
  const progress    = xpProgress(player);
  const needed      = xpForNextLevel(player.level);
  const pct         = Math.round(progress * 100);
  const nextRewards = LEVEL_REWARDS[player.level + 1] ?? [];

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap">
        Lv.{player.level}
      </span>
      <div className="flex-1">
        <div className="w-full h-2 bg-black/8 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {nextRewards.length > 0 && (
          <p className="text-[9px] text-foreground/35 mt-0.5 truncate">
            다음:{" "}
            {nextRewards.map((r, i) => (
              <span key={i} className="text-amber-500 font-semibold">
                {r.type === "coins" ? `🪙${r.amount}` : `🎁${r.description}`}
                {i < nextRewards.length - 1 ? " · " : ""}
              </span>
            ))}
          </p>
        )}
      </div>
      <span className="text-[9px] text-foreground/30 flex-shrink-0 whitespace-nowrap">
        {player.xp}/{needed}
      </span>
    </div>
  );
}

/* ============================================================
 * LevelMap — 배경 기준 고정 좌표 노드 맵
 *
 * 6개 노드를 1페이지로. clearedLevel이 6 경계를 넘으면
 * translateY CSS transition으로 다음 페이지 슬라이드.
 * ============================================================ */

/** 배경 이미지(918×2048) 기준 노드 중심 → 뷰포트 % (아래→위 순서) */
const NODE_POSITIONS: { left: string; top: string }[] = [
  { left: "49.8%", top: "76.6%" }, // level +0 (가장 낮은 레벨, 하단)
  { left: "49.8%", top: "62.9%" },
  { left: "49.7%", top: "49.2%" },
  { left: "49.8%", top: "35.5%" },
  { left: "49.8%", top: "21.8%" },
  { left: "49.8%", top: "8.0%"  }, // level +5 (가장 높은 레벨, 상단)
];

/** 최대 페이지 수 (6레벨 × 10페이지 = 60레벨 지원) */
const MAX_PAGES = 10;

type NodeStatus = "done" | "current" | "available" | "locked";

function LevelMap({
  player,
  selectedLevel,
  onSelectLevel,
}: {
  player: PlayerData;
  selectedLevel?: number | null;
  onSelectLevel?: (level: number) => void;
}) {
  const { clearedLevel } = player;
  // 0-based 페이지: levels 1-6 → page 0, 7-12 → page 1 …
  const currentPage = Math.floor(Math.max(0, clearedLevel) / 6);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/*
       * 페이지를 아래에서 위로 쌓음:
       *   page 0 → container 맨 아래 (top: (MAX_PAGES-1)*100dvh)
       *   page N → 위로 올라감
       * currentPage를 보려면 translateY = -(MAX_PAGES-1-currentPage)*100dvh
       */}
      <div
        style={{
          position:   "absolute",
          top:        0,
          left:       0,
          right:      0,
          height:     `${MAX_PAGES * 100}dvh`,
          transform:  `translateY(-${(MAX_PAGES - 1 - currentPage) * 100}dvh)`,
          transition: "transform 0.65s cubic-bezier(0.22, 1, 0.36, 1)",
          willChange: "transform",
        }}
      >
        {Array.from({ length: MAX_PAGES }, (_, pageIdx) => {
          const pageStart = pageIdx * 6 + 1;
          return (
            <div
              key={pageIdx}
              style={{
                position: "absolute",
                top:      `${(MAX_PAGES - 1 - pageIdx) * 100}dvh`,
                left:     0,
                right:    0,
                height:   "100dvh",
              }}
            >
              {NODE_POSITIONS.map((pos, i) => {
                const level = pageStart + i;
                const status: NodeStatus =
                  level <= clearedLevel      ? "done"      :
                  level === clearedLevel + 1 ? "current"   :
                  level === clearedLevel + 2 ? "available" : "locked";
                return (
                  <div
                    key={level}
                    className="absolute"
                    style={{
                      left:          pos.left,
                      top:           pos.top,
                      transform:     "translate(-50%, -50%)",
                      zIndex:        2,
                      pointerEvents: "auto",
                    }}
                  >
                    <LevelNode
                      nodeLevel={level}
                      status={status}
                      isSelected={selectedLevel === level}
                      onSelect={() => onSelectLevel?.(level)}
                    />
                  </div>
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
 * LevelNode — 리프 원형 노드 (클릭 시 부모에 선택 레벨 전달)
 * ============================================================ */
interface LevelNodeProps {
  nodeLevel:  number;
  status:     NodeStatus;
  isSelected: boolean;
  onSelect:   () => void;
}

function LevelNode({ nodeLevel, status, isSelected, onSelect }: LevelNodeProps) {
  const isCurrent   = status === "current";
  const isDone      = status === "done";
  const isAvailable = status === "available";
  const isLocked    = status === "locked";

  /* 상태별 아이콘 */
  const iconSrc = isDone
    ? "/icons/node-complete.svg"
    : isCurrent
      ? "/icons/node-stay.svg"
      : "/icons/node-hold.svg";   /* available + locked 모두 hold */

  const iconSize = 64;

  return (
    /* 버튼만 flow에 포함 — 레이블은 absolute로 분리해 아이콘이 정확히 중앙 */
    <div className="relative flex items-center justify-center">
      {/* 스테이지 번호 — 아이콘 위에 absolute */}
      <span className={[
        "absolute bottom-full mb-1 text-[10px] font-bold leading-none whitespace-nowrap",
        isSelected ? "text-primary" :
        isCurrent  ? "text-amber-600" :
        isLocked   ? "text-foreground/30" : "text-foreground/45",
      ].join(" ")}>
        {nodeLevel}
      </span>

      <button
        onClick={onSelect}
        className="relative flex items-center justify-center cursor-pointer active:scale-90"
        style={{
          transform:  isSelected ? "scale(1.18)" : "scale(1)",
          transition: "transform 0.18s ease, filter 0.18s ease",
          filter: isSelected
            ? "drop-shadow(0 0 8px rgba(255,255,255,0.95)) drop-shadow(0 0 16px rgba(80,180,60,0.7))"
            : isCurrent
              ? "drop-shadow(0 0 10px rgba(230,190,30,0.8))"
              : "none",
          opacity: 1,
        }}
        aria-label={`스테이지 ${nodeLevel}`}
      >
        <img
          src={iconSrc}
          width={iconSize}
          height={iconSize}
          alt={`스테이지 ${nodeLevel}`}
          draggable={false}
          style={{ display: "block" }}
        />

        {/* 현재 스테이지 pulse ring */}
        {isCurrent && !isSelected && (
          <>
            <span className="absolute -inset-2 rounded-full border-2 border-yellow-300/70 animate-ping pointer-events-none" />
            <span className="absolute -inset-3.5 rounded-full border border-yellow-200/30 pointer-events-none" />
          </>
        )}
      </button>
    </div>
  );
}

/* ============================================================
 * StageInfoPopup — 스테이지 노드 클릭 시 중앙 팝업
 * ============================================================ */
function StageInfoPopup({
  level,
  clearedLevel,
  onClose,
  onStart,
}: {
  level:        number;
  clearedLevel: number;
  onClose:      () => void;
  onStart:      () => void;
}) {
  const stageConfig = getStageConfig(level);
  const rewards     = LEVEL_REWARDS[level] ?? [];

  const status: NodeStatus =
    level <= clearedLevel      ? "done"      :
    level === clearedLevel + 1 ? "current"   :
    level === clearedLevel + 2 ? "available" : "locked";

  const isDone      = status === "done";
  const isCurrent   = status === "current";
  const isLocked    = status === "locked";
  const canChallenge = isDone || isCurrent;

  const soilCount  = stageConfig?.initialTiles.filter((t) => t.tileType === "soil").length  ?? 0;
  const thornCount = stageConfig?.initialTiles.filter((t) => t.tileType === "thorn").length ?? 0;
  const obstacleText = [
    soilCount  > 0 ? `흙 ${soilCount}개`  : "",
    thornCount > 0 ? `가시 ${thornCount}개` : "",
  ].filter(Boolean).join(", ");

  return createPortal(
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/35 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[300px] bg-white rounded-3xl shadow-2xl overflow-hidden animate-modal-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── 헤더 */}
        <div className="relative bg-primary/8 px-5 pt-5 pb-4">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-foreground/10 hover:bg-foreground/18 flex items-center justify-center text-foreground/40 text-xs font-bold transition-all"
          >✕</button>

          <p className="text-[10px] text-foreground/40 font-bold tracking-widest uppercase">Stage</p>
          <h3 className="text-2xl font-black text-foreground leading-tight">{level}</h3>
          {stageConfig && (
            <p className="text-xs text-foreground/45 mt-0.5">{stageConfig.name}</p>
          )}

          {/* 상태 뱃지 */}
          <div className="mt-2">
            {isDone      && <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-600 font-bold px-2.5 py-0.5 rounded-full">✓ 클리어 완료</span>}
            {isCurrent   && <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-600 font-bold px-2.5 py-0.5 rounded-full">⚡ 도전 중</span>}
            {status === "available" && <span className="inline-flex items-center gap-1 text-[10px] bg-sky-100 text-sky-500 font-bold px-2.5 py-0.5 rounded-full">🔓 해금됨</span>}
            {isLocked    && <span className="inline-flex items-center gap-1 text-[10px] bg-foreground/8 text-foreground/35 font-bold px-2.5 py-0.5 rounded-full">🔒 잠김</span>}
          </div>
        </div>

        {/* ── 본문 */}
        <div className="px-5 py-4 flex flex-col gap-3">
          {/* 목표 */}
          {stageConfig ? (
            <div>
              <p className="text-[10px] font-bold text-foreground/35 uppercase tracking-wide mb-1.5">목표</p>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm">
                  <span>🌿</span>
                  <span className="font-bold text-foreground">{stageConfig.goal.targetValue} 타일 달성</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>⏱</span>
                  <span className="text-foreground/55">최대 {stageConfig.maxTurns}턴</span>
                </div>
                {obstacleText && (
                  <div className="flex items-center gap-2 text-sm">
                    <span>🪨</span>
                    <span className="text-foreground/55">장애물: {obstacleText}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground/30 text-center py-1">스테이지 정보 준비 중</p>
          )}

          {/* 보상 */}
          {rewards.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-foreground/35 uppercase tracking-wide mb-1.5">클리어 보상</p>
              <div className="flex flex-col gap-1">
                {rewards.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span>{r.type === "coins" ? "🪙" : "🎁"}</span>
                    <span className="text-foreground/60">
                      {r.type === "coins" ? `${r.amount} 코인` : r.description}
                    </span>
                    {isDone && <span className="ml-auto text-[10px] text-emerald-500 font-bold">수령 완료</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── 하단 버튼 */}
        <div className="px-5 pb-5">
          {canChallenge ? (
            <button
              onClick={onStart}
              className="w-full py-3 rounded-2xl bg-primary text-white font-black text-sm shadow-md hover:bg-primary-hover active:scale-95 transition-all"
            >
              {isDone ? "다시 도전" : "도전하기"}
            </button>
          ) : (
            <div className="w-full py-3 rounded-2xl bg-foreground/6 text-center">
              <p className="text-xs font-semibold text-foreground/30">
                {isLocked ? "🔒 이전 스테이지를 클리어하세요" : "이전 스테이지 클리어 후 도전 가능"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ============================================================
 * MissionModal — 일일/주간 미션 탭 모달
 * ============================================================ */
interface MissionModalProps {
  missions:        MissionState[];
  weeklyMissions:  WeeklyMissionState[];
  onClaimDaily?:   (id: MissionId) => number;
  onClaimWeekly?:  (id: WeeklyMissionId) => number;
  onEarnCoins?:    (amount: number) => void;
  onAdWatched?:    () => void;
  onClose:         () => void;
}

function MissionModal({
  missions, weeklyMissions,
  onClaimDaily, onClaimWeekly,
  onEarnCoins, onAdWatched,
  onClose,
}: MissionModalProps) {
  const [tab, setTab] = useState<"daily" | "weekly">("daily");

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col h-[85dvh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-1.5">
            <img src="/icons/icon-mission.png" className="w-6 h-6 object-contain" alt="" draggable={false} />
            미션
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-board flex items-center justify-center text-foreground/40 hover:bg-cell transition-all text-sm"
          >✕</button>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 px-5 pb-3 flex-shrink-0">
          {(["daily", "weekly"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                "flex-1 py-2 rounded-xl text-sm font-bold transition-all",
                tab === t
                  ? "bg-primary text-white shadow-sm"
                  : "bg-board text-foreground/50 hover:bg-cell",
              ].join(" ")}
            >
              {t === "daily" ? "📅 일일" : "📆 주간"}
            </button>
          ))}
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {tab === "daily" ? (
            <DailyMissionList
              missions={missions}
              onClaim={onClaimDaily}
              onEarnCoins={onEarnCoins}
              onAdWatched={onAdWatched}
            />
          ) : (
            <WeeklyMissionList
              weeklyMissions={weeklyMissions}
              onClaim={onClaimWeekly}
              onEarnCoins={onEarnCoins}
              onAdWatched={onAdWatched}
            />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ── 일일 미션 목록 ──────────────────────────────────────── */
function DailyMissionList({
  missions,
  onClaim,
  onEarnCoins,
  onAdWatched,
}: {
  missions:     MissionState[];
  onClaim?:     (id: MissionId) => number;
  onEarnCoins?: (amount: number) => void;
  onAdWatched?: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <FreeCoinsButton onEarnCoins={onEarnCoins} onAdWatched={onAdWatched} />
      {DAILY_MISSIONS.map((mission) => {
        const state  = missions.find((s) => s.id === mission.id);
        const status = state?.status ?? "incomplete";
        const prog   = state?.progress ?? 0;

        return (
          <div
            key={mission.id}
            className={[
              "flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all",
              status === "claimed"
                ? "bg-black/4 opacity-50"
                : status === "complete"
                  ? "bg-emerald-50/80 ring-1 ring-emerald-200"
                  : "bg-board/60",
            ].join(" ")}
          >
            <span className="text-xl flex-shrink-0">{mission.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground leading-tight">{mission.title}</p>
              <p className="text-xs text-foreground/50">{mission.description}</p>
              {mission.target > 1 && status === "incomplete" && (
                <div className="mt-1 w-full h-1.5 bg-board rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/50 rounded-full transition-all"
                    style={{ width: `${(prog / mission.target) * 100}%` }}
                  />
                </div>
              )}
            </div>
            <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
              <span className="text-xs font-bold text-amber-500">🪙{mission.reward}</span>
              {status === "complete" && (
                <button
                  onClick={() => onClaim?.(mission.id)}
                  className="text-[10px] font-bold bg-emerald-500 text-white px-2.5 py-1 rounded-full hover:bg-emerald-600 active:scale-95 transition-all"
                >수령</button>
              )}
              {status === "claimed" && (
                <span className="text-[10px] text-foreground/30 font-medium">완료 ✓</span>
              )}
              {status === "incomplete" && mission.target > 1 && (
                <span className="text-[10px] text-foreground/30">{prog}/{mission.target}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── 주간 미션 목록 ──────────────────────────────────────── */
function WeeklyMissionList({
  weeklyMissions,
  onClaim,
  onEarnCoins,
  onAdWatched,
}: {
  weeklyMissions: WeeklyMissionState[];
  onClaim?:       (id: WeeklyMissionId) => number;
  onEarnCoins?:   (amount: number) => void;
  onAdWatched?:   () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {/* 무료 코인 (광고) */}
      <FreeCoinsButton onEarnCoins={onEarnCoins} onAdWatched={onAdWatched} />

      {WEEKLY_MISSIONS.map((mission) => {
        const state  = weeklyMissions.find((s) => s.id === mission.id);
        const status = state?.status ?? "incomplete";
        const prog   = state?.progress ?? 0;

        return (
          <div
            key={mission.id}
            className={[
              "flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all",
              status === "claimed"
                ? "bg-black/4 opacity-50"
                : status === "complete"
                  ? "bg-emerald-50/80 ring-1 ring-emerald-200"
                  : "bg-board/60",
            ].join(" ")}
          >
            <span className="text-xl flex-shrink-0">{mission.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground leading-tight">{mission.title}</p>
              <p className="text-xs text-foreground/50">{mission.description}</p>
              {mission.target > 1 && status === "incomplete" && (
                <div className="mt-1 w-full h-1.5 bg-board rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400/60 rounded-full transition-all"
                    style={{ width: `${(prog / mission.target) * 100}%` }}
                  />
                </div>
              )}
            </div>
            <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
              <span className="text-xs font-bold text-amber-500">🪙{mission.reward}</span>
              {status === "complete" && (
                <button
                  onClick={() => onClaim?.(mission.id)}
                  className="text-[10px] font-bold bg-emerald-500 text-white px-2.5 py-1 rounded-full hover:bg-emerald-600 active:scale-95 transition-all"
                >수령</button>
              )}
              {status === "claimed" && (
                <span className="text-[10px] text-foreground/30 font-medium">완료 ✓</span>
              )}
              {status === "incomplete" && mission.target > 1 && (
                <span className="text-[10px] text-foreground/30">{prog}/{mission.target}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
 * FreeCoinsButton — 광고 시청 무료 코인
 * ============================================================ */
interface FreeCoinsButtonProps {
  onEarnCoins?: (amount: number) => void;
  onAdWatched?: () => void;
}

function FreeCoinsButton({ onEarnCoins, onAdWatched }: FreeCoinsButtonProps) {
  const [adState, setAdState] = useState<"idle" | "watching">("idle");
  const [adInfo,  setAdInfo]  = useState(getAdCoinState());

  useEffect(() => { setAdInfo(getAdCoinState()); }, []);

  if (adInfo.remaining <= 0) {
    return (
      <div className="w-full py-3 rounded-2xl bg-board/40 border border-board text-center text-xs text-foreground/30 font-medium mb-1">
        오늘의 무료 코인을 모두 받았어요
      </div>
    );
  }

  const handleWatch = async () => {
    if (adState === "watching") return;
    setAdState("watching");
    const { watchAdForCoins } = await import("@/utils/adService");
    const earned = await watchAdForCoins();
    setAdState("idle");
    if (earned > 0) {
      onEarnCoins?.(earned);
      onAdWatched?.();
      setAdInfo(getAdCoinState());
    }
  };

  return (
    <button
      onClick={handleWatch}
      disabled={adState === "watching"}
      className={[
        "w-full py-2.5 rounded-2xl border-2 font-bold text-sm transition-all active:scale-95 mb-1",
        adState === "watching"
          ? "border-amber-200 bg-amber-50 text-amber-400 cursor-wait"
          : "border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100",
      ].join(" ")}
    >
      {adState === "watching" ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          광고 시청 중...
        </span>
      ) : (
        `📺 무료 코인 받기 +100 (오늘 ${adInfo.remaining}회 남음)`
      )}
    </button>
  );
}

/* ── 최고 점수 표시 ────────────────────────────────────────── */
function TodayStats() {
  let best = 0;
  try {
    const saved = localStorage.getItem("plant2048_bestScore");
    if (saved) best = parseInt(saved, 10);
  } catch { /* noop */ }

  if (best === 0) return null;

  return (
    <div className="text-center text-xs text-foreground/40 font-medium">
      역대 최고: <span className="text-primary font-bold">{best.toLocaleString()}</span>
    </div>
  );
}

/* ── 광고 배너 placeholder ─────────────────────────────────── */
function AdBanner({ position }: { position: "top" | "bottom" }) {
  return (
    <div
      className={[
        "w-full h-10 flex items-center justify-center text-[11px] font-medium select-none flex-shrink-0 relative z-[1]",
        "bg-white/55 backdrop-blur-sm text-foreground/30",
        position === "top" ? "border-b border-white/40" : "border-t border-white/40",
      ].join(" ")}
      aria-hidden="true"
    >
      AD
    </div>
  );
}
