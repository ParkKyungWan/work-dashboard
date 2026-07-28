"use client";

import type { PointerEvent } from "react";

export type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

type ResizeHandlesProps = {
  onResizeStart: (
    direction: ResizeDirection,
    event: PointerEvent<HTMLDivElement>,
  ) => void;
};

const HANDLES: Array<[ResizeDirection, string]> = [
  ["n", "inset-x-2 top-0 h-1 cursor-n-resize"],
  ["s", "inset-x-2 bottom-0 h-1 cursor-s-resize"],
  ["e", "inset-y-2 right-0 w-1 cursor-e-resize"],
  ["w", "inset-y-2 left-0 w-1 cursor-w-resize"],
  ["ne", "right-0 top-0 h-3 w-3 cursor-ne-resize"],
  ["nw", "left-0 top-0 h-3 w-3 cursor-nw-resize"],
  ["se", "bottom-0 right-0 h-3 w-3 cursor-se-resize"],
  ["sw", "bottom-0 left-0 h-3 w-3 cursor-sw-resize"],
];

export default function ResizeHandles({ onResizeStart }: ResizeHandlesProps) {
  return (
    <>
      {HANDLES.map(([direction, className]) => (
        <div
          key={direction}
          aria-hidden="true"
          className={`absolute z-20 ${className}`}
          onPointerDown={(event) => onResizeStart(direction, event)}
        />
      ))}
    </>
  );
}
