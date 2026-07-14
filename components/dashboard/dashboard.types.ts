// components/dashboard/dashboard.types.ts

export type WorkStatus = "BEFORE" | "IN_PROGRESS" | "COMPLETED";

export type DailyActionLogItem = {
  id: string;
  target: string;
  description: string;
  time: string;
};

export type ProcessTask = {
  id: string;
  title: string;
  memo: string;
  status: WorkStatus;
};

export type ProcessTaskDraft = {
  title: string;
  memo: string;
  status: WorkStatus;
};
