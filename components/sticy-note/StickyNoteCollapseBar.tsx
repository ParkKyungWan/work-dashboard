// components/sticky-note/StickyNoteCollapseBar.tsx

"use client";

type StickyNoteCollapseBarProps = {
  onCollapse: () => void;
};

export default function StickyNoteCollapseBar({
  onCollapse,
}: StickyNoteCollapseBarProps) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onCollapse();
      }}
      className="flex h-[22px] w-full items-center justify-center border-b border-neutral-900 bg-white text-xs"
    >
      ∨ 숨기기
    </button>
  );
}
