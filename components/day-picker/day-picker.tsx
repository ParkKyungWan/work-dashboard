// components/day-picker/AppDayPicker.tsx

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DayPicker } from "@daypicker/react";
import { ko } from "@daypicker/react/locale";

import type {
  AppDayPickerProps,
  Holiday,
  HolidayApiResponse,
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

  /**
   * 연도별 공휴일을 브라우저 메모리에 보관합니다.
   *
   * 예:
   * {
   *   2026: [...],
   *   2027: [...]
   * }
   */
  const [holidaysByYear, setHolidaysByYear] = useState<
    Record<number, Holiday[]>
  >({});

  const [isHolidayLoading, setIsHolidayLoading] = useState(false);

  /**
   * 같은 연도를 중복 요청하지 않도록 기록합니다.
   */
  const requestedYearsRef = useRef<Set<number>>(new Set());

  const loadHolidays = useCallback(async (year: number) => {
    /**
     * 이미 정상적으로 요청했거나 요청 중인 연도면
     * 다시 호출하지 않습니다.
     */
    if (requestedYearsRef.current.has(year)) {
      return;
    }

    requestedYearsRef.current.add(year);
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
      /**
       * 실패한 연도는 다음에 다시 시도할 수 있도록
       * 요청 기록에서 제거합니다.
       */
      requestedYearsRef.current.delete(year);

      console.error(`${year}년 공휴일 조회 실패:`, error);
    } finally {
      setIsHolidayLoading(false);
    }
  }, []);

  /**
   * 외부에서 선택 날짜가 변경되면
   * 달력도 그 날짜가 포함된 월로 이동합니다.
   */
  useEffect(() => {
    setCalendarMonth(selectedDate);
  }, [selectedDate]);

  /**
   * 달력에서 보고 있는 연도가 바뀔 때
   * 해당 연도의 공휴일을 불러옵니다.
   */
  useEffect(() => {
    const year = calendarMonth.getFullYear();

    void loadHolidays(year);
  }, [calendarMonth, loadHolidays]);

  const calendarYear = calendarMonth.getFullYear();

  const currentYearHolidays = holidaysByYear[calendarYear] ?? [];

  /**
   * DayPicker의 holiday modifier에 전달할 Date 배열입니다.
   */
  const holidayDates = useMemo(
    () =>
      currentYearHolidays.map((holiday) =>
        createLocalDateFromKey(holiday.date),
      ),
    [currentYearHolidays],
  );

  /**
   * 월급일 계산에서 빠르게 공휴일 여부를 확인하기 위한 Set입니다.
   */
  const holidayDateKeys = useMemo(
    () => new Set(currentYearHolidays.map((holiday) => holiday.date)),
    [currentYearHolidays],
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

          payday: (date) => {
            /**
             * modifier는 전달받은 날짜별로 실행됩니다.
             *
             * 25일이 주말이나 공휴일이면
             * 이전 영업일까지 이동한 날짜를 계산합니다.
             */
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
        <div className="pointer-events-none absolute left-1/2 top-10 z-30 flex -translate-x-1/2 items-center gap-1 rounded bg-white/90 px-2 py-1 text-[11px] font-medium text-neutral-700 shadow-sm">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-500" />
          공휴일 확인 중
        </div>
      )}
    </div>
  );
}
