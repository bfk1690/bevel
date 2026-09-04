import { memo, useEffect, useMemo, useRef, useState } from 'react'
import {
  AccessibilityInfo,
  Animated,
  Easing,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import type { ColorInput, RadiusToken } from '../theme/types'

export type SkeletonProps = {
  width?: DimensionValue
  height?: number
  radius?: RadiusToken | number
  /** Renders a circle and ignores `radius` - avatars, icon slots */
  circle?: boolean
  /**
   * Stacks this many bars. The last one is shortened, which is what makes a
   * block read as a paragraph rather than a table.
   */
  lines?: number
  gap?: number
  color?: ColorInput
  style?: StyleProp<ViewStyle>
}

const CYCLE = 750

function SkeletonBase({
  width = '100%',
  height = 14,
  radius = 'xs',
  circle = false,
  lines = 1,
  gap,
  color = 'skeleton',
  style,
}: SkeletonProps) {
  const { colors, radius: radii, space } = useTheme()
  const pulse = useRef(new Animated.Value(0)).current
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    let alive = true
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (alive) setReduceMotion(enabled)
    })
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion)
    return () => {
      alive = false
      sub.remove()
    }
  }, [])

  useEffect(() => {
    // A pulsing placeholder is motion the user did not ask for. Honour the
    // system setting and hold a steady tone instead.
    if (reduceMotion) {
      pulse.setValue(0.5)
      return
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: CYCLE,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: CYCLE,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [pulse, reduceMotion])

  const opacity = useMemo(
    () => pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
    [pulse],
  )

  const borderRadius = circle
    ? height / 2
    : typeof radius === 'number'
      ? radius
      : (radii[radius] ?? radii.xs)

  const backgroundColor = resolveColor(colors, color, colors.skeleton)
  const rowGap = gap ?? space(2)

  const bar = (key: number, barWidth: DimensionValue) => (
    <Animated.View
      key={key}
      style={{
        width: barWidth,
        height,
        borderRadius,
        backgroundColor,
        opacity,
      }}
    />
  )

  if (lines <= 1) {
    return (
      <View
        style={[circle ? { width: height, height } : null, style]}
        accessibilityRole="progressbar"
        accessibilityLabel="Loading">
        {bar(0, circle ? height : width)}
      </View>
    )
  }

  return (
    <View style={[{ gap: rowGap }, style]} accessibilityRole="progressbar" accessibilityLabel="Loading">
      {Array.from({ length: lines }, (_, index) =>
        bar(index, index === lines - 1 ? '62%' : width),
      )}
    </View>
  )
}

export const Skeleton = memo(SkeletonBase)
