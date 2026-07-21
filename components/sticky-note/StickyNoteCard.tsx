// components/sticky-note/StickyNoteCard.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import StickyNoteBody, { type StickyNoteBodyHandle } from "./StickyNoteBody";
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
  subDaysFromBase,
  clampStickyNotePosition,
  createPostItColor,
  getDockTop,
} from "./sticky-note.utils";

type Position = {
  x: number;
  y: number;
};

const MIN_HEIGHT = 230;
const MAX_HEIGHT = 720;
const MIN_WIDTH = 260;
const MAX_WIDTH = 720;

export default function StickyNoteCard({
  note,
  index,
  viewDate,
  onCollapse,
  onExpand,
  onDeleteRequest,
  onPinChange,
  onPositionChange,
  onWidthChange,
  onHeightChange,
  onSizeChange,
  onExpiresAtChange,
  onContentChange,
}: StickyNoteCardProps) {
  const [viewState, setViewState] = useState<StickyNoteViewState>(
    note.collapsed ? "DOCKED" : "OPEN",
  );

  const [detailsCollapsed, setDetailsCollapsed] = useState(true);
  const [draftContent, setDraftContent] = useState(note.content);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isWidthResizing, setIsWidthResizing] = useState(false);
  const [isDiagonalResizing, setIsDiagonalResizing] = useState(false);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<StickyNoteBodyHandle | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const heightRef = useRef(note.height || MIN_HEIGHT);
  const widthRef = useRef(Math.max(note.width, MIN_WIDTH));

  const defaultTop = getDockTop(index);

  const endOfViewDate = (dateKey: string) => {
    const [year, month, day] = dateKey.split("-").map(Number);

    const date = new Date(year, month - 1, day);
    date.setHours(23, 59, 59, 999);

    return date;
  };

  const getDefaultOpenX = () => {
    if (typeof window === "undefined") {
      return 24;
    }

    return window.innerWidth - note.width - 24;
  };

  const getDockedX = () => {
    if (typeof window === "undefined") {
      return 24;
    }

    return window.innerWidth - 40;
  };

  const getPreviewX = () => {
    if (typeof window === "undefined") {
      return 24;
    }

    return window.innerWidth - 180;
  };

  const getOpenX = () => {
    return note.x ?? getDefaultOpenX();
  };

  const getBaseY = () => {
    return note.y ?? defaultTop;
  };

  const openPositionRef = useRef<Position>({
    x: getOpenX(),
    y: getBaseY(),
  });

  const visualPositionRef = useRef<Position>({
    x: note.collapsed ? getDockedX() : getOpenX(),
    y: getBaseY(),
  });

  const dragStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    startX: number;
    startY: number;
  } | null>(null);

  const resizeStartRef = useRef<{
    mouseY: number;
    startHeight: number;
  } | null>(null);

  const widthResizeStartRef = useRef<{
    mouseX: number;
    startWidth: number;
    startX: number;
  } | null>(null);

  const diagonalResizeStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    startWidth: number;
    startHeight: number;
    startX: number;
    startY: number;
  } | null>(null);

  const postItColor = useMemo(() => createPostItColor(note), [note]);

  const isDocked = viewState === "DOCKED";
  const isPreview = viewState === "PREVIEW";
  const isOpen = viewState === "OPEN" || viewState === "FLOATING";

  const applyPositionToDom = (x: number, y: number) => {
    if (!cardRef.current) {
      return;
    }

    cardRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  const applyHeightToDom = (height: number) => {
    if (!cardRef.current) {
      return;
    }

    cardRef.current.style.height = `${height}px`;
  };

  const applyWidthToDom = (width: number) => {
    if (!cardRef.current) {
      return;
    }

    cardRef.current.style.width = `${width}px`;
  };

  const applyAutoHeightToDom = () => {
    if (!cardRef.current) {
      return;
    }

    cardRef.current.style.height = "auto";
  };

  const getTargetPosition = (state: StickyNoteViewState): Position => {
    const y = openPositionRef.current.y;

    if (state === "DOCKED") {
      return {
        x: getDockedX(),
        y,
      };
    }

    if (state === "PREVIEW") {
      return {
        x: getPreviewX(),
        y,
      };
    }

    return {
      x: openPositionRef.current.x,
      y,
    };
  };

  const moveToState = (nextState: StickyNoteViewState) => {
    const target = getTargetPosition(nextState);

    visualPositionRef.current = target;
    setViewState(nextState);

    window.requestAnimationFrame(() => {
      applyPositionToDom(target.x, target.y);

      if (nextState === "DOCKED" || nextState === "PREVIEW") {
        applyAutoHeightToDom();
        return;
      }

      applyHeightToDom(heightRef.current);
    });
  };

  useEffect(() => {
    let resizeFrame: number | null = null;

    const handleResize = () => {
      if (resizeFrame !== null) {
        window.cancelAnimationFrame(resizeFrame);
      }

      resizeFrame = window.requestAnimationFrame(() => {
        /**
         * 오른쪽에 숨겨진 상태는 브라우저 폭에 따라
         * docked x / preview x를 다시 계산해야 합니다.
         *
         * note.x, note.y는 건드리지 않습니다.
         * note.x, note.y는 다시 펼쳤을 때 돌아갈 위치입니다.
         */
        if (viewState === "DOCKED" || viewState === "PREVIEW") {
          const target = getTargetPosition(viewState);

          visualPositionRef.current = target;
          applyPositionToDom(target.x, target.y);

          return;
        }
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);

      if (resizeFrame !== null) {
        window.cancelAnimationFrame(resizeFrame);
      }
    };
  }, [viewState, note.width]);

  useEffect(() => {
    const nextOpenPosition = {
      x: getOpenX(),
      y: getBaseY(),
    };

    openPositionRef.current = nextOpenPosition;

    const nextVisualPosition = note.collapsed
      ? {
          x: getDockedX(),
          y: nextOpenPosition.y,
        }
      : nextOpenPosition;

    visualPositionRef.current = nextVisualPosition;
    setViewState(note.collapsed ? "DOCKED" : "OPEN");

    window.requestAnimationFrame(() => {
      applyPositionToDom(nextVisualPosition.x, nextVisualPosition.y);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.x, note.y, note.width, note.collapsed]);

  useEffect(() => {
    heightRef.current = note.height || MIN_HEIGHT;

    window.requestAnimationFrame(() => {
      if (note.collapsed) {
        applyAutoHeightToDom();
        return;
      }

      applyHeightToDom(heightRef.current);
    });
  }, [note.height, note.collapsed]);

  useEffect(() => {
    widthRef.current = Math.max(note.width, MIN_WIDTH);

    window.requestAnimationFrame(() => {
      applyWidthToDom(widthRef.current);
    });
  }, [note.width]);

  useEffect(() => {
    setDraftContent(note.content);
  }, [note.content]);

  useEffect(() => {
    if (draftContent === note.content) {
      return;
    }

    const timer = window.setTimeout(() => {
      onContentChange(note.id, draftContent);
    }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [draftContent, note.content, note.id, onContentChange]);

  const handleMouseEnter = () => {
    if (viewState === "DOCKED") {
      moveToState("PREVIEW");
    }
  };

  const handleMouseLeave = () => {
    if (
      note.pinned ||
      isDragging ||
      isResizing ||
      isWidthResizing ||
      isDiagonalResizing
    ) {
      return;
    }

    if (viewState === "PREVIEW") {
      moveToState("DOCKED");
    }
  };

  const handleOpen = () => {
    moveToState("OPEN");
    onExpand(note.id);
  };

  const handleCollapse = () => {
    moveToState("DOCKED");
    onCollapse(note.id);
  };

  const handleDetailsToggle = () => {
    setDetailsCollapsed((previous) => !previous);
  };

  const handleToday = () => {
    onExpiresAtChange(note.id, endOfViewDate(viewDate).toISOString());
  };

  const handleSubOneDay = () => {
    const nextDate = subDaysFromBase(note.expiresAt, 1, viewDate);

    const startDate = new Date(note.startDate);
    startDate.setHours(23, 59, 59, 999);

    if (nextDate.getTime() < startDate.getTime()) {
      return;
    }

    onExpiresAtChange(note.id, nextDate.toISOString());
  };

  const handleAddOneDay = () => {
    onExpiresAtChange(
      note.id,
      addDaysFromBase(note.expiresAt, 1, viewDate).toISOString(),
    );
  };

  const handleAddOneWeek = () => {
    onExpiresAtChange(
      note.id,
      addDaysFromBase(note.expiresAt, 7, viewDate).toISOString(),
    );
  };

  const handleDragStart = (event: React.MouseEvent<HTMLDivElement>) => {
    if (viewState === "DOCKED" || viewState === "PREVIEW") {
      return;
    }

    const target = event.target as HTMLElement;

    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest("textarea") ||
      target.closest("select") ||
      target.closest("[data-resize-handle='true']")
    ) {
      return;
    }

    event.preventDefault();

    dragStartRef.current = {
      mouseX: event.clientX,
      mouseY: event.clientY,
      startX: openPositionRef.current.x,
      startY: openPositionRef.current.y,
    };

    setIsDragging(true);
    setViewState("FLOATING");
  };

  const handleResizeStart = (event: React.MouseEvent<HTMLDivElement>) => {
    if (viewState === "DOCKED" || viewState === "PREVIEW") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    resizeStartRef.current = {
      mouseY: event.clientY,
      startHeight: heightRef.current,
    };

    setIsResizing(true);
  };

  const handleWidthResizeStart = (event: React.MouseEvent<HTMLDivElement>) => {
    if (viewState === "DOCKED" || viewState === "PREVIEW") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    widthResizeStartRef.current = {
      mouseX: event.clientX,
      startWidth: widthRef.current,
      startX: openPositionRef.current.x,
    };

    setIsWidthResizing(true);
  };

  const handleDiagonalResizeStart = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (viewState === "DOCKED" || viewState === "PREVIEW") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    diagonalResizeStartRef.current = {
      mouseX: event.clientX,
      mouseY: event.clientY,
      startWidth: widthRef.current,
      startHeight: heightRef.current,
      startX: openPositionRef.current.x,
      startY: openPositionRef.current.y,
    };

    setIsDiagonalResizing(true);
  };

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handleMove = (event: MouseEvent) => {
      if (!dragStartRef.current) {
        return;
      }

      const rawX =
        dragStartRef.current.startX +
        (event.clientX - dragStartRef.current.mouseX);

      const rawY =
        dragStartRef.current.startY +
        (event.clientY - dragStartRef.current.mouseY);

      const nextPosition = clampStickyNotePosition(
        Math.round(rawX),
        Math.round(rawY),
        note.width,
        heightRef.current,
        window.innerWidth,
        window.innerHeight,
      );

      openPositionRef.current = nextPosition;
      visualPositionRef.current = nextPosition;

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = window.requestAnimationFrame(() => {
        applyPositionToDom(nextPosition.x, nextPosition.y);
      });
    };

    const handleUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      const finalPosition = openPositionRef.current;

      applyPositionToDom(finalPosition.x, finalPosition.y);
      setViewState("OPEN");

      onPositionChange(note.id, finalPosition.x, finalPosition.y);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDragging, note.id, note.width, onPositionChange]);

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    const handleMove = (event: MouseEvent) => {
      if (!resizeStartRef.current) {
        return;
      }

      const diff = event.clientY - resizeStartRef.current.mouseY;

      const nextHeight = Math.min(
        Math.max(resizeStartRef.current.startHeight + diff, MIN_HEIGHT),
        MAX_HEIGHT,
      );

      heightRef.current = Math.round(nextHeight);

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = window.requestAnimationFrame(() => {
        applyHeightToDom(heightRef.current);
      });
    };

    const handleUp = () => {
      setIsResizing(false);
      resizeStartRef.current = null;

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      onHeightChange(note.id, heightRef.current);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isResizing, note.id, onHeightChange]);

  useEffect(() => {
    if (!isWidthResizing) {
      return;
    }

    const handleMove = (event: MouseEvent) => {
      if (!widthResizeStartRef.current) {
        return;
      }

      const diff = event.clientX - widthResizeStartRef.current.mouseX;

      const nextWidth = Math.round(
        Math.min(
          Math.max(widthResizeStartRef.current.startWidth + diff, MIN_WIDTH),
          MAX_WIDTH,
        ),
      );

      const rawX = widthResizeStartRef.current.startX;

      const nextPosition = clampStickyNotePosition(
        Math.round(rawX),
        openPositionRef.current.y,
        nextWidth,
        heightRef.current,
        window.innerWidth,
        window.innerHeight,
      );

      widthRef.current = nextWidth;
      openPositionRef.current = nextPosition;
      visualPositionRef.current = nextPosition;

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = window.requestAnimationFrame(() => {
        applyWidthToDom(nextWidth);
        applyPositionToDom(nextPosition.x, nextPosition.y);
      });
    };

    const handleUp = () => {
      setIsWidthResizing(false);
      widthResizeStartRef.current = null;

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      const finalPosition = openPositionRef.current;

      applyWidthToDom(widthRef.current);
      applyPositionToDom(finalPosition.x, finalPosition.y);

      onWidthChange(
        note.id,
        widthRef.current,
        finalPosition.x,
        finalPosition.y,
      );
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isWidthResizing, note.id, onWidthChange]);

  useEffect(() => {
    if (!isDiagonalResizing) {
      return;
    }

    const handleMove = (event: MouseEvent) => {
      if (!diagonalResizeStartRef.current) {
        return;
      }

      const diffX = event.clientX - diagonalResizeStartRef.current.mouseX;
      const diffY = event.clientY - diagonalResizeStartRef.current.mouseY;

      const nextWidth = Math.round(
        Math.min(
          Math.max(
            diagonalResizeStartRef.current.startWidth + diffX,
            MIN_WIDTH,
          ),
          MAX_WIDTH,
        ),
      );

      const nextHeight = Math.round(
        Math.min(
          Math.max(
            diagonalResizeStartRef.current.startHeight + diffY,
            MIN_HEIGHT,
          ),
          MAX_HEIGHT,
        ),
      );

      const nextPosition = clampStickyNotePosition(
        diagonalResizeStartRef.current.startX,
        diagonalResizeStartRef.current.startY,
        nextWidth,
        nextHeight,
        window.innerWidth,
        window.innerHeight,
      );

      widthRef.current = nextWidth;
      heightRef.current = nextHeight;
      openPositionRef.current = nextPosition;
      visualPositionRef.current = nextPosition;

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = window.requestAnimationFrame(() => {
        applyWidthToDom(nextWidth);
        applyHeightToDom(nextHeight);
        applyPositionToDom(nextPosition.x, nextPosition.y);
      });
    };

    const handleUp = () => {
      setIsDiagonalResizing(false);
      diagonalResizeStartRef.current = null;

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      const finalPosition = openPositionRef.current;

      applyWidthToDom(widthRef.current);
      applyHeightToDom(heightRef.current);
      applyPositionToDom(finalPosition.x, finalPosition.y);

      onSizeChange(
        note.id,
        widthRef.current,
        heightRef.current,
        finalPosition.x,
        finalPosition.y,
      );
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDiagonalResizing, note.id, onSizeChange]);

  const initialPosition = visualPositionRef.current;

  return (
    <div
      ref={cardRef}
      className={
        isDragging || isResizing || isWidthResizing || isDiagonalResizing
          ? "fixed left-0 top-0 z-[1000] select-none will-change-transform"
          : "fixed left-0 top-0 z-[1000] transition-transform duration-200 ease-out will-change-transform"
      }
      style={{
        width: note.width,
        height: isOpen ? heightRef.current : "auto",
        pointerEvents: "auto",
        transform: `translate3d(${initialPosition.x}px, ${initialPosition.y}px, 0)`,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isOpen && (
        <div
          data-resize-handle="true"
          onMouseDown={handleWidthResizeStart}
          className="group absolute -right-1 top-8 bottom-2 z-10 w-2 cursor-ew-resize"
          title="좌우 크기 조절"
          aria-label="좌우 크기 조절"
        >
          <span className="absolute bottom-2 left-1/2 top-2 w-px -translate-x-1/2 rounded-full bg-neutral-500/0 transition-colors group-hover:bg-neutral-500/45" />
        </div>
      )}

      {isOpen && (
        <div
          data-resize-handle="true"
          onMouseDown={handleResizeStart}
          className="absolute -bottom-1 left-2 right-2 z-10 h-2 cursor-ns-resize"
          title="위아래 크기 조절"
          aria-label="위아래 크기 조절"
        />
      )}

      {isOpen && (
        <div
          data-resize-handle="true"
          onMouseDown={handleDiagonalResizeStart}
          className="absolute -bottom-1 -right-1 z-20 size-3 cursor-nwse-resize"
          title="대각선 크기 조절"
          aria-label="대각선 크기 조절"
        />
      )}

      <div
        className="flex h-full flex-col overflow-hidden border border-neutral-900 shadow-lg"
        style={{
          backgroundColor: postItColor,
        }}
      >
        <div
          onMouseDown={handleDragStart}
          className={isOpen ? "shrink-0 cursor-move" : "shrink-0"}
          style={{
            backgroundColor: postItColor,
          }}
        >
          <StickyNoteHeader
            content={draftContent}
            postItColor={postItColor}
            isDocked={isDocked}
            isPreview={isPreview}
            onCollapse={handleCollapse}
            onDeleteRequest={() => onDeleteRequest(note.id)}
            onOpen={handleOpen}
          />
        </div>

        {isOpen && (
          <>
            <div
              className="min-h-0 flex-1"
              style={{
                backgroundColor: postItColor,
              }}
            >
              <StickyNoteBody
                ref={bodyRef}
                content={draftContent}
                onContentChange={setDraftContent}
              />
            </div>

            <StickyNoteCollapseBar
              collapsed={detailsCollapsed}
              onToggle={handleDetailsToggle}
            />

            {!detailsCollapsed && (
              <div className="shrink-0 bg-white">
                <StickyNoteDateRange
                  startDate={note.startDate}
                  expiresAt={note.expiresAt}
                  pinned={note.pinned}
                  onPinChange={(pinned) => onPinChange(note.id, pinned)}
                />

                <StickyNoteQuickDateButtons
                  onToday={handleToday}
                  onSubOneDay={handleSubOneDay}
                  onAddOneDay={handleAddOneDay}
                  onAddOneWeek={handleAddOneWeek}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
