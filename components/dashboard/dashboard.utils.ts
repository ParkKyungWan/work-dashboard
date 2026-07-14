// components/dashboard/dashboard.utils.ts

import type { ProcessTaskDraft, WorkStatus } from "./dashboard.types";

export const STATUS_OPTIONS: Array<{
  value: WorkStatus;
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
  return (
    STATUS_OPTIONS.find((option) => option.value === status)?.label ?? "시행 전"
  );
}

export function getStatusClassName(status: WorkStatus) {
  if (status === "IN_PROGRESS") {
    return "bg-blue-50 text-blue-700";
  }

  if (status === "COMPLETED") {
    return "bg-emerald-50 text-emerald-700";
  }

  return "bg-slate-100 text-slate-600";
}

export function getSelectedStatusClassName(status: WorkStatus) {
  if (status === "IN_PROGRESS") {
    return "bg-blue-600 text-white shadow-sm";
  }

  if (status === "COMPLETED") {
    return "bg-emerald-600 text-white shadow-sm";
  }

  return "bg-white text-slate-700 shadow-sm";
}

export function createEmptyTaskDraft(): ProcessTaskDraft {
  return {
    title: "",
    memo: "",
    status: "BEFORE",
  };
}
