// components/day-picker/AppDayPicker.tsx

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DayPicker } from "@daypicker/react";
import { ko } from "@daypicker/react/locale";

import type {
  AppDayPickerProps,
  Holiday,
  HolidayApiResponse,
  LeaveDay,
} from "./day-picker.types";
import {
  createLocalDateFromKey,
  getAdjustedPayday,
  isWeekendDate,
  toLocalDateKey,
} from "./day-picker.utils";

export default function AppDayPicker({
  value,
  onChange,
  paydayDay = 25,
}: AppDayPickerProps) {
  const selectedDate = useMemo(() => createLocalDateFromKey(value), [value]);

  const [calendarMonth, setCalendarMonth] = useState(selectedDate);

  const [holidaysByYear, setHolidaysByYear] = useState<
    Record<number, Holiday[]>
  >({});

  const [leaveDaysByYear, setLeaveDaysByYear] = useState<
    Record<number, LeaveDay[]>
  >({});

  const [isHolidayLoading, setIsHolidayLoading] = useState(false);

  const requestedHolidayYearsRef = useRef<Set<number>>(new Set());

  const requestedLeaveYearsRef = useRef<Set<number>>(new Set());

  const loadHolidays = useCallback(async (year: number) => {
    if (requestedHolidayYearsRef.current.has(year)) {
      return;
    }

    requestedHolidayYearsRef.current.add(year);
    setIsHolidayLoading(true);

    try {
      const response = await fetch(`/api/holidays?year=${year}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;

        throw new Error(
          errorData?.message ?? `${year}년 공휴일을 불러오지 못했습니다.`,
        );
      }

      const data = (await response.json()) as HolidayApiResponse;

      setHolidaysByYear((previous) => ({
        ...previous,
        [year]: data.holidays,
      }));
    } catch (error) {
      requestedHolidayYearsRef.current.delete(year);

      console.error(`${year}년 공휴일 조회 실패:`, error);
    } finally {
      setIsHolidayLoading(false);
    }
  }, []);

  const loadLeaveDays = useCallback(async (year: number) => {
    if (requestedLeaveYearsRef.current.has(year)) {
      return;
    }

    requestedLeaveYearsRef.current.add(year);

    try {
      const response = await fetch(`/api/leave?year=${year}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;

        throw new Error(
          errorData?.message ?? `${year}년 연차 정보를 불러오지 못했습니다.`,
        );
      }

      const data = (await response.json()) as LeaveDay[];

      setLeaveDaysByYear((previous) => ({
        ...previous,
        [year]: data,
      }));
    } catch (error) {
      requestedLeaveYearsRef.current.delete(year);

      console.error(`${year}년 연차 조회 실패:`, error);
    }
  }, []);

  useEffect(() => {
    setCalendarMonth(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    const year = calendarMonth.getFullYear();

    void loadHolidays(year);
    void loadLeaveDays(year);
  }, [calendarMonth, loadHolidays, loadLeaveDays]);

  const calendarYear = calendarMonth.getFullYear();

  const currentYearHolidays = holidaysByYear[calendarYear] ?? [];

  const currentYearLeaveDays = leaveDaysByYear[calendarYear] ?? [];

  const holidayDates = useMemo(
    () =>
      currentYearHolidays.map((holiday) =>
        createLocalDateFromKey(holiday.date),
      ),
    [currentYearHolidays],
  );

  const holidayDateKeys = useMemo(
    () => new Set(currentYearHolidays.map((holiday) => holiday.date)),
    [currentYearHolidays],
  );

  const annualLeaveDates = useMemo(
    () =>
      currentYearLeaveDays
        .filter((leaveDay) => leaveDay.type === "ANNUAL_LEAVE")
        .map((leaveDay) => createLocalDateFromKey(leaveDay.date)),
    [currentYearLeaveDays],
  );

  const halfDayDates = useMemo(
    () =>
      currentYearLeaveDays
        .filter(
          (leaveDay) =>
            leaveDay.type === "HALF_DAY_AM" || leaveDay.type === "HALF_DAY_PM",
        )
        .map((leaveDay) => createLocalDateFromKey(leaveDay.date)),
    [currentYearLeaveDays],
  );

  const specialLeaveDates = useMemo(
    () =>
      currentYearLeaveDays
        .filter((leaveDay) => leaveDay.type === "SPECIAL_LEAVE")
        .map((leaveDay) => createLocalDateFromKey(leaveDay.date)),
    [currentYearLeaveDays],
  );

  return (
    <div className="relative">
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

          annualLeave: annualLeaveDates,

          halfDay: halfDayDates,

          specialLeave: specialLeaveDates,

          payday: (date) => {
            const adjustedPayday = getAdjustedPayday(
              date.getFullYear(),
              date.getMonth(),
              paydayDay,
              holidayDateKeys,
            );

            return toLocalDateKey(date) === toLocalDateKey(adjustedPayday);
          },
        }}
        modifiersClassNames={{
          weekend:
            "[&>button]:bg-red-50 [&>button]:text-red-500 [&>button]:hover:bg-red-100",

          holiday:
            "[&>button]:bg-red-100 [&>button]:font-semibold [&>button]:text-red-600 [&>button]:hover:bg-red-200",

          annualLeave:
            "[&>button]:!bg-amber-100 [&>button]:font-semibold [&>button]:!text-orange-700 [&>button]:hover:!bg-orange-200",

          halfDay:
            "[&>button]:!bg-yellow-100 [&>button]:font-semibold [&>button]:!text-yellow-700 [&>button]:hover:!bg-yellow-200",

          specialLeave:
            "[&>button]:!bg-amber-100 [&>button]:font-semibold [&>button]:!text-orange-700 [&>button]:hover:!bg-orange-200",

          payday:
            "[&>button]:relative [&>button]:font-bold after:absolute after:bottom-0.5 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-red-500",
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

      {isHolidayLoading && (
        <div className="pointer-events-none mt-2 flex h-6 items-center justify-center gap-1 rounded bg-neutral-50 text-[10px] font-medium text-neutral-500">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-500" />
          공휴일 확인 중
        </div>
      )}
    </div>
  );
}
