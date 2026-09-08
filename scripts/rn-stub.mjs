/**
 * Minimal React Native stand-in for the pure-layer tests.
 *
 * Only what the theme layer touches is implemented. This is not a general
 * mock and must never grow into one: the moment a test needs a real native
 * behaviour, it belongs on a device instead.
 *
 * The window can be overridden per run, which is how the small-screen
 * assertions (the touch-target floor) are exercised:
 *
 *   BEVEL_TEST_WIDTH=360 BEVEL_TEST_HEIGHT=760 yarn test
 */
const width = Number(process.env.BEVEL_TEST_WIDTH ?? 393)
const height = Number(process.env.BEVEL_TEST_HEIGHT ?? 852)

export const Dimensions = {
  get: () => ({ width, height, scale: 3, fontScale: 1 }),
}

export const PixelRatio = {
  get: () => 3,
  // Matches iOS: snap to the nearest third of a point on a 3x screen
  roundToNearestPixel: (value) => Math.round(value * 3) / 3,
}

export const Platform = {
  OS: process.env.BEVEL_TEST_PLATFORM ?? 'ios',
  select: (spec) => spec[Platform.OS] ?? spec.default,
}

export const StyleSheet = {
  create: (styles) => styles,
  hairlineWidth: 1 / 3,
  absoluteFill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  absoluteFillObject: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  flatten: (style) => (Array.isArray(style) ? Object.assign({}, ...style.flat()) : style),
}

// Mutable, because a right-to-left run is the only way to test the direction
// helpers and it is fixed for the life of a real launch
export const I18nManager = { isRTL: false }

export const Keyboard = { dismiss: () => {}, addListener: () => ({ remove: () => {} }) }
export const Appearance = { getColorScheme: () => 'light' }

// The pure half of the motion module is what the tests read; the subscription
// is a device behaviour and is not pretended at here
export const AccessibilityInfo = {
  isReduceMotionEnabled: async () => false,
  addEventListener: () => ({ remove: () => {} }),
}

export default {
  AccessibilityInfo,
  Dimensions,
  I18nManager,
  PixelRatio,
  Platform,
  StyleSheet,
  Keyboard,
  Appearance,
}
