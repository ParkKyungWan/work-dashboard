// components/sticky-note/StickyNoteQuickDateButtons.tsx

"use client";

type StickyNoteQuickDateButtonsProps = {
  onToday: () => void;
  onSubOneDay: () => void;
  onAddOneDay: () => void;
  onAddOneWeek: () => void;
};

export default function StickyNoteQuickDateButtons({
  onToday,
  onSubOneDay,
  onAddOneDay,
  onAddOneWeek,
}: StickyNoteQuickDateButtonsProps) {
  return (
    <div className="flex h-[32px] items-center justify-center gap-1 bg-white px-1">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToday();
        }}
        className="bg-[#e6b6b6] px-2 py-1 text-[11px] font-bold text-[#5a1e1e]"
      >
        오늘까지
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onSubOneDay();
        }}
        className="bg-[#e6b6b6] px-2 py-1 text-[11px] font-bold text-[#5a1e1e]"
      >
        -1일
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onAddOneDay();
        }}
        className="bg-[#e6b6b6] px-2 py-1 text-[11px] font-bold text-[#5a1e1e]"
      >
        +1일
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onAddOneWeek();
        }}
        className="bg-[#e6b6b6] px-2 py-1 text-[11px] font-bold text-[#5a1e1e]"
      >
        +1주일
      </button>
    </div>
  );
}
