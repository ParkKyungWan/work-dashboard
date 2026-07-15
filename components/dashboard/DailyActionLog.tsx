// components/dashboard/DailyActionLog.tsx

"use client";

import { useState } from "react";

import type { DailyActionLogItem } from "./dashboard.types";
import { getCurrentTime } from "./dashboard.utils";

type DailyActionLogProps = {
  actionLogs: DailyActionLogItem[];
  onAddActionLog: (actionLog: Omit<DailyActionLogItem, "id">) => void;
  onDeleteActionLog: (actionLogId: string) => void;
};

export default function DailyActionLog({
  actionLogs,
  onAddActionLog,
  onDeleteActionLog,
}: DailyActionLogProps) {
  const [target, setTarget] = useState("");
  const [description, setDescription] = useState("");
  const [time, setTime] = useState(getCurrentTime);
  const [isTimeEditing, setIsTimeEditing] = useState(false);

  function submitActionLog(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTarget = target.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTarget || !trimmedDescription) {
      return;
    }

    onAddActionLog({
      target: trimmedTarget,
      description: trimmedDescription,
      time,
    });

    setTarget("");
    setDescription("");
    setTime(getCurrentTime());
    setIsTimeEditing(false);
  }

  return (
    <section className="flex min-h-[620px] min-w-0 flex-col rounded-[12px] p-4 card-shadow card-paper-background">
      <header className="mb-5 shrink-0">
        <h1 className="text-[15px] font-bold tracking-[-0.02em] text-slate-800">
          오늘의 조치 일지
        </h1>
      </header>

      <form className="mb-6 shrink-0 space-y-2" onSubmit={submitActionLog}>
        <input
          type="text"
          value={target}
          onChange={(event) => setTarget(event.target.value)}
          placeholder="사번 또는 부서/이름"
          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-400/10"
        />

        <input
          type="text"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="조치 내용을 입력하세요"
          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-400/10"
        />

        <div className="flex h-9 gap-2">
          <div className="min-w-0 flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white transition focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-400/10">
            {isTimeEditing ? (
              <input
                type="time"
                value={time}
                autoFocus
                onChange={(event) => setTime(event.target.value)}
                onBlur={() => setIsTimeEditing(false)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    setIsTimeEditing(false);
                  }

                  if (event.key === "Escape") {
                    setIsTimeEditing(false);
                  }
                }}
                className="h-full w-full bg-transparent px-3 text-center text-[13px] font-semibold tabular-nums text-slate-700 outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsTimeEditing(true)}
                aria-label="기록 시간 수정"
                className="h-full w-full px-3 text-[13px] font-semibold tabular-nums text-slate-700 transition hover:bg-slate-50"
              >
                {time}
              </button>
            )}
          </div>

          <button
            type="submit"
            className="shrink-0 rounded-lg bg-slate-800 px-4 text-[13px] font-semibold transition hover:bg-slate-700 active:bg-slate-900 text-white"
          >
            기록
          </button>
        </div>
      </form>

      <div className="min-h-0 flex-1">
        <div className="flex h-full min-w-0 flex-col">
          <div className="grid shrink-0 grid-cols-[52px_88px_minmax(0,1fr)_28px] items-center rounded-lg bg-slate-100/70 px-2 py-2 text-[14px] font-semibold text-slate-500">
            <span>시간</span>
            <span>대상</span>
            <span>작업 내용</span>
            <span aria-hidden="true" />
          </div>

          {actionLogs.length > 0 ? (
            <div className="min-h-0 flex-1 overflow-y-auto py-1 scrollbar-soft">
              {actionLogs.map((actionLog) => (
                <div
                  key={actionLog.id}
                  className="group grid min-w-0 grid-cols-[52px_88px_minmax(0,1fr)_28px] items-center rounded-lg px-2 py-2.5 text-[14px] text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <span className="tabular-nums text-slate-500">
                    {actionLog.time}
                  </span>

                  <span
                    className="min-w-0 truncate pr-2 font-medium text-slate-700"
                    title={actionLog.target}
                  >
                    {actionLog.target}
                  </span>

                  <span
                    className="min-w-0 truncate pr-2 text-slate-600"
                    title={actionLog.description}
                  >
                    {actionLog.description}
                  </span>

                  <button
                    type="button"
                    onClick={() => onDeleteActionLog(actionLog.id)}
                    aria-label="조치 기록 삭제"
                    className="mx-auto flex size-6 items-center justify-center rounded-md text-sm text-slate-300 opacity-0 transition group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-700 focus:opacity-100 focus:outline-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <div className="text-center">
                <p className="text-[14px] font-medium text-slate-500">
                  아직 기록된 조치가 없습니다.
                </p>

                <p className="mt-1 text-[13px] text-slate-400">
                  위 입력창에서 오늘의 조치를 기록하세요.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
