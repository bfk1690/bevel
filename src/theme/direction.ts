import { I18nManager } from 'react-native'

/** The `textAlign` values that name a physical side */
export type SideAlign = 'left' | 'right'

/**
 * Whether the app is laid out right to left.
 *
 * Read at call time rather than captured at import: it is fixed for the life
 * of a launch, but a module read during startup can be evaluated before the
 * app has applied its own setting.
 */
export function isRTL(): boolean {
  return I18nManager.isRTL
}

/**
 * `textAlign` for the leading and trailing edges.
 *
 * Layout properties have `start` and `end`, which flip on their own. Text
 * alignment does not: `textAlign` takes physical sides, so a right-aligned
 * value stays on the right in Arabic - on the side a sentence BEGINS - and
 * reads as a mistake.
 */
export function leadingAlign(): SideAlign {
  return isRTL() ? 'right' : 'left'
}

export function trailingAlign(): SideAlign {
  return isRTL() ? 'left' : 'right'
}

/** Physical side of the leading or trailing edge, for absolute positioning */
export function leadingSide(): SideAlign {
  return isRTL() ? 'right' : 'left'
}

export function trailingSide(): SideAlign {
  return isRTL() ? 'left' : 'right'
}
