// lib/internal-schedule-file-store.ts

import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";

export type InternalSchedule = {
  id: string;
  date: string;
  title: string;
  memo: string;
  createdAt: string;
  updatedAt: string;
};

export type InternalScheduleFile = {
  updatedAt: string;
  schedules: InternalSchedule[];
};

export type CreateInternalScheduleInput = {
  date: string;
  title: string;
  memo?: string;
};

export type UpdateInternalScheduleInput = Partial<CreateInternalScheduleInput>;

const ROOT_DIRECTORY = path.join(process.cwd(), "data", "internal-schedules");

const FILE_PATH = path.join(ROOT_DIRECTORY, "internal-schedules.json");

const TEMP_FILE_PATH = path.join(ROOT_DIRECTORY, "internal-schedules.tmp.json");

const EMPTY_FILE: InternalScheduleFile = {
  updatedAt: new Date(0).toISOString(),
  schedules: [],
};

function sortSchedules(schedules: InternalSchedule[]): InternalSchedule[] {
  return [...schedules].sort((first, second) => {
    const dateComparison = first.date.localeCompare(second.date);

    if (dateComparison !== 0) {
      return dateComparison;
    }

    return first.createdAt.localeCompare(second.createdAt);
  });
}

async function writeScheduleFile(
  file: InternalScheduleFile,
): Promise<InternalScheduleFile> {
  await mkdir(ROOT_DIRECTORY, {
    recursive: true,
  });

  const normalizedFile: InternalScheduleFile = {
    updatedAt: new Date().toISOString(),
    schedules: sortSchedules(file.schedules),
  };

  await writeFile(
    TEMP_FILE_PATH,
    JSON.stringify(normalizedFile, null, 2),
    "utf-8",
  );

  await rename(TEMP_FILE_PATH, FILE_PATH);

  return normalizedFile;
}

async function ensureScheduleFile() {
  await mkdir(ROOT_DIRECTORY, {
    recursive: true,
  });

  try {
    await readFile(FILE_PATH, "utf-8");
  } catch {
    await writeScheduleFile(EMPTY_FILE);
  }
}

export async function readInternalScheduleFile(): Promise<InternalScheduleFile> {
  await ensureScheduleFile();

  try {
    const content = await readFile(FILE_PATH, "utf-8");

    const parsed = JSON.parse(content) as InternalScheduleFile;

    if (!Array.isArray(parsed.schedules)) {
      return EMPTY_FILE;
    }

    let needsMigration = false;
    const now = new Date().toISOString();

    const schedules = parsed.schedules.map((schedule): InternalSchedule => {
      if (!schedule.id || !schedule.createdAt || !schedule.updatedAt) {
        needsMigration = true;
      }

      return {
        id: schedule.id || crypto.randomUUID(),
        date: schedule.date,
        title: schedule.title || "내부 일정",
        memo: schedule.memo || "",
        createdAt: schedule.createdAt || now,
        updatedAt: schedule.updatedAt || now,
      };
    });

    const normalizedFile: InternalScheduleFile = {
      updatedAt: parsed.updatedAt || now,
      schedules: sortSchedules(schedules),
    };

    if (needsMigration) {
      return await writeScheduleFile(normalizedFile);
    }

    return normalizedFile;
  } catch (error) {
    console.error("내부 일정 파일 읽기 실패:", error);

    return EMPTY_FILE;
  }
}

export async function getInternalSchedules() {
  const file = await readInternalScheduleFile();

  return file.schedules;
}

export async function createInternalSchedule(
  input: CreateInternalScheduleInput,
): Promise<InternalSchedule> {
  const file = await readInternalScheduleFile();
  const now = new Date().toISOString();

  const schedule: InternalSchedule = {
    id: crypto.randomUUID(),
    date: input.date,
    title: input.title.trim(),
    memo: input.memo?.trim() || "",
    createdAt: now,
    updatedAt: now,
  };

  await writeScheduleFile({
    ...file,
    schedules: [...file.schedules, schedule],
  });

  return schedule;
}

export async function updateInternalSchedule(
  id: string,
  input: UpdateInternalScheduleInput,
): Promise<InternalSchedule | null> {
  const file = await readInternalScheduleFile();

  const existingSchedule = file.schedules.find(
    (schedule) => schedule.id === id,
  );

  if (!existingSchedule) {
    return null;
  }

  const updatedSchedule: InternalSchedule = {
    ...existingSchedule,
    ...input,
    title:
      input.title !== undefined ? input.title.trim() : existingSchedule.title,
    memo: input.memo !== undefined ? input.memo.trim() : existingSchedule.memo,
    updatedAt: new Date().toISOString(),
  };

  await writeScheduleFile({
    ...file,
    schedules: file.schedules.map((schedule) =>
      schedule.id === id ? updatedSchedule : schedule,
    ),
  });

  return updatedSchedule;
}

export async function deleteInternalSchedule(id: string): Promise<boolean> {
  const file = await readInternalScheduleFile();

  const exists = file.schedules.some((schedule) => schedule.id === id);

  if (!exists) {
    return false;
  }

  await writeScheduleFile({
    ...file,
    schedules: file.schedules.filter((schedule) => schedule.id !== id),
  });

  return true;
}

