import { NextRequest, NextResponse } from "next/server";

import { readProcessTasksByDate } from "@/lib/process-task-file-store";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? "";

  if (!DATE_PATTERN.test(date)) {
    return NextResponse.json(
      { message: "올바른 date 값이 필요합니다. 예: 2026-07-20" },
      { status: 400 },
    );
  }

  return NextResponse.json(await readProcessTasksByDate(date));
}
