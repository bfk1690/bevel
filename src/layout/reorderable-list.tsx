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
import { useScrollOffset } from './scroll-context'
import { moveItem, slotShift, targetIndex } from '../utils/reorder'

/** What a row needs to start a drag. Spread onto a handle, or onto the row */
export type DragHandle = {
  onStartShouldSetResponder: () => boolean
  onResponderGrant: (event: GestureResponderEvent) => void
  onResponderMove: (event: GestureResponderEvent) => void
  onResponderRelease: (event: GestureResponderEvent) => void
  onResponderTerminate: () => void
  /**
   * Refuses to hand the gesture back.
   *
   * Without this a list inside a scroll view cannot be dragged AT ALL: the
   * grip takes the touch, the finger moves vertically, the scroll view asks
   * for the responder, and the default answer is yes - so the row is dropped
   * and the page scrolls instead.
   */
  onResponderTerminationRequest: () => boolean
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
  /**
   * Told when a drag starts and stops.
   *
   * Inside a `Screen` the page is held still on its own. These are for a list
   * in somebody else's scroll view, which has to be told to stop scrolling the
   * same way - see the note on the component.
   */
  onDragStart?: (index: number) => void
  onDragEnd?: (from: number, to: number) => void
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
 * Spread the WHOLE handle. It includes a refusal to give the gesture back,
 * without which a list inside a scroll view cannot be dragged at all: the grip
 * takes the touch, the finger moves, the scroll view asks for the responder,
 * and the default answer is yes.
 *
 * That refusal keeps the ROW, but it does not stop the page. On iOS the scroll
 * view's recogniser is native and runs beside the JavaScript responder system
 * rather than under it, so without more the row follows the finger and the
 * page scrolls behind it at the same time. Inside a `Screen` this list holds
 * the page still for the length of the drag, through the scroll context. In
 * somebody else's scroll view, use `onDragStart` and `onDragEnd` to set
 * `scrollEnabled` yourself - there is no way to reach a scroll view this
 * component was not told about.
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
  onDragStart,
  onDragEnd,
  style,
}: ReorderableListProps<T>) {
  const { colors } = useTheme()
  const reducedMotion = useReducedMotion()
  const { setScrollEnabled } = useScrollOffset()

  const [dragging, setDragging] = useState<number | null>(null)
  const [target, setTarget] = useState<number | null>(null)

  /** Where the finger was when the drag began, in window coordinates */
  const origin = useRef(0)
  /** How far the dragged row has come, mirrored because an animated value cannot be read back */
  const travelled = useRef(0)
  /** Whether OUR hold on the page is outstanding, so it is released exactly once */
  const holding = useRef(false)

  const hold = useCallback(
    (wanted: boolean) => {
      if (holding.current === wanted) return
      holding.current = wanted
      setScrollEnabled(!wanted)
    },
    [setScrollEnabled],
  )

  // A list unmounted mid-drag - a route change, a filter applied - would
  // otherwise leave the page unable to scroll for the rest of its life
  useEffect(() => () => hold(false), [hold])

  /**
   * One animated value per row, used for BOTH jobs: the slide that opens the
   * gap, and the drag itself.
   *
   * Two values - one native-driven for the slide, one JS-driven for the drag -
   * was the obvious shape and it does not work. A row alternates between the
   * two, and a view whose transform swaps between a native-driven value and a
   * JS-driven one keeps the node it was given and stops moving.
   *
   * So: one value, and every animation on it stays in JavaScript. The drag is
   * already setting a value per frame from JS; a handful of 160ms slides
   * alongside it costs nothing worth the ambiguity.
   */
  const offsets = useRef(new Map<string, Animated.Value>()).current
  const offsetFor = useCallback(
    (key: string) => {
      const existing = offsets.get(key)
      if (existing) return existing
      const created = new Animated.Value(0)
      offsets.set(key, created)
      return created
    },
    [offsets],
  )

  const rows = useMemo(
    () => data.map((item, index) => ({ item, index, key: keyExtractor(item, index) })),
    [data, keyExtractor],
  )

  // Rows that have left take their value with them, or the map grows for the
  // life of the screen
  useEffect(() => {
    const alive = new Set(rows.map((row) => row.key))
    for (const key of [...offsets.keys()]) {
      if (!alive.has(key)) offsets.delete(key)
    }
  }, [offsets, rows])

  useEffect(() => {
    const duration = transitionDuration(SHIFT_MS, reducedMotion)
    for (const row of rows) {
      // The dragged row is driven by the finger, not by this
      if (row.index === dragging) continue
      Animated.timing(offsetFor(row.key), {
        toValue:
          dragging != null && target != null ? slotShift(row.index, dragging, target, itemHeight) : 0,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start()
    }
  }, [dragging, itemHeight, offsetFor, reducedMotion, rows, target])

  const finish = useCallback(
    (from: number, to: number) => {
      setDragging(null)
      setTarget(null)
      travelled.current = 0
      hold(false)
      onDragEnd?.(from, to)

      // Every row goes back to no offset HERE, before the reorder lands.
      // Left to the effect, the rows would take their drag-time offsets into
      // the new layout for a frame and then fly home from the wrong place
      for (const value of offsets.values()) value.setValue(0)

      // No spring back either: the row is already over the slot it earned, and
      // the reorder puts it there for real in the same commit
      if (from !== to) onReorder(moveItem(data, from, to), from, to)
    },
    [data, hold, offsets, onDragEnd, onReorder],
  )

  const handleFor = useCallback(
    (index: number, key: string): DragHandle => ({
      onStartShouldSetResponder: () => true,
      onResponderGrant: (event) => {
        // Captured here rather than sniffed for on the first move: a finger
        // can legitimately land at zero, and a sentinel would eat that drag
        origin.current = event.nativeEvent.pageY
        travelled.current = 0
        offsetFor(key).setValue(0)
        // Before anything moves: a scroll that has already begun is not
        // cancelled by turning scrolling off
        hold(true)
        onDragStart?.(index)
        setDragging(index)
        setTarget(index)
      },
      onResponderMove: (event) => {
        // Measured against where the finger STARTED, because the row itself is
        // moving underneath it
        const travel = event.nativeEvent.pageY - origin.current
        travelled.current = travel
        offsetFor(key).setValue(travel)
        setTarget(targetIndex(index, travel, itemHeight, data.length))
      },
      onResponderRelease: () => {
        finish(index, targetIndex(index, travelled.current, itemHeight, data.length))
      },
      onResponderTerminate: () => finish(index, index),
      onResponderTerminationRequest: () => false,
    }),
    [data.length, finish, hold, itemHeight, offsetFor, onDragStart],
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
                // The same value either way, so the view never swaps the node
                // its transform is bound to
                transform: isDragging
                  ? [{ translateY: offsetFor(key) }, { scale: liftScale }]
                  : [{ translateY: offsetFor(key) }],
                ...(isDragging ? shadowStyle('float', colors.media) : null),
              },
            ]}>
            {renderItem(item, { index, dragging: isDragging, handle: handleFor(index, key) })}
          </Animated.View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { position: 'absolute', left: 0, right: 0 },
})
