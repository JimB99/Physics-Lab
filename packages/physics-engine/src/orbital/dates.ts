import type { DateParts } from './types';

/** VSOP87 / astronomy-engine civil-year window used by Planet Calendar. */
export const CALENDAR_YEAR_MIN = 1;
export const CALENDAR_YEAR_MAX = 9999;

/**
 * Build a UTC Date without the JavaScript `Date.UTC` 0–99 → 1900–1999 quirk.
 */
export function utcCalendarDate(year: number, month: number, day: number, hour = 12): Date {
  const date = new Date(Date.UTC(2000, 0, 1, hour, 0, 0, 0));
  date.setUTCFullYear(year, month - 1, day);
  return date;
}

export function parseDateParts(day: number, month: number, year: number): Date {
  return utcCalendarDate(year, month, day, 12);
}

export function formatDateParts(date: Date): DateParts {
  return {
    day: date.getUTCDate(),
    month: date.getUTCMonth() + 1,
    year: date.getUTCFullYear(),
  };
}

function pad(value: number, width = 2): string {
  return String(value).padStart(width, '0');
}

/** ISO calendar date in UTC, e.g. "2026-09-01". */
export function formatIsoDate(date: Date): string {
  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** ISO date plus UTC time to the minute, e.g. "2026-09-01 12:34 UTC". */
export function formatIsoDateTime(date: Date): string {
  return `${formatIsoDate(date)} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function validateDateParts(day: number, month: number, year: number): string | null {
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
    return 'Date components must be integers';
  }
  if (month < 1 || month > 12) return 'Month must be between 1 and 12';
  if (day < 1 || day > 31) return 'Day must be between 1 and 31';
  if (year < CALENDAR_YEAR_MIN || year > CALENDAR_YEAR_MAX) {
    return `Year must be between ${CALENDAR_YEAR_MIN} and ${CALENDAR_YEAR_MAX}`;
  }
  const candidate = utcCalendarDate(year, month, day, 0);
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    return 'Invalid calendar date';
  }
  return null;
}

export function compareDates(a: Date, b: Date): number {
  return a.getTime() - b.getTime();
}

export function isBefore(a: Date, b: Date): boolean {
  return compareDates(a, b) < 0;
}

export function enumerateDates(start: Date, endExclusive: Date, stepDays: number): Date[] {
  if (stepDays < 1) throw new Error('Step size must be at least 1 day');
  const dates: Date[] = [];
  for (let current = new Date(start.getTime()); isBefore(current, endExclusive); current = addDays(current, stepDays)) {
    dates.push(new Date(current.getTime()));
  }
  return dates;
}

/** Parses "YYYY-MM-DD" at 12:00 UTC. Returns null when malformed or invalid. */
export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (validateDateParts(day, month, year) !== null) return null;
  return parseDateParts(day, month, year);
}
