/**
 * Anchored placement.
 *
 * Given where the anchor sits and how big the bubble is, work out where the
 * bubble goes. Kept pure and free of React Native imports so the awkward
 * cases - no room on the preferred side, an anchor against a screen edge, an
 * arrow that would slide off its own bubble - can be tested rather than
 * discovered on a device.
 */

export type Rect = { x: number; y: number; width: number; height: number }

export type Placement = 'top' | 'bottom' | 'left' | 'right'

export type EdgeSpace = { top: number; right: number; bottom: number; left: number }

export type PlacementInput = {
  anchor: Rect
  content: { width: number; height: number }
  screen: { width: number; height: number }
  insets?: EdgeSpace
  /** `auto` picks the side with the most room, preferring below */
  placement?: Placement | 'auto'
  /** Gap between the anchor and the bubble */
  offset?: number
  /** Closest the bubble may come to a screen edge */
  margin?: number
  /** Half the arrow's width, so it can be kept off the rounded corners */
  arrowSize?: number
  /** Corner radius the arrow must stay clear of */
  cornerRadius?: number
}

export type PlacementResult = {
  placement: Placement
  left: number
  top: number
  /**
   * Distance from the bubble's leading edge to the centre of the arrow.
   *
   * Along x for a bubble above or below, along y for one beside. The bubble
   * gets clamped to the screen while the anchor does not move, so the arrow
   * cannot simply sit in the middle.
   */
  arrowOffset: number
}

const NO_INSETS: EdgeSpace = { top: 0, right: 0, bottom: 0, left: 0 }

const ORDER: Placement[] = ['bottom', 'top', 'right', 'left']

const OPPOSITE: Record<Placement, Placement> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
}

function clamp(value: number, min: number, max: number): number {
  // A window narrower than the bubble would invert the bounds, and Math.min
  // of an inverted pair walks the bubble off the other edge.
  if (max < min) return min
  return Math.min(max, Math.max(min, value))
}

function spaceFor(placement: Placement, input: Required<Pick<PlacementInput, 'anchor' | 'screen'>> & { insets: EdgeSpace; margin: number }): number {
  const { anchor, screen, insets, margin } = input
  if (placement === 'top') return anchor.y - insets.top - margin
  if (placement === 'bottom') return screen.height - (anchor.y + anchor.height) - insets.bottom - margin
  if (placement === 'left') return anchor.x - insets.left - margin
  return screen.width - (anchor.x + anchor.width) - insets.right - margin
}

export function resolvePlacement(input: PlacementInput): PlacementResult {
  const {
    anchor,
    content,
    screen,
    insets = NO_INSETS,
    placement = 'auto',
    offset = 8,
    margin = 8,
    arrowSize = 8,
    cornerRadius = 12,
  } = input

  const measured = { anchor, screen, insets, margin }
  const needed = (side: Placement) =>
    (side === 'top' || side === 'bottom' ? content.height : content.width) + offset

  let chosen: Placement
  if (placement === 'auto') {
    chosen =
      ORDER.find((side) => spaceFor(side, measured) >= needed(side)) ??
      // Nothing fits, so take the roomiest side and let the clamp handle it
      ORDER.reduce((best, side) =>
        spaceFor(side, measured) > spaceFor(best, measured) ? side : best,
      )
  } else {
    const flipped = OPPOSITE[placement]
    chosen =
      spaceFor(placement, measured) >= needed(placement) ||
      spaceFor(flipped, measured) < needed(flipped)
        ? placement
        : flipped
  }

  const vertical = chosen === 'top' || chosen === 'bottom'

  const rawLeft = vertical
    ? anchor.x + anchor.width / 2 - content.width / 2
    : chosen === 'right'
      ? anchor.x + anchor.width + offset
      : anchor.x - offset - content.width

  const rawTop = vertical
    ? chosen === 'bottom'
      ? anchor.y + anchor.height + offset
      : anchor.y - offset - content.height
    : anchor.y + anchor.height / 2 - content.height / 2

  const left = clamp(
    rawLeft,
    insets.left + margin,
    screen.width - insets.right - margin - content.width,
  )
  const top = clamp(
    rawTop,
    insets.top + margin,
    screen.height - insets.bottom - margin - content.height,
  )

  const anchorCentre = vertical ? anchor.x + anchor.width / 2 : anchor.y + anchor.height / 2
  const along = vertical ? content.width : content.height
  const limit = cornerRadius + arrowSize

  return {
    placement: chosen,
    left,
    top,
    arrowOffset: clamp(anchorCentre - (vertical ? left : top), limit, Math.max(limit, along - limit)),
  }
}
