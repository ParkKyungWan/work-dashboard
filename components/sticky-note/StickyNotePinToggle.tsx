// components/sticky-note/StickyNotePinToggle.tsx

"use client";

type StickyNotePinToggleProps = {
  pinned: boolean;
  onChange: (pinned: boolean) => void;
};

export default function StickyNotePinToggle({
  pinned,
  onChange,
}: StickyNotePinToggleProps) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onChange(!pinned);
      }}
      className={[
        "grid size-8 shrink-0 place-items-center rounded-lg",
        "text-[12px] transition",
        pinned
          ? "bg-slate-200 text-slate-700"
          : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600",
      ].join(" ")}
      title={pinned ? "고정 해제" : "위치 고정"}
      aria-label={pinned ? "고정 해제" : "위치 고정"}
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        className="size-4.5"
        aria-hidden="true"
      >
        <path
          d="M7 3.5h6M8 3.5v4l-2 2v1h8v-1l-2-2v-4M10 10.5v6"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
