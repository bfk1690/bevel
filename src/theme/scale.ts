import { Dimensions, PixelRatio, Platform } from 'react-native'

import type { ScaleMode } from './types'

/**
 * Device scaling.
 *
 * Reference viewport: 393 x 852 dp (a 6.1" phone). Export design specs at
 * those dimensions and the tokens keep their proportions elsewhere.
 *
 * Dimensions are read ONCE at module load. They do not follow rotation: making
 * every token read reactive would put a subscription behind every style
 * lookup. Layouts that must respond to rotation should use flex or
 * `useWindowDimensions` at the call site.
 */
const BASE_W = 393
const BASE_H = 852

const win = Dimensions.get('window')
const ratioW = win.width / BASE_W
const ratioH = win.height / BASE_H

/** Snap to the nearest physical pixel for the platform */
function snap(value: number): number {
  return Platform.OS === 'android' ? Math.round(value) : PixelRatio.roundToNearestPixel(value)
}

export function scaleValue(size: number, mode: ScaleMode): number {
  if (mode === 'none') return size
  if (mode === 'width') return snap(size * ratioW)
  if (mode === 'height') return snap(size * ratioH)
  return snap(size * ((ratioW + ratioH) / 2))
}

/** General layout scale - padding, height, radius */
export const calc = (size: number) => scaleValue(size, 'moderate')
/** Width-driven values - column widths, horizontal rails */
export const hs = (size: number) => scaleValue(size, 'width')
/** Height-driven values */
export const vs = (size: number) => scaleValue(size, 'height')

/**
 * Type scale - deliberately CLAMPED.
 *
 * Reusing the layout multiplier for text inflates headings on large screens
 * and starves them on small ones, so the factor is clamped to 0.92-1.10.
 */
export function fs(size: number, mode: ScaleMode = 'moderate'): number {
  if (mode === 'none') return size
  const raw = scaleValue(size, mode) / size
  const clamped = Math.max(0.92, Math.min(1.1, raw))
  return snap(size * clamped)
}

export const screen = { width: win.width, height: win.height }
