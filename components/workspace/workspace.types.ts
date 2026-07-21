export type WorkspaceLayerProps = {
  scope?: string;
};

export type LeaveType =
  | "ANNUAL_LEAVE"
  | "HALF_DAY_AM"
  | "HALF_DAY_PM"
  | "SPECIAL_LEAVE";

export type LeaveDay = {
  id: string;
  date: string;
  type: LeaveType;
  label: string;
  createdAt: string;
  updatedAt: string;
};

export type ExternalSchedule = {
  id: string;
  date: string;
  title: string;
  memo: string;
  createdAt: string;
  updatedAt: string;
};

export type InternalSchedule = {
  id: string;
  date: string;
  title: string;
  memo: string;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceScheduleType =
  | LeaveType
  | "EXTERNAL_SCHEDULE"
  | "INTERNAL_SCHEDULE"
  | "WEEKEND"
  | "HOLIDAY"
  | "PAYDAY";

export type WorkspaceScheduleItem = {
  id: string;
  type: WorkspaceScheduleType;
  label: string;
  title?: string;
  className: string;
};
