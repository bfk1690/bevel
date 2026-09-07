import { memo, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { Text } from '../primitives/text'
import { useInsets, useTheme } from '../theme/provider'
import { useKeyboardVisible } from '../utils/keyboard'

export type ModalProps = {
  visible: boolean
  onClose: () => void
  /**
   * `sheet` rises from the bottom edge, `center` floats, `full` covers the
   * screen. Sheets keep the user's place in the page behind them, which is why
   * they suit pickers and confirmations.
   */
  variant?: 'sheet' | 'center' | 'full'
  title?: string
  children?: ReactNode
  /** Pinned below the content, outside the scroll area */
  footer?: ReactNode
  /** Tapping the scrim closes. Turn off for destructive confirmations */
  dismissOnBackdrop?: boolean
  scrollable?: boolean
  /**
   * Cap for the scrolling area, as a fraction of the window.
   *
   * Without one a sheet grows with its content until it covers the page it
   * was supposed to leave in place - and with a keyboard open it grows past
   * the screen entirely.
   */
  maxHeightRatio?: number
  /** Adds keyboard avoidance - required when the modal contains a text field */
  keyboardAware?: boolean
  /** Drag affordance at the top of a sheet */
  handle?: boolean
  style?: StyleProp<ViewStyle>
}

/**
 * Timings taken from the platform's own sheet presentation: a touch slower on
 * the way in than out, easing off at the end rather than stopping flat.
 */
const IN_DURATION = 280
const OUT_DURATION = 200

function ModalBase({
  visible,
  onClose,
  variant = 'sheet',
  title,
  children,
  footer,
  dismissOnBackdrop = true,
  scrollable = false,
  maxHeightRatio = 0.6,
  keyboardAware = false,
  handle = true,
  style,
}: ModalProps) {
  const { colors, radius, space } = useTheme()
  const insets = useInsets()
  const keyboardUp = useKeyboardVisible()
  const { height: windowHeight } = useWindowDimensions()

  // While the keyboard is up it covers the home indicator, so its inset would
  // only add dead space between the keyboard and the modal's own action.
  const bottomInset = keyboardAware && keyboardUp ? 0 : insets.bottom

  /**
   * The scrim and the surface animate SEPARATELY.
   *
   * React Native's own `animationType="slide"` moves the whole modal, scrim
   * included, so the dark layer sweeps up from the bottom edge like a sheet of
   * paper. No platform does that: the scrim fades in place while only the
   * surface travels. Driving both from one value keeps them in step without
   * pretending they are the same movement.
   */
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current
  /** Stays mounted through the closing animation */
  const [mounted, setMounted] = useState(visible)
  const [surfaceHeight, setSurfaceHeight] = useState(0)

  useEffect(() => {
    if (visible) {
      setMounted(true)
      Animated.timing(progress, {
        toValue: 1,
        duration: IN_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start()
      return
    }

    Animated.timing(progress, {
      toValue: 0,
      duration: OUT_DURATION,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setMounted(false)
    })
  }, [progress, visible])

  const onSurfaceLayout = useCallback((event: LayoutChangeEvent) => {
    setSurfaceHeight(event.nativeEvent.layout.height)
  }, [])

  const surface: ViewStyle = {
    backgroundColor: variant === 'full' ? colors.canvas : colors.sheet,
    padding: space(4),
    gap: space(3),
  }

  const shape: ViewStyle =
    variant === 'sheet'
      ? {
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
          paddingBottom: bottomInset + space(4),
        }
      : variant === 'center'
        ? { borderRadius: radius.lg, marginHorizontal: space(5) }
        : { flex: 1, paddingTop: insets.top + space(2), paddingBottom: bottomInset + space(4) }

  // A sheet travels its own height, so it is fully off screen before the
  // measurement lands and never flashes in place on first open.
  const travel = surfaceHeight > 0 ? surfaceHeight : windowHeight
  const motion: Animated.WithAnimatedObject<ViewStyle> =
    variant === 'center'
      ? {
          opacity: progress,
          transform: [
            { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
          ],
        }
      : {
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [travel, 0],
              }),
            },
          ],
        }

  const body = (
    <Animated.View
      onLayout={variant === 'full' ? undefined : onSurfaceLayout}
      style={[surface, shape, motion, style]}>
      {variant === 'sheet' && handle && (
        <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />
      )}
      {title != null && <Text variant="heading">{title}</Text>}
      {scrollable ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={keyboardAware}
          style={{ maxHeight: windowHeight * maxHeightRatio }}>
          {children}
        </ScrollView>
      ) : (
        children
      )}
      {footer}
    </Animated.View>
  )

  return (
    <RNModal
      visible={mounted}
      transparent
      // The transitions are ours, so the platform must not add its own.
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View
        /**
         * Stops a screen reader wandering into the page behind. Without it the
         * content under the scrim is still reachable by swiping, which is how
         * someone ends up operating a screen they cannot see is covered.
         */
        accessibilityViewIsModal
        style={[
          styles.root,
          variant === 'sheet' && styles.bottom,
          variant === 'center' && styles.centered,
        ]}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: variant === 'full' ? colors.canvas : colors.overlay, opacity: progress },
          ]}
        />
        {variant !== 'full' && (
          // The scrim is a sibling of the surface, not its parent: nesting them
          // would make every tap inside the modal bubble out to the dismiss.
          <Pressable
            style={StyleSheet.absoluteFill}
            disabled={!dismissOnBackdrop}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />
        )}
        {keyboardAware ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={variant === 'full' ? styles.fill : undefined}>
            {body}
          </KeyboardAvoidingView>
        ) : (
          body
        )}
      </View>
    </RNModal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  bottom: { justifyContent: 'flex-end' },
  centered: { justifyContent: 'center' },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center' },
})

export const Modal = memo(ModalBase)
