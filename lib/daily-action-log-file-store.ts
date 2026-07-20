import { mkdir, readFile, rename, unlink, writeFile } from "fs/promises";
import path from "path";

import type {
  DailyActionLogDraft,
  DailyActionLogItem,
} from "@/components/dashboard/dashboard.types";

type DailyActionLogIndexItem = Pick<
  DailyActionLogItem,
  "id" | "date" | "time" | "createdAt"
>;

const ROOT_DIRECTORY = path.join(process.cwd(), "data", "daily-action-logs");
const LOGS_DIRECTORY = path.join(ROOT_DIRECTORY, "logs");
const INDEX_FILE_PATH = path.join(ROOT_DIRECTORY, "index.json");

function createLogFilePath(id: string) {
  return path.join(LOGS_DIRECTORY, `${id}.json`);
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
  const temporaryPath = `${filePath}.${crypto.randomUUID()}.tmp`;

  await writeFile(temporaryPath, JSON.stringify(value, null, 2), "utf-8");
  await rename(temporaryPath, filePath);
}

async function ensureStore() {
  await mkdir(LOGS_DIRECTORY, { recursive: true });

  try {
    await readFile(INDEX_FILE_PATH, "utf-8");
  } catch {
    await writeJsonAtomically(INDEX_FILE_PATH, []);
  }
}

async function readIndex(): Promise<DailyActionLogIndexItem[]> {
  await ensureStore();

  try {
    const content = await readFile(INDEX_FILE_PATH, "utf-8");
    const parsed = JSON.parse(content) as unknown;

    return Array.isArray(parsed) ? (parsed as DailyActionLogIndexItem[]) : [];
  } catch {
    return [];
  }
}

async function writeIndex(items: DailyActionLogIndexItem[]) {
  await ensureStore();
  await writeJsonAtomically(INDEX_FILE_PATH, items);
}

async function readDailyActionLogById(
  id: string,
): Promise<DailyActionLogItem | null> {
  await ensureStore();

  try {
    const content = await readFile(createLogFilePath(id), "utf-8");

    return JSON.parse(content) as DailyActionLogItem;
  } catch {
    return null;
  }
}

export async function readDailyActionLogsByDate(date: string) {
  const indexItems = await readIndex();
  const matchingItems = indexItems.filter((item) => item.date === date);
  const logs = await Promise.all(
    matchingItems.map((item) => readDailyActionLogById(item.id)),
  );

  return logs
    .filter((log): log is DailyActionLogItem => log !== null)
    .sort((first, second) => {
      const timeComparison = second.time.localeCompare(first.time);

      return timeComparison !== 0
        ? timeComparison
        : second.createdAt.localeCompare(first.createdAt);
    });
}

export async function createDailyActionLog(
  date: string,
  draft: DailyActionLogDraft,
) {
  await ensureStore();

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

  await writeJsonAtomically(createLogFilePath(log.id), log);

  const indexItems = await readIndex();
  await writeIndex([
    {
      id: log.id,
      date: log.date,
      time: log.time,
      createdAt: log.createdAt,
    },
    ...indexItems,
  ]);

  return log;
}

export async function updateDailyActionLog(
  id: string,
  patch: Partial<DailyActionLogDraft>,
) {
  const existingLog = await readDailyActionLogById(id);

  if (!existingLog) {
    return null;
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

  await writeJsonAtomically(createLogFilePath(id), updatedLog);

  const indexItems = await readIndex();
  await writeIndex(
    indexItems.map((item) =>
      item.id === id ? { ...item, time: updatedLog.time } : item,
    ),
  );

  return updatedLog;
}

export async function deleteDailyActionLog(id: string) {
  const indexItems = await readIndex();
  const exists = indexItems.some((item) => item.id === id);

  if (!exists) {
    return false;
  }

  try {
    await unlink(createLogFilePath(id));
  } catch {
    // 인덱스에만 남은 기록도 함께 정리한다.
  }

  await writeIndex(indexItems.filter((item) => item.id !== id));

  return true;
}
