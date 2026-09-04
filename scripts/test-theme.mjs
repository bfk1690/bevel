/**
 * Theme engine tests.
 *
 * These cover the riskiest pure logic in the package: how a partial theme is
 * merged into a complete one, and how style sheets resolve per scheme. A
 * mistake here is silent - the app still renders, just with the wrong values.
 *
 *   node --experimental-strip-types --import ./scripts/register.mjs scripts/test-theme.mjs
 */
import assert from 'node:assert/strict'

import { defaultTheme, defineTheme } from '../src/theme/define-theme.ts'
import { createThemedStyles, getTokens, setActiveTheme } from '../src/theme/styles.ts'
import { scaleValue } from '../src/theme/scale.ts'
import { resolveColor } from '../src/theme/color.ts'
import { shadow } from '../src/theme/shadow.ts'

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    passed += 1
  } catch (error) {
    failed += 1
    console.error(`FAIL  ${name}\n      ${error.message}`)
  }
}

const WIDTH = Number(process.env.BEVEL_TEST_WIDTH ?? 393)
const REFERENCE = WIDTH === 393
const label = REFERENCE ? 'reference screen' : `${WIDTH}pt screen`

// ── defaults ────────────────────────────────────────────────────────────────

test('a zero-config theme is complete', () => {
  const theme = defaultTheme
  assert.ok(theme.schemes.light && theme.schemes.dark)
  assert.equal(theme.defaultScheme, 'light')
  for (const role of ['canvas', 'surface', 'text', 'accent', 'onAccent', 'media', 'overlay']) {
    assert.equal(typeof theme.schemes.light[role], 'string', `missing role ${role}`)
    assert.equal(typeof theme.schemes.dark[role], 'string', `missing role ${role}`)
  }
  assert.ok(theme.components.Button.variants.primary)
  assert.ok(theme.components.Input.variants.default)
})

// ── scheme merging ──────────────────────────────────────────────────────────

test('a scheme patch only replaces the roles it names', () => {
  const theme = defineTheme({ schemes: { light: { accent: '#00FF00' } } })
  assert.equal(theme.schemes.light.accent, '#00FF00')
  assert.equal(theme.schemes.light.canvas, defaultTheme.schemes.light.canvas)
  // The other scheme is untouched
  assert.equal(theme.schemes.dark.accent, defaultTheme.schemes.dark.accent)
})

test('a custom scheme extends the one it names', () => {
  const theme = defineTheme({
    schemes: { midnight: { extends: 'dark', canvas: '#000010' } },
    defaultScheme: 'midnight',
  })
  assert.equal(theme.defaultScheme, 'midnight')
  assert.equal(theme.schemes.midnight.canvas, '#000010')
  assert.equal(theme.schemes.midnight.text, defaultTheme.schemes.dark.text)
  // `extends` is a directive, not a color
  assert.equal(theme.schemes.midnight.extends, undefined)
})

test('a custom scheme without extends falls back to light', () => {
  const theme = defineTheme({ schemes: { sepia: { canvas: '#F5EFE0' } } })
  assert.equal(theme.schemes.sepia.text, defaultTheme.schemes.light.text)
})

test('an unknown defaultScheme is ignored rather than trusted', () => {
  const theme = defineTheme({ defaultScheme: 'nope' })
  assert.equal(theme.defaultScheme, 'light')
})

test('brand-specific roles survive alongside the required ones', () => {
  const theme = defineTheme({ schemes: { light: { cyan: '#00E5FF' } } })
  assert.equal(theme.schemes.light.cyan, '#00E5FF')
  assert.equal(typeof theme.schemes.light.accent, 'string')
})

// ── component recipes ───────────────────────────────────────────────────────

test('a variant patch keeps the properties it does not mention', () => {
  const theme = defineTheme({
    components: { Button: { variants: { primary: { press: 'scale' } } } },
  })
  const primary = theme.components.Button.variants.primary
  assert.equal(primary.press, 'scale')
  assert.equal(primary.bg, 'accent')
  assert.equal(primary.fg, 'onAccent')
})

test('a new variant joins the built-in ones', () => {
  const theme = defineTheme({
    components: { Button: { variants: { checkout: { bg: 'ok', depth: 6 } } } },
  })
  assert.equal(theme.components.Button.variants.checkout.depth, 6)
  assert.ok(theme.components.Button.variants.secondary)
})

test('a partial size map keeps the sizes it omits', () => {
  const theme = defineTheme({ components: { Button: { height: { lg: 72 } } } })
  const { height } = theme.components.Button
  assert.equal(height.lg, scaleValue(72, 'moderate'))
  assert.equal(height.sm, scaleValue(36, 'moderate'))
})

test('input variants merge the same way', () => {
  const theme = defineTheme({
    components: { Input: { variants: { default: { focusBorder: 'ok' } } } },
  })
  const spec = theme.components.Input.variants.default
  assert.equal(spec.focusBorder, 'ok')
  assert.equal(spec.bg, 'sunk')
})

// ── scaling ─────────────────────────────────────────────────────────────────

test(`scale: 'none' leaves every measurement in raw dp (${label})`, () => {
  const theme = defineTheme({ scale: 'none' })
  assert.equal(theme.radius.md, 12)
  assert.equal(theme.sizes.control.md, 50)
  assert.equal(theme.space(4), 16)
  assert.equal(theme.type.body.fontSize, 15)
})

test(`scale: 'moderate' follows the viewport (${label})`, () => {
  const theme = defineTheme({ scale: 'moderate' })
  assert.equal(theme.radius.md, scaleValue(12, 'moderate'))
  if (REFERENCE) {
    // On the reference device the multiplier is exactly 1
    assert.equal(theme.radius.md, 12)
    assert.equal(theme.sizes.control.md, 50)
  } else {
    assert.notEqual(theme.sizes.control.md, 50)
  }
})

test('pill radius and border width are never scaled', () => {
  const theme = defineTheme({ scale: 'moderate' })
  assert.equal(theme.radius.pill, 999)
  assert.equal(theme.radius.none, 0)
  assert.equal(theme.sizes.borderWidth, 1)
})

test('the 44dp touch floor never scales below itself', () => {
  for (const scale of ['none', 'moderate', 'width', 'height']) {
    const theme = defineTheme({ scale })
    assert.ok(theme.sizes.minTap >= 44, `${scale} produced ${theme.sizes.minTap}`)
  }
})

test('type scaling is clamped so headings do not run away', () => {
  const theme = defineTheme({ scale: 'moderate' })
  const ratio = theme.type.display.fontSize / 32
  // The clamp is 0.92-1.10, then the result lands on the device pixel grid,
  // which can carry it a third of a point past either end. That tolerance is
  // the point of snapping - a crisp edge beats an exact ratio.
  const grid = 1 / 3 / 32
  assert.ok(
    ratio >= 0.92 - grid && ratio <= 1.1 + grid,
    `ratio was ${ratio}`,
  )
})

test('spacing is a multiple of the configured unit', () => {
  const theme = defineTheme({ scale: 'none', spacingUnit: 8 })
  assert.equal(theme.space(1), 8)
  assert.equal(theme.space(3), 24)
  // Repeated reads come from the cache, not a fresh computation
  assert.equal(theme.space(3), 24)
})

test('a font family applies to every token unless one overrides it', () => {
  const theme = defineTheme({
    fontFamily: 'Inter',
    type: { display: { fontFamily: 'Playfair' } },
  })
  assert.equal(theme.type.body.fontFamily, 'Inter')
  assert.equal(theme.type.display.fontFamily, 'Playfair')
})

// ── style resolution ────────────────────────────────────────────────────────

test('styles resolve against the active scheme', () => {
  const theme = defineTheme({
    id: 'test-styles',
    schemes: { light: { canvas: '#FFFFFF' }, dark: { canvas: '#000000' } },
  })

  const styles = createThemedStyles(({ colors }) => ({ page: { backgroundColor: colors.canvas } }))

  setActiveTheme(theme, 'light')
  assert.equal(styles.page.backgroundColor, '#FFFFFF')

  setActiveTheme(theme, 'dark')
  assert.equal(styles.page.backgroundColor, '#000000')

  setActiveTheme(theme, 'light')
  assert.equal(styles.page.backgroundColor, '#FFFFFF')
})

test('the factory runs once per scheme, not once per read', () => {
  const theme = defineTheme({ id: 'test-cache' })
  let runs = 0
  const styles = createThemedStyles(({ colors }) => {
    runs += 1
    return { box: { backgroundColor: colors.surface } }
  })

  setActiveTheme(theme, 'light')
  void styles.box
  void styles.box
  void styles.box
  assert.equal(runs, 1)

  setActiveTheme(theme, 'dark')
  void styles.box
  assert.equal(runs, 2)

  setActiveTheme(theme, 'light')
  void styles.box
  assert.equal(runs, 2, 'a scheme already built must not be rebuilt')
})

test('an unknown scheme falls back to the default instead of crashing', () => {
  const theme = defineTheme({ id: 'test-fallback' })
  setActiveTheme(theme, 'does-not-exist')
  assert.equal(getTokens().scheme, theme.defaultScheme)
})

test('style proxies behave like objects', () => {
  const theme = defineTheme({ id: 'test-proxy' })
  setActiveTheme(theme, 'light')
  const styles = createThemedStyles(() => ({ a: { flex: 1 }, b: { flex: 2 } }))
  assert.deepEqual(Object.keys(styles).sort(), ['a', 'b'])
  assert.ok('a' in styles)
  assert.equal(styles.missing, undefined)
})

// ── colors and shadows ──────────────────────────────────────────────────────

test('resolveColor accepts a role name or a raw color', () => {
  const colors = { accent: '#0A84FF', text: '#000000' }
  assert.equal(resolveColor(colors, 'accent'), '#0A84FF')
  assert.equal(resolveColor(colors, '#FF6B00'), '#FF6B00')
  assert.equal(resolveColor(colors, undefined, 'transparent'), 'transparent')
  assert.equal(resolveColor(colors, 'nope', '#FFF'), 'nope')
})

test('shadow presets differ per platform', () => {
  const card = shadow('card')
  if (process.env.BEVEL_TEST_PLATFORM === 'android') {
    // A bordered card would grow a hard line under it, so elevation stays off
    assert.deepEqual(card, {})
  } else {
    assert.equal(card.shadowOpacity, 0.04)
    assert.equal(card.shadowColor, '#000000')
  }
  assert.deepEqual(shadow('none'), {})
})

console.log(`theme: ${passed} passed, ${failed} failed  (${label})`)
process.exit(failed === 0 ? 0 : 1)
