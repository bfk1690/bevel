import { useEffect, useState } from 'react'
import { AccessibilityInfo } from 'react-native'

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
