/* ============================================================
 * DogamModal.tsx
 * 도감 — 풀페이지 팝업
 * ============================================================ */

import { useState } from "react";
import { createPortal } from "react-dom";
import {
  DOGAM_CATEGORIES,
  loadDogamCollection,
  getCurrentWeekCategoryIndex,
  MAX_ITEM_COUNT,
  type DogamCollection,
} from "@/utils/dogamData";
import { useTranslation } from "@/i18n";

interface DogamModalProps {
  onClose: () => void;
}

export function DogamModal({ onClose }: DogamModalProps) {
  const { t } = useTranslation();
  const currentIdx          = getCurrentWeekCategoryIndex();
  const [tabIdx, setTabIdx] = useState(currentIdx);
  const [collection]        = useState<DogamCollection>(loadDogamCollection);

  const category  = DOGAM_CATEGORIES[tabIdx];
  const isCurrent = tabIdx === currentIdx;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col bg-white animate-in slide-in-from-bottom-4 duration-300">

      {/* ── 헤더 ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 pt-5 pb-3 flex-shrink-0 border-b border-foreground/8">
        <h2 className="flex-1 text-base font-bold text-foreground flex items-center gap-1.5">
          <img src="/icons/icon-book.png" className="w-6 h-6 object-contain" alt="" draggable={false} />
          {t("dogam.title")}
        </h2>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-foreground/8 hover:bg-foreground/14 active:scale-95 transition-all text-foreground/50 text-sm font-bold flex-shrink-0"
        >
          ✕
        </button>
      </div>

      {/* ── 스크롤 영역 ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">

        {/* 이번 주 이벤트 배지 */}
        <div className="bg-primary/8 border border-primary/15 rounded-2xl px-4 py-2.5 mt-4 mb-4 flex items-center gap-2">
          <span className="text-2xl">{DOGAM_CATEGORIES[currentIdx].emoji}</span>
          <div>
            <p className="text-xs font-black text-primary">{t("dogam.thisWeekEvent")}</p>
            <p className="text-xs text-foreground/50 mt-0.5">
              {t("dogam.collecting", { name: t(`dogam.category.${DOGAM_CATEGORIES[currentIdx].id}`) })}
            </p>
          </div>
        </div>

        {/* 카테고리 탭 */}
        <div className="flex gap-1.5 mb-4">
          {DOGAM_CATEGORIES.map((cat, idx) => (
            <button
              key={cat.id}
              onClick={() => setTabIdx(idx)}
              className={[
                "flex-1 py-2 rounded-full text-xl font-semibold transition-all flex items-center justify-center",
                tabIdx === idx
                  ? "bg-primary text-white shadow-sm"
                  : "bg-foreground/8 text-foreground/50 hover:bg-foreground/12",
              ].join(" ")}
            >
              <span>{cat.emoji}</span>
            </button>
          ))}
        </div>

        {/* 아이템 목록 */}
        <div className="relative pb-2">
          <div className="flex flex-col gap-2.5">
            {category.items.map((item) => {
              const count = collection[item.id] ?? 0;

              const nextMilestone =
                count >= MAX_ITEM_COUNT
                  ? MAX_ITEM_COUNT
                  : Math.min(MAX_ITEM_COUNT, Math.ceil((count + 1) / 10) * 10);
              const milestoneMin = nextMilestone - 10;
              const pct =
                count >= MAX_ITEM_COUNT
                  ? 100
                  : Math.max(0, Math.round(((count - milestoneMin) / 10) * 100));

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 bg-white border border-foreground/8 rounded-2xl p-3 hover:border-foreground/15 transition-all"
                >
                  {/* 아이콘 */}
                  <div className="w-10 h-10 bg-primary/8 rounded-xl flex items-center justify-center text-xl shrink-0">
                    {item.emoji}
                  </div>

                  {/* 정보 + 진행 바 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold text-foreground">{t(`dogam.item.${item.id}`)}</p>
                      <span className="text-xs font-black text-primary/70">
                        {count}
                        <span className="text-foreground/30 font-normal"> / {MAX_ITEM_COUNT}</span>
                      </span>
                    </div>

                    <div className="h-1.5 bg-foreground/8 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {count < MAX_ITEM_COUNT ? (
                      <p className="text-[10px] text-foreground/35 mt-0.5">
                        {t("dogam.nextMilestone", { count: nextMilestone })}
                      </p>
                    ) : (
                      <p className="text-[10px] text-emerald-500 font-bold mt-0.5">
                        {t("dogam.maxCollected")}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 비현재 주차 오버레이 */}
          {!isCurrent && (
            <div
              className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center gap-2 pointer-events-none"
              style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
            >
              <span className="text-3xl">⏳</span>
              <p className="text-sm font-bold text-white">{t("common.comingSoon")}</p>
            </div>
          )}
        </div>

      </div>
    </div>,
    document.body,
  );
}
