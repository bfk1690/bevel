import { useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, AppState } from 'react-native'

/**
 * How long a transition should take when movement has been turned down.
 *
 * Not zero. A change that happens between two frames is not seen happening,
 * and the reader is left working out what moved. Long enough to register as
 * one thing becoming another, short enough not to travel.
 */
export const REDUCED_TRANSITION_MS = 80

/**
 * Whether the system has been asked to reduce movement.
 *
 * Subscribed rather than read once: it can be switched on in Settings while
 * the app is open, and it is often switched on by someone who has just been
 * made ill by something moving.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    let alive = true

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (alive) setReduced(enabled)
    })

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced)

    return () => {
      alive = false
      subscription.remove()
    }
  }, [])

  return reduced
}

/**
 * A transition the user set off, shortened rather than removed.
 *
 * Both platforms answer "reduce motion" by replacing travel with a fade, not
 * by cutting. A sheet still needs to be seen arriving; it just should not fly
 * up the screen to do it.
 */
export function transitionDuration(duration: number, reduced: boolean): number {
  if (!reduced) return duration
  return Math.min(duration, REDUCED_TRANSITION_MS)
}

/**
 * Whether movement NOBODY ASKED FOR may run: a carousel advancing on its own,
 * a pulse, a marquee.
 *
 * This is the category the setting is really about. A transition answers
 * something the reader just did; ambient movement happens at the screen and
 * cannot be predicted, which is what makes it unbearable for some people.
 */
export function allowsAmbientMotion(reduced: boolean): boolean {
  return !reduced
}

export type AppStateValue = 'active' | 'background' | 'inactive' | 'unknown'

/**
 * Whether the app is in front, and what to do when it comes back.
 *
 * Timers are throttled or stopped while the app is away, so anything counting
 * comes back as stale as the trip was long. Reading the clock again on the way
 * in is the difference between a message from this morning saying "just now"
 * and saying the truth.
 */
export function useAppState(onForeground?: () => void): AppStateValue {
  const [state, setState] = useState<AppStateValue>(
    () => (AppState.currentState as AppStateValue) ?? 'unknown',
  )

  // Held in a ref so a caller passing an inline function does not resubscribe
  // on every render - which would miss the very change it was waiting for
  const handler = useRef(onForeground)
  handler.current = onForeground

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      setState(next as AppStateValue)
      if (next === 'active') handler.current?.()
    })
    return () => subscription.remove()
  }, [])

  return state
}

export type HideOnScrollInput = {
  /** Where the list is now, in points */
  offset: number
  /** How far it moved since last time. Positive is downwards */
  delta: number
  /** Whether it is hidden at the moment */
  hidden: boolean
  /**
   * Below this the control is always shown.
   *
   * There is nothing to get out of the way of at the top of a list, and a
   * button that vanishes on the first flick of a short page reads as a bug.
   */
  minOffset?: number
  /** Movement under this is a wobble, not an intention */
  threshold?: number
}

/**
 * Whether a control that hides on scroll should be hidden.
 *
 * Two resting places, never a continuum. Mapping the scroll offset straight
 * onto the travel looks right while a finger is moving and is wrong the moment
 * it stops: the control is left standing half off the bottom of the screen,
 * cut in two by the edge. It has to commit to being somewhere.
 */
export function shouldHideOnScroll({
  offset,
  delta,
  hidden,
  minOffset = 0,
  threshold = 6,
}: HideOnScrollInput): boolean {
  if (offset <= minOffset) return false
  if (delta > threshold) return true
  if (delta < -threshold) return false
  return hidden
}
