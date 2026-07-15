// app/api/sticky-notes/route.ts

import { NextRequest, NextResponse } from "next/server";

import {
  createStickyNote,
  readAllStickyNotes,
} from "@/lib/sticky-note-file-store";

export async function GET() {
  const notes = await readAllStickyNotes();

  return NextResponse.json(notes);
}

export async function POST(request: NextRequest) {
  let body: {
    x?: number;
    y?: number;
    dockOrder?: number;
    startDate?: string;
    colorHue?: number;
    colorSaturation?: number;
    colorLightness?: number;
  } = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const note = await createStickyNote({
    x: body.x ?? null,
    y: body.y ?? null,
    dockOrder: body.dockOrder,
    startDate: body.startDate,
    colorHue: body.colorHue,
    colorSaturation: body.colorSaturation,
    colorLightness: body.colorLightness,
  });

  return NextResponse.json(note);
}
