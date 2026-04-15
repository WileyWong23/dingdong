/**
 * scheduler.ts — Scheduling engine for calculating the next trigger time.
 *
 * Supports:
 *   - One-time reminders (nextTriggerAt = triggerAt)
 *   - Recurring reminders with:
 *     - intervalSeconds: repeat interval
 *     - rangeStart / rangeEnd: active hours "HH:mm"
 *     - daysOfWeek: allowed days (0=Sun .. 6=Sat)
 *     - timezone: IANA timezone string
 */

import type { Reminder } from '../types/reminder';

/**
 * Parse "HH:mm" string to total minutes since midnight.
 */
function parseTime(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Get the day-of-week (0=Sun..6=Sat) for a given Date in the target timezone.
 */
function getDayOfWeekInTZ(date: Date, timezone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  });
  const dayName = formatter.format(date);
  const map: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  return map[dayName] ?? 0;
}

/**
 * Convert a UTC Date to "HH:mm" in the target timezone.
 */
function getTimeInTZ(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const h = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const m = parts.find((p) => p.type === 'minute')?.value ?? '00';
  return `${h}:${m}`;
}

/**
 * Get the year, month, day for a Date in the target timezone.
 */
function getDatePartsInTZ(date: Date, timezone: string): { year: number; month: number; day: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((p) => p.type === 'year')?.value);
  const month = Number(parts.find((p) => p.type === 'month')?.value);
  const day = Number(parts.find((p) => p.type === 'day')?.value);
  return { year, month, day };
}

/**
 * Create a UTC Date for a specific local time in a given timezone.
 *
 * Uses iterative offset calculation since Intl can't directly construct dates.
 */
function localTimeToUTC(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timezone: string
): Date {
  // Start with a guess: assume no offset
  let guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));

  // Iterate to correct for timezone offset (usually converges in 1-2 steps)
  for (let i = 0; i < 5; i++) {
    const parts = getDatePartsInTZ(guess, timezone);
    const timeStr = getTimeInTZ(guess, timezone);
    const [h, m] = timeStr.split(':').map(Number);

    if (
      parts.year === year &&
      parts.month === month &&
      parts.day === day &&
      h === hour &&
      m === minute
    ) {
      return guess;
    }

    // Build a local-time-based date and compare
    const targetLocal = new Date(year, month - 1, day, hour, minute, 0, 0);
    const currentLocal = new Date(
      parts.year,
      parts.month - 1,
      parts.day,
      h,
      m,
      0,
      0
    );
    const diff = targetLocal.getTime() - currentLocal.getTime();
    guess = new Date(guess.getTime() + diff);
  }

  return guess;
}

/**
 * Calculate the next trigger time for a reminder.
 *
 * @param reminder - The reminder object.
 * @param fromTime - The reference time (usually `Date.now()`).
 * @returns UTC timestamp in milliseconds, or undefined if no valid trigger.
 */
export function calculateNextTrigger(reminder: Reminder, fromTime: number): number | undefined {
  if (!reminder.enabled) return undefined;

  // ── One-time reminder ──────────────────────────────────────────────
  if (reminder.type === 'once') {
    if (!reminder.triggerAt) return undefined;
    return reminder.triggerAt > fromTime ? reminder.triggerAt : undefined;
  }

  // ── Recurring reminder ─────────────────────────────────────────────
  if (!reminder.schedule) return undefined;

  const { intervalSeconds, rangeStart, rangeEnd, daysOfWeek, timezone } =
    reminder.schedule;

  if (!daysOfWeek || daysOfWeek.length === 0) return undefined;

  const rangeStartMin = parseTime(rangeStart);
  const rangeEndMin = parseTime(rangeEnd);
  const intervalMinutes = Math.max(1, Math.round(intervalSeconds / 60));

  const now = new Date(fromTime);
  const MAX_LOOKAHEAD_DAYS = 14; // search up to 2 weeks ahead

  for (let dayOffset = 0; dayOffset < MAX_LOOKAHEAD_DAYS; dayOffset++) {
    const checkDate = new Date(fromTime + dayOffset * 86400000);
    const dow = getDayOfWeekInTZ(checkDate, timezone);

    if (!daysOfWeek.includes(dow)) continue;

    const dateParts = getDatePartsInTZ(checkDate, timezone);

    // Generate candidate times within the range
    for (
      let minutesOffset = rangeStartMin;
      minutesOffset <= rangeEndMin;
      minutesOffset += intervalMinutes
    ) {
      const hour = Math.floor(minutesOffset / 60);
      const minute = minutesOffset % 60;

      const candidateUTC = localTimeToUTC(
        dateParts.year,
        dateParts.month,
        dateParts.day,
        hour,
        minute,
        timezone
      );

      // Must be strictly in the future
      if (candidateUTC.getTime() > fromTime) {
        return candidateUTC.getTime();
      }
    }
  }

  return undefined; // no valid time found in lookahead window
}
