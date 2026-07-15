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
  const isOnHold = task.status === "ON_HOLD";

  return (
    <article
      className={[
        "overflow-hidden rounded-xl bg-white",
        "transition-shadow duration-150",
        isExpanded
          ? "ring-1 ring-slate-200/50 shadow-[0_6px_18px_rgba(15,23,42,0.07)]"
          : "shadow-[0_2px_8px_rgba(15,23,42,0.045)] hover:shadow-[0_5px_14px_rgba(15,23,42,0.07)]",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-slate-50/60"
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
        <div className="px-3 pb-3 pt-2">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_220px]">
            <div className="min-w-0">
              <p className="mb-1.5 text-[11px] font-semibold text-slate-500">
                메모
              </p>

              <textarea
                value={task.memo}
                onChange={(event) => onUpdateMemo(event.target.value)}
                placeholder="업무 진행 내용을 입력하세요"
                className="min-h-24 w-full resize-y rounded-lg border border-slate-200/80 bg-slate-50/50 px-3 py-2 text-xs leading-5 text-slate-700 outline-none transition placeholder:text-slate-400 hover:bg-white focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-400/10"
              />
            </div>

            <aside className="flex min-w-0 flex-col">
              <p className="mb-1.5 text-[11px] font-semibold text-slate-500">
                상태
              </p>

              <div className="grid grid-cols-3 rounded-lg bg-slate-100/80 p-0.5">
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

              <div className="mt-3 grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateStatus(isOnHold ? "BEFORE" : "ON_HOLD")
                  }
                  className={[
                    "flex h-8 items-center justify-center gap-1.5 rounded-lg px-2",
                    "text-[10px] font-semibold transition",
                    isOnHold
                      ? "bg-slate-200 text-slate-700 shadow-[0_1px_4px_rgba(15,23,42,0.08)] hover:bg-slate-300"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "size-1.5 rounded-full",
                      isOnHold ? "bg-slate-500" : "bg-slate-400",
                    ].join(" ")}
                    aria-hidden="true"
                  />

                  {isOnHold ? "보류 해제" : "업무 보류"}
                </button>

                <button
                  type="button"
                  onClick={onDelete}
                  className={[
                    "flex h-8 items-center justify-center gap-1.5 rounded-lg px-2",
                    "bg-transparent text-[10px] font-semibold text-slate-400",
                    "transition hover:bg-red-50 hover:text-red-600",
                  ].join(" ")}
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    className="size-3.5"
                    aria-hidden="true"
                  >
                    <path
                      d="M7.5 3.5h5M4.5 6h11M6 6l.5 10h7L14 6M8 8.5v5M12 8.5v5"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  업무 삭제
                </button>
              </div>
            </aside>
          </div>
        </div>
      )}
    </article>
  );
}
