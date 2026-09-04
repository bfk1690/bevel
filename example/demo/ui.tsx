import type { ReactNode } from 'react'
import { View } from 'react-native'
import { Text, useTheme } from '@bfkk/bevel'

/**
 * One labelled block inside a demo page.
 *
 * `note` is where the reasoning goes - a showcase that only shows shapes
 * teaches nothing about when to reach for which one.
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
  const { space } = useTheme()
  return (
    <View style={{ gap: space(2.5) }}>
      <Text variant="micro" color="textFaint">
        {title}
      </Text>
      {note != null && (
        <Text variant="caption" color="textMuted">
          {note}
        </Text>
      )}
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
  return <View style={{ gap: gap ?? space(7) }}>{children}</View>
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
