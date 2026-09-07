export type GridInput = {
  /** Space the grid has to fill, in points */
  width: number
  /** Narrowest an item may get before a column is dropped */
  minItemWidth?: number
  gap?: number
  /** Ceiling on columns, whatever the width allows */
  maxColumns?: number
  /** Fixes the count and ignores `minItemWidth` */
  columns?: number
}

export type GridLayout = {
  columns: number
  /** In points, not a percentage - see the note below */
  itemWidth: number
  gap: number
}

const DEFAULT_MIN_ITEM = 120
const DEFAULT_GAP = 8

/**
 * How many columns fit, and how wide each one is.
 *
 * The width comes back in POINTS rather than as a percentage. Percentage
 * widths plus a wrapping row round independently, and three items of 33.33%
 * can total 100.01% - which drops the third onto its own line at some screen
 * sizes and not others.
 */
export function resolveGrid({
  width,
  minItemWidth = DEFAULT_MIN_ITEM,
  gap = DEFAULT_GAP,
  maxColumns = Infinity,
  columns,
}: GridInput): GridLayout {
  const safeGap = Math.max(0, gap)

  // Before the first layout there is no width to divide up. One column is the
  // honest answer, and it is replaced on the next frame
  if (!Number.isFinite(width) || width <= 0) {
    return { columns: 1, itemWidth: 0, gap: safeGap }
  }

  const ceiling = Math.max(1, Math.floor(maxColumns))

  const fitting =
    columns != null
      ? Math.max(1, Math.trunc(columns))
      : Math.floor((width + safeGap) / (Math.max(1, minItemWidth) + safeGap))

  const count = Math.min(ceiling, Math.max(1, fitting))

  return {
    columns: count,
    itemWidth: (width - safeGap * (count - 1)) / count,
    gap: safeGap,
  }
}

/** Splits a list into rows of `columns`, keeping order */
export function rowsOf<T>(items: readonly T[], columns: number): T[][] {
  const size = Math.max(1, Math.trunc(columns))
  const rows: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size))
  }
  return rows
}
