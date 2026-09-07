/**
 * Carousel paging.
 *
 * Which page a scroll offset lands on, and which dots to draw when there are
 * more pages than a row of dots can hold.
 */

export function pageFromOffset(offset: number, pageWidth: number, count: number): number {
  // An unmeasured pager would divide by zero and report NaN as a page
  if (pageWidth <= 0 || count <= 0) return 0
  return Math.min(count - 1, Math.max(0, Math.round(offset / pageWidth)))
}

export type Dot = {
  index: number
  /** 1 at full size, smaller for the dots that stand for pages further away */
  scale: number
}

/**
 * A sliding window of dots.
 *
 * Past a handful, one dot per page becomes a ruler nobody reads and a row that
 * no longer fits. A window that follows the active page keeps the row a fixed
 * width, and shrinking the dots at its edges says there is more in that
 * direction without spelling out how much.
 */
export function dotWindow(active: number, count: number, max = 5): Dot[] {
  if (count <= 0) return []
  if (count <= max) {
    return Array.from({ length: count }, (_, index) => ({ index, scale: 1 }))
  }

  const half = Math.floor(max / 2)
  const start = Math.min(Math.max(0, active - half), count - max)

  return Array.from({ length: max }, (_, position) => {
    const index = start + position
    const atWindowStart = position === 0 && start > 0
    const atWindowEnd = position === max - 1 && start + max < count
    const nextToStart = position === 1 && start > 0
    const nextToEnd = position === max - 2 && start + max < count

    // The very edge of the window is smallest, its neighbour half way there
    if (atWindowStart || atWindowEnd) return { index, scale: 0.45 }
    if (nextToStart || nextToEnd) return { index, scale: 0.7 }
    return { index, scale: 1 }
  })
}
