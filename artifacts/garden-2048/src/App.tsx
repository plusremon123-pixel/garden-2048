/* ============================================================
 * App.tsx
 * 앱 루트 컴포넌트
 *
 * - useAppState:  화면 전환 + 테마 선택
 * - usePlayer:    코인/클리어레벨 상태 (앱 전체에서 공유)
 * - useMissions:  일일 미션 상태 (앱 전체에서 공유)
 *
 * 계절 CSS 변수를 clearedLevel 변경 시마다 전역 주입한다.
 * ============================================================ */

import { useState, useEffect, useRef } from "react";
import { useAppState } from "@/hooks/useAppState";
import { usePlayer } from "@/hooks/usePlayer";
import { useMissions } from "@/hooks/useMissions";
import { useSettings } from "@/hooks/useSettings";
import { useSubscription } from "@/hooks/useSubscription";
import { FrontScreen } from "@/components/FrontScreen";
import { SplashScreen } from "@/components/SplashScreen";
import { TutorialModal } from "@/components/TutorialModal";
import Game from "@/pages/Game";
import EndlessGame from "@/pages/EndlessGame";
import { EndlessDifficultyModal } from "@/components/modals/EndlessDifficultyModal";
import { PremiumWelcomeModal } from "@/components/modals/PremiumWelcomeModal";
import {
  loadEndlessSave,
  type EndlessDifficulty,
  type EndlessSaveData,
} from "@/utils/endlessModeData";
import { giveInitialGiftIfNeeded, giveInitialLivesIfNeeded } from "@/utils/economyUtils";
import {
  loadInventory, saveInventory,
  type Inventory, type ShopItemId,
} from "@/utils/shopData";
import { getSeason } from "@/utils/seasonData";
import { applySeasonCssVars } from "@/utils/seasonTheme";
import { initAdmob } from "@/utils/adProvider";
import { PLAYER_STORAGE_KEY } from "@/utils/playerData";

const TUTORIAL_KEY = "plant2048_tutorial_done";

/* ── 초기 선물: 훅 실행 전 localStorage에 직접 반영 ─────── */
giveInitialGiftIfNeeded();
giveInitialLivesIfNeeded();

/* ── AdMob 초기화 (네이티브에서만 실제 동작, 웹은 noop) ─── */
void initAdmob();

export default function App() {
  const { currentScreen, selectedThemeId, selectTheme, goToTutorial, goToGame, goToEndlessSelect, goToEndless, goToFront } =
    useAppState();

  /** DEV 전용: Game 컴포넌트의 강제 승리 함수를 보관 */
  const devForceWinRef = useRef<(() => void) | null>(null);

  /* ── 스플래시 완료 핸들러 ───────────────────────── */
  const handleSplashDone = () => {
    if (!localStorage.getItem(TUTORIAL_KEY)) {
      goToTutorial(); // 첫 실행 → 튜토리얼
    } else {
      goToFront();    // 복귀 플레이어 → 홈
    }
  };

  /* ── 튜토리얼 완료 핸들러 ──────────────────────── */
  const handleTutorialDone = () => {
    goToFront();
  };

  /* ── 무한 모드 상태 ─────────────────────────────────────── */
  const [endlessDifficulty, setEndlessDifficulty] = useState<EndlessDifficulty>("easy");
  const [endlessResumeSave, setEndlessResumeSave] = useState<EndlessSaveData | null>(null);

  const { player, clearLevel, spendCoins, addCoins, reloadPlayer, spendLife, addLives } = usePlayer();
  const {
    missions, updateMission, claimMission,
    weeklyMissions, updateWeeklyMission, claimWeeklyMission,
  } = useMissions();
  const { settings, toggleSetting } = useSettings();
  const { sub, active: isPremiumActive, startTrial, buyPremium } = useSubscription();

  /* ── 프리미엄 환영 모달 ─────────────────────────────────── */
  const [showPremiumWelcome, setShowPremiumWelcome] = useState(false);

  const handleStartTrial = () => {
    startTrial();
    setShowPremiumWelcome(true);
  };
  const handleBuyPremium = async () => {
    await buyPremium();
    setShowPremiumWelcome(true);
  };

  /* ── 인벤토리 (홈 상점용 — Game.tsx의 useShop과 별개로 관리) */
  const [inventory, setInventory] = useState<Inventory>(loadInventory);

  const atSplashOrTutorial = currentScreen === "splash" || currentScreen === "tutorial";
  const atFront         = currentScreen === "front";
  const atEndlessSelect = currentScreen === "endless-select";
  const atEndless       = currentScreen === "endless";

  /* ── 계절 CSS 변수 전역 주입 ─────────────────────────────── */
  useEffect(() => {
    const season = getSeason(Math.max(1, player.clearedLevel + 1));
    applySeasonCssVars(season);
  }, [player.clearedLevel]);

  /* 일일 미션 보상 수령 → 코인 지급 */
  const handleClaimMission = (id: Parameters<typeof claimMission>[0]): number => {
    const coins = claimMission(id);
    if (coins > 0) addCoins(coins);
    return coins;
  };

  /* 주간 미션 보상 수령 → 코인 지급 */
  const handleClaimWeeklyMission = (id: Parameters<typeof claimWeeklyMission>[0]): number => {
    const coins = claimWeeklyMission(id);
    if (coins > 0) addCoins(coins);
    return coins;
  };

  /* ── 홈 상점에서 아이템 구매 */
  const handleBuyItem = (id: ShopItemId, cost: number): boolean => {
    const ok = spendCoins(cost);
    if (!ok) return false;
    setInventory((prev) => {
      const next: Inventory = { ...prev, [id]: (prev[id] ?? 0) + 1 };
      saveInventory(next);
      return next;
    });
    return true;
  };

  /* 무한 모드 선택 화면 → 게임 시작
     setState 는 같은 이벤트 핸들러 내에서 배치 처리되므로
     goToEndless() 직전에 setState 를 불러도 다음 렌더에서 새 값이 반영된다.
     (이전의 useEffect 기반 지연 전환은 동일 난이도 재선택 시 상태 변경이
      감지되지 않아 두 번 클릭해야 전환되는 버그가 있었음) */
  const handleStartEndless = (difficulty: EndlessDifficulty, resume: boolean) => {
    setEndlessDifficulty(difficulty);
    setEndlessResumeSave(resume ? loadEndlessSave() : null);
    goToEndless();
  };

  /* 홈 화면으로 돌아올 때 플레이어/인벤토리 동기화 */
  const handleGoToFront = () => {
    reloadPlayer();
    setInventory(loadInventory()); // Game.tsx에서 구매한 아이템 반영
    goToFront();
  };

  return (
    <div
      className="fixed inset-0"
      style={{ clipPath: "inset(0 0 0 0)" }}
    >
      {/* ── 스플래시 / 튜토리얼 ──────────────────────── */}
      {currentScreen === "splash" && (
        <SplashScreen onDone={handleSplashDone} />
      )}
      {currentScreen === "tutorial" && (
        <TutorialModal onDone={handleTutorialDone} />
      )}

      {/* 슬라이딩 트랙 */}
      <div
        className="flex h-full transition-transform duration-[350ms] ease-in-out"
        style={{
          width:     "200vw",
          transform: atFront ? "translateX(0)" : "translateX(-50%)",
          visibility: atSplashOrTutorial ? "hidden" : "visible",
        }}
      >
        {/* ── FrontScreen (왼쪽 패널) ────────────────── */}
        <div
          className="w-[100vw] h-full overflow-hidden"
          style={{ visibility: atFront ? "visible" : "hidden" }}
          aria-hidden={!atFront}
        >
          <FrontScreen
            player={player}
            selectedThemeId={selectedThemeId}
            onSelectTheme={selectTheme}
            onStartGame={goToGame}
            missions={missions}
            onClaimMission={handleClaimMission}
            weeklyMissions={weeklyMissions}
            onClaimWeeklyMission={handleClaimWeeklyMission}
            onEarnCoins={addCoins}
            onAdWatched={() => updateWeeklyMission("ad_reward_3")}
            inventory={inventory}
            onBuyItem={handleBuyItem}
            settings={settings}
            onToggleSetting={toggleSetting}
            isPremiumActive={isPremiumActive}
            subscriptionState={sub}
            onBuyPremium={handleBuyPremium}
            onStartEndless={handleStartEndless}
          />
        </div>

        {/* ── GameScreen / EndlessGame (오른쪽 패널) ── */}
        <div
          className="w-[100vw] h-full overflow-y-auto"
          style={{ visibility: atFront ? "hidden" : "visible" }}
          aria-hidden={atFront}
        >
          {atEndless ? (
            <EndlessGame
              difficulty={endlessDifficulty}
              resumeSave={endlessResumeSave}
              onHome={handleGoToFront}
              onEndlessHome={goToEndlessSelect}
              onEarnCoins={addCoins}
              isPremiumActive={isPremiumActive}
            />
          ) : (
            <Game
              themeId={selectedThemeId}
              isActive={!atFront && !atEndless && !atEndlessSelect && !atSplashOrTutorial}
              player={player}
              onClearLevel={clearLevel}
              onEarnCoins={addCoins}
              onSpendCoins={spendCoins}
              onSpendLife={spendLife}
              onAddLives={addLives}
              onHome={handleGoToFront}
              onThemeChange={selectTheme}
              updateMission={updateMission}
              updateWeeklyMission={updateWeeklyMission}
              subscriptionState={sub}
              onStartTrial={handleStartTrial}
              onBuyPremium={handleBuyPremium}
              devForceWinRef={devForceWinRef}
            />
          )}
        </div>
      </div>

      {/* ── 무한 게임 선택 화면 (풀페이지 오버레이) ─────── */}
      {atEndlessSelect && (
        <EndlessDifficultyModal
          onStart={(diff) => handleStartEndless(diff, false)}
          onContinue={(diff) => handleStartEndless(diff, true)}
          onClose={handleGoToFront}
          season={getSeason(Math.max(1, player.clearedLevel + 1))}
        />
      )}

      {/* ── 프리미엄 환영 모달 ───────────────────────────────── */}
      {showPremiumWelcome && (
        <PremiumWelcomeModal
          season={getSeason(Math.max(1, player.clearedLevel + 1))}
          onDone={() => setShowPremiumWelcome(false)}
        />
      )}

      {/* ── DEV 전용: 레벨 이동 버튼 (프로덕션에서는 렌더링 안 됨) ── */}
      {import.meta.env.DEV && (
        <DevToolsPanel onForceWin={() => devForceWinRef.current?.()} />
      )}
    </div>
  );
}

function DevToolsPanel({ onForceWin }: { onForceWin: () => void }) {
  const [open, setOpen] = useState(false);

  const jumpToLevel = (clearedLevel: number) => {
    localStorage.setItem(
      PLAYER_STORAGE_KEY,
      JSON.stringify({ coins: 9999, clearedLevel, lives: 10 }),
    );
    window.location.reload();
  };

  const resetProgress = () => {
    localStorage.setItem(
      PLAYER_STORAGE_KEY,
      JSON.stringify({ coins: 9999, clearedLevel: 0, lives: 10 }),
    );
    localStorage.removeItem("plant2048_subscription");
    localStorage.removeItem("plant2048_lives_init_v1");
    window.location.reload();
  };

  const groups = [
    {
      title: "Cards",
      tone: { border: "#94a3b8", bg: "#f1f5f9", color: "#475569" },
      items: [
        { label: "🌵 9", lv: 8 },
        { label: "🌻 99", lv: 98 },
        { label: "🍀 399", lv: 398 },
      ],
    },
    {
      title: "Season 1",
      tone: { border: "#a7f3d0", bg: "#ecfdf5", color: "#065f46" },
      items: [
        { label: "🌸 260", lv: 259 },
        { label: "☀️ 500", lv: 499 },
        { label: "🍂 760", lv: 759 },
      ],
    },
    {
      title: "Season 2",
      tone: { border: "#c4b5fd", bg: "#f5f3ff", color: "#5b21b6" },
      items: [
        { label: "🌸 1260", lv: 1259 },
        { label: "☀️ 1500", lv: 1499 },
        { label: "🍂 1760", lv: 1759 },
      ],
    },
  ] as const;

  const panelButtonStyle = (tone: { border: string; bg: string; color: string }) => ({
    fontSize: 11,
    fontWeight: 800,
    padding: "5px 8px",
    borderRadius: 9,
    border: `1.5px solid ${tone.border}`,
    background: tone.bg,
    color: tone.color,
    cursor: "pointer",
    lineHeight: 1.25,
  });

  return (
    <div
      style={{
        position: "fixed",
        right: 8,
        bottom: 52,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 6,
        pointerEvents: "none",
      }}
    >
      {open && (
        <div
          style={{
            width: 164,
            maxHeight: "min(62dvh, 420px)",
            overflowY: "auto",
            borderRadius: 14,
            padding: 8,
            background: "rgba(255,255,255,0.94)",
            border: "1px solid rgba(15,23,42,0.16)",
            boxShadow: "0 12px 28px rgba(15,23,42,0.20)",
            backdropFilter: "blur(8px)",
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 900, color: "#334155" }}>QA Tools</span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close QA tools"
              style={{
                width: 24,
                height: 24,
                borderRadius: 999,
                border: "none",
                background: "#e2e8f0",
                color: "#475569",
                cursor: "pointer",
                fontWeight: 900,
              }}
            >
              ×
            </button>
          </div>

          {groups.map((group) => (
            <div key={group.title} style={{ marginTop: 6 }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: "#94a3b8", margin: "0 0 3px 2px" }}>
                {group.title}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3 }}>
                {group.items.map(({ label, lv }) => (
                  <button
                    key={lv}
                    onClick={() => jumpToLevel(lv)}
                    style={panelButtonStyle(group.tone)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div style={{ height: 1, background: "#e2e8f0", margin: "8px 0" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            <button
              onClick={resetProgress}
              style={panelButtonStyle({ border: "#fca5a5", bg: "#fef2f2", color: "#dc2626" })}
            >
              Reset
            </button>
            <button
              onClick={onForceWin}
              style={panelButtonStyle({ border: "#86efac", bg: "#f0fdf4", color: "#16a34a" })}
            >
              Complete
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="Toggle QA tools"
        style={{
          minWidth: 44,
          height: 34,
          borderRadius: 999,
          border: "1px solid rgba(15,23,42,0.18)",
          background: open ? "#0f172a" : "rgba(255,255,255,0.92)",
          color: open ? "#f8fafc" : "#334155",
          boxShadow: "0 6px 16px rgba(15,23,42,0.18)",
          fontSize: 12,
          fontWeight: 900,
          cursor: "pointer",
          pointerEvents: "auto",
        }}
      >
        QA
      </button>
    </div>
  );
}
