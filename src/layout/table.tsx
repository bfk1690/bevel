import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { Text } from '../primitives/text'
import { useTheme } from '../theme/provider'
import type { ColorInput } from '../theme/types'
import { overflowsRow, resolveColumnWidths } from '../utils/table'

export type TableColumn<T> = {
  key: string
  title: string
  /** Fixed width. Otherwise the column shares what is left */
  width?: number
  flex?: number
  minWidth?: number
  align?: 'left' | 'right'
  /** Plain text for the cell. Use `render` for anything else */
  value?: (row: T) => string
  render?: (row: T) => ReactNode
}

export type TableProps<T> = {
  columns: readonly TableColumn<T>[]
  data: readonly T[]
  keyExtractor?: (row: T, index: number) => string
  onRowPress?: (row: T, index: number) => void
  /**
   * Keeps the first column in place while the rest scroll sideways.
   *
   * Worth it when that column is what identifies the row - scrolling away from
   * the name leaves a wall of numbers belonging to nobody.
   */
  stickyFirstColumn?: boolean
  emptyLabel?: string
  headerTone?: ColorInput
  style?: StyleProp<ViewStyle>
}

/**
 * Table.
 *
 * A phone is always short of room, so the rule is: never squeeze a column
 * below its minimum, and let the row scroll sideways instead. A column pressed
 * down to fit is unreadable in a way that scrolling never is.
 */
export function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowPress,
  stickyFirstColumn = false,
  emptyLabel = 'Nothing to show',
  headerTone = 'textFaint',
  style,
}: TableProps<T>) {
  const { colors, space } = useTheme()
  const [available, setAvailable] = useState(0)

  const sticky = stickyFirstColumn && columns.length > 1 ? columns[0] : undefined
  const scrolling = sticky ? columns.slice(1) : columns

  const stickyWidth = sticky ? resolveColumnWidths([sticky], available)[0]! : 0
  const widths = useMemo(
    () => resolveColumnWidths(scrolling, Math.max(0, available - stickyWidth)),
    [available, scrolling, stickyWidth],
  )

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setAvailable(event.nativeEvent.layout.width)
  }, [])

  const cell = (column: TableColumn<T>, row: T) =>
    column.render ? column.render(row) : (
      <Text variant="caption" numberOfLines={2} style={column.align === 'right' ? styles.right : undefined}>
        {column.value ? column.value(row) : ''}
      </Text>
    )

  const header = (column: TableColumn<T>) => (
    <Text
      variant="micro"
      color={headerTone}
      numberOfLines={1}
      style={column.align === 'right' ? styles.right : undefined}>
      {column.title}
    </Text>
  )

  const rowKey = (row: T, index: number) => keyExtractor?.(row, index) ?? String(index)
  const scrolls = overflowsRow(widths, Math.max(0, available - stickyWidth))

  const body = (
    <View>
      <View style={[styles.headerRow, { paddingBottom: space(2), borderBottomColor: colors.border }]}>
        {scrolling.map((column, index) => (
          <View key={column.key} style={{ width: widths[index], paddingHorizontal: space(2) }}>
            {header(column)}
          </View>
        ))}
      </View>

      {data.map((row, rowIndex) => (
        <Row
          key={rowKey(row, rowIndex)}
          onPress={onRowPress ? () => onRowPress(row, rowIndex) : undefined}
          borderColor={colors.border}
          pressedColor={colors.raised}
          paddingVertical={space(3)}>
          {scrolling.map((column, index) => (
            <View key={column.key} style={{ width: widths[index], paddingHorizontal: space(2) }}>
              {cell(column, row)}
            </View>
          ))}
        </Row>
      ))}
    </View>
  )

  return (
    <View onLayout={onLayout} style={style}>
      {data.length === 0 ? (
        <Text variant="caption" color="textFaint" style={{ paddingVertical: space(4) }}>
          {emptyLabel}
        </Text>
      ) : (
        <View style={styles.frame}>
          {sticky && (
            <View style={{ width: stickyWidth }}>
              <View
                style={[
                  styles.headerRow,
                  { paddingBottom: space(2), borderBottomColor: colors.border },
                ]}>
                <View style={{ paddingHorizontal: space(2) }}>{header(sticky)}</View>
              </View>
              {data.map((row, rowIndex) => (
                <Row
                  key={rowKey(row, rowIndex)}
                  onPress={onRowPress ? () => onRowPress(row, rowIndex) : undefined}
                  borderColor={colors.border}
                  pressedColor={colors.raised}
                  paddingVertical={space(3)}>
                  <View style={{ paddingHorizontal: space(2), flex: 1 }}>{cell(sticky, row)}</View>
                </Row>
              ))}
            </View>
          )}

          {scrolls ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.grow}>
              {body}
            </ScrollView>
          ) : (
            <View style={styles.grow}>{body}</View>
          )}
        </View>
      )}
    </View>
  )
}

function Row({
  children,
  onPress,
  borderColor,
  pressedColor,
  paddingVertical,
}: {
  children: ReactNode
  onPress?: () => void
  borderColor: string
  pressedColor: string
  paddingVertical: number
}) {
  const content = (pressed: boolean) => [
    styles.row,
    {
      paddingVertical,
      borderBottomColor: borderColor,
      backgroundColor: pressed ? pressedColor : 'transparent',
    },
  ]

  if (!onPress) return <View style={content(false)}>{children}</View>
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => content(pressed)}>
      {children}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  frame: { flexDirection: 'row' },
  grow: { flexGrow: 0 },
  headerRow: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  right: { textAlign: 'right', width: '100%' },
})
