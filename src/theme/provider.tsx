import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useColorScheme, type ColorSchemeName, type StyleProp, type ViewStyle } from 'react-native'

import { defaultTheme } from './define-theme'
import { getTokens, setActiveTheme, type ThemeTokens } from './styles'
import type { Theme } from './types'
import { ZERO_INSETS, type EdgeInsets } from '../utils/optional'

/**
 * Gradient painter, injected by the host app.
 *
 * Apps paint gradients with different libraries. Picking one here would force
 * every consumer to install it, so the package knows a gradient's COLORS and
 * delegates the drawing:
 *
 *   <BevelProvider renderGradient={({ colors, style }) => (
 *     <LinearGradient colors={colors} style={style} />
 *   )} />
 *
 * Without it, gradient variants fall back to their solid `bg` color. Nothing
 * breaks, it just renders flat.
 */
export type GradientRenderer = (props: {
  colors: readonly string[]
  style: StyleProp<ViewStyle>
}) => ReactNode

/** `'system'` follows the OS setting; any other value names a scheme in the theme */
export type ThemePreference = 'system' | (string & {})

export type BevelContextValue = ThemeTokens & {
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
  renderGradient?: GradientRenderer
  insets: EdgeInsets
  renderOverlay?: OverlayRenderer
}

/**
 * Escape hatch for surfaces that must sit above native modals.
 *
 * On iOS a native modal lives in its own window, so a toast rendered inside
 * the app window disappears behind it. An app with react-native-screens can
 * pass `FullWindowOverlay` here to lift it out.
 */
export type OverlayRenderer = (props: { children: ReactNode }) => ReactNode

const BevelContext = createContext<BevelContextValue | null>(null)

export type BevelProviderProps = {
  children: ReactNode
  theme?: Theme
  /** Controlled mode - when provided, no internal state is kept */
  preference?: ThemePreference
  initialPreference?: ThemePreference
  /** Persistence belongs to the app: write to storage here */
  onPreferenceChange?: (preference: ThemePreference) => void
  renderGradient?: GradientRenderer
  /** Pass `useSafeAreaInsets()` if the app has a safe-area provider */
  insets?: EdgeInsets
  renderOverlay?: OverlayRenderer
}

export function BevelProvider({
  children,
  theme = defaultTheme,
  preference,
  initialPreference = 'system',
  onPreferenceChange,
  renderGradient,
  insets = ZERO_INSETS,
  renderOverlay,
}: BevelProviderProps) {
  const systemScheme = useColorScheme()
  const [internal, setInternal] = useState<ThemePreference>(initialPreference)
  const activePreference = preference ?? internal

  const scheme = resolveScheme(theme, activePreference, systemScheme)

  /**
   * The active theme is published DURING render, not in an effect.
   *
   * From an effect, children would paint their first frame with the previous
   * scheme's styles and the switch would land one frame late. The write is
   * idempotent, so repeated renders cost nothing.
   */
  setActiveTheme(theme, scheme)

  const setPreference = useCallback(
    (next: ThemePreference) => {
      if (preference === undefined) setInternal(next)
      onPreferenceChange?.(next)
    },
    [onPreferenceChange, preference],
  )

  const value = useMemo<BevelContextValue>(
    () => ({
      ...getTokens(),
      preference: activePreference,
      setPreference,
      renderGradient,
      insets,
      renderOverlay,
    }),
    [activePreference, insets, renderGradient, renderOverlay, setPreference, scheme, theme],
  )

  return <BevelContext.Provider value={value}>{children}</BevelContext.Provider>
}

function resolveScheme(
  theme: Theme,
  preference: ThemePreference,
  systemScheme: ColorSchemeName,
): string {
  if (preference !== 'system' && theme.schemes[preference]) return preference
  const names = Object.keys(theme.schemes)
  // A single-scheme theme ignores the OS setting: there is only one right answer
  if (names.length === 1) return names[0]!
  if (preference === 'system' && systemScheme != null && theme.schemes[systemScheme]) {
    return systemScheme
  }
  return theme.defaultScheme
}

/**
 * Theme access AND subscription.
 *
 * Call it even when the component reads no color: the style proxy returns the
 * current sheet but does not trigger a re-render on its own.
 */
export function useTheme(): BevelContextValue {
  const ctx = useContext(BevelContext)
  if (ctx) return ctx
  // Used without a provider: fall back to the default theme instead of throwing
  return {
    ...getTokens(),
    preference: 'system',
    setPreference: noop,
    renderGradient: undefined,
    insets: ZERO_INSETS,
    renderOverlay: undefined,
  }
}

/** Injected safe-area insets, or zeros when the app passes none */
export function useInsets(): EdgeInsets {
  return useTheme().insets
}

function noop() {}
