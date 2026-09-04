import { memo, type ReactNode } from 'react'
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { alpha, resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import type { ColorInput, RadiusToken } from '../theme/types'
import { Text } from './text'

export type ChipProps = {
  label: string
  selected?: boolean
  onPress?: () => void
  /** Shows a remove affordance - filter chips the user has applied */
  onRemove?: () => void
  left?: ReactNode
  disabled?: boolean
  tone?: ColorInput
  radius?: RadiusToken | number
  style?: StyleProp<ViewStyle>
}

/**
 * Filter or choice chip.
 *
 * Selection is carried by fill and border together rather than by color alone,
 * so the state survives a screenshot in greyscale and is legible to users who
 * cannot separate the two hues.
 */
function ChipBase({
  label,
  selected = false,
  onPress,
  onRemove,
  left,
  disabled = false,
  tone = 'accent',
  radius = 'pill',
  style,
}: ChipProps) {
  const { colors, radius: radii, space, sizes } = useTheme()

  const accent = resolveColor(colors, tone, colors.accent)
  const borderRadius = typeof radius === 'number' ? radius : (radii[radius] ?? radii.pill)

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled || onPress == null}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      style={({ pressed }) => [
        styles.chip,
        {
          borderRadius,
          paddingHorizontal: space(3),
          paddingVertical: space(1.5),
          gap: space(1.5),
          backgroundColor: selected ? alpha(accent, 0.16) : colors.raised,
          borderWidth: 1,
          borderColor: selected ? accent : 'transparent',
          opacity: disabled ? 0.5 : pressed ? 0.75 : 1,
        },
        style,
      ]}>
      {left}
      <Text variant="caption" style={{ color: selected ? accent : colors.text }} numberOfLines={1}>
        {label}
      </Text>
      {onRemove != null && (
        <Pressable
          onPress={onRemove}
          hitSlop={sizes.hitSlop}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${label}`}
          style={styles.remove}>
          <View
            style={[styles.removeBar, { backgroundColor: selected ? accent : colors.textMuted }]}
          />
          <View
            style={[
              styles.removeBar,
              styles.removeBarCross,
              { backgroundColor: selected ? accent : colors.textMuted },
            ]}
          />
        </Pressable>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  remove: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  removeBar: { position: 'absolute', width: 10, height: 1.5, transform: [{ rotate: '45deg' }] },
  removeBarCross: { transform: [{ rotate: '-45deg' }] },
})

export const Chip = memo(ChipBase)
