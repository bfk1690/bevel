import { memo, type ReactNode } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { Text } from '../primitives/text'
import { useTheme } from '../theme/provider'
import type { ColorInput } from '../theme/types'

export type DataRow = {
  label: string
  /** Plain text value. Use `content` for anything else */
  value?: string
  content?: ReactNode
  /** Draws the row as a total: heavier, and separated from what it sums */
  total?: boolean
  tone?: ColorInput
}

export type DataListProps = {
  rows: readonly DataRow[]
  divider?: boolean
  style?: StyleProp<ViewStyle>
}

/**
 * Label and value pairs - a receipt, a spec sheet, an order summary.
 *
 * Values are right-aligned so their digits line up in a column; a list of
 * prices left-aligned against ragged labels cannot be scanned or compared.
 * Labels take what room is left and wrap, since a long label is a copy problem
 * rather than a layout one.
 */
function DataListBase({ rows, divider = false, style }: DataListProps) {
  const { colors, space } = useTheme()

  return (
    <View style={[{ gap: divider ? 0 : space(2.5) }, style]}>
      {rows.map((row, index) => (
        <View key={`${row.label}-${index}`}>
          {divider && index > 0 && (
            <View
              style={{
                height: StyleSheet.hairlineWidth,
                backgroundColor: colors.border,
                marginBottom: space(2.5),
                marginTop: space(2.5),
              }}
            />
          )}
          <View style={[styles.row, { gap: space(4) }, row.total && { paddingTop: space(1) }]}>
            <Text
              variant={row.total ? 'bodyStrong' : 'caption'}
              color={row.total ? 'text' : 'textMuted'}
              style={styles.label}>
              {row.label}
            </Text>
            {row.content ?? (
              <Text
                variant={row.total ? 'bodyStrong' : 'body'}
                color={row.tone ?? 'text'}
                style={styles.value}>
                {row.value ?? ''}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  label: { flex: 1 },
  value: { textAlign: 'right' },
})

export const DataList = memo(DataListBase)
