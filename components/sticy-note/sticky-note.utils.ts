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
    colorHue: 50,
    colorSaturation: 65,
    colorLightness: randomBetween(72, 88),
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
