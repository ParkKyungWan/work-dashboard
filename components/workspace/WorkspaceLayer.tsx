// components/workspace/WorkspaceLayer.tsx

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import { AppDayPicker } from "@/components/day-picker";
import type {
  Holiday,
  HolidayApiResponse,
} from "@/components/day-picker/day-picker.types";
import {
  createLocalDateFromKey,
  toLocalDateKey,
} from "@/components/day-picker/day-picker.utils";
import StickyNoteCard from "@/components/sticky-note/StickyNoteCard";
import type { StickyNote } from "@/components/sticky-note/sticky-note.types";
import { findNewStickyNotePosition } from "@/components/sticky-note/sticky-note.utils";

import type {
  ExternalSchedule,
  LeaveDay,
  WorkspaceLayerProps,
  WorkspaceScheduleItem,
} from "./workspace.types";
import {
  formatWorkspaceDateLabel,
  formatWorkspaceMenuDateLabel,
  getEndOfPreviousDayISOString,
  getWorkspaceDateInfo,
  isDateIncludedInNotePeriod,
  isSameLocalDay,
} from "./workspace.utils";

const DEFAULT_STICKY_NOTE_WIDTH = 320;
const DEFAULT_STICKY_NOTE_HEIGHT = 360;

const VIEWPORT_PADDING = 16;
const TOP_SAFE_AREA = 72;

const MIN_VISIBLE_RATIO = 0.15;
const PAYDAY_DAY = 25;

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

const getResponseMessage = async (
  response: Response,
  fallbackMessage: string,
) => {
  const data = (await response.json().catch(() => null)) as {
    message?: string;
  } | null;

  return data?.message ?? fallbackMessage;
};

export default function WorkspaceLayer({
  scope = "work-log",
}: WorkspaceLayerProps) {
  const [viewDate, setViewDate] = useState(() => toLocalDateKey(new Date()));

  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [leaveDays, setLeaveDays] = useState<LeaveDay[]>([]);
  const [externalSchedules, setExternalSchedules] = useState<
    ExternalSchedule[]
  >([]);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const selectedYear = useMemo(() => {
    return createLocalDateFromKey(viewDate).getFullYear();
  }, [viewDate]);

  const workspaceDateLabel = useMemo(() => {
    return formatWorkspaceDateLabel(viewDate);
  }, [viewDate]);

  const selectedDateInfo = useMemo(() => {
    return getWorkspaceDateInfo({
      dateKey: viewDate,
      holidays,
      paydayDay: PAYDAY_DAY,
    });
  }, [holidays, viewDate]);

  const selectedDateScheduleItems = useMemo<WorkspaceScheduleItem[]>(() => {
    const items: WorkspaceScheduleItem[] = [];

    if (selectedDateInfo.holidayName) {
      items.push({
        id: `holiday-${viewDate}`,
        type: "HOLIDAY",
        label: selectedDateInfo.holidayName,
        className: "text-red-600",
      });
    }

    if (selectedDateInfo.isPayday) {
      items.push({
        id: `payday-${viewDate}`,
        type: "PAYDAY",
        label: "월급날",
        className: "text-rose-600",
      });
    }

    leaveDays
      .filter((leaveDay) => leaveDay.date === viewDate)
      .forEach((leaveDay) => {
        if (leaveDay.type === "ANNUAL_LEAVE") {
          const leaveTitle = leaveDay.label.trim();

          items.push({
            id: `leave-${leaveDay.id}`,
            type: leaveDay.type,
            label: leaveTitle ? `연차 - ${leaveTitle}` : "연차",
            className: "text-orange-700",
          });

          return;
        }

        if (leaveDay.type === "HALF_DAY_AM") {
          items.push({
            id: `leave-${leaveDay.id}`,
            type: leaveDay.type,
            label: "오전 반차",
            className: "text-yellow-700",
          });

          return;
        }

        if (leaveDay.type === "HALF_DAY_PM") {
          items.push({
            id: `leave-${leaveDay.id}`,
            type: leaveDay.type,
            label: "오후 반차",
            className: "text-yellow-700",
          });

          return;
        }

        items.push({
          id: `leave-${leaveDay.id}`,
          type: leaveDay.type,
          label: leaveDay.label.trim() || "특별휴가",
          className: "text-orange-700",
        });
      });

    externalSchedules
      .filter((schedule) => schedule.date === viewDate)
      .forEach((schedule) => {
        items.push({
          id: `external-${schedule.id}`,
          type: "EXTERNAL_SCHEDULE",
          label: schedule.title.trim() || "외부 일정",
          className: "text-emerald-700",
        });
      });

    if (selectedDateInfo.isWeekend) {
      items.push({
        id: `weekend-${viewDate}`,
        type: "WEEKEND",
        label: "주말",
        className: "text-red-500",
      });
    }

    return items;
  }, [externalSchedules, leaveDays, selectedDateInfo, viewDate]);

  const normalScheduleItems = useMemo(() => {
    return selectedDateScheduleItems.filter((item) => item.type !== "WEEKEND");
  }, [selectedDateScheduleItems]);

  const weekendScheduleItem = useMemo(() => {
    return (
      selectedDateScheduleItems.find((item) => item.type === "WEEKEND") ?? null
    );
  }, [selectedDateScheduleItems]);

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
          const message = await getResponseMessage(
            response,
            "스티커 수정에 실패했습니다.",
          );

          console.error(message);

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
        const message = await getResponseMessage(
          response,
          "스티커 삭제에 실패했습니다.",
        );

        console.error(message);

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
      const response = await fetch(
        `/api/sticky-notes/by-date?date=${encodeURIComponent(viewDate)}`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        const message = await getResponseMessage(
          response,
          "스티커 조회에 실패했습니다.",
        );

        console.error(message);

        return;
      }

      const data = (await response.json()) as StickyNote[];

      if (!Array.isArray(data)) {
        setNotes([]);

        return;
      }

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
  }, [viewDate]);

  const fetchWorkspaceSchedules = useCallback(async () => {
    setIsScheduleLoading(true);

    try {
      const [holidayResponse, leaveResponse, externalScheduleResponse] =
        await Promise.all([
          fetch(`/api/day-picker/holidays?year=${selectedYear}`, {
            cache: "no-store",
          }),

          fetch(`/api/day-picker/leave?year=${selectedYear}`, {
            cache: "no-store",
          }),

          fetch(`/api/day-picker/external-schedules?year=${selectedYear}`, {
            cache: "no-store",
          }),
        ]);

      if (!holidayResponse.ok) {
        const message = await getResponseMessage(
          holidayResponse,
          "공휴일 정보를 불러오지 못했습니다.",
        );

        throw new Error(message);
      }

      if (!leaveResponse.ok) {
        const message = await getResponseMessage(
          leaveResponse,
          "연차 정보를 불러오지 못했습니다.",
        );

        throw new Error(message);
      }

      if (!externalScheduleResponse.ok) {
        const message = await getResponseMessage(
          externalScheduleResponse,
          "외부 일정 정보를 불러오지 못했습니다.",
        );

        throw new Error(message);
      }

      const [holidayData, loadedLeaveDays, loadedExternalSchedules] =
        (await Promise.all([
          holidayResponse.json(),
          leaveResponse.json(),
          externalScheduleResponse.json(),
        ])) as [HolidayApiResponse, LeaveDay[], ExternalSchedule[]];

      setHolidays(
        Array.isArray(holidayData.holidays) ? holidayData.holidays : [],
      );

      setLeaveDays(Array.isArray(loadedLeaveDays) ? loadedLeaveDays : []);

      setExternalSchedules(
        Array.isArray(loadedExternalSchedules) ? loadedExternalSchedules : [],
      );
    } catch (error) {
      console.error("작업공간 일정 조회 실패:", error);

      setHolidays([]);
      setLeaveDays([]);
      setExternalSchedules([]);
    } finally {
      setIsScheduleLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    void fetchActiveNotes();
  }, [fetchActiveNotes]);

  useEffect(() => {
    void fetchWorkspaceSchedules();
  }, [fetchWorkspaceSchedules]);

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
    if (!isMenuOpen && !isDatePickerOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;

      if (target?.closest("[data-workspace-controls='true']")) {
        return;
      }

      setIsMenuOpen(false);
      setIsDatePickerOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isDatePickerOpen, isMenuOpen]);

  const updateLocalNote = useCallback((updatedNote: StickyNote) => {
    setNotes((previousNotes) =>
      previousNotes.map((note) =>
        note.id === updatedNote.id ? updatedNote : note,
      ),
    );
  }, []);

  const handleViewDateChange = (nextDate: string) => {
    if (!nextDate) {
      return;
    }

    setViewDate(nextDate);
    setIsDatePickerOpen(false);
  };

  const handleMoveToToday = () => {
    setViewDate(toLocalDateKey(new Date()));
    setIsDatePickerOpen(false);
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
          startDate: viewDate,
        }),
      });

      if (!response.ok) {
        const message = await getResponseMessage(
          response,
          "스티커 생성에 실패했습니다.",
        );

        console.error(message);

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
    const baseDate = createLocalDateFromKey(viewDate);
    const endOfPreviousDay = getEndOfPreviousDayISOString(baseDate);

    const hiddenNotes = notes.filter((note) => note.collapsed);

    if (hiddenNotes.length === 0) {
      setIsMenuOpen(false);

      return;
    }

    const notesToDelete = hiddenNotes.filter((note) =>
      isSameLocalDay(note.startDate, baseDate),
    );

    const notesToExpire = hiddenNotes.filter((note) => {
      const startsOnViewDate = isSameLocalDay(note.startDate, baseDate);

      return !startsOnViewDate && isDateIncludedInNotePeriod(note, baseDate);
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
          expiresAt: endOfPreviousDay,
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

    const baseDate = createLocalDateFromKey(viewDate);
    baseDate.setHours(0, 0, 0, 0);

    const isExpiredForViewDate =
      Boolean(updatedNote.expiresAt) &&
      new Date(updatedNote.expiresAt as string).getTime() < baseDate.getTime();

    if (isExpiredForViewDate) {
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
        <div className="fixed left-6 top-5 z-[1100] flex h-10 w-max items-center gap-3 overflow-visible whitespace-nowrap">
          <h1 className="shrink-0 text-lg font-bold tracking-tight text-neutral-900">
            {workspaceDateLabel}
          </h1>

          {isScheduleLoading ? (
            <span className="shrink-0 text-sm font-medium text-neutral-400">
              일정 확인 중
            </span>
          ) : selectedDateScheduleItems.length === 0 ? (
            <span className="shrink-0 text-sm font-medium text-neutral-400">
              일정 없음
            </span>
          ) : (
            <div className="flex w-max shrink-0 items-center gap-3 overflow-visible whitespace-nowrap">
              {normalScheduleItems.map((item) => (
                <span
                  key={item.id}
                  className={`shrink-0 whitespace-nowrap text-sm font-semibold ${item.className}`}
                >
                  {item.label}
                </span>
              ))}

              {weekendScheduleItem && (
                <span
                  className={`shrink-0 whitespace-nowrap text-sm font-semibold ${weekendScheduleItem.className}`}
                >
                  {weekendScheduleItem.label}
                </span>
              )}
            </div>
          )}
        </div>

        <div
          data-workspace-controls="true"
          className="pointer-events-auto fixed right-5 top-5 z-[1100] flex items-start gap-2"
        >
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsDatePickerOpen((previous) => !previous);
                setIsMenuOpen(false);
              }}
              disabled={isLoading}
              className="flex h-10 items-center justify-center gap-2 rounded-full cursor-pointer bg-white px-3 text-xs font-semibold text-neutral-900 shadow-lg transition hover:bg-neutral-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              title="조회 날짜 선택"
              aria-label="조회 날짜 선택"
              aria-expanded={isDatePickerOpen}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="5" width="18" height="16" rx="2" />

                <path d="M16 3v4M8 3v4M3 10h18" />
              </svg>

              <span>{formatWorkspaceMenuDateLabel(viewDate)}</span>
            </button>

            {isDatePickerOpen && (
              <div className="absolute right-0 top-12 w-56 rounded-md card-shadow bg-white p-2 text-xs shadow-xl">
                <div className="overflow-hidden">
                  <AppDayPicker
                    value={viewDate}
                    onChange={handleViewDateChange}
                    holidays={holidays}
                    paydayDay={PAYDAY_DAY}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleMoveToToday}
                  className="mt-2 block w-full rounded border border-neutral-300 px-3 py-2 text-center font-medium text-neutral-900 transition hover:bg-neutral-100"
                >
                  오늘로 이동
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen((previous) => !previous);
                setIsDatePickerOpen(false);
              }}
              disabled={isLoading}
              className="flex h-10 w-10 items-center justify-center rounded-full cursor-pointer bg-white text-2xl font-bold shadow-lg transition hover:bg-neutral-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              title="작업 공간 메뉴"
              aria-label="작업 공간 메뉴"
              aria-expanded={isMenuOpen}
            >
              +
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-12 w-48 overflow-hidden rounded-md card-shadow bg-white text-xs shadow-xl">
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
        </div>

        {notes.map((note, index) => (
          <StickyNoteCard
            key={note.id}
            note={note}
            index={index}
            viewDate={viewDate}
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
