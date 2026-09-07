export type DurationParts = {
  days: number
  hours: number
  minutes: number
  seconds: number
  /** Everything under a second, kept for scheduling rather than display */
  ms: number
}

export type DurationStyle = 'clock' | 'compact'

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/**
 * Splits a length of time up, rounding the seconds UP.
 *
 * A countdown with 900ms left is not at zero, and showing zero while it is
 * still running is how a timer ends up sitting on "0" for a second. Rounding
 * up means the display reaches zero exactly when the time does.
 */
export function durationParts(ms: number): DurationParts {
  const total = Math.max(0, ms)
  const whole = Math.ceil(total / SECOND) * SECOND

  return {
    days: Math.floor(whole / DAY),
    hours: Math.floor((whole % DAY) / HOUR),
    minutes: Math.floor((whole % HOUR) / MINUTE),
    seconds: Math.floor((whole % MINUTE) / SECOND),
    ms: total % SECOND,
  }
}

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value)
}

export type DurationOptions = {
  style?: DurationStyle
  /** Shows the hours field even at zero, for a timer that will need it */
  showHours?: boolean
  /** Rolls days into the hours field rather than printing them */
  hideDays?: boolean
}

/**
 * A length of time in words or on a clock.
 *
 * `clock` is for something running - 01:23 - where the digits must not move
 * about. `compact` is for something stated - 1h 23m - where they are read once.
 */
export function formatDuration(ms: number, options: DurationOptions = {}): string {
  const { style = 'clock', showHours = false, hideDays = false } = options
  const parts = durationParts(ms)

  const hours = hideDays ? parts.days * 24 + parts.hours : parts.hours

  if (style === 'compact') {
    if (!hideDays && parts.days > 0) return `${parts.days}d ${hours}h`
    if (hours > 0) return `${hours}h ${parts.minutes}m`
    if (parts.minutes > 0) return `${parts.minutes}m ${parts.seconds}s`
    return `${parts.seconds}s`
  }

  const clock =
    hours > 0 || showHours
      ? `${pad(hours)}:${pad(parts.minutes)}:${pad(parts.seconds)}`
      : `${pad(parts.minutes)}:${pad(parts.seconds)}`

  return !hideDays && parts.days > 0 ? `${parts.days}d ${clock}` : clock
}

/** What is left until `target`, never negative */
export function remaining(target: Date | number, now = Date.now()): number {
  const end = target instanceof Date ? target.getTime() : target
  if (Number.isNaN(end)) return 0
  return Math.max(0, end - now)
}

/**
 * How long until the visible number changes, in ms.
 *
 * A countdown on a plain 1000ms interval drifts: each tick is a little late,
 * the error accumulates, and eventually a whole second is skipped on screen.
 * Aiming at the next second boundary instead keeps the digits honest however
 * long the timer runs.
 */
export function nextSecondIn(ms: number): number {
  const remainder = Math.max(0, ms) % SECOND
  return remainder === 0 ? SECOND : remainder
}
