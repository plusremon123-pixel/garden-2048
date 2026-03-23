/* ============================================================
 * FrontScreen.tsx
 * 앱 진입 화면 컴포넌트
 *
 * 구성:
 *  - 게임 제목 & 설명
 *  - 테마 선택 카드 (4종)
 *  - 게임 시작 버튼
 *  - 광고 placeholder
 * ============================================================ */

import { THEMES, THEME_ORDER, type Theme } from "@/utils/themes";

interface FrontScreenProps {
  selectedThemeId: string;
  onSelectTheme: (id: string) => void;
  onStartGame: () => void;
}

export function FrontScreen({ selectedThemeId, onSelectTheme, onStartGame }: FrontScreenProps) {
  return (
    <div className="flex flex-col items-center min-h-[100dvh] w-full bg-background px-4 py-6">

      {/* ── 광고 placeholder (상단) ─────────────────────── */}
      <AdBanner position="top" />

      {/* ── 메인 콘텐츠 ──────────────────────────────────── */}
      <main className="flex flex-col items-center flex-1 w-full max-w-[420px] justify-center gap-8 py-6">

        {/* 제목 영역 */}
        <div className="text-center">
          <div className="text-6xl mb-3">🌱</div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-primary leading-tight">
            식물 2048
          </h1>
          <p className="mt-3 text-sm md:text-base text-foreground/60 font-medium">
            씨앗을 합쳐 전설의 꽃을 피워요
          </p>
        </div>

        {/* 테마 선택 */}
        <section className="w-full">
          <h2 className="text-xs font-bold uppercase tracking-widest text-foreground/40 text-center mb-3">
            테마 선택
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {THEME_ORDER.map((id) => {
              const theme = THEMES[id] as Theme;
              const isSelected = id === selectedThemeId;
              const isAvailable = theme.available;

              return (
                <button
                  key={id}
                  onClick={() => isAvailable && onSelectTheme(id)}
                  aria-pressed={isSelected}
                  disabled={!isAvailable}
                  className={[
                    "relative flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all duration-200 select-none",
                    isAvailable ? "cursor-pointer active:scale-95" : "cursor-default opacity-50",
                    isSelected
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-transparent bg-board hover:bg-cell",
                  ].join(" ")}
                >
                  {/* 선택 표시 체크 */}
                  {isSelected && (
                    <span className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white text-xs leading-none">
                      ✓
                    </span>
                  )}

                  <span className="text-3xl">{theme.emoji}</span>
                  <span className="font-display font-bold text-base text-foreground">{theme.name}</span>
                  <span className="text-[11px] text-foreground/50 text-center leading-snug">{theme.description}</span>

                  {/* 준비 중 배지 */}
                  {!isAvailable && (
                    <span className="absolute bottom-2 right-2 text-[10px] font-bold bg-foreground/10 text-foreground/50 px-1.5 py-0.5 rounded-full">
                      준비 중
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* 게임 시작 버튼 */}
        <button
          onClick={onStartGame}
          className="w-full btn-cute btn-primary text-xl py-4 tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
        >
          게임 시작 🌸
        </button>

        {/* 최고점수 힌트 */}
        <BestScoreHint />

      </main>

      {/* ── 광고 placeholder (하단) ─────────────────────── */}
      <AdBanner position="bottom" />

    </div>
  );
}

/* ── 최고 점수 힌트 ────────────────────────────────────── */
function BestScoreHint() {
  let best = 0;
  try {
    const saved = localStorage.getItem("plant2048_bestScore");
    if (saved) best = parseInt(saved, 10);
  } catch { /* noop */ }

  if (best === 0) return null;

  return (
    <p className="text-sm text-foreground/40 font-medium">
      역대 최고 점수: <span className="text-primary font-bold">{best.toLocaleString()}</span>
    </p>
  );
}

/* ── 광고 배너 placeholder ─────────────────────────────── */
function AdBanner({ position }: { position: "top" | "bottom" }) {
  return (
    <div
      className={[
        "w-full max-w-[420px] h-12 rounded-xl bg-board/60 border border-dashed border-board",
        "flex items-center justify-center text-[11px] text-foreground/25 font-medium select-none",
        position === "top" ? "mb-2" : "mt-2",
      ].join(" ")}
      aria-hidden="true"
    >
      AD
    </div>
  );
}
