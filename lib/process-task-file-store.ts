import { mkdir, readFile, rename, unlink, writeFile } from "fs/promises";
import path from "path";

import type {
  ProcessTask,
  ProcessTaskDraft,
  WorkStatus,
} from "@/components/dashboard/dashboard.types";

type ProcessTaskIndexItem = Pick<
  ProcessTask,
  | "id"
  | "status"
  | "createdDate"
  | "completedDate"
  | "order"
  | "createdAt"
>;

type LegacyProcessTaskFile = {
  updatedAt: string;
  tasks: ProcessTask[];
};

type UpdateProcessTaskInput = {
  memo?: string;
  status?: WorkStatus;
  viewDate?: string;
};

const ROOT_DIRECTORY = path.join(process.cwd(), "data", "process-tasks");
const TASKS_DIRECTORY = path.join(ROOT_DIRECTORY, "tasks");
const INDEX_FILE_PATH = path.join(ROOT_DIRECTORY, "index.json");

// 단일 파일 저장 방식을 사용하던 버전의 경로다. 최초 실행 시 자동 이전한다.
const LEGACY_FILE_PATH = path.join(ROOT_DIRECTORY, "process-tasks.json");
const LEGACY_BACKUP_FILE_PATH = path.join(
  ROOT_DIRECTORY,
  "process-tasks.migrated.json",
);

function createTaskFilePath(id: string) {
  return path.join(TASKS_DIRECTORY, `${id}.json`);
}

function toIndexItem(task: ProcessTask): ProcessTaskIndexItem {
  return {
    id: task.id,
    status: task.status,
    createdDate: task.createdDate,
    completedDate: task.completedDate,
    order: task.order,
    createdAt: task.createdAt,
  };
}

function sortIndexItems(items: ProcessTaskIndexItem[]) {
  return [...items].sort((first, second) => {
    if (first.order !== second.order) {
      return first.order - second.order;
    }

    return first.createdAt.localeCompare(second.createdAt);
  });
}

async function writeJsonAtomically(filePath: string, value: unknown) {
  const temporaryPath = `${filePath}.${crypto.randomUUID()}.tmp`;

  await writeFile(temporaryPath, JSON.stringify(value, null, 2), "utf-8");
  await rename(temporaryPath, filePath);
}

async function migrateLegacyFile() {
  let tasks: ProcessTask[] = [];
  let hasLegacyFile = false;

  try {
    const content = await readFile(LEGACY_FILE_PATH, "utf-8");
    const legacyFile = JSON.parse(content) as LegacyProcessTaskFile;

    hasLegacyFile = true;
    tasks = Array.isArray(legacyFile.tasks) ? legacyFile.tasks : [];
  } catch {
    tasks = [];
  }

  await Promise.all(
    tasks.map((task) => writeJsonAtomically(createTaskFilePath(task.id), task)),
  );
  await writeJsonAtomically(
    INDEX_FILE_PATH,
    sortIndexItems(tasks.map(toIndexItem)),
  );

  if (hasLegacyFile) {
    await rename(LEGACY_FILE_PATH, LEGACY_BACKUP_FILE_PATH).catch((error) => {
      console.error("기존 진행 업무 파일 백업 실패:", error);
    });
  }
}

async function ensureStore() {
  await mkdir(TASKS_DIRECTORY, { recursive: true });

  try {
    await readFile(INDEX_FILE_PATH, "utf-8");
  } catch {
    await migrateLegacyFile();
  }
}

async function readIndex(): Promise<ProcessTaskIndexItem[]> {
  await ensureStore();

  try {
    const content = await readFile(INDEX_FILE_PATH, "utf-8");
    const parsed = JSON.parse(content) as unknown;

    return Array.isArray(parsed)
      ? sortIndexItems(parsed as ProcessTaskIndexItem[])
      : [];
  } catch (error) {
    console.error("진행 업무 인덱스 읽기 실패:", error);

    return [];
  }
}

async function writeIndex(items: ProcessTaskIndexItem[]) {
  await ensureStore();
  await writeJsonAtomically(INDEX_FILE_PATH, sortIndexItems(items));
}

async function readProcessTaskById(id: string): Promise<ProcessTask | null> {
  await ensureStore();

  try {
    const content = await readFile(createTaskFilePath(id), "utf-8");

    return JSON.parse(content) as ProcessTask;
  } catch {
    return null;
  }
}

export async function readProcessTasksByDate(viewDate: string) {
  const indexItems = await readIndex();
  const visibleItems = indexItems.filter(
    (item) =>
      item.createdDate <= viewDate &&
      (item.completedDate === null || viewDate <= item.completedDate),
  );
  const tasks = await Promise.all(
    visibleItems.map((item) => readProcessTaskById(item.id)),
  );

  return tasks.filter((task): task is ProcessTask => task !== null);
}

export async function createProcessTask(
  draft: ProcessTaskDraft,
  createdDate: string,
) {
  const indexItems = await readIndex();
  const now = new Date().toISOString();
  const nextOrder = indexItems.reduce(
    (highestOrder, item) => Math.max(highestOrder, item.order),
    -1,
  ) + 1;

  const task: ProcessTask = {
    id: crypto.randomUUID(),
    title: draft.title.trim(),
    memo: draft.memo.trim(),
    status: draft.status,
    createdDate,
    completedDate: draft.status === "COMPLETED" ? createdDate : null,
    order: nextOrder,
    createdAt: now,
    updatedAt: now,
  };

  await writeJsonAtomically(createTaskFilePath(task.id), task);
  await writeIndex([...indexItems, toIndexItem(task)]);

  return task;
}

export async function updateProcessTask(
  id: string,
  input: UpdateProcessTaskInput,
) {
  const existingTask = await readProcessTaskById(id);

  if (!existingTask) {
    return null;
  }

  let completedDate = existingTask.completedDate;

  if (input.status === "COMPLETED") {
    completedDate = input.viewDate ?? existingTask.completedDate;
  } else if (input.status !== undefined) {
    completedDate = null;
  }

  const updatedTask: ProcessTask = {
    ...existingTask,
    memo: input.memo !== undefined ? input.memo : existingTask.memo,
    status: input.status ?? existingTask.status,
    completedDate,
    updatedAt: new Date().toISOString(),
  };

  await writeJsonAtomically(createTaskFilePath(id), updatedTask);

  const indexItems = await readIndex();
  await writeIndex(
    indexItems.map((item) =>
      item.id === id ? toIndexItem(updatedTask) : item,
    ),
  );

  return updatedTask;
}

export async function deleteProcessTask(id: string) {
  const indexItems = await readIndex();
  const exists = indexItems.some((item) => item.id === id);

  if (!exists) {
    return false;
  }

  try {
    await unlink(createTaskFilePath(id));
  } catch {
    // 인덱스에만 남은 항목도 삭제할 수 있도록 계속 진행한다.
  }

  await writeIndex(indexItems.filter((item) => item.id !== id));

  return true;
}
