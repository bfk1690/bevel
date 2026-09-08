import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { useTheme } from '../theme/provider'
import { shadow as shadowStyle } from '../theme/shadow'
import { transitionDuration, useReducedMotion } from '../utils/motion'
import { moveItem, slotShift, targetIndex } from '../utils/reorder'

/** What a row needs to start a drag. Spread onto a handle, or onto the row */
export type DragHandle = {
  onStartShouldSetResponder: () => boolean
  onResponderGrant: (event: GestureResponderEvent) => void
  onResponderMove: (event: GestureResponderEvent) => void
  onResponderRelease: (event: GestureResponderEvent) => void
  onResponderTerminate: () => void
}

export type ReorderableRenderState = {
  index: number
  /** True for the row under the finger */
  dragging: boolean
  handle: DragHandle
}

export type ReorderableListProps<T> = {
  data: readonly T[]
  onReorder: (next: T[], from: number, to: number) => void
  renderItem: (item: T, state: ReorderableRenderState) => ReactNode
  keyExtractor: (item: T, index: number) => string
  /**
   * Height of one row, in points.
   *
   * Required, and uniform. Rows of different heights would mean re-measuring
   * every neighbour on every frame of a drag; a list that reorders is almost
   * always a list of one repeated thing, and pretending otherwise would buy a
   * rare case at the cost of the common one.
   */
  itemHeight: number
  /** Lifted while dragging, so the row reads as picked up */
  liftScale?: number
  style?: StyleProp<ViewStyle>
}

/** How long a displaced row takes to slide out of the way */
const SHIFT_MS = 160

/**
 * A list whose order is the point.
 *
 * The gap opens DURING the drag rather than on release: a list that rearranges
 * only once the finger lifts asks the reader to hold a prediction in their
 * head, when it could show them the answer instead.
 *
 * The drag is started by whatever the row gives `handle` to. A grip on the
 * side is the usual choice and the safest - handing it to the whole row means
 * a list that cannot be scrolled, because the first touch always becomes a
 * drag.
 *
 * Everything given to it is rendered, which is right for the length of list
 * anybody actually reorders by hand.
 */
export function ReorderableList<T>({
  data,
  onReorder,
  renderItem,
  keyExtractor,
  itemHeight,
  liftScale = 1.03,
  style,
}: ReorderableListProps<T>) {
  const { colors } = useTheme()
  const reducedMotion = useReducedMotion()

  const [dragging, setDragging] = useState<number | null>(null)
  const [target, setTarget] = useState<number | null>(null)

  /** Where the finger was when the drag began, in window coordinates */
  const origin = useRef(0)
  /** How far the dragged row has come, mirrored because a native value cannot be read back */
  const travelled = useRef(0)
  const lift = useRef(new Animated.Value(0)).current

  /**
   * One animated value per row, so a displaced row SLIDES out of the way.
   *
   * Setting the offset straight onto the style would move it between two
   * frames, which is the jump this component exists to avoid.
   */
  const shifts = useRef(new Map<string, Animated.Value>()).current
  const shiftFor = useCallback(
    (key: string) => {
      const existing = shifts.get(key)
      if (existing) return existing
      const created = new Animated.Value(0)
      shifts.set(key, created)
      return created
    },
    [shifts],
  )

  const rows = useMemo(
    () => data.map((item, index) => ({ item, index, key: keyExtractor(item, index) })),
    [data, keyExtractor],
  )

  // Rows that have left take their value with them, or the map grows for the
  // life of the screen
  useEffect(() => {
    const alive = new Set(rows.map((row) => row.key))
    for (const key of [...shifts.keys()]) {
      if (!alive.has(key)) shifts.delete(key)
    }
  }, [rows, shifts])

  useEffect(() => {
    const duration = transitionDuration(SHIFT_MS, reducedMotion)
    for (const row of rows) {
      const to =
        dragging != null && target != null ? slotShift(row.index, dragging, target, itemHeight) : 0
      Animated.timing(shiftFor(row.key), {
        toValue: row.index === dragging ? 0 : to,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start()
    }
  }, [dragging, itemHeight, reducedMotion, rows, shiftFor, target])

  const finish = useCallback(
    (from: number, to: number) => {
      setDragging(null)
      setTarget(null)
      travelled.current = 0
      // No spring back: the row is already over the slot it earned, and the
      // reorder below puts it there for real in the same commit
      lift.setValue(0)
      if (from !== to) onReorder(moveItem(data, from, to), from, to)
    },
    [data, lift, onReorder],
  )

  const handleFor = useCallback(
    (index: number): DragHandle => ({
      onStartShouldSetResponder: () => true,
      onResponderGrant: (event) => {
        // Captured here rather than sniffed for on the first move: a finger
        // can legitimately land at zero, and a sentinel would eat that drag
        origin.current = event.nativeEvent.pageY
        travelled.current = 0
        lift.setValue(0)
        setDragging(index)
        setTarget(index)
      },
      onResponderMove: (event) => {
        // Measured against where the finger STARTED, because the row itself is
        // moving underneath it
        const travel = event.nativeEvent.pageY - origin.current
        travelled.current = travel
        lift.setValue(travel)
        setTarget(targetIndex(index, travel, itemHeight, data.length))
      },
      onResponderRelease: () => {
        finish(index, targetIndex(index, travelled.current, itemHeight, data.length))
      },
      onResponderTerminate: () => finish(index, index),
    }),
    [data.length, finish, itemHeight, lift],
  )

  return (
    <View style={[{ height: itemHeight * data.length }, style]}>
      {rows.map(({ item, index, key }) => {
        const isDragging = dragging === index

        return (
          <Animated.View
            key={key}
            style={[
              styles.row,
              {
                top: index * itemHeight,
                height: itemHeight,
                // The dragged row rides above the rest; underneath, it would
                // slide behind its own neighbours
                zIndex: isDragging ? 2 : 1,
                transform: isDragging
                  ? [{ translateY: lift }, { scale: liftScale }]
                  : [{ translateY: shiftFor(key) }],
                ...(isDragging ? shadowStyle('float', colors.media) : null),
              },
            ]}>
            {renderItem(item, { index, dragging: isDragging, handle: handleFor(index) })}
          </Animated.View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { position: 'absolute', left: 0, right: 0 },
})
