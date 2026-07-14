// components/dashboard/Dashboard.tsx

"use client";

import { useState } from "react";

import DailyActionLog from "./DailyActionLog";
import ProcessTaskList from "./ProcessTaskList";
import type {
  DailyActionLogItem,
  ProcessTask,
  ProcessTaskDraft,
  WorkStatus,
} from "./dashboard.types";

export default function Dashboard() {
  const [actionLogs, setActionLogs] = useState<DailyActionLogItem[]>([]);

  const [tasks, setTasks] = useState<ProcessTask[]>([]);

  function addActionLog(actionLog: Omit<DailyActionLogItem, "id">) {
    const newActionLog: DailyActionLogItem = {
      id: crypto.randomUUID(),
      ...actionLog,
    };

    setActionLogs((currentActionLogs) => [newActionLog, ...currentActionLogs]);
  }

  function deleteActionLog(actionLogId: string) {
    setActionLogs((currentActionLogs) =>
      currentActionLogs.filter((actionLog) => actionLog.id !== actionLogId),
    );
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
        actionLogs={actionLogs}
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
