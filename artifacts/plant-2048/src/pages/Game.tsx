/* ============================================================
 * Game.tsx
 * 게임 화면 페이지 컴포넌트
 *
 * Props:
 *  - themeId: 현재 적용할 테마 ID
 *  - onHome: 홈 화면으로 돌아가는 콜백
 * ============================================================ */

import { useState } from "react";
import { useGame } from "@/hooks/useGame";
import { Board } from "@/components/Board";
import { Header } from "@/components/Header";
import { Modal } from "@/components/Modal";

interface GameProps {
  themeId: string;
  onHome: () => void;
}

export default function Game({ themeId, onHome }: GameProps) {
  const {
    activeTiles,
    graveyard,
    score,
    bestScore,
    hasLost,
    showWinModal,
    handleMove,
    resetGame,
    playOn,
  } = useGame();

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showHomeConfirm, setShowHomeConfirm] = useState(false);

  const tilesList = Object.values(activeTiles);

  /* 새 게임 버튼: 점수가 있으면 확인 모달 */
  const handleResetRequest = () => {
    if (score > 0 && !hasLost && !showWinModal) {
      setShowResetConfirm(true);
    } else {
      resetGame();
    }
  };

  /* 홈 버튼: 점수가 있으면 확인 모달 */
  const handleHomeRequest = () => {
    if (score > 0 && !hasLost && !showWinModal) {
      setShowHomeConfirm(true);
    } else {
      onHome();
    }
  };

  const confirmReset = () => {
    setShowResetConfirm(false);
    resetGame();
  };

  const confirmHome = () => {
    setShowHomeConfirm(false);
    onHome();
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center bg-background">

      {/* ── 광고 placeholder (상단) ─────────────────────── */}
      <div
        className="w-full h-12 bg-board/60 border-b border-dashed border-board flex items-center justify-center text-[11px] text-foreground/20 font-medium select-none"
        aria-hidden="true"
      >
        AD
      </div>

      {/* ── 메인 콘텐츠 ──────────────────────────────────── */}
      <div className="w-full max-w-[500px] flex flex-col flex-1 px-4 pb-4">

        <Header
          score={score}
          bestScore={bestScore}
          themeId={themeId}
          onReset={handleResetRequest}
          onHome={handleHomeRequest}
        />

        <main className="w-full flex-1 flex flex-col justify-center">
          <Board
            tiles={tilesList}
            graveyard={graveyard}
            onSwipe={handleMove}
            themeId={themeId}
          />
        </main>

        {/* ── 광고 placeholder (하단) ─────────────────────── */}
        <div
          className="mt-4 w-full h-12 rounded-xl bg-board/60 border border-dashed border-board flex items-center justify-center text-[11px] text-foreground/20 font-medium select-none"
          aria-hidden="true"
        >
          AD
        </div>

      </div>

      {/* ── 모달 레이어 ─────────────────────────────────── */}

      {/* 승리 모달 */}
      <Modal
        isOpen={showWinModal}
        type="success"
        title="전설의 꽃이 피었어요!"
        description={`축하합니다! 놀라운 식물 키우기 실력이네요. (점수: ${score.toLocaleString()})`}
        primaryAction={{ label: "계속 플레이", onClick: playOn }}
        secondaryAction={{ label: "새 게임 시작", onClick: resetGame }}
      />

      {/* 게임 오버 모달 */}
      <Modal
        isOpen={hasLost}
        type="danger"
        title="더 이상 움직일 수 없어요"
        description={`화분에 자리가 없네요. 최고 점수는 ${bestScore.toLocaleString()}점 입니다!`}
        primaryAction={{ label: "새 게임 시작", onClick: resetGame }}
        secondaryAction={{ label: "홈으로", onClick: onHome }}
      />

      {/* 새 게임 확인 모달 */}
      <Modal
        isOpen={showResetConfirm}
        type="info"
        title="새 게임 시작"
        description="진행 중인 게임이 초기화됩니다. 정말 다시 시작할까요?"
        primaryAction={{ label: "네, 다시 할래요", onClick: confirmReset }}
        secondaryAction={{ label: "취소", onClick: () => setShowResetConfirm(false) }}
      />

      {/* 홈 이동 확인 모달 */}
      <Modal
        isOpen={showHomeConfirm}
        type="info"
        title="홈으로 돌아가기"
        description="진행 중인 게임이 종료됩니다. 홈 화면으로 돌아갈까요?"
        primaryAction={{ label: "홈으로", onClick: confirmHome }}
        secondaryAction={{ label: "계속 플레이", onClick: () => setShowHomeConfirm(false) }}
      />

    </div>
  );
}
