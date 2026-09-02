"use client";

import { useEffect, useState } from "react";

import { useWorkspaceDate } from "@/components/workspace/WorkspaceDateProvider";

import {
  WORKSPACE_SEARCH_CLEAR_EVENT,
  WORKSPACE_SEARCH_SELECT_EVENT,
  type SearchResult,
  type SearchSelection,
} from "./search.types";

function HighlightText({ text, query }: { text: string; query: string }) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return text;

  const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"));

  return parts.map((part, index) =>
    part.toLocaleLowerCase("ko-KR") === trimmedQuery.toLocaleLowerCase("ko-KR") ? (
      <mark key={index} className="search-highlight">{part}</mark>
    ) : part,
  );
}

export default function WorkSearchPanel() {
  const { setViewDate } = useWorkspaceDate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("검색 결과를 불러오지 못했습니다.");
        const data = (await response.json()) as SearchResult[];
        setResults(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("통합 검색 실패:", error);
        setResults([]);
        setErrorMessage("검색 결과를 불러오지 못했습니다.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setSelectedKey(null);
    window.dispatchEvent(new Event(WORKSPACE_SEARCH_CLEAR_EVENT));
    if (!value.trim()) {
      setResults([]);
      setErrorMessage(null);
      setIsLoading(false);
    }
  };

  const selectResult = (result: SearchResult) => {
    const selection: SearchSelection = {
      id: result.id,
      type: result.type,
      date: result.date,
      query: query.trim(),
    };

    setSelectedKey(`${result.type}-${result.id}`);
    setViewDate(result.date);
    window.dispatchEvent(
      new CustomEvent<SearchSelection>(WORKSPACE_SEARCH_SELECT_EVENT, { detail: selection }),
    );
  };

  return (
    <section className="flex min-h-[620px] min-w-0 flex-col rounded-[12px] p-4 card-shadow card-paper-background">
      <header className="mb-4 shrink-0">
        <h2 className="text-[15px] font-bold tracking-[-0.02em] text-slate-800">통합 검색</h2>
        <p className="mt-0.5 text-[14px] text-slate-400">진행업무와 스티커노트를 한 번에 찾습니다.</p>
      </header>

      <div className="relative shrink-0">
        <svg viewBox="0 0 20 20" fill="none" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true">
          <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.7" />
          <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          placeholder="검색어를 입력하세요"
          aria-label="진행업무와 스티커노트 검색"
          autoComplete="off"
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-400/10"
        />
        {query && (
          <button type="button" onClick={() => handleQueryChange("")} aria-label="검색어 지우기" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">×</button>
        )}
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-soft" aria-live="polite">
        {!query.trim() ? (
          <div className="flex h-full min-h-80 items-center justify-center px-5 text-center">
            <p className="text-[13px] leading-6 text-slate-400">업무 제목·메모와<br />스티커 제목·내용을 검색할 수 있습니다.</p>
          </div>
        ) : isLoading ? (
          <div className="flex h-full min-h-80 items-center justify-center"><p className="text-[13px] text-slate-400">검색 중입니다.</p></div>
        ) : errorMessage ? (
          <div className="flex h-full min-h-80 items-center justify-center"><p className="text-[13px] font-medium text-red-600">{errorMessage}</p></div>
        ) : results.length === 0 ? (
          <div className="flex h-full min-h-80 items-center justify-center"><p className="text-[13px] text-slate-400">일치하는 결과가 없습니다.</p></div>
        ) : (
          <div className="space-y-2">
            <p className="px-1 text-[11px] font-medium text-slate-400">{results.length}개의 검색 결과</p>
            {results.map((result) => {
              const key = `${result.type}-${result.id}`;
              const isSelected = selectedKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectResult(result)}
                  className={`w-full rounded-xl border p-3 text-left transition ${isSelected ? "border-yellow-300 bg-yellow-50 shadow-[0_2px_8px_rgba(234,179,8,0.12)]" : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50"}`}
                >
                  <span className="flex items-start gap-2">
                    <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${result.type === "TASK" ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-700"}`}>{result.type === "TASK" ? "업무" : "스티커"}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-slate-800"><HighlightText text={result.title} query={query} /></span>
                  </span>
                  {result.snippet && <span className="mt-2 line-clamp-2 block text-[12px] leading-5 text-slate-500"><HighlightText text={result.snippet} query={query} /></span>}
                  <span className="mt-2 flex items-center justify-between text-[10px] text-slate-400"><span>{result.meta}</span><span>{result.date}</span></span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
