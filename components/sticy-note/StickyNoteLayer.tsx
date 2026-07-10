// components/sticky-note/StickyNoteLayer.tsx

"use client";

import { useCallback, useEffect, useState } from "react";

import ConfirmDialog from "@/components/common/ConfirmDialog";

import StickyNoteCard from "./StickyNoteCard";
import type { StickyNote, StickyNoteLayerProps } from "./sticky-note.types";
import { findNewStickyNotePosition } from "./sticky-note.utils";

const DEFAULT_STICKY_NOTE_WIDTH = 320;
const DEFAULT_STICKY_NOTE_HEIGHT = 360;

const VIEWPORT_PADDING = 16;
const TOP_SAFE_AREA = 72;

const MIN_VISIBLE_RATIO = 0.15;

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const fitNewNotePositionToViewport = (
  x: number,
  y: number,
  viewportWidth: number,
  viewportHeight: number,
  noteWidth = DEFAULT_STICKY_NOTE_WIDTH,
  noteHeight = DEFAULT_STICKY_NOTE_HEIGHT,
) => {
  const maxX = Math.max(
    VIEWPORT_PADDING,
    viewportWidth - noteWidth - VIEWPORT_PADDING,
  );

  const maxY = Math.max(
    TOP_SAFE_AREA,
    viewportHeight - noteHeight - VIEWPORT_PADDING,
  );

  return {
    x: clamp(x, VIEWPORT_PADDING, maxX),
    y: clamp(y, TOP_SAFE_AREA, maxY),
  };
};

const fitExistingNotePositionToViewport = (
  x: number,
  y: number,
  viewportWidth: number,
  viewportHeight: number,
  noteWidth = DEFAULT_STICKY_NOTE_WIDTH,
  noteHeight = DEFAULT_STICKY_NOTE_HEIGHT,
) => {
  const minVisibleWidth = noteWidth * MIN_VISIBLE_RATIO;
  const minVisibleHeight = noteHeight * MIN_VISIBLE_RATIO;

  const minX = -noteWidth + minVisibleWidth;
  const maxX = viewportWidth - minVisibleWidth;

  const minY = -noteHeight + minVisibleHeight;
  const maxY = viewportHeight - minVisibleHeight;

  return {
    x: clamp(x, minX, maxX),
    y: clamp(y, minY, maxY),
  };
};

const toLocalDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const isSameLocalDay = (dateString: string, targetDate: Date) => {
  return toLocalDateKey(new Date(dateString)) === toLocalDateKey(targetDate);
};

const getEndOfYesterdayISOString = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  date.setHours(23, 59, 59, 999);

  return date.toISOString();
};

const isTodayIncludedInNotePeriod = (note: StickyNote) => {
  const now = new Date();

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const start = new Date(note.startDate);
  const end = note.expiresAt ? new Date(note.expiresAt) : null;

  return (
    start.getTime() <= todayEnd.getTime() &&
    (!end || end.getTime() >= todayStart.getTime())
  );
};

export default function StickyNoteLayer({
  scope = "work-log",
}: StickyNoteLayerProps) {
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const patchNote = useCallback(
    async (
      id: string,
      body: Partial<StickyNote>,
    ): Promise<StickyNote | null> => {
      try {
        const response = await fetch(`/api/sticky-notes/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          console.error("스티커 수정 실패");
          return null;
        }

        return (await response.json()) as StickyNote;
      } catch (error) {
        console.error("스티커 수정 중 오류:", error);
        return null;
      }
    },
    [],
  );

  const deleteNote = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/sticky-notes/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        console.error("스티커 삭제 실패");
        return false;
      }

      return true;
    } catch (error) {
      console.error("스티커 삭제 중 오류:", error);
      return false;
    }
  }, []);

  const fetchActiveNotes = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/sticky-notes/active", {
        cache: "no-store",
      });

      if (!response.ok) {
        console.error("스티커 조회 실패");
        return;
      }

      const data = (await response.json()) as StickyNote[];

      const fittedNotes =
        typeof window === "undefined"
          ? data
          : data.map((note) => {
              if (note.collapsed) {
                return note;
              }

              const fittedPosition = fitExistingNotePositionToViewport(
                note.x ?? VIEWPORT_PADDING,
                note.y ?? TOP_SAFE_AREA,
                window.innerWidth,
                window.innerHeight,
                note.width ?? DEFAULT_STICKY_NOTE_WIDTH,
                note.height ?? DEFAULT_STICKY_NOTE_HEIGHT,
              );

              return {
                ...note,
                x: fittedPosition.x,
                y: fittedPosition.y,
              };
            });

      setNotes(fittedNotes);
    } catch (error) {
      console.error("스티커 조회 중 오류:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchActiveNotes();
  }, [fetchActiveNotes]);

  useEffect(() => {
    let resizeFrame: number | null = null;

    const handleResize = () => {
      if (resizeFrame !== null) {
        window.cancelAnimationFrame(resizeFrame);
      }

      resizeFrame = window.requestAnimationFrame(() => {
        const changedNotes: Array<{
          id: string;
          x: number;
          y: number;
        }> = [];

        setNotes((previousNotes) =>
          previousNotes.map((note) => {
            if (note.collapsed) {
              return note;
            }

            const currentX = note.x ?? VIEWPORT_PADDING;
            const currentY = note.y ?? TOP_SAFE_AREA;

            const fittedPosition = fitExistingNotePositionToViewport(
              currentX,
              currentY,
              window.innerWidth,
              window.innerHeight,
              note.width ?? DEFAULT_STICKY_NOTE_WIDTH,
              note.height ?? DEFAULT_STICKY_NOTE_HEIGHT,
            );

            const positionChanged =
              fittedPosition.x !== currentX || fittedPosition.y !== currentY;

            if (!positionChanged) {
              return note;
            }

            changedNotes.push({
              id: note.id,
              x: fittedPosition.x,
              y: fittedPosition.y,
            });

            return {
              ...note,
              x: fittedPosition.x,
              y: fittedPosition.y,
            };
          }),
        );

        if (changedNotes.length > 0) {
          void Promise.all(
            changedNotes.map((note) =>
              patchNote(note.id, {
                x: note.x,
                y: note.y,
              }),
            ),
          );
        }

        resizeFrame = null;
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);

      if (resizeFrame !== null) {
        window.cancelAnimationFrame(resizeFrame);
      }
    };
  }, [patchNote]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;

      if (target?.closest("[data-sticky-note-menu='true']")) {
        return;
      }

      setIsMenuOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isMenuOpen]);

  const updateLocalNote = (updatedNote: StickyNote) => {
    setNotes((previousNotes) =>
      previousNotes.map((note) =>
        note.id === updatedNote.id ? updatedNote : note,
      ),
    );
  };

  const handleCreate = async () => {
    if (typeof window === "undefined") {
      return;
    }

    const position = findNewStickyNotePosition(
      notes,
      window.innerWidth,
      window.innerHeight,
    );

    const fittedPosition = fitNewNotePositionToViewport(
      position.x,
      position.y,
      window.innerWidth,
      window.innerHeight,
      DEFAULT_STICKY_NOTE_WIDTH,
      DEFAULT_STICKY_NOTE_HEIGHT,
    );

    try {
      const response = await fetch("/api/sticky-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          x: fittedPosition.x,
          y: fittedPosition.y,
          dockOrder: notes.length,
        }),
      });

      if (!response.ok) {
        console.error("스티커 생성 실패");
        return;
      }

      const createdNote = (await response.json()) as StickyNote;

      setNotes((previousNotes) => [createdNote, ...previousNotes]);
      setIsMenuOpen(false);
    } catch (error) {
      console.error("스티커 생성 중 오류:", error);
    }
  };

  const handleHideAll = async () => {
    const targetNotes = notes.filter((note) => !note.collapsed);

    if (targetNotes.length === 0) {
      setIsMenuOpen(false);
      return;
    }

    setNotes((previousNotes) =>
      previousNotes.map((note) => ({
        ...note,
        collapsed: true,
      })),
    );

    const updatedNotes = await Promise.all(
      targetNotes.map((note) =>
        patchNote(note.id, {
          collapsed: true,
        }),
      ),
    );

    updatedNotes.forEach((updatedNote) => {
      if (updatedNote) {
        updateLocalNote(updatedNote);
      }
    });

    setIsMenuOpen(false);
  };

  const handleClearHiddenNotes = async () => {
    const today = new Date();
    const endOfYesterday = getEndOfYesterdayISOString();

    const hiddenNotes = notes.filter((note) => note.collapsed);

    if (hiddenNotes.length === 0) {
      setIsMenuOpen(false);
      return;
    }

    const notesToDelete = hiddenNotes.filter((note) =>
      isSameLocalDay(note.startDate, today),
    );

    const notesToExpire = hiddenNotes.filter((note) => {
      const startsToday = isSameLocalDay(note.startDate, today);

      return !startsToday && isTodayIncludedInNotePeriod(note);
    });

    const deletedResults = await Promise.all(
      notesToDelete.map((note) => deleteNote(note.id)),
    );

    const deletedIds = notesToDelete
      .filter((_, index) => deletedResults[index])
      .map((note) => note.id);

    const updatedNotes = await Promise.all(
      notesToExpire.map((note) =>
        patchNote(note.id, {
          expiresAt: endOfYesterday,
          collapsed: true,
        }),
      ),
    );

    const expiredIds = updatedNotes
      .filter((note): note is StickyNote => note !== null)
      .map((note) => note.id);

    setNotes((previousNotes) =>
      previousNotes.filter(
        (note) =>
          !deletedIds.includes(note.id) && !expiredIds.includes(note.id),
      ),
    );

    setIsMenuOpen(false);
  };

  const handleCollapse = async (id: string) => {
    const targetNote = notes.find((note) => note.id === id);

    if (!targetNote) {
      return;
    }

    setNotes((previousNotes) =>
      previousNotes.map((note) =>
        note.id === id
          ? {
              ...note,
              collapsed: true,
            }
          : note,
      ),
    );

    const updatedNote = await patchNote(id, {
      collapsed: true,
    });

    if (updatedNote) {
      updateLocalNote(updatedNote);
    }
  };

  const handleExpand = async (id: string) => {
    if (typeof window === "undefined") {
      return;
    }

    const targetNote = notes.find((note) => note.id === id);

    if (!targetNote) {
      return;
    }

    const fittedPosition = fitExistingNotePositionToViewport(
      targetNote.x ?? VIEWPORT_PADDING,
      targetNote.y ?? TOP_SAFE_AREA,
      window.innerWidth,
      window.innerHeight,
      targetNote.width ?? DEFAULT_STICKY_NOTE_WIDTH,
      targetNote.height ?? DEFAULT_STICKY_NOTE_HEIGHT,
    );

    setNotes((previousNotes) =>
      previousNotes.map((note) =>
        note.id === id
          ? {
              ...note,
              x: fittedPosition.x,
              y: fittedPosition.y,
              collapsed: false,
            }
          : note,
      ),
    );

    const updatedNote = await patchNote(id, {
      x: fittedPosition.x,
      y: fittedPosition.y,
      collapsed: false,
    });

    if (updatedNote) {
      updateLocalNote(updatedNote);
    }
  };

  const handleDeleteRequest = (id: string) => {
    setDeleteTargetId(id);
  };

  const handleDeleteCancel = () => {
    setDeleteTargetId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) {
      return;
    }

    const deleted = await deleteNote(deleteTargetId);

    if (!deleted) {
      return;
    }

    setNotes((previousNotes) =>
      previousNotes.filter((note) => note.id !== deleteTargetId),
    );

    setDeleteTargetId(null);
  };

  const handlePinChange = async (id: string, pinned: boolean) => {
    setNotes((previousNotes) =>
      previousNotes.map((note) =>
        note.id === id
          ? {
              ...note,
              pinned,
            }
          : note,
      ),
    );

    const updatedNote = await patchNote(id, {
      pinned,
    });

    if (updatedNote) {
      updateLocalNote(updatedNote);
    }
  };

  const handlePositionChange = async (id: string, x: number, y: number) => {
    if (typeof window === "undefined") {
      return;
    }

    const targetNote = notes.find((note) => note.id === id);

    const fittedPosition = fitExistingNotePositionToViewport(
      x,
      y,
      window.innerWidth,
      window.innerHeight,
      targetNote?.width ?? DEFAULT_STICKY_NOTE_WIDTH,
      targetNote?.height ?? DEFAULT_STICKY_NOTE_HEIGHT,
    );

    setNotes((previousNotes) =>
      previousNotes.map((note) =>
        note.id === id
          ? {
              ...note,
              x: fittedPosition.x,
              y: fittedPosition.y,
              collapsed: false,
            }
          : note,
      ),
    );

    const updatedNote = await patchNote(id, {
      x: fittedPosition.x,
      y: fittedPosition.y,
      collapsed: false,
    });

    if (updatedNote) {
      updateLocalNote(updatedNote);
    }
  };

  const handleHeightChange = async (id: string, height: number) => {
    setNotes((previousNotes) =>
      previousNotes.map((note) =>
        note.id === id
          ? {
              ...note,
              height,
            }
          : note,
      ),
    );

    const updatedNote = await patchNote(id, {
      height,
    });

    if (updatedNote) {
      updateLocalNote(updatedNote);
    }
  };

  const handleExpiresAtChange = async (id: string, expiresAt: string) => {
    const updatedNote = await patchNote(id, {
      expiresAt,
    });

    if (!updatedNote) {
      return;
    }

    const isExpired = updatedNote.expiresAt
      ? new Date(updatedNote.expiresAt).getTime() < Date.now()
      : false;

    if (isExpired) {
      setNotes((previousNotes) =>
        previousNotes.filter((note) => note.id !== id),
      );

      return;
    }

    updateLocalNote(updatedNote);
  };

  const handleContentChange = async (id: string, content: string) => {
    setNotes((previousNotes) =>
      previousNotes.map((note) =>
        note.id === id
          ? {
              ...note,
              content,
            }
          : note,
      ),
    );

    const updatedNote = await patchNote(id, {
      content,
    });

    if (updatedNote) {
      updateLocalNote(updatedNote);
    }
  };

  return (
    <>
      <div
        data-scope={scope}
        className="pointer-events-none fixed inset-0 z-[1000]"
      >
        <div
          data-sticky-note-menu="true"
          className="pointer-events-auto fixed right-5 top-5 z-[1100]"
        >
          <button
            type="button"
            onClick={() => setIsMenuOpen((previous) => !previous)}
            disabled={isLoading}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-900 bg-white text-2xl font-bold shadow-lg transition hover:bg-neutral-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            title="스티커 메뉴"
            aria-label="스티커 메뉴"
          >
            +
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-12 w-40 overflow-hidden rounded-md border border-neutral-900 bg-white text-xs shadow-xl">
              <button
                type="button"
                onClick={handleCreate}
                className="block w-full px-3 py-2 text-left font-medium text-neutral-900 hover:bg-neutral-100"
              >
                새 스티커
              </button>

              <button
                type="button"
                onClick={handleHideAll}
                className="block w-full border-t border-neutral-200 px-3 py-2 text-left font-medium text-neutral-900 hover:bg-neutral-100"
              >
                전체 숨기기
              </button>

              <button
                type="button"
                onClick={handleClearHiddenNotes}
                className="block w-full border-t border-neutral-200 px-3 py-2 text-left font-medium text-red-700 hover:bg-red-50"
              >
                숨겨진 스티커 정리
              </button>
            </div>
          )}
        </div>

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
            onHeightChange={handleHeightChange}
            onExpiresAtChange={handleExpiresAtChange}
            onContentChange={handleContentChange}
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
