// components/sticky-note/StickyNoteCollapseBar.tsx

"use client";

type StickyNoteCollapseBarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export default function StickyNoteCollapseBar({
  collapsed,
  onToggle,
}: StickyNoteCollapseBarProps) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      className="flex h-[22px] w-full shrink-0 items-center justify-center border-y border-neutral-900 bg-white text-xs text-neutral-700 hover:bg-neutral-100"
      title={collapsed ? "설정 영역 펼치기" : "설정 영역 접기"}
    >
      {collapsed ? "∧ 올리기" : "∨ 접기"}
    </button>
  );
}
