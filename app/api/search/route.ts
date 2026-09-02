import { NextRequest, NextResponse } from "next/server";

import type { WorkStatus } from "@/components/dashboard/dashboard.types";
import { readAllProcessTasks } from "@/lib/process-task-file-store";
import { readAllStickyNotes } from "@/lib/sticky-note-file-store";

const RESULT_LIMIT = 50;
const STATUS_LABELS: Record<WorkStatus, string> = {
  BEFORE: "진행 전",
  IN_PROGRESS: "진행 중",
  ON_HOLD: "보류",
  COMPLETED: "완료",
};

function normalize(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase("ko-KR").replace(/\s+/g, " ").trim();
}

function htmlToText(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div)>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function createSnippet(text: string, query: string) {
  const cleanText = text.replace(/\s+/g, " ").trim();
  const index = normalize(cleanText).indexOf(query);
  const start = Math.max(0, index - 28);
  const end = Math.min(cleanText.length, start + 88);
  return `${start > 0 ? "…" : ""}${cleanText.slice(start, end)}${end < cleanText.length ? "…" : ""}`;
}

function toDateKey(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export async function GET(request: NextRequest) {
  const query = normalize(request.nextUrl.searchParams.get("q")?.slice(0, 100) ?? "");
  if (!query) return NextResponse.json([]);

  const [tasks, notes] = await Promise.all([readAllProcessTasks(), readAllStickyNotes()]);

  const results = [
    ...tasks.flatMap((task) => {
      const titleMatches = normalize(task.title).includes(query);
      const memoMatches = normalize(task.memo).includes(query);
      if (!titleMatches && !memoMatches) return [];

      return [{
        id: task.id,
        type: "TASK" as const,
        title: task.title || "제목 없는 업무",
        snippet: createSnippet(memoMatches ? task.memo : task.title, query),
        date: task.createdDate,
        meta: STATUS_LABELS[task.status],
        matchedField: titleMatches ? "TITLE" as const : "CONTENT" as const,
        updatedAt: task.updatedAt,
      }];
    }),
    ...notes.flatMap((note) => {
      if (note.status !== "ACTIVE") return [];
      const content = htmlToText(note.content);
      const titleMatches = normalize(note.title).includes(query);
      const contentMatches = normalize(content).includes(query);
      if (!titleMatches && !contentMatches) return [];

      return [{
        id: note.id,
        type: "NOTE" as const,
        title: note.title || "제목 없는 스티커",
        snippet: createSnippet(contentMatches ? content : note.title, query),
        date: toDateKey(note.startDate),
        meta: "스티커노트",
        matchedField: titleMatches ? "TITLE" as const : "CONTENT" as const,
        updatedAt: note.updatedAt,
      }];
    }),
  ]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, RESULT_LIMIT)
    .map(({ updatedAt: _updatedAt, ...result }) => result);

  return NextResponse.json(results);
}
