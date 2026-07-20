// components/dashboard/DailyActionLog.tsx

"use client";

import { useEffect, useState } from "react";

import { createLocalDateFromKey } from "@/components/day-picker/day-picker.utils";

import type {
  DailyActionLogDraft,
  DailyActionLogItem,
} from "./dashboard.types";
import { getCurrentTime } from "./dashboard.utils";

type DailyActionLogProps = {
  viewDate: string;
  actionLogs: DailyActionLogItem[];
  isLoading: boolean;
  isSaving: boolean;
  errorMessage: string | null;
  onAddActionLog: (actionLog: DailyActionLogDraft) => Promise<boolean>;
  onDeleteActionLog: (actionLogId: string) => Promise<void>;
};

export default function DailyActionLog({
  viewDate,
  actionLogs,
  isLoading,
  isSaving,
  errorMessage,
  onAddActionLog,
  onDeleteActionLog,
}: DailyActionLogProps) {
  const [target, setTarget] = useState("");
  const [description, setDescription] = useState("");
  const [time, setTime] = useState(getCurrentTime);
  const [isTimeEditing, setIsTimeEditing] = useState(false);
  const [isTimeManuallySet, setIsTimeManuallySet] = useState(false);

  useEffect(() => {
    if (isTimeManuallySet) {
      return;
    }

    let minuteInterval: number | null = null;
    const millisecondsUntilNextMinute =
      60_000 - (Date.now() % 60_000) + 50;

    const minuteTimeout = window.setTimeout(() => {
      setTime(getCurrentTime());

      minuteInterval = window.setInterval(() => {
        setTime(getCurrentTime());
      }, 60_000);
    }, millisecondsUntilNextMinute);

    return () => {
      window.clearTimeout(minuteTimeout);

      if (minuteInterval !== null) {
        window.clearInterval(minuteInterval);
      }
    };
  }, [isTimeManuallySet]);

  async function submitActionLog(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTarget = target.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTarget || !trimmedDescription) {
      return;
    }

    const saved = await onAddActionLog({
      target: trimmedTarget,
      description: trimmedDescription,
      time,
    });

    if (!saved) {
      return;
    }

    setTarget("");
    setDescription("");
    setTime(getCurrentTime());
    setIsTimeEditing(false);
    setIsTimeManuallySet(false);
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
                onChange={(event) => {
                  setTime(event.target.value);
                  setIsTimeManuallySet(true);
                }}
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
            disabled={isSaving}
            className="shrink-0 rounded-lg bg-slate-800 px-4 text-[13px] font-semibold text-white transition hover:bg-slate-700 active:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "저장 중" : "기록"}
          </button>
        </div>
      </form>

      {errorMessage && (
        <p className="-mt-3 mb-3 text-[12px] font-medium text-red-600">
          {errorMessage}
        </p>
      )}

      <div className="min-h-0 flex-1">
        <div className="flex h-full min-w-0 flex-col">
          <div className="grid shrink-0 grid-cols-[52px_88px_minmax(0,1fr)_28px] items-center rounded-lg bg-slate-100/70 px-2 py-2 text-[14px] font-semibold text-slate-500">
            <span>시간</span>
            <span>대상</span>
            <span>작업 내용</span>
            <span aria-hidden="true" />
          </div>

          {isLoading ? (
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <p className="text-[14px] font-medium text-slate-400">
                조치 일지를 불러오는 중입니다.
              </p>
            </div>
          ) : actionLogs.length > 0 ? (
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
                    onClick={() => void onDeleteActionLog(actionLog.id)}
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
                  {createLocalDateFromKey(viewDate).getMonth() + 1}월{" "}
                  {createLocalDateFromKey(viewDate).getDate()}일의 조치를
                  기록하세요.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
