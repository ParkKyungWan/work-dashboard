"use client";

import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "@daypicker/react";
import { ko } from "@daypicker/react/locale";

import type { AppDayPickerProps } from "./day-picker.types";
import {
  createLocalDateFromKey,
  isWeekendDate,
  toLocalDateKey,
} from "./day-picker.utils";

export default function AppDayPicker({
  value,
  onChange,
  holidays = [],
  paydayDay = 25,
}: AppDayPickerProps) {
  const selectedDate = useMemo(() => createLocalDateFromKey(value), [value]);

  const [calendarMonth, setCalendarMonth] = useState(selectedDate);

  const holidayDates = useMemo(
    () => holidays.map((holiday) => createLocalDateFromKey(holiday.date)),
    [holidays],
  );

  useEffect(() => {
    setCalendarMonth(selectedDate);
  }, [selectedDate]);

  return (
    <DayPicker
      mode="single"
      locale={ko}
      selected={selectedDate}
      month={calendarMonth}
      onMonthChange={setCalendarMonth}
      onSelect={(date) => {
        if (!date) {
          return;
        }

        onChange(toLocalDateKey(date));
      }}
      showOutsideDays
      modifiers={{
        weekend: isWeekendDate,

        holiday: holidayDates,

        payday: (date) => {
          return date.getDate() === paydayDay;
        },
      }}
      modifiersClassNames={{
        weekend:
          "[&>button]:bg-red-50 [&>button]:text-red-500 [&>button]:hover:bg-red-100",

        holiday:
          "[&>button]:bg-red-100 [&>button]:font-semibold [&>button]:text-red-600 [&>button]:hover:bg-red-200",

        payday:
          "[&>button]:relative [&>button]:font-bold after:absolute after:bottom-0 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-blue-600",
      }}
      classNames={{
        root: "relative m-0 w-full",

        months: "w-full",

        month: "w-full",

        month_caption:
          "pointer-events-none relative flex h-9 items-center justify-center",

        caption_label: "text-xs font-semibold text-neutral-900",

        nav: "pointer-events-auto absolute left-0 right-0 top-0 z-20 flex h-9 items-center justify-between",

        button_previous:
          "pointer-events-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded text-neutral-700 transition hover:bg-neutral-100 active:bg-neutral-200",

        button_next:
          "pointer-events-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded text-neutral-700 transition hover:bg-neutral-100 active:bg-neutral-200",

        month_grid: "w-full table-fixed border-collapse",

        weekdays: "grid grid-cols-7",

        weekday:
          "flex h-7 items-center justify-center text-[10px] font-medium text-neutral-500",

        week: "grid grid-cols-7",

        day: "relative flex h-7 items-center justify-center",

        day_button:
          "flex h-7 w-7 cursor-pointer items-center justify-center rounded text-[11px] text-neutral-800 transition hover:bg-neutral-100",

        selected:
          "[&>button]:!bg-neutral-900 [&>button]:!font-semibold [&>button]:!text-white [&>button]:hover:!bg-neutral-800",

        today:
          "[&>button]:border [&>button]:border-neutral-900 [&>button]:font-bold",

        outside: "[&>button]:opacity-35",

        disabled: "[&>button]:cursor-not-allowed [&>button]:opacity-30",

        hidden: "invisible",
      }}
    />
  );
}
