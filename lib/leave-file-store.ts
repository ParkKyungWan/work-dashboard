// lib/leave-file-store.ts

import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";

export type LeaveType =
  | "ANNUAL_LEAVE"
  | "HALF_DAY_AM"
  | "HALF_DAY_PM"
  | "SPECIAL_LEAVE";

export type LeaveDay = {
  id: string;
  date: string;
  type: LeaveType;
  label: string;
  createdAt: string;
  updatedAt: string;
};

export type LeaveFile = {
  updatedAt: string;
  days: LeaveDay[];
};

export type CreateLeaveInput = {
  date: string;
  type: LeaveType;
  label?: string;
};

export type UpdateLeaveInput = Partial<CreateLeaveInput>;

const LEAVE_DIRECTORY = path.join(process.cwd(), "data", "leave");

const LEAVE_FILE_PATH = path.join(LEAVE_DIRECTORY, "leave-days.json");

const TEMP_FILE_PATH = path.join(LEAVE_DIRECTORY, "leave-days.tmp.json");

const EMPTY_LEAVE_FILE: LeaveFile = {
  updatedAt: new Date(0).toISOString(),
  days: [],
};

const sortLeaveDays = (days: LeaveDay[]) => {
  return [...days].sort((first, second) => {
    const dateComparison = first.date.localeCompare(second.date);

    if (dateComparison !== 0) {
      return dateComparison;
    }

    return first.createdAt.localeCompare(second.createdAt);
  });
};

async function ensureLeaveFile() {
  await mkdir(LEAVE_DIRECTORY, {
    recursive: true,
  });

  try {
    await readFile(LEAVE_FILE_PATH, "utf-8");
  } catch {
    await writeLeaveFile(EMPTY_LEAVE_FILE);
  }
}

async function writeLeaveFile(data: LeaveFile) {
  await mkdir(LEAVE_DIRECTORY, {
    recursive: true,
  });

  const normalizedData: LeaveFile = {
    ...data,
    updatedAt: new Date().toISOString(),
    days: sortLeaveDays(data.days),
  };

  /*
   * 임시 파일을 먼저 만든 뒤 실제 파일로 교체합니다.
   * 저장 도중 프로그램이 종료돼 JSON이 깨질 가능성을 줄입니다.
   */
  await writeFile(
    TEMP_FILE_PATH,
    JSON.stringify(normalizedData, null, 2),
    "utf-8",
  );

  await rename(TEMP_FILE_PATH, LEAVE_FILE_PATH);

  return normalizedData;
}

export async function readLeaveFile(): Promise<LeaveFile> {
  await ensureLeaveFile();

  try {
    const content = await readFile(LEAVE_FILE_PATH, "utf-8");

    const parsed = JSON.parse(content) as LeaveFile;

    if (!Array.isArray(parsed.days)) {
      return EMPTY_LEAVE_FILE;
    }

    let needsMigration = false;

    const normalizedDays: LeaveDay[] = parsed.days.map((day) => {
      const now = new Date().toISOString();

      if (!day.id) {
        needsMigration = true;
      }

      return {
        ...day,
        id: day.id || crypto.randomUUID(),
        label: day.label || getDefaultLeaveLabel(day.type),
        createdAt: day.createdAt || now,
        updatedAt: day.updatedAt || now,
      };
    });

    const normalizedFile: LeaveFile = {
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      days: sortLeaveDays(normalizedDays),
    };

    if (needsMigration) {
      return await writeLeaveFile(normalizedFile);
    }

    return normalizedFile;
  } catch (error) {
    console.error("연차 파일 읽기 실패:", error);

    return EMPTY_LEAVE_FILE;
  }
}

export async function getLeaveDays() {
  const file = await readLeaveFile();

  return file.days;
}

export async function createLeaveDay(
  input: CreateLeaveInput,
): Promise<LeaveDay> {
  const file = await readLeaveFile();
  const now = new Date().toISOString();

  const leaveDay: LeaveDay = {
    id: crypto.randomUUID(),
    date: input.date,
    type: input.type,
    label: input.label?.trim() || getDefaultLeaveLabel(input.type),
    createdAt: now,
    updatedAt: now,
  };

  await writeLeaveFile({
    ...file,
    days: [...file.days, leaveDay],
  });

  return leaveDay;
}

export async function updateLeaveDay(
  id: string,
  input: UpdateLeaveInput,
): Promise<LeaveDay | null> {
  const file = await readLeaveFile();
  const existingLeave = file.days.find((day) => day.id === id);

  if (!existingLeave) {
    return null;
  }

  const nextType = input.type ?? existingLeave.type;

  const updatedLeave: LeaveDay = {
    ...existingLeave,
    ...input,
    type: nextType,
    label:
      input.label !== undefined
        ? input.label.trim() || getDefaultLeaveLabel(nextType)
        : existingLeave.label,
    updatedAt: new Date().toISOString(),
  };

  await writeLeaveFile({
    ...file,
    days: file.days.map((day) => (day.id === id ? updatedLeave : day)),
  });

  return updatedLeave;
}

export async function deleteLeaveDay(id: string) {
  const file = await readLeaveFile();

  const exists = file.days.some((day) => day.id === id);

  if (!exists) {
    return false;
  }

  await writeLeaveFile({
    ...file,
    days: file.days.filter((day) => day.id !== id),
  });

  return true;
}

export function getDefaultLeaveLabel(type: LeaveType) {
  switch (type) {
    case "ANNUAL_LEAVE":
      return "연차";

    case "HALF_DAY_AM":
      return "오전 반차";

    case "HALF_DAY_PM":
      return "오후 반차";

    case "SPECIAL_LEAVE":
      return "특별휴가";
  }
}
