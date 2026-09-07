/**
 * Slider arithmetic.
 *
 * Turning a finger position into a value looks like one division until the
 * edges show up: a track of zero width, a range of zero length, a step that
 * does not divide the range evenly, and a value that must land exactly on the
 * maximum rather than one step short of it.
 */

export type SliderScale = {
  min: number
  max: number
  /** 0 or less means continuous */
  step?: number
}

export function clampValue(value: number, { min, max }: SliderScale): number {
  if (max <= min) return min
  return Math.min(max, Math.max(min, value))
}

/**
 * Rounds to the nearest step, measured FROM `min`.
 *
 * Two rules that are easy to get wrong:
 *
 * Steps count from `min`, not from zero. Stepping from zero would put a
 * 5-step slider that starts at 2 on 0, 5, 10 - values it is not allowed to
 * hold.
 *
 * The maximum is always reachable, even when the step does not divide the
 * range. With min 0, max 10 and step 3 the grid ends at 9, and a slider that
 * cannot reach its own end when dragged all the way there reads as broken.
 */
export function snapToStep(value: number, scale: SliderScale): number {
  const { min, max, step = 0 } = scale
  if (step <= 0) return clampValue(value, scale)
  if (max <= min) return min

  const bounded = clampValue(value, scale)
  const lower = min + Math.floor((bounded - min) / step) * step
  const candidates = [lower, Math.min(max, lower + step), max]

  return candidates.reduce((best, candidate) =>
    Math.abs(candidate - bounded) < Math.abs(best - bounded) ? candidate : best,
  )
}

/** 0 at the minimum, 1 at the maximum */
export function ratioOfValue(value: number, scale: SliderScale): number {
  const { min, max } = scale
  if (max <= min) return 0
  return Math.min(1, Math.max(0, (value - min) / (max - min)))
}

export function valueOfRatio(ratio: number, scale: SliderScale): number {
  const { min, max } = scale
  if (max <= min) return min
  return snapToStep(min + (max - min) * Math.min(1, Math.max(0, ratio)), scale)
}

/** Where along the track a value sits, in points */
export function positionOfValue(value: number, scale: SliderScale, width: number): number {
  return ratioOfValue(value, scale) * Math.max(0, width)
}

export function valueOfPosition(position: number, scale: SliderScale, width: number): number {
  // A track that has not been measured yet would divide by zero
  if (width <= 0) return scale.min
  return valueOfRatio(position / width, scale)
}

/**
 * Which end of a range the finger is reaching for.
 *
 * Ties go to the END, so a range collapsed onto a single value can still be
 * opened up by dragging right - the alternative is a slider that looks stuck.
 */
export function nearestBound(value: number, start: number, end: number): 'start' | 'end' {
  return Math.abs(value - start) < Math.abs(value - end) ? 'start' : 'end'
}

/** Keeps a range in order, whichever bound was just moved */
export function orderRange(start: number, end: number): [number, number] {
  return start <= end ? [start, end] : [end, start]
}
