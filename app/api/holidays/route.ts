// app/api/holidays/route.ts

import { XMLParser } from "fast-xml-parser";
import { NextRequest, NextResponse } from "next/server";

import {
  isHolidayCacheFresh,
  readHolidayCache,
  type Holiday,
  writeHolidayCache,
} from "@/lib/holiday-file-store";

type HolidayApiItem = {
  dateName?: string;
  isHoliday?: string;
  locdate?: number | string;
  seq?: number | string;
};

type HolidayApiResponse = {
  response?: {
    header?: {
      resultCode?: string | number;
      resultMsg?: string;
    };

    body?: {
      items?: {
        item?: HolidayApiItem | HolidayApiItem[];
      };

      numOfRows?: number | string;
      pageNo?: number | string;
      totalCount?: number | string;
    };
  };
};

const HOLIDAY_API_URL =
  "http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo";

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
  parseTagValue: true,
});

const isValidYear = (value: string | null): value is string => {
  if (!value || !/^\d{4}$/.test(value)) {
    return false;
  }

  const year = Number(value);

  return year >= 1900 && year <= 2100;
};

const normalizeItems = (
  item: HolidayApiItem | HolidayApiItem[] | undefined,
): HolidayApiItem[] => {
  if (!item) {
    return [];
  }

  return Array.isArray(item) ? item : [item];
};

const convertLocdateToDateKey = (locdate: number | string) => {
  const rawDate = String(locdate).padStart(8, "0");

  return [rawDate.slice(0, 4), rawDate.slice(4, 6), rawDate.slice(6, 8)].join(
    "-",
  );
};

const createRequestUrl = ({
  year,
  month,
  serviceKey,
}: {
  year: number;
  month: number;
  serviceKey: string;
}) => {
  const query = new URLSearchParams({
    solYear: String(year),
    solMonth: String(month).padStart(2, "0"),
    pageNo: "1",
    numOfRows: "100",
  });

  /*
   * 공공데이터포털 인증키는 Encoding/Decoding 상태에 따라
   * URLSearchParams로 다시 인코딩하면 문제가 생길 수 있습니다.
   *
   * ServiceKey는 직접 붙이고 나머지 값만 URLSearchParams로 만듭니다.
   */
  return (
    `${HOLIDAY_API_URL}` + `?ServiceKey=${serviceKey}` + `&${query.toString()}`
  );
};

async function fetchMonthHolidays({
  year,
  month,
  serviceKey,
}: {
  year: number;
  month: number;
  serviceKey: string;
}): Promise<Holiday[]> {
  const requestUrl = createRequestUrl({
    year,
    month,
    serviceKey,
  });

  const response = await fetch(requestUrl, {
    cache: "no-store",
  });

  const responseText = await response.text();

  if (!response.ok) {
    console.error(`공휴일 API HTTP 오류: ${response.status}`, responseText);

    throw new Error(`공휴일 API HTTP 오류: ${response.status}`);
  }

  let parsed: HolidayApiResponse;

  try {
    parsed = xmlParser.parse(responseText) as HolidayApiResponse;
  } catch (error) {
    console.error(`${year}년 ${month}월 공휴일 XML 파싱 실패:`, error);

    throw new Error(`${year}년 ${month}월 공휴일 응답을 해석하지 못했습니다.`);
  }

  const rawResultCode = parsed.response?.header?.resultCode;

  const resultCode = String(rawResultCode ?? "").padStart(2, "0");

  const resultMessage =
    parsed.response?.header?.resultMsg ?? "알 수 없는 공공데이터 API 오류";

  if (resultCode !== "00") {
    throw new Error(`공휴일 API 오류: ${resultCode} ${resultMessage}`);
  }

  const items = normalizeItems(parsed.response?.body?.items?.item);

  return items
    .filter((item) => {
      return (
        item.isHoliday === "Y" &&
        item.locdate !== undefined &&
        typeof item.dateName === "string"
      );
    })
    .map((item) => ({
      date: convertLocdateToDateKey(item.locdate!),
      name: item.dateName!,
    }));
}

async function fetchYearHolidays(
  year: number,
  serviceKey: string,
): Promise<Holiday[]> {
  const holidays: Holiday[] = [];

  /*
   * 1월부터 12월까지 순차 호출합니다.
   *
   * 동시에 12개를 호출하는 것보다 API 서버에 부담이 적고,
   * 어느 월에서 오류가 났는지 확인하기 쉽습니다.
   */
  for (let month = 1; month <= 12; month += 1) {
    const monthHolidays = await fetchMonthHolidays({
      year,
      month,
      serviceKey,
    });

    holidays.push(...monthHolidays);
  }

  /*
   * 같은 날짜에 여러 공휴일 명칭이 반환될 가능성에 대비해
   * 날짜 기준으로 합칩니다.
   */
  const holidayMap = new Map<string, Holiday>();

  holidays.forEach((holiday) => {
    const existing = holidayMap.get(holiday.date);

    if (!existing) {
      holidayMap.set(holiday.date, holiday);
      return;
    }

    const existingNames = existing.name.split(",").map((name) => name.trim());

    if (!existingNames.includes(holiday.name)) {
      holidayMap.set(holiday.date, {
        date: holiday.date,
        name: `${existing.name}, ${holiday.name}`,
      });
    }
  });

  return Array.from(holidayMap.values()).sort((first, second) =>
    first.date.localeCompare(second.date),
  );
}

export async function GET(request: NextRequest) {
  /*
   * 우리 앱 내부에서는 year라는 이름을 사용합니다.
   *
   * 예:
   * /api/holidays?year=2026
   */
  const yearParameter = request.nextUrl.searchParams.get("year");

  const forceRefresh = request.nextUrl.searchParams.get("refresh") === "true";

  if (!isValidYear(yearParameter)) {
    return NextResponse.json(
      {
        message: "year는 1900~2100 사이의 네 자리 연도여야 합니다.",
      },
      {
        status: 400,
      },
    );
  }

  const year = Number(yearParameter);

  /*
   * 먼저 data/holidays/{year}.json을 확인합니다.
   */
  const existingCache = await readHolidayCache(year);

  if (!forceRefresh && existingCache && isHolidayCacheFresh(existingCache)) {
    return NextResponse.json({
      ...existingCache,
      source: "file-cache",
    });
  }

  const serviceKey = process.env.HOLIDAY_API_KEY;

  /*
   * API 키가 없어도 기존 캐시 파일이 있으면
   * 오래된 캐시라도 반환합니다.
   */
  if (!serviceKey) {
    if (existingCache) {
      return NextResponse.json({
        ...existingCache,
        source: "stale-file-cache",
      });
    }

    return NextResponse.json(
      {
        message: "HOLIDAY_API_KEY 환경변수가 설정되지 않았습니다.",
      },
      {
        status: 500,
      },
    );
  }

  try {
    const holidays = await fetchYearHolidays(year, serviceKey);

    const savedCache = await writeHolidayCache(year, holidays);

    return NextResponse.json({
      ...savedCache,
      source: "external-api",
    });
  } catch (error) {
    console.error(`${year}년 공휴일 조회 실패:`, error);

    /*
     * 외부 API가 실패해도 기존 파일이 있으면
     * 화면이 깨지지 않도록 기존 캐시를 반환합니다.
     */
    if (existingCache) {
      return NextResponse.json({
        ...existingCache,
        source: "stale-file-cache",
      });
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "공휴일 정보를 불러오지 못했습니다.",
      },
      {
        status: 502,
      },
    );
  }
}
