import { useWindowDimensions } from 'react-native'

import {
  breakpointFor,
  orientationFor,
  pickResponsive,
  type Breakpoint,
  type Orientation,
} from './layout'

/**
 * Which way round the window is.
 *
 * From the window's own dimensions rather than a native orientation module -
 * no dependency, and it is the honest answer anyway: a phone lying flat has an
 * orientation and no useful shape, and an app in a split view is
 * portrait-shaped on a landscape tablet. Layout answers to the window.
 */
export function useOrientation(): Orientation {
  const { width, height } = useWindowDimensions()
  return orientationFor(width, height)
}

/** The named width the window currently is */
export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions()
  return breakpointFor(width)
}

/**
 * Picks the value for the current width.
 *
 *   const columns = useResponsive({ compact: 1, medium: 2, expanded: 4 }) ?? 1
 *
 * Falls DOWN the scale, so a layout that names only `compact` keeps it
 * everywhere rather than growing into a shape nobody designed.
 */
export function useResponsive<T>(values: Partial<Record<Breakpoint, T>>): T | undefined {
  return pickResponsive(values, useBreakpoint())
}
