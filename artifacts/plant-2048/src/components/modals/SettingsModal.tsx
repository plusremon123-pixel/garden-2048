/* ============================================================
 * SettingsModal.tsx
 * 설정 팝업 — 계정 / 게임 설정 / 지원 및 정책
 * ============================================================ */

import { useState, ReactNode } from "react";
import { createPortal } from "react-dom";
import { BaseModal } from "./BaseModal";
import type { GameSettings } from "@/hooks/useSettings";
import {
  loadGoogleAuthState,
  connectGoogleAccount,
  disconnectGoogleAccount,
  type GoogleAuthState,
} from "@/utils/googlePlay";
import { useTranslation } from "@/i18n";

const APP_VERSION = "1.0.0 (build 1)";

interface SettingsModalProps {
  settings:        GameSettings;
  onToggle:        (key: keyof GameSettings) => void;
  onClose:         () => void;
}

export function SettingsModal({ settings, onToggle, onClose }: SettingsModalProps) {
  const { t, lang, setLang } = useTranslation();
  const [googleAuth, setGoogleAuth] = useState<GoogleAuthState>(() =>
    loadGoogleAuthState(),
  );
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  const SETTING_ITEMS: {
    key:   keyof GameSettings;
    label: string;
    desc:  string;
    emoji: string;
  }[] = [
    { key: "sound",         label: t("settings.sound"),         desc: t("settings.soundDesc"),         emoji: "🔊" },
    { key: "vibration",     label: t("settings.vibration"),     desc: t("settings.vibrationDesc"),     emoji: "📳" },
    { key: "notifications", label: t("settings.notifications"), desc: t("settings.notificationsDesc"), emoji: "🔔" },
  ];

  /* Google 계정 연결 */
  const handleConnectGoogle = async () => {
    setGoogleAuth((p) => ({ ...p, loading: true }));
    try {
      const profile = await connectGoogleAccount();
      setGoogleAuth({ connected: true, profile, loading: false });
    } catch {
      setGoogleAuth((p) => ({ ...p, loading: false }));
    }
    setShowGoogleModal(false);
  };

  /* Google 계정 연결 해제 */
  const handleDisconnectGoogle = async () => {
    setGoogleAuth((p) => ({ ...p, loading: true }));
    await disconnectGoogleAccount();
    setGoogleAuth({ connected: false, profile: null, loading: false });
  };

  return (
    <>
      <BaseModal
        icon="⚙️"
        title={t("settings.title")}
        onClose={onClose}
        closeOnBackdrop={false}
      >
        {/* ══════════════════════════════════════
         * 0. 언어 섹션
         * ══════════════════════════════════════ */}
        <SectionLabel>{t("settings.language")}</SectionLabel>
        <div className="bg-white border border-foreground/8 rounded-2xl overflow-hidden mb-4">
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="text-lg w-6 text-center leading-none">🌐</span>
            <p className="flex-1 text-sm font-medium text-foreground">{t("settings.language")}</p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setLang("ko")}
                className={[
                  "px-3 py-1 rounded-full text-xs font-bold transition-all",
                  lang === "ko"
                    ? "bg-primary text-white shadow-sm"
                    : "bg-foreground/8 text-foreground/50 hover:bg-foreground/12",
                ].join(" ")}
              >
                KO
              </button>
              <button
                onClick={() => setLang("en")}
                className={[
                  "px-3 py-1 rounded-full text-xs font-bold transition-all",
                  lang === "en"
                    ? "bg-primary text-white shadow-sm"
                    : "bg-foreground/8 text-foreground/50 hover:bg-foreground/12",
                ].join(" ")}
              >
                EN
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════
         * 1. 계정 섹션
         * ══════════════════════════════════════ */}
        <SectionLabel>{t("settings.account")}</SectionLabel>
        <div className="bg-white border border-foreground/8 rounded-2xl overflow-hidden mb-4">

          {/* Google 계정 연동 */}
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                {googleAuth.connected ? "👤" : "🔗"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">{t("settings.googleAccount")}</p>
                {googleAuth.connected && googleAuth.profile ? (
                  <p className="text-xs text-emerald-500 font-medium mt-0.5">
                    ✓ {googleAuth.profile.displayName}
                  </p>
                ) : (
                  <p className="text-xs text-foreground/35 mt-0.5">{t("settings.notConnected")}</p>
                )}
              </div>
              {googleAuth.connected ? (
                <button
                  onClick={handleDisconnectGoogle}
                  disabled={googleAuth.loading}
                  className="text-xs text-red-400 font-medium px-3 py-1.5 rounded-full border border-red-100 hover:bg-red-50 active:scale-95 transition-all disabled:opacity-50"
                >
                  {googleAuth.loading ? t("settings.processing") : t("settings.disconnectAccount")}
                </button>
              ) : (
                <button
                  onClick={() => setShowGoogleModal(true)}
                  disabled={googleAuth.loading}
                  className="text-xs bg-blue-500 hover:bg-blue-600 text-white font-bold px-3 py-1.5 rounded-full active:scale-95 transition-all disabled:opacity-50"
                >
                  {googleAuth.loading ? t("settings.processing") : t("settings.connectAccount")}
                </button>
              )}
            </div>
          </div>

        </div>

        {/* ══════════════════════════════════════
         * 2. 게임 설정 섹션
         * ══════════════════════════════════════ */}
        <SectionLabel>{t("settings.gameSettings")}</SectionLabel>
        <div className="bg-white border border-foreground/8 rounded-2xl overflow-hidden mb-4">
          {SETTING_ITEMS.map((item, idx) => (
            <div key={item.key}>
              {idx > 0 && <div className="h-px bg-foreground/6 mx-4" />}
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="text-lg w-6 text-center leading-none">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-foreground/40 mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() => onToggle(item.key)}
                  role="switch"
                  aria-checked={settings[item.key]}
                  className="flex-shrink-0 transition-colors duration-200"
                  style={{
                    position: "relative",
                    width: "44px",
                    height: "24px",
                    borderRadius: "12px",
                    backgroundColor: settings[item.key]
                      ? "hsl(var(--primary))"
                      : "rgba(0,0,0,0.12)",
                  }}
                >
                  <span
                    className="absolute bg-white rounded-full shadow-sm transition-all duration-200"
                    style={{
                      width: "18px",
                      height: "18px",
                      top: "3px",
                      left: settings[item.key] ? "23px" : "3px",
                    }}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ══════════════════════════════════════
         * 3. 지원 및 정책 섹션
         * ══════════════════════════════════════ */}
        <SectionLabel>{t("settings.support")}</SectionLabel>
        <div className="bg-white border border-foreground/8 rounded-2xl overflow-hidden mb-5">
          {[
            { labelKey: "settings.privacy", emoji: "🔒", action: () => {} },
            { labelKey: "settings.terms",   emoji: "📄", action: () => {} },
            { labelKey: "settings.contact", emoji: "💬", action: () => {} },
          ].map(({ labelKey, emoji, action }, idx) => (
            <div key={labelKey}>
              {idx > 0 && <div className="h-px bg-foreground/6 mx-4" />}
              <button
                onClick={action}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-foreground/3 active:bg-foreground/5 transition-all text-left"
              >
                <span className="text-base w-6 text-center leading-none">{emoji}</span>
                <span className="flex-1 text-sm text-foreground">{t(labelKey)}</span>
                <span className="text-foreground/25 text-sm">›</span>
              </button>
            </div>
          ))}
          <div className="h-px bg-foreground/6 mx-4" />
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="text-base w-6 text-center leading-none">📱</span>
            <span className="flex-1 text-sm text-foreground">{t("settings.appVersion")}</span>
            <span className="text-xs text-foreground/35 font-mono">{APP_VERSION}</span>
          </div>
        </div>
      </BaseModal>

      {/* ── Google 계정 연결 확인 모달 */}
      {showGoogleModal && (
        <GoogleConnectModal
          onConnect={handleConnectGoogle}
          onClose={() => setShowGoogleModal(false)}
          loading={googleAuth.loading}
        />
      )}
    </>
  );
}

/* ── SectionLabel ──────────────────────────────────────────── */
function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-bold text-foreground/35 uppercase tracking-widest mb-2 px-1">
      {children}
    </p>
  );
}

/* ============================================================
 * GoogleConnectModal
 * ============================================================ */
interface GoogleConnectModalProps {
  onConnect: () => void;
  onClose:   () => void;
  loading:   boolean;
}

function GoogleConnectModal({ onConnect, onClose, loading }: GoogleConnectModalProps) {
  const { t } = useTranslation();

  const BENEFITS = [
    { emoji: "💾", textKey: "settings.googleBenefit1" },
    { emoji: "🏆", textKey: "settings.googleBenefit2" },
    { emoji: "🎖️", textKey: "settings.googleBenefit3" },
    { emoji: "📱", textKey: "settings.googleBenefit4" },
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[320px] bg-white rounded-3xl p-6 shadow-2xl animate-modal-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 아이콘 */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
            <span className="text-3xl">🎮</span>
          </div>
        </div>

        <h3 className="text-base font-black text-foreground text-center mb-1">
          {t("settings.googleConnectTitle")}
        </h3>
        <p className="text-xs text-foreground/45 text-center mb-4">
          {t("settings.googleConnectDesc")}
        </p>

        {/* 혜택 목록 */}
        <div className="flex flex-col gap-2 mb-5">
          {BENEFITS.map((b) => (
            <div
              key={b.textKey}
              className="flex items-center gap-2.5 bg-blue-50 rounded-xl px-3 py-2"
            >
              <span className="text-sm">{b.emoji}</span>
              <span className="text-xs text-blue-700 font-medium">{t(b.textKey)}</span>
            </div>
          ))}
        </div>

        {/* 버튼 */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onConnect}
            disabled={loading}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-2xl text-sm transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? t("settings.connecting") : `🔗 ${t("settings.connectAccount")}`}
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 text-foreground/40 text-sm font-medium hover:text-foreground/60 transition-all"
          >
            {t("common.later")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
