export type Orientation = 'portrait' | 'landscape'

/**
 * Named widths, in the order they widen.
 *
 * `compact` is a phone held upright, `medium` a phone on its side or a small
 * tablet, `expanded` a tablet or a window given most of a large screen.
 */
export type Breakpoint = 'compact' | 'medium' | 'expanded'

export const BREAKPOINTS: readonly { name: Breakpoint; from: number }[] = [
  { name: 'expanded', from: 1000 },
  { name: 'medium', from: 600 },
  { name: 'compact', from: 0 },
]

export function breakpointFor(width: number): Breakpoint {
  if (!Number.isFinite(width)) return 'compact'
  return BREAKPOINTS.find((entry) => width >= entry.from)?.name ?? 'compact'
}

/**
 * Which way round the WINDOW is - not the device.
 *
 * They disagree more often than it seems: a phone lying flat has an
 * orientation and no useful shape, and an app in a split view on a tablet is
 * portrait-shaped while the tablet is landscape. Layout answers to the window,
 * so that is what this reports. It also needs no native module to say it.
 */
export function orientationFor(width: number, height: number): Orientation {
  return width > height ? 'landscape' : 'portrait'
}

/**
 * The value for this width, falling back DOWN the scale.
 *
 * A layout that names `compact` and `expanded` and is opened at `medium` gets
 * the compact one: the narrower answer always fits in a wider space, while the
 * wider one does not fit in a narrower space. Falling upwards would overflow
 * the screen rather than merely leaving room on it.
 */
export function pickResponsive<T>(
  values: Partial<Record<Breakpoint, T>>,
  breakpoint: Breakpoint,
): T | undefined {
  const order: Breakpoint[] = ['compact', 'medium', 'expanded']
  const upto = order.slice(0, order.indexOf(breakpoint) + 1).reverse()
  for (const name of upto) {
    const value = values[name]
    if (value !== undefined) return value
  }
  return undefined
}
