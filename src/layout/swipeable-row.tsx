import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { Text } from '../primitives/text'
import { resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import type { ColorInput } from '../theme/types'
import { isFullSwipe, resistPast, resolveSwipeSnap, swipeTravel, type SwipeSide } from '../utils/swipe'

export type SwipeAction = {
  key: string
  label: string
  onPress: () => void
  tone?: ColorInput
  /** Mark above the label */
  icon?: ReactNode
  /** Closes the row before running. On by default */
  closeOnPress?: boolean
}

export type SwipeableRowProps = {
  children: ReactNode
  actions: readonly SwipeAction[]
  /** Which edge the actions come from. Defaults to the right */
  side?: SwipeSide
  /** Width of each action. Defaults to 80 */
  actionWidth?: number
  /**
   * Lets a long drag run the edge action outright, without letting go first.
   *
   * Worth turning on when one action is the obvious one - deleting a message,
   * clearing a notification - and worth leaving off when they are equals, since
   * it quietly promotes whichever happens to sit at the edge.
   */
  fullSwipe?: boolean
  /** How much of the row must be crossed for that. Defaults to half */
  fullSwipeRatio?: number
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
  /** Behind the row while it is moving. Defaults to the screen's own surface */
  bg?: ColorInput
  style?: StyleProp<ViewStyle>
}

/**
 * A row that slides aside to show what can be done to it.
 *
 * The actions sit BEHIND the row rather than pushing it: the row keeps its
 * place in the list and simply moves off what is underneath, which is why a
 * half-open row still reads as one row rather than two columns.
 *
 * Where it lands when the finger lifts is decided in `utils/swipe` and tested
 * there - those are feel decisions, and nobody can review a number that was
 * tuned until the complaints stopped.
 */
export function SwipeableRow({
  children,
  actions,
  side = 'right',
  actionWidth = 80,
  fullSwipe = false,
  fullSwipeRatio = 0.5,
  onOpenChange,
  disabled = false,
  bg = 'canvas',
  style,
}: SwipeableRowProps) {
  const { colors, space } = useTheme()
  const openWidth = actions.length * actionWidth

  /** The edge-most action, which is the one a full swipe runs */
  const primary = side === 'right' ? actions[actions.length - 1] : actions[0]

  const translate = useRef(new Animated.Value(0)).current
  const [open, setOpen] = useState(false)
  const openRef = useRef(false)
  const width = useRef(0)

  const settle = useCallback(
    (next: boolean) => {
      openRef.current = next
      setOpen(next)
      onOpenChange?.(next)
      Animated.timing(translate, {
        toValue: next ? (side === 'right' ? -openWidth : openWidth) : 0,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start()
    },
    [onOpenChange, openWidth, side, translate],
  )

  /** Sends the row off the edge, then puts it back where it started */
  const complete = useCallback(
    (action: SwipeAction) => {
      openRef.current = false
      setOpen(false)
      onOpenChange?.(false)
      Animated.timing(translate, {
        toValue: side === 'right' ? -width.current : width.current,
        duration: 160,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        // Reset before the callback: rows usually disappear at this point, and
        // one that survives should not come back already open
        translate.setValue(0)
        action.onPress()
      })
    },
    [onOpenChange, side, translate],
  )

  const responder = useMemo(
    () =>
      PanResponder.create({
        // Only a sideways drag: claiming a vertical one would stop the list
        // from scrolling
        onMoveShouldSetPanResponder: (_event, gesture) =>
          !disabled &&
          openWidth > 0 &&
          Math.abs(gesture.dx) > 8 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
        onPanResponderMove: (_event, gesture) => {
          const from = openRef.current ? (side === 'right' ? -openWidth : openWidth) : 0
          const raw = from + gesture.dx
          // A full swipe has to be able to cross the row, so the point it is
          // slowed past moves out to the row's own edge
          const limit = fullSwipe ? width.current : openWidth
          translate.setValue(side === 'right' ? resistPast(raw, limit) : -resistPast(-raw, limit))
        },
        onPanResponderRelease: (_event, gesture) => {
          const from = openRef.current ? (side === 'right' ? -openWidth : openWidth) : 0
          const offset = from + gesture.dx

          if (
            fullSwipe &&
            primary != null &&
            isFullSwipe(swipeTravel(offset, side), width.current, fullSwipeRatio)
          ) {
            complete(primary)
            return
          }

          settle(
            resolveSwipeSnap({
              offset,
              velocity: gesture.vx,
              openWidth,
              wasOpen: openRef.current,
              side,
            }),
          )
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [complete, disabled, fullSwipe, fullSwipeRatio, openWidth, primary, settle, side, translate],
  )

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    width.current = event.nativeEvent.layout.width
  }, [])

  const edgeTone = resolveColor(colors, primary?.tone ?? 'danger', colors.danger)

  return (
    <View style={[styles.root, style]} onLayout={onLayout}>
      <View
        style={[
          styles.actions,
          side === 'right' ? styles.right : styles.left,
          // Full width rather than the actions' width, so a full swipe reveals
          // the edge action's colour all the way across instead of a gap
          fullSwipe && { backgroundColor: edgeTone },
        ]}
        // Reachable only once the row has moved: a screen reader gets to them
        // through the row's own accessibility actions instead
        importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
        accessibilityElementsHidden={!open}>
        {actions.map((action) => (
          <Pressable
            key={action.key}
            onPress={() => {
              if (action.closeOnPress !== false) settle(false)
              action.onPress()
            }}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            style={({ pressed }) => [
              styles.action,
              {
                width: actionWidth,
                gap: space(1),
                backgroundColor: resolveColor(colors, action.tone ?? 'danger', colors.danger),
                opacity: pressed ? 0.75 : 1,
              },
            ]}>
            {action.icon}
            <Text variant="micro" numberOfLines={1} style={{ color: colors.onAccent }}>
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Animated.View
        {...responder.panHandlers}
        accessibilityActions={actions.map((action) => ({
          name: action.key,
          label: action.label,
        }))}
        onAccessibilityAction={(event) => {
          actions.find((action) => action.key === event.nativeEvent.actionName)?.onPress()
        }}
        style={[
          styles.surface,
          {
            backgroundColor: resolveColor(colors, bg, colors.canvas),
            transform: [{ translateX: translate }],
          },
        ]}>
        {children}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { overflow: 'hidden' },
  actions: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, flexDirection: 'row' },
  right: { justifyContent: 'flex-end' },
  left: { justifyContent: 'flex-start' },
  action: { alignItems: 'center', justifyContent: 'center' },
  surface: { width: '100%' },
})
