import { memo, type ReactNode } from 'react'
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import type { ColorInput, SizeToken } from '../theme/types'
import { Text } from './text'

export type RadioProps = {
  selected: boolean
  onSelect?: () => void
  label?: string
  description?: string
  disabled?: boolean
  size?: SizeToken
  tone?: ColorInput
  reversed?: boolean
  children?: ReactNode
  style?: StyleProp<ViewStyle>
}

const DOT: Record<SizeToken, number> = { sm: 18, md: 22, lg: 26 }

function RadioBase({
  selected,
  onSelect,
  label,
  description,
  disabled = false,
  size = 'md',
  tone = 'accent',
  reversed = false,
  children,
  style,
}: RadioProps) {
  const { colors, space, sizes } = useTheme()

  const outer = DOT[size]
  const accent = resolveColor(colors, tone, colors.accent)

  return (
    <Pressable
      onPress={disabled ? undefined : onSelect}
      disabled={disabled}
      hitSlop={sizes.hitSlop}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
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
      <View
        style={{
          width: outer,
          height: outer,
          borderRadius: outer / 2,
          borderWidth: 2,
          borderColor: selected ? accent : colors.borderStrong,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {selected && (
          <View
            style={{
              width: outer * 0.45,
              height: outer * 0.45,
              borderRadius: outer,
              backgroundColor: accent,
            }}
          />
        )}
      </View>

      {children ??
        (label != null || description != null ? (
          <View style={{ flex: 1, gap: 2 }}>
            {label != null && <Text variant="body">{label}</Text>}
            {description != null && (
              <Text variant="caption" color="textMuted">
                {description}
              </Text>
            )}
          </View>
        ) : null)}
    </Pressable>
  )
}

export type RadioOption<T> = {
  value: T
  label: string
  description?: string
  disabled?: boolean
}

export type RadioGroupProps<T> = {
  value: T | null
  onChange: (value: T) => void
  options: readonly RadioOption<T>[]
  /** Lays the options out in a row - two or three short choices */
  horizontal?: boolean
  size?: SizeToken
  tone?: ColorInput
  gap?: number
  style?: StyleProp<ViewStyle>
}

/**
 * Grouped radios.
 *
 * The group owns the selection so no caller has to write the "unset the others"
 * logic, and it carries `accessibilityRole="radiogroup"`, which is what lets a
 * screen reader announce "2 of 4" instead of four unrelated controls.
 */
export function RadioGroup<T>({
  value,
  onChange,
  options,
  horizontal = false,
  size,
  tone,
  gap,
  style,
}: RadioGroupProps<T>) {
  const { space } = useTheme()
  return (
    <View
      accessibilityRole="radiogroup"
      style={[
        {
          flexDirection: horizontal ? 'row' : 'column',
          gap: gap ?? space(horizontal ? 4 : 3),
          flexWrap: horizontal ? 'wrap' : 'nowrap',
        },
        style,
      ]}>
      {options.map((option, index) => (
        <Radio
          key={`${String(option.value)}-${index}`}
          selected={option.value === value}
          onSelect={() => onChange(option.value)}
          label={option.label}
          description={option.description}
          disabled={option.disabled}
          size={size}
          tone={tone}
          style={horizontal ? undefined : styles.stretch}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { alignItems: 'center' },
  stretch: { alignSelf: 'stretch' },
})

export const Radio = memo(RadioBase)
