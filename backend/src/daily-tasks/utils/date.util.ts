export const TIMEZONE = 'Asia/Kolkata';

/**
 * Returns YYYY-MM-DD string formatted in Asia/Kolkata (IST)
 */
export function getISTDateString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

/**
 * Parses ISO string or Date object and returns YYYY-MM-DD in IST
 */
export function getISTDateFromISO(dateInput: Date | string | number): string {
  const d = new Date(dateInput);
  return getISTDateString(d);
}

/**
 * Returns an array of YYYY-MM-DD date strings from startDateStr to endDateStr (inclusive)
 */
export function getDatesBetween(startDateStr: string, endDateStr: string): string[] {
  const result: string[] = [];
  let current = new Date(`${startDateStr}T00:00:00.000Z`);
  const end = new Date(`${endDateStr}T00:00:00.000Z`);

  while (current <= end) {
    const year = current.getUTCFullYear();
    const month = String(current.getUTCMonth() + 1).padStart(2, '0');
    const day = String(current.getUTCDate()).padStart(2, '0');
    result.push(`${year}-${month}-${day}`);
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return result;
}

/**
 * Adds or subtracts days from a YYYY-MM-DD date string
 */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
