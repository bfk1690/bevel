import { useCallback, useMemo, useRef, useState } from 'react'
import {
  PanResponder,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import { shadow as shadowStyle } from '../theme/shadow'
import type { ColorInput } from '../theme/types'
import {
  nearestBound,
  orderRange,
  positionOfValue,
  valueOfPosition,
  type SliderScale,
} from '../utils/slider'
import { Text } from './text'

type Common = {
  min?: number
  max?: number
  /** 0 or omitted is continuous */
  step?: number
  label?: string
  /** Prints the current value at the end of the label row */
  showValue?: boolean
  formatValue?: (value: number) => string
  disabled?: boolean
  tone?: ColorInput
  trackColor?: ColorInput
  height?: number
  style?: StyleProp<ViewStyle>
}

export type SliderProps =
  | (Common & {
      range?: false
      value: number
      onChange: (value: number) => void
      /** Fires once, when the finger lifts - for anything expensive */
      onSettle?: (value: number) => void
    })
  | (Common & {
      range: true
      value: readonly [number, number]
      onChange: (value: [number, number]) => void
      onSettle?: (value: [number, number]) => void
    })

/**
 * Slider.
 *
 * The arithmetic lives in `utils/slider` and is tested there, because the
 * cases that matter are edges: a track that has not been measured, a range of
 * zero length, and a step that does not divide the range - where the slider
 * must still reach its own maximum.
 *
 * `onChange` fires continuously and `onSettle` once. Anything expensive - a
 * network call, a re-render of a list - belongs on the second.
 */
export function Slider(props: SliderProps) {
  const {
    min = 0,
    max = 100,
    step = 0,
    label,
    showValue = false,
    formatValue,
    disabled = false,
    tone = 'accent',
    trackColor = 'sunk',
    height = 4,
    style,
  } = props

  const { colors, radius, space, sizes } = useTheme()
  const [width, setWidth] = useState(0)
  const scale: SliderScale = useMemo(() => ({ min, max, step }), [max, min, step])

  const isRange = props.range === true
  const [start, end] = isRange ? props.value : [min, props.value]
  /** Which bound the finger took hold of, kept for the whole drag */
  const holding = useRef<'start' | 'end'>('end')

  const latest = useRef<[number, number]>([start, end])
  latest.current = [start, end]

  const report = useCallback(
    (next: [number, number], settled: boolean) => {
      if (isRange) {
        const ordered = orderRange(next[0], next[1])
        props.onChange(ordered)
        if (settled) props.onSettle?.(ordered)
        return
      }
      props.onChange(next[1])
      if (settled) props.onSettle?.(next[1])
    },
    [isRange, props],
  )

  const move = useCallback(
    (position: number, settled: boolean) => {
      const value = valueOfPosition(position, scale, width)
      const [currentStart, currentEnd] = latest.current
      if (!isRange) {
        report([currentStart, value], settled)
        return
      }
      const bound = holding.current
      report(bound === 'start' ? [value, currentEnd] : [currentStart, value], settled)
    },
    [isRange, report, scale, width],
  )

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: (event) => {
          const position = event.nativeEvent.locationX
          if (isRange) {
            // Whichever bound the finger landed nearer to is the one it drags,
            // decided once so it cannot swap mid-gesture.
            const value = valueOfPosition(position, scale, width)
            holding.current = nearestBound(value, latest.current[0], latest.current[1])
          }
          move(position, false)
        },
        onPanResponderMove: (event) => move(event.nativeEvent.locationX, false),
        onPanResponderRelease: (event) => move(event.nativeEvent.locationX, true),
        onPanResponderTerminationRequest: () => false,
      }),
    [disabled, isRange, move, scale, width],
  )

  const onTrackLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width)
  }, [])

  const accent = resolveColor(colors, tone, colors.accent)
  const track = resolveColor(colors, trackColor, colors.sunk)
  const thumb = Math.round(sizes.icon.md * 1.2)

  const startX = positionOfValue(start, scale, width)
  const endX = positionOfValue(end, scale, width)
  const print = (value: number) => (formatValue ? formatValue(value) : String(Math.round(value)))

  return (
    <View style={[{ gap: space(2), opacity: disabled ? 0.5 : 1 }, style]}>
      {(label != null || showValue) && (
        <View style={styles.labelRow}>
          {label != null && (
            <Text variant="caption" color="textMuted" style={styles.label}>
              {label}
            </Text>
          )}
          {showValue && (
            <Text variant="caption">
              {isRange ? `${print(start)} - ${print(end)}` : print(end)}
            </Text>
          )}
        </View>
      )}

      <View
        accessibilityRole="adjustable"
        accessibilityValue={{ now: Math.round(end), min, max }}
        onLayout={onTrackLayout}
        // The touch area is taller than the line: a 4pt track is not a target,
        // and padding here is cheaper than a transparent overlay.
        style={[styles.touch, { height: thumb + space(2) }]}
        {...responder.panHandlers}>
        <View style={[styles.track, { height, borderRadius: height, backgroundColor: track }]} />
        <View
          style={[
            styles.fill,
            {
              height,
              borderRadius: height,
              backgroundColor: accent,
              left: isRange ? startX : 0,
              width: Math.max(0, endX - (isRange ? startX : 0)),
            },
          ]}
        />

        {isRange && (
          <Thumb x={startX} size={thumb} color={colors.canvas} radius={radius.pill} media={colors.media} />
        )}
        <Thumb x={endX} size={thumb} color={colors.canvas} radius={radius.pill} media={colors.media} />
      </View>
    </View>
  )
}

function Thumb({
  x,
  size,
  color,
  radius,
  media,
}: {
  x: number
  size: number
  color: string
  radius: number
  media: string
}) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.thumb,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: color,
          // Half a thumb back, so its centre sits on the value rather than its
          // leading edge
          transform: [{ translateX: x - size / 2 }],
          ...shadowStyle('float', media),
        },
      ]}
    />
  )
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { flex: 1 },
  touch: { justifyContent: 'center' },
  track: { width: '100%' },
  fill: { position: 'absolute' },
  thumb: { position: 'absolute', left: 0 },
})
