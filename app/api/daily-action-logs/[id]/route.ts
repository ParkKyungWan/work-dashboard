import { NextRequest, NextResponse } from "next/server";

import {
  deleteDailyActionLog,
  updateDailyActionLog,
} from "@/lib/daily-action-log-file-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    target?: unknown;
    description?: unknown;
    time?: unknown;
  } | null;

  if (!body) {
    return NextResponse.json(
      { message: "수정할 값이 필요합니다." },
      { status: 400 },
    );
  }

  const patch: {
    target?: string;
    description?: string;
    time?: string;
  } = {};

  if (body.target !== undefined) {
    if (typeof body.target !== "string" || !body.target.trim()) {
      return NextResponse.json(
        { message: "대상은 비워둘 수 없습니다." },
        { status: 400 },
      );
    }
    patch.target = body.target;
  }

  if (body.description !== undefined) {
    if (typeof body.description !== "string" || !body.description.trim()) {
      return NextResponse.json(
        { message: "조치 내용은 비워둘 수 없습니다." },
        { status: 400 },
      );
    }
    patch.description = body.description;
  }

  if (body.time !== undefined) {
    if (typeof body.time !== "string" || !TIME_PATTERN.test(body.time)) {
      return NextResponse.json(
        { message: "올바른 시간이 필요합니다." },
        { status: 400 },
      );
    }
    patch.time = body.time;
  }

  const log = await updateDailyActionLog(id, patch);

  if (!log) {
    return NextResponse.json(
      { message: "조치 기록을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  return NextResponse.json(log);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const deleted = await deleteDailyActionLog(id);

  if (!deleted) {
    return NextResponse.json(
      { message: "조치 기록을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
