import { memo, type ReactNode } from 'react'
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import type { ColorInput, SizeToken } from '../theme/types'
import { Text } from './text'

export type CheckboxProps = {
  checked: boolean
  onChange?: (checked: boolean) => void
  label?: string
  description?: string
  /** Neither on nor off - a parent whose children are partly selected */
  indeterminate?: boolean
  disabled?: boolean
  size?: SizeToken
  tone?: ColorInput
  /** `round` reads as a selection marker rather than a form control */
  shape?: 'square' | 'round'
  /** Puts the box after the label - settings rows usually want this */
  reversed?: boolean
  children?: ReactNode
  style?: StyleProp<ViewStyle>
}

const BOX: Record<SizeToken, number> = { sm: 18, md: 22, lg: 26 }

function CheckboxBase({
  checked,
  onChange,
  label,
  description,
  indeterminate = false,
  disabled = false,
  size = 'md',
  tone = 'accent',
  shape = 'square',
  reversed = false,
  children,
  style,
}: CheckboxProps) {
  const { colors, radius, space, sizes } = useTheme()

  const box = BOX[size]
  const active = checked || indeterminate
  const accent = resolveColor(colors, tone, colors.accent)
  const onTone = colors[`on${capitalize(String(tone))}`] ?? colors.onAccent

  const marker = (
    <View
      style={[
        {
          width: box,
          height: box,
          borderRadius: shape === 'round' ? box / 2 : radius.xs,
          borderWidth: active ? 0 : 1.5,
          borderColor: colors.borderStrong,
          backgroundColor: active ? accent : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}>
      {indeterminate ? (
        <View style={{ width: box * 0.5, height: 2, backgroundColor: onTone, borderRadius: 1 }} />
      ) : checked ? (
        // The tick is two borders of a rotated box: an icon dependency for one
        // glyph would be a poor trade.
        <View
          style={{
            width: box * 0.3,
            height: box * 0.52,
            borderRightWidth: 2,
            borderBottomWidth: 2,
            borderColor: onTone,
            transform: [{ rotate: '45deg' }, { translateY: -box * 0.05 }],
          }}
        />
      ) : null}
    </View>
  )

  const body =
    children ??
    (label != null || description != null ? (
      <View style={{ flex: 1, gap: 2 }}>
        {label != null && <Text variant="body">{label}</Text>}
        {description != null && (
          <Text variant="caption" color="textMuted">
            {description}
          </Text>
        )}
      </View>
    ) : null)

  return (
    <Pressable
      onPress={disabled ? undefined : () => onChange?.(!checked)}
      disabled={disabled}
      hitSlop={sizes.hitSlop}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: indeterminate ? 'mixed' : checked, disabled }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.row,
        {
          gap: space(2.5),
          opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
          flexDirection: reversed ? 'row-reverse' : 'row',
        },
        style,
      ]}>
      {marker}
      {body}
    </Pressable>
  )
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

const styles = StyleSheet.create({
  row: { alignItems: 'center' },
})

export const Checkbox = memo(CheckboxBase)
