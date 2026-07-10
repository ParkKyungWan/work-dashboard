// components/sticky-note/sticky-note.utils.ts

import type { StickyNote } from "./sticky-note.types";

export function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function createPostItColor(
  note: Pick<StickyNote, "colorHue" | "colorSaturation" | "colorLightness">,
) {
  return `hsl(${note.colorHue}, ${note.colorSaturation}%, ${note.colorLightness}%)`;
}

export function createRandomPostItColor() {
  return {
    /**
     * 노란색 계열 유지.
     * 너무 넓히면 연두/주황으로 튀기 때문에 좁게만 흔듦.
     */
    colorHue: randomBetween(47, 53),

    /**
     * 채도 차이.
     * 낮으면 탁한 노랑, 높으면 선명한 노랑.
     */
    colorSaturation: randomBetween(55, 85),

    /**
     * 명도 차이.
     * 낮으면 진한 포스트잇, 높으면 연한 포스트잇.
     */
    colorLightness: randomBetween(70, 90),
  };
}

export function getDockTop(index: number) {
  const baseTop = 120;
  const noteHeight = 240;
  const gap = 24;
  const randomOffset = ((index * 17) % 41) - 20;

  return baseTop + index * (noteHeight + gap) + randomOffset;
}

export function formatShortDate(dateString: string | null) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  const year = String(date.getFullYear()).slice(2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}.${month}.${day}`;
}

export function endOfToday() {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
}

export function addDaysFromBase(baseDateString: string | null, days: number) {
  const now = new Date();
  const baseDate = baseDateString ? new Date(baseDateString) : null;

  const date =
    baseDate && baseDate.getTime() > now.getTime() ? baseDate : endOfToday();

  date.setDate(date.getDate() + days);
  date.setHours(23, 59, 59, 999);

  return date;
}

export function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

/**
 * 새 스티커 생성 위치 계산
 *
 * 정책:
 * 1. 오른쪽 상단 우선
 * 2. 화면 안쪽에 무조건 생성
 * 3. 이미 차 있으면 아래로 이동
 * 4. 아래도 차면 왼쪽 컬럼으로 이동
 */
export function findNewStickyNotePosition(
  notes: StickyNote[],
  viewportWidth: number,
  viewportHeight: number,
) {
  const noteWidth = 260;
  const noteHeight = 230;

  const marginRight = 24;
  const marginTop = 72;
  const gap = 16;

  const minX = 16;
  const minY = 16;

  const firstX = Math.max(minX, viewportWidth - noteWidth - marginRight);

  const firstY = marginTop;

  const stepX = noteWidth + gap;
  const stepY = noteHeight + gap;

  const maxY = Math.max(minY, viewportHeight - noteHeight - 16);

  const occupiedRects = notes
    .filter((note) => note.x !== null && note.y !== null)
    .map((note) => ({
      x: note.x ?? 0,
      y: note.y ?? 0,
      width: note.width || noteWidth,
      height: note.height || noteHeight,
    }));

  function isOverlapping(
    candidate: { x: number; y: number; width: number; height: number },
    rect: { x: number; y: number; width: number; height: number },
  ) {
    return !(
      candidate.x + candidate.width < rect.x ||
      candidate.x > rect.x + rect.width ||
      candidate.y + candidate.height < rect.y ||
      candidate.y > rect.y + rect.height
    );
  }

  function isFree(x: number, y: number) {
    const candidate = {
      x,
      y,
      width: noteWidth,
      height: noteHeight,
    };

    return !occupiedRects.some((rect) => isOverlapping(candidate, rect));
  }

  for (let x = firstX; x >= minX; x -= stepX) {
    for (let y = firstY; y <= maxY; y += stepY) {
      if (isFree(x, y)) {
        return {
          x,
          y,
        };
      }
    }
  }

  return {
    x: firstX,
    y: firstY,
  };
}

export function clampStickyNotePosition(
  x: number,
  y: number,
  width: number,
  height: number,
  viewportWidth: number,
  viewportHeight: number,
) {
  const visibleRatio = 0.15;

  const minVisibleWidth = width * visibleRatio;
  const minVisibleHeight = height * visibleRatio;

  const minX = -width + minVisibleWidth;
  const maxX = viewportWidth - minVisibleWidth;

  const minY = -height + minVisibleHeight;
  const maxY = viewportHeight - minVisibleHeight;

  return {
    x: Math.min(Math.max(x, minX), maxX),
    y: Math.min(Math.max(y, minY), maxY),
  };
}
