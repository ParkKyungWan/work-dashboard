// components/dashboard/Dashboard.tsx

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useWorkspaceDate } from "@/components/workspace/WorkspaceDateProvider";

import DailyActionLog from "./DailyActionLog";
import ProcessTaskList from "./ProcessTaskList";
import type {
  DailyActionLogItem,
  DailyActionLogDraft,
  ProcessTask,
  ProcessTaskDraft,
  WorkStatus,
} from "./dashboard.types";

export default function Dashboard() {
  const { viewDate } = useWorkspaceDate();
  const [actionLogs, setActionLogs] = useState<DailyActionLogItem[]>([]);
  const [isActionLogsLoading, setIsActionLogsLoading] = useState(true);
  const [isActionLogSaving, setIsActionLogSaving] = useState(false);
  const [actionLogError, setActionLogError] = useState<string | null>(null);

  const [tasks, setTasks] = useState<ProcessTask[]>([]);
  const [isTasksLoading, setIsTasksLoading] = useState(true);
  const [isTaskSaving, setIsTaskSaving] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const memoSaveTimers = useRef(new Map<string, number>());

  const fetchActionLogs = useCallback(
    async (signal?: AbortSignal) => {
      setIsActionLogsLoading(true);
      setActionLogError(null);

      try {
        const response = await fetch(
          `/api/daily-action-logs/by-date?date=${encodeURIComponent(viewDate)}`,
          {
            cache: "no-store",
            signal,
          },
        );

        if (!response.ok) {
          throw new Error("조치 일지를 불러오지 못했습니다.");
        }

        const data = (await response.json()) as DailyActionLogItem[];
        setActionLogs(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("조치 일지 조회 실패:", error);
        setActionLogs([]);
        setActionLogError("조치 일지를 불러오지 못했습니다.");
      } finally {
        if (!signal?.aborted) {
          setIsActionLogsLoading(false);
        }
      }
    },
    [viewDate],
  );

  useEffect(() => {
    const controller = new AbortController();

    const requestTimer = window.setTimeout(() => {
      void fetchActionLogs(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(requestTimer);
      controller.abort();
    };
  }, [fetchActionLogs]);

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
    const timers = memoSaveTimers.current;

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  async function addActionLog(actionLog: DailyActionLogDraft) {
    setIsActionLogSaving(true);
    setActionLogError(null);

    try {
      const response = await fetch("/api/daily-action-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: viewDate,
          ...actionLog,
        }),
      });

      if (!response.ok) {
        throw new Error("조치 기록을 저장하지 못했습니다.");
      }

      const createdLog = (await response.json()) as DailyActionLogItem;
      setActionLogs((currentActionLogs) =>
        [createdLog, ...currentActionLogs].sort((first, second) =>
          second.time.localeCompare(first.time),
        ),
      );

      return true;
    } catch (error) {
      console.error("조치 기록 저장 실패:", error);
      setActionLogError("조치 기록을 저장하지 못했습니다.");

      return false;
    } finally {
      setIsActionLogSaving(false);
    }
  }

  async function deleteActionLog(actionLogId: string) {
    setActionLogError(null);

    try {
      const response = await fetch(`/api/daily-action-logs/${actionLogId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("조치 기록을 삭제하지 못했습니다.");
      }

      setActionLogs((currentActionLogs) =>
        currentActionLogs.filter((actionLog) => actionLog.id !== actionLogId),
      );
    } catch (error) {
      console.error("조치 기록 삭제 실패:", error);
      setActionLogError("조치 기록을 삭제하지 못했습니다.");
    }
  }

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

  return (
    <div className="mx-auto grid w-full max-w-[1800px] grid-cols-1 gap-3 items-start md:grid-cols-[minmax(320px,1fr)_minmax(0,2fr)]">
      <DailyActionLog
        viewDate={viewDate}
        actionLogs={actionLogs}
        isLoading={isActionLogsLoading}
        isSaving={isActionLogSaving}
        errorMessage={actionLogError}
        onAddActionLog={addActionLog}
        onDeleteActionLog={deleteActionLog}
      />

      <ProcessTaskList
        tasks={tasks}
        isLoading={isTasksLoading}
        isSaving={isTaskSaving}
        errorMessage={taskError}
        onAddTask={addTask}
        onUpdateTaskMemo={updateTaskMemo}
        onUpdateTaskStatus={updateTaskStatus}
        onDeleteTask={deleteTask}
      />
    </div>
  );
}
