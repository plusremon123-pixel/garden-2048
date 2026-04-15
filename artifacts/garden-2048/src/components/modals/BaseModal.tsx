/* ============================================================
 * BaseModal.tsx
 * 공통 모달 베이스 컴포넌트 — 계절 테마 지원
 * ============================================================ */

import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import type { Season } from "@/utils/seasonData";
import { SEASON_THEMES } from "@/utils/seasonTheme";

interface BaseModalProps {
  icon?:            string;
  iconSrc?:         string;   // 이미지 경로 (PNG 아이콘)
  title:            string;
  onClose:          () => void;
  children:         ReactNode;
  footer?:          ReactNode;
  /** 배경 탭 시 닫기 여부 (기본: true) */
  closeOnBackdrop?: boolean;
  /** 모달 최대 높이 (기본: 85dvh) */
  maxHeight?:       string;
  /** 계절 테마 */
  season?:          Season;
}

export function BaseModal({
  icon,
  iconSrc,
  title,
  onClose,
  children,
  footer,
  closeOnBackdrop = true,
  maxHeight = "85dvh",
  season = "spring",
}: BaseModalProps) {
  const theme = SEASON_THEMES[season];

  /* ESC 키로 닫기 */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      {/* 모달 패널 */}
      <div
        className="w-full max-w-[420px] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-modal-slide-up"
        style={{ maxHeight, background: theme.popupBg }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── 핸들 (모바일) */}
        <div className="flex justify-center pt-3 pb-0 sm:hidden flex-shrink-0">
          <div className="w-8 h-1 rounded-full" style={{ background: theme.borderColor + "60" }} />
        </div>

        {/* ── 헤더 */}
        <div
          className="flex items-center gap-2.5 px-5 pt-4 pb-3 flex-shrink-0"
          style={{ borderBottom: `1px solid ${theme.borderColor}40` }}
        >
          <div className="flex-1 flex items-center gap-2">
            {iconSrc
              ? <img src={iconSrc} className="w-7 h-7 object-contain" alt="" draggable={false} />
              : icon && <span className="text-xl leading-none">{icon}</span>
            }
            <h2 className="text-base font-bold" style={{ color: theme.textPrimary }}>{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full active:scale-95 transition-all text-sm font-bold"
            style={{ background: theme.borderColor + "40", color: theme.textSecondary }}
          >
            ✕
          </button>
        </div>

        {/* ── 바디 (스크롤 가능) */}
        <div className="flex-1 overflow-y-auto px-5 pb-2 min-h-0">
          {children}
        </div>

        {/* ── 푸터 (선택적) */}
        {footer && (
          <div
            className="px-5 pb-5 pt-3 flex-shrink-0"
            style={{ borderTop: `1px solid ${theme.borderColor}40` }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
