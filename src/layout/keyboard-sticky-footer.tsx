import { useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Animated,
  Easing,
  Keyboard,
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { resolveColor } from '../theme/color'
import { footerPadding, keyboardLift } from '../utils/keyboard'
import { FooterSlotContext } from './footer-slot'
import { useInsets, useTheme } from '../theme/provider'
import type { ColorInput } from '../theme/types'

export type KeyboardStickyFooterProps = {
  children: ReactNode
  /** Extra space between the footer and the keyboard */
  offset?: number
  bg?: ColorInput | 'none'
  /** Hairline above the bar, to separate it from scrolling content */
  divider?: boolean
  padding?: number
  style?: StyleProp<ViewStyle>
}

/**
 * Action bar that rides above the keyboard.
 *
 * A footer inside a `KeyboardAvoidingView` moves with the whole screen, which
 * scrolls the field the user is typing in out of view. This one translates by
 * the keyboard's height alone and leaves the content where it is.
 *
 * The height is taken WHOLE - see `utils/keyboard`. Subtracting the safe area
 * here was wrong twice: it assumed a padding that only exists when the bar
 * stands alone, and `Screen` drops that same padding while the keyboard is up.
 * Both landed, and the bar rested a home indicator's worth behind the keys.
 *
 * iOS reports `keyboardWillShow` with the system's own duration, so the bar
 * moves in lockstep with the keyboard; Android only fires `keyboardDidShow`,
 * hence the short fixed timing there.
 */
export function KeyboardStickyFooter({
  children,
  offset = 0,
  bg = 'canvas',
  divider = true,
  padding,
  style,
}: KeyboardStickyFooterProps) {
  const { colors, space } = useTheme()
  const insets = useInsets()
  const lift = useRef(new Animated.Value(0)).current
  const [keyboardUp, setKeyboardUp] = useState(false)
  /**
   * Inside `Screen`'s footer slot the gutter and the bottom inset are already
   * applied, so adding them here would double them.
   */
  const inSlot = useContext(FooterSlotContext)

  useEffect(() => {
    /**
     * The keyboard may already be up when this mounts.
     *
     * Listeners only hear what happens NEXT, so a bar mounted with a field
     * already focused — coming back to a screen, a fast refresh, a form that
     * autofocuses — never lifted at all and sat behind the keyboard with half
     * the action unreachable. Reported from a device.
     *
     * `metrics()` answers for the keyboard that is already there. It is set
     * without animating: there is nothing to animate from, and easing in from
     * zero would read as a jump.
     */
    const open = Keyboard.metrics()
    if (open && open.height > 0) {
      lift.setValue(-keyboardLift(open.height, offset))
      setKeyboardUp(true)
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'

    const show = Keyboard.addListener(showEvent, (event) => {
      setKeyboardUp(true)
      Animated.timing(lift, {
        toValue: -keyboardLift(event.endCoordinates.height, offset),
        duration: event.duration || 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start()
    })

    const hide = Keyboard.addListener(hideEvent, (event) => {
      setKeyboardUp(false)
      Animated.timing(lift, {
        toValue: 0,
        duration: event?.duration || 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start()
    })

    return () => {
      show.remove()
      hide.remove()
    }
  }, [lift, offset])

  const backgroundColor = bg === 'none' ? 'transparent' : resolveColor(colors, bg, colors.canvas)

  return (
    <Animated.View
      style={[
        {
          transform: [{ translateY: lift }],
          backgroundColor,
          paddingHorizontal: inSlot ? (padding ?? 0) : (padding ?? space(4)),
          paddingTop: space(3),
          // The slot around it owns the safe area. Standing alone it owns it
          // itself - and gives it back while the keyboard covers that ground
          paddingBottom: inSlot ? 0 : footerPadding(keyboardUp, insets.bottom, space(3)),
          borderTopWidth: divider ? StyleSheet.hairlineWidth : 0,
          borderTopColor: colors.border,
        },
        style,
      ]}>
      <View style={styles.content}>{children}</View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  content: { gap: 8 },
})
