// lib/sticky-note-file-store.ts

import { mkdir, readFile, readdir, unlink, writeFile } from "fs/promises";
import path from "path";

import type {
  StickyNote,
  StickyNoteIndexItem,
} from "@/components/sticky-note/sticky-note.types";

const ROOT_DIR = path.join(process.cwd(), "data", "sticky-notes");
const NOTES_DIR = path.join(ROOT_DIR, "notes");
const INDEX_FILE_PATH = path.join(ROOT_DIR, "index.json");

async function ensureStore() {
  await mkdir(NOTES_DIR, { recursive: true });

  try {
    await readFile(INDEX_FILE_PATH, "utf-8");
  } catch {
    await writeFile(INDEX_FILE_PATH, JSON.stringify([], null, 2), "utf-8");
  }
}

function createNoteFilePath(id: string) {
  return path.join(NOTES_DIR, `${id}.json`);
}

function createStickyNoteId() {
  const now = new Date();

  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  const random = Math.random().toString(36).slice(2, 8);

  return `note_${yyyy}${mm}${dd}_${hh}${mi}${ss}_${random}`;
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createLocalDateFromKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function createStartOfLocalDayISOString(dateKey: string) {
  const date = createLocalDateFromKey(dateKey);
  date.setHours(0, 0, 0, 0);

  return date.toISOString();
}

function createEndOfLocalDayISOString(dateKey: string) {
  const date = createLocalDateFromKey(dateKey);
  date.setHours(23, 59, 59, 999);

  return date.toISOString();
}

function toIndexItem(note: StickyNote): StickyNoteIndexItem {
  return {
    id: note.id,
    title: note.title,
    status: note.status,
    startDate: note.startDate,
    expiresAt: note.expiresAt,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

async function readIndex(): Promise<StickyNoteIndexItem[]> {
  await ensureStore();

  const content = await readFile(INDEX_FILE_PATH, "utf-8");

  try {
    return JSON.parse(content) as StickyNoteIndexItem[];
  } catch {
    return [];
  }
}

async function writeIndex(indexItems: StickyNoteIndexItem[]) {
  await ensureStore();

  await writeFile(
    INDEX_FILE_PATH,
    JSON.stringify(indexItems, null, 2),
    "utf-8",
  );
}

async function upsertIndexItem(note: StickyNote) {
  const indexItems = await readIndex();
  const nextItem = toIndexItem(note);

  const exists = indexItems.some((item) => item.id === note.id);

  const nextIndexItems = exists
    ? indexItems.map((item) => (item.id === note.id ? nextItem : item))
    : [nextItem, ...indexItems];

  await writeIndex(nextIndexItems);
}

async function removeIndexItem(id: string) {
  const indexItems = await readIndex();
  const nextIndexItems = indexItems.filter((item) => item.id !== id);

  await writeIndex(nextIndexItems);
}

/**
 * 선택한 날짜 기준으로 해당 스티커가 보여야 하는지 판단합니다.
 *
 * 기준:
 * - 스티커 시작일 <= 선택 날짜의 끝
 * - 스티커 종료일이 없거나, 종료일 >= 선택 날짜의 시작
 */
function isDateInRange(
  targetDateString: string,
  startDateString: string,
  expiresAtString: string | null,
) {
  const targetStart = createLocalDateFromKey(targetDateString);
  targetStart.setHours(0, 0, 0, 0);

  const targetEnd = createLocalDateFromKey(targetDateString);
  targetEnd.setHours(23, 59, 59, 999);

  const start = new Date(startDateString);
  const end = expiresAtString ? new Date(expiresAtString) : null;

  return (
    start.getTime() <= targetEnd.getTime() &&
    (!end || end.getTime() >= targetStart.getTime())
  );
}

function isNowInRange(note: StickyNoteIndexItem) {
  const now = Date.now();

  const start = new Date(note.startDate).getTime();

  if (start > now) {
    return false;
  }

  if (!note.expiresAt) {
    return true;
  }

  return new Date(note.expiresAt).getTime() >= now;
}

export async function readStickyNoteById(
  id: string,
): Promise<StickyNote | null> {
  await ensureStore();

  try {
    const filePath = createNoteFilePath(id);
    const content = await readFile(filePath, "utf-8");

    return JSON.parse(content) as StickyNote;
  } catch {
    return null;
  }
}

export async function readStickyNotesByIds(ids: string[]) {
  const notes = await Promise.all(ids.map((id) => readStickyNoteById(id)));

  return notes.filter((note): note is StickyNote => note !== null);
}

export async function readAllStickyNotes(): Promise<StickyNote[]> {
  await ensureStore();

  const files = await readdir(NOTES_DIR);
  const jsonFiles = files.filter((file) => file.endsWith(".json"));

  const notes = await Promise.all(
    jsonFiles.map(async (file) => {
      const content = await readFile(path.join(NOTES_DIR, file), "utf-8");

      return JSON.parse(content) as StickyNote;
    }),
  );

  return notes.sort((a, b) => {
    if (a.dockOrder !== b.dockOrder) {
      return a.dockOrder - b.dockOrder;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function readActiveStickyNotes(): Promise<StickyNote[]> {
  const indexItems = await readIndex();

  const activeIds = indexItems
    .filter((item) => item.status === "ACTIVE")
    .filter(isNowInRange)
    .map((item) => item.id);

  const notes = await readStickyNotesByIds(activeIds);

  return notes.sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }

    if (a.dockOrder !== b.dockOrder) {
      return a.dockOrder - b.dockOrder;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function readStickyNotesByDate(
  date: string,
): Promise<StickyNote[]> {
  const indexItems = await readIndex();

  const ids = indexItems
    .filter((item) => item.status === "ACTIVE")
    .filter((item) => isDateInRange(date, item.startDate, item.expiresAt))
    .map((item) => item.id);

  const notes = await readStickyNotesByIds(ids);

  return notes.sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }

    if (a.dockOrder !== b.dockOrder) {
      return a.dockOrder - b.dockOrder;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function createStickyNote(options?: {
  x?: number | null;
  y?: number | null;
  dockOrder?: number;
  startDate?: string;
}): Promise<StickyNote> {
  await ensureStore();

  const now = new Date().toISOString();
  const existingIndexItems = await readIndex();

  const id = createStickyNoteId();

  /**
   * 기준 날짜.
   *
   * 프론트에서 viewDate를 넘기면 그 날짜 기준으로 생성합니다.
   * 없으면 실제 오늘 기준으로 생성합니다.
   */
  const baseDateKey = options?.startDate ?? toLocalDateKey(new Date());

  const note: StickyNote = {
    id,
    title: "필기 스티커",
    content: "",
    status: "ACTIVE",

    /**
     * 기본 정책:
     * 새 스티커는 당일 스티커입니다.
     * 필요하면 사용자가 직접 기간을 연장합니다.
     */
    startDate: createStartOfLocalDayISOString(baseDateKey),
    expiresAt: createEndOfLocalDayISOString(baseDateKey),

    dockSide: "RIGHT",
    dockOrder: options?.dockOrder ?? existingIndexItems.length,

    x: options?.x ?? null,
    y: options?.y ?? null,
    width: 260,
    height: 230,

    collapsed: false,
    pinned: false,

    /**
     * 노란색 계열은 유지하고,
     * 명도/채도 중심으로 랜덤하게 조절합니다.
     */
    colorHue: randomBetween(47, 53),
    colorSaturation: randomBetween(55, 85),
    colorLightness: randomBetween(70, 90),

    dailyLogId: null,
    archivedAt: null,

    createdAt: now,
    updatedAt: now,
  };

  await writeStickyNote(note);

  return note;
}

export async function writeStickyNote(note: StickyNote): Promise<StickyNote> {
  await ensureStore();

  const updatedNote: StickyNote = {
    ...note,
    updatedAt: new Date().toISOString(),
  };

  const filePath = createNoteFilePath(updatedNote.id);

  await writeFile(filePath, JSON.stringify(updatedNote, null, 2), "utf-8");
  await upsertIndexItem(updatedNote);

  return updatedNote;
}

export async function updateStickyNote(
  id: string,
  patch: Partial<StickyNote>,
): Promise<StickyNote | null> {
  const note = await readStickyNoteById(id);

  if (!note) {
    return null;
  }

  const updatedNote: StickyNote = {
    ...note,
    ...patch,
    id: note.id,
    createdAt: note.createdAt,
    updatedAt: new Date().toISOString(),
  };

  await writeStickyNote(updatedNote);

  return updatedNote;
}

export async function deleteStickyNote(id: string): Promise<boolean> {
  await ensureStore();

  try {
    await unlink(createNoteFilePath(id));
    await removeIndexItem(id);

    return true;
  } catch {
    await removeIndexItem(id);

    return false;
  }
}
