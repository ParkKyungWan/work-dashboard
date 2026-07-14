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
    <section className="flex min-h-[620px] min-w-0 flex-col rounded-2xl bg-white p-4 shadow-[0_5px_20px_rgba(15,23,42,0.04)]">
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
          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
        />

        <input
          type="text"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="조치 내용을 입력하세요"
          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
        />

        <div className="flex h-9 overflow-hidden rounded-lg border border-slate-200 bg-white transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10">
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
              className="min-w-0 flex-1 bg-transparent px-3 text-center text-xs font-semibold tabular-nums text-slate-700 outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsTimeEditing(true)}
              aria-label="기록 시간 수정"
              className="min-w-0 flex-1 px-3 text-xs font-semibold tabular-nums text-slate-700 transition hover:bg-slate-50"
            >
              {time}
            </button>
          )}

          <button
            type="submit"
            className="shrink-0 bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700 active:bg-blue-800"
          >
            기록
          </button>
        </div>
      </form>

      <div className="min-h-0 flex-1 overflow-x-auto">
        <div className="flex h-full min-w-[390px] flex-col">
          <div className="grid shrink-0 grid-cols-[58px_92px_minmax(160px,1fr)_34px] items-center px-1 pb-2 text-[11px] font-semibold text-slate-500">
            <span>시간</span>
            <span>대상</span>
            <span>작업 내용</span>
            <span className="text-center">작업</span>
          </div>

          {actionLogs.length > 0 ? (
            <div className="min-h-0 flex-1 overflow-y-auto">
              {actionLogs.map((actionLog) => (
                <div
                  key={actionLog.id}
                  className="grid grid-cols-[58px_92px_minmax(160px,1fr)_34px] items-center px-1 py-2 text-[11px] text-slate-700 transition hover:bg-slate-50"
                >
                  <span className="tabular-nums text-slate-500">
                    {actionLog.time}
                  </span>

                  <span
                    className="truncate pr-2 font-medium"
                    title={actionLog.target}
                  >
                    {actionLog.target}
                  </span>

                  <span className="truncate pr-2" title={actionLog.description}>
                    {actionLog.description}
                  </span>

                  <button
                    type="button"
                    onClick={() => onDeleteActionLog(actionLog.id)}
                    aria-label="조치 기록 삭제"
                    className="mx-auto flex size-6 items-center justify-center rounded-md text-sm text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 items-center justify-center rounded-lg bg-slate-50/70">
              <div className="text-center">
                <p className="text-xs font-medium text-slate-500">
                  아직 기록된 조치가 없습니다.
                </p>

                <p className="mt-1 text-[11px] text-slate-400">
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
