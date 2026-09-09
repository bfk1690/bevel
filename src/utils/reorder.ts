/** Moves one item, returning a new list. Out-of-range indices change nothing */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items]
  if (from === to) return next
  if (from < 0 || from >= next.length) return next
  if (to < 0 || to >= next.length) return next

  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

/**
 * Where a row being dragged would land if it were dropped now.
 *
 * Decided by how many whole rows the dragged one has travelled, ROUNDED - so
 * the swap happens as its centre passes a neighbour's centre, not when it has
 * been dragged a full row past. Waiting for a full row means the picture on
 * screen disagrees with where it will land for half of every step.
 */
export function targetIndex(
  from: number,
  offset: number,
  itemHeight: number,
  count: number,
): number {
  if (count <= 0) return 0
  if (itemHeight <= 0) return Math.min(count - 1, Math.max(0, from))
  const moved = Math.round(offset / itemHeight)
  return Math.min(count - 1, Math.max(0, from + moved))
}

/**
 * How far a row that is NOT being dragged should slide, to open the gap.
 *
 * The gap opens during the drag rather than on release. A list that only
 * rearranges after the finger lifts asks the reader to hold a prediction in
 * their head; one that opens as they go shows them the answer.
 */
export function slotShift(index: number, from: number, to: number, itemHeight: number): number {
  if (index === from) return 0
  if (from < to && index > from && index <= to) return -itemHeight
  if (from > to && index >= to && index < from) return itemHeight
  return 0
}

/**
 * Where the dragged row rests once it is dropped, measured from where it
 * started.
 *
 * The row does not spring back to its original place and then get re-laid-out:
 * it settles into the slot it earned, and the list is reordered underneath in
 * the same frame.
 */
export function restingOffset(from: number, to: number, itemHeight: number): number {
  return (to - from) * itemHeight
}

export type AutoScrollInput = {
  /** Where the finger is, in window coordinates */
  pointerY: number
  /** Top of the area that scrolls */
  top: number
  /** Bottom of it */
  bottom: number
  /** How deep the band at each edge reaches */
  edge?: number
  /** Points per tick at the very edge */
  maxSpeed?: number
}

/**
 * How far to scroll while a row is being dragged near an edge, per tick.
 *
 * Negative is upwards. Zero anywhere in the middle, which is most of the
 * screen and most of the time.
 *
 * The speed RAMPS with how deep into the band the finger is. A single speed
 * cannot work: fast enough to cross a long list is far too fast for placing a
 * row three places down, and slow enough to place carefully never gets you
 * anywhere. Depth is the only thing the finger is saying about urgency.
 */
export function autoScrollStep({
  pointerY,
  top,
  bottom,
  edge = 80,
  maxSpeed = 14,
}: AutoScrollInput): number {
  if (edge <= 0 || bottom <= top) return 0

  // A band taller than half the space would have the two overlap in the
  // middle, and the row would scroll wherever it was put
  const band = Math.min(edge, (bottom - top) / 2)

  if (pointerY < top + band) {
    const depth = Math.min(1, (top + band - pointerY) / band)
    return -Math.max(1, Math.round(depth * maxSpeed))
  }

  if (pointerY > bottom - band) {
    const depth = Math.min(1, (pointerY - (bottom - band)) / band)
    return Math.max(1, Math.round(depth * maxSpeed))
  }

  return 0
}
