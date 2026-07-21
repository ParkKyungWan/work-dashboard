// app/api/internal-schedules/route.ts

import { NextRequest, NextResponse } from "next/server";

import {
  createInternalSchedule,
  getInternalSchedules,
} from "@/lib/internal-schedule-file-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function GET() {
  try {
    const schedules = await getInternalSchedules();

    return NextResponse.json(schedules);
  } catch (error) {
    console.error("내부 일정 목록 조회 실패:", error);

    return NextResponse.json(
      {
        message: "내부 일정 목록을 불러오지 못했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      date?: unknown;
      title?: unknown;
      memo?: unknown;
    };

    const date = typeof body.date === "string" ? body.date.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const memo = typeof body.memo === "string" ? body.memo.trim() : "";

    if (!date || !DATE_PATTERN.test(date)) {
      return NextResponse.json(
        {
          message: "올바른 날짜를 입력해주세요.",
        },
        {
          status: 400,
        },
      );
    }

    if (!title) {
      return NextResponse.json(
        {
          message: "일정 이름을 입력해주세요.",
        },
        {
          status: 400,
        },
      );
    }

    if (title.length > 100) {
      return NextResponse.json(
        {
          message: "일정 이름은 100자 이하로 입력해주세요.",
        },
        {
          status: 400,
        },
      );
    }

    if (memo.length > 500) {
      return NextResponse.json(
        {
          message: "메모는 500자 이하로 입력해주세요.",
        },
        {
          status: 400,
        },
      );
    }

    const schedule = await createInternalSchedule({
      date,
      title,
      memo,
    });

    return NextResponse.json(schedule, {
      status: 201,
    });
  } catch (error) {
    console.error("내부 일정 생성 실패:", error);

    return NextResponse.json(
      {
        message: "내부 일정 저장 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}

