// components/sticky-note/StickyNoteDateRange.tsx

"use client";

import StickyNotePinToggle from "./StickyNotePinToggle";
import { formatShortDate } from "./sticky-note.utils";

type StickyNoteDateRangeProps = {
  startDate: string;
  expiresAt: string | null;
  pinned: boolean;
  onPinChange: (pinned: boolean) => void;
};

export default function StickyNoteDateRange({
  startDate,
  expiresAt,
  pinned,
  onPinChange,
}: StickyNoteDateRangeProps) {
  return (
    <div className="flex h-12 items-center gap-2 px-2.5">
      <div className="flex min-w-0 flex-1 items-center rounded-lg bg-slate-100/80 px-2">
        <button
          type="button"
          className="h-7 min-w-0 flex-1 truncate text-[10px] font-medium text-slate-600 transition hover:text-slate-900"
          title="시작일 캘린더 수정 예정"
        >
          {formatShortDate(startDate)}
        </button>

        <span className="shrink-0 px-1 text-[10px] text-slate-400">—</span>

        <button
          type="button"
          className="h-7 min-w-0 flex-1 truncate text-[10px] font-medium text-slate-600 transition hover:text-slate-900"
          title="종료일 캘린더 수정 예정"
        >
          {formatShortDate(expiresAt)}
        </button>
      </div>

      <StickyNotePinToggle pinned={pinned} onChange={onPinChange} />
    </div>
  );
}
