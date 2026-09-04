/**
 * Color math.
 *
 * Derived colors are needed on every render - the bevel edge under a button is
 * its background darkened, a soft badge is its accent at low alpha. Computing
 * those per frame is wasteful, so results are memoized in a small LRU.
 */

type Rgba = { r: number; g: number; b: number; a: number }

const CACHE = new Map<string, string>()
const CACHE_MAX = 128

function remember(key: string, value: string): string {
  if (CACHE.size >= CACHE_MAX) {
    const oldest = CACHE.keys().next().value
    if (oldest !== undefined) CACHE.delete(oldest)
  }
  CACHE.set(key, value)
  return value
}

const NAMED: Record<string, Rgba> = {
  transparent: { r: 0, g: 0, b: 0, a: 0 },
  black: { r: 0, g: 0, b: 0, a: 1 },
  white: { r: 255, g: 255, b: 255, a: 1 },
}

export function parseColor(input: string): Rgba | null {
  const color = input.trim().toLowerCase()
  if (!color) return null
  const named = NAMED[color]
  if (named) return named

  if (color.startsWith('#')) {
    const raw = color.slice(1)
    const hex =
      raw.length === 3 || raw.length === 4
        ? raw
            .split('')
            .map((c) => c + c)
            .join('')
        : raw
    if (hex.length === 6 || hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
      }
    }
    return null
  }

  const fn = color.match(/^rgba?\(([^)]+)\)$/)
  if (fn && fn[1]) {
    const parts = fn[1].split(/[,\s/]+/).filter(Boolean).map(Number)
    const [r, g, b, a] = parts
    if (r === undefined || g === undefined || b === undefined) return null
    if ([r, g, b].some(Number.isNaN)) return null
    return { r, g, b, a: a === undefined || Number.isNaN(a) ? 1 : a }
  }
  return null
}

const clamp255 = (n: number) => Math.max(0, Math.min(255, Math.round(n)))
const toRgba = ({ r, g, b, a }: Rgba) =>
  `rgba(${clamp255(r)}, ${clamp255(g)}, ${clamp255(b)}, ${Math.max(0, Math.min(1, a))})`

/** `amount` is 0-1. An unparseable color is returned unchanged rather than throwing. */
export function darken(color: string, amount: number): string {
  const key = `d${amount} ${color}`
  const hit = CACHE.get(key)
  if (hit !== undefined) return hit
  const rgba = parseColor(color)
  if (!rgba) return remember(key, color)
  return remember(
    key,
    toRgba({ ...rgba, r: rgba.r * (1 - amount), g: rgba.g * (1 - amount), b: rgba.b * (1 - amount) }),
  )
}

export function lighten(color: string, amount: number): string {
  const key = `l${amount} ${color}`
  const hit = CACHE.get(key)
  if (hit !== undefined) return hit
  const rgba = parseColor(color)
  if (!rgba) return remember(key, color)
  return remember(
    key,
    toRgba({
      ...rgba,
      r: rgba.r + (255 - rgba.r) * amount,
      g: rgba.g + (255 - rgba.g) * amount,
      b: rgba.b + (255 - rgba.b) * amount,
    }),
  )
}

/** Replaces the alpha channel - derives `*Soft` tokens without hand-writing rgba */
export function alpha(color: string, value: number): string {
  const key = `a${value} ${color}`
  const hit = CACHE.get(key)
  if (hit !== undefined) return hit
  const rgba = parseColor(color)
  if (!rgba) return remember(key, color)
  return remember(key, toRgba({ ...rgba, a: value }))
}

export function mix(from: string, to: string, ratio: number): string {
  const key = `m${ratio} ${from} ${to}`
  const hit = CACHE.get(key)
  if (hit !== undefined) return hit
  const a = parseColor(from)
  const b = parseColor(to)
  if (!a || !b) return remember(key, from)
  return remember(
    key,
    toRgba({
      r: a.r + (b.r - a.r) * ratio,
      g: a.g + (b.g - a.g) * ratio,
      b: a.b + (b.b - a.b) * ratio,
      a: a.a + (b.a - a.a) * ratio,
    }),
  )
}

/** WCAG relative luminance (0-1) */
export function luminance(color: string): number {
  const rgba = parseColor(color)
  if (!rgba) return 0
  const channel = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(rgba.r) + 0.7152 * channel(rgba.g) + 0.0722 * channel(rgba.b)
}

/** WCAG contrast ratio (1-21). Use it to assert a theme stays readable. */
export function contrast(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * Foreground color that stays legible on a given background.
 *
 * A fixed default foreground breaks the moment a caller overrides the
 * background: white-on-white text disappears with no error. When a variant
 * omits `fg`, luminance decides instead of a hardcoded guess.
 */
export function readableOn(background: string, dark = '#000000', light = '#FFFFFF'): string {
  const rgba = parseColor(background)
  if (!rgba || rgba.a < 0.5) return light
  return contrast(background, dark) >= contrast(background, light) ? dark : light
}

/**
 * Resolves a role name or a raw color against the active palette.
 *
 * Every color-taking prop accepts both, so a caller can stay on the token
 * system (`bg="accent"`) or drop to a literal (`bg="#FF6B00"`) without a
 * different API.
 */
export function resolveColor(
  colors: Record<string, string>,
  value: string | undefined,
  fallback = 'transparent',
): string {
  if (value === undefined || value === '') return fallback
  return colors[value] ?? value
}
