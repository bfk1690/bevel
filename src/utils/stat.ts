export type Direction = 'up' | 'down' | 'flat'

/** Which way a number moved. Zero is flat, not a rise */
export function deltaDirection(delta: number): Direction {
  if (delta > 0) return 'up'
  if (delta < 0) return 'down'
  return 'flat'
}

export type DeltaVerdict = 'good' | 'bad' | 'neutral'

/**
 * Whether a change is good news, which is NOT the same as which way it went.
 *
 * Painting every rise green is the most common lie a dashboard tells: response
 * time, error rate, cost per order and churn all get worse going up. The
 * metric has to say which direction it wants; without one the change is
 * reported and left uncoloured, because a number nobody has told us how to
 * read is not neutral - our opinion of it is.
 */
export function deltaVerdict(delta: number, goodWhen?: 'up' | 'down'): DeltaVerdict {
  if (delta === 0 || goodWhen == null) return 'neutral'
  return deltaDirection(delta) === goodWhen ? 'good' : 'bad'
}

export type DeltaFormat = {
  /** Renders as a percentage rather than an absolute change */
  percent?: boolean
  /** Digits after the point. Defaults to one for percentages, none otherwise */
  precision?: number
  locale?: string
}

/**
 * A change, signed, for reading at a glance.
 *
 * The sign is always shown, including the plus: `+12` and `12` next to each
 * other in a column are read as different KINDS of number, not as the same
 * number twice.
 */
export function formatDelta(delta: number, { percent, precision, locale }: DeltaFormat = {}): string {
  if (!Number.isFinite(delta)) return ''

  const digits = precision ?? (percent ? 1 : 0)
  const size = Math.abs(delta).toLocaleString(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })

  const sign = delta > 0 ? '+' : delta < 0 ? '−' : ''
  return `${sign}${size}${percent ? '%' : ''}`
}

/**
 * The change from one figure to another, as a percentage.
 *
 * `null` when there is nothing to compare against: a rise from zero is not
 * "infinity percent", and printing that is worse than printing nothing.
 */
export function percentChange(from: number, to: number): number | null {
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null
  if (from === 0) return null
  return ((to - from) / Math.abs(from)) * 100
}
