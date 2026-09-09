import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

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
 *
 * It can be dragged as well as tapped. The platform switch has always worked
 * that way, and a finger that lands on the thumb and pushes is making a
 * perfectly clear statement - refusing it and waiting for a tap feels like the
 * control did not notice.
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
  /** True once a drag has moved far enough to count, so the tap is not fired too */
  const dragged = useRef(false)

  useEffect(() => {
    Animated.timing(position, {
      toValue: value ? 1 : 0,
      duration: 170,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [position, value])

  const settle = useCallback(
    (next: boolean) => {
      if (next !== value) onChange?.(next)
      else {
        // Snapped back to where it started: the spring still has to play out
        Animated.timing(position, {
          toValue: value ? 1 : 0,
          duration: 140,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start()
      }
    },
    [onChange, position, value],
  )

  const drag = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        // Only once the finger has actually travelled: claiming the gesture on
        // touch would swallow the tap.
        onMoveShouldSetPanResponder: (_event, gesture) => !disabled && Math.abs(gesture.dx) > 4,
        onPanResponderGrant: () => {
          dragged.current = true
        },
        onPanResponderMove: (_event, gesture) => {
          const from = value ? 1 : 0
          position.setValue(Math.min(1, Math.max(0, from + gesture.dx / travel)))
        },
        onPanResponderRelease: (_event, gesture) => {
          const from = value ? 1 : 0
          const ratio = from + gesture.dx / travel
          settle(ratio >= 0.5)
          // Cleared on the next tick so the tap that follows the release is
          // still recognised as part of this gesture
          setTimeout(() => {
            dragged.current = false
          }, 0)
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [disabled, position, settle, travel, value],
  )

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
          // The knob rides ON the track's fill, which is what `onAccent` names
          // - and it is white in both schemes, as it is on every platform. As
          // `canvas` it turned black in dark mode: legible on blue, but not a
          // switch anybody recognises
          backgroundColor: colors.onAccent,
          transform: [
            { translateX: position.interpolate({ inputRange: [0, 1], outputRange: [0, travel] }) },
          ],
        }}
      />
    </View>
  )

  return (
    <Pressable
      onPress={disabled || dragged.current ? undefined : () => onChange?.(!value)}
      disabled={disabled}
      hitSlop={sizes.hitSlop}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.row,
        { gap: space(3), opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
        style,
      ]}
      {...drag.panHandlers}>
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
