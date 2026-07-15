// components/sticky-note/sticky-note.utils.ts

import type { StickyNote } from "./sticky-note.types";

type PostItColor = Pick<
  StickyNote,
  "colorHue" | "colorSaturation" | "colorLightness"
>;

const MATERIAL_MINIMAL_POST_IT_COLORS: PostItColor[] = [
  {
    // 노랑
    colorHue: 48,
    colorSaturation: 52,
    colorLightness: 87,
  },
  {
    // 연한 노랑
    colorHue: 52,
    colorSaturation: 46,
    colorLightness: 90,
  },
  {
    // 핑크
    colorHue: 342,
    colorSaturation: 46,
    colorLightness: 89,
  },
  {
    // 연한 핑크
    colorHue: 352,
    colorSaturation: 40,
    colorLightness: 91,
  },
  {
    // 주황
    colorHue: 26,
    colorSaturation: 50,
    colorLightness: 88,
  },
  {
    // 연한 주황
    colorHue: 20,
    colorSaturation: 44,
    colorLightness: 90,
  },
];

export function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function createPostItColor(
  note: Pick<StickyNote, "colorHue" | "colorSaturation" | "colorLightness">,
) {
  return `hsl(${note.colorHue}, ${note.colorSaturation}%, ${note.colorLightness}%)`;
}

export function createRandomPostItColor(): PostItColor {
  const selectedColor =
    MATERIAL_MINIMAL_POST_IT_COLORS[
      randomBetween(0, MATERIAL_MINIMAL_POST_IT_COLORS.length - 1)
    ];

  return {
    ...selectedColor,
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

function getBaseDateFromViewDate(viewDate?: string) {
  if (!viewDate) {
    return endOfToday();
  }

  const [year, month, day] = viewDate.split("-").map(Number);

  const date = new Date(year, month - 1, day);
  date.setHours(23, 59, 59, 999);

  return date;
}

export function addDaysFromBase(
  baseDateString: string | null,
  days: number,
  viewDate?: string,
) {
  const date = baseDateString
    ? new Date(baseDateString)
    : getBaseDateFromViewDate(viewDate);

  date.setDate(date.getDate() + days);
  date.setHours(23, 59, 59, 999);

  return date;
}

export function subDaysFromBase(
  baseDateString: string | null,
  days: number,
  viewDate?: string,
) {
  const date = baseDateString
    ? new Date(baseDateString)
    : getBaseDateFromViewDate(viewDate);

  date.setDate(date.getDate() - days);
  date.setHours(23, 59, 59, 999);

  return date;
}

export function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false;

  return new Date(expiresAt).getTime() < Date.now();
}

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
    candidate: {
      x: number;
      y: number;
      width: number;
      height: number;
    },
    rect: {
      x: number;
      y: number;
      width: number;
      height: number;
    },
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
