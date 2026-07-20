import { NextRequest, NextResponse } from "next/server";

import type { WorkStatus } from "@/components/dashboard/dashboard.types";
import { createProcessTask } from "@/lib/process-task-file-store";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const VALID_STATUSES: WorkStatus[] = [
  "BEFORE",
  "IN_PROGRESS",
  "COMPLETED",
  "ON_HOLD",
];

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    title?: unknown;
    memo?: unknown;
    status?: unknown;
    createdDate?: unknown;
  } | null;

  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const memo = typeof body?.memo === "string" ? body.memo : "";
  const status = body?.status;
  const createdDate =
    typeof body?.createdDate === "string" ? body.createdDate : "";

  if (
    !title ||
    !VALID_STATUSES.includes(status as WorkStatus) ||
    !DATE_PATTERN.test(createdDate)
  ) {
    return NextResponse.json(
      { message: "업무 제목, 상태, 생성일자를 올바르게 입력해주세요." },
      { status: 400 },
    );
  }

  const task = await createProcessTask(
    { title, memo, status: status as WorkStatus },
    createdDate,
  );

  return NextResponse.json(task, { status: 201 });
}
