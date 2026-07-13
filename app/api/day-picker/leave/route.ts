// app/api/leave/route.ts

import { NextRequest, NextResponse } from "next/server";

import {
  createLeaveDay,
  getLeaveDays,
  type CreateLeaveInput,
  type LeaveType,
} from "@/lib/leave-file-store";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const LEAVE_TYPES: LeaveType[] = [
  "ANNUAL_LEAVE",
  "HALF_DAY_AM",
  "HALF_DAY_PM",
  "SPECIAL_LEAVE",
];

const isValidLeaveType = (value: unknown): value is LeaveType => {
  return typeof value === "string" && LEAVE_TYPES.includes(value as LeaveType);
};

const isValidDateKey = (value: unknown): value is string => {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

export async function GET(request: NextRequest) {
  const yearParameter = request.nextUrl.searchParams.get("year");

  const days = await getLeaveDays();

  if (!yearParameter) {
    return NextResponse.json(days);
  }

  if (!/^\d{4}$/.test(yearParameter)) {
    return NextResponse.json(
      {
        message: "올바른 연도를 입력하세요.",
      },
      {
        status: 400,
      },
    );
  }

  const filteredDays = days.filter((day) =>
    day.date.startsWith(`${yearParameter}-`),
  );

  return NextResponse.json(filteredDays);
}

export async function POST(request: NextRequest) {
  let body: Partial<CreateLeaveInput>;

  try {
    body = (await request.json()) as Partial<CreateLeaveInput>;
  } catch {
    return NextResponse.json(
      {
        message: "요청 내용을 읽을 수 없습니다.",
      },
      {
        status: 400,
      },
    );
  }

  if (!isValidDateKey(body.date)) {
    return NextResponse.json(
      {
        message: "올바른 날짜를 선택하세요.",
      },
      {
        status: 400,
      },
    );
  }

  if (!isValidLeaveType(body.type)) {
    return NextResponse.json(
      {
        message: "올바른 연차 유형을 선택하세요.",
      },
      {
        status: 400,
      },
    );
  }

  if (body.label !== undefined && typeof body.label !== "string") {
    return NextResponse.json(
      {
        message: "연차 이름이 올바르지 않습니다.",
      },
      {
        status: 400,
      },
    );
  }

  const leaveDay = await createLeaveDay({
    date: body.date,
    type: body.type,
    label: body.label,
  });

  return NextResponse.json(leaveDay, {
    status: 201,
  });
}
