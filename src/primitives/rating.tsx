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
import type { ColorInput } from '../theme/types'
import { ratingFromRatio, snapRating, starFill } from '../utils/rating'
import { Text } from './text'

/** Solid and hollow stars, written as escapes so the source stays ASCII */
const FILLED = '\u2605'
const HOLLOW = '\u2606'

export type RatingProps = {
  value: number
  /** Omit to make the row read-only - a score rather than a question */
  onChange?: (value: number) => void
  count?: number
  /** Allows halves, both to give and to display */
  allowHalf?: boolean
  size?: number
  tone?: ColorInput
  emptyTone?: ColorInput
  /** Prints the value after the stars */
  showValue?: boolean
  formatValue?: (value: number) => string
  style?: StyleProp<ViewStyle>
}

/**
 * Star rating.
 *
 * Dragging across the row keeps changing the value, not just tapping: picking
 * four when you meant five otherwise costs a second, separate tap on a target
 * the width of a fingertip.
 *
 * Stars are text glyphs. A star cannot be drawn from rectangles, and an icon
 * font would be a dependency for one shape - the two characters render
 * everywhere and take the colour and size they are given.
 */
export function Rating({
  value,
  onChange,
  count = 5,
  allowHalf = false,
  size = 22,
  tone = 'warning',
  emptyTone = 'borderStrong',
  showValue = false,
  formatValue,
  style,
}: RatingProps) {
  const { colors, space } = useTheme()
  const [width, setWidth] = useState(0)
  const interactive = onChange != null

  const shown = snapRating(value, count, allowHalf)
  const filled = resolveColor(colors, tone, colors.warning)
  const empty = resolveColor(colors, emptyTone, colors.borderStrong)

  const report = useCallback(
    (x: number) => {
      if (!interactive || width <= 0) return
      onChange?.(ratingFromRatio(x / width, count, allowHalf))
    },
    [allowHalf, count, interactive, onChange, width],
  )

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => interactive,
        onMoveShouldSetPanResponder: () => interactive,
        onPanResponderGrant: (event) => report(event.nativeEvent.locationX),
        onPanResponderMove: (event) => report(event.nativeEvent.locationX),
        onPanResponderTerminationRequest: () => false,
      }),
    [interactive, report],
  )

  const onRowLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width)
  }, [])

  return (
    <View style={[styles.root, { gap: space(2) }, style]}>
      <View
        accessibilityRole={interactive ? 'adjustable' : 'image'}
        accessibilityLabel={`${shown} of ${count}`}
        accessibilityValue={{ now: shown, min: 0, max: count }}
        // Only a row that can be changed claims the actions that go with it
        accessibilityActions={interactive ? ACCESSIBILITY_ACTIONS : undefined}
        onAccessibilityAction={(event) => {
          if (!interactive) return
          const amount = allowHalf ? 0.5 : 1
          const direction = event.nativeEvent.actionName === 'increment' ? 1 : -1
          onChange?.(snapRating(shown + direction * amount, count, allowHalf))
        }}
        onLayout={onRowLayout}
        style={styles.row}
        {...responder.panHandlers}>
        {Array.from({ length: count }, (_, index) => {
          const fill = starFill(index, shown)
          return (
            <View
              key={index}
              // The stars must not be touchable themselves. On the first touch
              // `locationX` is measured against whatever view was hit, so a tap
              // on the third star would report a few points instead of the
              // distance along the row - and every tap would mean one star.
              pointerEvents="none"
              style={{ width: size, height: size }}>
              <Star character={HOLLOW} color={empty} size={size} />
              {fill !== 'empty' && (
                // A half is the solid star clipped down the middle, so both
                // halves keep the same outline and stay aligned
                <View style={[styles.overlay, fill === 'half' && { width: size / 2 }]}>
                  <Star character={FILLED} color={filled} size={size} />
                </View>
              )}
            </View>
          )
        })}
      </View>

      {showValue && (
        <Text variant="caption" color="textMuted">
          {formatValue ? formatValue(shown) : shown.toFixed(allowHalf ? 1 : 0)}
        </Text>
      )}
    </View>
  )
}

function Star({ character, color, size }: { character: string; color: string; size: number }) {
  return (
    <Text
      style={{ fontSize: size, lineHeight: size * 1.12, color }}
      allowFontScaling={false}>
      {character}
    </Text>
  )
}

const ACCESSIBILITY_ACTIONS = [
  { name: 'increment' as const },
  { name: 'decrement' as const },
]

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  row: { flexDirection: 'row', alignItems: 'center' },
  overlay: { position: 'absolute', left: 0, top: 0, bottom: 0, overflow: 'hidden' },
})
