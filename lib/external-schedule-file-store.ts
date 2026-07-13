// lib/external-schedule-file-store.ts

import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";

export type ExternalSchedule = {
  id: string;
  date: string;
  title: string;
  memo: string;
  createdAt: string;
  updatedAt: string;
};

export type ExternalScheduleFile = {
  updatedAt: string;
  schedules: ExternalSchedule[];
};

export type CreateExternalScheduleInput = {
  date: string;
  title: string;
  memo?: string;
};

export type UpdateExternalScheduleInput = Partial<CreateExternalScheduleInput>;

const ROOT_DIRECTORY = path.join(process.cwd(), "data", "external-schedules");

const FILE_PATH = path.join(ROOT_DIRECTORY, "external-schedules.json");

const TEMP_FILE_PATH = path.join(ROOT_DIRECTORY, "external-schedules.tmp.json");

const EMPTY_FILE: ExternalScheduleFile = {
  updatedAt: new Date(0).toISOString(),
  schedules: [],
};

function sortSchedules(schedules: ExternalSchedule[]): ExternalSchedule[] {
  return [...schedules].sort((first, second) => {
    const dateComparison = first.date.localeCompare(second.date);

    if (dateComparison !== 0) {
      return dateComparison;
    }

    return first.createdAt.localeCompare(second.createdAt);
  });
}

async function writeScheduleFile(
  file: ExternalScheduleFile,
): Promise<ExternalScheduleFile> {
  await mkdir(ROOT_DIRECTORY, {
    recursive: true,
  });

  const normalizedFile: ExternalScheduleFile = {
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

export async function readExternalScheduleFile(): Promise<ExternalScheduleFile> {
  await ensureScheduleFile();

  try {
    const content = await readFile(FILE_PATH, "utf-8");

    const parsed = JSON.parse(content) as ExternalScheduleFile;

    if (!Array.isArray(parsed.schedules)) {
      return EMPTY_FILE;
    }

    let needsMigration = false;
    const now = new Date().toISOString();

    const schedules = parsed.schedules.map((schedule): ExternalSchedule => {
      if (!schedule.id || !schedule.createdAt || !schedule.updatedAt) {
        needsMigration = true;
      }

      return {
        id: schedule.id || crypto.randomUUID(),
        date: schedule.date,
        title: schedule.title || "외부 일정",
        memo: schedule.memo || "",
        createdAt: schedule.createdAt || now,
        updatedAt: schedule.updatedAt || now,
      };
    });

    const normalizedFile: ExternalScheduleFile = {
      updatedAt: parsed.updatedAt || now,
      schedules: sortSchedules(schedules),
    };

    if (needsMigration) {
      return await writeScheduleFile(normalizedFile);
    }

    return normalizedFile;
  } catch (error) {
    console.error("외부 일정 파일 읽기 실패:", error);

    return EMPTY_FILE;
  }
}

export async function getExternalSchedules() {
  const file = await readExternalScheduleFile();

  return file.schedules;
}

export async function createExternalSchedule(
  input: CreateExternalScheduleInput,
): Promise<ExternalSchedule> {
  const file = await readExternalScheduleFile();
  const now = new Date().toISOString();

  const schedule: ExternalSchedule = {
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

export async function updateExternalSchedule(
  id: string,
  input: UpdateExternalScheduleInput,
): Promise<ExternalSchedule | null> {
  const file = await readExternalScheduleFile();

  const existingSchedule = file.schedules.find(
    (schedule) => schedule.id === id,
  );

  if (!existingSchedule) {
    return null;
  }

  const updatedSchedule: ExternalSchedule = {
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

export async function deleteExternalSchedule(id: string): Promise<boolean> {
  const file = await readExternalScheduleFile();

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
