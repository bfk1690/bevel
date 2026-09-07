import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
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

import { resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import type { ColorInput } from '../theme/types'
import { dotWindow, pageFromOffset } from '../utils/carousel'

export type CarouselProps<T> = {
  data: readonly T[]
  renderItem: (item: T, state: { index: number; active: boolean }) => ReactNode
  /** Controlled page. Changing it scrolls there */
  index?: number
  onIndexChange?: (index: number) => void
  height?: number
  showDots?: boolean
  /** Most dots to draw before the row starts sliding. Defaults to 5 */
  maxDots?: number
  /** Advances on its own every N ms. Any touch stops it for good */
  autoPlayMs?: number
  tone?: ColorInput
  style?: StyleProp<ViewStyle>
}

/**
 * Paged carousel.
 *
 * Auto-play stops permanently at the first touch rather than resuming after a
 * pause: a page that moves again while being read is worse than one that never
 * moved, and a user who took hold of it has said what they want.
 */
export function Carousel<T>({
  data,
  renderItem,
  index,
  onIndexChange,
  height,
  showDots = true,
  maxDots = 5,
  autoPlayMs,
  tone = 'accent',
  style,
}: CarouselProps<T>) {
  const { colors, space } = useTheme()
  const window = useWindowDimensions()
  const scroller = useRef<ScrollView>(null)

  const [width, setWidth] = useState(0)
  const [internal, setInternal] = useState(index ?? 0)
  const page = index ?? internal
  const touched = useRef(false)

  const pageWidth = width > 0 ? width : window.width

  const onContainerLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width)
  }, [])

  const settle = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = pageFromOffset(event.nativeEvent.contentOffset.x, pageWidth, data.length)
      if (next === page) return
      if (index === undefined) setInternal(next)
      onIndexChange?.(next)
    },
    [data.length, index, onIndexChange, page, pageWidth],
  )

  // A controlled index that changes from elsewhere has to be followed
  useEffect(() => {
    if (index === undefined || width <= 0) return
    scroller.current?.scrollTo({ x: index * pageWidth, animated: true })
  }, [index, pageWidth, width])

  useEffect(() => {
    if (!autoPlayMs || autoPlayMs <= 0 || data.length < 2) return
    const timer = setInterval(() => {
      if (touched.current) return
      const next = (page + 1) % data.length
      scroller.current?.scrollTo({ x: next * pageWidth, animated: true })
      if (index === undefined) setInternal(next)
      onIndexChange?.(next)
    }, autoPlayMs)
    return () => clearInterval(timer)
  }, [autoPlayMs, data.length, index, onIndexChange, page, pageWidth])

  const accent = resolveColor(colors, tone, colors.accent)
  const dotSize = 7

  return (
    <View style={[{ gap: space(3) }, style]} onLayout={onContainerLayout}>
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={settle}
        onScrollBeginDrag={() => {
          touched.current = true
        }}
        style={height != null ? { height } : undefined}>
        {data.map((item, itemIndex) => (
          <View key={itemIndex} style={{ width: pageWidth }}>
            {renderItem(item, { index: itemIndex, active: itemIndex === page })}
          </View>
        ))}
      </ScrollView>

      {showDots && data.length > 1 && (
        <View style={[styles.dots, { gap: space(1.5) }]}>
          {dotWindow(page, data.length, maxDots).map((dot) => (
            <View
              key={dot.index}
              style={{
                width: dotSize * dot.scale,
                height: dotSize * dot.scale,
                borderRadius: dotSize,
                backgroundColor: dot.index === page ? accent : colors.borderStrong,
              }}
            />
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
})
