import { createContext, useContext } from 'react'
import { Animated } from 'react-native'

export type ScrollOffset = {
  /** Distance scrolled, driven natively by the screen that owns the list */
  y: Animated.Value
}

/**
 * How far the screen has scrolled, shared with whatever is drawn over it.
 *
 * A header cannot measure this itself: the scroll view belongs to the screen,
 * and the header is handed to it as a prop. Passing the value down through
 * context is what lets a header react without the app wiring an animated value
 * through by hand every time.
 *
 * The default is a still value, so a header used outside a screen simply does
 * not move rather than crashing.
 */
export const ScrollContext = createContext<ScrollOffset>({ y: new Animated.Value(0) })

export function useScrollOffset(): ScrollOffset {
  return useContext(ScrollContext)
}
