import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  ActivityIndicator,
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
import { sidePadding } from '../utils/optional'
import {
  clampTransform,
  distanceBetween,
  focalPoint,
  focusedTransform,
  isZoomed,
  resistScale,
  scaleFromPinch,
  settledScale,
  type ViewTransform,
} from '../utils/zoom'

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
   * image instead of zooming.
   *
   * ── Why this is not the whole defence ────────────────────────────────────
   * It cannot be. On iOS the pager's native scroll recogniser begins the
   * moment a finger drifts, and flipping `scrollEnabled` on a scroll that is
   * already running does not cancel it. A prop change also has to wait for a
   * render, which is a frame the gesture does not have.
   *
   * So the page CLAIMS the responder as the second finger lands, before any
   * movement, and these two flags only cover the window before that. Both are
   * cleared eagerly for the same reason: a pager left disabled is worse than
   * one re-enabled a touch early, since by then the claim is what is holding
   * it off. (Single-image galleries never showed the bug at all, because
   * paging is off there - which is exactly how it hid.)
   */
  const [pinching, setPinching] = useState(false)
  /** Two fingers are down, seen at touch-down rather than at grant */
  const [multiTouch, setMultiTouch] = useState(false)
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
        style={[styles.root, { backgroundColor: colors.media, opacity: backdrop }]}
        onStartShouldSetResponderCapture={(event) => {
          setMultiTouch(event.nativeEvent.touches.length >= 2)
          return false
        }}
        onTouchEnd={(event) => {
          // Both flags are cleared eagerly. Clearing one touch too early costs
          // nothing - by then the page has been granted the responder, and
          // that is what actually keeps the pager out of a pinch - while
          // leaving one set costs the pager entirely until the next touch
          if (event.nativeEvent.touches.length < 2) {
            setMultiTouch(false)
            setPinching(false)
          }
        }}
        onTouchCancel={() => {
          setMultiTouch(false)
          setPinching(false)
        }}>
        <ScrollView
          horizontal
          pagingEnabled
          // Paging is suspended while a page is zoomed, otherwise a pan inside
          // the image would flick to the next one - and while two fingers are
          // down, so a pinch is never swallowed by the pager.
          scrollEnabled={!zoomed && !pinching && !multiTouch && pages.length > 1}
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
                  <Photo uri={item.uri} width={width} height={height} tint={colors.onMedia} />
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
              {
                paddingBottom: insets.bottom + space(3),
                ...sidePadding(insets, space(4)),
                gap: space(2),
              },
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
            style={[
              styles.chrome,
              { paddingTop: insets.top + space(2), ...sidePadding(insets, space(4)) },
            ]}>
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

/**
 * One photo, with something to look at while it arrives.
 *
 * A full-screen viewer opened on a large image over a slow connection shows
 * black until it lands, which is indistinguishable from a broken picture. The
 * spinner sits behind the image rather than in front, so it disappears the
 * moment there is anything to see.
 */
function Photo({
  uri,
  width,
  height,
  tint,
}: {
  uri: string
  width: number
  height: number
  tint: string
}) {
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setLoading(true)
    setFailed(false)
  }, [uri])

  return (
    <View style={{ width, height }}>
      {(loading || failed) && (
        <View style={[StyleSheet.absoluteFill, styles.centre]}>
          {failed ? (
            <Text variant="caption" color="onMedia" style={styles.dim}>
              Could not load this one
            </Text>
          ) : (
            <ActivityIndicator color={tint} />
          )}
        </View>
      )}

      <Image
        source={{ uri }}
        style={{ width, height }}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false)
          setFailed(true)
        }}
      />
    </View>
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
    /** How many were down when these measurements were taken */
    fingers: 0,
    /** Where the pan had reached then, so a re-measure does not lose it */
    baseDx: 0,
    baseDy: 0,
  })
  const lastTap = useRef(0)

  /** The maths lives in `utils/zoom`, where the corner cases are tested */
  const focused = useCallback(
    (nextScale: number, focus: { x: number; y: number }) =>
      focusedTransform(
        nextScale,
        focus,
        { scale: start.current.scale, x: start.current.x, y: start.current.y },
        { x: start.current.focalX, y: start.current.focalY },
      ),
    [],
  )

  const apply = useCallback(
    (next: ViewTransform) => {
      view.current = next
      scale.setValue(next.scale)
      translateX.setValue(next.x)
      translateY.setValue(next.y)
    },
    [scale, translateX, translateY],
  )

  const settle = useCallback(
    (next: ViewTransform) => {
      view.current = next
      Animated.parallel([
        Animated.timing(scale, { toValue: next.scale, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(translateX, { toValue: next.x, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: next.y, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start()
    },
    [scale, translateX, translateY],
  )

  const clamp = useCallback(
    (value: ViewTransform) => clampTransform(value, width, height),
    [height, width],
  )

  /**
   * Takes the gesture's measurements from HERE.
   *
   * Called whenever the number of fingers changes. React Native reports a
   * release only when the LAST finger lifts, so without this the move handler
   * carries on against a baseline taken at the start of a pinch: lifting one
   * finger to carry on panning made the photo jump.
   */
  const rebase = useCallback(
    (touches: readonly { pageX: number; pageY: number }[], dx: number, dy: number) => {
      const focus = focalPoint(touches, width, height)
      start.current = {
        scale: view.current.scale,
        x: view.current.x,
        y: view.current.y,
        distance: touches.length >= 2 ? distanceBetween(touches) : 0,
        focalX: focus.x,
        focalY: focus.y,
        // One finger on a resting image is a dismissal; anything else is a
        // pinch or a pan. Decided here so that lifting back to one finger
        // re-arms it rather than leaving a dead gesture
        dismissing: !isZoomed(view.current.scale) && touches.length < 2,
        fingers: touches.length,
        baseDx: dx,
        baseDy: dy,
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
        onStartShouldSetPanResponder: () => false,
        /**
         * A second finger claims the gesture the moment it lands.
         *
         * This is the difference between a pinch that works and one that is
         * sometimes swallowed. Waiting for a MOVE is too late: on iOS the
         * pager's scroll recogniser starts as soon as the first finger drifts,
         * and turning `scrollEnabled` off does not cancel a scroll already
         * running. Claiming on touch-down happens before any of that.
         *
         * Only for two fingers. Claiming on every touch start would stop the
         * pager from ever scrolling, which is why this used to return false.
         */
        onStartShouldSetPanResponderCapture: (event) =>
          event.nativeEvent.touches.length >= 2,
        // Capture, not the bubbling variant: the pressable underneath becomes
        // the responder as soon as a finger lands, and only a capturing parent
        // can take the gesture back from it once it turns into a real drag.
        onMoveShouldSetPanResponderCapture: (event, gesture) => {
          // Two OR MORE: re-gripping mid-pinch puts a third finger down, and
          // an exact count dropped the gesture back to the pager
          if (event.nativeEvent.touches.length >= 2) return true
          if (isZoomed(view.current.scale)) return true
          // A downward drag on an unzoomed page means "dismiss"; sideways
          // movement belongs to the pager.
          return gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.5
        },
        onPanResponderGrant: (event, gesture) => {
          const touches = event.nativeEvent.touches
          rebase(touches, gesture.dx, gesture.dy)
          onPinchingChange(touches.length >= 2)
        },
        onPanResponderMove: (event, gesture) => {
          const touches = event.nativeEvent.touches

          // Any change in the number of fingers re-measures from here. React
          // Native only reports a release when the LAST one lifts, so without
          // this the maths carries on against a stale baseline
          if (touches.length !== start.current.fingers) {
            rebase(touches, gesture.dx, gesture.dy)
            onPinchingChange(touches.length >= 2)
            return
          }

          if (touches.length >= 2) {
            const raw = scaleFromPinch(
              start.current.scale,
              start.current.distance,
              distanceBetween(touches),
            )
            apply(
              clamp(focused(resistScale(raw, maxScale), focalPoint(touches, width, height))),
            )
            return
          }

          if (start.current.dismissing) {
            const travel = gesture.dy - start.current.baseDy
            const progress = Math.min(1, Math.max(0, travel) / (DISMISS_DISTANCE * 2))
            translateY.setValue(travel)
            view.current = { ...view.current, y: travel }
            backdrop.setValue(1 - progress * 0.75)
            return
          }

          apply(
            clamp({
              scale: view.current.scale,
              x: start.current.x + (gesture.dx - start.current.baseDx),
              y: start.current.y + (gesture.dy - start.current.baseDy),
            }),
          )
        },
        onPanResponderRelease: (_event, gesture) => {
          onPinchingChange(false)

          if (start.current.dismissing) {
            if (gesture.dy - start.current.baseDy > DISMISS_DISTANCE) {
              onClose()
              return
            }
            Animated.timing(backdrop, { toValue: 1, duration: 160, useNativeDriver: true }).start()
            settle({ scale: 1, x: 0, y: 0 })
            return
          }

          // Whatever was borrowed past the limits is given back here
          const settled = settledScale(view.current.scale, maxScale)
          const zoomedIn = isZoomed(settled)
          settle(zoomedIn ? clamp({ ...view.current, scale: settled }) : { scale: 1, x: 0, y: 0 })
          onZoomChange(zoomedIn)
        },
        onPanResponderTerminate: () => {
          onPinchingChange(false)
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [
      apply,
      backdrop,
      clamp,
      focused,
      height,
      maxScale,
      onClose,
      onPinchingChange,
      onZoomChange,
      rebase,
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
        const zoomedIn = isZoomed(view.current.scale)
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
          settle(clamp(focused(doubleTapScale, point)))
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
    [clamp, doubleTapScale, focused, height, onToggleChrome, onZoomChange, settle, width],
  )

  return (
    <View
      style={{ width, height }}
      /**
       * Only the count going UP is read from a touch event.
       *
       * On the way down it used to subtract one and guess, and the two
       * platforms disagree about whether the finger that just left is still in
       * the list - so the pager could be left disabled after a pinch, or
       * re-enabled during one. The gesture clears the flag itself now.
       */
      onTouchStart={(event) => {
        if (event.nativeEvent.touches.length >= 2) onPinchingChange(true)
      }}
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
  centre: { alignItems: 'center', justifyContent: 'center' },
  dim: { opacity: 0.7 },
  actions: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row' },
  action: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  counter: { opacity: 0.7 },
  close: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  closeBar: { position: 'absolute', width: 20, height: 2, transform: [{ rotate: '45deg' }] },
  closeBarCross: { transform: [{ rotate: '-45deg' }] },
})

export const ImageShower = memo(ImageShowerBase)
