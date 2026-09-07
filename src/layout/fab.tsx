import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { Text } from '../primitives/text'
import { resolveColor } from '../theme/color'
import { useInsets, useTheme } from '../theme/provider'
import { shadow as shadowStyle } from '../theme/shadow'
import type { ColorInput } from '../theme/types'
import { useScrollOffset } from './scroll-context'

export type FabProps = {
  onPress: () => void
  /** Defaults to a drawn plus */
  icon?: ReactNode
  /** Turns the circle into a pill. Say what it does, not what it is */
  label?: string
  /** Required when there is no label */
  accessibilityLabel?: string
  position?: 'left' | 'right' | 'center'
  /** Distance from the bottom safe area */
  offset?: number
  /** Distance from the side. Ignored when centred */
  inset?: number
  /**
   * Adds the bottom safe area to the offset, so it clears the home indicator.
   *
   * On by default, and worth turning off only when the button is placed inside
   * a box of its own rather than over a screen - there the safe area belongs
   * to something else.
   */
  respectSafeArea?: boolean
  size?: 'md' | 'lg'
  tone?: ColorInput
  fg?: ColorInput
  /**
   * Drops out of the way while the screen scrolls down, and comes back as soon
   * as it scrolls up. Needs a `Screen` above it to hear about the scrolling.
   *
   * Worth it on a long list, where the button covers a row the whole way down.
   * Not worth it on a short one, where it just flickers.
   */
  hideOnScroll?: boolean
  /** Sheds the label while scrolling and takes it back at rest */
  collapseOnScroll?: boolean
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

/**
 * The one action a screen is really for.
 *
 * Floats over the content, which means it also COVERS some: on a long list it
 * should get out of the way, which is what `hideOnScroll` is for. One per
 * screen - two floating buttons is a toolbar that has escaped.
 */
function FabBase({
  onPress,
  icon,
  label,
  accessibilityLabel,
  position = 'right',
  offset = 16,
  inset = 16,
  size = 'md',
  tone = 'accent',
  fg = 'onAccent',
  respectSafeArea = true,
  hideOnScroll = false,
  collapseOnScroll = false,
  disabled = false,
  style,
}: FabProps) {
  const { colors, space } = useTheme()
  const insets = useInsets()
  const { y } = useScrollOffset()

  const diameter = size === 'lg' ? 64 : 56
  const bottom = (respectSafeArea ? insets.bottom : 0) + offset
  const background = resolveColor(colors, tone, colors.accent)
  const foreground = resolveColor(colors, fg, colors.onAccent)

  /**
   * `diffClamp` grows while the screen scrolls down and shrinks the moment it
   * scrolls back, which is the whole behaviour - no direction tracking in
   * JavaScript, and it stays on the native driver.
   */
  const hide = useMemo(
    () =>
      Animated.diffClamp(y, 0, HIDE_DISTANCE).interpolate({
        inputRange: [0, HIDE_DISTANCE],
        outputRange: [0, diameter + bottom],
        extrapolate: 'clamp',
      }),
    [bottom, diameter, y],
  )

  const [labelWidth, setLabelWidth] = useState(0)
  const [collapsed, setCollapsed] = useState(false)
  /**
   * The label's width, animated in JavaScript.
   *
   * The one place in the kit that animates a layout property, and deliberate:
   * scaling instead would stretch the pill's corners and the text with them.
   * It is a single node with one child, at rest most of the time - the cost is
   * one layout pass per frame on a button, not on a list.
   */
  const width = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (label == null) return
    Animated.timing(width, {
      toValue: collapsed ? 0 : labelWidth,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()
  }, [collapsed, label, labelWidth, width])

  useEffect(() => {
    if (!collapseOnScroll || label == null) return

    let timer: ReturnType<typeof setTimeout> | undefined
    const subscription = y.addListener(() => {
      setCollapsed(true)
      if (timer != null) clearTimeout(timer)
      // Taken back once the screen has been still for a moment, rather than on
      // a scroll-end event: momentum, a bounce and a finger held still are all
      // "stopped" as far as the reader is concerned
      timer = setTimeout(() => setCollapsed(false), REST_DELAY)
    })

    return () => {
      y.removeListener(subscription)
      if (timer != null) clearTimeout(timer)
    }
  }, [collapseOnScroll, label, y])

  const onLabelLayout = (event: LayoutChangeEvent) => {
    const measured = event.nativeEvent.layout.width
    setLabelWidth((previous) => {
      if (previous === measured) return previous
      if (previous === 0) width.setValue(measured)
      return measured
    })
  }

  // Built as one object rather than layered: a later `left: undefined` in a
  // style array overwrites an earlier `left: 0` instead of deferring to it,
  // which is how a centred button ends up pinned to the right
  const placement: ViewStyle =
    position === 'center'
      ? { left: 0, right: 0, alignItems: 'center' }
      : position === 'left'
        ? { left: inset }
        : { right: inset }

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.root,
        placement,
        {
          bottom,
          transform: hideOnScroll ? [{ translateY: hide }] : undefined,
        },
        style,
      ]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled }}
        style={({ pressed }) => [
          styles.button,
          {
            height: diameter,
            minWidth: diameter,
            borderRadius: diameter / 2,
            paddingHorizontal: label == null ? 0 : space(4),
            backgroundColor: background,
            opacity: disabled ? 0.5 : pressed ? 0.88 : 1,
            transform: [{ scale: pressed ? 0.96 : 1 }],
            ...shadowStyle('float', colors.media),
          },
        ]}>
        {icon ?? <Plus color={foreground} />}

        {label != null && (
          <Animated.View style={[styles.labelClip, { width }]}>
            {/* Measured off-flow at its natural width, so the animation has a
                figure to move towards rather than a guess */}
            <View style={styles.measure} onLayout={onLabelLayout}>
              <Text variant="label" numberOfLines={1} style={{ color: foreground }}>
                {label}
              </Text>
            </View>
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  )
}

/** Plus, drawn rather than imported, so the kit works before an icon set does */
function Plus({ color }: { color: string }) {
  return (
    <View style={styles.plus}>
      <View style={{ position: 'absolute', width: 18, height: 2, backgroundColor: color }} />
      <View style={{ position: 'absolute', width: 2, height: 18, backgroundColor: color }} />
    </View>
  )
}

/** How far the screen must scroll for the button to be fully out of the way */
const HIDE_DISTANCE = 90
/** How long the screen must be still before an extended button takes its label back */
const REST_DELAY = 220

const styles = StyleSheet.create({
  root: { position: 'absolute' },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  labelClip: { overflow: 'hidden' },
  measure: { paddingLeft: 8 },
  plus: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
})

export const Fab = memo(FabBase)
