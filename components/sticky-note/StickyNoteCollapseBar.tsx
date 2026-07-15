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
      className={[
        "flex h-7 w-full shrink-0 items-center justify-center gap-1",
        "border-none bg-black/[0.035]",
        "text-[10px] font-semibold text-slate-600",
        "transition hover:bg-black/[0.06] hover:text-slate-800",
      ].join(" ")}
      title={collapsed ? "설정 영역 펼치기" : "설정 영역 접기"}
    >
      <span
        className={[
          "text-[8px] transition-transform",
          collapsed ? "" : "rotate-180",
        ].join(" ")}
        aria-hidden="true"
      >
        ▲
      </span>

      {collapsed ? "설정 열기" : "설정 닫기"}
    </button>
  );
}
