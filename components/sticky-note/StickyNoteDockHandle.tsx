// components/sticky-note/StickyNoteDockHandle.tsx

"use client";

type StickyNoteDockHandleProps = {
  label?: string;
};

export default function StickyNoteDockHandle({
  label = "필기",
}: StickyNoteDockHandleProps) {
  return (
    <div className="flex h-[150px] items-center justify-center border-b border-neutral-900 bg-yellow-200">
      <span className="text-lg font-extrabold text-black [writing-mode:vertical-rl]">
        {label}
      </span>
    </div>
  );
}
