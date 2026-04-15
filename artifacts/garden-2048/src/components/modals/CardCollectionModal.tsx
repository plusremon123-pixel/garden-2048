/* ============================================================
 * CardCollectionModal.tsx
 * 카드 도감 — 9장 카드 전체 컬렉션 상태 표시
 * ============================================================ */

import { createPortal }      from "react-dom";
import { CARD_COLLECTION, type CardCollectionDef, type CardColor } from "@/utils/loadoutData";
import { type PlayerData }   from "@/utils/playerData";
import { type SubscriptionState, isPremiumActive } from "@/utils/subscriptionData";
import type { Season } from "@/utils/seasonData";
import { SEASON_THEMES } from "@/utils/seasonTheme";
import { useTranslation } from "@/i18n";

interface CardCollectionModalProps {
  player:               PlayerData;
  subscriptionState?:   SubscriptionState;
  onClose:              () => void;
  onOpenPremium?:       () => void;
  season?:              Season;
}

/* ── 카드 상태 타입 ─────────────────────────────────────── */
type CardStatus = "acquired" | "acquirable" | "locked" | "coming_soon" | "premium_locked" | "premium_active";

function getCardStatus(
  card:            CardCollectionDef,
  playerLevel:     number,
  clearedLevel:    number,
  premiumActive?:  boolean,
): CardStatus {
  if (card.status === "coming_soon")      return "coming_soon";
  if (card.status === "premium")          return premiumActive ? "premium_active" : "premium_locked";
  if (card.unlockLevel === 0)             return clearedLevel >= 9 ? "acquired" : "locked";
  if (playerLevel >= card.unlockLevel)    return "acquirable";
  return "locked";
}

/* ── 색상 맵 (Tailwind safe-list 대신 인라인 스타일) ─────── */
const COLOR_MAP: Record<CardColor, { bg: string; ring: string; text: string; badge: string }> = {
  emerald: { bg: "#d1fae5", ring: "#6ee7b7", text: "#065f46", badge: "#10b981" },
  amber:   { bg: "#fef3c7", ring: "#fcd34d", text: "#78350f", badge: "#f59e0b" },
  green:   { bg: "#dcfce7", ring: "#86efac", text: "#14532d", badge: "#22c55e" },
  yellow:  { bg: "#fef9c3", ring: "#fde047", text: "#713f12", badge: "#eab308" },
  rose:    { bg: "#ffe4e6", ring: "#fda4af", text: "#881337", badge: "#f43f5e" },
  orange:  { bg: "#ffedd5", ring: "#fdba74", text: "#7c2d12", badge: "#f97316" },
  pink:    { bg: "#fce7f3", ring: "#f9a8d4", text: "#831843", badge: "#ec4899" },
  purple:  { bg: "#f3e8ff", ring: "#d8b4fe", text: "#4a1d96", badge: "#a855f7" },
  teal:    { bg: "#ccfbf1", ring: "#5eead4", text: "#134e4a", badge: "#14b8a6" },
  gold:    { bg: "#fefce8", ring: "#fde047", text: "#713f12", badge: "#d97706" },
};

/* ============================================================
 * 카드 아이템 컴포넌트
 * ============================================================ */
function CollectionCard({
  card, playerLevel, clearedLevel, premiumActive,
}: {
  card:           CardCollectionDef;
  playerLevel:    number;
  clearedLevel:   number;
  premiumActive?: boolean;
}) {
  const { t } = useTranslation();
  const status  = getCardStatus(card, playerLevel, clearedLevel, premiumActive);
  const palette = COLOR_MAP[card.color];
  const cardName = t(`card.${card.collectionId}`) !== `card.${card.collectionId}` ? t(`card.${card.collectionId}`) : card.name;

  /* ── 서비스 준비중 ──────────────────────────────────── */
  if (status === "coming_soon") {
    return (
      <div
        className="relative flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 border border-foreground/8"
        style={{ background: "#f3f4f6" }}
      >
        <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center gap-0.5 z-10">
          <span className="text-2xl leading-none opacity-40">🔒</span>
        </div>
        <span className="text-2xl leading-none opacity-15">{card.emoji}</span>
        <p className="text-[11px] font-bold text-foreground/20 leading-none text-center">{cardName}</p>
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: "#e5e7eb", color: "#9ca3af" }}
        >
          {t("cardCollection.statusComingSoon")}
        </span>
      </div>
    );
  }

  /* ── 프리미엄 잠금 ──────────────────────────────────── */
  if (status === "premium_locked") {
    return (
      <div
        className="relative flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 border border-amber-200/60"
        style={{ background: "#fffbeb" }}
      >
        <div className="absolute inset-0 rounded-2xl flex items-center justify-center z-10 bg-white/40">
          <span className="text-2xl leading-none opacity-60">🔒</span>
        </div>
        <span className="text-2xl leading-none opacity-30">{card.emoji}</span>
        <p className="text-[11px] font-bold text-amber-600/40 leading-none text-center">{cardName}</p>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-500">{t("cardCollection.statusPremiumLocked")}</span>
      </div>
    );
  }

  /* ── 프리미엄 활성 ───────────────────────────────────── */
  if (status === "premium_active") {
    return (
      <div
        className="relative flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 border-2 shadow-sm"
        style={{ background: palette.bg, borderColor: palette.ring }}
      >
        <div
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black shadow-sm"
          style={{ background: palette.badge, color: "#fff" }}
        >
          💎
        </div>
        <span className="text-2xl leading-none">{card.emoji}</span>
        <p className="text-[11px] font-bold leading-none text-center" style={{ color: palette.text }}>{cardName}</p>
        <p className="text-[9px] text-center leading-tight px-0.5 whitespace-pre-line" style={{ color: palette.text + "aa", minHeight: "2.4em" }}>{t(`card.desc.${card.collectionId}`)}</p>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5" style={{ background: palette.badge + "22", color: palette.badge }}>{t("cardCollection.statusPremium")}</span>
      </div>
    );
  }

  /* ── 레벨 미달 (비획득) ──────────────────────────────── */
  if (status === "locked") {
    return (
      <div
        className="relative flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 border border-foreground/6"
        style={{ background: "#f9fafb" }}
      >
        <span className="text-2xl leading-none opacity-20">{card.emoji}</span>
        <p className="text-[11px] font-bold text-foreground/25 leading-none text-center">{cardName}</p>
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: "#e5e7eb", color: "#6b7280" }}
        >
          {card.unlockLevel === 0 ? t("cardCollection.statusLockedStage") : t("cardCollection.unlockHint", { level: card.unlockLevel })}
        </span>
      </div>
    );
  }

  /* ── 획득 가능 (레벨 충족, 미획득) ──────────────────── */
  if (status === "acquirable") {
    return (
      <div
        className="relative flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 border-2 animate-pulse-soft"
        style={{
          background:   palette.bg + "99",
          borderColor:  palette.ring,
        }}
      >
        <div
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black shadow-sm"
          style={{ background: palette.badge, color: "#fff" }}
        >
          ✦
        </div>
        <span className="text-2xl leading-none">{card.emoji}</span>
        <p
          className="text-[11px] font-bold leading-none text-center"
          style={{ color: palette.text }}
        >
          {cardName}
        </p>
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: palette.badge, color: "#fff" }}
        >
          {t("cardCollection.statusAcquirable")}
        </span>
      </div>
    );
  }

  /* ── 획득 완료 ──────────────────────────────────────── */
  return (
    <div
      className="relative flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 border-2 shadow-sm"
      style={{
        background:  palette.bg,
        borderColor: palette.ring,
      }}
    >
      <div
        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black shadow-sm"
        style={{ background: palette.badge, color: "#fff" }}
      >
        ✓
      </div>
      <span className="text-2xl leading-none">{card.emoji}</span>
      <p
        className="text-[11px] font-bold leading-none text-center"
        style={{ color: palette.text }}
      >
        {cardName}
      </p>
      <p
        className="text-[9px] text-center leading-tight px-0.5 whitespace-pre-line"
        style={{ color: palette.text + "aa", minHeight: "2.4em" }}
      >
        {t(`card.desc.${card.collectionId}`)}
      </p>
      <span
        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5"
        style={{ background: palette.badge + "22", color: palette.badge }}
      >
        {t("cardCollection.statusOwned")}
      </span>
    </div>
  );
}

/* ============================================================
 * 메인 모달
 * ============================================================ */
export function CardCollectionModal({ player, subscriptionState, onClose, onOpenPremium, season = "spring" }: CardCollectionModalProps) {
  const { t } = useTranslation();
  const theme = SEASON_THEMES[season];
  const sub           = subscriptionState ?? { isPremium: false, trialUsed: false, trialActive: false, trialExpiry: null };
  const premiumActive = isPremiumActive(sub);

  const acquiredCount = CARD_COLLECTION.filter(
    (c) => getCardStatus(c, player.clearedLevel, player.clearedLevel, premiumActive) === "acquired",
  ).length;

  const totalActive = CARD_COLLECTION.filter((c) => c.status === "active").length;
  const cardsUnlocked = player.clearedLevel >= 9;

  const starterCards = CARD_COLLECTION.filter((c) => c.status === "active" && c.unlockLevel === 0);
  const lv100Cards   = CARD_COLLECTION.filter((c) => c.status === "active" && c.unlockLevel === 100);
  const lv400Cards   = CARD_COLLECTION.filter((c) => c.status === "coming_soon");
  const premiumCards = CARD_COLLECTION.filter((c) => c.status === "premium");

  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col animate-in slide-in-from-right duration-300" style={{ background: theme.popupBg }}>

      {/* ── 상단 헤더 */}
      <div
        className="flex items-center gap-3 px-5 pt-safe-top pt-4 pb-3 flex-shrink-0"
        style={{ borderBottom: `1px solid ${theme.borderColor}50` }}
      >
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full active:scale-95 transition-all text-sm"
          style={{ background: theme.borderColor + "40", color: theme.textSecondary }}
        >
          ←
        </button>
        <div className="flex items-center gap-2 flex-1">
          <img src="/menu-card.png" className="w-6 h-6 object-contain" alt="" draggable={false} />
          <h2 className="text-base font-bold" style={{ color: theme.textPrimary }}>{t("cardCollection.title")}</h2>
        </div>
      </div>

      {/* ── 스크롤 본문 */}
      <div className="flex-1 overflow-y-auto px-5 py-4">

        {/* ── 미해금 상태: 프리미엄 카드 최상단 */}
        {!cardsUnlocked && (
          <PremiumGroup t={t} premiumActive={premiumActive} premiumCards={premiumCards} player={player} onOpenPremium={onOpenPremium} />
        )}

        {/* ── 시작 카드 그룹 */}
        <CardGroup
          title={t("cardCollection.starterCards")}
          badge={cardsUnlocked ? t("cardCollection.starterBadgeUnlocked") : t("cardCollection.starterBadgeLocked")}
          badgeColor={cardsUnlocked ? "#10b981" : "#9ca3af"}
          cards={starterCards}
          playerLevel={player.clearedLevel}
          clearedLevel={player.clearedLevel}
          premiumActive={premiumActive}
        />

        {/* ── 해금 상태: 프리미엄 카드를 시작 카드 바로 아래 */}
        {cardsUnlocked && (
          <PremiumGroup t={t} premiumActive={premiumActive} premiumCards={premiumCards} player={player} onOpenPremium={onOpenPremium} />
        )}

        {/* ── Lv.100 해금 그룹 */}
        <CardGroup
          title={t("cardCollection.lv100Cards")}
          badge={player.clearedLevel >= 100 ? t("cardCollection.lv100BadgeUnlocked") : t("cardCollection.lv100BadgeLocked", { level: player.clearedLevel })}
          badgeColor={player.clearedLevel >= 100 ? "#10b981" : "#9ca3af"}
          cards={lv100Cards}
          playerLevel={player.clearedLevel}
          clearedLevel={player.clearedLevel}
          premiumActive={premiumActive}
        />

        {/* ── Lv.400 해금 그룹 */}
        <CardGroup
          title={t("cardCollection.lv400Cards")}
          badge={t("cardCollection.lv400Badge")}
          badgeColor="#6b7280"
          cards={lv400Cards}
          playerLevel={player.clearedLevel}
          clearedLevel={player.clearedLevel}
          premiumActive={premiumActive}
        />

        <div className="h-6" />
      </div>
    </div>,
    document.body,
  );
}

/* ── 프리미엄 그룹 래퍼 (위치 재사용) ─────────────────────── */
function PremiumGroup({ t, premiumActive, premiumCards, player, onOpenPremium }: {
  t: (key: string, vars?: Record<string, unknown>) => string;
  premiumActive: boolean;
  premiumCards: CardCollectionDef[];
  player: PlayerData;
  onOpenPremium?: () => void;
}) {
  return (
    <CardGroup
      title={t("cardCollection.premiumCards")}
      badge={premiumActive ? t("cardCollection.premiumBadgeActive") : t("cardCollection.premiumBadgeLocked")}
      badgeColor={premiumActive ? "#d97706" : "#9ca3af"}
      cards={premiumCards}
      playerLevel={player.clearedLevel}
      clearedLevel={player.clearedLevel}
      premiumActive={premiumActive}
      onGroupAction={!premiumActive ? onOpenPremium : undefined}
      groupActionLabel={!premiumActive ? t("cardCollection.premiumAction") : undefined}
    />
  );
}

/* ── 그룹 컴포넌트 ─────────────────────────────────────────── */
function CardGroup({
  title, badge, badgeColor, cards, playerLevel, clearedLevel, premiumActive,
  onGroupAction, groupActionLabel,
}: {
  title:             string;
  badge:             string;
  badgeColor:        string;
  cards:             CardCollectionDef[];
  playerLevel:       number;
  clearedLevel:      number;
  premiumActive?:    boolean;
  onGroupAction?:    () => void;
  groupActionLabel?: string;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <p className="text-xs font-bold text-foreground/70">{title}</p>
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: badgeColor + "18", color: badgeColor }}
        >
          {badge}
        </span>
        <div className="flex-1 h-px bg-foreground/10" />
        {onGroupAction && groupActionLabel && (
          <button
            onClick={onGroupAction}
            className="text-[9px] font-bold text-amber-600 hover:text-amber-700 transition-colors shrink-0"
          >
            {groupActionLabel}
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {cards.map((card) => (
          <CollectionCard key={card.collectionId} card={card} playerLevel={playerLevel} clearedLevel={clearedLevel} premiumActive={premiumActive} />
        ))}
      </div>
    </div>
  );
}
