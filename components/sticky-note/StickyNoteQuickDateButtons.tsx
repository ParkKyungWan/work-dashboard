// components/sticky-note/StickyNoteQuickDateButtons.tsx

"use client";

type StickyNoteQuickDateButtonsProps = {
  onToday: () => void;
  onSubOneDay: () => void;
  onAddOneDay: () => void;
  onAddOneWeek: () => void;
};

const BUTTON_CLASS_NAME = [
  "h-7 min-w-0 flex-1 rounded-md px-1",
  "text-[10px] font-semibold text-slate-600",
  "transition hover:bg-white hover:text-slate-900",
].join(" ");

export default function StickyNoteQuickDateButtons({
  onToday,
  onSubOneDay,
  onAddOneDay,
  onAddOneWeek,
}: StickyNoteQuickDateButtonsProps) {
  return (
    <div className="px-2.5 pb-2.5 pt-1">
      <div className="grid grid-cols-4 gap-0.5 rounded-lg bg-slate-100 p-0.5">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToday();
          }}
          className={BUTTON_CLASS_NAME}
        >
          오늘
        </button>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSubOneDay();
          }}
          className={BUTTON_CLASS_NAME}
        >
          -1일
        </button>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onAddOneDay();
          }}
          className={BUTTON_CLASS_NAME}
        >
          +1일
        </button>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onAddOneWeek();
          }}
          className={BUTTON_CLASS_NAME}
        >
          +1주
        </button>
      </div>
    </div>
  );
}
