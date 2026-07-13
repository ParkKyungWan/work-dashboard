// app/settings/leave/page.tsx

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type LeaveType =
  | "ANNUAL_LEAVE"
  | "HALF_DAY_AM"
  | "HALF_DAY_PM"
  | "SPECIAL_LEAVE";

type LeaveDay = {
  id: string;
  date: string;
  type: LeaveType;
  label: string;
  createdAt: string;
  updatedAt: string;
};

const LEAVE_TYPE_OPTIONS: Array<{
  value: LeaveType;
  label: string;
  amount: number;
}> = [
  {
    value: "ANNUAL_LEAVE",
    label: "연차",
    amount: 1,
  },
  {
    value: "HALF_DAY_AM",
    label: "오전 반차",
    amount: 0.5,
  },
  {
    value: "HALF_DAY_PM",
    label: "오후 반차",
    amount: 0.5,
  },
  {
    value: "SPECIAL_LEAVE",
    label: "특별휴가",
    amount: 0,
  },
];

const toLocalDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getLeaveTypeLabel = (type: LeaveType) => {
  return (
    LEAVE_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type
  );
};

const getLeaveAmount = (type: LeaveType) => {
  return (
    LEAVE_TYPE_OPTIONS.find((option) => option.value === type)?.amount ?? 0
  );
};

export default function LeaveSettingsPage() {
  const [days, setDays] = useState<LeaveDay[]>([]);
  const [date, setDate] = useState(() => toLocalDateKey(new Date()));
  const [type, setType] = useState<LeaveType>("ANNUAL_LEAVE");
  const [label, setLabel] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchLeaveDays = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/leave", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("연차 목록을 불러오지 못했습니다.");
      }

      const data = (await response.json()) as LeaveDay[];

      setDays(data);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "연차 목록 조회 중 오류가 발생했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLeaveDays();
  }, [fetchLeaveDays]);

  const usedAnnualLeave = useMemo(() => {
    return days.reduce((total, day) => {
      return total + getLeaveAmount(day.type);
    }, 0);
  }, [days]);

  const resetForm = () => {
    setDate(toLocalDateKey(new Date()));
    setType("ANNUAL_LEAVE");
    setLabel("");
    setEditingId(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSaving(true);
    setMessage("");

    const requestUrl = editingId ? `/api/leave/${editingId}` : "/api/leave";

    const requestMethod = editingId ? "PATCH" : "POST";

    try {
      const response = await fetch(requestUrl, {
        method: requestMethod,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          type,
          label,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | LeaveDay
        | {
            message?: string;
          }
        | null;

      if (!response.ok) {
        throw new Error(
          data && "message" in data && data.message
            ? data.message
            : "연차 저장에 실패했습니다.",
        );
      }

      setMessage(
        editingId ? "연차 정보를 수정했습니다." : "연차를 추가했습니다.",
      );

      resetForm();
      await fetchLeaveDays();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "연차 저장 중 오류가 발생했습니다.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (leaveDay: LeaveDay) => {
    setEditingId(leaveDay.id);
    setDate(leaveDay.date);
    setType(leaveDay.type);
    setLabel(leaveDay.label);
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (leaveDay: LeaveDay) => {
    const confirmed = window.confirm(
      `${leaveDay.date} ${leaveDay.label}를 삭제하시겠습니까?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/leave/${leaveDay.id}`, {
        method: "DELETE",
      });

      const data = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        throw new Error(data?.message ?? "연차 삭제에 실패했습니다.");
      }

      if (editingId === leaveDay.id) {
        resetForm();
      }

      setMessage("연차를 삭제했습니다.");
      await fetchLeaveDays();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "연차 삭제 중 오류가 발생했습니다.",
      );
    }
  };

  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-8 text-neutral-900">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">연차 관리</h1>

            <p className="mt-1 text-sm text-neutral-500">
              연차와 반차를 등록하면 달력에 표시됩니다.
            </p>
          </div>

          <Link
            href="/settings"
            className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50"
          >
            돌아가기
          </Link>
        </div>

        <section className="mb-6 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold">
            {editingId ? "연차 수정" : "연차 추가"}
          </h2>

          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">날짜</span>

              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
                className="h-10 w-full rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-900"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">유형</span>

              <select
                value={type}
                onChange={(event) => setType(event.target.value as LeaveType)}
                className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-900"
              >
                {LEAVE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium">표시 이름</span>

              <input
                type="text"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder={getLeaveTypeLabel(type)}
                maxLength={50}
                className="h-10 w-full rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-900"
              />
            </label>

            <div className="flex gap-2 sm:col-span-2">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-md bg-neutral-900 px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "저장 중" : editingId ? "수정하기" : "추가하기"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-md border border-neutral-300 px-5 py-2 text-sm font-medium hover:bg-neutral-50"
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

        <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
            <h2 className="font-semibold">등록된 연차</h2>

            <span className="text-sm text-neutral-500">
              사용 연차 {usedAnnualLeave}일
            </span>
          </div>

          {isLoading ? (
            <div className="p-6 text-sm text-neutral-500">불러오는 중</div>
          ) : days.length === 0 ? (
            <div className="p-6 text-sm text-neutral-500">
              등록된 연차가 없습니다.
            </div>
          ) : (
            <div className="divide-y divide-neutral-200">
              {days.map((leaveDay, index) => (
                <div
                  key={
                    leaveDay.id || `${leaveDay.date}-${leaveDay.type}-${index}`
                  }
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm">{leaveDay.date}</strong>

                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        {getLeaveTypeLabel(leaveDay.type)}
                      </span>
                    </div>

                    <p className="mt-1 truncate text-sm text-neutral-600">
                      {leaveDay.label}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(leaveDay)}
                      disabled={!leaveDay.id}
                      className="rounded border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 disabled:opacity-40"
                    >
                      수정
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(leaveDay)}
                      disabled={!leaveDay.id}
                      className="rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-40"
                    >
                      삭제
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
