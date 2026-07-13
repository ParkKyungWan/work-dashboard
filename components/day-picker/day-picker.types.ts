export type Holiday = {
  date: string;
  name: string;
};

export type HolidayApiResponse = {
  year: number;
  fetchedAt: string;
  holidays: Holiday[];
  source: "file-cache" | "stale-file-cache" | "external-api";
};

export type AppDayPickerProps = {
  value: string;
  onChange: (date: string) => void;

  holidays?: Holiday[];
  paydayDay?: number;
};

export type DayPickerDropdownProps = {
  value: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (date: string) => void;

  disabled?: boolean;
  holidays?: Holiday[];
  paydayDay?: number;
};
