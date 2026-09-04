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
