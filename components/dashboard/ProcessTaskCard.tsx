// components/dashboard/ProcessTaskCard.tsx

"use client";

import type { ProcessTask, WorkStatus } from "./dashboard.types";
import {
  getSelectedStatusClassName,
  getStatusClassName,
  getStatusLabel,
  STATUS_OPTIONS,
} from "./dashboard.utils";

type ProcessTaskCardProps = {
  task: ProcessTask;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdateMemo: (memo: string) => void;
  onUpdateStatus: (status: WorkStatus) => void;
  onDelete: () => void;
};

export default function ProcessTaskCard({
  task,
  isExpanded,
  onToggle,
  onUpdateMemo,
  onUpdateStatus,
  onDelete,
}: ProcessTaskCardProps) {
  return (
    <article className="overflow-hidden rounded-xl bg-slate-50/80 transition hover:bg-slate-50">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-3 py-3 text-left"
        aria-expanded={isExpanded}
      >
        <span
          className="grid shrink-0 cursor-grab grid-cols-2 gap-[2px] rounded-md p-1"
          aria-hidden="true"
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <span
              key={index}
              className="size-[2.5px] rounded-full bg-slate-400"
            />
          ))}
        </span>

        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800">
          {task.title}
        </span>

        <span
          className={[
            "shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold",
            getStatusClassName(task.status),
          ].join(" ")}
        >
          {getStatusLabel(task.status)}
        </span>

        <span
          className={[
            "shrink-0 text-[10px] text-slate-400 transition-transform",
            isExpanded ? "rotate-180" : "",
          ].join(" ")}
          aria-hidden="true"
        >
          ▼
        </span>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3">
          <div className="rounded-lg bg-white p-3">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_220px]">
              <div className="min-w-0">
                <p className="mb-1.5 text-[11px] font-semibold text-slate-500">
                  메모
                </p>

                <textarea
                  value={task.memo}
                  onChange={(event) => onUpdateMemo(event.target.value)}
                  placeholder="업무 진행 내용을 입력하세요"
                  className="min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

              <aside>
                <p className="mb-1.5 text-[11px] font-semibold text-slate-500">
                  상태
                </p>

                <div className="grid grid-cols-3 rounded-lg bg-slate-100 p-0.5">
                  {STATUS_OPTIONS.map((option) => {
                    const isSelected = task.status === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => onUpdateStatus(option.value)}
                        className={[
                          "h-7 rounded-md px-1 text-[10px] font-semibold transition",
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

                <button
                  type="button"
                  onClick={onDelete}
                  className="mt-3 h-7 w-full rounded-md text-[10px] font-semibold text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                >
                  업무 삭제
                </button>
              </aside>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
