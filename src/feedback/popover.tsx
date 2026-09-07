import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import {
  Animated,
  Easing,
  Modal as RNModal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { resolveColor } from '../theme/color'
import { useInsets, useTheme } from '../theme/provider'
import { shadow as shadowStyle } from '../theme/shadow'
import type { ColorInput, RadiusToken } from '../theme/types'
import { resolvePlacement, type Placement, type Rect } from '../utils/placement'

export type PopoverProps = {
  visible: boolean
  onClose: () => void
  /** The view the popover points at. Measured in window coordinates */
  anchorRef: RefObject<View | null>
  children?: ReactNode
  placement?: Placement | 'auto'
  /** Gap between the anchor and the bubble */
  offset?: number
  arrow?: boolean
  maxWidth?: number
  /**
   * Dims the screen behind.
   *
   * Off by default: a popover explains the thing it points at, and dimming
   * that thing while explaining it is working against yourself.
   */
  scrim?: boolean
  dismissOnBackdrop?: boolean
  bg?: ColorInput
  radius?: RadiusToken | number
  style?: StyleProp<ViewStyle>
}

const ARROW = 8

/**
 * Anchored bubble.
 *
 * Positioning takes two passes and cannot be avoided: the anchor is measured
 * when the popover opens, and the bubble's own size is only known once it has
 * been laid out. Until both are in, it is rendered transparent rather than in
 * the wrong place - a bubble that jumps into position is worse than one that
 * arrives a frame late.
 *
 * The maths lives in `utils/placement` and is unit tested there, because the
 * cases that matter - an anchor against an edge, no room on the preferred
 * side - are ones a device only shows by accident.
 */
export function Popover({
  visible,
  onClose,
  anchorRef,
  children,
  placement = 'auto',
  offset = 8,
  arrow = true,
  maxWidth = 280,
  scrim = false,
  dismissOnBackdrop = true,
  bg = 'sheet',
  radius = 'md',
  style,
}: PopoverProps) {
  const { colors, radius: radii, space } = useTheme()
  const insets = useInsets()
  const screen = useWindowDimensions()

  const [anchor, setAnchor] = useState<Rect | null>(null)
  const [content, setContent] = useState<{ width: number; height: number } | null>(null)
  const enter = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!visible) {
      setAnchor(null)
      setContent(null)
      enter.setValue(0)
      return
    }
    // Measured on open rather than on layout: the anchor may have scrolled
    // since it was mounted, and its position at the moment of opening is the
    // only one that matters.
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height })
    })
  }, [anchorRef, enter, visible])

  const ready = anchor != null && content != null

  useEffect(() => {
    if (!ready) return
    Animated.timing(enter, {
      toValue: 1,
      duration: 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [enter, ready])

  const onContentLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout
    setContent((previous) =>
      previous && previous.width === width && previous.height === height
        ? previous
        : { width, height },
    )
  }, [])

  if (!visible) return null

  const resolved =
    anchor && content
      ? resolvePlacement({
          anchor,
          content,
          screen: { width: screen.width, height: screen.height },
          insets,
          placement,
          offset,
          margin: space(2),
          arrowSize: ARROW,
          cornerRadius: typeof radius === 'number' ? radius : (radii[radius] ?? radii.md),
        })
      : null

  const borderRadius = typeof radius === 'number' ? radius : (radii[radius] ?? radii.md)
  const surface = resolveColor(colors, bg, colors.sheet)
  const vertical = resolved?.placement === 'top' || resolved?.placement === 'bottom'

  return (
    <RNModal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root} accessibilityViewIsModal>
        <Pressable
          style={[StyleSheet.absoluteFill, scrim && { backgroundColor: colors.overlay }]}
          disabled={!dismissOnBackdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />

        <Animated.View
          onLayout={onContentLayout}
          accessibilityRole="alert"
          style={[
            styles.bubble,
            {
              maxWidth,
              left: resolved?.left ?? 0,
              top: resolved?.top ?? 0,
              borderRadius,
              backgroundColor: surface,
              borderColor: colors.border,
              padding: space(3),
              // Nothing is drawn until both measurements are in
              opacity: resolved ? enter : 0,
              transform: [
                { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
              ],
              ...shadowStyle('float', colors.media),
            },
            style,
          ]}>
          {children}
        </Animated.View>

        {arrow && resolved && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.arrow,
              {
                backgroundColor: surface,
                opacity: enter,
                // The square is rotated, so the pointing corner is the one
                // that pokes out past the bubble's edge.
                left: vertical
                  ? resolved.left + resolved.arrowOffset - ARROW
                  : resolved.placement === 'right'
                    ? resolved.left - ARROW
                    : resolved.left + (content?.width ?? 0) - ARROW,
                top: vertical
                  ? resolved.placement === 'bottom'
                    ? resolved.top - ARROW
                    : resolved.top + (content?.height ?? 0) - ARROW
                  : resolved.top + resolved.arrowOffset - ARROW,
                width: ARROW * 2,
                height: ARROW * 2,
              },
            ]}
          />
        )}
      </View>
    </RNModal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bubble: { position: 'absolute', borderWidth: StyleSheet.hairlineWidth },
  arrow: { position: 'absolute', transform: [{ rotate: '45deg' }], borderRadius: 2 },
})
