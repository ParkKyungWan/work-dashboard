import { NextRequest, NextResponse } from "next/server";

import { createDailyActionLog } from "@/lib/daily-action-log-file-store";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    date?: unknown;
    target?: unknown;
    description?: unknown;
    time?: unknown;
  } | null;

  const date = typeof body?.date === "string" ? body.date : "";
  const target = typeof body?.target === "string" ? body.target.trim() : "";
  const description =
    typeof body?.description === "string" ? body.description.trim() : "";
  const time = typeof body?.time === "string" ? body.time : "";

  if (!DATE_PATTERN.test(date)) {
    return NextResponse.json(
      { message: "올바른 날짜가 필요합니다." },
      { status: 400 },
    );
  }

  if (!target || !description || !TIME_PATTERN.test(time)) {
    return NextResponse.json(
      { message: "대상, 조치 내용, 시간을 모두 올바르게 입력해주세요." },
      { status: 400 },
    );
  }

  const log = await createDailyActionLog(date, {
    target,
    description,
    time,
  });

  return NextResponse.json(log, { status: 201 });
}
