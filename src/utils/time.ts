/**
 * Time-of-day arithmetic.
 *
 * A time is a pair of numbers, not a `Date`. Carrying a full date around for
 * "half past two" drags a timezone and a calendar day into a value that has
 * neither, and that is how an alarm ends up an hour off after a DST change.
 */

export type TimeValue = { hours: number; minutes: number }

export type Period = 'AM' | 'PM'

export const MINUTES_IN_DAY = 24 * 60

export function timeToMinutes(time: TimeValue): number {
  return time.hours * 60 + time.minutes
}

export function minutesToTime(total: number): TimeValue {
  // Wraps rather than clamps: adding an hour to 23:30 belongs at 00:30
  const wrapped = ((total % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY
  return { hours: Math.floor(wrapped / 60), minutes: wrapped % 60 }
}

export function normalizeTime(time: TimeValue): TimeValue {
  return minutesToTime(timeToMinutes(time))
}

/** Negative when `a` is earlier */
export function compareTime(a: TimeValue, b: TimeValue): number {
  return timeToMinutes(a) - timeToMinutes(b)
}

export function isSameTime(a: TimeValue | null, b: TimeValue | null): boolean {
  if (a == null || b == null) return false
  return timeToMinutes(a) === timeToMinutes(b)
}

export function clampTime(time: TimeValue, min?: TimeValue | null, max?: TimeValue | null): TimeValue {
  const value = timeToMinutes(normalizeTime(time))
  if (min && value < timeToMinutes(min)) return normalizeTime(min)
  if (max && value > timeToMinutes(max)) return normalizeTime(max)
  return normalizeTime(time)
}

/**
 * Rounds to the nearest step.
 *
 * A picker offering five-minute steps must not display a value it cannot
 * produce: an incoming 14:03 would leave the wheel between two rows.
 */
export function snapMinutes(time: TimeValue, step: number): TimeValue {
  if (step <= 1) return normalizeTime(time)
  const total = timeToMinutes(normalizeTime(time))
  return minutesToTime(Math.round(total / step) * step)
}

export function buildMinuteOptions(step = 1): number[] {
  const safe = Math.max(1, Math.min(30, Math.floor(step)))
  const options: number[] = []
  for (let minute = 0; minute < 60; minute += safe) options.push(minute)
  return options
}

export function buildHourOptions(use12Hour: boolean): number[] {
  if (!use12Hour) return Array.from({ length: 24 }, (_, hour) => hour)
  // 12 leads the twelve-hour clock, not 0
  return [12, ...Array.from({ length: 11 }, (_, index) => index + 1)]
}

export function to12Hour(hours: number): { hour: number; period: Period } {
  const period: Period = hours >= 12 ? 'PM' : 'AM'
  const hour = hours % 12 === 0 ? 12 : hours % 12
  return { hour, period }
}

export function from12Hour(hour: number, period: Period): number {
  const base = hour % 12
  return period === 'PM' ? base + 12 : base
}

/**
 * Whether the locale writes time on a twelve-hour clock.
 *
 * Read from `Intl` where the runtime has it. A wrong clock is a small
 * annoyance; a crash is not, so anything unexpected falls back to 24 hours -
 * the majority convention and the unambiguous one.
 */
export function prefers12Hour(locale?: string): boolean {
  try {
    const options = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions()
    if (typeof options.hourCycle === 'string') return options.hourCycle.startsWith('h1')
    if (typeof options.hour12 === 'boolean') return options.hour12
    return false
  } catch {
    return false
  }
}

export function formatTime(time: TimeValue, locale?: string, use12Hour?: boolean): string {
  const twelve = use12Hour ?? prefers12Hour(locale)
  const { hours, minutes } = normalizeTime(time)
  const padded = String(minutes).padStart(2, '0')
  if (!twelve) return `${String(hours).padStart(2, '0')}:${padded}`
  const { hour, period } = to12Hour(hours)
  return `${hour}:${padded} ${period}`
}

/** Accepts `14:30`, `2:30 PM`, `9.05`, and rejects anything else */
export function parseTime(text: string): TimeValue | null {
  const match = /^\s*(\d{1,2})[:.](\d{2})\s*(am|pm)?\s*$/i.exec(text)
  if (!match) return null
  const [, rawHour, rawMinute, meridiem] = match
  const minutes = Number(rawMinute)
  let hours = Number(rawHour)
  if (minutes > 59) return null
  if (meridiem) {
    if (hours < 1 || hours > 12) return null
    hours = from12Hour(hours, meridiem.toUpperCase() as Period)
  } else if (hours > 23) {
    return null
  }
  return { hours, minutes }
}

export function timeFromDate(date: Date): TimeValue {
  return { hours: date.getHours(), minutes: date.getMinutes() }
}

/** Copies a time onto a date, leaving the calendar day alone */
export function dateWithTime(date: Date, time: TimeValue): Date {
  const { hours, minutes } = normalizeTime(time)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0)
}
