// app/api/sticky-notes/by-date/route.ts

import { NextRequest, NextResponse } from "next/server";

import { readStickyNotesByDate } from "@/lib/sticky-note-file-store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json(
      { message: "date 값이 필요합니다. 예: 2026-07-10" },
      { status: 400 },
    );
  }

  const notes = await readStickyNotesByDate(date);

  return NextResponse.json(notes);
}
