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
    <div className="flex h-[28px] items-center justify-center gap-1 bg-white text-xs">
      <button
        type="button"
        className="hover:underline"
        title="시작일 캘린더 수정 예정"
      >
        {formatShortDate(startDate)}
      </button>

      <span>~</span>

      <button
        type="button"
        className="border border-neutral-400 px-1 hover:bg-neutral-100"
        title="종료일 캘린더 수정 예정"
      >
        {formatShortDate(expiresAt)}
      </button>

      <StickyNotePinToggle pinned={pinned} onChange={onPinChange} />
    </div>
  );
}
