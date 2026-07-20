// components/dashboard/Dashboard.tsx

"use client";

import { useCallback, useEffect, useState } from "react";

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

  function addTask(taskDraft: ProcessTaskDraft) {
    const newTask: ProcessTask = {
      id: crypto.randomUUID(),
      title: taskDraft.title,
      memo: taskDraft.memo,
      status: taskDraft.status,
    };

    setTasks((currentTasks) => [...currentTasks, newTask]);
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
  }

  function updateTaskStatus(taskId: string, status: WorkStatus) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status,
            }
          : task,
      ),
    );
  }

  function deleteTask(taskId: string) {
    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== taskId),
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-[1800px] grid-cols-1 gap-3 md:grid-cols-[minmax(320px,1fr)_minmax(0,2fr)]">
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
        onAddTask={addTask}
        onUpdateTaskMemo={updateTaskMemo}
        onUpdateTaskStatus={updateTaskStatus}
        onDeleteTask={deleteTask}
      />
    </div>
  );
}
