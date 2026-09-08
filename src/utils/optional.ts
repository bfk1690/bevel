/**
 * Safe-area insets.
 *
 * The package does not read them from a native module. Two reasons: it ships
 * no dependencies, and a bundler cannot express "require this only if it is
 * installed" - a runtime `require` of a variable name is rejected outright,
 * and a literal one fails the build when the package is absent.
 *
 * So insets are INJECTED, the same way gradients are. An app that already has
 * a safe-area provider passes its values down once:
 *
 *   const insets = useSafeAreaInsets()
 *   <BevelProvider theme={theme} insets={insets}>
 *
 * An app that does not gets zeros, and every component still lays out.
 */
export type EdgeInsets = { top: number; right: number; bottom: number; left: number }

export const ZERO_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 }

/**
 * Horizontal padding that clears the sensor housing.
 *
 * In portrait these insets are zero and this changes nothing. Turn the phone
 * and they are around 59pt on each side: everything pinned to a screen edge -
 * a toast, a tab bar, a floating button, the content of a screen - runs under
 * the notch and is cut off there. Only the popover's arithmetic accounted for
 * it, because that one was written against a diagram.
 *
 * The inset is ADDED to the design's own gutter rather than maxed with it. The
 * gutter is a decision about breathing room and the inset is a fact about
 * where pixels cannot be seen; taking the larger of the two puts content hard
 * against the edge of the usable area and calls it a margin.
 */
export function sidePadding(
  insets: EdgeInsets,
  gutter = 0,
): { paddingLeft: number; paddingRight: number } {
  return {
    paddingLeft: gutter + Math.max(0, insets.left),
    paddingRight: gutter + Math.max(0, insets.right),
  }
}
