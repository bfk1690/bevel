/**
 * Column widths.
 *
 * A table on a phone is always short of room, so the interesting part is not
 * dividing the space but deciding what happens when there is not enough: a
 * column squeezed below the width of its own content is worse than a table
 * that scrolls sideways.
 */

export type ColumnSpec = {
  /** Fixed width in points. Takes precedence over `flex` */
  width?: number
  /** Share of what is left after the fixed columns */
  flex?: number
  /** A flexible column is never squeezed below this */
  minWidth?: number
}

export const DEFAULT_MIN_COLUMN = 96

export function resolveColumnWidths(
  columns: readonly ColumnSpec[],
  available: number,
  defaultMin = DEFAULT_MIN_COLUMN,
): number[] {
  if (columns.length === 0) return []

  const minimumOf = (column: ColumnSpec) => column.minWidth ?? defaultMin

  const fixedTotal = columns.reduce((total, column) => total + (column.width ?? 0), 0)
  const flexColumns = columns.filter((column) => column.width === undefined)
  const flexTotal = flexColumns.reduce((total, column) => total + (column.flex ?? 1), 0)

  // Before the table has been measured, every flexible column takes its
  // minimum: guessing wide and correcting looks like the table jumped.
  const room = Math.max(0, available - fixedTotal)

  return columns.map((column) => {
    if (column.width !== undefined) return column.width
    if (flexTotal <= 0) return minimumOf(column)
    const share = ((column.flex ?? 1) / flexTotal) * room
    return Math.max(minimumOf(column), share)
  })
}

/** Whether the resolved columns need a sideways scroll to be seen */
export function overflowsRow(widths: readonly number[], available: number): boolean {
  if (available <= 0) return true
  return widths.reduce((total, width) => total + width, 0) > available + 0.5
}

export type SortDirection = 'asc' | 'desc'

export type TableSort = { key: string; direction: SortDirection }

/**
 * What pressing a header does next.
 *
 * Ascending, then descending, then OFF. The third press is the one people
 * expect and almost nobody implements: without it there is no way back to the
 * order the data arrived in, which is itself meaningful - newest first, the
 * server's ranking, the order someone dragged things into.
 */
export function nextSort(current: TableSort | null, key: string): TableSort | null {
  if (current == null || current.key !== key) return { key, direction: 'asc' }
  if (current.direction === 'asc') return { key, direction: 'desc' }
  return null
}

const collator =
  typeof Intl !== 'undefined' && typeof Intl.Collator === 'function'
    ? new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
    : null

/**
 * Compares two cells as a person reads them.
 *
 * Numeric-aware, so "10" sorts after "9" rather than before it - plain string
 * comparison is why a list of order numbers or file names comes out shuffled.
 * Falls back to a plain comparison where the runtime has no collator.
 */
export function compareValues(a: string, b: string): number {
  if (collator) return collator.compare(a, b)
  if (a === b) return 0
  return a < b ? -1 : 1
}

/**
 * Sorts a copy, never the array it was given.
 *
 * The original order has to survive: turning sorting off means going back to
 * it, and a caller's array being reordered underneath is a bug that surfaces
 * three screens away.
 */
export function sortRows<T>(
  rows: readonly T[],
  sort: TableSort | null,
  compare: (row: T, key: string) => string,
  custom?: (key: string) => ((a: T, b: T) => number) | undefined,
): T[] {
  const copy = rows.slice()
  if (sort == null) return copy

  const comparator = custom?.(sort.key)
  const direction = sort.direction === 'asc' ? 1 : -1

  return copy.sort((a, b) => {
    const result = comparator ? comparator(a, b) : compareValues(compare(a, sort.key), compare(b, sort.key))
    return result * direction
  })
}

/**
 * Row selection.
 *
 * Held as a set of keys rather than a flag on each row: the rows come from a
 * server and get replaced on every page, sort and refresh, and a flag written
 * onto them is lost each time. Keys survive all three.
 */
export function toggleKey(selected: ReadonlySet<string>, key: string): Set<string> {
  const next = new Set(selected)
  if (!next.delete(key)) next.add(key)
  return next
}

export type SelectionState = 'none' | 'some' | 'all'

/**
 * What the header checkbox should show.
 *
 * Measured against the rows ON SCREEN, not against everything ever loaded: a
 * filtered table saying "all" while holding a selection the user cannot see is
 * how the wrong thing gets deleted.
 */
export function selectionState(keys: readonly string[], selected: ReadonlySet<string>): SelectionState {
  if (keys.length === 0) return 'none'
  let count = 0
  for (const key of keys) if (selected.has(key)) count += 1
  if (count === 0) return 'none'
  return count === keys.length ? 'all' : 'some'
}

/** Adds or removes every visible key, leaving anything off screen untouched */
export function toggleAllKeys(
  keys: readonly string[],
  selected: ReadonlySet<string>,
): Set<string> {
  const next = new Set(selected)
  if (selectionState(keys, selected) === 'all') {
    for (const key of keys) next.delete(key)
  } else {
    for (const key of keys) next.add(key)
  }
  return next
}
