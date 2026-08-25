"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type {
  ProgramDefinition,
  ProgramWindowState,
} from "@/lib/programs/types";
import ResizeHandles, { type ResizeDirection } from "./ResizeHandles";

type ProgramWindowProps = {
  program: ProgramDefinition;
  windowState: ProgramWindowState;
  isActive: boolean;
  onActivate: () => void;
  onClose: () => void;
  onChange: (change: Partial<ProgramWindowState>) => void;
};

type WindowRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Interaction = {
  kind: "move" | "resize";
  direction?: ResizeDirection;
  pointerId: number;
  captureTarget: HTMLElement;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
};

const HEADER_VISIBLE_WIDTH = 120;
const HEADER_VISIBLE_HEIGHT = 40;

export default function ProgramWindow({
  program,
  windowState,
  isActive,
  onActivate,
  onClose,
  onChange,
}: ProgramWindowProps) {
  const windowRef = useRef<HTMLElement>(null);
  const interactionRef = useRef<Interaction | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);

  const latestRectRef = useRef<WindowRect>({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (interactionRef.current) return;

    latestRectRef.current = {
      x: windowState.x,
      y: windowState.y,
      width: windowState.width,
      height: windowState.height,
    };
  }, [windowState.x, windowState.y, windowState.width, windowState.height]);

  useEffect(() => {
    const scheduleDomUpdate = (interaction: Interaction) => {
      if (animationFrameRef.current !== null) return;

      animationFrameRef.current = window.requestAnimationFrame(() => {
        animationFrameRef.current = null;

        const element = windowRef.current;
        if (!element) return;

        const rect = latestRectRef.current;

        if (interaction.kind === "move") {
          const offsetX = rect.x - interaction.startX;
          const offsetY = rect.y - interaction.startY;

          element.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
          return;
        }

        element.style.left = `${rect.x}px`;
        element.style.top = `${rect.y}px`;
        element.style.width = `${rect.width}px`;
        element.style.height = `${rect.height}px`;
      });
    };

    const handlePointerMove = (event: globalThis.PointerEvent) => {
      const interaction = interactionRef.current;

      if (!interaction || interaction.pointerId !== event.pointerId) {
        return;
      }

      const dx = event.clientX - interaction.startClientX;
      const dy = event.clientY - interaction.startClientY;

      if (interaction.kind === "move") {
        const x = Math.min(
          window.innerWidth - HEADER_VISIBLE_WIDTH,
          Math.max(
            -interaction.startWidth + HEADER_VISIBLE_WIDTH,
            interaction.startX + dx,
          ),
        );

        const y = Math.min(
          window.innerHeight - HEADER_VISIBLE_HEIGHT,
          Math.max(0, interaction.startY + dy),
        );

        latestRectRef.current = {
          x,
          y,
          width: interaction.startWidth,
          height: interaction.startHeight,
        };

        scheduleDomUpdate(interaction);
        return;
      }

      const direction = interaction.direction ?? "se";
      const movesLeft = direction.includes("w");
      const movesTop = direction.includes("n");
      const movesRight = direction.includes("e");
      const movesBottom = direction.includes("s");

      const widthDelta = movesLeft ? -dx : movesRight ? dx : 0;
      const heightDelta = movesTop ? -dy : movesBottom ? dy : 0;

      const width = Math.max(
        program.minWidth,
        interaction.startWidth + widthDelta,
      );

      const height = Math.max(
        program.minHeight,
        interaction.startHeight + heightDelta,
      );

      const x = movesLeft
        ? interaction.startX + interaction.startWidth - width
        : interaction.startX;

      const y = movesTop
        ? Math.max(0, interaction.startY + interaction.startHeight - height)
        : interaction.startY;

      latestRectRef.current = {
        x,
        y,
        width,
        height,
      };

      scheduleDomUpdate(interaction);
    };

    const finishInteraction = (event: globalThis.PointerEvent) => {
      const interaction = interactionRef.current;

      if (!interaction || interaction.pointerId !== event.pointerId) {
        return;
      }

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      const element = windowRef.current;
      const finalRect = latestRectRef.current;

      if (interaction.captureTarget.hasPointerCapture(interaction.pointerId)) {
        interaction.captureTarget.releasePointerCapture(interaction.pointerId);
      }

      interactionRef.current = null;

      onChangeRef.current({
        x: finalRect.x,
        y: finalRect.y,
        width: finalRect.width,
        height: finalRect.height,
      });

      if (element) {
        element.style.transform = "";
        element.style.left = `${finalRect.x}px`;
        element.style.top = `${finalRect.y}px`;
        element.style.width = `${finalRect.width}px`;
        element.style.height = `${finalRect.height}px`;
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", finishInteraction);
    window.addEventListener("pointercancel", finishInteraction);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishInteraction);
      window.removeEventListener("pointercancel", finishInteraction);

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [program.minHeight, program.minWidth]);

  const beginInteraction = (
    kind: Interaction["kind"],
    event: ReactPointerEvent<HTMLElement>,
    direction?: ResizeDirection,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const captureTarget = event.currentTarget;
    captureTarget.setPointerCapture(event.pointerId);

    onActivate();

    latestRectRef.current = {
      x: windowState.x,
      y: windowState.y,
      width: windowState.width,
      height: windowState.height,
    };

    interactionRef.current = {
      kind,
      direction,
      pointerId: event.pointerId,
      captureTarget,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: windowState.x,
      startY: windowState.y,
      startWidth: windowState.width,
      startHeight: windowState.height,
    };
  };

  return (
    <section
      ref={windowRef}
      role="dialog"
      aria-label={`${program.name} 프로그램 창`}
      className={`program-window pointer-events-auto fixed overflow-hidden rounded-xl border border-slate-300/80 bg-white transition-[filter,box-shadow] duration-200 ease-out ${
        isActive
          ? "brightness-100 saturate-100 shadow-2xl"
          : "brightness-[0.96] saturate-[0.8] shadow-lg"
      } ${windowState.status === "opening" ? "program-window-opening" : ""} ${
        windowState.status === "closing" ? "program-window-closing" : ""
      }`}
      style={
        {
          left: windowState.x,
          top: windowState.y,
          width: windowState.width,
          height: windowState.height,
          zIndex: windowState.zIndex,
          "--genie-x": `${
            windowState.originX - (windowState.x + windowState.width / 2)
          }px`,
          "--genie-y": `${
            windowState.originY - (windowState.y + windowState.height)
          }px`,
        } as CSSProperties
      }
      onPointerDown={onActivate}
    >
      <header
        className="flex h-10 touch-none select-none items-center gap-3 border-b border-neutral-200 bg-neutral-100 px-3"
        onPointerDown={(event) => beginInteraction("move", event)}
      >
        <span className="h-5 w-5" aria-hidden="true" />
        <h2 className="min-w-0 flex-1 truncate text-center text-sm font-semibold text-neutral-800">
          {program.name}
        </h2>

        <button
          type="button"
          aria-label={`${program.name} 종료`}
          title="종료"
          className="group flex h-5 w-5 items-center justify-center rounded-full bg-rose-400 text-xs font-bold text-red-950/10 transition-colors hover:text-red-950/70"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onClose}
        />
      </header>

      <div className="relative h-[calc(100%-40px)] bg-white">
        {!isLoaded && !loadFailed && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-500">
            프로그램을 불러오는 중입니다.
          </div>
        )}

        {loadFailed ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
            <strong className="text-neutral-800">
              프로그램을 열 수 없습니다.
            </strong>

            <span className="text-sm text-neutral-500">
              시작 파일과 프로그램 설정을 확인해 주세요.
            </span>
          </div>
        ) : (
          <iframe
            src={program.entryUrl}
            title={program.name}
            sandbox={[
              "allow-scripts",
              "allow-forms",
              "allow-downloads",
              "allow-modals",
              "allow-popups",
              "allow-popups-to-escape-sandbox",
              "allow-same-origin",
            ].join(" ")}
            allow={[
              "clipboard-write",
              "clipboard-read",
              "fullscreen",
              "autoplay",
              "camera",
              "microphone",
              "geolocation",
            ].join("; ")}
            allowFullScreen
            className={`h-full w-full border-0 ${
              isLoaded ? "block" : "invisible"
            }`}
            onLoad={() => setIsLoaded(true)}
            onError={() => setLoadFailed(true)}
          />
        )}
      </div>

      <ResizeHandles
        onResizeStart={(direction, event) =>
          beginInteraction("resize", event, direction)
        }
      />
    </section>
  );
}
