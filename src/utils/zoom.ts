export type Point = { x: number; y: number }

export type ViewTransform = {
  scale: number
  /** Offset from the centre, in points */
  x: number
  y: number
}

export type Touch = { pageX: number; pageY: number }

/** Above this, the image counts as zoomed in rather than resting */
export const ZOOM_SLOP = 1.01

/** Distance between the first two touches. Zero when there are not two */
export function distanceBetween(touches: readonly Touch[]): number {
  const [a, b] = touches
  if (!a || !b) return 0
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY)
}

/**
 * Midpoint of the first two touches, measured from the centre of the page.
 *
 * The first TWO rather than all of them: a third finger landing mid-pinch
 * would otherwise drag the focal point across the picture, and re-gripping is
 * exactly when someone is looking closely.
 */
export function focalPoint(touches: readonly Touch[], width: number, height: number): Point {
  const [a, b] = touches
  if (!a) return { x: 0, y: 0 }
  const pageX = b ? (a.pageX + b.pageX) / 2 : a.pageX
  const pageY = b ? (a.pageY + b.pageY) / 2 : a.pageY
  return { x: pageX - width / 2, y: pageY - height / 2 }
}

/**
 * Where the image must sit for the point under the fingers to stay under them.
 *
 * Scaling about the centre pulls whatever the user was looking at out from
 * under their hand, so a detail in a corner runs away exactly when they try to
 * inspect it. A point sits at `p * s + t` on screen, so holding it still
 * across a scale change means
 *
 *   t1 = focus - (focusAtStart - t0) * (s1 / s0)
 *
 * Passing the CURRENT focus as the first term gives two-finger panning for
 * free: moving both fingers moves the image with them.
 */
export function focusedTransform(
  nextScale: number,
  focus: Point,
  from: ViewTransform,
  startFocus: Point,
): ViewTransform {
  const ratio = from.scale === 0 ? 1 : nextScale / from.scale
  return {
    scale: nextScale,
    x: focus.x - (startFocus.x - from.x) * ratio,
    y: focus.y - (startFocus.y - from.y) * ratio,
  }
}

/**
 * Keeps a zoomed image from being dragged off screen.
 *
 * The bounds follow the CURRENT scale, including one borrowed past the
 * maximum: clamping to the settled size while the image is still stretched
 * would drag it sideways under the fingers.
 */
export function clampTransform(
  value: ViewTransform,
  width: number,
  height: number,
): ViewTransform {
  return {
    scale: value.scale,
    x: clampAxis(value.x, Math.max(0, (width * value.scale - width) / 2)),
    y: clampAxis(value.y, Math.max(0, (height * value.scale - height) / 2)),
  }
}

function clampAxis(value: number, limit: number): number {
  const held = Math.min(limit, Math.max(-limit, value))
  // Clamping a negative offset to a zero limit yields -0, which renders the
  // same and compares differently. Nothing downstream should have to know that
  return held === 0 ? 0 : held
}

/**
 * Lets the scale pass its limits, but only a little.
 *
 * A hard stop reads as the gesture having broken; resistance says the limit is
 * real and the finger is still being heard. Pulling below one resists harder,
 * because that direction ends in letting go.
 */
export function resistScale(raw: number, max: number, min = 1): number {
  if (raw > max) return max + (raw - max) * 0.2
  if (raw < min) return min - (min - raw) * 0.35
  return raw
}

/** What a pinch is asking for, before any resistance */
export function scaleFromPinch(startScale: number, startDistance: number, distance: number): number {
  if (startDistance <= 0) return startScale
  return (startScale * distance) / startDistance
}

/** Whatever was borrowed past the limits is given back when the fingers lift */
export function settledScale(scale: number, max: number, min = 1): number {
  return Math.min(max, Math.max(min, scale))
}

export function isZoomed(scale: number): boolean {
  return scale > ZOOM_SLOP
}
