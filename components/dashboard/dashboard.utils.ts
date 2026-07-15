// components/dashboard/dashboard.utils.ts

import type { ProcessTaskDraft, WorkStatus } from "./dashboard.types";

type SelectableWorkStatus = Exclude<WorkStatus, "ON_HOLD">;

export const STATUS_OPTIONS: Array<{
  value: SelectableWorkStatus;
  label: string;
}> = [
  {
    value: "BEFORE",
    label: "시행 전",
  },
  {
    value: "IN_PROGRESS",
    label: "시행 중",
  },
  {
    value: "COMPLETED",
    label: "시행 완료",
  },
];

export function getCurrentTime() {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

export function getStatusLabel(status: WorkStatus) {
  if (status === "ON_HOLD") {
    return "보류";
  }

  return (
    STATUS_OPTIONS.find((option) => option.value === status)?.label ?? "시행 전"
  );
}

export function getStatusClassName(status: WorkStatus) {
  if (status === "IN_PROGRESS") {
    return "bg-sky-50 text-sky-600";
  }

  if (status === "ON_HOLD") {
    return "bg-slate-200 text-slate-700";
  }

  if (status === "COMPLETED") {
    return "bg-emerald-50 text-emerald-600";
  }

  return "bg-zinc-100 text-zinc-500";
}

export function getSelectedStatusClassName(status: SelectableWorkStatus) {
  if (status === "IN_PROGRESS") {
    return "bg-sky-100 text-sky-700";
  }

  if (status === "COMPLETED") {
    return "bg-emerald-100 text-emerald-700";
  }

  return "bg-white text-slate-600 shadow-sm";
}

export function createEmptyTaskDraft(): ProcessTaskDraft {
  return {
    title: "",
    memo: "",
    status: "BEFORE",
  };
}
