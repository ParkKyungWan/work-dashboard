import { NextRequest, NextResponse } from "next/server";

import type { WorkStatus } from "@/components/dashboard/dashboard.types";
import {
  deleteProcessTask,
  updateProcessTask,
} from "@/lib/process-task-file-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const VALID_STATUSES: WorkStatus[] = [
  "BEFORE",
  "IN_PROGRESS",
  "COMPLETED",
  "ON_HOLD",
];

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    memo?: unknown;
    status?: unknown;
    viewDate?: unknown;
  } | null;

  if (!body) {
    return NextResponse.json(
      { message: "수정할 값이 필요합니다." },
      { status: 400 },
    );
  }

  const memo = typeof body.memo === "string" ? body.memo : undefined;
  const status = body.status as WorkStatus | undefined;
  const viewDate =
    typeof body.viewDate === "string" ? body.viewDate : undefined;

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { message: "올바른 상태가 필요합니다." },
      { status: 400 },
    );
  }

  if (
    status === "COMPLETED" &&
    (viewDate === undefined || !DATE_PATTERN.test(viewDate))
  ) {
    return NextResponse.json(
      { message: "완료 처리할 viewDate가 필요합니다." },
      { status: 400 },
    );
  }

  const task = await updateProcessTask(id, { memo, status, viewDate });

  if (!task) {
    return NextResponse.json(
      { message: "진행 업무를 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  return NextResponse.json(task);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  if (!(await deleteProcessTask(id))) {
    return NextResponse.json(
      { message: "진행 업무를 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
