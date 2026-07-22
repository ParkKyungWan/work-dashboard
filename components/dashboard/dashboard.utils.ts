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

export function formatShortDate(dateKey: string) {
  const [, month, day] = dateKey.split("-").map(Number);

  return `${month}/${day}`;
}

export function getStatusLabel(
  status: WorkStatus,
  createdDate?: string,
  completedDate?: string | null,
) {
  if (status === "ON_HOLD") {
    return "보류";
  }

  const label =
    STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    "시행 전";

  if (status === "IN_PROGRESS" && createdDate) {
    return `${label} · ${formatShortDate(createdDate)} ~`;
  }

  if (status === "COMPLETED" && createdDate && completedDate) {
    return `${label} · ${formatShortDate(createdDate)} ~ ${formatShortDate(completedDate)}`;
  }

  return label;
}

export function getStatusClassName(status: WorkStatus) {
  if (status === "IN_PROGRESS") {
    return "bg-[#fed7aa] text-[#2b241b]";
  }

  if (status === "ON_HOLD") {
    return "bg-slate-200 text-slate-700";
  }

  if (status === "COMPLETED") {
    return "bg-zinc-100 text-zinc-500";
  }

  return "bg-zinc-100 text-zinc-500";
}

export function getSelectedStatusClassName(status: SelectableWorkStatus) {
  if (status === "IN_PROGRESS") {
    return "bg-white text-slate-800";
  }

  if (status === "COMPLETED") {
    return "bg-gray-200 text-slate-600";
  }

  return "bg-gray-200 text-slate-600";
}

export function createEmptyTaskDraft(): ProcessTaskDraft {
  return {
    title: "",
    memo: "",
    status: "BEFORE",
  };
}
