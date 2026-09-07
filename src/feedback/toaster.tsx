import { useEffect, useMemo, useRef, useSyncExternalStore, type ReactNode } from 'react'
import {
  ActivityIndicator,
  Animated,
  Easing,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { Text } from '../primitives/text'
import { alpha, resolveColor } from '../theme/color'
import { useInsets, useTheme } from '../theme/provider'
import { shadow as shadowStyle } from '../theme/shadow'
import type { ColorInput } from '../theme/types'
import { dismissToast, toastStore, type ToastItem, type ToastTone } from './toast-store'

export type ToasterProps = {
  position?: 'top' | 'bottom'
  /** Extra offset from the safe area edge */
  offset?: number
  /** Called instead of the built-in card when you want your own presentation */
  renderToast?: (item: ToastItem) => ReactNode
  style?: StyleProp<ViewStyle>
}

const TONE_COLOR: Record<ToastTone, ColorInput> = {
  success: 'ok',
  error: 'danger',
  warning: 'warning',
  info: 'accent',
  loading: 'textMuted',
  default: 'text',
}

/**
 * On iOS a native modal lives in its own window, so a toast rendered inside
 * the app window is hidden behind it. An app that has react-native-screens can
 * pass `FullWindowOverlay` as `renderOverlay` on the provider to lift it out.
 */
function Overlay({ children }: { children: ReactNode }) {
  const { renderOverlay } = useTheme()
  if (Platform.OS === 'ios' && renderOverlay) return <>{renderOverlay({ children })}</>
  return <>{children}</>
}

/**
 * Mount once, near the root and inside the theme provider.
 *
 * One toast is visible at a time and the newest wins. Stacking them competes
 * for the same corner of the screen and the user reads none of them; queueing
 * them delays the message that actually matters.
 */
export function Toaster({ position = 'top', offset, renderToast, style }: ToasterProps) {
  const { colors, space, radius, sizes } = useTheme()
  const insets = useInsets()
  const { current: item } = useSyncExternalStore(
    toastStore.subscribe,
    toastStore.getSnapshot,
    toastStore.getSnapshot,
  )
  /** Read inside the gesture, which is created once and outlives any one toast */
  const itemRef = useRef(item)
  itemRef.current = item

  const progress = useRef(new Animated.Value(0)).current
  const enter = useRef(new Animated.Value(0)).current
  /** How far the finger has pushed the toast away from its resting place */
  const drag = useRef(new Animated.Value(0)).current

  /** The toast the entrance last played for, so an update does not replay it */
  const entered = useRef<string | null>(null)

  useEffect(() => {
    if (!item) {
      entered.current = null
      return
    }

    // An updated toast keeps its place: replaying the entrance would make one
    // finished job look like two separate events.
    const isNew = entered.current !== item.id
    entered.current = item.id

    if (isNew) {
      enter.setValue(0)
      drag.setValue(0)
    }
    progress.setValue(1)

    const animation = Animated.timing(enter, {
      toValue: 1,
      duration: isNew ? 220 : 0,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    })
    animation.start()

    if (item.duration <= 0) return () => animation.stop()

    // The countdown is drawn with scaleX rather than width so it can run on the
    // native driver alongside the entrance animation.
    const countdown = Animated.timing(progress, {
      toValue: 0,
      duration: item.duration,
      easing: Easing.linear,
      useNativeDriver: true,
    })
    countdown.start()

    const timer = setTimeout(() => dismissToast(item.id), item.duration)
    return () => {
      animation.stop()
      countdown.stop()
      clearTimeout(timer)
    }
  }, [drag, enter, item, progress])

  const travel = position === 'top' ? -24 : 24
  /** The direction that takes the toast off screen, given where it sits */
  const away = position === 'top' ? -1 : 1

  /**
   * Swipe to dismiss.
   *
   * A toast that can only be waited out is an obstruction, and the tap target
   * is small when it lands over a header. Pushing it back the way it came is
   * the gesture people already try.
   */
  const swipe = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dy) > 4,
        onPanResponderMove: (_event, gesture) => {
          // Dragging the other way is resisted rather than blocked, so the
          // toast still feels attached to the finger.
          const resisted = gesture.dy * away > 0 ? gesture.dy : gesture.dy * 0.25
          drag.setValue(resisted)
        },
        onPanResponderRelease: (_event, gesture) => {
          if (gesture.dy * away > 44) {
            const id = itemRef.current?.id
            Animated.timing(enter, {
              toValue: 0,
              duration: 140,
              easing: Easing.in(Easing.cubic),
              useNativeDriver: true,
            }).start(() => dismissToast(id))
            return
          }
          Animated.spring(drag, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start()
        },
      }),
    [away, drag, enter],
  )

  const animatedStyle = useMemo(
    () => ({
      opacity: enter,
      transform: [
        {
          translateY: Animated.add(
            enter.interpolate({ inputRange: [0, 1], outputRange: [travel, 0] }),
            drag,
          ),
        },
      ],
    }),
    [drag, enter, travel],
  )

  if (!item) return null

  const tint = resolveColor(colors, item.tint ?? TONE_COLOR[item.tone], colors.text)
  const edge = position === 'top' ? insets.top : insets.bottom
  const gap = offset ?? space(2)

  return (
    <Overlay>
      <View
        pointerEvents="box-none"
        style={[
          styles.container,
          position === 'top' ? { top: edge + gap } : { bottom: edge + gap },
          { paddingHorizontal: space(3) },
          style,
        ]}>
        <Animated.View style={animatedStyle} {...swipe.panHandlers}>
          {renderToast ? (
            renderToast(item)
          ) : (
            <Pressable
              onPress={item.tone === 'loading' ? undefined : () => dismissToast(item.id)}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              style={[
                styles.card,
                {
                  backgroundColor: colors.sheet,
                  borderRadius: radius.md,
                  borderColor: alpha(tint, 0.45),
                  paddingHorizontal: space(3),
                  paddingVertical: space(2.5),
                  gap: space(2),
                  ...shadowStyle('toast', colors.media),
                },
              ]}>
              {item.tone === 'loading' ? (
                <ActivityIndicator color={tint} size="small" />
              ) : (
                <View style={[styles.dot, { backgroundColor: tint }]} />
              )}

              <View style={styles.body}>
                {item.title != null && (
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {item.title}
                  </Text>
                )}
                <Text variant="caption" color="textMuted" numberOfLines={3}>
                  {item.message}
                </Text>
              </View>

              {item.action && (
                <Pressable
                  onPress={() => {
                    item.action?.onPress()
                    dismissToast(item.id)
                  }}
                  hitSlop={sizes.hitSlop}>
                  <Text variant="label" style={{ color: tint }}>
                    {item.action.label}
                  </Text>
                </Pressable>
              )}

              {item.duration > 0 && (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.progress,
                    {
                      backgroundColor: tint,
                      borderBottomLeftRadius: radius.md,
                      borderBottomRightRadius: radius.md,
                      transform: [{ scaleX: progress }],
                    },
                  ]}
                />
              )}
            </Pressable>
          )}
        </Animated.View>
      </View>
    </Overlay>
  )
}

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 0, right: 0 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  body: { flex: 1, gap: 2 },
  progress: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    // Scaling from the left edge makes the bar drain instead of shrinking
    // towards its centre.
    transformOrigin: 'left',
  },
})
