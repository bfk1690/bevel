import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native'

import { defaultTheme } from './define-theme'
import type { Palette, Theme } from './types'

export type ThemeTokens = {
  theme: Theme
  scheme: string
  colors: Palette
  space: Theme['space']
  radius: Theme['radius']
  type: Theme['type']
  sizes: Theme['sizes']
}

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle }

/**
 * ACTIVE THEME, held at module scope.
 *
 * Style sheets are built once PER SCHEME and reads go through a proxy that
 * resolves to whichever sheet is currently active. That avoids the two common
 * alternatives: rebuilding style objects on every render, or mutating style
 * identities in place when the theme changes.
 *
 * IMPORTANT: the proxy is not a subscription. A component still has to call
 * `useTheme()` to re-render on a theme change, even if it reads no color
 * directly.
 */
let activeTheme: Theme = defaultTheme
let activeScheme: string = defaultTheme.defaultScheme
let activeKey = `${activeTheme.id}:${activeScheme}`

const tokenCache = new Map<string, ThemeTokens>()

export function setActiveTheme(theme: Theme, scheme: string): void {
  const resolved = theme.schemes[scheme] ? scheme : theme.defaultScheme
  if (activeTheme === theme && activeScheme === resolved) return
  activeTheme = theme
  activeScheme = resolved
  activeKey = `${theme.id}:${resolved}`
}

export function getTokens(): ThemeTokens {
  const cached = tokenCache.get(activeKey)
  if (cached && cached.theme === activeTheme) return cached
  const tokens: ThemeTokens = {
    theme: activeTheme,
    scheme: activeScheme,
    colors: activeTheme.schemes[activeScheme] ?? activeTheme.schemes[activeTheme.defaultScheme]!,
    space: activeTheme.space,
    radius: activeTheme.radius,
    type: activeTheme.type,
    sizes: activeTheme.sizes,
  }
  tokenCache.set(activeKey, tokens)
  return tokens
}

/**
 * Theme-aware `StyleSheet.create`.
 *
 * The factory runs once per scheme and the result is cached. Resolution is
 * lazy, so a scheme that is never displayed is never built.
 */
export function createThemedStyles<T extends NamedStyles<T> | NamedStyles<Record<string, unknown>>>(
  factory: (tokens: ThemeTokens) => T,
): T {
  const sheets = new Map<string, T>()

  const resolve = (): T => {
    const hit = sheets.get(activeKey)
    if (hit) return hit
    const sheet = StyleSheet.create(factory(getTokens())) as T
    sheets.set(activeKey, sheet)
    return sheet
  }

  return new Proxy({} as T, {
    get(_target, prop) {
      return (resolve() as Record<string | symbol, unknown>)[prop]
    },
    has(_target, prop) {
      return prop in (resolve() as object)
    },
    ownKeys() {
      return Reflect.ownKeys(resolve() as object)
    },
    getOwnPropertyDescriptor(_target, prop) {
      const value = (resolve() as Record<string | symbol, unknown>)[prop]
      if (value === undefined) return undefined
      // Must be configurable, or the proxy invariant check throws a TypeError
      return { value, enumerable: true, configurable: true, writable: false }
    },
  })
}
