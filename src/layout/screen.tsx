import { memo, useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { resolveColor } from '../theme/color'
import { sidePadding } from '../utils/optional'
import { FooterSlotContext } from './footer-slot'
import { ScrollContext } from './scroll-context'
import { useInsets, useTheme } from '../theme/provider'
import { useKeyboardVisible } from '../utils/keyboard'
import type { ColorInput } from '../theme/types'

export type ScreenEdge = 'top' | 'bottom'

export type ScreenProps = {
  children: ReactNode
  /**
   * Fixed header, rendered OUTSIDE the scroll area.
   *
   * Passing a header as a child puts it inside the scroll view, where anything
   * it carries - a balance, a filter, a primary action - disappears as soon as
   * the user scrolls.
   */
  header?: ReactNode
  /**
   * Fixed footer, a sibling of the scroll area rather than its last child.
   *
   * As a child, an action block forces the user to scroll to the end to reach
   * it; as a sibling it also stops overlapping the content, because the scroll
   * area simply takes the space that is left.
   */
  footer?: ReactNode
  /**
   * Drawn over the scroll area without taking any of its space.
   *
   * Where a floating button belongs. Inside the scroll context, so anything
   * put here can react to the scrolling underneath it; laid out over the
   * content, so it does not shorten the list. Touches pass through everywhere
   * except what is actually drawn.
   */
  overlay?: ReactNode
  scrollable?: boolean
  /**
   * Slides the footer away as the screen scrolls down, and brings it back the
   * moment it scrolls up.
   *
   * For a bar that is useful but not urgent - a filter row, a cart summary. A
   * bar holding the one action of the screen should stay put: hiding it makes
   * the user hunt for what they came to do.
   */
  hideFooterOnScroll?: boolean
  /**
   * Keeps the focused field above the keyboard.
   *
   * ON by default. A field disappearing under the keyboard is never what
   * anyone wanted, and leaving it opt-in means every screen that grows a text
   * field later starts out broken - which is exactly how it went here.
   */
  keyboardAware?: boolean
  background?: ColorInput | 'none'
  /** Horizontal padding for the content. Defaults to `space(4)` */
  padding?: number
  /** Which safe-area edges to respect. Screens with their own full-bleed
   * header usually drop `'top'` */
  edges?: readonly ScreenEdge[]
  /**
   * Pull to refresh.
   *
   * Offered as a callback rather than leaving the caller to build a
   * `RefreshControl`, because the one thing that always gets forgotten there
   * is the tint - the default spinner is grey on iOS and blue on Android, and
   * neither belongs to the app it is spinning in.
   */
  onRefresh?: () => void
  refreshing?: boolean
  /** Full control, when the built-in one is not enough */
  refreshControl?: ScrollViewProps['refreshControl']
  contentContainerStyle?: StyleProp<ViewStyle>
  style?: StyleProp<ViewStyle>
  scrollProps?: Omit<ScrollViewProps, 'refreshControl' | 'contentContainerStyle'>
}

const DEFAULT_EDGES: readonly ScreenEdge[] = ['top', 'bottom']

function ScreenBase({
  children,
  header,
  footer,
  overlay,
  scrollable = true,
  hideFooterOnScroll = false,
  keyboardAware = true,
  background = 'canvas',
  padding,
  edges = DEFAULT_EDGES,
  onRefresh,
  refreshing = false,
  refreshControl,
  contentContainerStyle,
  style,
  scrollProps,
}: ScreenProps) {
  const { colors, space } = useTheme()
  const insets = useInsets()
  const keyboardUp = useKeyboardVisible()

  /**
   * Published for whatever is drawn over the content - a header that shrinks,
   * a bar that appears. Driven natively, so reacting to it costs nothing.
   */
  const scrollY = useRef(new Animated.Value(0)).current
  const scroller = useRef<ScrollView>(null)
  /** The last offset seen, because a native value cannot be read back */
  const current = useRef(0)

  /**
   * How many things are currently asking for the page to stay still.
   *
   * A count, not a flag: a drag ending while a sheet is still open would
   * otherwise switch scrolling back on underneath it.
   */
  const holds = useRef(0)
  const [scrollLocked, setScrollLocked] = useState(false)

  const setScrollEnabled = useCallback((enabled: boolean) => {
    holds.current = Math.max(0, holds.current + (enabled ? -1 : 1))
    setScrollLocked(holds.current > 0)
  }, [])

  const scrollTo = useCallback((y: number, animated = true) => {
    scroller.current?.scrollTo({ y: Math.max(0, y), animated })
  }, [])
  const scrollToTop = useCallback(() => scrollTo(0), [scrollTo])
  const scrollBy = useCallback(
    (delta: number, animated = true) => scrollTo(current.current + delta, animated),
    [scrollTo],
  )

  const offset = useMemo(
    () => ({ y: scrollY, scrollToTop, scrollTo, scrollBy, setScrollEnabled }),
    [scrollBy, scrollTo, scrollToTop, scrollY, setScrollEnabled],
  )

  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
        // Everything animated reads the native value; this only remembers the
        // number so something can later ask to move relative to it.
        listener: (event) => {
          const value = (event as { nativeEvent?: { contentOffset?: { y?: number } } }).nativeEvent
          current.current = value?.contentOffset?.y ?? current.current
        },
      }),
    [scrollY],
  )

  const [footerHeight, setFooterHeight] = useState(0)
  const onFooterLayout = useCallback((event: LayoutChangeEvent) => {
    setFooterHeight(event.nativeEvent.layout.height)
  }, [])

  /**
   * Direction from a clamped difference, entirely on the native side.
   *
   * `diffClamp` grows as the offset grows and shrinks as it falls, bounded by
   * the bar's own height - which is the hide-on-scroll behaviour written as
   * one value. Working out the direction in JavaScript would mean a listener
   * on every frame of every scroll, for a bar that mostly sits still.
   */
  const footerShift = useMemo(
    () => Animated.diffClamp(scrollY, 0, Math.max(1, footerHeight)),
    [footerHeight, scrollY],
  )

  /**
   * The design's gutter, plus whatever the sensor housing takes.
   *
   * Zero in portrait. Turned on its side a phone reserves around 59pt each
   * way, and content laid out to the raw edge is cut off there.
   */
  const gutter = sidePadding(insets, padding ?? space(4))
  const backgroundColor =
    background === 'none' ? 'transparent' : resolveColor(colors, background, colors.canvas)

  const top = edges.includes('top') ? insets.top : 0
  // The keyboard covers the home indicator, so its inset is dropped while a
  // field is focused - otherwise a footer floats a finger's width too high.
  const bottom =
    edges.includes('bottom') && !(keyboardAware && keyboardUp) ? insets.bottom : 0

  const pull =
    refreshControl ??
    (onRefresh != null ? (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={colors.textMuted}
        colors={[colors.accent]}
        progressBackgroundColor={colors.surface}
      />
    ) : undefined)

  const content = scrollable ? (
    <Animated.ScrollView
      ref={scroller}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
      // iOS inserts the keyboard as a scroll inset AND scrolls the focused
      // field into view. Lifting the whole screen with a padding behaviour
      // does neither: it moves everything up and leaves the field wherever it
      // was in the list.
      //
      // Android needs nothing here: the window itself resizes, the list gets
      // shorter, and the focused field is scrolled into what is left. Adding
      // the keyboard height as padding as well would leave a gap the size of a
      // keyboard at the end of every list.
      automaticallyAdjustKeyboardInsets={keyboardAware}
      // Held still while something owns the vertical axis - a row being
      // dragged to a new place, most of all
      scrollEnabled={!scrollLocked}
      refreshControl={pull}
      contentContainerStyle={[
        {
          ...gutter,
          // A floating footer covers the end of the list, so the list has to
          // end above it
          paddingBottom: hideFooterOnScroll
            ? footerHeight + space(4)
            : footer
              ? space(4)
              : bottom + space(4),
        },
        contentContainerStyle,
      ]}
      {...scrollProps}>
      {children}
    </Animated.ScrollView>
  ) : (
    <View
      style={[
        styles.fill,
        { ...gutter, paddingBottom: footer ? 0 : bottom },
        contentContainerStyle,
      ]}>
      {children}
    </View>
  )

  const body = (
    <>
      {header != null && <View style={{ paddingTop: top }}>{header}</View>}
      {header == null && top > 0 ? <View style={{ height: top }} /> : null}
      {overlay == null ? (
        content
      ) : (
        // Wrapped only when there is something to lay over, so a screen
        // without one keeps exactly the layout it had
        <View style={styles.fill}>
          {content}
          <View pointerEvents="box-none" style={styles.overlay}>
            {overlay}
          </View>
        </View>
      )}
      {footer != null && (
        // The footer slot owns the safe area; anything inside it must not add
        // the inset a second time (see `footer-slot.ts`).
        <FooterSlotContext.Provider value>
        {hideFooterOnScroll ? (
          // Laid over the content rather than beside it: a bar that slides away
          // has to give its space back, and a bar in the layout never does.
          <Animated.View
            onLayout={onFooterLayout}
            style={[
              styles.floatingFooter,
              {
                ...gutter,
                paddingBottom: bottom || space(2),
                backgroundColor,
                transform: [{ translateY: footerShift }],
              },
            ]}>
            {footer}
          </Animated.View>
        ) : (
          <View style={{ ...gutter, paddingBottom: bottom || space(2) }}>{footer}</View>
        )}
        </FooterSlotContext.Provider>
      )}
    </>
  )

  return (
    <ScrollContext.Provider value={offset}>
    <View style={[styles.fill, { backgroundColor }, style]}>
      {keyboardAware && !scrollable ? (
        // Only a screen with nothing to scroll needs the whole layout lifted;
        // where there is a list, moving it is worse than adjusting it.
        <KeyboardAvoidingView
          style={styles.fill}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </View>
    </ScrollContext.Provider>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  floatingFooter: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  // Covers the scrolling area only. Above the header it would put a floating
  // control on top of the back button
  overlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
})

export const Screen = memo(ScreenBase)
