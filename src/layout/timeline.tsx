import { memo, type ReactNode } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { Text } from '../primitives/text'
import { resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import type { ColorInput } from '../theme/types'

export type TimelineEntry = {
  key: string
  title: string
  description?: string
  /** Short stamp shown above the title - a time, a date, a step number */
  meta?: string
  tone?: ColorInput
  /** Replaces the dot */
  marker?: ReactNode
  content?: ReactNode
  /** Draws the rail below this entry as a dashed line - a step not yet taken */
  pending?: boolean
}

export type TimelineProps = {
  entries: readonly TimelineEntry[]
  style?: StyleProp<ViewStyle>
}

/**
 * Ordered events on a rail.
 *
 * The line is drawn BETWEEN entries rather than beside each one, so the last
 * entry has nothing hanging below it: a rail that continues past the final
 * event promises something that is not there.
 *
 * A pending entry gets a broken line above it, which is the difference between
 * "this happened" and "this is expected" without a second colour to decode.
 *
 * The marker is centred on the FIRST LINE of the entry rather than sitting at
 * the top of the rail. Those are not the same place: a 10pt dot pinned to the
 * top of a 21pt line sits visibly high, and the mismatch shows up as a row of
 * dots that never quite line up with what they mark. The line height is taken
 * from the type scale, so it stays right when the scale changes.
 */
function TimelineBase({ entries, style }: TimelineProps) {
  const { colors, space, type } = useTheme()
  const dot = 10
  const rail = space(4)

  return (
    <View style={style}>
      {entries.map((entry, index) => {
        const accent = resolveColor(colors, entry.tone ?? 'accent', colors.accent)
        const last = index === entries.length - 1
        const next = entries[index + 1]

        // Whichever line comes first is the one the marker has to agree with
        const firstLine = entry.meta != null ? type.micro.lineHeight : type.bodyStrong.lineHeight

        return (
          <View key={entry.key} style={styles.row}>
            <View style={[styles.rail, { width: rail }]}>
              <View style={[styles.marker, { height: firstLine }]}>
                {entry.marker ?? (
                  <View
                    style={{
                      width: dot,
                      height: dot,
                      borderRadius: dot,
                      backgroundColor: entry.pending ? colors.canvas : accent,
                      borderWidth: entry.pending ? 2 : 0,
                      borderColor: colors.borderStrong,
                    }}
                  />
                )}
              </View>

              {!last && (
                <View style={styles.lineWrap}>
                  {next?.pending ? (
                    // A dashed rail, drawn as a stack of short pieces: a
                    // border style would not follow the theme's colours the
                    // same way on both platforms.
                    <View style={styles.dashes}>
                      {Array.from({ length: 6 }, (_, piece) => (
                        <View
                          key={piece}
                          style={{ width: 2, height: 3, backgroundColor: colors.borderStrong }}
                        />
                      ))}
                    </View>
                  ) : (
                    <View style={{ flex: 1, width: 2, backgroundColor: colors.border }} />
                  )}
                </View>
              )}
            </View>

            <View style={[styles.body, { paddingBottom: last ? 0 : space(5), gap: space(1) }]}>
              {entry.meta != null && (
                <Text variant="micro" color="textFaint">
                  {entry.meta}
                </Text>
              )}
              <Text variant="bodyStrong" color={entry.pending ? 'textMuted' : 'text'}>
                {entry.title}
              </Text>
              {entry.description != null && (
                <Text variant="caption" color="textMuted">
                  {entry.description}
                </Text>
              )}
              {entry.content}
            </View>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  rail: { alignItems: 'center' },
  marker: { justifyContent: 'center', alignItems: 'center' },
  lineWrap: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  dashes: { flex: 1, alignItems: 'center', justifyContent: 'space-between' },
  body: { flex: 1 },
})

export const Timeline = memo(TimelineBase)
