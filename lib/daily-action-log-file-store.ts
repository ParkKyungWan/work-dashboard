import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";

import type {
  DailyActionLogDraft,
  DailyActionLogItem,
} from "@/components/dashboard/dashboard.types";

const ROOT_DIRECTORY = path.join(process.cwd(), "data", "daily-action-logs");
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const pendingWrites = new Map<string, Promise<void>>();

function createLogsFilePath(date: string) {
  const match = DATE_PATTERN.exec(date);

  if (!match) {
    throw new Error(`Invalid daily action log date: ${date}`);
  }

  const [, year, month, day] = match;

  return path.join(ROOT_DIRECTORY, year, month, day, "logs.json");
}

function createActionLogId() {
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const timePart = [
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");
  const random = Math.random().toString(36).slice(2, 8);

  return `action_${datePart}_${timePart}_${random}`;
}

async function writeJsonAtomically(filePath: string, value: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });

  const temporaryPath = `${filePath}.${crypto.randomUUID()}.tmp`;

  await writeFile(temporaryPath, JSON.stringify(value, null, 2), "utf-8");
  await rename(temporaryPath, filePath);
}

async function readLogs(date: string): Promise<DailyActionLogItem[]> {
  try {
    const content = await readFile(createLogsFilePath(date), "utf-8");
    const parsed = JSON.parse(content) as unknown;

    return Array.isArray(parsed) ? (parsed as DailyActionLogItem[]) : [];
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return [];
    }

    throw error;
  }
}

function sortLogs(logs: DailyActionLogItem[]) {
  return logs.sort((first, second) => {
    const timeComparison = second.time.localeCompare(first.time);

    return timeComparison !== 0
      ? timeComparison
      : second.createdAt.localeCompare(first.createdAt);
  });
}

async function updateDateFile<T>(
  date: string,
  update: (logs: DailyActionLogItem[]) => { logs: DailyActionLogItem[]; result: T },
) {
  const filePath = createLogsFilePath(date);
  const previousWrite = pendingWrites.get(filePath) ?? Promise.resolve();
  let result!: T;

  const currentWrite = previousWrite
    .catch(() => undefined)
    .then(async () => {
      const currentLogs = await readLogs(date);
      const updateResult = update(currentLogs);

      result = updateResult.result;
      await writeJsonAtomically(filePath, sortLogs(updateResult.logs));
    });

  pendingWrites.set(filePath, currentWrite);

  try {
    await currentWrite;
    return result;
  } finally {
    if (pendingWrites.get(filePath) === currentWrite) {
      pendingWrites.delete(filePath);
    }
  }
}

export async function readDailyActionLogsByDate(date: string) {
  return sortLogs(await readLogs(date));
}

export async function createDailyActionLog(
  date: string,
  draft: DailyActionLogDraft,
) {
  const now = new Date().toISOString();
  const log: DailyActionLogItem = {
    id: createActionLogId(),
    date,
    target: draft.target.trim(),
    description: draft.description.trim(),
    time: draft.time,
    createdAt: now,
    updatedAt: now,
  };

  return updateDateFile(date, (logs) => ({
    logs: [log, ...logs],
    result: log,
  }));
}

export async function updateDailyActionLog(
  date: string,
  id: string,
  patch: Partial<DailyActionLogDraft>,
) {
  return updateDateFile<DailyActionLogItem | null>(date, (logs) => {
    const existingLog = logs.find((log) => log.id === id);

    if (!existingLog) {
      return { logs, result: null };
    }

    const updatedLog: DailyActionLogItem = {
      ...existingLog,
      target:
        patch.target !== undefined ? patch.target.trim() : existingLog.target,
      description:
        patch.description !== undefined
          ? patch.description.trim()
          : existingLog.description,
      time: patch.time ?? existingLog.time,
      updatedAt: new Date().toISOString(),
    };

    return {
      logs: logs.map((log) => (log.id === id ? updatedLog : log)),
      result: updatedLog,
    };
  });
}

export async function deleteDailyActionLog(date: string, id: string) {
  return updateDateFile(date, (logs) => {
    const remainingLogs = logs.filter((log) => log.id !== id);

    return {
      logs: remainingLogs,
      result: remainingLogs.length !== logs.length,
    };
  });
}
