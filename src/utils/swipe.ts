/**
 * Swipe-to-reveal arithmetic.
 *
 * Where a row lands when the finger lifts, and how far it may be pulled past
 * what it has to show. Both are the kind of thing that feels wrong long before
 * anyone can say why, so they are written down and tested rather than tuned by
 * hand until someone stops complaining.
 */

export type SwipeSide = 'left' | 'right'

export type SwipeSnapInput = {
  /** Current offset. Negative when the row has moved left */
  offset: number
  /** Points per millisecond, as a gesture reports it */
  velocity: number
  /** How far the row travels when fully open */
  openWidth: number
  /** Where it started, which decides what a small movement means */
  wasOpen: boolean
  side?: SwipeSide
}

/** A flick this fast decides the outcome on its own */
export const FLICK_VELOCITY = 0.5

/**
 * Whether the row should rest open or closed.
 *
 * Velocity wins over position: a short fast flick is a clear instruction, and
 * asking someone to drag past a halfway mark before letting go is asking them
 * to do the animation's work.
 *
 * Without a flick it comes down to half the open width - but measured from
 * where the gesture STARTED. Opening asks for half; closing an already open
 * row asks only that it be pulled a little back, because the intent to close
 * is the movement itself.
 */
export function resolveSwipeSnap({
  offset,
  velocity,
  openWidth,
  wasOpen,
  side = 'right',
}: SwipeSnapInput): boolean {
  if (openWidth <= 0) return false

  // Everything below is written for a row that opens leftwards; a left-side
  // row is the mirror image of it
  const travel = side === 'right' ? -offset : offset
  const flick = side === 'right' ? -velocity : velocity

  if (Math.abs(flick) > FLICK_VELOCITY) return flick > 0

  const threshold = wasOpen ? openWidth * 0.75 : openWidth * 0.5
  return travel >= threshold
}

/**
 * Slows the row down past the point it has anything to show.
 *
 * A hard stop reads as the gesture having broken; a fifth of the movement says
 * the limit is real while the finger is still being heard.
 */
export function resistPast(offset: number, limit: number, factor = 0.2): number {
  if (limit <= 0) return offset * factor
  if (offset > 0) return offset * factor
  if (offset < -limit) return -limit + (offset + limit) * factor
  return offset
}

/** Positive distance travelled towards the open position, whichever side it is */
export function swipeTravel(offset: number, side: SwipeSide = 'right'): number {
  return side === 'right' ? -offset : offset
}

/**
 * Whether a drag has gone far enough to run the edge action outright.
 *
 * Measured against the ROW's width rather than the actions' - it is a gesture
 * about the row ("get this out of here"), and it should ask for the same effort
 * whether there is one action behind it or three.
 */
export function isFullSwipe(travel: number, rowWidth: number, ratio = 0.5): boolean {
  if (rowWidth <= 0 || ratio <= 0) return false
  return travel >= rowWidth * ratio
}
