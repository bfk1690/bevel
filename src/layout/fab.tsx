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
import { leadingSide, trailingSide } from '../theme/direction'
import { shouldHideOnScroll, transitionDuration, useReducedMotion } from '../utils/motion'
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
  /**
   * `end` is the thumb's corner and mirrors in a right-to-left layout, which
   * is what a floating button is expected to do. `left` and `right` are the
   * escape hatch for a layout that must not move.
   */
  position?: 'start' | 'end' | 'center' | 'left' | 'right'
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
  position = 'end',
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
  const reducedMotion = useReducedMotion()
  const { y } = useScrollOffset()

  const diameter = size === 'lg' ? 64 : 56
  const bottom = (respectSafeArea ? insets.bottom : 0) + offset
  const background = resolveColor(colors, tone, colors.accent)
  const foreground = resolveColor(colors, fg, colors.onAccent)

  /**
   * Hidden or shown, and nothing in between.
   *
   * This used to map the scroll offset straight onto the travel with
   * `diffClamp`, which needs no direction tracking and stays on the native
   * driver - and which is wrong the moment a finger stops moving. The button
   * was left standing half off the bottom of the screen, cut in two by the
   * edge, and it grew and shrank there as the label collapsed beside it.
   *
   * So the direction IS read in JavaScript now, and the answer is a decision
   * rather than a fraction. The listener runs while a list scrolls, which is
   * the price; the animation it starts still runs natively.
   */
  const hide = useRef(new Animated.Value(0)).current
  const hidden = useRef(false)
  const lastOffset = useRef(0)

  useEffect(() => {
    if (!hideOnScroll) return

    const id = y.addListener(({ value }) => {
      const next = shouldHideOnScroll({
        offset: value,
        delta: value - lastOffset.current,
        hidden: hidden.current,
        // Nothing to get out of the way of until the list has moved by more
        // than the button's own height
        minOffset: diameter,
      })
      lastOffset.current = value

      if (next === hidden.current) return
      hidden.current = next
      Animated.timing(hide, {
        toValue: next ? 1 : 0,
        duration: transitionDuration(200, reducedMotion),
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start()
    })

    return () => y.removeListener(id)
  }, [diameter, hide, hideOnScroll, reducedMotion, y])

  const travel = useMemo(
    () =>
      hide.interpolate({
        inputRange: [0, 1],
        outputRange: [0, diameter + bottom],
      }),
    [bottom, diameter, hide],
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
      toValue: collapsed ? 0 : labelWidth + LABEL_GAP,
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
      // The first measurement is taken, not animated to: a button that grew
      // into its own label on mount would read as something arriving
      if (previous === 0 && !collapsed) width.setValue(measured + LABEL_GAP)
      return measured
    })
  }

  // Built as one object rather than layered: a later `left: undefined` in a
  // style array overwrites an earlier `left: 0` instead of deferring to it,
  // which is how a centred button ends up pinned to the right
  const side =
    position === 'start'
      ? leadingSide()
      : position === 'end'
        ? trailingSide()
        : position

  // The sensor housing takes about 59pt a side in landscape, and a button
  // pinned to the raw edge sits under it
  const placement: ViewStyle =
    side === 'center'
      ? { left: insets.left, right: insets.right, alignItems: 'center' }
      : { [side]: inset + Math.max(0, side === 'left' ? insets.left : insets.right) }

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.root,
        placement,
        {
          bottom,
          transform: hideOnScroll ? [{ translateY: travel }] : undefined,
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
          <>
            {/*
              Measured off to one side, and this time really off-flow.

              It used to be measured inside the clip - a box whose width this
              very measurement decides. On the first frame that box is zero
              wide, so the figure it reported was the label squeezed into
              nothing rather than the label at its natural size, and the pill
              was built around a wrong number for the rest of its life.
            */}
            <Text
              variant="label"
              numberOfLines={1}
              onLayout={onLabelLayout}
              importantForAccessibility="no"
              accessibilityElementsHidden
              style={styles.measure}>
              {label}
            </Text>

            <Animated.View style={[styles.labelClip, { width }]}>
              {/* Fixed at its measured width, so collapsing clips it rather
                  than re-wrapping it into an ellipsis on the way */}
              <Text
                variant="label"
                numberOfLines={1}
                style={{ width: labelWidth, marginStart: LABEL_GAP, color: foreground }}>
                {label}
              </Text>
            </Animated.View>
          </>
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

/** Between the icon and the label. Inside the animated width, so it closes too */
const LABEL_GAP = 8
/** How long the screen must be still before an extended button takes its label back */
const REST_DELAY = 220

const styles = StyleSheet.create({
  root: { position: 'absolute' },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  labelClip: { overflow: 'hidden' },
  // Off the layout entirely, and invisible. Only its reported width is wanted
  measure: { position: 'absolute', opacity: 0 },
  plus: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
})

export const Fab = memo(FabBase)
