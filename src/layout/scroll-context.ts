import { createContext, useContext } from 'react'
import { Animated } from 'react-native'

export type ScrollOffset = {
  /** Distance scrolled, driven natively by the screen that owns the list */
  y: Animated.Value
  /**
   * Sends the screen back to the top.
   *
   * The scroll view belongs to the screen, so anything drawn over it - a
   * header, a tab bar - can only ask. A no-op outside a screen, rather than a
   * missing function every caller has to check for.
   */
  scrollToTop: () => void
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
export const ScrollContext = createContext<ScrollOffset>({
  y: new Animated.Value(0),
  scrollToTop: () => {},
})

export function useScrollOffset(): ScrollOffset {
  return useContext(ScrollContext)
}

/** Just the action, for a header or a tab bar that only wants to send it home */
export function useScrollToTop(): () => void {
  return useContext(ScrollContext).scrollToTop
}
