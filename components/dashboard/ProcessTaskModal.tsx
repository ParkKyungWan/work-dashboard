// components/dashboard/ProcessTaskModal.tsx

"use client";

import { useEffect, useState } from "react";

import type { ProcessTaskDraft, WorkStatus } from "./dashboard.types";
import {
  createEmptyTaskDraft,
  getSelectedStatusClassName,
  STATUS_OPTIONS,
} from "./dashboard.utils";

type ProcessTaskModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskDraft: ProcessTaskDraft) => void;
};

export default function ProcessTaskModal({
  isOpen,
  onClose,
  onSubmit,
}: ProcessTaskModalProps) {
  const [taskDraft, setTaskDraft] =
    useState<ProcessTaskDraft>(createEmptyTaskDraft);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setTaskDraft(createEmptyTaskDraft());

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  function updateTitle(title: string) {
    setTaskDraft((currentDraft) => ({
      ...currentDraft,
      title,
    }));
  }

  function updateMemo(memo: string) {
    setTaskDraft((currentDraft) => ({
      ...currentDraft,
      memo,
    }));
  }

  function updateStatus(status: WorkStatus) {
    setTaskDraft((currentDraft) => ({
      ...currentDraft,
      status,
    }));
  }

  function submitTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = taskDraft.title.trim();

    if (!trimmedTitle) {
      return;
    }

    onSubmit({
      title: trimmedTitle,
      memo: taskDraft.memo.trim(),
      status: taskDraft.status,
    });
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/25 p-4 backdrop-blur-[2px]"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="process-task-modal-title"
        className="w-full max-w-[430px] rounded-2xl bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.2)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <h3
            id="process-task-modal-title"
            className="text-[15px] font-bold text-slate-800"
          >
            진행 업무 추가
          </h3>

          <button
            type="button"
            onClick={onClose}
            aria-label="팝업 닫기"
            className="flex size-7 items-center justify-center rounded-md text-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            ×
          </button>
        </div>

        <form className="space-y-4" onSubmit={submitTask}>
          <div>
            <label
              htmlFor="new-process-task-title"
              className="mb-1.5 block text-[14px] font-semibold text-slate-600"
            >
              업무 제목
            </label>

            <input
              id="new-process-task-title"
              type="text"
              value={taskDraft.title}
              autoFocus
              onChange={(event) => updateTitle(event.target.value)}
              placeholder="업무 제목을 입력하세요"
              className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[13px] font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>

          <div>
            <p className="mb-1.5 text-[14px] font-semibold text-slate-600">
              상태
            </p>

            <div className="grid grid-cols-3 rounded-lg bg-slate-100 p-0.5">
              {STATUS_OPTIONS.map((option) => {
                const isSelected = taskDraft.status === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateStatus(option.value)}
                    className={[
                      "h-8 rounded-md px-2 text-[13px] font-semibold transition",
                      isSelected
                        ? getSelectedStatusClassName(option.value)
                        : "text-slate-500 hover:bg-white hover:text-slate-700",
                    ].join(" ")}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="new-process-task-memo"
              className="mb-1.5 block text-[14px] font-semibold text-slate-600"
            >
              메모
            </label>

            <textarea
              id="new-process-task-memo"
              value={taskDraft.memo}
              onChange={(event) => updateMemo(event.target.value)}
              placeholder="업무 진행 내용을 입력하세요"
              className="min-h-28 w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-[13px] leading-5 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-8 rounded-lg px-3 text-[14px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              취소
            </button>

            <button
              type="submit"
              disabled={!taskDraft.title.trim()}
              className="h-8 rounded-lg bg-blue-600 px-4 text-[14px] font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              추가
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
