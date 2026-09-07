/**
 * Carousel paging.
 *
 * Which page an offset lands on, how an endless pager maps onto a finite list,
 * and which dots to draw when there are more pages than dots.
 */

export function pageFromOffset(offset: number, pageWidth: number, count: number): number {
  // An unmeasured pager would divide by zero and report NaN as a page
  if (pageWidth <= 0 || count <= 0) return 0
  return Math.min(count - 1, Math.max(0, Math.round(offset / pageWidth)))
}

/**
 * Endless paging, done with two clones.
 *
 * The pager renders `[last, ...pages, first]`. Scrolling past either end lands
 * on a copy of the page at the other end, and the scroll position is then
 * moved - without animation - to the real one. The user swipes in one
 * direction forever and never sees the seam.
 *
 * Cloning is the only approach a paged scroll view supports: it has no notion
 * of wrapping, and re-ordering the data mid-gesture moves the page under the
 * finger.
 */
export function loopedIndex(raw: number, count: number): number {
  if (count <= 0) return 0
  if (raw <= 0) return count - 1
  if (raw > count) return 0
  return raw - 1
}

/** Where a real page sits in the cloned list */
export function loopedOffset(index: number): number {
  return index + 1
}

/**
 * The page to jump to after landing on a clone, or null when none is needed.
 *
 * Returned separately from `loopedIndex` because the jump has to happen
 * without animation and after the momentum has finished - doing it during the
 * scroll fights the gesture.
 */
export function loopCorrection(raw: number, count: number): number | null {
  if (count <= 0) return null
  if (raw <= 0) return count
  if (raw > count) return 1
  return null
}

export type Dot = {
  index: number
  /** 1 at full size, smaller for the dots standing for pages further away */
  scale: number
}

export type DotWindow = {
  /** First page in the window, to be fed back in on the next call */
  start: number
  dots: Dot[]
}

/**
 * A window of dots that the active page moves THROUGH.
 *
 * Centring the window on the active page every time is the obvious approach
 * and it is wrong: the highlighted dot then sits in the middle for ever while
 * the indices shuffle underneath, so paging through the middle of a long list
 * looks like nothing is happening.
 *
 * Instead the window holds still and the active dot travels across it. The
 * window only shifts when the active page reaches its edge, and then by just
 * enough to keep one page of lookahead - which is the moment the movement
 * should read as "the row itself moved on".
 */
export function dotWindow(active: number, count: number, max = 5, previousStart = 0): DotWindow {
  if (count <= 0) return { start: 0, dots: [] }

  if (count <= max) {
    return {
      start: 0,
      dots: Array.from({ length: count }, (_, index) => ({ index, scale: 1 })),
    }
  }

  const last = count - max
  let start = Math.min(Math.max(0, previousStart), last)

  // One page of lookahead on each side, so the shift happens before the active
  // dot is pinned against the edge
  if (active <= start) start = Math.max(0, active - 1)
  else if (active >= start + max - 1) start = Math.min(last, active - max + 2)

  const dots = Array.from({ length: max }, (_, position) => {
    const index = start + position
    if (index === active) return { index, scale: 1 }

    const moreBefore = start > 0
    const moreAfter = start + max < count
    if ((position === 0 && moreBefore) || (position === max - 1 && moreAfter)) {
      return { index, scale: 0.45 }
    }
    if ((position === 1 && moreBefore) || (position === max - 2 && moreAfter)) {
      return { index, scale: 0.7 }
    }
    return { index, scale: 1 }
  })

  return { start, dots }
}
