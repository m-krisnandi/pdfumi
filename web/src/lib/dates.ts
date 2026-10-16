export function localeTag(locale: string) {
  if (locale === "ja") return "ja-JP";
  if (locale === "id") return "id-ID";
  if (locale === "my") return "my-MM";
  return "en-GB";
}

export function formatLongDate(locale: string, date: Date) {
  return new Intl.DateTimeFormat(localeTag(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatMonthYear(locale: string, date: Date) {
  return new Intl.DateTimeFormat(localeTag(locale), {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

/** Build a calendar grid (Sun–Sat) for the given month — only weeks that contain days. */
export function calendarGrid(viewMonth: Date): (Date | null)[] {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const first = new Date(year, month, 1);
  const startPad = first.getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];

  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function weekdayLabels(locale: string): string[] {
  const formatter = new Intl.DateTimeFormat(localeTag(locale), { weekday: "short" });
  // 5 Jan 2025 was a Sunday
  return Array.from({ length: 7 }, (_, i) => formatter.format(new Date(2025, 0, 5 + i)));
}
