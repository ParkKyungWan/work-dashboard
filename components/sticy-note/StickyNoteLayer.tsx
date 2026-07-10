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

/**
 * 기존 스티커 보정 기준.
 *
 * 0.15 = 스티커의 15%만 화면에 보여도 허용.
 * 너무 조금 보이면 찾기 어려우니까 10%보다 약간 넉넉하게 둠.
 */
const MIN_VISIBLE_RATIO = 0.15;

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

/**
 * 새 스티커 생성용.
 *
 * 새로 만드는 스티커는 화면 안쪽에 깔끔하게 들어와야 함.
 */
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

/**
 * 기존 스티커 보정용.
 *
 * 브라우저 크기가 줄거나, 숨김 해제하거나, 드래그 후 저장할 때 사용.
 *
 * 정책:
 * - 스티커 전체가 화면 안에 있을 필요 없음
 * - 스티커의 일정 비율만 화면에 남아 있으면 그대로 허용
 * - 거의 사라질 정도로 벗어났을 때만 안쪽으로 살짝 당김
 */
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

export default function StickyNoteLayer({
  scope = "work-log",
}: StickyNoteLayerProps) {
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

      /**
       * 최초 로딩 시:
       * - 숨김 상태는 그대로 둠
       * - 열린 상태는 너무 많이 화면 밖이면 느슨하게만 보정
       */
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

  /**
   * 브라우저 크기 변경 시:
   * 기존처럼 보정은 하되, 너무 강하게 안쪽으로 당기지 않음.
   *
   * 스티커의 15% 정도만 화면에 남아 있으면 그대로 둔다.
   */
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

        /**
         * 너무 많이 벗어나서 실제로 보정된 경우만 저장.
         * 조금 벗어난 정도는 그대로 유지됨.
         */
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

    /**
     * 새 스티커는 화면 안쪽에 확실히 생성.
     */
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
    } catch (error) {
      console.error("스티커 생성 중 오류:", error);
    }
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

    /**
     * 숨김 해제 시:
     * 너무 많이 화면 밖이면 살짝 보정.
     * 조금 벗어난 정도는 유지.
     */
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

    try {
      const response = await fetch(`/api/sticky-notes/${deleteTargetId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        console.error("스티커 삭제 실패");
        return;
      }

      setNotes((previousNotes) =>
        previousNotes.filter((note) => note.id !== deleteTargetId),
      );

      setDeleteTargetId(null);
    } catch (error) {
      console.error("스티커 삭제 중 오류:", error);
    }
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

    /**
     * 드래그 종료 시:
     * 너무 많이 벗어난 경우에만 살짝 보정.
     */
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
        <button
          type="button"
          onClick={handleCreate}
          disabled={isLoading}
          className="pointer-events-auto fixed right-5 top-5 z-[1100] flex h-10 w-10 items-center justify-center rounded-full border border-neutral-900 bg-white text-2xl font-bold shadow-lg transition hover:bg-neutral-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          title="스티커 추가"
          aria-label="스티커 추가"
        >
          +
        </button>

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
