// lib/holiday-file-store.ts

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export type Holiday = {
  date: string;
  name: string;
};

export type HolidayCache = {
  year: number;
  fetchedAt: string;
  holidays: Holiday[];
};

const HOLIDAY_DIRECTORY = path.join(process.cwd(), "data", "holidays");

const getHolidayFilePath = (year: number) => {
  return path.join(HOLIDAY_DIRECTORY, `${year}.json`);
};

export async function readHolidayCache(
  year: number,
): Promise<HolidayCache | null> {
  try {
    const file = await readFile(getHolidayFilePath(year), "utf-8");

    const parsed = JSON.parse(file) as HolidayCache;

    if (parsed.year !== year || !Array.isArray(parsed.holidays)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function writeHolidayCache(
  year: number,
  holidays: Holiday[],
): Promise<HolidayCache> {
  await mkdir(HOLIDAY_DIRECTORY, {
    recursive: true,
  });

  const cache: HolidayCache = {
    year,
    fetchedAt: new Date().toISOString(),
    holidays,
  };

  await writeFile(
    getHolidayFilePath(year),
    JSON.stringify(cache, null, 2),
    "utf-8",
  );

  return cache;
}

export function isHolidayCacheFresh(cache: HolidayCache) {
  const currentYear = new Date().getFullYear();

  // 과거 연도 데이터는 변경 가능성이 거의 없으므로 계속 사용
  if (cache.year < currentYear) {
    return true;
  }

  const fetchedAt = new Date(cache.fetchedAt);

  if (Number.isNaN(fetchedAt.getTime())) {
    return false;
  }

  const sevenDays = 24 * 24 * 60 * 60 * 1000;
  //24일마다 리프레시(임시공휴일 생길수도 있으니)

  return Date.now() - fetchedAt.getTime() < sevenDays;
}
