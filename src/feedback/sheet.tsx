import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  Modal as RNModal,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { Text } from '../primitives/text'
import { resolveColor } from '../theme/color'
import { useInsets, useTheme } from '../theme/provider'
import type { ColorInput, RadiusToken } from '../theme/types'
import { transitionDuration, useReducedMotion } from '../utils/motion'
import { sidePadding } from '../utils/optional'
import { DISMISS, nearestSnapIndex, resolveSnapPoints, type SnapPoint } from '../utils/sheet'

export type SheetProps = {
  visible: boolean
  onClose: () => void
  /**
   * The heights it settles at, in points or as a share of the room available.
   *
   * A percentage is of the space the sheet HAS - under the status bar, over
   * the home indicator - because half of the screen is not half of what is
   * left once those are taken out.
   */
  snapPoints?: readonly SnapPoint[]
  /** Controlled position. Leave out to let the sheet own it */
  index?: number
  onIndexChange?: (index: number) => void
  /** Where it opens. Ignored when `index` is given */
  initialIndex?: number
  title?: string
  children?: ReactNode
  /** Pinned below the content, outside the scroll area */
  footer?: ReactNode
  /** Dragging below the smallest snap closes it */
  dismissible?: boolean
  dismissOnBackdrop?: boolean
  scrim?: boolean
  /** The strip at the top, and the thing the drag is limited to */
  handle?: boolean
  scrollable?: boolean
  /** Space kept above the sheet at its tallest */
  topInset?: number
  bg?: ColorInput
  radius?: RadiusToken | number
  style?: StyleProp<ViewStyle>
}

const IN_DURATION = 300
const OUT_DURATION = 220

/**
 * A sheet that settles at more than one height.
 *
 * The difference from `Modal`: this one is a place to live rather than a
 * question to answer. It stays up while the screen behind it is used, and the
 * reader resizes it to suit what they are doing - a map with a list over it, a
 * player, a filter panel.
 *
 * The sheet is ONE view of the tallest size, moved up and down. Animating its
 * height instead would put a layout pass on every frame of a gesture, and
 * transforms are the only thing that runs on the native driver.
 *
 * The drag is limited to the handle. A sheet that resizes from anywhere fights
 * the list inside it: a downward flick meant for the content collapses the
 * whole thing instead.
 */
export function Sheet({
  visible,
  onClose,
  snapPoints = ['50%'],
  index,
  onIndexChange,
  initialIndex = 0,
  title,
  children,
  footer,
  dismissible = true,
  dismissOnBackdrop = true,
  scrim = true,
  handle = true,
  scrollable = true,
  topInset,
  bg = 'sheet',
  radius = 'lg',
  style,
}: SheetProps) {
  const { colors, radius: radii, space } = useTheme()
  const insets = useInsets()
  const reducedMotion = useReducedMotion()
  const window = useWindowDimensions()

  const available = Math.max(
    0,
    window.height - insets.top - (topInset ?? space(6)),
  )
  const snaps = useMemo(() => resolveSnapPoints(snapPoints, available), [available, snapPoints])
  const tallest = snaps.length > 0 ? snaps[snaps.length - 1] : available

  const [ownIndex, setOwnIndex] = useState(initialIndex)
  const current = Math.min(Math.max(0, index ?? ownIndex), Math.max(0, snaps.length - 1))
  const currentHeight = snaps[current] ?? tallest

  /** Distance below its tallest position, so 0 is fully open */
  const shift = useRef(new Animated.Value(tallest)).current
  /** The same figure in JavaScript, which a gesture needs and a native value cannot give back */
  const shiftValue = useRef(tallest)
  const [mounted, setMounted] = useState(visible)

  const settle = useCallback(
    (toValue: number, duration: number, then?: () => void) => {
      shiftValue.current = toValue
      Animated.timing(shift, {
        toValue,
        // A sheet crosses most of the screen, which is exactly the travel the
        // setting is about. Shortened rather than cut: it still has to be seen
        // arriving
        duration: transitionDuration(duration, reducedMotion),
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) then?.()
      })
    },
    [reducedMotion, shift],
  )

  useEffect(() => {
    if (visible) {
      setMounted(true)
      settle(tallest - currentHeight, IN_DURATION)
      return
    }
    if (!mounted) return
    settle(tallest, OUT_DURATION, () => setMounted(false))
  }, [currentHeight, mounted, settle, tallest, visible])

  const goTo = useCallback(
    (next: number) => {
      if (next === DISMISS) {
        onClose()
        return
      }
      if (index == null) setOwnIndex(next)
      onIndexChange?.(next)
      settle(tallest - (snaps[next] ?? tallest), IN_DURATION)
    },
    [index, onClose, onIndexChange, settle, snaps, tallest],
  )

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          Math.abs(gesture.dy) > 4 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderGrant: () => {
          // Where the drag started from, so the sheet follows the finger rather
          // than jumping to it
          shiftValue.current = tallest - currentHeight
        },
        onPanResponderMove: (_event, gesture) => {
          const from = tallest - currentHeight
          // Upward past the tallest snap is resisted rather than stopped: a
          // hard stop reads as the gesture having broken
          const raw = from + gesture.dy
          const next = raw < 0 ? raw * 0.2 : raw
          shiftValue.current = next
          shift.setValue(next)
        },
        onPanResponderRelease: (_event, gesture) => {
          goTo(
            nearestSnapIndex({
              height: tallest - shiftValue.current,
              velocity: gesture.vy,
              snaps,
              current: currentHeight,
              dismissible,
            }),
          )
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [currentHeight, dismissible, goTo, shift, snaps, tallest],
  )

  if (!mounted) return null

  const surface = resolveColor(colors, bg, colors.sheet)
  const borderRadius = typeof radius === 'number' ? radius : (radii[radius] ?? radii.lg)

  const body = (
    <View style={{ ...sidePadding(insets, space(4)), paddingBottom: insets.bottom || space(4) }}>
      {children}
    </View>
  )

  return (
    <RNModal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.root} accessibilityViewIsModal>
        {scrim && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.cover,
              {
                backgroundColor: colors.overlay,
                // Fades with the sheet's own position, so a half-open sheet
                // dims the page half as much
                opacity: shift.interpolate({
                  inputRange: [0, Math.max(1, tallest)],
                  outputRange: [1, 0],
                  extrapolate: 'clamp',
                }),
              },
            ]}
          />
        )}

        <Pressable
          style={StyleSheet.absoluteFill}
          disabled={!dismissOnBackdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />

        <Animated.View
          style={[
            styles.sheet,
            {
              height: tallest,
              backgroundColor: surface,
              borderTopLeftRadius: borderRadius,
              borderTopRightRadius: borderRadius,
              transform: [{ translateY: shift }],
            },
            style,
          ]}>
          <View {...responder.panHandlers} style={{ paddingBottom: space(1) }}>
            {handle && (
              <View style={styles.handleArea}>
                <View style={[styles.handle, { backgroundColor: colors.border }]} />
              </View>
            )}
            {title != null && (
              <View style={{ ...sidePadding(insets, space(4)), paddingBottom: space(2) }}>
                <Text variant="heading" numberOfLines={1}>
                  {title}
                </Text>
              </View>
            )}
          </View>

          {scrollable ? (
            <ScrollView
              style={styles.fill}
              contentContainerStyle={styles.grow}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {body}
            </ScrollView>
          ) : (
            <View style={styles.fill}>{body}</View>
          )}

          {footer != null && (
            <View
              style={{
                ...sidePadding(insets, space(4)),
                paddingBottom: insets.bottom || space(4),
                paddingTop: space(2),
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: colors.border,
              }}>
              {footer}
            </View>
          )}
        </Animated.View>
      </View>
    </RNModal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  cover: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  sheet: { width: '100%', overflow: 'hidden' },
  fill: { flex: 1 },
  grow: { flexGrow: 1 },
  handleArea: { alignItems: 'center', paddingTop: 8, paddingBottom: 8 },
  handle: { width: 36, height: 4, borderRadius: 2 },
})
