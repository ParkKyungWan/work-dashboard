"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DOCK_PROGRAM_IDS_KEY,
  DOCK_SETTINGS_EVENT,
  readDockProgramIds,
} from "@/lib/programs/program-settings";
import type {
  ProgramDefinition,
  ProgramWindowState,
} from "@/lib/programs/types";
import BottomHoverZone from "./BottomHoverZone";
import Dock from "./Dock";
import ProgramWindowLayer from "./ProgramWindowLayer";

const MIN_VIEWPORT_WIDTH = 1024;
const HIDE_DELAY_MS = 300;
const TRANSITION_MS = 260;

export default function ProgramDockArea() {
  const [programs, setPrograms] = useState<ProgramDefinition[]>([]);
  const [enabledIds, setEnabledIds] = useState<string[]>([]);
  const [windows, setWindows] = useState<ProgramWindowState[]>([]);
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null);
  const [isDockVisible, setIsDockVisible] = useState(false);
  const [isWideViewport, setIsWideViewport] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zIndexRef = useRef(100);

  useEffect(() => {
    const media = window.matchMedia(`(min-width: ${MIN_VIEWPORT_WIDTH}px)`);
    const syncViewport = () => setIsWideViewport(media.matches);
    syncViewport();
    media.addEventListener("change", syncViewport);
    return () => media.removeEventListener("change", syncViewport);
  }, []);

  useEffect(() => {
    fetch("/api/programs", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("프로그램 목록 조회 실패");
        return response.json() as Promise<ProgramDefinition[]>;
      })
      .then(setPrograms)
      .catch(() => setPrograms([]));
  }, []);

  useEffect(() => {
    const syncSettings = () => setEnabledIds(readDockProgramIds());
    const handleStorage = (event: StorageEvent) => {
      if (event.key === DOCK_PROGRAM_IDS_KEY) syncSettings();
    };
    syncSettings();
    window.addEventListener(DOCK_SETTINGS_EVENT, syncSettings);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(DOCK_SETTINGS_EVENT, syncSettings);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(
    () => () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    },
    [],
  );

  const programsById = useMemo(
    () => new Map(programs.map((program) => [program.id, program])),
    [programs],
  );
  const enabledPrograms = useMemo(
    () =>
      enabledIds
        .map((id) => programsById.get(id))
        .filter((program): program is ProgramDefinition => Boolean(program)),
    [enabledIds, programsById],
  );

  const showDock = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setIsDockVisible(true);
  };

  const scheduleDockHide = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(
      () => setIsDockVisible(false),
      HIDE_DELAY_MS,
    );
  };

  const activateWindow = useCallback((instanceId: string) => {
    const zIndex = ++zIndexRef.current;
    setWindows((current) =>
      current.map((item) =>
        item.instanceId === instanceId ? { ...item, zIndex } : item,
      ),
    );
    setActiveInstanceId(instanceId);
  }, []);

  const openProgram = (
    program: ProgramDefinition,
    origin: { x: number; y: number },
  ) => {
    const existing = windows.find(
      (item) => item.programId === program.id && item.status !== "closing",
    );
    if (existing && !program.allowMultiple) {
      activateWindow(existing.instanceId);
      return;
    }

    const instanceId = `${program.id}-${crypto.randomUUID()}`;
    const cascade = (windows.length % 6) * 24;
    const width = Math.min(
      program.defaultWidth,
      Math.max(program.minWidth, window.innerWidth - 32),
    );
    const height = Math.min(
      program.defaultHeight,
      Math.max(program.minHeight, window.innerHeight - 48),
    );
    const zIndex = ++zIndexRef.current;
    const nextWindow: ProgramWindowState = {
      instanceId,
      programId: program.id,
      x: Math.max(0, (window.innerWidth - width) / 2 + cascade),
      y: Math.max(16, (window.innerHeight - height) / 2 + cascade / 2),
      width,
      height,
      zIndex,
      status: "opening",
      originX: origin.x,
      originY: origin.y,
    };

    setWindows((current) => [...current, nextWindow]);
    setActiveInstanceId(instanceId);
    window.setTimeout(() => {
      setWindows((current) =>
        current.map((item) =>
          item.instanceId === instanceId ? { ...item, status: "open" } : item,
        ),
      );
    }, TRANSITION_MS);
  };

  const closeWindow = (instanceId: string) => {
    setWindows((current) =>
      current.map((item) =>
        item.instanceId === instanceId ? { ...item, status: "closing" } : item,
      ),
    );
    window.setTimeout(() => {
      setWindows((current) =>
        current.filter((item) => item.instanceId !== instanceId),
      );
      setActiveInstanceId((current) =>
        current === instanceId ? null : current,
      );
    }, TRANSITION_MS);
  };

  const updateWindow = useCallback(
    (instanceId: string, change: Partial<ProgramWindowState>) => {
      setWindows((current) =>
        current.map((item) =>
          item.instanceId === instanceId ? { ...item, ...change } : item,
        ),
      );
    },
    [],
  );

  const runningProgramIds = new Set(windows.map((item) => item.programId));
  const activeProgramId =
    windows.find((item) => item.instanceId === activeInstanceId)?.programId ??
    null;

  return (
    <>
      <ProgramWindowLayer
        programsById={programsById}
        windows={windows}
        activeInstanceId={activeInstanceId}
        onActivate={activateWindow}
        onClose={closeWindow}
        onChange={updateWindow}
      />

      {isWideViewport && enabledPrograms.length > 0 && (
        <>
          <BottomHoverZone onEnter={showDock} />
          <div
            className={`pointer-events-none fixed inset-x-0 bottom-4 z-[90] flex justify-center transition-[transform,opacity] duration-200 ease-out ${
              isDockVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-[calc(100%+24px)] opacity-0"
            }`}
            aria-hidden={!isDockVisible}
          >
            <Dock
              programs={enabledPrograms}
              runningProgramIds={runningProgramIds}
              activeProgramId={activeProgramId}
              onEnter={showDock}
              onLeave={scheduleDockHide}
              onOpen={openProgram}
            />
          </div>
        </>
      )}
    </>
  );
}
