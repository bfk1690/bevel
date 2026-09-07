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
import {
  nextSort,
  overflowsRow,
  resolveColumnWidths,
  selectionState,
  sortRows,
  toggleAllKeys,
  toggleKey,
  type TableSort,
} from '../utils/table'
import { Checkbox } from '../primitives/checkbox'

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
  /** Makes the header a control. Needs `value` or `compare` to have anything to sort by */
  sortable?: boolean
  /** For orders a string comparison cannot express - sizes, states, ranks */
  compare?: (a: T, b: T) => number
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
  /**
   * Row selection, held as keys.
   *
   * Keys rather than a flag on each row: the rows come from a server and are
   * replaced on every page, sort and refresh, and a flag written onto them is
   * lost each time.
   */
  selected?: ReadonlySet<string>
  onSelectionChange?: (selected: Set<string>) => void
  /** Controlled sort. Leave it out and the table keeps its own */
  sort?: TableSort | null
  defaultSort?: TableSort | null
  onSortChange?: (sort: TableSort | null) => void
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
  selected,
  onSelectionChange,
  sort,
  defaultSort = null,
  onSortChange,
  style,
}: TableProps<T>) {
  const { colors, space } = useTheme()
  const [available, setAvailable] = useState(0)
  const [internalSort, setInternalSort] = useState<TableSort | null>(defaultSort)
  const activeSort = sort !== undefined ? sort : internalSort

  const press = useCallback(
    (key: string) => {
      const next = nextSort(activeSort, key)
      if (sort === undefined) setInternalSort(next)
      onSortChange?.(next)
    },
    [activeSort, onSortChange, sort],
  )

  /**
   * Sorting happens here, on a copy.
   *
   * Doing it in the caller is the obvious alternative and it means every table
   * re-implements the same cycle; doing it in place would reorder an array the
   * caller still owns.
   */
  const rows = useMemo(() => {
    const byKey = new Map(columns.map((column) => [column.key, column]))
    return sortRows(
      data,
      activeSort,
      (row, key) => byKey.get(key)?.value?.(row) ?? '',
      (key) => byKey.get(key)?.compare,
    )
  }, [activeSort, columns, data])

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

  const header = (column: TableColumn<T>) => {
    const sorted = activeSort?.key === column.key ? activeSort.direction : null
    const label = (
      <Text variant="micro" color={sorted ? 'text' : headerTone} numberOfLines={1}>
        {column.title}
      </Text>
    )

    if (!column.sortable) {
      return (
        <View style={column.align === 'right' ? styles.headerRight : styles.headerLeft}>{label}</View>
      )
    }

    return (
      <Pressable
        onPress={() => press(column.key)}
        accessibilityRole="button"
        accessibilityLabel={`Sort by ${column.title}`}
        accessibilityState={{ selected: sorted != null }}
        style={({ pressed }) => [
          column.align === 'right' ? styles.headerRight : styles.headerLeft,
          { opacity: pressed ? 0.6 : 1, gap: 4 },
        ]}>
        {label}
        <SortMark direction={sorted} color={sorted ? colors.text : colors.textFaint} />
      </Pressable>
    )
  }

  const rowKey = (row: T, index: number) => keyExtractor?.(row, index) ?? String(index)

  const selectable = selected != null && onSelectionChange != null
  const visibleKeys = selectable ? rows.map((row, index) => rowKey(row, index)) : []
  const headerState = selectable ? selectionState(visibleKeys, selected) : 'none'

  const selectColumn = (row: T, index: number) => (
    <View style={{ paddingLeft: space(2), paddingRight: space(1) }}>
      <Checkbox
        size="sm"
        checked={selected?.has(rowKey(row, index)) === true}
        onChange={() => onSelectionChange?.(toggleKey(selected!, rowKey(row, index)))}
      />
    </View>
  )
  const scrolls = overflowsRow(widths, Math.max(0, available - stickyWidth))

  const body = (
    <View>
      <View style={[styles.headerRow, { paddingBottom: space(2), borderBottomColor: colors.border }]}>
        {selectable && sticky == null && (
          <View style={{ paddingLeft: space(2), paddingRight: space(1) }}>
            <Checkbox
              size="sm"
              checked={headerState === 'all'}
              indeterminate={headerState === 'some'}
              onChange={() => onSelectionChange?.(toggleAllKeys(visibleKeys, selected!))}
            />
          </View>
        )}
        {scrolling.map((column, index) => (
          <View key={column.key} style={{ width: widths[index], paddingHorizontal: space(2) }}>
            {header(column)}
          </View>
        ))}
      </View>

      {rows.map((row, rowIndex) => (
        <Row
          key={rowKey(row, rowIndex)}
          onPress={onRowPress ? () => onRowPress(row, rowIndex) : undefined}
          borderColor={colors.border}
          pressedColor={colors.raised}
          paddingVertical={space(3)}>
          {selectable && sticky == null && selectColumn(row, rowIndex)}
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
                {selectable && (
                  <View style={{ paddingLeft: space(2), paddingRight: space(1) }}>
                    <Checkbox
                      size="sm"
                      checked={headerState === 'all'}
                      indeterminate={headerState === 'some'}
                      onChange={() => onSelectionChange?.(toggleAllKeys(visibleKeys, selected!))}
                    />
                  </View>
                )}
                <View style={{ paddingHorizontal: space(2), flex: 1 }}>{header(sticky)}</View>
              </View>
              {rows.map((row, rowIndex) => (
                <Row
                  key={rowKey(row, rowIndex)}
                  onPress={onRowPress ? () => onRowPress(row, rowIndex) : undefined}
                  borderColor={colors.border}
                  pressedColor={colors.raised}
                  paddingVertical={space(3)}>
                  {selectable && selectColumn(row, rowIndex)}
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

/** Direction mark: a small triangle, drawn from a rotated square's corner */
function SortMark({ direction, color }: { direction: 'asc' | 'desc' | null; color: string }) {
  if (direction == null) {
    // An unsorted but sortable column still says so, quietly
    return <View style={[styles.markDot, { backgroundColor: color, opacity: 0.4 }]} />
  }
  return (
    <View
      style={{
        width: 6,
        height: 6,
        borderRightWidth: 1.5,
        borderBottomWidth: 1.5,
        borderColor: color,
        transform: [{ rotate: direction === 'asc' ? '-135deg' : '45deg' }],
        marginTop: direction === 'asc' ? 2 : -2,
      }}
    />
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
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  markDot: { width: 4, height: 4, borderRadius: 2 },
})
