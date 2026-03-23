/* ============================================================
 * App.tsx
 * 앱 루트 컴포넌트
 *
 * - useAppState: 화면 전환 + 테마 선택
 * - usePlayer: 레벨/XP/코인 상태 (앱 전체에서 공유)
 *
 * 화면 전환 방식:
 *   두 화면을 가로로 나란히 배치 → translateX 슬라이드
 * ============================================================ */

import { useAppState } from "@/hooks/useAppState";
import { usePlayer } from "@/hooks/usePlayer";
import { FrontScreen } from "@/components/FrontScreen";
import Game from "@/pages/Game";

export default function App() {
  const { currentScreen, selectedThemeId, selectTheme, goToGame, goToFront } =
    useAppState();
  const { player, earnXp } = usePlayer();

  const atFront = currentScreen === "front";

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div
        className="flex h-full transition-transform duration-[350ms] ease-in-out will-change-transform"
        style={{
          width: "200vw",
          transform: atFront ? "translateX(0)" : "translateX(-50%)",
        }}
      >
        {/* ── FrontScreen (왼쪽 패널) ────────────────── */}
        <div
          className="w-[100vw] h-full overflow-y-auto"
          aria-hidden={!atFront}
        >
          <FrontScreen
            player={player}
            selectedThemeId={selectedThemeId}
            onSelectTheme={selectTheme}
            onStartGame={goToGame}
          />
        </div>

        {/* ── GameScreen (오른쪽 패널) ───────────────── */}
        <div
          className="w-[100vw] h-full overflow-y-auto"
          aria-hidden={atFront}
        >
          <Game
            themeId={selectedThemeId}
            player={player}
            onEarnXp={earnXp}
            onHome={goToFront}
          />
        </div>
      </div>
    </div>
  );
}
