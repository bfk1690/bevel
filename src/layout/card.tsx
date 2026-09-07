import { memo, type ReactNode } from 'react'
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native'

import { resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import { shadow as shadowStyle } from '../theme/shadow'
import type { ColorInput, RadiusToken, ShadowPreset } from '../theme/types'
import { Text } from '../primitives/text'

export type CardProps = {
  children?: ReactNode
  title?: string
  subtitle?: string
  /** Trailing node in the title row - a badge, a chevron, an action */
  right?: ReactNode
  onPress?: () => void
  /** Usually a menu of things to do with what the card shows */
  onLongPress?: () => void
  bg?: ColorInput
  border?: ColorInput
  radius?: RadiusToken | number
  shadow?: ShadowPreset
  padding?: number
  gap?: number
  style?: StyleProp<ViewStyle>
}

function CardBase({
  children,
  title,
  subtitle,
  right,
  onPress,
  onLongPress,
  bg = 'surface',
  border = 'border',
  radius = 'md',
  shadow = 'card',
  padding,
  gap,
  style,
}: CardProps) {
  const { colors, radius: radii, space } = useTheme()

  const borderRadius = typeof radius === 'number' ? radius : (radii[radius] ?? radii.md)
  const borderColor = resolveColor(colors, border, 'transparent')

  const surface: ViewStyle = {
    backgroundColor: resolveColor(colors, bg, colors.surface),
    borderRadius,
    borderColor,
    borderWidth: borderColor === 'transparent' ? 0 : 1,
    padding: padding ?? space(4),
    gap: gap ?? space(3),
    ...shadowStyle(shadow, colors.media),
  }

  const head =
    title != null || subtitle != null || right != null ? (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space(2) }}>
        <View style={{ flex: 1, gap: space(0.5) }}>
          {title != null && <Text variant="heading">{title}</Text>}
          {subtitle != null && (
            <Text variant="caption" color="textMuted">
              {subtitle}
            </Text>
          )}
        </View>
        {right}
      </View>
    ) : null

  if (onPress || onLongPress) {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        accessibilityRole="button"
        style={({ pressed }) => [surface, pressed && { opacity: 0.75 }, style]}>
        {head}
        {children}
      </Pressable>
    )
  }

  return (
    <View style={[surface, style]}>
      {head}
      {children}
    </View>
  )
}

export const Card = memo(CardBase)
