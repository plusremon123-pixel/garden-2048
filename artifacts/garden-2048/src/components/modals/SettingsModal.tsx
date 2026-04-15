/* ============================================================
 * SettingsModal.tsx
 * 설정 팝업 — 계절 테마 지원
 * ============================================================ */

import { useState, ReactNode } from "react";
import { createPortal } from "react-dom";
import { BaseModal } from "./BaseModal";
import type { GameSettings } from "@/hooks/useSettings";
import type { Season } from "@/utils/seasonData";
import { SEASON_THEMES, type SeasonTheme } from "@/utils/seasonTheme";
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
  season?:         Season;
}

export function SettingsModal({ settings, onToggle, onClose, season = "spring" }: SettingsModalProps) {
  const { t, lang, setLang } = useTranslation();
  const theme = SEASON_THEMES[season];
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

  const handleDisconnectGoogle = async () => {
    setGoogleAuth((p) => ({ ...p, loading: true }));
    await disconnectGoogleAccount();
    setGoogleAuth({ connected: false, profile: null, loading: false });
  };

  return (
    <>
      <BaseModal
        iconSrc="/menu-settings.png"
        title={t("settings.title")}
        onClose={onClose}
        closeOnBackdrop={false}
        season={season}
      >
        {/* ── 언어 섹션 */}
        <SectionLabel theme={theme}>{t("settings.language")}</SectionLabel>
        <div className="rounded-2xl overflow-hidden mb-4" style={{ background: theme.panelColor, border: `1px solid ${theme.borderColor}50` }}>
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="text-lg w-6 text-center leading-none">🌐</span>
            <p className="flex-1 text-sm font-medium" style={{ color: theme.textPrimary }}>{t("settings.language")}</p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setLang("ko")}
                className="px-3 py-1 rounded-full text-xs font-bold transition-all"
                style={lang === "ko"
                  ? { background: theme.btnPrimary, color: theme.btnPrimaryText }
                  : { background: theme.borderColor + "40", color: theme.textMuted }
                }
              >KO</button>
              <button
                onClick={() => setLang("en")}
                className="px-3 py-1 rounded-full text-xs font-bold transition-all"
                style={lang === "en"
                  ? { background: theme.btnPrimary, color: theme.btnPrimaryText }
                  : { background: theme.borderColor + "40", color: theme.textMuted }
                }
              >EN</button>
            </div>
          </div>
        </div>

        {/* ── 계정 섹션 */}
        <SectionLabel theme={theme}>{t("settings.account")}</SectionLabel>
        <div className="rounded-2xl overflow-hidden mb-4" style={{ background: theme.panelColor, border: `1px solid ${theme.borderColor}50` }}>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0" style={{ background: theme.borderColor + "40" }}>
                {googleAuth.connected ? "👤" : "🔗"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: theme.textPrimary }}>{t("settings.googleAccount")}</p>
                {googleAuth.connected && googleAuth.profile ? (
                  <p className="text-xs font-medium mt-0.5" style={{ color: theme.btnPrimary }}>
                    ✓ {googleAuth.profile.displayName}
                  </p>
                ) : (
                  <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{t("settings.notConnected")}</p>
                )}
              </div>
              {googleAuth.connected ? (
                <button
                  onClick={handleDisconnectGoogle}
                  disabled={googleAuth.loading}
                  className="text-xs font-medium px-3 py-1.5 rounded-full border hover:opacity-80 active:scale-95 transition-all disabled:opacity-50"
                  style={{ color: "#ef4444", borderColor: "#fca5a5" }}
                >
                  {googleAuth.loading ? t("settings.processing") : t("settings.disconnectAccount")}
                </button>
              ) : (
                <button
                  onClick={() => setShowGoogleModal(true)}
                  disabled={googleAuth.loading}
                  className="text-xs font-bold px-3 py-1.5 rounded-full active:scale-95 transition-all disabled:opacity-50"
                  style={{ background: theme.btnPrimary, color: theme.btnPrimaryText }}
                >
                  {googleAuth.loading ? t("settings.processing") : t("settings.connectAccount")}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── 게임 설정 섹션 */}
        <SectionLabel theme={theme}>{t("settings.gameSettings")}</SectionLabel>
        <div className="rounded-2xl overflow-hidden mb-4" style={{ background: theme.panelColor, border: `1px solid ${theme.borderColor}50` }}>
          {SETTING_ITEMS.map((item, idx) => (
            <div key={item.key}>
              {idx > 0 && <div className="h-px mx-4" style={{ background: theme.borderColor + "40" }} />}
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="text-lg w-6 text-center leading-none">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: theme.textPrimary }}>{item.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{item.desc}</p>
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
                    backgroundColor: settings[item.key] ? theme.btnPrimary : theme.borderColor + "60",
                  }}
                >
                  <span
                    className="absolute rounded-full shadow-sm transition-all duration-200"
                    style={{
                      width: "18px",
                      height: "18px",
                      top: "3px",
                      left: settings[item.key] ? "23px" : "3px",
                      background: "#ffffff",
                    }}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── 지원 및 정책 섹션 */}
        <SectionLabel theme={theme}>{t("settings.support")}</SectionLabel>
        <div className="rounded-2xl overflow-hidden mb-5" style={{ background: theme.panelColor, border: `1px solid ${theme.borderColor}50` }}>
          {[
            { labelKey: "settings.privacy", emoji: "🔒", action: () => {} },
            { labelKey: "settings.terms",   emoji: "📄", action: () => {} },
            { labelKey: "settings.contact", emoji: "💬", action: () => {} },
          ].map(({ labelKey, emoji, action }, idx) => (
            <div key={labelKey}>
              {idx > 0 && <div className="h-px mx-4" style={{ background: theme.borderColor + "40" }} />}
              <button
                onClick={action}
                className="w-full flex items-center gap-3 px-4 py-3.5 active:opacity-70 transition-all text-left"
              >
                <span className="text-base w-6 text-center leading-none">{emoji}</span>
                <span className="flex-1 text-sm" style={{ color: theme.textPrimary }}>{t(labelKey)}</span>
                <span className="text-sm" style={{ color: theme.textMuted }}>›</span>
              </button>
            </div>
          ))}
          <div className="h-px mx-4" style={{ background: theme.borderColor + "40" }} />
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="text-base w-6 text-center leading-none">📱</span>
            <span className="flex-1 text-sm" style={{ color: theme.textPrimary }}>{t("settings.appVersion")}</span>
            <span className="text-xs font-mono" style={{ color: theme.textMuted }}>{APP_VERSION}</span>
          </div>
        </div>
      </BaseModal>

      {showGoogleModal && (
        <GoogleConnectModal
          theme={theme}
          onConnect={handleConnectGoogle}
          onClose={() => setShowGoogleModal(false)}
          loading={googleAuth.loading}
        />
      )}
    </>
  );
}

/* ── SectionLabel */
function SectionLabel({ children, theme }: { children: ReactNode; theme: SeasonTheme }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: theme.textMuted }}>
      {children}
    </p>
  );
}

/* ── GoogleConnectModal */
interface GoogleConnectModalProps {
  theme:     SeasonTheme;
  onConnect: () => void;
  onClose:   () => void;
  loading:   boolean;
}

function GoogleConnectModal({ theme, onConnect, onClose, loading }: GoogleConnectModalProps) {
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
        className="w-full max-w-[320px] rounded-3xl p-6 shadow-2xl animate-modal-slide-up"
        style={{ background: theme.popupBg }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: theme.panelColor }}>
            <span className="text-3xl">🎮</span>
          </div>
        </div>

        <h3 className="text-base font-black text-center mb-1" style={{ color: theme.textPrimary }}>
          {t("settings.googleConnectTitle")}
        </h3>
        <p className="text-xs text-center mb-4" style={{ color: theme.textMuted }}>
          {t("settings.googleConnectDesc")}
        </p>

        <div className="flex flex-col gap-2 mb-5">
          {BENEFITS.map((b) => (
            <div
              key={b.textKey}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2"
              style={{ background: theme.panelColor }}
            >
              <span className="text-sm">{b.emoji}</span>
              <span className="text-xs font-medium" style={{ color: theme.textSecondary }}>{t(b.textKey)}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={onConnect}
            disabled={loading}
            className="w-full py-3 font-bold rounded-2xl text-sm transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ background: theme.btnPrimary, color: theme.btnPrimaryText }}
          >
            {loading ? t("settings.connecting") : `🔗 ${t("settings.connectAccount")}`}
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm font-medium transition-all"
            style={{ color: theme.textMuted }}
          >
            {t("common.later")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
