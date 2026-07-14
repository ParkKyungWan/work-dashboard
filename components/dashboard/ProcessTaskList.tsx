// components/dashboard/ProcessTaskList.tsx

"use client";

import { useMemo, useState } from "react";

import ProcessTaskCard from "./ProcessTaskCard";
import ProcessTaskModal from "./ProcessTaskModal";
import type {
  ProcessTask,
  ProcessTaskDraft,
  WorkStatus,
} from "./dashboard.types";

type ProcessTaskListProps = {
  tasks: ProcessTask[];
  onAddTask: (taskDraft: ProcessTaskDraft) => void;
  onUpdateTaskMemo: (taskId: string, memo: string) => void;
  onUpdateTaskStatus: (taskId: string, status: WorkStatus) => void;
  onDeleteTask: (taskId: string) => void;
};

export default function ProcessTaskList({
  tasks,
  onAddTask,
  onUpdateTaskMemo,
  onUpdateTaskStatus,
  onDeleteTask,
}: ProcessTaskListProps) {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const taskCountText = useMemo(() => {
    if (tasks.length === 0) {
      return "등록된 업무 없음";
    }

    return `${tasks.length}개의 업무`;
  }, [tasks.length]);

  function toggleTask(taskId: string) {
    setExpandedTaskId((currentTaskId) =>
      currentTaskId === taskId ? null : taskId,
    );
  }

  function deleteTask(taskId: string) {
    onDeleteTask(taskId);

    setExpandedTaskId((currentTaskId) =>
      currentTaskId === taskId ? null : currentTaskId,
    );
  }

  function addTask(taskDraft: ProcessTaskDraft) {
    onAddTask(taskDraft);
    setIsTaskModalOpen(false);
  }

  return (
    <>
      <section className="min-h-[620px] min-w-0 rounded-2xl bg-white p-4 shadow-[0_5px_20px_rgba(15,23,42,0.04)]">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-bold tracking-[-0.02em] text-slate-800">
              진행 업무
            </h2>

            <p className="mt-0.5 text-[11px] text-slate-400">{taskCountText}</p>
          </div>

          <button
            type="button"
            onClick={() => setIsTaskModalOpen(true)}
            className="h-8 rounded-lg border border-blue-200 bg-white px-3 text-[11px] font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-50"
          >
            + 업무 추가
          </button>
        </header>

        {tasks.length > 0 ? (
          <div className="space-y-2">
            {tasks.map((task) => (
              <ProcessTaskCard
                key={task.id}
                task={task}
                isExpanded={expandedTaskId === task.id}
                onToggle={() => toggleTask(task.id)}
                onUpdateMemo={(memo) => onUpdateTaskMemo(task.id, memo)}
                onUpdateStatus={(status) => onUpdateTaskStatus(task.id, status)}
                onDelete={() => deleteTask(task.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[420px] items-center justify-center rounded-lg bg-slate-50/70">
            <div className="text-center">
              <p className="text-xs font-medium text-slate-500">
                진행 중인 업무가 없습니다.
              </p>

              <button
                type="button"
                onClick={() => setIsTaskModalOpen(true)}
                className="mt-3 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
              >
                새 업무 추가
              </button>
            </div>
          </div>
        )}
      </section>

      <ProcessTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={addTask}
      />
    </>
  );
}
