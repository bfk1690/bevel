import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import { shadow as shadowStyle } from '../theme/shadow'
import type { ColorInput, RadiusToken, SizeToken } from '../theme/types'
import { Text } from './text'

export type SegmentOption<T> = {
  value: T
  label: string
  /** Replaces the label; receives the resolved size and color */
  render?: (state: { selected: boolean; size: number; color: string }) => ReactNode
  disabled?: boolean
}

export type SegmentedControlProps<T> = {
  value: T
  onChange: (value: T) => void
  options: readonly SegmentOption<T>[]
  size?: SizeToken
  /**
   * Background of the moving indicator.
   *
   * `sheet` - the top of the surface ladder - because it is the only rung that
   * separates from the `sunk` track in BOTH schemes. `canvas` was the obvious
   * choice and read correctly in light, where it is white on grey; in dark it
   * is pure black on near-black, so the selected segment was the darkest thing
   * on the screen and could not be told from the track at all. Reported from a
   * device.
   */
  tone?: ColorInput
  trackColor?: ColorInput
  radius?: RadiusToken | number
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

/**
 * Segmented control.
 *
 * The selection is a single indicator that SLIDES between segments rather than
 * a highlight that blinks from one to the next. Movement is what tells the eye
 * that these choices are one axis - a swapped background reads as two
 * unrelated states, and on a fast tap it looks like a flicker.
 *
 * The indicator moves on the native driver, so it stays smooth while the
 * screen it filters is re-rendering.
 */
export function SegmentedControl<T>({
  value,
  onChange,
  options,
  size = 'md',
  tone = 'sheet',
  trackColor = 'sunk',
  radius,
  disabled = false,
  style,
}: SegmentedControlProps<T>) {
  const { colors, radius: radii, space, sizes } = useTheme()
  const [trackWidth, setTrackWidth] = useState(0)
  const position = useRef(new Animated.Value(0)).current
  const settled = useRef(false)

  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )
  const count = Math.max(1, options.length)
  const inset = 2
  const segmentWidth = trackWidth > 0 ? (trackWidth - inset * 2) / count : 0

  useEffect(() => {
    // The first paint should not animate from segment zero - it would look
    // like the control moved on its own before the user touched anything.
    if (!settled.current) {
      position.setValue(index)
      settled.current = true
      return
    }
    Animated.timing(position, {
      toValue: index,
      duration: 190,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [index, position])

  const onTrackLayout = useCallback((event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width)
  }, [])

  const height = sizes.control[size]
  const borderRadius =
    radius === undefined
      ? radii.sm
      : typeof radius === 'number'
        ? radius
        : (radii[radius] ?? radii.sm)

  return (
    <View
      accessibilityRole="tablist"
      onLayout={onTrackLayout}
      style={[
        styles.track,
        {
          height,
          borderRadius,
          padding: inset,
          backgroundColor: resolveColor(colors, trackColor, colors.sunk),
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}>
      {segmentWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            {
              width: segmentWidth,
              borderRadius: Math.max(0, borderRadius - inset),
              backgroundColor: resolveColor(colors, tone, colors.canvas),
              transform: [
                {
                  translateX: position.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, segmentWidth],
                  }),
                },
              ],
              ...shadowStyle('card', colors.media),
            },
          ]}
        />
      )}

      {options.map((option, optionIndex) => {
        const selected = optionIndex === index
        const color = selected ? colors.text : colors.textMuted
        return (
          <Pressable
            key={`${String(option.value)}-${optionIndex}`}
            accessibilityRole="tab"
            accessibilityState={{ selected, disabled: disabled || option.disabled }}
            accessibilityLabel={option.label}
            disabled={disabled || option.disabled}
            onPress={() => onChange(option.value)}
            style={[styles.segment, { paddingHorizontal: space(2) }]}>
            {option.render ? (
              option.render({ selected, size: sizes.icon[size], color })
            ) : (
              <Text
                variant={size === 'sm' ? 'caption' : 'label'}
                numberOfLines={1}
                style={{ color, opacity: option.disabled ? 0.4 : 1 }}>
                {option.label}
              </Text>
            )}
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', alignItems: 'stretch', overflow: 'hidden' },
  indicator: { position: 'absolute', top: 2, bottom: 2, left: 2 },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})
