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
import Game from "@/pages/Game";
import EndlessGame from "@/pages/EndlessGame";
import { EndlessDifficultyModal } from "@/components/modals/EndlessDifficultyModal";
import {
  loadEndlessSave,
  type EndlessDifficulty,
  type EndlessSaveData,
} from "@/utils/endlessModeData";
import { giveInitialGiftIfNeeded } from "@/utils/economyUtils";
import {
  loadInventory, saveInventory,
  type Inventory, type ShopItemId,
} from "@/utils/shopData";
import { getSeason } from "@/utils/seasonData";
import { applySeasonCssVars } from "@/utils/seasonTheme";
import { initAdmob } from "@/utils/adProvider";

/* ── 초기 선물: 훅 실행 전 localStorage에 직접 반영 ─────── */
giveInitialGiftIfNeeded();

/* ── AdMob 초기화 (네이티브에서만 실제 동작, 웹은 noop) ─── */
void initAdmob();

export default function App() {
  const { currentScreen, selectedThemeId, selectTheme, goToGame, goToEndlessSelect, goToEndless, goToFront } =
    useAppState();

  /* ── 무한 모드 상태 ─────────────────────────────────────── */
  const [endlessDifficulty, setEndlessDifficulty] = useState<EndlessDifficulty>("easy");
  const [endlessResumeSave, setEndlessResumeSave] = useState<EndlessSaveData | null>(null);
  const pendingGoEndless = useRef(false);

  const { player, clearLevel, spendCoins, addCoins, reloadPlayer } = usePlayer();
  const {
    missions, updateMission, claimMission,
    weeklyMissions, updateWeeklyMission, claimWeeklyMission,
  } = useMissions();
  const { settings, toggleSetting } = useSettings();
  const { sub, active: isPremiumActive, startTrial, buyPremium } = useSubscription();

  /* ── 인벤토리 (홈 상점용 — Game.tsx의 useShop과 별개로 관리) */
  const [inventory, setInventory] = useState<Inventory>(loadInventory);

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
     setState는 비동기이므로 상태 반영 후 useEffect에서 화면 전환 */
  const handleStartEndless = (difficulty: EndlessDifficulty, resume: boolean) => {
    setEndlessDifficulty(difficulty);
    setEndlessResumeSave(resume ? loadEndlessSave() : null);
    pendingGoEndless.current = true;
  };

  useEffect(() => {
    if (pendingGoEndless.current) {
      pendingGoEndless.current = false;
      goToEndless();
    }
  }, [endlessDifficulty, endlessResumeSave]); // eslint-disable-line react-hooks/exhaustive-deps

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
      {/* 슬라이딩 트랙 */}
      <div
        className="flex h-full transition-transform duration-[350ms] ease-in-out"
        style={{
          width:     "200vw",
          transform: atFront ? "translateX(0)" : "translateX(-50%)",
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
            onBuyPremium={buyPremium}
            onStartEndless={goToEndlessSelect}
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
            />
          ) : (
            <Game
              themeId={selectedThemeId}
              isActive={!atFront && !atEndless && !atEndlessSelect}
              player={player}
              onClearLevel={clearLevel}
              onEarnCoins={addCoins}
              onSpendCoins={spendCoins}
              onHome={handleGoToFront}
              onThemeChange={selectTheme}
              updateMission={updateMission}
              updateWeeklyMission={updateWeeklyMission}
              subscriptionState={sub}
              onStartTrial={startTrial}
              onBuyPremium={buyPremium}
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
    </div>
  );
}
