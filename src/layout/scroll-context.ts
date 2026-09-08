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
  /** Absolute position, in points from the top of the content */
  scrollTo: (y: number, animated?: boolean) => void
  /**
   * Moves by a distance from wherever it is now.
   *
   * The offset is tracked in JavaScript for this, which is the only reason
   * that listener exists: a native value cannot be read back synchronously,
   * and everything else here is driven from it without ever asking what it
   * currently is.
   */
  scrollBy: (delta: number, animated?: boolean) => void
  /**
   * Holds the page still.
   *
   * For a gesture that owns the vertical axis while it runs - dragging a row
   * to a new place, most of all. Refusing to hand the responder back is not
   * enough on its own: on iOS the scroll view's recogniser is native and runs
   * beside the JavaScript responder system rather than under it, so the row
   * follows the finger AND the page scrolls behind it.
   *
   * Counted rather than boolean, so two things asking at once cannot have one
   * of them switch scrolling back on while the other still needs it off.
   */
  setScrollEnabled: (enabled: boolean) => void
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
  scrollTo: () => {},
  scrollBy: () => {},
  setScrollEnabled: () => {},
})

export function useScrollOffset(): ScrollOffset {
  return useContext(ScrollContext)
}

/** Just the action, for a header or a tab bar that only wants to send it home */
export function useScrollToTop(): () => void {
  return useContext(ScrollContext).scrollToTop
}
