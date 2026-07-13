// app/api/leave/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";

import {
  deleteLeaveDay,
  updateLeaveDay,
  type LeaveType,
  type UpdateLeaveInput,
} from "@/lib/leave-file-store";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const LEAVE_TYPES: LeaveType[] = [
  "ANNUAL_LEAVE",
  "HALF_DAY_AM",
  "HALF_DAY_PM",
  "SPECIAL_LEAVE",
];

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  let body: UpdateLeaveInput;

  try {
    body = (await request.json()) as UpdateLeaveInput;
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

  if (body.date !== undefined && !isValidDateKey(body.date)) {
    return NextResponse.json(
      {
        message: "올바른 날짜를 입력하세요.",
      },
      {
        status: 400,
      },
    );
  }

  if (body.type !== undefined && !isValidLeaveType(body.type)) {
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

  const updatedLeave = await updateLeaveDay(id, {
    date: body.date,
    type: body.type,
    label: body.label,
  });

  if (!updatedLeave) {
    return NextResponse.json(
      {
        message: "연차 정보를 찾을 수 없습니다.",
      },
      {
        status: 404,
      },
    );
  }

  return NextResponse.json(updatedLeave);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const deleted = await deleteLeaveDay(id);

  if (!deleted) {
    return NextResponse.json(
      {
        message: "연차 정보를 찾을 수 없습니다.",
      },
      {
        status: 404,
      },
    );
  }

  return NextResponse.json({
    ok: true,
  });
}
