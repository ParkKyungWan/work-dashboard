// app/settings/internal-schedules/page.tsx

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type InternalSchedule = {
  id: string;
  date: string;
  title: string;
  memo: string;
  createdAt: string;
  updatedAt: string;
};

const toLocalDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export default function InternalSchedulesPage() {
  const [schedules, setSchedules] = useState<InternalSchedule[]>([]);

  const [date, setDate] = useState(() => toLocalDateKey(new Date()));
  const [title, setTitle] = useState("");
  const [memo, setMemo] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [message, setMessage] = useState("");

  const fetchSchedules = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/day-picker/internal-schedules", {
        cache: "no-store",
      });

      const data = (await response.json().catch(() => null)) as
        | InternalSchedule[]
        | {
            message?: string;
          }
        | null;

      if (!response.ok) {
        throw new Error(
          data && !Array.isArray(data) && data.message
            ? data.message
            : "내부 일정 목록을 불러오지 못했습니다.",
        );
      }

      setSchedules(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "내부 일정 목록 조회 중 오류가 발생했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSchedules();
  }, [fetchSchedules]);

  const resetForm = () => {
    setDate(toLocalDateKey(new Date()));
    setTitle("");
    setMemo("");
    setEditingId(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedTitle = title.trim();

    if (!date) {
      setMessage("날짜를 선택해주세요.");
      return;
    }

    if (!normalizedTitle) {
      setMessage("일정 이름을 입력해주세요.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    const requestUrl = editingId
      ? `/api/day-picker/internal-schedules/${editingId}`
      : "/api/day-picker/internal-schedules";

    const requestMethod = editingId ? "PATCH" : "POST";

    try {
      const response = await fetch(requestUrl, {
        method: requestMethod,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          title: normalizedTitle,
          memo,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | InternalSchedule
        | {
            message?: string;
          }
        | null;

      if (!response.ok) {
        throw new Error(
          data && "message" in data && data.message
            ? data.message
            : "내부 일정 저장에 실패했습니다.",
        );
      }

      setMessage(
        editingId ? "내부 일정을 수정했습니다." : "내부 일정을 추가했습니다.",
      );

      resetForm();
      await fetchSchedules();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "내부 일정 저장 중 오류가 발생했습니다.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (schedule: InternalSchedule) => {
    setEditingId(schedule.id);
    setDate(schedule.date);
    setTitle(schedule.title);
    setMemo(schedule.memo);
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (schedule: InternalSchedule) => {
    const confirmed = window.confirm(
      `${schedule.date} ${schedule.title} 일정을 삭제하시겠습니까?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(schedule.id);
    setMessage("");

    try {
      const response = await fetch(
        `/api/day-picker/internal-schedules/${schedule.id}`,
        {
          method: "DELETE",
        },
      );

      const data = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        throw new Error(data?.message ?? "내부 일정 삭제에 실패했습니다.");
      }

      if (editingId === schedule.id) {
        resetForm();
      }

      setMessage("내부 일정을 삭제했습니다.");
      await fetchSchedules();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "내부 일정 삭제 중 오류가 발생했습니다.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-8 text-neutral-900">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">내부 일정</h1>

            <p className="mt-1 text-sm text-neutral-500">
              개인 일정이나 내부 일정을 등록하면 달력에 연한 하늘색으로
              표시됩니다.
            </p>
          </div>

          <Link
            href="/settings"
            className="shrink-0 rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-neutral-50"
          >
            설정으로
          </Link>
        </header>

        <section className="mb-6 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold">
            {editingId ? "내부 일정 수정" : "내부 일정 추가"}
          </h2>

          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">날짜</span>

              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
                className="h-10 w-full rounded-md border border-neutral-300 px-3 text-sm outline-none transition-colors focus:border-neutral-900"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">일정 이름</span>

              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="예: 사내 회의"
                maxLength={100}
                required
                className="h-10 w-full rounded-md border border-neutral-300 px-3 text-sm outline-none transition-colors focus:border-neutral-900"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium">메모</span>

              <textarea
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
                placeholder="필요한 내용을 입력하세요."
                maxLength={500}
                rows={4}
                spellCheck={false}
                className="w-full resize-y rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-neutral-900"
              />
            </label>

            <div className="flex gap-2 sm:col-span-2">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-md bg-strong px-5 py-2 text-sm font-semibold text-on-strong transition-colors hover:bg-strong-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "저장 중" : editingId ? "수정하기" : "추가하기"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSaving}
                  className="rounded-md border border-neutral-300 px-5 py-2 text-sm font-medium transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  수정 취소
                </button>
              )}
            </div>
          </form>

          {message && (
            <p className="mt-4 text-sm text-neutral-700">{message}</p>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
            <h2 className="font-semibold">등록된 내부 일정</h2>

            <span className="text-sm text-neutral-500">
              총 {schedules.length}개
            </span>
          </div>

          {isLoading ? (
            <div className="p-6 text-sm text-neutral-500">불러오는 중</div>
          ) : schedules.length === 0 ? (
            <div className="p-6 text-sm text-neutral-500">
              아직 등록된 내부 일정이 없습니다.
            </div>
          ) : (
            <div className="divide-y divide-neutral-200">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-start justify-between gap-4 px-5 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm">{schedule.date}</strong>

                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                        내부 일정
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-medium text-neutral-900">
                      {schedule.title}
                    </p>

                    {schedule.memo && (
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-neutral-600">
                        {schedule.memo}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(schedule)}
                      disabled={isSaving || deletingId === schedule.id}
                      className="rounded border border-neutral-300 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      수정
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(schedule)}
                      disabled={isSaving || deletingId === schedule.id}
                      className="rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {deletingId === schedule.id ? "삭제 중" : "삭제"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

