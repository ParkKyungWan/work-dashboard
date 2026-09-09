"use client";

import { useMemo, useState } from "react";

import type { StickyNote } from "@/components/sticky-note/sticky-note.types";

import type { ProcessTask } from "./dashboard.types";

type DailyActionLogProps = {
  viewDate: string;
  tasks: ProcessTask[];
  notes: StickyNote[];
  searchQuery: string;
  onSearchQueryChange: (nextQuery: string) => void;
  onOpenTaskResult: (task: ProcessTask) => void;
  onOpenNoteResult: (note: StickyNote) => void;
};

type SearchResultItem = {
  id: string;
  label: string;
  meta: string;
  previewText: string;
  previewSegments: Array<{ text: string; match: boolean }>;
  type: "task" | "note";
  payload: ProcessTask | StickyNote;
};

const normalizeSearchText = (value: string) => {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
};

const truncateText = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
};

const buildPreviewSegments = (
  source: string,
  query: string,
  maxLength = 80,
) => {
  const normalizedSource = normalizeSearchText(source);
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [{ text: truncateText(normalizedSource, maxLength), match: false }];
  }

  const lowerSource = normalizedSource.toLowerCase();
  const lowerQuery = normalizedQuery.toLowerCase();
  const matchIndex = lowerSource.indexOf(lowerQuery);

  if (matchIndex === -1) {
    return [{ text: truncateText(normalizedSource, maxLength), match: false }];
  }

  const start = Math.max(0, matchIndex - 22);
  const end = Math.min(
    normalizedSource.length,
    matchIndex + normalizedQuery.length + 22,
  );
  let snippet = normalizedSource.slice(start, end).trim();

  if (start > 0) {
    snippet = `…${snippet}`;
  }

  if (end < normalizedSource.length) {
    snippet = `${snippet}…`;
  }

  const lowerSnippet = snippet.toLowerCase();
  const snippetMatchIndex = lowerSnippet.indexOf(lowerQuery);

  if (snippetMatchIndex === -1) {
    return [{ text: truncateText(snippet, maxLength), match: false }];
  }

  const before = snippet.slice(0, snippetMatchIndex);
  const matchText = snippet.slice(
    snippetMatchIndex,
    snippetMatchIndex + normalizedQuery.length,
  );
  const after = snippet.slice(snippetMatchIndex + normalizedQuery.length);

  return [
    { text: before || "", match: false },
    { text: matchText, match: true },
    { text: after || "", match: false },
  ];
};

export default function DailyActionLog({
  tasks,
  notes,
  searchQuery,
  onSearchQueryChange,
  onOpenTaskResult,
  onOpenNoteResult,
}: DailyActionLogProps) {
  const [isFocused, setIsFocused] = useState(false);

  const results = useMemo<SearchResultItem[]>(() => {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      return [];
    }

    const query = trimmedQuery.toLowerCase();

    const taskResults: SearchResultItem[] = tasks
      .filter((task) => {
        const haystack = normalizeSearchText(`${task.title} ${task.memo}`);
        return haystack.toLowerCase().includes(query);
      })
      .map((task) => {
        const sourceText = `${task.title} ${task.memo}`;
        const previewSegments = buildPreviewSegments(sourceText, trimmedQuery);

        return {
          id: task.id,
          label: task.title,
          meta: task.createdDate,
          previewText: previewSegments.map((segment) => segment.text).join(""),
          previewSegments,
          type: "task",
          payload: task,
        };
      });

    const noteResults: SearchResultItem[] = notes
      .filter((note) => {
        const haystack = normalizeSearchText(`${note.title} ${note.content}`);
        return haystack.toLowerCase().includes(query);
      })
      .map((note) => {
        const sourceText = `${note.title} ${normalizeSearchText(note.content)}`;
        const previewSegments = buildPreviewSegments(sourceText, trimmedQuery);

        return {
          id: note.id,
          label: note.title || "스티커 메모",
          meta: note.startDate,
          previewText: previewSegments.map((segment) => segment.text).join(""),
          previewSegments,
          type: "note",
          payload: note,
        };
      });

    return [...taskResults, ...noteResults];
  }, [notes, searchQuery, tasks]);

  const hasResults = results.length > 0;

  return (
    <section className="flex min-h-[620px] min-w-0 flex-col rounded-[12px] p-4 card-shadow card-paper-background">
      <header className="mb-4 shrink-0">
        <h1 className="text-[15px] font-bold tracking-[-0.02em] text-slate-800">
          검색
        </h1>
      </header>

      <div className="mb-4 shrink-0">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => window.setTimeout(() => setIsFocused(false), 120)}
            placeholder="진행업무 / 스티커를 검색하세요"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 pr-9 text-[13px] font-medium text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-400/10"
          />

          {searchQuery.trim() && (
            <button
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
              }}
              onClick={() => {
                onSearchQueryChange("");
                const input = document.activeElement as HTMLInputElement | null;

                if (input && input instanceof HTMLInputElement) {
                  input.blur();
                }
              }}
              aria-label="검색어 지우기"
              className="absolute right-2.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-600 transition hover:bg-slate-300"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-200 bg-slate-50/50">
        {!searchQuery.trim() ? (
          <div className="flex h-full min-h-[420px] items-center justify-center px-4 text-center">
            <p className="text-[13px] leading-6 text-slate-400">
              {isFocused
                ? "검색어를 입력하면 업무와 스티커를 같이 찾을 수 있습니다."
                : "진행업무와 스티커 내용을 함께 검색할 수 있습니다."}
            </p>
          </div>
        ) : hasResults ? (
          <div className="flex h-full min-h-0 flex-col overflow-y-auto p-2 scrollbar-soft">
            {results.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                type="button"
                onClick={() => {
                  if (result.type === "task") {
                    onOpenTaskResult(result.payload as ProcessTask);
                    return;
                  }

                  onOpenNoteResult(result.payload as StickyNote);
                }}
                className="mb-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
              >
                <div className="mb-1 flex min-w-0 items-center gap-2">
                  <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                    {result.type === "task" ? "업무" : "스티커"}
                  </span>
                  <span className="min-w-0 truncate text-[12px] text-slate-400">
                    {result.meta}
                  </span>
                </div>
                <div className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-semibold text-slate-800">
                  {result.previewSegments.map((segment, index) =>
                    segment.match ? (
                      <mark
                        key={`${result.id}-${index}`}
                        className="rounded bg-yellow-300/75 px-0.5 text-slate-900 dark:bg-yellow-500/80 dark:text-white"
                      >
                        {segment.text}
                      </mark>
                    ) : (
                      <span key={`${result.id}-${index}`}>{segment.text}</span>
                    ),
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex h-full min-h-[420px] items-center justify-center px-4 text-center">
            <p className="text-[13px] text-slate-400">검색 결과가 없습니다.</p>
          </div>
        )}
      </div>
    </section>
  );
}
