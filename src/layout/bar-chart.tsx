import { memo, useMemo } from 'react'
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { Text } from '../primitives/text'
import { resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import type { ColorInput } from '../theme/types'
import { scaleBars } from '../utils/chart'

export type BarDatum = {
  value: number
  /** Under the bar. Kept short - there is one bar's width to say it in */
  label?: string
  /** Overrides the chart's colour for this bar: today, an outlier, a target */
  tone?: ColorInput
}

export type BarChartProps = {
  data: readonly BarDatum[]
  height?: number
  /** Forces the top of the scale, to hold two charts to one */
  max?: number
  /** Rounds the top up to a readable figure. On by default */
  nice?: boolean
  tone?: ColorInput
  /** Highlights one bar and dims the others */
  activeIndex?: number
  onPressBar?: (index: number, datum: BarDatum) => void
  /** Formats the value for a screen reader and the optional top label */
  formatValue?: (value: number) => string
  /** Prints the figure above each bar. Only readable with few bars */
  showValues?: boolean
  style?: StyleProp<ViewStyle>
}

/**
 * Bars, drawn with views.
 *
 * The one chart that needs no drawing primitives, which is why it is the only
 * one here: anything with a line or a curve wants a canvas, and a canvas wants
 * a dependency this package will not take.
 *
 * **The scale starts at zero and there is no way to ask it not to.** Cutting
 * the axis to just under the smallest value turns a 3% difference into a
 * doubling, and a component cannot know when that would be honest.
 */
function BarChartBase({
  data,
  height = 120,
  max,
  nice = true,
  tone = 'accent',
  activeIndex,
  onPressBar,
  formatValue = (value) => String(value),
  showValues = false,
  style,
}: BarChartProps) {
  const { colors, radius, space } = useTheme()

  const scale = useMemo(
    () => scaleBars({ values: data.map((datum) => datum.value), max, nice }),
    [data, max, nice],
  )

  const accent = resolveColor(colors, tone, colors.accent)

  return (
    <View style={[{ gap: space(2) }, style]}>
      <View style={[styles.plot, { height, gap: space(1.5) }]}>
        {scale.bars.map((bar, index) => {
          const datum = data[index]
          const dimmed = activeIndex != null && activeIndex !== index
          const color = resolveColor(colors, datum.tone ?? tone, accent)

          return (
            <Pressable
              key={index}
              disabled={onPressBar == null}
              onPress={() => onPressBar?.(index, datum)}
              accessibilityRole={onPressBar ? 'button' : 'text'}
              // One announcement per bar, in the order they are drawn
              accessibilityLabel={[datum.label, formatValue(datum.value)]
                .filter(Boolean)
                .join(': ')}
              style={styles.column}>
              {showValues && (
                <Text variant="micro" color="textFaint" numberOfLines={1}>
                  {formatValue(datum.value)}
                </Text>
              )}

              <View style={styles.track}>
                <View
                  style={{
                    // A bar at zero is still drawn, one point high: an absent
                    // bar and a bar of nothing are different facts
                    height: `${Math.max(0, Math.min(1, bar.ratio)) * 100}%`,
                    minHeight: 1,
                    borderRadius: radius.xs,
                    backgroundColor: color,
                    opacity: dimmed ? 0.35 : 1,
                  }}
                />
              </View>

              {datum.label != null && (
                <Text variant="micro" color="textFaint" numberOfLines={1}>
                  {datum.label}
                </Text>
              )}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  plot: { flexDirection: 'row', alignItems: 'flex-end' },
  column: { flex: 1, height: '100%', gap: 4, alignItems: 'center' },
  // The bar grows from the bottom of whatever height is left to it
  track: { flex: 1, width: '100%', justifyContent: 'flex-end' },
})

export const BarChart = memo(BarChartBase)
