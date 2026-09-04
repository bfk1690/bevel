import { memo, type ReactNode } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { alpha, readableOn, resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import type { ColorInput, RadiusToken, TypeToken } from '../theme/types'
import { Text } from './text'

export type BadgeProps = {
  label?: string
  children?: ReactNode
  /** A role name (`accent`, `ok`, `danger`) or a raw color */
  tone?: ColorInput
  /** `soft` is the default: a full-strength chip competes with real actions */
  variant?: 'soft' | 'solid' | 'outline'
  size?: 'sm' | 'md'
  /** Leading status dot */
  dot?: boolean
  radius?: RadiusToken | number
  style?: StyleProp<ViewStyle>
}

const TYPE: Record<'sm' | 'md', TypeToken> = { sm: 'micro', md: 'caption' }

function BadgeBase({
  label,
  children,
  tone = 'accent',
  variant = 'soft',
  size = 'sm',
  dot = false,
  radius = 'xs',
  style,
}: BadgeProps) {
  const { colors, radius: radii, space } = useTheme()

  const base = resolveColor(colors, tone, colors.accent)
  // Prefer a designed soft counterpart when the palette defines one; fall back
  // to a derived tint so any raw color works too.
  const soft = colors[`${String(tone)}Soft`] ?? alpha(base, 0.16)

  const background = variant === 'solid' ? base : variant === 'soft' ? soft : 'transparent'
  const foreground =
    variant === 'solid' ? (colors[`on${capitalize(String(tone))}`] ?? readableOn(base)) : base

  const borderRadius = typeof radius === 'number' ? radius : (radii[radius] ?? radii.xs)

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: background,
          borderColor: variant === 'outline' ? base : 'transparent',
          borderWidth: variant === 'outline' ? 1 : 0,
          borderRadius,
          paddingHorizontal: space(size === 'sm' ? 1.5 : 2),
          paddingVertical: space(size === 'sm' ? 0.5 : 1),
          gap: space(1),
        },
        style,
      ]}>
      {dot && <View style={[styles.dot, { backgroundColor: foreground }]} />}
      {children ??
        (label != null && (
          <Text variant={TYPE[size]} style={{ color: foreground }} numberOfLines={1}>
            {label}
          </Text>
        ))}
    </View>
  )
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 3 },
})

export const Badge = memo(BadgeBase)
