/**
 * Calendar arithmetic.
 *
 * Kept free of React Native imports so it can be unit tested, and free of a
 * date library so the package stays dependency-free. Everything works in LOCAL
 * time on purpose: a calendar shows the user's own days, and going through UTC
 * is how a date picker ends up off by one for anybody east or west of it.
 */

export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type MonthCell = {
  date: Date
  /** False for the leading and trailing days borrowed from the neighbouring months */
  inMonth: boolean
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function isSameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  if (a == null || b == null) return false
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function addDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount)
}

/**
 * Adds months, clamping the day to the target month's length.
 *
 * Without the clamp, 31 January plus one month lands on 2 or 3 March, and
 * stepping through a calendar starts skipping February entirely.
 */
export function addMonths(date: Date, amount: number): Date {
  const year = date.getFullYear()
  const month = date.getMonth() + amount
  const day = Math.min(date.getDate(), daysInMonth(year, month))
  return new Date(year, month, day)
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export function isBefore(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() < startOfDay(b).getTime()
}

export function isAfter(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() > startOfDay(b).getTime()
}

export function clampDate(date: Date, min?: Date | null, max?: Date | null): Date {
  if (min && isBefore(date, min)) return startOfDay(min)
  if (max && isAfter(date, max)) return startOfDay(max)
  return startOfDay(date)
}

/** Inclusive on both ends */
export function isWithin(date: Date, start?: Date | null, end?: Date | null): boolean {
  if (!start || !end) return false
  const time = startOfDay(date).getTime()
  const from = startOfDay(start).getTime()
  const to = startOfDay(end).getTime()
  return time >= Math.min(from, to) && time <= Math.max(from, to)
}

/**
 * Six weeks of cells, always.
 *
 * A grid that changes height between months makes the whole sheet jump as the
 * user pages through it, and the buttons underneath move out from under their
 * thumb. Six rows covers every month in every alignment.
 */
export function buildMonthGrid(year: number, month: number, weekStart: WeekStart = 1): MonthCell[] {
  const first = new Date(year, month, 1)
  const offset = (first.getDay() - weekStart + 7) % 7
  const cells: MonthCell[] = []

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(year, month, 1 - offset + index)
    cells.push({ date, inMonth: date.getMonth() === ((month % 12) + 12) % 12 })
  }

  return cells
}

/** `YYYY-MM-DD` in local time - what a form or an API usually wants */
export function toISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function fromISODate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return null
  const [, year, month, day] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  // Rejects impossible dates like 2026-02-31, which Date would roll forward
  return date.getMonth() === Number(month) - 1 ? date : null
}

const MONTHS_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * Month and weekday names come from `Intl` when the runtime has it.
 *
 * Mobile JS engines sometimes ship a trimmed ICU, so every call falls back to
 * English rather than throwing. A month name in the wrong language is a flaw;
 * a crash in a date picker is a broken app.
 */
export function formatMonthYear(date: Date, locale?: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date)
  } catch {
    return `${MONTHS_EN[date.getMonth()]} ${date.getFullYear()}`
  }
}

export function formatDate(date: Date, locale?: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
  } catch {
    return `${date.getDate()} ${MONTHS_EN[date.getMonth()]} ${date.getFullYear()}`
  }
}

/**
 * Seven short labels, rotated so the first one matches `weekStart`.
 *
 * The sample dates are built at NOON, and in a recent year.
 *
 * Midnight is a trap: `Date` builds the day in the system's zone while `Intl`
 * formats it in whatever zone it resolves, and any disagreement between the
 * two crosses a day boundary - the whole header then names the wrong columns,
 * off by one, while the grid underneath is correct. Historical dates make it
 * worse, since zone offsets were different decades ago. Noon leaves twelve
 * hours of slack in each direction.
 */
export function weekdayLabels(weekStart: WeekStart = 1, locale?: string): string[] {
  const labels: string[] = []
  for (let index = 0; index < 7; index += 1) {
    const weekday = (weekStart + index) % 7
    // 7 January 2024 was a Sunday, so this walks a real week
    const date = new Date(2024, 0, 7 + weekday, 12)
    try {
      labels.push(new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date))
    } catch {
      labels.push(WEEKDAYS_EN[weekday]!)
    }
  }
  return labels
}
