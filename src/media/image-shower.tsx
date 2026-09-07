import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Animated,
  Easing,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'

import { Text } from '../primitives/text'
import { useInsets, useTheme } from '../theme/provider'

export type MediaItem = {
  uri: string
  /** `video` only affects which renderer is asked for - the package plays nothing itself */
  type?: 'image' | 'video'
  title?: string
}

export type ImageShowerProps = {
  visible: boolean
  /** Plain URIs or descriptors; both forms can be mixed */
  items: readonly (string | MediaItem)[]
  /** Starting page. Changing it while open jumps to that page */
  index?: number
  onIndexChange?: (index: number) => void
  onClose: () => void
  title?: string
  showCounter?: boolean
  maxScale?: number
  doubleTapScale?: number
  /**
   * Replaces the default renderer.
   *
   * The package draws with the core `Image` so it works with no extra
   * dependency; supply this to use a caching image component or to play video.
   */
  renderItem?: (item: MediaItem, state: { active: boolean; index: number }) => ReactNode
  renderHeader?: (state: { index: number; total: number; close: () => void }) => ReactNode
  /**
   * Actions along the bottom edge, shown with the chrome.
   *
   * Bottom rather than top: the viewer is held in one hand and the top of a
   * large phone is out of reach of the thumb holding it.
   */
  actions?: readonly ImageAction[]
}

export type ImageAction = {
  key: string
  label: string
  /** Receives the item the viewer is currently on */
  onPress: (item: MediaItem, index: number) => void
  destructive?: boolean
}

/** How far a downward drag must travel before it dismisses */
const DISMISS_DISTANCE = 120
const DOUBLE_TAP_MS = 280
const PINCH_SLOP = 1.01

function normalize(item: string | MediaItem): MediaItem {
  return typeof item === 'string' ? { uri: item, type: 'image' } : { type: 'image', ...item }
}

/**
 * Full-screen media viewer.
 *
 * Zoom is implemented with `PanResponder` and the core animation driver rather
 * than a gesture library. That is a deliberate trade: implementations built on
 * a platform scroll view get pinch for free but only on iOS, and adding a
 * gesture dependency would push a native module onto every consumer. This runs
 * the same on both platforms with nothing installed.
 *
 * Gestures: swipe to page, pinch to zoom, drag to pan while zoomed, double tap
 * to toggle zoom, drag down to dismiss, single tap to hide the chrome.
 */
function ImageShowerBase({
  visible,
  items,
  index = 0,
  onIndexChange,
  onClose,
  title,
  showCounter = true,
  maxScale = 4,
  doubleTapScale = 2.4,
  renderItem,
  renderHeader,
  actions,
}: ImageShowerProps) {
  const { colors, radius, space } = useTheme()
  const insets = useInsets()
  const { width, height } = useWindowDimensions()

  const pages = useMemo(() => items.map(normalize), [items])
  const [current, setCurrent] = useState(index)
  const [zoomed, setZoomed] = useState(false)
  /**
   * A second finger locks the pager.
   *
   * Spreading two fingers still moves them sideways, and a horizontal scroll
   * view happily reads that as a swipe - the gallery would flick to the next
   * image instead of zooming. The lock is released when the touch ends.
   */
  const [pinching, setPinching] = useState(false)
  const [chrome, setChrome] = useState(true)
  const backdrop = useRef(new Animated.Value(1)).current

  /**
   * The opening page is fixed at mount instead of scrolled to in an effect.
   *
   * A `scrollTo` on mount runs before layout settles and lands on page zero,
   * so tapping the fifth thumbnail would open the first image. Keying the
   * modal content by the opening index gives `contentOffset` a correct start.
   */
  const openedAt = useRef(index)
  useEffect(() => {
    if (visible) {
      openedAt.current = index
      setCurrent(index)
      setZoomed(false)
      setChrome(true)
      backdrop.setValue(1)
    }
  }, [backdrop, index, visible])

  const onScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(event.nativeEvent.contentOffset.x / width)
      if (next === current) return
      setCurrent(next)
      onIndexChange?.(next)
    },
    [current, onIndexChange, width],
  )

  if (!visible) return null

  return (
    <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View
        style={[styles.root, { backgroundColor: colors.media, opacity: backdrop }]}>
        <ScrollView
          horizontal
          pagingEnabled
          // Paging is suspended while a page is zoomed, otherwise a pan inside
          // the image would flick to the next one.
          scrollEnabled={!zoomed && !pinching && pages.length > 1}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          contentOffset={{ x: openedAt.current * width, y: 0 }}
          key={`pager-${openedAt.current}-${width}`}>
          {pages.map((item, pageIndex) => (
            <ZoomPage
              key={`${item.uri}-${pageIndex}`}
              width={width}
              height={height}
              maxScale={maxScale}
              doubleTapScale={doubleTapScale}
              active={pageIndex === current}
              backdrop={backdrop}
              onZoomChange={setZoomed}
              onPinchingChange={setPinching}
              onClose={onClose}
              onToggleChrome={() => setChrome((prev) => !prev)}>
              {/* Neighbours stay mounted so a swipe reveals a drawn frame, but
                  anything further away is skipped - a long gallery would
                  otherwise decode every image at once. */}
              {Math.abs(pageIndex - current) <= 1 ? (
                renderItem ? (
                  renderItem(item, { active: pageIndex === current, index: pageIndex })
                ) : (
                  <Image
                    source={{ uri: item.uri }}
                    style={{ width, height }}
                    resizeMode="contain"
                    accessibilityIgnoresInvertColors
                  />
                )
              ) : null}
            </ZoomPage>
          ))}
        </ScrollView>

        {chrome && actions != null && actions.length > 0 && (
          <View
            pointerEvents="box-none"
            style={[
              styles.actions,
              { paddingBottom: insets.bottom + space(3), paddingHorizontal: space(4), gap: space(2) },
            ]}>
            {actions.map((action) => {
              const item = pages[current]
              return (
                <Pressable
                  key={action.key}
                  disabled={item == null}
                  onPress={() => item && action.onPress(item, current)}
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                  style={({ pressed }) => [
                    styles.action,
                    {
                      paddingVertical: space(2.5),
                      backgroundColor: colors.overlay,
                      borderRadius: radius.md,
                      opacity: pressed ? 0.6 : 1,
                    },
                  ]}>
                  <Text
                    variant="label"
                    style={{ color: action.destructive ? colors.danger : colors.onMedia }}>
                    {action.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        )}

        {chrome && (
          <View
            pointerEvents="box-none"
            style={[styles.chrome, { paddingTop: insets.top + space(2), paddingHorizontal: space(4) }]}>
            {renderHeader ? (
              renderHeader({ index: current, total: pages.length, close: onClose })
            ) : (
              <>
                <View style={styles.chromeText}>
                  {(pages[current]?.title ?? title) != null && (
                    <Text variant="bodyStrong" color="onMedia" numberOfLines={1}>
                      {pages[current]?.title ?? title}
                    </Text>
                  )}
                  {showCounter && pages.length > 1 && (
                    <Text variant="caption" color="onMedia" style={styles.counter}>
                      {`${current + 1} / ${pages.length}`}
                    </Text>
                  )}
                </View>
                <Pressable
                  onPress={onClose}
                  hitSlop={16}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  style={styles.close}>
                  <View style={[styles.closeBar, { backgroundColor: colors.onMedia }]} />
                  <View
                    style={[
                      styles.closeBar,
                      styles.closeBarCross,
                      { backgroundColor: colors.onMedia },
                    ]}
                  />
                </Pressable>
              </>
            )}
          </View>
        )}
      </Animated.View>
    </Modal>
  )
}

type ZoomPageProps = {
  width: number
  height: number
  maxScale: number
  doubleTapScale: number
  active: boolean
  backdrop: Animated.Value
  onZoomChange: (zoomed: boolean) => void
  onPinchingChange: (pinching: boolean) => void
  onClose: () => void
  onToggleChrome: () => void
  children: ReactNode
}

function ZoomPage({
  width,
  height,
  maxScale,
  doubleTapScale,
  active,
  backdrop,
  onZoomChange,
  onPinchingChange,
  onClose,
  onToggleChrome,
  children,
}: ZoomPageProps) {
  const scale = useRef(new Animated.Value(1)).current
  const translateX = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(0)).current

  /**
   * Gesture state is mirrored in refs.
   *
   * Animated values driven on the native side cannot be read back
   * synchronously, and every frame of a pinch needs the previous value to
   * compute the next one.
   */
  const view = useRef({ scale: 1, x: 0, y: 0 })
  const start = useRef({
    scale: 1,
    x: 0,
    y: 0,
    distance: 0,
    /** Where the gesture began, measured from the centre of the page */
    focalX: 0,
    focalY: 0,
    dismissing: false,
  })
  const lastTap = useRef(0)

  /**
   * Zoom around a POINT, not around the middle of the screen.
   *
   * Scaling about the centre pulls whatever the user was looking at out from
   * under their fingers, so a detail in a corner runs away exactly when they
   * try to inspect it. Keeping the focal point fixed is one equation: a point
   * sits at `p * s + t` on screen, so holding it still across a scale change
   * means
   *
   *   t1 = focus - (focusAtStart - t0) * (s1 / s0)
   *
   * Passing the CURRENT focus as the first term also gives two-finger panning
   * for free: moving both fingers moves the image with them.
   */
  const focusedTranslate = useCallback(
    (nextScale: number, focus: { x: number; y: number }) => {
      const ratio = nextScale / start.current.scale
      return {
        scale: nextScale,
        x: focus.x - (start.current.focalX - start.current.x) * ratio,
        y: focus.y - (start.current.focalY - start.current.y) * ratio,
      }
    },
    [],
  )

  const apply = useCallback(
    (next: { scale: number; x: number; y: number }) => {
      view.current = next
      scale.setValue(next.scale)
      translateX.setValue(next.x)
      translateY.setValue(next.y)
    },
    [scale, translateX, translateY],
  )

  const settle = useCallback(
    (next: { scale: number; x: number; y: number }) => {
      view.current = next
      Animated.parallel([
        Animated.timing(scale, { toValue: next.scale, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(translateX, { toValue: next.x, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: next.y, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start()
    },
    [scale, translateX, translateY],
  )

  /**
   * Keeps the image from being dragged off screen once it is zoomed in.
   *
   * The bounds follow the CURRENT scale, including a scale borrowed past the
   * maximum: clamping to the settled size while the image is still stretched
   * would drag it sideways under the fingers.
   */
  const clamp = useCallback(
    (value: { scale: number; x: number; y: number }) => {
      const limitX = Math.max(0, (width * value.scale - width) / 2)
      const limitY = Math.max(0, (height * value.scale - height) / 2)
      return {
        scale: value.scale,
        x: Math.min(limitX, Math.max(-limitX, value.x)),
        y: Math.min(limitY, Math.max(-limitY, value.y)),
      }
    },
    [height, width],
  )

  const reset = useCallback(() => {
    settle({ scale: 1, x: 0, y: 0 })
    onZoomChange(false)
  }, [onZoomChange, settle])

  // Leaving a page returns it to its resting state, so coming back does not
  // land mid-zoom on an image the user has moved on from.
  useEffect(() => {
    if (!active && view.current.scale !== 1) reset()
  }, [active, reset])

  const responder = useMemo(
    () =>
      PanResponder.create({
        // Taps are handled by the pressable below; claiming the responder on
        // touch start would also stop the pager from ever scrolling.
        onStartShouldSetPanResponder: () => false,
        onStartShouldSetPanResponderCapture: () => false,
        // Capture, not the bubbling variant: the pressable underneath becomes
        // the responder as soon as a finger lands, and only a capturing parent
        // can take the gesture back from it once it turns into a real drag.
        onMoveShouldSetPanResponderCapture: (event, gesture) => {
          if (event.nativeEvent.touches.length === 2) return true
          if (view.current.scale > PINCH_SLOP) return true
          // A downward drag on an unzoomed page means "dismiss"; sideways
          // movement belongs to the pager.
          return gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.5
        },
        onPanResponderGrant: (event) => {
          const touches = event.nativeEvent.touches
          const focus = focalPoint(touches, width, height)
          start.current = {
            scale: view.current.scale,
            x: view.current.x,
            y: view.current.y,
            distance: touches.length === 2 ? distanceBetween(touches) : 0,
            focalX: focus.x,
            focalY: focus.y,
            dismissing: view.current.scale <= PINCH_SLOP && touches.length < 2,
          }
        },
        onPanResponderMove: (event, gesture) => {
          const touches = event.nativeEvent.touches

          if (touches.length === 2) {
            const distance = distanceBetween(touches)
            const focus = focalPoint(touches, width, height)

            // The second finger can land after the gesture began: restart the
            // measurement from here instead of dividing by a zero distance.
            if (start.current.distance === 0) {
              start.current = {
                ...start.current,
                scale: view.current.scale,
                x: view.current.x,
                y: view.current.y,
                distance,
                focalX: focus.x,
                focalY: focus.y,
                dismissing: false,
              }
              return
            }

            const raw = (start.current.scale * distance) / start.current.distance
            // Past either limit the image keeps moving, but only a little.
            // A hard stop feels like the gesture broke; resistance says the
            // limit is real and the finger is still being heard.
            const next =
              raw > maxScale
                ? maxScale + (raw - maxScale) * 0.2
                : raw < 1
                  ? 1 - (1 - raw) * 0.35
                  : raw
            apply(clamp(focusedTranslate(next, focus)))
            return
          }

          if (start.current.dismissing) {
            const progress = Math.min(1, Math.max(0, gesture.dy) / (DISMISS_DISTANCE * 2))
            translateY.setValue(gesture.dy)
            view.current = { ...view.current, y: gesture.dy }
            backdrop.setValue(1 - progress * 0.75)
            return
          }

          apply(
            clamp({
              scale: view.current.scale,
              x: start.current.x + gesture.dx,
              y: start.current.y + gesture.dy,
            }),
          )
        },
        onPanResponderRelease: (_event, gesture) => {
          if (start.current.dismissing) {
            if (gesture.dy > DISMISS_DISTANCE) {
              onClose()
              return
            }
            Animated.timing(backdrop, { toValue: 1, duration: 160, useNativeDriver: true }).start()
            settle({ scale: 1, x: 0, y: 0 })
            return
          }

          // Whatever was borrowed past the limits is given back here
          const settled = Math.min(maxScale, Math.max(1, view.current.scale))
          const zoomedIn = settled > PINCH_SLOP
          settle(zoomedIn ? clamp({ ...view.current, scale: settled }) : { scale: 1, x: 0, y: 0 })
          onZoomChange(zoomedIn)
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [
      apply,
      backdrop,
      clamp,
      focusedTranslate,
      height,
      maxScale,
      onClose,
      onZoomChange,
      settle,
      translateY,
      width,
    ],
  )

  const onTap = useCallback(
    (event: GestureResponderEvent) => {
      const now = Date.now()
      const point = {
        x: event.nativeEvent.pageX - width / 2,
        y: event.nativeEvent.pageY - height / 2,
      }

      if (now - lastTap.current < DOUBLE_TAP_MS) {
        lastTap.current = 0
        const zoomedIn = view.current.scale > PINCH_SLOP
        if (zoomedIn) {
          settle({ scale: 1, x: 0, y: 0 })
        } else {
          // Zoom towards what was tapped, the way a photo viewer does.
          start.current = {
            ...start.current,
            scale: view.current.scale,
            x: view.current.x,
            y: view.current.y,
            focalX: point.x,
            focalY: point.y,
          }
          settle(clamp(focusedTranslate(doubleTapScale, point)))
        }
        onZoomChange(!zoomedIn)
        return
      }
      lastTap.current = now
      // A single tap only counts once the double-tap window has passed, so a
      // double tap never also toggles the chrome.
      setTimeout(() => {
        if (lastTap.current !== 0 && Date.now() - lastTap.current >= DOUBLE_TAP_MS) {
          onToggleChrome()
        }
      }, DOUBLE_TAP_MS)
    },
    [clamp, doubleTapScale, focusedTranslate, height, onToggleChrome, onZoomChange, settle, width],
  )

  const reportTouches = useCallback(
    (count: number) => {
      onPinchingChange(count >= 2)
    },
    [onPinchingChange],
  )

  return (
    <View
      style={{ width, height }}
      onTouchStart={(event) => reportTouches(event.nativeEvent.touches.length)}
      onTouchEnd={(event) => reportTouches(event.nativeEvent.touches.length - 1)}
      onTouchCancel={() => reportTouches(0)}
      {...responder.panHandlers}>
      <Pressable onPress={onTap} style={styles.fill}>
        <Animated.View
          style={[
            styles.fill,
            { transform: [{ translateX }, { translateY }, { scale }] },
          ]}>
          {children}
        </Animated.View>
      </Pressable>
    </View>
  )
}

type Touch = { pageX: number; pageY: number }

function distanceBetween(touches: readonly Touch[]): number {
  const [a, b] = touches
  if (!a || !b) return 0
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY)
}

/** Midpoint of the active touches, measured from the centre of the page */
function focalPoint(
  touches: readonly Touch[],
  width: number,
  height: number,
): { x: number; y: number } {
  const [a, b] = touches
  if (!a) return { x: 0, y: 0 }
  const pageX = b ? (a.pageX + b.pageX) / 2 : a.pageX
  const pageY = b ? (a.pageY + b.pageY) / 2 : a.pageY
  return { x: pageX - width / 2, y: pageY - height / 2 }
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  chrome: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  chromeText: { flex: 1, gap: 2 },
  actions: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row' },
  action: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  counter: { opacity: 0.7 },
  close: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  closeBar: { position: 'absolute', width: 20, height: 2, transform: [{ rotate: '45deg' }] },
  closeBarCross: { transform: [{ rotate: '-45deg' }] },
})

export const ImageShower = memo(ImageShowerBase)
