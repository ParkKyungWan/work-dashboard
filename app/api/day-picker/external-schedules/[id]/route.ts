// app/api/external-schedules/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";

import {
  deleteExternalSchedule,
  updateExternalSchedule,
} from "@/lib/external-schedule-file-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          message: "외부 일정 ID가 없습니다.",
        },
        {
          status: 400,
        },
      );
    }

    const body = (await request.json()) as {
      date?: unknown;
      title?: unknown;
      memo?: unknown;
    };

    const date = typeof body.date === "string" ? body.date.trim() : undefined;

    const title =
      typeof body.title === "string" ? body.title.trim() : undefined;

    const memo = typeof body.memo === "string" ? body.memo.trim() : undefined;

    if (date !== undefined && (!date || !DATE_PATTERN.test(date))) {
      return NextResponse.json(
        {
          message: "올바른 날짜를 입력해주세요.",
        },
        {
          status: 400,
        },
      );
    }

    if (title !== undefined && !title) {
      return NextResponse.json(
        {
          message: "일정 이름을 입력해주세요.",
        },
        {
          status: 400,
        },
      );
    }

    if (title !== undefined && title.length > 100) {
      return NextResponse.json(
        {
          message: "일정 이름은 100자 이하로 입력해주세요.",
        },
        {
          status: 400,
        },
      );
    }

    if (memo !== undefined && memo.length > 500) {
      return NextResponse.json(
        {
          message: "메모는 500자 이하로 입력해주세요.",
        },
        {
          status: 400,
        },
      );
    }

    const schedule = await updateExternalSchedule(id, {
      ...(date !== undefined ? { date } : {}),
      ...(title !== undefined ? { title } : {}),
      ...(memo !== undefined ? { memo } : {}),
    });

    if (!schedule) {
      return NextResponse.json(
        {
          message: "외부 일정을 찾을 수 없습니다.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(schedule);
  } catch (error) {
    console.error("외부 일정 수정 실패:", error);

    return NextResponse.json(
      {
        message: "외부 일정 수정 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          message: "외부 일정 ID가 없습니다.",
        },
        {
          status: 400,
        },
      );
    }

    const deleted = await deleteExternalSchedule(id);

    if (!deleted) {
      return NextResponse.json(
        {
          message: "외부 일정을 찾을 수 없습니다.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      message: "외부 일정을 삭제했습니다.",
    });
  } catch (error) {
    console.error("외부 일정 삭제 실패:", error);

    return NextResponse.json(
      {
        message: "외부 일정 삭제 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}
