import { NextRequest, NextResponse } from "next/server";

import { readDailyActionLogsByDate } from "@/lib/daily-action-log-file-store";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? "";

  if (!DATE_PATTERN.test(date)) {
    return NextResponse.json(
      { message: "올바른 date 값이 필요합니다. 예: 2026-07-20" },
      { status: 400 },
    );
  }

  const logs = await readDailyActionLogsByDate(date);

  return NextResponse.json(logs);
}
