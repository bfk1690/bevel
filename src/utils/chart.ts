export type Bar = {
  value: number
  /** 0 to 1, the share of the plot height this bar fills */
  ratio: number
}

export type BarScale = {
  bars: Bar[]
  /** The figure the tallest bar stands for */
  max: number
}

export type BarScaleInput = {
  values: readonly number[]
  /** Forces the top of the scale. Use it to hold two charts to one scale */
  max?: number
  /**
   * Rounds the top up to a readable figure.
   *
   * On by default. A scale topping out at 8,437 makes every bar a fraction
   * nobody can do in their head; one topping out at 10,000 makes the tallest
   * bar mean something.
   */
  nice?: boolean
}

/**
 * Bar heights, as shares of the plot.
 *
 * **The scale always starts at zero.** Cutting the axis to just below the
 * smallest value makes a 3% difference look like a doubling, and it is the
 * single most common way a chart lies. A component cannot know when that is
 * honest, so it never does it.
 *
 * Negative values are clamped rather than drawn below a baseline: a chart with
 * bars going both ways needs an axis line and a label convention, and doing
 * half of that silently would be worse than not doing it.
 */
export function scaleBars({ values, max, nice = true }: BarScaleInput): BarScale {
  const usable = values.map((value) => (Number.isFinite(value) ? Math.max(0, value) : 0))
  const highest = usable.reduce((top, value) => Math.max(top, value), 0)

  const ceiling = max != null ? Math.max(0, max) : nice ? niceCeiling(highest) : highest

  return {
    max: ceiling,
    // Everything at zero draws an empty plot rather than a full one: dividing
    // by a zero ceiling would make every bar the tallest
    bars: usable.map((value) => ({ value, ratio: ceiling <= 0 ? 0 : value / ceiling })),
  }
}

/**
 * The next round number at or above a figure: 1, 2, 2.5 or 5 times a power of
 * ten - the steps people read without thinking.
 */
export function niceCeiling(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0

  const magnitude = 10 ** Math.floor(Math.log10(value))
  const scaled = value / magnitude

  const step = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 2.5 ? 2.5 : scaled <= 5 ? 5 : 10
  return step * magnitude
}
