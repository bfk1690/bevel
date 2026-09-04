import { Platform, type ViewStyle } from 'react-native'

import type { ShadowPreset } from './types'

/**
 * Shadows.
 *
 * iOS and Android need SEPARATE values, not one spec translated. Android's
 * `elevation` draws a hard line under a bordered card, which is why the `card`
 * preset ships with elevation 0 on purpose.
 *
 * On dark themes shadows are nearly invisible (black over black); depth there
 * comes from surface lightness instead. `'none'` is a first-class choice.
 */

type ShadowOpts = {
  color?: string
  offsetY?: number
  opacity?: number
  radius?: number
  elevation?: number
}

export function platformShadow({
  color = '#000000',
  offsetY = 2,
  opacity = 0.06,
  radius = 8,
  elevation = 0,
}: ShadowOpts): ViewStyle {
  if (Platform.OS === 'ios') {
    return {
      shadowColor: color,
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radius,
    }
  }
  if (Platform.OS === 'android') return elevation > 0 ? { elevation } : {}
  // web and anything else
  return {}
}

const PRESETS: Record<Exclude<ShadowPreset, 'none'>, Required<Omit<ShadowOpts, 'color'>>> = {
  /** Bordered list rows and cards */
  card: { offsetY: 2, opacity: 0.04, radius: 8, elevation: 0 },
  /** Floating pill or search field */
  float: { offsetY: 4, opacity: 0.08, radius: 12, elevation: 3 },
  /** Bottom dock or checkout bar */
  dock: { offsetY: 4, opacity: 0.08, radius: 14, elevation: 8 },
  /** Top-level notification surface */
  toast: { offsetY: 6, opacity: 0.18, radius: 16, elevation: 12 },
}

export function shadow(preset: ShadowPreset, color = '#000000'): ViewStyle {
  if (preset === 'none') return {}
  return platformShadow({ color, ...PRESETS[preset] })
}
