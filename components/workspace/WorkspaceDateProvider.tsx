"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { toLocalDateKey } from "@/components/day-picker/day-picker.utils";

type WorkspaceDateContextValue = {
  viewDate: string;
  setViewDate: (date: string) => void;
};

const WorkspaceDateContext = createContext<WorkspaceDateContextValue | null>(
  null,
);

export function WorkspaceDateProvider({ children }: { children: ReactNode }) {
  const [viewDate, setViewDate] = useState(() => toLocalDateKey(new Date()));

  const value = useMemo(
    () => ({
      viewDate,
      setViewDate,
    }),
    [viewDate],
  );

  return (
    <WorkspaceDateContext.Provider value={value}>
      {children}
    </WorkspaceDateContext.Provider>
  );
}

export function useWorkspaceDate() {
  const context = useContext(WorkspaceDateContext);

  if (!context) {
    throw new Error(
      "useWorkspaceDate는 WorkspaceDateProvider 안에서 사용해야 합니다.",
    );
  }

  return context;
}
