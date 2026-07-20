// components/dashboard/dashboard.types.ts

export type WorkStatus = "BEFORE" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED";

export type DailyActionLogItem = {
  id: string;
  date: string;
  target: string;
  description: string;
  time: string;
  createdAt: string;
  updatedAt: string;
};

export type DailyActionLogDraft = Pick<
  DailyActionLogItem,
  "target" | "description" | "time"
>;

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
