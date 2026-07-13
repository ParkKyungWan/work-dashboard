export const toLocalDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const createLocalDateFromKey = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day);
};

export const formatDayPickerDateLabel = (dateKey: string) => {
  const date = createLocalDateFromKey(dateKey);

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];

  return `${year}.${month}.${day} (${weekday})`;
};

export const isWeekendDate = (date: Date) => {
  const day = date.getDay();

  return day === 0 || day === 6;
};

export const getAdjustedPayday = (
  year: number,
  month: number,
  paydayDay: number,
  holidayDateKeys: ReadonlySet<string>,
) => {
  const payday = new Date(year, month, paydayDay);

  while (isWeekendDate(payday) || holidayDateKeys.has(toLocalDateKey(payday))) {
    payday.setDate(payday.getDate() - 1);
  }

  return payday;
};
