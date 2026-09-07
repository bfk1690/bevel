/**
 * Paging guards.
 *
 * `onEndReached` is not a request for the next page; it is a report that the
 * end is near, and it fires again on every scroll that keeps it near. What
 * turns it into one fetch per page is the guard below, which every app writes
 * and most write incompletely - which is why lists double-load their second
 * page and keep asking for a page that does not exist.
 */

export type PagingState = {
  /** A request is already in flight */
  loading?: boolean
  /** The server said there is more */
  hasMore?: boolean
  /** The last attempt failed */
  error?: unknown
  /** Nothing has been asked for yet */
  ready?: boolean
}

/**
 * Whether the end of the list should trigger a fetch.
 *
 * A failed page does NOT retry itself. Scrolling near the end again would
 * hammer a server that has just said no, and the user has no way to tell that
 * anything is being attempted - a retry belongs on a button they can see.
 */
export function shouldLoadMore({
  loading,
  hasMore = true,
  error,
  ready = true,
}: PagingState): boolean {
  if (!ready) return false
  if (loading === true) return false
  if (error) return false
  return hasMore
}

/**
 * Appends a page, dropping anything already held.
 *
 * Servers repeat rows across pages more often than anyone expects - a cursor
 * that overlaps, a row that moved between requests - and React answers a
 * duplicate key with a warning and a list that renders one of them wrong.
 * The FIRST copy is kept: it is the one already on screen, and replacing it
 * would redraw a row the user may be reading.
 */
export function appendPage<T>(
  current: readonly T[],
  page: readonly T[],
  keyOf: (item: T) => string,
): T[] {
  const seen = new Set(current.map(keyOf))
  const merged = current.slice()

  for (const item of page) {
    const key = keyOf(item)
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(item)
  }

  return merged
}

/** True when a page came back shorter than asked for, which means the end */
export function isLastPage(received: number, requested: number): boolean {
  if (requested <= 0) return true
  return received < requested
}
