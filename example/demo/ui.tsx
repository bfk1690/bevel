import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { Text, useTheme } from '@bfkk/bevel'

/**
 * One labelled block inside a demo page.
 *
 * The heading carries a rule out to the edge and the note sits behind its own
 * margin line, so the page reads as specimens with commentary rather than
 * paragraphs with things between them. Prose at full width buries the very
 * component the page exists to show.
 */
export function Demo({
  title,
  note,
  children,
  row,
}: {
  title: string
  note?: string
  children: ReactNode
  /** Lay the children out in a wrapping row instead of a column */
  row?: boolean
}) {
  const { colors, space } = useTheme()
  return (
    <View style={{ gap: space(3) }}>
      <View style={{ gap: space(2) }}>
        <View style={[styles.heading, { gap: space(2) }]}>
          <Text variant="micro" color="textFaint">
            {title}
          </Text>
          <View style={[styles.rule, { backgroundColor: colors.border }]} />
        </View>

        {note != null && (
          <View style={[styles.note, { gap: space(2) }]}>
            <View style={[styles.margin, { backgroundColor: colors.border }]} />
            <Text variant="caption" color="textMuted" style={styles.noteText}>
              {note}
            </Text>
          </View>
        )}
      </View>

      <View
        style={{
          gap: space(2.5),
          flexDirection: row ? 'row' : 'column',
          flexWrap: row ? 'wrap' : 'nowrap',
          alignItems: row ? 'center' : 'stretch',
        }}>
        {children}
      </View>
    </View>
  )
}

/** Caption above a single specimen, so every prop combination is readable */
export function Spec({ label, children }: { label: string; children: ReactNode }) {
  const { space } = useTheme()
  return (
    <View style={{ gap: space(1) }}>
      <Text variant="micro" color="textFaint">
        {label}
      </Text>
      {children}
    </View>
  )
}

export function Stack({ children, gap }: { children: ReactNode; gap?: number }) {
  const { space } = useTheme()
  return <View style={{ gap: gap ?? space(8) }}>{children}</View>
}

export function Row({ children, gap }: { children: ReactNode; gap?: number }) {
  const { space } = useTheme()
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: gap ?? space(2),
      }}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center' },
  rule: { flex: 1, height: StyleSheet.hairlineWidth },
  note: { flexDirection: 'row' },
  margin: { width: 2, borderRadius: 2 },
  noteText: { flex: 1, opacity: 0.9 },
})
