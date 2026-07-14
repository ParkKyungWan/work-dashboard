import type { Holiday } from "@/components/day-picker/day-picker.types";
import {
  createLocalDateFromKey,
  getAdjustedPayday,
  isWeekendDate,
  toLocalDateKey,
} from "@/components/day-picker/day-picker.utils";
import type { StickyNote } from "@/components/sticky-note/sticky-note.types";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

export type WorkspaceDateInfo = {
  date: Date;
  dateKey: string;
  year: number;
  month: number;
  day: number;
  weekday: string;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName: string | null;
  isPayday: boolean;
};

export const formatWorkspaceDateLabel = (dateKey: string) => {
  const date = createLocalDateFromKey(dateKey);

  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
};

export const formatWorkspaceMenuDateLabel = (dateKey: string) => {
  const date = createLocalDateFromKey(dateKey);

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = WEEKDAY_LABELS[date.getDay()];

  return `${year}.${month}.${day} (${weekday})`;
};

export const getWorkspaceDateInfo = ({
  dateKey,
  holidays,
  paydayDay = 25,
}: {
  dateKey: string;
  holidays: Holiday[];
  paydayDay?: number;
}): WorkspaceDateInfo => {
  const date = createLocalDateFromKey(dateKey);

  const holiday = holidays.find((item) => item.date === dateKey) ?? null;

  const holidayDateKeys = new Set(holidays.map((item) => item.date));

  const adjustedPayday = getAdjustedPayday(
    date.getFullYear(),
    date.getMonth(),
    paydayDay,
    holidayDateKeys,
  );

  return {
    date,
    dateKey,
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    weekday: WEEKDAY_LABELS[date.getDay()],
    isWeekend: isWeekendDate(date),
    isHoliday: holiday !== null,
    holidayName: holiday?.name ?? null,
    isPayday: toLocalDateKey(adjustedPayday) === dateKey,
  };
};

export const isSameLocalDay = (dateString: string, targetDate: Date) => {
  return toLocalDateKey(new Date(dateString)) === toLocalDateKey(targetDate);
};

export const getEndOfPreviousDayISOString = (baseDate: Date) => {
  const date = new Date(baseDate);

  date.setDate(date.getDate() - 1);
  date.setHours(23, 59, 59, 999);

  return date.toISOString();
};

export const isDateIncludedInNotePeriod = (
  note: StickyNote,
  baseDate: Date,
) => {
  const baseDateStart = new Date(baseDate);
  baseDateStart.setHours(0, 0, 0, 0);

  const baseDateEnd = new Date(baseDate);
  baseDateEnd.setHours(23, 59, 59, 999);

  const start = new Date(note.startDate);
  const end = note.expiresAt ? new Date(note.expiresAt) : null;

  return (
    start.getTime() <= baseDateEnd.getTime() &&
    (!end || end.getTime() >= baseDateStart.getTime())
  );
};
