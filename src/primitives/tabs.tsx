import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import type { ColorInput, SizeToken } from '../theme/types'
import { Badge } from './badge'
import { Text } from './text'

export type TabItem<T> = {
  value: T
  label: string
  /** Count or short marker after the label */
  badge?: string | number
  disabled?: boolean
}

export type TabsProps<T> = {
  value: T
  onChange: (value: T) => void
  items: readonly TabItem<T>[]
  /**
   * Lays the tabs out in a horizontal scroller instead of dividing the width.
   *
   * Past four or five, equal widths squeeze every label into two truncated
   * words. A scroller keeps them readable and admits that the list is long.
   */
  scrollable?: boolean
  size?: SizeToken
  tone?: ColorInput
  /** Hairline under the strip, separating it from the content it filters */
  divider?: boolean
  /**
   * Page position, in pages, when the tabs sit above something swipeable.
   *
   * Given one, the indicator follows the FINGER rather than jumping once the
   * swipe has settled. A tab strip that only catches up afterwards makes the
   * gesture feel like it was reported to the screen rather than performed on
   * it.
   */
  offset?: Animated.AnimatedInterpolation<number> | Animated.Value
  style?: StyleProp<ViewStyle>
}

type Measurement = { x: number; width: number }

/**
 * Tab strip.
 *
 * Sits above the content it switches, and marks the selection with a line
 * under the label rather than a filled pill - a pill reads as a button, and
 * these are not buttons; they are a place you already are.
 *
 * The indicator is one view scaled and translated on the native driver, so it
 * slides smoothly while the screen underneath is swapping its content.
 */
export function Tabs<T>({
  value,
  onChange,
  items,
  scrollable = false,
  size = 'md',
  tone = 'accent',
  divider = true,
  offset,
  style,
}: TabsProps<T>) {
  const { colors, space, sizes } = useTheme()
  const scroller = useRef<ScrollView>(null)
  const [measurements, setMeasurements] = useState<Record<number, Measurement>>({})
  const [stripWidth, setStripWidth] = useState(0)

  const index = Math.max(
    0,
    items.findIndex((item) => item.value === value),
  )
  const current = measurements[index]

  /**
   * The indicator is a one-point view that is scaled, not resized.
   *
   * Width cannot run on the native driver and transform can, so scaling a
   * fixed base keeps both the slide and the stretch off the JS thread.
   */
  const position = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(1)).current
  const settled = useRef(false)

  /** Every tab measured, which is what an offset-driven indicator needs */
  const measured = useMemo(() => {
    const all: Measurement[] = []
    for (let index = 0; index < items.length; index += 1) {
      const entry = measurements[index]
      if (!entry) return null
      all.push(entry)
    }
    return all.length > 0 ? all : null
  }, [items.length, measurements])

  const driven = offset != null && measured != null && measured.length > 1

  useEffect(() => {
    // While the indicator is driven by a finger, animating it as well would be
    // two things fighting over the same value.
    if (driven) return
    if (!current) return

    if (!settled.current) {
      // The first paint must not animate: the indicator would appear to slide
      // in from the first tab before the user has touched anything.
      position.setValue(current.x)
      scale.setValue(current.width)
      settled.current = true
      return
    }

    Animated.parallel([
      Animated.timing(position, {
        toValue: current.x,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: current.width,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start()
  }, [current, driven, position, scale])

  // Keep the selected tab reachable when the strip scrolls
  useEffect(() => {
    if (!scrollable || !current || stripWidth === 0) return
    const target = current.x + current.width / 2 - stripWidth / 2
    scroller.current?.scrollTo({ x: Math.max(0, target), animated: true })
  }, [current, scrollable, stripWidth])

  const measure = useCallback((position: number, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout
    setMeasurements((previous) => {
      const known = previous[position]
      if (known && known.x === x && known.width === width) return previous
      return { ...previous, [position]: { x, width } }
    })
  }, [])

  const accent = resolveColor(colors, tone, colors.accent)
  const paddingVertical = size === 'sm' ? space(2) : space(3)

  const strip = (
    <View style={styles.strip}>
      {items.map((item, itemIndex) => {
        const selected = itemIndex === index
        return (
          <Pressable
            key={`${String(item.value)}-${itemIndex}`}
            onLayout={(event) => measure(itemIndex, event)}
            onPress={() => onChange(item.value)}
            disabled={item.disabled}
            accessibilityRole="tab"
            accessibilityState={{ selected, disabled: item.disabled }}
            accessibilityLabel={item.label}
            hitSlop={{ top: sizes.hitSlop, bottom: sizes.hitSlop }}
            style={({ pressed }) => [
              styles.tab,
              {
                flex: scrollable ? 0 : 1,
                paddingVertical,
                paddingHorizontal: scrollable ? space(4) : space(2),
                gap: space(1.5),
                opacity: item.disabled ? 0.4 : pressed ? 0.7 : 1,
              },
            ]}>
            <Text
              variant={size === 'sm' ? 'caption' : 'label'}
              numberOfLines={1}
              style={{ color: selected ? accent : colors.textMuted }}>
              {item.label}
            </Text>
            {item.badge != null && (
              <Badge label={String(item.badge)} tone={selected ? tone : 'textMuted'} size="sm" />
            )}
          </Pressable>
        )
      })}

      {(current || driven) && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            {
              backgroundColor: accent,
              transform: driven
                ? [
                    {
                      translateX: offset.interpolate({
                        inputRange: measured.map((_, index) => index),
                        outputRange: measured.map((entry) => entry.x),
                        extrapolate: 'clamp',
                      }),
                    },
                    {
                      scaleX: offset.interpolate({
                        inputRange: measured.map((_, index) => index),
                        outputRange: measured.map((entry) => entry.width),
                        extrapolate: 'clamp',
                      }),
                    },
                  ]
                : [{ translateX: position }, { scaleX: scale }],
            },
          ]}
        />
      )}
    </View>
  )

  return (
    <View
      accessibilityRole="tablist"
      onLayout={(event) => setStripWidth(event.nativeEvent.layout.width)}
      style={[
        divider && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        style,
      ]}>
      {scrollable ? (
        <ScrollView
          ref={scroller}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {strip}
        </ScrollView>
      ) : (
        strip
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  strip: { flexDirection: 'row', alignItems: 'flex-end' },
  scrollContent: { flexGrow: 1 },
  tab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  indicator: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    // One point wide, stretched to the tab's measured width. Scaling from the
    // left edge is what makes the translation and the stretch agree.
    width: 1,
    height: 2,
    transformOrigin: 'left',
  },
})
