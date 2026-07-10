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
      className="ml-1"
      title={pinned ? "고정 해제" : "위치 고정"}
    >
      {pinned ? "📌" : "📍"}
    </button>
  );
}
