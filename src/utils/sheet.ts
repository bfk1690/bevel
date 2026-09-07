export type SnapPoint = number | `${number}%`

/** Returned when a gesture asks for the sheet to go away entirely */
export const DISMISS = -1

/**
 * Turns snap points into heights in points, smallest first.
 *
 * Percentages are of the space the sheet has, not of the screen: the sheet
 * lives under a status bar and over a home indicator, and "half" that quietly
 * means 54% of what is left is not half of anything.
 */
export function resolveSnapPoints(points: readonly SnapPoint[], available: number): number[] {
  if (available <= 0) return []

  const heights = points
    .map((point) => {
      if (typeof point === 'number') return point
      const percent = Number.parseFloat(point)
      return Number.isNaN(percent) ? 0 : (available * percent) / 100
    })
    .map((height) => Math.min(available, Math.max(0, height)))
    .filter((height) => height > 0)

  return [...new Set(heights)].sort((a, b) => a - b)
}

export type SnapInput = {
  /** Height the sheet is at when the finger lifts */
  height: number
  /** Points per ms. Positive is downwards, matching the gesture's own sign */
  velocity: number
  snaps: readonly number[]
  /** Where it was, so a flick can be read as a step from there */
  current: number
  /** Whether dragging below the smallest snap closes it */
  dismissible?: boolean
}

/** Past this, the direction of the flick decides rather than the distance */
export const SHEET_FLICK_VELOCITY = 0.5

/**
 * Which snap point the sheet should settle at, or `DISMISS`.
 *
 * A flick wins over position, as it does anywhere else a finger throws
 * something: waiting until the sheet has been dragged past the halfway mark
 * before accepting the gesture is asking the hand to do the animation's work.
 * A flick moves ONE step, so a sheet cannot be thrown from peek to full and
 * skip the size the reader was reaching for.
 */
export function nearestSnapIndex({
  height,
  velocity,
  snaps,
  current,
  dismissible = true,
}: SnapInput): number {
  if (snaps.length === 0) return dismissible ? DISMISS : 0

  const index = snaps.indexOf(current)
  const from = index >= 0 ? index : closest(snaps, current)

  if (Math.abs(velocity) > SHEET_FLICK_VELOCITY) {
    // Downwards is positive, and downwards means smaller
    const step = velocity > 0 ? from - 1 : from + 1
    if (step < 0) return dismissible ? DISMISS : 0
    return Math.min(snaps.length - 1, step)
  }

  const settled = closest(snaps, height)

  // Dragged well below the smallest size and let go: that is a dismissal, not
  // a request for the smallest size
  if (dismissible && height < snaps[0] * 0.5) return DISMISS

  return settled
}

function closest(snaps: readonly number[], height: number): number {
  let best = 0
  let distance = Infinity
  for (let index = 0; index < snaps.length; index += 1) {
    const gap = Math.abs(snaps[index] - height)
    if (gap < distance) {
      distance = gap
      best = index
    }
  }
  return best
}
