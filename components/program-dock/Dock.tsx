"use client";

import { useState } from "react";
import type { ProgramDefinition } from "@/lib/programs/types";
import DockItem from "./DockItem";

type DockProps = {
  programs: ProgramDefinition[];
  runningProgramIds: Set<string>;
  activeProgramId: string | null;
  onEnter: () => void;
  onLeave: () => void;
  onOpen: (
    program: ProgramDefinition,
    origin: { x: number; y: number },
  ) => void;
};

export default function Dock({
  programs,
  runningProgramIds,
  activeProgramId,
  onEnter,
  onLeave,
  onOpen,
}: DockProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <nav
      aria-label="프로그램 바로가기"
      className="pointer-events-auto flex max-w-[calc(100vw-32px)] items-end gap-1 overflow-x-auto rounded-2xl border border-white/60 bg-white/70 px-2 pb-1 pt-2 shadow-[0_12px_36px_rgba(15,23,42,0.22)] backdrop-blur-xl scrollbar-hidden"
      onPointerEnter={onEnter}
      onPointerLeave={() => {
        setHoveredIndex(null);
        onLeave();
      }}
    >
      {programs.map((program, index) => (
        <DockItem
          key={program.id}
          program={program}
          isRunning={runningProgramIds.has(program.id)}
          isActive={activeProgramId === program.id}
          distanceFromHovered={
            hoveredIndex === null ? null : Math.abs(index - hoveredIndex)
          }
          onHover={() => setHoveredIndex(index)}
          onLeave={() => undefined}
          onOpen={(origin) => onOpen(program, origin)}
        />
      ))}
    </nav>
  );
}
