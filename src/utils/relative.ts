export type RelativeStyle = 'long' | 'short' | 'narrow'

export type RelativeOptions = {
  /** Defaults to now. Passed in so the result can be tested and cached */
  now?: number
  locale?: string
  style?: RelativeStyle
  /** Under this, it reads as "just now" rather than counting seconds */
  nowWithinMs?: number
  /**
   * Past this many days, an actual date is more use than a count of days.
   *
   * "Fourteen days ago" makes the reader do arithmetic to find out it was a
   * Tuesday. A date does not.
   */
  cutoffDays?: number
  /** Used past the cutoff. Given the same value and locale as the label */
  formatAbsolute?: (value: Date, locale?: string) => string
}

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const DEFAULT_NOW_WITHIN = 45 * SECOND
const DEFAULT_CUTOFF_DAYS = 7

/** Largest unit first: the first one the gap clears is the one to say it in */
const UNITS: readonly { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: 'day', ms: DAY },
  { unit: 'hour', ms: HOUR },
  { unit: 'minute', ms: MINUTE },
  { unit: 'second', ms: SECOND },
]

/** Falls back to English when the runtime was built without Intl data */
const PLAIN: Record<string, [string, string]> = {
  day: ['day', 'days'],
  hour: ['hour', 'hours'],
  minute: ['minute', 'minutes'],
  second: ['second', 'seconds'],
}

function plain(count: number, unit: string, past: boolean): string {
  const [one, many] = PLAIN[unit] ?? [unit, `${unit}s`]
  const word = Math.abs(count) === 1 ? one : many
  return past ? `${Math.abs(count)} ${word} ago` : `in ${Math.abs(count)} ${word}`
}

/**
 * A gap in words: "3 minutes ago", "in 2 hours", "just now".
 *
 * Anything older than the cutoff comes back as a date instead of a count,
 * because a count stops being an answer once it needs arithmetic to use.
 */
export function formatRelative(value: Date | number | string, options: RelativeOptions = {}): string {
  const {
    now = Date.now(),
    locale,
    style = 'long',
    nowWithinMs = DEFAULT_NOW_WITHIN,
    cutoffDays = DEFAULT_CUTOFF_DAYS,
    formatAbsolute,
  } = options

  const date = value instanceof Date ? value : new Date(value)
  const time = date.getTime()
  if (Number.isNaN(time)) return ''

  const diff = time - now
  const distance = Math.abs(diff)

  if (distance < nowWithinMs) return 'just now'

  if (cutoffDays > 0 && distance >= cutoffDays * DAY) {
    return formatAbsolute
      ? formatAbsolute(date, locale)
      : date.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const match = UNITS.find((entry) => distance >= entry.ms) ?? UNITS[UNITS.length - 1]
  // Rounded towards zero: forty seconds is not yet a minute, and saying it is
  // puts a timestamp in the future
  const count = Math.trunc(diff / match.ms)

  try {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style }).format(count, match.unit)
  } catch {
    return plain(count, match.unit, diff < 0)
  }
}

/**
 * How long until that label could change, in ms, or `null` once it cannot.
 *
 * A list of messages that re-renders every second to keep "3 days ago" honest
 * is spending a frame a second on a string that changes twice a week. The tick
 * is sized to the unit being shown.
 */
export function relativeTickMs(
  value: Date | number | string,
  options: Pick<RelativeOptions, 'now' | 'cutoffDays'> = {},
): number | null {
  const { now = Date.now(), cutoffDays = DEFAULT_CUTOFF_DAYS } = options

  const date = value instanceof Date ? value : new Date(value)
  const time = date.getTime()
  if (Number.isNaN(time)) return null

  const distance = Math.abs(time - now)

  // Past the cutoff it is a fixed date, and a fixed date never needs redrawing
  if (cutoffDays > 0 && distance >= cutoffDays * DAY) return null

  if (distance < MINUTE) return 5 * SECOND
  if (distance < HOUR) return 30 * SECOND
  if (distance < DAY) return 5 * MINUTE
  return HOUR
}
