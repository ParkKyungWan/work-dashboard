// components/dashboard/ProcessTaskList.tsx

"use client";

import { useMemo, useState } from "react";

import ProcessTaskCard from "./ProcessTaskCard";
import ProcessTaskModal from "./ProcessTaskModal";
import ConfirmDialog from "../common/ConfirmDialog";
import type {
  ProcessTask,
  ProcessTaskDraft,
  WorkStatus,
} from "./dashboard.types";

type ProcessTaskListProps = {
  tasks: ProcessTask[];
  isLoading: boolean;
  isSaving: boolean;
  errorMessage: string | null;
  onAddTask: (taskDraft: ProcessTaskDraft) => Promise<boolean>;
  onUpdateTaskMemo: (taskId: string, memo: string) => void;
  onUpdateTaskStatus: (taskId: string, status: WorkStatus) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
};
const STATUS_ORDER: Record<WorkStatus, number> = {
  BEFORE: 0,
  IN_PROGRESS: 1,
  ON_HOLD: 2,
  COMPLETED: 3,
};
export default function ProcessTaskList({
  tasks,
  isLoading,
  isSaving,
  errorMessage,
  onAddTask,
  onUpdateTaskMemo,
  onUpdateTaskStatus,
  onDeleteTask,
}: ProcessTaskListProps) {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [pendingStatuses, setPendingStatuses] = useState<
    Record<string, WorkStatus>
  >({});

  const [deleteTarget, setDeleteTarget] = useState<ProcessTask | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const statusDifference = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];

      if (statusDifference !== 0) {
        return statusDifference;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [tasks]);

  const taskCountText = useMemo(() => {
    if (tasks.length === 0) {
      return "등록된 업무 없음";
    }

    return `${tasks.length}개의 업무`;
  }, [tasks.length]);

  function commitPendingStatus(taskId: string) {
    const task = tasks.find((item) => item.id === taskId);
    const pendingStatus = pendingStatuses[taskId];

    setPendingStatuses((currentStatuses) => {
      const nextStatuses = { ...currentStatuses };
      delete nextStatuses[taskId];
      return nextStatuses;
    });

    if (task && pendingStatus && pendingStatus !== task.status) {
      void onUpdateTaskStatus(taskId, pendingStatus);
    }
  }

  function toggleTask(taskId: string) {
    if (expandedTaskId) {
      commitPendingStatus(expandedTaskId);
    }

    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  }

  function updatePendingStatus(taskId: string, status: WorkStatus) {
    setPendingStatuses((currentStatuses) => ({
      ...currentStatuses,
      [taskId]: status,
    }));
  }

  async function deleteTask(taskId: string) {
    setPendingStatuses((currentStatuses) => {
      const nextStatuses = { ...currentStatuses };
      delete nextStatuses[taskId];
      return nextStatuses;
    });

    await onDeleteTask(taskId);

    setExpandedTaskId((currentTaskId) =>
      currentTaskId === taskId ? null : currentTaskId,
    );
  }

  async function addTask(taskDraft: ProcessTaskDraft) {
    if (await onAddTask(taskDraft)) {
      setIsTaskModalOpen(false);
    }
  }

  return (
    <>
      <section className="flex min-h-[620px] min-w-0 flex-col rounded-[12px] p-4 card-shadow card-paper-background">
        <header className="mb-5 flex shrink-0 items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-bold tracking-[-0.02em] text-slate-800">
              진행 업무
            </h2>

            <p className="mt-0.5 text-[14px] text-slate-400">{taskCountText}</p>
          </div>

          <button
            type="button"
            onClick={() => setIsTaskModalOpen(true)}
            className="h-8 shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-[15px] font-semibold text-slate-700 shadow-[0_2px_6px_rgba(15,23,42,0.05)] transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100"
          >
            + 업무 추가
          </button>
        </header>

        {errorMessage && (
          <p className="mb-3 text-[12px] font-medium text-red-600">
            {errorMessage}
          </p>
        )}

        {isLoading ? (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <p className="text-[14px] font-medium text-slate-400">
              진행 업무를 불러오는 중입니다.
            </p>
          </div>
        ) : tasks.length > 0 ? (
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-soft">
            {sortedTasks.map((task) => (
              <ProcessTaskCard
                key={task.id}
                task={task}
                pendingStatus={pendingStatuses[task.id] ?? task.status}
                isExpanded={expandedTaskId === task.id}
                onToggle={() => toggleTask(task.id)}
                onUpdateMemo={(memo) => onUpdateTaskMemo(task.id, memo)}
                onPendingStatusChange={(status) =>
                  updatePendingStatus(task.id, status)
                }
                onDelete={() => setDeleteTarget(task)}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <div className="text-center">
              <p className="text-[15px] font-medium text-slate-500">
                진행 중인 업무가 없습니다.
              </p>

              <button
                type="button"
                onClick={() => setIsTaskModalOpen(true)}
                className="mt-3 rounded-lg px-3 py-2 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                새 업무 추가
              </button>
            </div>
          </div>
        )}
      </section>

      <ProcessTaskModal
        isOpen={isTaskModalOpen}
        isSaving={isSaving}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={addTask}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        title="업무를 삭제할까요?"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" 업무는 삭제 후 복구할 수 없습니다.`
            : undefined
        }
        confirmText="삭제"
        cancelText="취소"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;

          const taskId = deleteTarget.id;
          setDeleteTarget(null);
          void deleteTask(taskId);
        }}
      />
    </>
  );
}
