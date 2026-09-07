import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Animated,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { Tabs, type TabItem } from '../primitives/tabs'
import type { ColorInput, SizeToken } from '../theme/types'
import { pageFromOffset } from '../utils/carousel'

export type TabViewItem<T> = TabItem<T> & {
  render: () => ReactNode
}

export type TabViewProps<T> = {
  value: T
  onChange: (value: T) => void
  items: readonly TabViewItem<T>[]
  /** Swipe between pages as well as tapping the tabs. On by default */
  swipeable?: boolean
  /**
   * Only builds a page once it has been visited.
   *
   * On by default: a tab bar over five screens that all mount at once is five
   * screens' worth of work for the one being looked at, and any of them may be
   * fetching.
   */
  lazy?: boolean
  scrollableTabs?: boolean
  size?: SizeToken
  tone?: ColorInput
  height?: number
  style?: StyleProp<ViewStyle>
}

/**
 * Tabs and their pages, kept in step.
 *
 * Both directions have to work: tapping a tab moves the pages, and swiping the
 * pages moves the tabs. The indicator is driven by the pager's scroll
 * position, so during a swipe it travels with the finger instead of catching
 * up once the page has settled - which is the difference between a gesture
 * performed on the screen and one reported to it.
 */
export function TabView<T>({
  value,
  onChange,
  items,
  swipeable = true,
  lazy = true,
  scrollableTabs = false,
  size,
  tone,
  height,
  style,
}: TabViewProps<T>) {
  const window = useWindowDimensions()
  const pager = useRef<ScrollView>(null)
  const [width, setWidth] = useState(0)
  const pageWidth = width > 0 ? width : window.width

  const index = Math.max(
    0,
    items.findIndex((item) => item.value === value),
  )

  const [visited, setVisited] = useState<Set<number>>(() => new Set([index]))
  useEffect(() => {
    setVisited((previous) => (previous.has(index) ? previous : new Set(previous).add(index)))
  }, [index])

  const scrollX = useRef(new Animated.Value(0)).current
  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
        useNativeDriver: true,
      }),
    [scrollX],
  )

  /** Pixels to pages, which is the unit the tab strip thinks in */
  const offset = useMemo(
    () => Animated.divide(scrollX, Math.max(1, pageWidth)),
    [pageWidth, scrollX],
  )

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width)
  }, [])

  // A tab tap moves the pages
  useEffect(() => {
    if (width <= 0) return
    pager.current?.scrollTo({ x: index * pageWidth, y: 0, animated: true })
  }, [index, pageWidth, width])

  const settle = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = pageFromOffset(event.nativeEvent.contentOffset.x, pageWidth, items.length)
      const item = items[next]
      if (item && item.value !== value) onChange(item.value)
    },
    [items, onChange, pageWidth, value],
  )

  return (
    <View style={[styles.root, style]} onLayout={onLayout}>
      <Tabs
        value={value}
        onChange={onChange}
        items={items}
        scrollable={scrollableTabs}
        size={size}
        tone={tone}
        offset={swipeable ? offset : undefined}
      />

      <Animated.ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        scrollEnabled={swipeable}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={settle}
        style={height != null ? { height } : styles.fill}>
        {items.map((item, itemIndex) => (
          <View key={`${String(item.value)}-${itemIndex}`} style={{ width: pageWidth }}>
            {!lazy || visited.has(itemIndex) ? item.render() : null}
          </View>
        ))}
      </Animated.ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
})
