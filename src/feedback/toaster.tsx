import { useEffect, useMemo, useRef, useSyncExternalStore, type ReactNode } from 'react'
import {
  ActivityIndicator,
  Animated,
  Easing,
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

  const progress = useRef(new Animated.Value(0)).current
  const enter = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!item) return

    enter.setValue(0)
    progress.setValue(1)

    const animation = Animated.timing(enter, {
      toValue: 1,
      duration: 220,
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
  }, [enter, item, progress])

  const travel = position === 'top' ? -24 : 24

  const animatedStyle = useMemo(
    () => ({
      opacity: enter,
      transform: [
        {
          translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [travel, 0] }),
        },
      ],
    }),
    [enter, travel],
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
        <Animated.View style={animatedStyle}>
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
