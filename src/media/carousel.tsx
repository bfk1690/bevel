import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Animated,
  Easing,
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
import { dotWindow, loopCorrection, loopedIndex, loopedOffset, pageFromOffset } from '../utils/carousel'
import { allowsAmbientMotion, useReducedMotion } from '../utils/motion'

export type CarouselProps<T> = {
  data: readonly T[]
  renderItem: (item: T, state: { index: number; active: boolean }) => ReactNode
  /** Controlled page. Changing it scrolls there */
  index?: number
  onIndexChange?: (index: number) => void
  /**
   * Wraps around at both ends. On by default: reaching the last page and
   * finding the swipe does nothing reads as a broken control, not as a limit.
   */
  loop?: boolean
  height?: number
  showDots?: boolean
  /** Most dots to draw before the row starts sliding. Defaults to 5 */
  maxDots?: number
  /**
   * Advances on its own every N ms.
   *
   * Ignored when the system has been asked to reduce movement: this is the
   * category that setting is really about. A transition answers something the
   * reader just did; a carousel turning by itself happens AT them, and cannot
   * be predicted or stopped by holding still.
   */
  autoPlayMs?: number
  /**
   * How long after the last touch auto-play picks up again.
   *
   * Touching pauses it, because a page that moves while being read is worse
   * than one that never moved. Stopping for good is worse still: a shop
   * banner that never turns again after one swipe reads as dead. `0` keeps it
   * stopped, for the cases where the user taking hold really is the end of it.
   */
  resumeAfterMs?: number
  tone?: ColorInput
  style?: StyleProp<ViewStyle>
}

/**
 * Paged carousel.
 *
 * Wrapping is done by rendering a copy of the last page before the first and a
 * copy of the first after the last. Landing on a copy hands back the real
 * index and the scroll position is moved to the matching real page WITHOUT
 * animation, so the swipe continues in one direction and the seam is never
 * seen. A paged scroll view has no notion of wrapping, and re-ordering the
 * data mid-gesture would move the page out from under the finger.
 *
 * Auto-play pauses on touch and picks up again once the pager has been left
 * alone. Moving a page while it is being read is rude; never moving again
 * after a single swipe is dead.
 */
export function Carousel<T>({
  data,
  renderItem,
  index,
  onIndexChange,
  loop = true,
  height,
  showDots = true,
  maxDots = 5,
  autoPlayMs,
  resumeAfterMs = 4000,
  tone = 'accent',
  style,
}: CarouselProps<T>) {
  const { colors, space } = useTheme()
  const reducedMotion = useReducedMotion()
  const window = useWindowDimensions()
  const scroller = useRef<ScrollView>(null)

  const [width, setWidth] = useState(0)
  const [internal, setInternal] = useState(index ?? 0)
  const page = index ?? internal
  /** Paused by a touch, released once the pager has been left alone */
  const paused = useRef(false)
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ready = useRef(false)

  const pause = useCallback(() => {
    paused.current = true
    if (resumeTimer.current) clearTimeout(resumeTimer.current)
    resumeTimer.current = null
  }, [])

  const scheduleResume = useCallback(() => {
    if (!paused.current || resumeAfterMs <= 0) return
    if (resumeTimer.current) clearTimeout(resumeTimer.current)
    resumeTimer.current = setTimeout(() => {
      paused.current = false
      resumeTimer.current = null
    }, resumeAfterMs)
  }, [resumeAfterMs])

  // A timer that outlives the screen would wake up into a pager that is gone
  useEffect(() => () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current)
  }, [])

  const count = data.length
  const wraps = loop && count > 1
  const pageWidth = width > 0 ? width : window.width

  /** The rendered list, with a clone at each end when it wraps */
  const pages = useMemo(() => {
    if (!wraps) return data.map((item, itemIndex) => ({ item, index: itemIndex }))
    return [
      { item: data[count - 1]!, index: count - 1 },
      ...data.map((item, itemIndex) => ({ item, index: itemIndex })),
      { item: data[0]!, index: 0 },
    ]
  }, [count, data, wraps])

  const scrollTo = useCallback(
    (raw: number, animated: boolean) => {
      scroller.current?.scrollTo({ x: raw * pageWidth, y: 0, animated })
    },
    [pageWidth],
  )

  const onContainerLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const next = event.nativeEvent.layout.width
      setWidth(next)
      // The first page of a wrapping pager is the second cell, and the jump has
      // to happen the moment a width exists - before that there is nowhere to
      // scroll to.
      if (!ready.current && wraps && next > 0) {
        ready.current = true
        requestAnimationFrame(() => {
          scroller.current?.scrollTo({ x: loopedOffset(page) * next, y: 0, animated: false })
        })
      }
    },
    [page, wraps],
  )

  const settle = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const raw = pageFromOffset(event.nativeEvent.contentOffset.x, pageWidth, pages.length)
      const next = wraps ? loopedIndex(raw, count) : raw

      if (wraps) {
        const correction = loopCorrection(raw, count)
        // Straight after the momentum, and never animated: an animated jump is
        // the seam becoming visible.
        if (correction != null) scrollTo(correction, false)
      }

      // The momentum has settled, so the countdown to resuming can start -
      // including after a page turn auto-play itself asked for, where the
      // pager is already running and this is a no-op.
      scheduleResume()

      if (next === page) return
      if (index === undefined) setInternal(next)
      onIndexChange?.(next)
    },
    [count, index, onIndexChange, page, pageWidth, pages.length, scheduleResume, scrollTo, wraps],
  )

  // A controlled index that changes from elsewhere has to be followed
  useEffect(() => {
    if (index === undefined || width <= 0) return
    scrollTo(wraps ? loopedOffset(index) : index, true)
  }, [index, scrollTo, width, wraps])

  useEffect(() => {
    if (!allowsAmbientMotion(reducedMotion)) return
    if (!autoPlayMs || autoPlayMs <= 0 || count < 2) return
    const timer = setInterval(() => {
      if (paused.current) return
      if (wraps) {
        // One step forward in the rendered list; the clone at the end makes
        // the wrap look like any other page turn.
        scrollTo(loopedOffset(page) + 1, true)
        return
      }
      const next = (page + 1) % count
      scrollTo(next, true)
      if (index === undefined) setInternal(next)
      onIndexChange?.(next)
    }, autoPlayMs)
    return () => clearInterval(timer)
  }, [autoPlayMs, count, index, onIndexChange, page, reducedMotion, scrollTo, wraps])

  /**
   * The dot window is remembered between renders.
   *
   * It has to be, or the row would re-centre on every page and the highlight
   * would never appear to move. Feeding the previous start back in is what
   * lets the active dot travel across a window that stays put.
   */
  const dotStart = useRef(0)
  const dots = useMemo(() => {
    const next = dotWindow(page, count, maxDots, dotStart.current)
    dotStart.current = next.start
    return next.dots
  }, [count, maxDots, page])

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
        onScrollBeginDrag={pause}
        // A slow drag never gains momentum, so the resume has to be armed from
        // here as well or the pager would stay paused for ever.
        onScrollEndDrag={scheduleResume}
        style={height != null ? { height } : undefined}>
        {pages.map((entry, position) => (
          <View key={`${entry.index}-${position}`} style={{ width: pageWidth }}>
            {renderItem(entry.item, { index: entry.index, active: entry.index === page })}
          </View>
        ))}
      </ScrollView>

      {showDots && count > 1 && (
        <View style={[styles.dots, { gap: space(1.5) }]}>
          {dots.map((dot, position) => (
            <PagerDot
              // Keyed by POSITION, not by page. The window slides its indices
              // along, and keying by index would unmount every dot on the
              // shift - taking the animation with it.
              key={position}
              size={dotSize}
              scale={dot.scale}
              active={dot.index === page}
              accent={accent}
              idle={colors.borderStrong}
            />
          ))}
        </View>
      )}
    </View>
  )
}

/**
 * One dot.
 *
 * Everything animated here runs on the native driver: transform and opacity
 * can, width and colour cannot. So the dot keeps a fixed footprint and is
 * SCALED, and the colour change is a crossfade between two stacked circles
 * rather than an interpolated backgroundColor. A row of dots animating on the
 * JS thread would stutter at exactly the moment it matters - while the pager
 * beside it is being dragged.
 */
function PagerDot({
  size,
  scale,
  active,
  accent,
  idle,
}: {
  size: number
  scale: number
  active: boolean
  accent: string
  idle: string
}) {
  const grow = useRef(new Animated.Value(scale)).current
  const fade = useRef(new Animated.Value(active ? 1 : 0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(grow, {
        toValue: active ? Math.max(scale, 1) : scale,
        useNativeDriver: true,
        speed: 20,
        bounciness: 6,
      }),
      Animated.timing(fade, {
        toValue: active ? 1 : 0,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start()
  }, [active, fade, grow, scale])

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        transform: [{ scale: grow }],
      }}>
      <View style={[StyleSheet.absoluteFill, { borderRadius: size, backgroundColor: idle }]} />
      <Animated.View
        style={[StyleSheet.absoluteFill, { borderRadius: size, backgroundColor: accent, opacity: fade }]}
      />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
})
