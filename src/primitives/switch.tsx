import { memo, useEffect, useRef } from 'react'
import { Animated, Easing, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import type { ColorInput, SizeToken } from '../theme/types'
import { Text } from './text'

export type SwitchProps = {
  value: boolean
  onChange?: (value: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  size?: SizeToken
  tone?: ColorInput
  style?: StyleProp<ViewStyle>
}

const TRACK: Record<SizeToken, { width: number; height: number }> = {
  sm: { width: 40, height: 24 },
  md: { width: 50, height: 30 },
  lg: { width: 58, height: 34 },
}

/**
 * Toggle.
 *
 * The thumb is driven by one animated value on the native driver, so flipping
 * it stays smooth while the screen behind it re-renders in response.
 */
function SwitchBase({
  value,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  tone = 'accent',
  style,
}: SwitchProps) {
  const { colors, space, sizes } = useTheme()
  const track = TRACK[size]
  const inset = 3
  const thumb = track.height - inset * 2
  const travel = track.width - thumb - inset * 2

  const position = useRef(new Animated.Value(value ? 1 : 0)).current

  useEffect(() => {
    Animated.timing(position, {
      toValue: value ? 1 : 0,
      duration: 170,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [position, value])

  const accent = resolveColor(colors, tone, colors.accent)

  const control = (
    <View
      style={{
        width: track.width,
        height: track.height,
        borderRadius: track.height / 2,
        backgroundColor: value ? accent : colors.borderStrong,
        padding: inset,
        justifyContent: 'center',
      }}>
      <Animated.View
        style={{
          width: thumb,
          height: thumb,
          borderRadius: thumb / 2,
          backgroundColor: colors.canvas,
          transform: [
            { translateX: position.interpolate({ inputRange: [0, 1], outputRange: [0, travel] }) },
          ],
        }}
      />
    </View>
  )

  return (
    <Pressable
      onPress={disabled ? undefined : () => onChange?.(!value)}
      disabled={disabled}
      hitSlop={sizes.hitSlop}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.row,
        { gap: space(3), opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
        style,
      ]}>
      {(label != null || description != null) && (
        <View style={styles.body}>
          {label != null && <Text variant="body">{label}</Text>}
          {description != null && (
            <Text variant="caption" color="textMuted">
              {description}
            </Text>
          )}
        </View>
      )}
      {control}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  body: { flex: 1, gap: 2 },
})

export const Switch = memo(SwitchBase)
