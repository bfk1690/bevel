import { useCallback, useState, type ReactNode } from 'react'
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native'

import { resolveGrid, type GridLayout } from '../utils/grid'

export type GridProps<T> = {
  data: readonly T[]
  renderItem: (item: T, layout: GridLayout & { index: number }) => ReactNode
  keyExtractor: (item: T, index: number) => string
  /** Narrowest an item may get before a column is dropped */
  minItemWidth?: number
  /** Fixes the count and ignores `minItemWidth` */
  columns?: number
  /** Ceiling on columns, whatever the width allows */
  maxColumns?: number
  gap?: number
  /** Height as a multiple of the item's width. 1 is a square */
  aspectRatio?: number
  style?: StyleProp<ViewStyle>
}

/**
 * A wrapping grid that measures itself.
 *
 * Column widths are POINTS, not percentages. Percentage widths in a wrapping
 * row round independently, and three items of 33.33% can total 100.01% - which
 * drops the third onto its own line at some screen sizes and not others.
 *
 * Not a list: everything given to it is rendered. For a long collection put a
 * grid row inside `InfiniteList` instead, where rows leave the tree as they
 * leave the screen.
 */
export function Grid<T>({
  data,
  renderItem,
  keyExtractor,
  minItemWidth,
  columns,
  maxColumns,
  gap = 8,
  aspectRatio,
  style,
}: GridProps<T>) {
  const [width, setWidth] = useState(0)

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const measured = event.nativeEvent.layout.width
    setWidth((previous) => (previous === measured ? previous : measured))
  }, [])

  const layout = resolveGrid({ width, minItemWidth, gap, maxColumns, columns })

  return (
    <View onLayout={onLayout} style={[styles.grid, { gap: layout.gap }, style]}>
      {/* Nothing is drawn until the width is known: items at zero width would
          all wrap onto separate rows and then jump into place */}
      {layout.itemWidth > 0 &&
        data.map((item, index) => (
          <View
            key={keyExtractor(item, index)}
            style={{
              width: layout.itemWidth,
              height: aspectRatio != null ? layout.itemWidth * aspectRatio : undefined,
            }}>
            {renderItem(item, { ...layout, index })}
          </View>
        ))}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
})
