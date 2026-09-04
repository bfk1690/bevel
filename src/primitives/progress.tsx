import { memo, useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import type { ColorInput } from '../theme/types'
import { Text } from './text'

export type ProgressProps = {
  /** 0 to 1. Omit for an indeterminate bar */
  value?: number
  label?: string
  /** Prints the percentage at the end of the label row */
  showValue?: boolean
  height?: number
  tone?: ColorInput
  trackColor?: ColorInput
  style?: StyleProp<ViewStyle>
}

/**
 * Progress bar.
 *
 * Both modes animate `scaleX` rather than `width`, which keeps them on the
 * native driver: a determinate bar filling during a heavy upload should not
 * stutter because JavaScript is busy.
 */
function ProgressBase({
  value,
  label,
  showValue = false,
  height = 4,
  tone = 'accent',
  trackColor = 'sunk',
  style,
}: ProgressProps) {
  const { colors, space } = useTheme()
  const fill = useRef(new Animated.Value(value ?? 0)).current
  const sweep = useRef(new Animated.Value(0)).current

  const indeterminate = value == null

  useEffect(() => {
    if (indeterminate) return
    Animated.timing(fill, {
      toValue: Math.min(1, Math.max(0, value)),
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [fill, indeterminate, value])

  useEffect(() => {
    if (!indeterminate) return
    const loop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 1100,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    )
    sweep.setValue(0)
    loop.start()
    return () => loop.stop()
  }, [indeterminate, sweep])

  const accent = resolveColor(colors, tone, colors.accent)
  const track = resolveColor(colors, trackColor, colors.sunk)

  return (
    <View style={[{ gap: space(1.5) }, style]}>
      {(label != null || showValue) && (
        <View style={styles.labelRow}>
          {label != null && (
            <Text variant="caption" color="textMuted" style={styles.label}>
              {label}
            </Text>
          )}
          {showValue && value != null && (
            <Text variant="micro" color="textFaint">{`${Math.round(value * 100)}%`}</Text>
          )}
        </View>
      )}

      <View
        accessibilityRole="progressbar"
        accessibilityValue={value != null ? { now: Math.round(value * 100), min: 0, max: 100 } : undefined}
        style={{ height, borderRadius: height / 2, backgroundColor: track, overflow: 'hidden' }}>
        <Animated.View
          style={[
            styles.bar,
            {
              backgroundColor: accent,
              transform: indeterminate
                ? [
                    { scaleX: 0.35 },
                    {
                      translateX: sweep.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-200, 200],
                      }),
                    },
                  ]
                : [{ scaleX: fill }],
            },
          ]}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { flex: 1 },
  bar: {
    width: '100%',
    height: '100%',
    // Growing from the left edge instead of the centre
    transformOrigin: 'left',
  },
})

export const Progress = memo(ProgressBase)
