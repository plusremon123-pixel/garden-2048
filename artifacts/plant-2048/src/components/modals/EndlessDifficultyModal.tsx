/* ============================================================
 * EndlessDifficultyModal.tsx
 * 무한 모드 난이도 선택 팝업
 * ============================================================ */

import { BaseModal }          from "./BaseModal";
import {
  ENDLESS_CONFIGS,
  loadEndlessSave,
  type EndlessDifficulty,
} from "@/utils/endlessModeData";
import { useTranslation } from "@/i18n";

interface EndlessDifficultyModalProps {
  onStart:    (difficulty: EndlessDifficulty) => void;
  onContinue: (difficulty: EndlessDifficulty) => void;
  onClose:    () => void;
}

const DIFFICULTY_META: Record<EndlessDifficulty, {
  emoji: string;
  bgClass: string;
  badgeClass: string;
}> = {
  easy:   { emoji: "🌱", bgClass: "bg-emerald-50 border-emerald-200",  badgeClass: "bg-emerald-100 text-emerald-700" },
  normal: { emoji: "🌿", bgClass: "bg-blue-50 border-blue-200",        badgeClass: "bg-blue-100 text-blue-700"       },
  hard:   { emoji: "🌵", bgClass: "bg-orange-50 border-orange-200",    badgeClass: "bg-orange-100 text-orange-700"   },
};

export function EndlessDifficultyModal({
  onStart, onContinue, onClose,
}: EndlessDifficultyModalProps) {
  const { t } = useTranslation();
  const save  = loadEndlessSave();

  return (
    <BaseModal icon="♾️" title={t("endless.title")} onClose={onClose}>
      <div className="flex flex-col gap-3 pb-2">

        {/* 이어하기 버튼 (저장 있을 때만) */}
        {save && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="text-2xl flex-shrink-0">💾</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">{t("endless.savedGame")}</p>
              <p className="text-xs text-foreground/50">{t(`endless.diff.${save.difficulty}`)}</p>
            </div>
            <button
              onClick={() => onContinue(save.difficulty)}
              className="flex-shrink-0 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold active:scale-95 transition-transform"
            >
              {t("endless.continue")}
            </button>
          </div>
        )}

        {/* 안내 */}
        <p className="text-xs text-foreground/50 text-center px-1">
          {t("endless.selectDiff")}
        </p>

        {/* 난이도 카드 목록 */}
        {(["easy", "normal", "hard"] as EndlessDifficulty[]).map((diff) => {
          const cfg  = ENDLESS_CONFIGS[diff];
          const meta = DIFFICULTY_META[diff];
          return (
            <div
              key={diff}
              className={`border rounded-2xl px-4 py-3 flex items-center gap-3 ${meta.bgClass}`}
            >
              <span className="text-2xl flex-shrink-0">{meta.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-bold text-foreground">{t(`endless.diff.${diff}`)}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.badgeClass}`}>
                    {cfg.boardSize}×{cfg.boardSize}
                  </span>
                </div>
                <p className="text-xs text-foreground/50">
                  {cfg.goals.map((g) => g.toLocaleString()).join(" → ")}
                </p>
              </div>
              <button
                onClick={() => onStart(diff)}
                className="flex-shrink-0 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold active:scale-95 transition-transform"
              >
                {t("endless.start")}
              </button>
            </div>
          );
        })}

      </div>
    </BaseModal>
  );
}
