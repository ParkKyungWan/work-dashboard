"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import type {
  ProgramDefinition,
  ProgramWindowState,
} from "@/lib/programs/types";

import ProgramWindow from "./ProgramWindow";

type ProgramWindowLayerProps = {
  programsById: Map<string, ProgramDefinition>;
  windows: ProgramWindowState[];
  activeInstanceId: string | null;
  onActivate: (instanceId: string) => void;
  onClose: (instanceId: string) => void;
  onChange: (instanceId: string, change: Partial<ProgramWindowState>) => void;
};

export default function ProgramWindowLayer({
  programsById,
  windows,
  activeInstanceId,
  onActivate,
  onClose,
  onChange,
}: ProgramWindowLayerProps) {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalRoot(document.body);
  }, []);

  if (!portalRoot) {
    return null;
  }

  return (
    <>
      {windows.map((windowState) => {
        const program = programsById.get(windowState.programId);

        if (!program) {
          return null;
        }

        return createPortal(
          <ProgramWindow
            program={program}
            windowState={windowState}
            isActive={windowState.instanceId === activeInstanceId}
            onActivate={() => onActivate(windowState.instanceId)}
            onClose={() => onClose(windowState.instanceId)}
            onChange={(change) => onChange(windowState.instanceId, change)}
          />,
          portalRoot,
          windowState.instanceId,
        );
      })}
    </>
  );
}
