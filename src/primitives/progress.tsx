import { memo, useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

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
 *
 * The two modes are the SAME two values rather than two different transforms,
 * so learning the real figure mid-task animates - the sweeping segment slides
 * home to the left edge and settles at the number - instead of cutting. That
 * moment is the common one: work usually starts before its size is known.
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
  const indeterminate = value == null

  /** How much of the track the segment covers, 0 to 1 */
  const size = useRef(new Animated.Value(indeterminate ? SWEEP_SIZE : (value ?? 0))).current
  /** Where its left edge sits, in points */
  const slide = useRef(new Animated.Value(0)).current
  const [track, setTrack] = useState(0)

  const onTrackLayout = useCallback((event: LayoutChangeEvent) => {
    const measured = event.nativeEvent.layout.width
    setTrack((previous) => (previous === measured ? previous : measured))
  }, [])

  useEffect(() => {
    if (indeterminate) return
    Animated.parallel([
      Animated.timing(size, {
        toValue: Math.min(1, Math.max(0, value)),
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Wherever the sweep had got to, it comes back to the left edge
      Animated.timing(slide, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start()
  }, [indeterminate, size, slide, value])

  useEffect(() => {
    // Nothing to sweep across until the track has been measured. Interpolating
    // a guess is what makes a bar overshoot on a wide screen and stop short on
    // a narrow one.
    if (!indeterminate || track === 0) return

    size.setValue(SWEEP_SIZE)
    const segment = track * SWEEP_SIZE
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(slide, {
          toValue: track,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        // Jumps back off the leading edge rather than sliding back, which would
        // read as the work having gone into reverse
        Animated.timing(slide, {
          toValue: -segment,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    )
    slide.setValue(-segment)
    loop.start()
    return () => loop.stop()
  }, [indeterminate, size, slide, track])

  const accent = resolveColor(colors, tone, colors.accent)
  const trackFill = resolveColor(colors, trackColor, colors.sunk)

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
        accessibilityValue={
          value != null ? { now: Math.round(value * 100), min: 0, max: 100 } : undefined
        }
        onLayout={onTrackLayout}
        style={{
          height,
          borderRadius: height / 2,
          backgroundColor: trackFill,
          overflow: 'hidden',
        }}>
        <Animated.View
          style={[
            styles.bar,
            {
              backgroundColor: accent,
              // Translate before scale, so the slide is in points rather than
              // in whatever fraction the bar happens to be showing
              transform: [{ translateX: slide }, { scaleX: size }],
            },
          ]}
        />
      </View>
    </View>
  )
}

/** How much of the track the indeterminate segment covers */
const SWEEP_SIZE = 0.35

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
