// components/sticky-note/StickyNoteCard.tsx

"use client";

import { useMemo, useState } from "react";
import StickyNoteBody from "./StickyNoteBody";
import StickyNoteCollapseBar from "./StickyNoteCollapseBar";
import StickyNoteDateRange from "./StickyNoteDateRange";
import StickyNoteHeader from "./StickyNoteHeader";
import StickyNoteQuickDateButtons from "./StickyNoteQuickDateButtons";
import type {
  StickyNoteCardProps,
  StickyNoteViewState,
} from "./sticky-note.types";
import {
  addDaysFromBase,
  createPostItColor,
  endOfToday,
  getDockTop,
} from "./sticky-note.utils";

export default function StickyNoteCard({
  note,
  index,
  onCollapse,
  onExpand,
  onDeleteRequest,
  onPinChange,
  onExpiresAtChange,
}: StickyNoteCardProps) {
  const [viewState, setViewState] = useState<StickyNoteViewState>(
    note.collapsed ? "DOCKED" : "OPEN",
  );

  const postItColor = useMemo(() => createPostItColor(note), [note]);

  const isDocked = viewState === "DOCKED";
  const isPreview = viewState === "PREVIEW";

  const top = note.y ?? getDockTop(index);

  const right = (() => {
    if (viewState === "DOCKED") return -220;
    if (viewState === "PREVIEW") return -80;
    return 24;
  })();

  const handleMouseEnter = () => {
    if (viewState === "DOCKED") {
      setViewState("PREVIEW");
    }
  };

  const handleMouseLeave = () => {
    if (note.pinned) return;

    if (viewState === "PREVIEW") {
      setViewState("DOCKED");
    }
  };

  const handleOpen = () => {
    setViewState("OPEN");
    onExpand(note.id);
  };

  const handleCollapse = () => {
    setViewState("DOCKED");
    onCollapse(note.id);
  };

  const handleToday = () => {
    onExpiresAtChange(note.id, endOfToday().toISOString());
  };

  const handleAddOneDay = () => {
    onExpiresAtChange(
      note.id,
      addDaysFromBase(note.expiresAt, 1).toISOString(),
    );
  };

  const handleAddOneWeek = () => {
    onExpiresAtChange(
      note.id,
      addDaysFromBase(note.expiresAt, 7).toISOString(),
    );
  };

  return (
    <div
      className="fixed z-[1000] transition-all duration-200 ease-out"
      style={{
        top,
        right,
        width: note.width,
        pointerEvents: "auto",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="border border-neutral-900 bg-white shadow-lg">
        <StickyNoteHeader
          title={note.title}
          content={note.content}
          postItColor={postItColor}
          isDocked={isDocked}
          isPreview={isPreview}
          onCollapse={handleCollapse}
          onDeleteRequest={() => onDeleteRequest(note.id)}
          onOpen={handleOpen}
        />

        {!isDocked && (
          <>
            <StickyNoteCollapseBar onCollapse={handleCollapse} />

            <StickyNoteDateRange
              startDate={note.startDate}
              expiresAt={note.expiresAt}
              pinned={note.pinned}
              onPinChange={(pinned) => onPinChange(note.id, pinned)}
            />

            <StickyNoteQuickDateButtons
              onToday={handleToday}
              onAddOneDay={handleAddOneDay}
              onAddOneWeek={handleAddOneWeek}
            />

            <StickyNoteBody content={note.content} />
          </>
        )}
      </div>
    </div>
  );
}
