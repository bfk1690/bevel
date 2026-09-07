import { memo, useCallback, useEffect, useRef } from 'react'
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import type { ColorInput, RadiusToken, SizeToken } from '../theme/types'
import { Text } from './text'

export type StepperProps = {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  /**
   * Holding a button keeps counting, faster the longer it is held.
   *
   * Going from one to forty by tapping is forty taps; the alternative is a
   * keyboard for a number the user is only nudging.
   */
  repeat?: boolean
  formatValue?: (value: number) => string
  size?: SizeToken
  tone?: ColorInput
  radius?: RadiusToken | number
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

const FIRST_REPEAT_MS = 420
const FASTEST_REPEAT_MS = 60

/**
 * Quantity control.
 *
 * Deliberately not built from two Buttons: a stepper is the one control where
 * repeat presses are the point, and Button guards against them by default.
 */
function StepperBase({
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  repeat = true,
  formatValue,
  size = 'md',
  tone = 'text',
  radius = 'sm',
  disabled = false,
  style,
}: StepperProps) {
  const { colors, radius: radii, space, sizes } = useTheme()

  const height = sizes.control[size]
  const borderRadius = typeof radius === 'number' ? radius : (radii[radius] ?? radii.sm)
  const glyph = resolveColor(colors, tone, colors.text)

  const canDecrease = !disabled && value - step >= min
  const canIncrease = !disabled && value + step <= max

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latest = useRef(value)
  latest.current = value

  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }, [])

  // A held button that survives unmounting would keep counting into a screen
  // that is no longer there.
  useEffect(() => stop, [stop])

  const apply = useCallback(
    (direction: 1 | -1) => {
      const next = latest.current + direction * step
      if (next < min || next > max) {
        stop()
        return false
      }
      latest.current = next
      onChange(next)
      return true
    },
    [max, min, onChange, step, stop],
  )

  const hold = useCallback(
    (direction: 1 | -1) => {
      if (!repeat) return
      let delay = FIRST_REPEAT_MS
      const tick = () => {
        if (!apply(direction)) return
        // Each repeat comes a little sooner, so a long hold covers ground
        delay = Math.max(FASTEST_REPEAT_MS, delay * 0.82)
        timer.current = setTimeout(tick, delay)
      }
      timer.current = setTimeout(tick, delay)
    },
    [apply, repeat],
  )

  return (
    <View
      accessibilityRole="adjustable"
      accessibilityValue={{ now: value, min, max }}
      style={[
        styles.root,
        {
          height,
          borderRadius,
          backgroundColor: colors.sunk,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}>
      <Step
        sign="minus"
        color={glyph}
        size={height}
        enabled={canDecrease}
        onPress={() => apply(-1)}
        onHold={() => hold(-1)}
        onRelease={stop}
        label="Decrease"
      />

      <View style={[styles.value, { minWidth: height, paddingHorizontal: space(1) }]}>
        <Text variant={size === 'sm' ? 'caption' : 'bodyStrong'} numberOfLines={1}>
          {formatValue ? formatValue(value) : String(value)}
        </Text>
      </View>

      <Step
        sign="plus"
        color={glyph}
        size={height}
        enabled={canIncrease}
        onPress={() => apply(1)}
        onHold={() => hold(1)}
        onRelease={stop}
        label="Increase"
      />
    </View>
  )
}

function Step({
  sign,
  color,
  size,
  enabled,
  onPress,
  onHold,
  onRelease,
  label,
}: {
  sign: 'plus' | 'minus'
  color: string
  size: number
  enabled: boolean
  onPress: () => void
  onHold: () => void
  onRelease: () => void
  label: string
}) {
  const bar = Math.max(1.5, size * 0.05)
  const length = size * 0.34
  return (
    <Pressable
      onPress={enabled ? onPress : undefined}
      onLongPress={enabled ? onHold : undefined}
      onPressOut={onRelease}
      disabled={!enabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !enabled }}
      style={({ pressed }) => [
        styles.step,
        { width: size, opacity: enabled ? (pressed ? 0.5 : 1) : 0.3 },
      ]}>
      <View style={{ width: length, height: bar, borderRadius: bar, backgroundColor: color }} />
      {sign === 'plus' && (
        <View
          style={{
            position: 'absolute',
            width: bar,
            height: length,
            borderRadius: bar,
            backgroundColor: color,
          }}
        />
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  step: { alignItems: 'center', justifyContent: 'center', height: '100%' },
  value: { alignItems: 'center', justifyContent: 'center' },
})

export const Stepper = memo(StepperBase)
