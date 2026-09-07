import { memo, type ReactNode } from 'react'
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { Progress } from '../primitives/progress'
import { Text } from '../primitives/text'
import { resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import type { ColorInput } from '../theme/types'
import { shouldCompact, stepProgress, stepStatus, type StepStatus } from '../utils/steps'

export type Step = {
  key: string
  label: string
  /** A word about what this step wants. Dropped in the compact form */
  caption?: string
}

export type StepsProps = {
  steps: readonly Step[]
  /** Index of the step being shown. Pass `steps.length` when the flow is over */
  current: number
  /**
   * Called for a step the user taps.
   *
   * Only finished steps are tappable. Letting someone jump ahead past a step
   * that has not been filled in is offering a shortcut that ends in an error
   * they cannot see the cause of.
   */
  onStepPress?: (index: number, step: Step) => void
  /**
   * Past this many steps it draws a count and a bar instead of markers.
   *
   * Set it to `Infinity` to always draw markers, or `0` to always count.
   */
  compactFrom?: number
  /** Overrides the wording of the compact form */
  formatSummary?: (current: number, count: number) => string
  tone?: ColorInput
  /** A mark for a finished step. Defaults to a drawn tick */
  doneMark?: ReactNode
  style?: StyleProp<ViewStyle>
}

/**
 * Where you are in a flow.
 *
 * Two forms of the same thing. Up to a handful of steps it draws them, because
 * seeing that there are three and being on the second is genuinely reassuring.
 * Past that it says the number instead: seven labelled markers on a phone
 * leaves each label two truncated words, which teaches nothing.
 */
function StepsBase({
  steps,
  current,
  onStepPress,
  compactFrom = 5,
  formatSummary,
  tone = 'accent',
  doneMark,
  style,
}: StepsProps) {
  const { colors, space } = useTheme()
  const count = steps.length
  const accent = resolveColor(colors, tone, colors.accent)

  if (count === 0) return null

  const active = steps[Math.min(current, count - 1)]

  if (shouldCompact(count, compactFrom)) {
    const summary = formatSummary
      ? formatSummary(current, count)
      : `Step ${Math.min(current + 1, count)} of ${count}`

    return (
      <View style={[{ gap: space(2) }, style]} accessibilityRole="progressbar">
        <View style={styles.summary}>
          <Text variant="label" style={styles.grow} numberOfLines={1}>
            {active?.label}
          </Text>
          <Text variant="micro" color="textFaint">
            {summary}
          </Text>
        </View>
        <Progress value={stepProgress(current, count)} tone={tone} />
        {active?.caption != null && (
          <Text variant="caption" color="textMuted">
            {active.caption}
          </Text>
        )}
      </View>
    )
  }

  return (
    <View style={[styles.row, style]}>
      {steps.map((step, index) => {
        const status = stepStatus(index, current)
        const reachable = onStepPress != null && status === 'done'

        return (
          <View key={step.key} style={styles.grow}>
            <View style={styles.markerRow}>
              {/* Connectors are drawn on the sides of each marker rather than
                  between them, so the row divides evenly whatever the labels do */}
              <Line show={index > 0} color={index <= current ? accent : colors.border} />
              <Pressable
                onPress={reachable ? () => onStepPress(index, step) : undefined}
                disabled={!reachable}
                accessibilityRole={reachable ? 'button' : 'text'}
                accessibilityLabel={step.label}
                accessibilityState={{ selected: status === 'current', disabled: !reachable }}
                style={[
                  styles.marker,
                  {
                    backgroundColor: status === 'upcoming' ? colors.sunk : accent,
                    borderColor: status === 'current' ? accent : 'transparent',
                  },
                ]}>
                {status === 'done' ? (
                  (doneMark ?? <Tick color={colors.onAccent} />)
                ) : (
                  <Text
                    variant="micro"
                    style={{ color: status === 'upcoming' ? colors.textFaint : colors.onAccent }}>
                    {index + 1}
                  </Text>
                )}
              </Pressable>
              <Line show={index < count - 1} color={index < current ? accent : colors.border} />
            </View>

            <Text
              variant="micro"
              align="center"
              color={status === 'upcoming' ? 'textFaint' : 'text'}
              numberOfLines={1}
              style={{ marginTop: space(1.5) }}>
              {step.label}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

/** Half a connector. Rendered invisibly at the ends so the markers stay aligned */
function Line({ show, color }: { show: boolean; color: string }) {
  return <View style={[styles.line, { backgroundColor: show ? color : 'transparent' }]} />
}

/** Tick, drawn rather than imported, so the kit works before an icon set does */
function Tick({ color }: { color: string }) {
  return (
    <View
      style={{
        width: 9,
        height: 5,
        borderLeftWidth: 2,
        borderBottomWidth: 2,
        borderColor: color,
        transform: [{ rotate: '-45deg' }],
        marginTop: -2,
      }}
    />
  )
}

const MARKER = 26

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  grow: { flex: 1 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  markerRow: { flexDirection: 'row', alignItems: 'center' },
  line: { flex: 1, height: 2 },
  marker: {
    width: MARKER,
    height: MARKER,
    borderRadius: MARKER / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export const Steps = memo(StepsBase)
