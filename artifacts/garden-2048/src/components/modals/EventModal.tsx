/* ============================================================
 * EventModal.tsx
 * 이벤트 팝업 — 특별 이벤트 섹션
 * ============================================================ */

import { BaseModal } from "./BaseModal";
import { useTranslation } from "@/i18n";

interface EventModalProps {
  onClose: () => void;
}

export function EventModal({ onClose }: EventModalProps) {
  const { t } = useTranslation();
  return (
    <BaseModal icon="🎉" title={t("event.title")} onClose={onClose}>
      <div className="flex flex-col items-center justify-center py-10 gap-3 pb-4">
        <div className="text-5xl">🌟</div>
        <p className="text-sm font-bold text-foreground/40">{t("event.comingSoon")}</p>
        <p className="text-xs text-foreground/30 text-center max-w-[200px]">
          {t("event.desc")}
        </p>
      </div>
    </BaseModal>
  );
}
