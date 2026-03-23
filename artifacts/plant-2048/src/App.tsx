/* ============================================================
 * App.tsx
 * 앱 루트 컴포넌트
 *
 * 화면 전환 방식:
 *  두 화면을 가로로 나란히 (각 50vw) 배치하고,
 *  컨테이너를 translateX 로 슬라이드하여 전환.
 *  overflow: hidden 으로 가로 스크롤바 방지.
 *  각 패널은 height: 100dvh + overflow-y: auto 로 독립 스크롤.
 * ============================================================ */

import { useAppState } from "@/hooks/useAppState";
import { FrontScreen } from "@/components/FrontScreen";
import Game from "@/pages/Game";

export default function App() {
  const { currentScreen, selectedThemeId, selectTheme, goToGame, goToFront } =
    useAppState();

  const atFront = currentScreen === "front";

  return (
    /* 전체 뷰포트 크기로 잘라낸 프레임 */
    <div className="fixed inset-0 overflow-hidden">
      {/*
       * 슬라이딩 트랙: 두 화면이 나란히 놓임.
       * 각 화면은 뷰포트 너비(100%) 만큼 차지.
       * translateX(0)   → FrontScreen 보임
       * translateX(-50%) → GameScreen 보임
       */}
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
          <Game themeId={selectedThemeId} onHome={goToFront} />
        </div>
      </div>
    </div>
  );
}
