"use client";

import { useEffect, useState } from "react";
import {
  readDockProgramIds,
  writeDockProgramIds,
} from "@/lib/programs/program-settings";
import type { ProgramDefinition } from "@/lib/programs/types";

export default function ProgramShortcutSettings() {
  const [programs, setPrograms] = useState<ProgramDefinition[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : readDockProgramIds(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    fetch("/api/programs", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("프로그램 목록 조회 실패");
        return response.json() as Promise<ProgramDefinition[]>;
      })
      .then((items) => {
        setPrograms(items);
        setSelectedIds((current) =>
          current.filter((id) => items.some((item) => item.id === id)),
        );
      })
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }, []);

  const toggleProgram = (id: string) => {
    setSelectedIds((current) => {
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];
      writeDockProgramIds(next);
      return next;
    });
  };

  if (isLoading) {
    return <p className="text-sm text-neutral-500">프로그램을 불러오는 중입니다.</p>;
  }

  if (hasError) {
    return (
      <p className="text-sm text-red-600">
        프로그램 목록을 불러오지 못했습니다.
      </p>
    );
  }

  if (programs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 p-5 text-sm text-neutral-500">
        <code>public/programs/프로그램-id</code> 폴더에 프로그램을 등록하면
        이곳에 표시됩니다.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {programs.map((program) => {
        const checked = selectedIds.includes(program.id);
        return (
          <label
            key={program.id}
            className="flex cursor-pointer items-center gap-4 rounded-lg border border-neutral-200 px-4 py-3 transition-colors hover:bg-neutral-50"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggleProgram(program.id)}
              className="h-4 w-4 accent-blue-600"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={program.iconUrl}
              alt=""
              className="h-10 w-10 rounded-lg border border-neutral-200 object-cover"
            />
            <span className="min-w-0 flex-1">
              <strong className="block text-sm text-neutral-900">
                {program.name}
              </strong>
              <span className="mt-0.5 block truncate text-xs text-neutral-500">
                {program.description}
              </span>
            </span>
          </label>
        );
      })}
      <p className="pt-2 text-xs text-neutral-500">
        선택한 순서대로 화면 하단 Dock에 표시됩니다.
      </p>
    </div>
  );
}
