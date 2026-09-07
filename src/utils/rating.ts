/**
 * Rating arithmetic.
 *
 * Turning a touch into a number of stars is not a straight multiplication:
 * touching anywhere inside the first star has to mean one, not a fraction of
 * one, or the control can never be given its lowest non-zero value.
 */

export function clampRating(value: number, count: number): number {
  return Math.min(count, Math.max(0, value))
}

/**
 * Stars from a horizontal position, as a fraction of the row.
 *
 * Rounded UP: the first pixel of a star already belongs to it. Rounding to
 * nearest would make the left half of star one mean zero, so a rating of one
 * could only be given by touching that star's right edge.
 */
export function ratingFromRatio(ratio: number, count: number, allowHalf = false): number {
  const raw = Math.min(1, Math.max(0, ratio)) * count
  const stepped = allowHalf ? Math.ceil(raw * 2) / 2 : Math.ceil(raw)
  return clampRating(stepped, count)
}

export type StarFill = 'full' | 'half' | 'empty'

/** How the star at `index` should be drawn for a given value */
export function starFill(index: number, value: number): StarFill {
  if (value >= index + 1) return 'full'
  // Anything past the star's midpoint reads as half; below it the star is
  // empty rather than a sliver nobody can judge.
  if (value >= index + 0.5) return 'half'
  return 'empty'
}

/** Rounds a free-form average to something the row can actually draw */
export function snapRating(value: number, count: number, allowHalf = false): number {
  const stepped = allowHalf ? Math.round(value * 2) / 2 : Math.round(value)
  return clampRating(stepped, count)
}
