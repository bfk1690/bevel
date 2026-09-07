/**
 * Matching what people type against what is on the list.
 *
 * Search is not casing. `upper` and `lower` in `utils/case` are about
 * DISPLAY - they must preserve the difference between i and dotless i, because
 * showing the wrong one is a spelling mistake. Here the opposite is wanted:
 * someone typing "sisli" on a keyboard they cannot be bothered to switch is
 * looking for "Şişli", and refusing them is not correctness.
 */

const FOLD: Record<string, string> = {
  'ı': 'i', 'İ': 'i', 'ş': 's', 'Ş': 's', 'ğ': 'g', 'Ğ': 'g',
  'ü': 'u', 'Ü': 'u', 'ö': 'o', 'Ö': 'o', 'ç': 'c', 'Ç': 'c',
  'â': 'a', 'î': 'i', 'û': 'u', 'é': 'e', 'è': 'e', 'ê': 'e',
  'á': 'a', 'à': 'a', 'ä': 'a', 'å': 'a', 'ó': 'o', 'ô': 'o',
  'ñ': 'n', 'ß': 'ss', 'ø': 'o', 'æ': 'ae',
}

/**
 * Strips the differences a searcher does not mean.
 *
 * Accents, case, and the two Turkish i's all collapse together. Everything
 * else is left alone: folding is for comparison, never for what is shown back.
 */
export function foldText(text: string): string {
  let folded = ''
  for (const character of text) {
    folded += FOLD[character] ?? character
  }
  return folded.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export type Ranked<T> = { item: T; score: number }

/**
 * How well a candidate answers a query.
 *
 * Four tiers, and the order between them is the whole point: an exact match
 * before something that starts with it, that before a word inside it starting
 * with it, and only then a match buried anywhere. A list sorted by mere
 * "contains" puts the thing the user typed in full somewhere down the page.
 */
export function scoreMatch(candidate: string, query: string): number {
  if (query === '') return 1
  const text = foldText(candidate)
  const needle = foldText(query)

  if (text === needle) return 4
  if (text.startsWith(needle)) return 3
  // A word inside it starting with the query - "kadikoy" for "Kadıköy Moda"
  if (text.split(/[\s\-/,.]+/).some((word) => word.startsWith(needle))) return 2
  if (text.includes(needle)) return 1
  return 0
}

export type RankOptions = {
  /** Longest list to return */
  limit?: number
  /** Everything is a candidate when the query is empty. Off by default */
  emptyReturnsAll?: boolean
}

/**
 * Filters and orders candidates, keeping the original order within a tier.
 *
 * Stability matters more than it looks: a list that was already meaningfully
 * ordered - most used first, nearest first - should keep that order among
 * equally good matches rather than reshuffling on every keystroke.
 */
export function rankSuggestions<T>(
  query: string,
  items: readonly T[],
  toText: (item: T) => string,
  { limit, emptyReturnsAll = false }: RankOptions = {},
): T[] {
  const trimmed = query.trim()

  if (trimmed === '') {
    if (!emptyReturnsAll) return []
    return limit != null ? items.slice(0, limit) : items.slice()
  }

  const scored: Ranked<T>[] = []
  items.forEach((item) => {
    const score = scoreMatch(toText(item), trimmed)
    if (score > 0) scored.push({ item, score })
  })

  // Sort is stable in every engine this runs on, so equal scores keep the
  // order they arrived in
  scored.sort((a, b) => b.score - a.score)

  const ordered = scored.map((entry) => entry.item)
  return limit != null ? ordered.slice(0, limit) : ordered
}
