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
import { SEASON_BG, type Season } from "@/utils/seasonData";

/* ── 홈 화면과 동일한 디자인 좌표계 ────────────────────────
   새 map-*.png = 1120 × 2048 계열 세로형 정원 배경
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
  emoji:      string;
  accent:     string;   // 포인트 컬러 (텍스트·아이콘·선택 테두리)
  iconBg:     string;   // 아이콘 배경
  selBorder:  string;   // 선택 테두리
  selShadow:  string;   // 선택 그림자
  tagBg:      string;   // 난이도 태그 배경
  tagText:    string;   // 난이도 태그 텍스트
  startBg:    string;   // 시작 버튼 배경
}> = {
  easy: {
    emoji:     "🌱",
    accent:    "#4F9A37",
    iconBg:    "#E6F6D8",
    selBorder: "#5FAE45",
    selShadow: "0 0 0 3px rgba(95,174,69,0.18), 0 10px 24px rgba(96,58,18,0.18)",
    tagBg:     "#E6F6D8",
    tagText:   "#2F6E22",
    startBg:   "linear-gradient(180deg,#FFB13B,#F59E0B)",
  },
  normal: {
    emoji:     "🌻",
    accent:    "#D97706",
    iconBg:    "#fef9c3",
    selBorder: "#f59e0b",
    selShadow: "0 0 0 3px rgba(245,158,11,0.20), 0 10px 24px rgba(96,58,18,0.18)",
    tagBg:     "#fef9c3",
    tagText:   "#92400e",
    startBg:   "linear-gradient(180deg,#FFB13B,#F59E0B)",
  },
  hard: {
    emoji:     "🌵",
    accent:    "#B85B32",
    iconBg:    "#FFE2D1",
    selBorder: "#D46F39",
    selShadow: "0 0 0 3px rgba(212,111,57,0.18), 0 10px 24px rgba(96,58,18,0.18)",
    tagBg:     "#FFE2D1",
    tagText:   "#88411F",
    startBg:   "linear-gradient(180deg,#FFB13B,#F59E0B)",
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

  const bgUrl = SEASON_BG[season] ?? SEASON_BG.spring;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-[140] flex flex-col overflow-hidden"
    >

      {/* ── 계절 배경 ─────────────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(255,250,236,0.18), rgba(255,248,234,0.68)), url("${bgUrl}")`,
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
            background: "linear-gradient(180deg, rgba(255,250,236,0.96), rgba(255,240,204,0.92))",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(210,156,76,0.38)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, color: "#4C2E0C", cursor: "pointer",
            boxShadow: "0 8px 18px rgba(96,58,18,0.14)",
            zIndex: 2,
          }}
        >←</button>

        {/* 타이틀 영역 */}
        <div style={{
          textAlign: "center",
          paddingTop: 6,
        }}>
          <h1 style={{
            fontSize: 28, fontWeight: 900, color: "#4C2E0C",
            letterSpacing: "0.02em", lineHeight: 1,
            textShadow: "0 2px 0 rgba(255,255,255,0.85)",
          }}>
            {t("endless.title")}
          </h1>
          <p style={{
            fontSize: 13, fontWeight: 600, marginTop: 6,
            color: "#8C6842",
            letterSpacing: "0.01em",
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
            <button
              key={diff}
              onClick={() => setSelected(diff)}
              className="active:scale-[0.97]"
              style={{
                width: "82%", maxWidth: 310,
                borderRadius: 18,
                padding: "14px 16px",
                background: "linear-gradient(180deg, rgba(255,250,236,0.98), rgba(255,244,216,0.95))",
                border: `2px solid ${isSel ? dc.selBorder : "rgba(210,156,76,0.25)"}`,
                boxShadow: isSel
                  ? dc.selShadow
                  : "0 8px 20px rgba(96,58,18,0.13)",
                display: "flex", alignItems: "center", gap: 14,
                textAlign: "left", cursor: "pointer",
                transition: `border-color 0.2s ease, box-shadow 0.2s ease, opacity 0.4s ease ${delay}s, transform 0.4s ease ${delay}s`,
                opacity: visible ? 1 : 0,
                transform: visible ? "none" : "translateY(24px)",
              }}
            >
              {/* 아이콘 원 */}
              <div style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                background: dc.iconBg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26,
              }}>
                {dc.emoji}
              </div>

              {/* 텍스트 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 18, fontWeight: 900,
                    color: "#4C2E0C", lineHeight: 1,
                  }}>
                    {t(`endless.diff.${diff}`)}
                  </span>
                  {/* 난이도 태그 */}
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    background: dc.tagBg, color: dc.tagText,
                    borderRadius: 999, padding: "2px 8px",
                  }}>
                    {cfg.boardSize}×{cfg.boardSize}
                  </span>
                </div>
              </div>

              {/* 선택 체크 */}
              {isSel && (
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  background: dc.selBorder,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 900, color: "#fff",
                }}>✓</div>
              )}
            </button>
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
              background: dc.startBg,
              backdropFilter: "blur(8px)",
              boxShadow: `0 12px 24px rgba(182,104,10,0.28), inset 0 2px 0 rgba(255,255,255,0.55)`,
              animation: "endlessStartGlow 2.4s ease-in-out infinite",
              overflow:   "hidden",
            }}
          >
            {/* 광택 슬라이드 */}
            <div style={{
              position: "absolute", top: 0, bottom: 0,
              width: "60%", borderRadius: "50%",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.32), transparent)",
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
          style={{ background: "rgba(76,46,12,0.34)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "calc(100% - 40px)", maxWidth: 340,
              borderRadius: 24,
              background: "linear-gradient(180deg, rgba(255,250,236,0.98), rgba(255,240,204,0.95))",
              border: "1.5px solid rgba(210,156,76,0.38)",
              boxShadow: "0 18px 48px rgba(96,58,18,0.24)",
              padding: "28px 24px 20px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 4 }}>💾</div>
            <p style={{ fontSize: 17, fontWeight: 900, color: "#4C2E0C", textAlign: "center" }}>
              저장된 게임이 있어요
            </p>
            <p style={{
              fontSize: 13, color: "#9A7048",
              textAlign: "center", lineHeight: 1.5, marginBottom: 8,
            }}>
              {t(`endless.diff.${save.difficulty}`)} 게임을 이어할까요?
            </p>
            <button
              onClick={() => onContinue(save.difficulty)}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 14,
                background: "linear-gradient(180deg, #7BCB63 0%, #4F9A37 100%)",
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
                background: "rgba(255,255,255,0.52)",
                border: "1px solid rgba(210,156,76,0.38)",
                color: "#9A7048",
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
