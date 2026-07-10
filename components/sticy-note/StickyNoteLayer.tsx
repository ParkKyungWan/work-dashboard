"use client";

import { useState } from "react";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import StickyNoteCard from "./StickyNoteCard";
import type { StickyNote, StickyNoteLayerProps } from "./sticky-note.types";
import { endOfToday } from "./sticky-note.utils";
import { createRandomPostItColor } from "./sticky-note.utils";

function createMockStickyNote(index: number): StickyNote {
  const now = new Date().toISOString();

  return {
    id: `mock-${index}`,
    title: "필기 스티커",
    content: "전화 내용이나 짧은 업무 메모를 여기에 기록합니다.",
    status: "ACTIVE",
    startDate: now,
    expiresAt: endOfToday().toISOString(),
    dockSide: "RIGHT",
    dockOrder: index,
    x: null,
    y: null,
    width: 260,
    height: 230,
    collapsed: index !== 0,
    pinned: false,
    ...createRandomPostItColor(),
    dailyLogId: null,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export default function StickyNoteLayer({
  scope = "work-log",
}: StickyNoteLayerProps) {
  const [notes, setNotes] = useState<StickyNote[]>([
    createMockStickyNote(0),
    createMockStickyNote(1),
  ]);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleCollapse = (id: string) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id
          ? {
              ...note,
              collapsed: true,
              x: null,
              y: null,
              dockSide: "RIGHT",
              updatedAt: new Date().toISOString(),
            }
          : note,
      ),
    );
  };

  const handleExpand = (id: string) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id
          ? {
              ...note,
              collapsed: false,
              updatedAt: new Date().toISOString(),
            }
          : note,
      ),
    );
  };

  const handleDeleteRequest = (id: string) => {
    setDeleteTargetId(id);
  };

  const handleDeleteCancel = () => {
    setDeleteTargetId(null);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTargetId) return;

    setNotes((prev) => prev.filter((note) => note.id !== deleteTargetId));
    setDeleteTargetId(null);
  };

  const handlePinChange = (id: string, pinned: boolean) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id
          ? {
              ...note,
              pinned,
              updatedAt: new Date().toISOString(),
            }
          : note,
      ),
    );
  };

  const handlePositionChange = (id: string, x: number, y: number) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id
          ? {
              ...note,
              x,
              y,
              updatedAt: new Date().toISOString(),
            }
          : note,
      ),
    );
  };

  const handleExpiresAtChange = (id: string, expiresAt: string) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id
          ? {
              ...note,
              expiresAt,
              updatedAt: new Date().toISOString(),
            }
          : note,
      ),
    );
  };

  return (
    <>
      <div
        data-scope={scope}
        className="fixed inset-y-0 right-0 z-[1000] w-0"
        style={{ pointerEvents: "none" }}
      >
        {notes.map((note, index) => (
          <StickyNoteCard
            key={note.id}
            note={note}
            index={index}
            onCollapse={handleCollapse}
            onExpand={handleExpand}
            onDeleteRequest={handleDeleteRequest}
            onPinChange={handlePinChange}
            onPositionChange={handlePositionChange}
            onExpiresAtChange={handleExpiresAtChange}
          />
        ))}
      </div>

      <ConfirmDialog
        open={deleteTargetId !== null}
        title="완전히 삭제하시겠습니까?"
        description="삭제된 스티커는 복구할 수 없습니다."
        confirmText="예, 삭제합니다"
        cancelText="아니오"
        danger
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
}
