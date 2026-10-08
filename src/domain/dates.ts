const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function todayISO(now = new Date()): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

export function currentMonth(now = new Date()): string {
  return todayISO(now).slice(0, 7);
}

export function isValidMonth(value: string): boolean {
  if (!/^\d{4}-\d{2}$/.test(value)) return false;
  const month = Number(value.slice(5, 7));
  const year = Number(value.slice(0, 4));
  return month >= 1 && month <= 12 && year >= 1900 && year <= 2200;
}

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  if (year < 1900 || year > 2200) return false;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function daysInMonth(month: string): number {
  const year = Number(month.slice(0, 4));
  const monthIndex = Number(month.slice(5, 7));
  return new Date(year, monthIndex, 0).getDate();
}

export function clampDay(month: string, day: number): number {
  const safe = Number.isFinite(day) ? Math.trunc(day) : 1;
  return Math.min(Math.max(safe, 1), daysInMonth(month));
}

export function dateInMonth(month: string, day: number): string {
  return `${month}-${pad2(clampDay(month, day))}`;
}

export function addMonths(month: string, delta: number): string {
  const year = Number(month.slice(0, 4));
  const monthIndex = Number(month.slice(5, 7)) - 1;
  const date = new Date(year, monthIndex + delta, 1);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}

export function monthsInRange(start: string, end: string): string[] {
  if (!isValidMonth(start) || !isValidMonth(end) || start > end) return [];
  const months: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    months.push(cursor);
    cursor = addMonths(cursor, 1);
  }
  return months;
}

export function monthOf(date: string): string {
  return date.slice(0, 7);
}

export function formatMonth(month: string): string {
  const index = Number(month.slice(5, 7)) - 1;
  const name = MONTHS[index] ?? month;
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${month.slice(0, 4)}`;
}

export function formatMonthShort(month: string): string {
  const index = Number(month.slice(5, 7)) - 1;
  return `${MONTHS_SHORT[index] ?? month} ${month.slice(2, 4)}`;
}

export function formatDate(date: string): string {
  if (!isValidDate(date)) return date;
  const day = Number(date.slice(8, 10));
  const monthName = MONTHS[Number(date.slice(5, 7)) - 1];
  return `${day} ${monthName} ${date.slice(0, 4)}`;
}

export function defaultDateForMonth(month: string, now = new Date()): string {
  const today = todayISO(now);
  if (today.startsWith(month)) return today;
  return `${month}-01`;
}

export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
