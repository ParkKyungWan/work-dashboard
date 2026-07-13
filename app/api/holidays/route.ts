import { NextRequest, NextResponse } from "next/server";

type HolidayApiItem = {
  dateName: string;
  isHoliday: "Y" | "N";
  locdate: number;
  seq: number;
};

type HolidayApiResponse = {
  response?: {
    body?: {
      items?: {
        item?: HolidayApiItem | HolidayApiItem[];
      };
    };
  };
};

const normalizeItems = (
  item: HolidayApiItem | HolidayApiItem[] | undefined,
): HolidayApiItem[] => {
  if (!item) {
    return [];
  }

  return Array.isArray(item) ? item : [item];
};

export async function GET(request: NextRequest) {
  const year = request.nextUrl.searchParams.get("year");
  const month = request.nextUrl.searchParams.get("month");

  if (!year || !/^\d{4}$/.test(year)) {
    return NextResponse.json(
      { message: "올바른 연도를 입력하세요." },
      { status: 400 },
    );
  }

  if (month && !/^(0[1-9]|1[0-2])$/.test(month)) {
    return NextResponse.json(
      { message: "올바른 월을 입력하세요." },
      { status: 400 },
    );
  }

  const serviceKey = process.env.HOLIDAY_API_KEY;

  if (!serviceKey) {
    return NextResponse.json(
      { message: "공휴일 API 키가 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  const params = new URLSearchParams({
    serviceKey,
    solYear: year,
    numOfRows: "100",
    _type: "json",
  });

  if (month) {
    params.set("solMonth", month);
  }

  const apiUrl =
    "https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo";

  try {
    const response = await fetch(`${apiUrl}?${params.toString()}`, {
      next: {
        revalidate: 60 * 60 * 24,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: "공휴일 정보를 가져오지 못했습니다." },
        { status: 502 },
      );
    }

    const data = (await response.json()) as HolidayApiResponse;
    const items = normalizeItems(data.response?.body?.items?.item);

    const holidays = items
      .filter((item) => item.isHoliday === "Y")
      .map((item) => {
        const rawDate = String(item.locdate);

        return {
          name: item.dateName,
          date: `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`,
        };
      });

    return NextResponse.json(holidays);
  } catch (error) {
    console.error("공휴일 API 호출 오류:", error);

    return NextResponse.json(
      { message: "공휴일 조회 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
