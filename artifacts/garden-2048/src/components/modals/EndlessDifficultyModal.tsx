/* ============================================================
 * EndlessDifficultyModal.tsx
 * 무한 게임 난이도 선택 — 계절 배경 + 나무 카드 스타일
 * ============================================================ */

import { useState, useEffect, useRef } from "react";
import {
  ENDLESS_CONFIGS,
  loadEndlessSave,
  type EndlessDifficulty,
} from "@/utils/endlessModeData";
import { useTranslation } from "@/i18n";
import type { Season } from "@/utils/seasonData";

/* ── 계절별 무한 게임 배경 ────────────────────────────────── */
const ENDLESS_BG: Record<Season, string> = {
  spring: "/ENDLESS_bg_1.svg",
  summer: "/ENDLESS_bg_2.svg",
  autumn: "/ENDLESS_bg_3.svg",
  winter: "/ENDLESS_bg_4.svg",
};

/* ── 홈 화면과 동일한 디자인 좌표계 ────────────────────────
   ENDLESS_bg_*.svg = 1120 × 2048 (home_bg와 동일)
   START 버튼 위치: (365, 1715), 원본 너비 430px
──────────────────────────────────────────────────────────── */
const DESIGN_W = 1120;
const DESIGN_H = 2048;
const BTN_DESIGN_X = 365;
const BTN_DESIGN_Y = 1715;
const BTN_DESIGN_W = 430;

interface BtnLayout { left: number; top: number; width: number; containerH: number }

function calcBtnLayout(containerW: number, containerH: number): BtnLayout {
  const scale   = Math.max(containerW / DESIGN_W, containerH / DESIGN_H);
  const renderW = DESIGN_W * scale;
  const renderH = DESIGN_H * scale;
  const offsetX = (containerW - renderW) / 2;
  const offsetY = 0;
  const scaleX  = renderW / DESIGN_W;
  const scaleY  = renderH / DESIGN_H;
  return {
    left:       offsetX + BTN_DESIGN_X * scaleX,
    top:        offsetY + BTN_DESIGN_Y * scaleY,
    width:      BTN_DESIGN_W * scaleX,
    containerH,
  };
}

/* ── 난이도 설정 ─────────────────────────────────────────── */
const DIFF_CONFIG: Record<EndlessDifficulty, {
  emoji:          string;
  accent:         string;   // 포인트 컬러
  bgUnsel:        string;   // 비선택 배경
  bgSel:          string;   // 선택 배경
  borderUnsel:    string;
  borderSel:      string;
  glow:           string;
  checkColor:     string;
}> = {
  easy: {
    emoji:       "🌱",
    accent:      "#6ee7a0",
    bgUnsel:     "rgba(30,60,35,0.92)",
    bgSel:       "rgba(20,70,38,0.97)",
    borderUnsel: "rgba(80,160,90,0.6)",
    borderSel:   "#6ee7a0",
    glow:        "rgba(110,231,160,0.30)",
    checkColor:  "#22c55e",
  },
  normal: {
    emoji:       "🌿",
    accent:      "#fbbf24",
    bgUnsel:     "rgba(55,42,10,0.92)",
    bgSel:       "rgba(70,50,5,0.97)",
    borderUnsel: "rgba(180,130,30,0.6)",
    borderSel:   "#fbbf24",
    glow:        "rgba(251,191,36,0.30)",
    checkColor:  "#f59e0b",
  },
  hard: {
    emoji:       "🌵",
    accent:      "#f87171",
    bgUnsel:     "rgba(55,18,18,0.92)",
    bgSel:       "rgba(75,18,18,0.97)",
    borderUnsel: "rgba(180,60,60,0.6)",
    borderSel:   "#f87171",
    glow:        "rgba(248,113,113,0.30)",
    checkColor:  "#ef4444",
  },
};

const DIFF_ORDER: EndlessDifficulty[] = ["easy", "normal", "hard"];

interface EndlessDifficultyModalProps {
  onStart:    (difficulty: EndlessDifficulty) => void;
  onContinue: (difficulty: EndlessDifficulty) => void;
  onClose:    () => void;
  season?:    Season;
}

export function EndlessDifficultyModal({
  onStart, onContinue, onClose, season = "spring",
}: EndlessDifficultyModalProps) {
  const { t } = useTranslation();
  const save = loadEndlessSave();
  const containerRef = useRef<HTMLDivElement>(null);

  const [selected,    setSelected]    = useState<EndlessDifficulty>("normal");
  const [visible,     setVisible]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [btnLayout,   setBtnLayout]   = useState<BtnLayout>({ left: 0, top: 0, width: 177, containerH: 844 });

  /* 버튼 위치 계산 — 컨테이너 크기 기준 */
  useEffect(() => {
    const recalc = () => {
      const el = containerRef.current;
      const w  = el ? el.clientWidth  : window.innerWidth;
      const h  = el ? el.clientHeight : window.innerHeight;
      setBtnLayout(calcBtnLayout(w, h));
    };
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(id);
  }, []);

  const handleStartPress = () => {
    if (save && save.difficulty === selected) {
      setShowConfirm(true);
    } else {
      onStart(selected);
    }
  };

  const bgUrl = ENDLESS_BG[season] ?? ENDLESS_BG.spring;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-[140] flex flex-col overflow-hidden"
    >

      {/* ── 계절 배경 ─────────────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("${bgUrl}")`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      />

      {/* ── 상단 AD ───────────────────────────────────────── */}
      <div
        className="relative z-20 w-full h-10 flex-shrink-0 flex items-center justify-center text-[11px] font-medium select-none bg-white/55 backdrop-blur-sm text-foreground/30 border-b border-white/40"
        aria-hidden="true"
      >AD</div>

      {/* ── 헤더 ─────────────────────────────────────────── */}
      <div
        className="relative z-10 flex-shrink-0"
        style={{ padding: "10px 16px 12px" }}
      >
        {/* 뒤로가기 — 최소한 아이콘만 */}
        <button
          onClick={onClose}
          className="active:scale-90 transition-transform"
          style={{
            position: "absolute", left: 16, top: 12,
            width: 36, height: 36, borderRadius: 99,
            background: "rgba(0,0,0,0.3)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, color: "#fff", cursor: "pointer",
            zIndex: 2,
          }}
        >←</button>

        {/* 타이틀 영역 */}
        <div style={{
          textAlign: "center",
          paddingTop: 6,
        }}>
          <h1 style={{
            fontSize: 28, fontWeight: 900, color: "#fff",
            letterSpacing: "0.08em", lineHeight: 1,
            textShadow: "0 2px 16px rgba(0,0,0,0.5)",
          }}>
            {t("endless.title")}
          </h1>
          <p style={{
            fontSize: 13, fontWeight: 600, marginTop: 6,
            color: "rgba(255,255,255,0.55)",
            letterSpacing: "0.04em",
          }}>
            {t("endless.selectDiff")}
          </p>
        </div>
      </div>

      {/* ── 카드 영역 (화면 중앙) ────────────────────────── */}
      <div
        className="relative z-10 flex flex-col items-center flex-1 justify-center"
        style={{ gap: 10, paddingBottom: btnLayout.containerH - btnLayout.top }}
      >
        {DIFF_ORDER.map((diff, i) => {
          const cfg   = ENDLESS_CONFIGS[diff];
          const dc    = DIFF_CONFIG[diff];
          const isSel = selected === diff;
          const delay = i * 0.08;

          return (
            <div
              key={diff}
              className="relative"
              style={{
                width: "70%",
                maxWidth: 280,
                opacity: visible ? 1 : 0,
                transform: visible ? "none" : "translateY(24px)",
                transition: `opacity 0.4s ease ${delay}s, transform 0.4s ease ${delay}s`,
              }}
            >
              <button
                onClick={() => setSelected(diff)}
                className="active:scale-[0.98]"
                style={{
                  width: "100%",
                  borderRadius: 14,
                  padding: "10px 12px",
                  background: isSel ? dc.bgSel : dc.bgUnsel,
                  border: `2px solid ${isSel ? dc.borderSel : dc.borderUnsel}`,
                  boxShadow: isSel
                    ? `0 0 16px ${dc.glow}, inset 0 1px 0 rgba(255,255,255,0.12)`
                    : "inset 0 1px 0 rgba(255,255,255,0.06)",
                  backdropFilter: "blur(12px)",
                  display: "flex", alignItems: "center", gap: 10,
                  textAlign: "left", cursor: "pointer",
                  transition: "all 0.22s ease",
                }}
              >
                {/* 아이콘 */}
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: isSel ? `${dc.accent}22` : "rgba(255,255,255,0.08)",
                  border: `1.5px solid ${isSel ? `${dc.accent}80` : "rgba(255,255,255,0.12)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20,
                }}>
                  {dc.emoji}
                </div>

                {/* 텍스트 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 17, fontWeight: 900,
                    color: isSel ? dc.accent : "#fff",
                    lineHeight: 1.2,
                    textShadow: isSel ? `0 0 8px ${dc.glow}` : "0 1px 4px rgba(0,0,0,0.5)",
                  }}>
                    {t(`endless.diff.${diff}`)}
                  </p>
                  <p style={{
                    fontSize: 11, fontWeight: 500, marginTop: 2,
                    color: isSel ? `${dc.accent}99` : "rgba(255,255,255,0.5)",
                  }}>
                    보드 크기: {cfg.boardSize}×{cfg.boardSize}
                  </p>
                </div>
              </button>

              {/* 선택 체크 배지 */}
              {isSel && (
                <div style={{
                  position: "absolute", top: -8, right: -5,
                  width: 22, height: 22, borderRadius: "50%",
                  background: dc.checkColor,
                  border: "2px solid #fff",
                  boxShadow: `0 2px 6px ${dc.glow}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 900, color: "#fff",
                  zIndex: 2,
                }}>✓</div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── START 버튼 — 선택 난이도 컬러 연동 ──────────── */}
      {(() => {
        const dc = DIFF_CONFIG[selected];
        return (
          <button
            onClick={handleStartPress}
            className="active:scale-[0.96]"
            style={{
              position:   "absolute",
              left:       btnLayout.left,
              top:        btnLayout.top,
              width:      btnLayout.width * 1.45,
              transform:  `translateX(-${(btnLayout.width * 1.45 - btnLayout.width) / 2}px)`,
              zIndex:     20,
              cursor:     "pointer",
              border:     "none",
              padding:    0,
              opacity:    visible ? 1 : 0,
              transition: "opacity 0.4s ease 0.35s, transform 0.15s ease",
              borderRadius: 999,
              background: dc.accent,
              backdropFilter: "blur(8px)",
              boxShadow: `0 0 24px ${dc.glow}, 0 0 48px ${dc.glow}, inset 0 1px 0 rgba(255,255,255,0.3)`,
              animation: "endlessStartGlow 2.4s ease-in-out infinite",
              overflow:   "hidden",
            }}
          >
            {/* 광택 슬라이드 */}
            <div style={{
              position: "absolute", top: 0, bottom: 0,
              width: "60%", borderRadius: "50%",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
              animation: "endlessStartShine 3s ease-in-out infinite",
              pointerEvents: "none",
            }} />

            {/* 내부 콘텐츠 */}
            <div style={{
              position:       "relative",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              padding:        "13px 0",
            }}>
              <span style={{
                fontSize:      18,
                fontWeight:    900,
                color:         "#fff",
                letterSpacing: "0.08em",
                textShadow:    "0 1px 6px rgba(0,0,0,0.4)",
              }}>
                Start
              </span>
            </div>
          </button>
        );
      })()}

      {/* ── 하단 AD ───────────────────────────────────────── */}
      <div
        className="relative z-20 w-full h-10 flex-shrink-0 flex items-center justify-center text-[11px] font-medium select-none bg-white/55 backdrop-blur-sm text-foreground/30 border-t border-white/40"
        aria-hidden="true"
      >AD</div>

      {/* ── 이어하기 확인 팝업 ────────────────────────────── */}
      {showConfirm && save && (
        <div
          className="absolute inset-0 z-30 flex items-end justify-center pb-24"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "calc(100% - 40px)", maxWidth: 340,
              borderRadius: 24,
              background: "linear-gradient(160deg, #1a1030 0%, #100818 100%)",
              border: "1.5px solid rgba(255,255,255,0.12)",
              boxShadow: "0 8px 48px rgba(0,0,0,0.7)",
              padding: "28px 24px 20px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 4 }}>💾</div>
            <p style={{ fontSize: 17, fontWeight: 900, color: "#fff", textAlign: "center" }}>
              저장된 게임이 있어요
            </p>
            <p style={{
              fontSize: 13, color: "rgba(255,255,255,0.45)",
              textAlign: "center", lineHeight: 1.5, marginBottom: 8,
            }}>
              {t(`endless.diff.${save.difficulty}`)} 게임을 이어할까요?
            </p>
            <button
              onClick={() => onContinue(save.difficulty)}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 14,
                background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                border: "none", color: "#fff",
                fontSize: 16, fontWeight: 900, cursor: "pointer",
              }}
            >
              {t("endless.continue")}
            </button>
            <button
              onClick={() => { setShowConfirm(false); onStart(selected); }}
              style={{
                width: "100%", padding: "13px 0", borderRadius: 14,
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.55)",
                fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 4,
              }}
            >
              {t("endless.restart")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
