// app/api/sticky-notes/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";

import {
  deleteStickyNote,
  readStickyNoteById,
  updateStickyNote,
} from "@/lib/sticky-note-file-store";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const note = await readStickyNoteById(id);

    if (!note) {
      return NextResponse.json(
        { message: "스티커를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error("스티커 단건 조회 실패:", error);

    return NextResponse.json(
      { message: "스티커를 읽는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const note = await updateStickyNote(id, body);

    if (!note) {
      return NextResponse.json(
        { message: "스티커를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error("스티커 수정 실패:", error);

    return NextResponse.json(
      { message: "스티커를 저장하는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  await deleteStickyNote(id);

  return NextResponse.json({ ok: true });
}
