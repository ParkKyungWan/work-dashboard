"use client";

import type { MouseEvent } from "react";
import type { ProgramDefinition } from "@/lib/programs/types";

type DockItemProps = {
  program: ProgramDefinition;
  isRunning: boolean;
  isActive: boolean;
  distanceFromHovered: number | null;
  onHover: () => void;
  onLeave: () => void;
  onOpen: (origin: { x: number; y: number }) => void;
};

export default function DockItem({
  program,
  isRunning,
  isActive,
  distanceFromHovered,
  onHover,
  onLeave,
  onOpen,
}: DockItemProps) {
  const scale =
    distanceFromHovered === 0 ? 1.25 : distanceFromHovered === 1 ? 1.1 : 1;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onOpen({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  };

  return (
    <button
      type="button"
      className="group flex w-16 shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl px-1 py-1.5 text-[11px] text-neutral-700 transition-transform duration-150 ease-out"
      style={{
        transform: `translateY(${(scale - 1) * -20}px) scale(${scale})`,
      }}
      onPointerEnter={onHover}
      onPointerLeave={onLeave}
      onClick={handleClick}
      aria-label={`${program.name} 실행`}
      title={program.description}
    >
      <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white shadow-md transition-shadow">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={program.iconUrl}
          alt=""
          draggable={false}
          className="h-full w-full object-cover"
        />
      </span>

      <span className="flex h-1.5 items-center justify-center">
        {isRunning && (
          <span
            aria-label="실행 중"
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              isActive ? "bg-slate-500/80" : "bg-slate-400/60"
            }`}
          />
        )}
      </span>
    </button>
  );
}
