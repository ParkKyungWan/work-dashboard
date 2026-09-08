// components/dashboard/Dashboard.tsx

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { StickyNote } from "@/components/sticky-note/sticky-note.types";
import { useWorkspaceDate } from "@/components/workspace/WorkspaceDateProvider";

import DailyActionLog from "./DailyActionLog";
import ProcessTaskList from "./ProcessTaskList";
import type {
  ProcessTask,
  ProcessTaskDraft,
  WorkStatus,
} from "./dashboard.types";

export default function Dashboard() {
  const { viewDate, setViewDate } = useWorkspaceDate();

  const [tasks, setTasks] = useState<ProcessTask[]>([]);
  const [allTasks, setAllTasks] = useState<ProcessTask[]>([]);
  const [allNotes, setAllNotes] = useState<StickyNote[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightTaskId, setHighlightTaskId] = useState<string | null>(null);
  const [isTasksLoading, setIsTasksLoading] = useState(true);
  const [isTaskSaving, setIsTaskSaving] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const memoSaveTimers = useRef(new Map<string, number>());

  const fetchTasks = useCallback(
    async (signal?: AbortSignal) => {
      setIsTasksLoading(true);
      setTaskError(null);

      try {
        const response = await fetch(
          `/api/process-tasks/by-date?date=${encodeURIComponent(viewDate)}`,
          { cache: "no-store", signal },
        );

        if (!response.ok) {
          throw new Error("진행 업무를 불러오지 못했습니다.");
        }

        const data = (await response.json()) as ProcessTask[];
        setTasks(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("진행 업무 조회 실패:", error);
        setTasks([]);
        setTaskError("진행 업무를 불러오지 못했습니다.");
      } finally {
        if (!signal?.aborted) {
          setIsTasksLoading(false);
        }
      }
    },
    [viewDate],
  );

  const fetchAllTasks = useCallback(async () => {
    try {
      const response = await fetch("/api/process-tasks", { cache: "no-store" });

      if (!response.ok) {
        throw new Error("전체 업무 검색을 불러오지 못했습니다.");
      }

      const data = (await response.json()) as ProcessTask[];
      setAllTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("전체 업무 검색 조회 실패:", error);
      setAllTasks([]);
    }
  }, []);

  const fetchAllNotes = useCallback(async () => {
    try {
      const response = await fetch("/api/sticky-notes", { cache: "no-store" });

      if (!response.ok) {
        throw new Error("전체 스티커 검색을 불러오지 못했습니다.");
      }

      const data = (await response.json()) as StickyNote[];
      setAllNotes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("전체 스티커 검색 조회 실패:", error);
      setAllNotes([]);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const requestTimer = window.setTimeout(() => {
      void fetchTasks(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(requestTimer);
      controller.abort();
    };
  }, [fetchTasks]);

  useEffect(() => {
    void fetchAllTasks();
    void fetchAllNotes();
  }, [fetchAllNotes, fetchAllTasks]);

  useEffect(() => {
    const timers = memoSaveTimers.current;

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  async function addTask(taskDraft: ProcessTaskDraft) {
    setIsTaskSaving(true);
    setTaskError(null);

    try {
      const response = await fetch("/api/process-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...taskDraft, createdDate: viewDate }),
      });

      if (!response.ok) {
        throw new Error("진행 업무를 추가하지 못했습니다.");
      }

      const createdTask = (await response.json()) as ProcessTask;
      setTasks((currentTasks) => [...currentTasks, createdTask]);

      return true;
    } catch (error) {
      console.error("진행 업무 추가 실패:", error);
      setTaskError("진행 업무를 추가하지 못했습니다.");

      return false;
    } finally {
      setIsTaskSaving(false);
    }
  }

  function updateTaskMemo(taskId: string, memo: string) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              memo,
            }
          : task,
      ),
    );

    const existingTimer = memoSaveTimers.current.get(taskId);

    if (existingTimer !== undefined) {
      window.clearTimeout(existingTimer);
    }

    const saveTimer = window.setTimeout(async () => {
      memoSaveTimers.current.delete(taskId);

      try {
        const response = await fetch(`/api/process-tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memo }),
        });

        if (!response.ok) {
          throw new Error("업무 메모를 저장하지 못했습니다.");
        }
      } catch (error) {
        console.error("업무 메모 저장 실패:", error);
        setTaskError("업무 메모를 저장하지 못했습니다.");
      }
    }, 600);

    memoSaveTimers.current.set(taskId, saveTimer);
  }

  async function updateTaskStatus(taskId: string, status: WorkStatus) {
    setTaskError(null);

    try {
      const response = await fetch(`/api/process-tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, viewDate }),
      });

      if (!response.ok) {
        throw new Error("업무 상태를 변경하지 못했습니다.");
      }

      const updatedTask = (await response.json()) as ProcessTask;
      setTasks((currentTasks) =>
        currentTasks.map((task) => (task.id === taskId ? updatedTask : task)),
      );
    } catch (error) {
      console.error("업무 상태 변경 실패:", error);
      setTaskError("업무 상태를 변경하지 못했습니다.");
    }
  }

  async function deleteTask(taskId: string) {
    setTaskError(null);

    try {
      const response = await fetch(`/api/process-tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("진행 업무를 삭제하지 못했습니다.");
      }

      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskId),
      );
    } catch (error) {
      console.error("진행 업무 삭제 실패:", error);
      setTaskError("진행 업무를 삭제하지 못했습니다.");
    }
  }

  function handleSearchQueryChange(nextQuery: string) {
    setSearchQuery(nextQuery);

    if (!nextQuery.trim()) {
      setHighlightTaskId(null);
      window.dispatchEvent(
        new CustomEvent("local-work-dashboard:clear-search-highlights"),
      );
    }
  }

  function handleOpenTaskFromSearch(task: ProcessTask) {
    setViewDate(task.createdDate);
    setHighlightTaskId(task.id);
    window.dispatchEvent(
      new CustomEvent("local-work-dashboard:jump-task", {
        detail: { taskId: task.id },
      }),
    );
  }

  function handleOpenNoteFromSearch(note: StickyNote) {
    const dateKey = new Date(note.startDate);
    const nextDateKey = `${dateKey.getFullYear()}-${String(
      dateKey.getMonth() + 1,
    ).padStart(2, "0")}-${String(dateKey.getDate()).padStart(2, "0")}`;

    setViewDate(nextDateKey);
    setHighlightTaskId(null);
    window.dispatchEvent(
      new CustomEvent("local-work-dashboard:jump-note", {
        detail: {
          noteId: note.id,
          dateKey: nextDateKey,
          query: searchQuery,
        },
      }),
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-[1800px] grid-cols-1 gap-3 items-start md:grid-cols-[minmax(320px,1fr)_minmax(0,2fr)]">
      <DailyActionLog
        viewDate={viewDate}
        tasks={allTasks}
        notes={allNotes}
        searchQuery={searchQuery}
        onSearchQueryChange={handleSearchQueryChange}
        onOpenTaskResult={handleOpenTaskFromSearch}
        onOpenNoteResult={handleOpenNoteFromSearch}
      />

      <ProcessTaskList
        tasks={tasks}
        isLoading={isTasksLoading}
        isSaving={isTaskSaving}
        errorMessage={taskError}
        highlightTaskId={highlightTaskId}
        onAddTask={addTask}
        onUpdateTaskMemo={updateTaskMemo}
        onUpdateTaskStatus={updateTaskStatus}
        onDeleteTask={deleteTask}
      />
    </div>
  );
}
