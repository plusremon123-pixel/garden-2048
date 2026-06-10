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
  const selectedCfg = DIFF_CONFIG[selected];

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-[140] flex flex-col overflow-hidden"
    >

      {/* ── 계절 배경 ─────────────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,248,226,0.32) 44%, rgba(255,238,183,0.74)), url("${bgUrl}")`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      />

      {/* ── 헤더 ─────────────────────────────────────────── */}
      <div
        className="relative z-10 flex-shrink-0"
        style={{ padding: "30px 18px 10px" }}
      >
        <button
          onClick={onClose}
          className="active:scale-90 transition-transform"
          style={{
            position: "absolute", left: 18, top: 22,
            width: 58, height: 58, borderRadius: 18,
            background: "linear-gradient(180deg, rgba(255,250,236,0.96), rgba(255,240,204,0.92))",
            border: "3px solid rgba(153,91,36,0.54)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 33, color: "#7A4316", cursor: "pointer",
            boxShadow: "0 7px 0 rgba(121,68,28,0.30), 0 13px 22px rgba(66,37,14,0.16), inset 0 2px 0 rgba(255,255,255,0.74)",
            zIndex: 2,
          }}
        >←</button>

        <div
          style={{
            width: "min(74vw, 360px)",
            margin: "72px auto 0",
            padding: "16px 20px 20px",
            borderRadius: 28,
            textAlign: "center",
            background: "linear-gradient(180deg, #C98234 0%, #A96324 48%, #7E4318 100%)",
            border: "4px solid rgba(110,59,20,0.84)",
            boxShadow: "0 10px 0 rgba(82,45,18,0.32), 0 18px 30px rgba(75,44,17,0.22), inset 0 4px 0 rgba(255,215,125,0.52)",
            position: "relative",
          }}
        >
          <span style={{ position: "absolute", top: -18, left: 18, fontSize: 27 }}>🌿</span>
          <span style={{ position: "absolute", top: -18, right: 26, fontSize: 25 }}>🌼</span>
          <h1 style={{
            fontSize: "clamp(34px, 12vw, 58px)",
            fontWeight: 900,
            color: "#FFF7E5",
            letterSpacing: 0,
            lineHeight: 1,
            textShadow: "0 4px 0 #6B3410, 0 7px 11px rgba(50,26,10,0.28)",
          }}>
            {t("endless.title")}
          </h1>
        </div>

        <div style={{ textAlign: "center" }}>
          <p style={{
            display: "inline-block",
            fontSize: 20,
            fontWeight: 900,
            marginTop: 18,
            color: "#5E3514",
            letterSpacing: 0,
            textShadow: "0 2px 0 rgba(255,255,255,0.72)",
          }}>
            {t("endless.selectDiff")} 🍃
          </p>
        </div>
      </div>

      {/* ── 카드 영역 (화면 중앙) ────────────────────────── */}
      <div
        className="relative z-10 flex flex-col items-center flex-1"
        style={{ gap: 18, padding: "18px 18px 0", minHeight: 0 }}
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
                width: "min(84vw, 390px)",
                minHeight: 118,
                borderRadius: 30,
                padding: "15px 20px",
                background: isSel
                  ? "linear-gradient(180deg, rgba(255,250,226,0.99), rgba(241,255,210,0.97))"
                  : "linear-gradient(180deg, rgba(255,248,226,0.98), rgba(255,239,199,0.96))",
                border: `4px solid ${isSel ? dc.selBorder : "rgba(210,156,76,0.56)"}`,
                boxShadow: isSel
                  ? `${dc.selShadow}, inset 0 3px 0 rgba(255,255,255,0.74)`
                  : "0 8px 0 rgba(164,101,46,0.24), 0 16px 24px rgba(96,58,18,0.14), inset 0 3px 0 rgba(255,255,255,0.70)",
                display: "flex", alignItems: "center", gap: 20,
                textAlign: "left", cursor: "pointer",
                transition: `border-color 0.2s ease, box-shadow 0.2s ease, opacity 0.4s ease ${delay}s, transform 0.4s ease ${delay}s`,
                opacity: visible ? 1 : 0,
                transform: visible ? "none" : "translateY(24px)",
              }}
            >
              {/* 아이콘 원 */}
              <div style={{
                width: 76, height: 76, borderRadius: 24, flexShrink: 0,
                background: `radial-gradient(circle at 45% 28%, #FFFFFF 0%, ${dc.iconBg} 72%, rgba(128,82,36,0.14) 100%)`,
                border: "2px solid rgba(126,77,32,0.18)",
                boxShadow: "inset 0 2px 0 rgba(255,255,255,0.80), 0 3px 8px rgba(82,46,18,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 42,
              }}>
                {dc.emoji}
              </div>

              {/* 텍스트 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 36,
                    fontWeight: 900,
                    color: dc.accent,
                    lineHeight: 1,
                    letterSpacing: 0,
                    textShadow: "0 2px 0 rgba(255,255,255,0.76)",
                  }}>
                    {t(`endless.diff.${diff}`)}
                  </span>
                  {/* 난이도 태그 */}
                  <span style={{
                    fontSize: 19,
                    fontWeight: 900,
                    background: dc.tagBg,
                    color: dc.tagText,
                    border: `2px solid ${dc.selBorder}55`,
                    borderRadius: 14,
                    padding: "5px 14px",
                    lineHeight: 1,
                  }}>
                    {cfg.boardSize}×{cfg.boardSize}
                  </span>
                </div>
              </div>

              {/* 선택 체크 */}
              {isSel && (
                <div style={{
                  width: 62, height: 62, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(180deg, #9BDC45 0%, #5EAA1B 100%)",
                  border: "4px solid rgba(67,122,12,0.54)",
                  boxShadow: "0 5px 0 rgba(45,95,12,0.35), inset 0 2px 0 rgba(255,255,255,0.54)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 36, fontWeight: 900, color: "#fff",
                  textShadow: "0 2px 0 rgba(33,83,6,0.45)",
                }}>✓</div>
              )}
            </button>
          );
        })}
      </div>

      <div
        className="relative z-20 flex-shrink-0"
        style={{ padding: "18px 18px 18px" }}
      >
        <button
          onClick={handleStartPress}
          className="active:scale-[0.96]"
          style={{
            width: "min(84vw, 390px)",
            height: 86,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto",
            cursor: "pointer",
            border: "4px solid rgba(255,241,179,0.90)",
            padding: 0,
            opacity: visible ? 1 : 0,
            transition: "opacity 0.4s ease 0.35s, transform 0.15s ease",
            borderRadius: 26,
            background: selectedCfg.startBg,
            boxShadow: "0 9px 0 rgba(169,84,8,0.46), 0 16px 26px rgba(122,65,9,0.25), inset 0 3px 0 rgba(255,255,255,0.56)",
            animation: "endlessStartGlow 2.4s ease-in-out infinite",
            overflow: "hidden",
          }}
        >
          <span style={{
            fontFamily: "var(--font-display)",
            fontSize: 45,
            fontWeight: 900,
            color: "#fff",
            letterSpacing: 0,
            textShadow: "0 4px 0 rgba(118,55,9,0.55), 0 2px 12px rgba(0,0,0,0.20)",
          }}>
            START
          </span>
        </button>

        {save && (
          <div
            style={{
              width: "min(84vw, 390px)",
              margin: "18px auto 0",
              borderRadius: 22,
              padding: "15px 18px",
              background: "linear-gradient(180deg, rgba(255,248,229,0.96), rgba(255,238,201,0.96))",
              border: "2px solid rgba(196,132,54,0.42)",
              boxShadow: "0 7px 0 rgba(169,104,44,0.20), 0 14px 22px rgba(82,47,18,0.13), inset 0 2px 0 rgba(255,255,255,0.70)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 34 }}>🌱</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#5E3514", lineHeight: 1.15 }}>
                  {t("endless.savedGame")}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#9A7048", marginTop: 5 }}>
                  {t(`endless.diff.${save.difficulty}`)} · {save.score.toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => onContinue(save.difficulty)}
                style={{
                  padding: "11px 16px",
                  borderRadius: 14,
                  border: "2px solid rgba(67,122,12,0.42)",
                  background: "linear-gradient(180deg, #A8DE4B 0%, #69AE21 100%)",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 900,
                  boxShadow: "0 5px 0 rgba(48,98,13,0.35)",
                }}
              >
                {t("endless.continue")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 하단 AD ───────────────────────────────────────── */}
      <div
        className="relative z-20 w-full h-9 flex-shrink-0 flex items-center justify-center text-[11px] font-medium select-none bg-white/45 backdrop-blur-sm text-foreground/30 border-t border-white/40"
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
