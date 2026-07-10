// app/api/sticky-notes/active/route.ts

import { NextResponse } from "next/server";

import { readActiveStickyNotes } from "@/lib/sticky-note-file-store";

export async function GET() {
  const notes = await readActiveStickyNotes();

  return NextResponse.json(notes);
}
