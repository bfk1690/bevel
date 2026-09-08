import { memo, type ReactNode } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { Text } from '../primitives/text'
import { resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import type { ColorInput, TypeToken } from '../theme/types'
import { deltaDirection, deltaVerdict, formatDelta } from '../utils/stat'

export type StatProps = {
  label: string
  /** Pre-formatted. A count, a duration, a price - the tile does not guess */
  value: string
  /** A word under the figure: "this week", "since Friday" */
  caption?: string
  /** The change since whenever the caption says */
  delta?: number
  /**
   * Which direction is the good one.
   *
   * Without it the change is reported and left uncoloured. Painting every rise
   * green is the most common lie a dashboard tells: response time, error rate,
   * cost per order and churn all get worse going up.
   */
  goodWhen?: 'up' | 'down'
  deltaAsPercent?: boolean
  /** Icon or mark before the label */
  media?: ReactNode
  size?: TypeToken
  onPress?: () => void
  style?: StyleProp<ViewStyle>
}

/**
 * One figure, said plainly.
 *
 * The figure is drawn with tabular figures so a number that updates does not
 * jitter: proportional digits are different widths, and a live count wobbles
 * as the digits change under it.
 *
 * Announced as one thing rather than three. Read as separate pieces it becomes
 * "Revenue", "12,400", "plus 8 percent" - three fragments a listener has to
 * reassemble.
 */
function StatBase({
  label,
  value,
  caption,
  delta,
  goodWhen,
  deltaAsPercent = false,
  media,
  size = 'display',
  onPress,
  style,
}: StatProps) {
  const { colors, space } = useTheme()

  const verdict = delta != null ? deltaVerdict(delta, goodWhen) : 'neutral'
  const tone: ColorInput =
    verdict === 'good' ? 'ok' : verdict === 'bad' ? 'danger' : 'textMuted'
  const deltaColor = resolveColor(colors, tone, colors.textMuted)
  const change = delta != null ? formatDelta(delta, { percent: deltaAsPercent }) : null

  return (
    <View
      accessible
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={[label, value, change, caption].filter(Boolean).join(', ')}
      style={[{ gap: space(1) }, style]}>
      <View style={[styles.row, { gap: space(1.5) }]}>
        {media}
        <Text variant="micro" color="textFaint" numberOfLines={1} style={styles.grow}>
          {label}
        </Text>
      </View>

      <Text variant={size} numberOfLines={1} style={styles.figure}>
        {value}
      </Text>

      {(change != null || caption != null) && (
        <View style={[styles.row, { gap: space(1.5) }]}>
          {change != null && (
            <View style={[styles.row, { gap: space(0.5) }]}>
              <Arrow direction={deltaDirection(delta ?? 0)} color={deltaColor} />
              <Text variant="caption" style={{ color: deltaColor }}>
                {change}
              </Text>
            </View>
          )}
          {caption != null && (
            <Text variant="caption" color="textFaint" numberOfLines={1} style={styles.grow}>
              {caption}
            </Text>
          )}
        </View>
      )}
    </View>
  )
}

/**
 * A triangle, drawn from a border.
 *
 * The direction is carried by shape as well as colour: red and green are the
 * two most common colours to confuse, and a dashboard that says "worse" only
 * in red says nothing to about one man in twelve.
 */
function Arrow({ direction, color }: { direction: 'up' | 'down' | 'flat'; color: string }) {
  if (direction === 'flat') {
    return <View style={[styles.flat, { backgroundColor: color }]} />
  }
  return (
    <View
      style={[
        styles.arrow,
        direction === 'up'
          ? { borderBottomWidth: 6, borderBottomColor: color }
          : { borderTopWidth: 6, borderTopColor: color },
      ]}
    />
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  grow: { flex: 1 },
  // Digits of one width, so a live figure does not wobble as they change
  figure: { fontVariant: ['tabular-nums'] },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  flat: { width: 8, height: 2, borderRadius: 1 },
})

export const Stat = memo(StatBase)
