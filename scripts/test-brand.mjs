/**
 * Brand derivation tests.
 *
 * The point of the derivation is that a colour chosen against white still
 * works on black, so that is what gets asserted - as a contrast ratio rather
 * than as a specific hex.
 */
import assert from 'node:assert/strict'

import { contrast } from '../src/theme/color.ts'
import { createBrandTheme, ensureContrast } from '../src/theme/brand.ts'

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

test('a colour that already reads is left alone', () => {
  const blue = '#0A84FF'
  assert.equal(ensureContrast(blue, '#000000', 3), blue)
})

test('a dark brand colour is lightened until it reads on black', () => {
  // Navy on black is unreadable, and refusing it is not an option either
  const fixed = ensureContrast('#0B1E3F', '#000000', 4.5)
  assert.ok(contrast(fixed, '#000000') >= 4.5, `was ${contrast(fixed, '#000000').toFixed(2)}`)
  assert.notEqual(fixed, '#0B1E3F')
})

test('a pale brand colour is darkened until it reads on white', () => {
  const fixed = ensureContrast('#FFE066', '#FFFFFF', 4.5)
  assert.ok(contrast(fixed, '#FFFFFF') >= 4.5, `was ${contrast(fixed, '#FFFFFF').toFixed(2)}`)
})

test('an impossible colour returns the closest it got, not a loop', () => {
  // Nothing clears 21:1 against mid grey
  const fixed = ensureContrast('#808080', '#808080', 21)
  assert.equal(typeof fixed, 'string')
  assert.ok(contrast(fixed, '#808080') > 1, 'it did move')
})

test('one hex becomes a theme that works in both schemes', () => {
  const theme = createBrandTheme({ accent: '#00DB21' })

  for (const scheme of ['light', 'dark']) {
    const colors = theme.schemes[scheme]
    // Visibility, not readability: the brand colour is the app's own
    const ratio = contrast(colors.accent, colors.canvas)
    assert.ok(ratio >= 3, `${scheme} accent was ${ratio.toFixed(2)}:1`)

    const onAccent = contrast(colors.onAccent, colors.accent)
    assert.ok(onAccent >= 4.5, `${scheme} label on accent was ${onAccent.toFixed(2)}:1`)
  }
})

test('the tint is stronger on a dark surface', () => {
  const theme = createBrandTheme({ accent: '#0A84FF' })
  assert.ok(theme.schemes.light.accentSoft.includes('0.12'))
  assert.ok(theme.schemes.dark.accentSoft.includes('0.18'))
})

test('a yellow brand takes black labels in both schemes', () => {
  const theme = createBrandTheme({ accent: '#FFD60A' })
  assert.equal(theme.schemes.light.onAccent, '#000000')
  assert.equal(theme.schemes.dark.onAccent, '#000000')
})

test('everything derived can still be overridden', () => {
  const theme = createBrandTheme({
    accent: '#0A84FF',
    light: { accentSoft: 'rgba(0, 0, 0, 0.05)' },
    dark: { canvas: '#0B0B0C' },
    scale: 'none',
    radius: { md: 20 },
  })
  assert.equal(theme.schemes.light.accentSoft, 'rgba(0, 0, 0, 0.05)')
  assert.equal(theme.schemes.dark.canvas, '#0B0B0C')
  assert.equal(theme.radius.md, 20, 'the rest of the theme input still applies')
})

test('the dark accent is measured against the dark canvas that was given', () => {
  const theme = createBrandTheme({ accent: '#3A3A3A', dark: { canvas: '#101010' } })
  const ratio = contrast(theme.schemes.dark.accent, '#101010')
  assert.ok(ratio >= 3, `was ${ratio.toFixed(2)}`)
})

test('a brand colour that can already be seen is never touched', () => {
  // Correcting one that does not need it is how a brand stops looking like
  // itself
  const blue = '#0A84FF'
  const theme = createBrandTheme({ accent: blue })
  assert.equal(theme.schemes.light.accent, blue)
  assert.equal(theme.schemes.dark.accent, blue)
})

test('a colour that vanishes into its background is moved, and the label follows', () => {
  // Yellow on white fails the 3:1 that WCAG asks of a user interface component
  // - an underline in it would simply not be there
  const theme = createBrandTheme({ accent: '#FFD60A' })
  assert.notEqual(theme.schemes.light.accent, '#FFD60A', 'moved for the light canvas')
  assert.equal(theme.schemes.dark.accent, '#FFD60A', 'left alone where it reads')
  assert.ok(contrast(theme.schemes.light.accent, '#FFFFFF') >= 3)
})

test('a stricter threshold is available for accents used as text', () => {
  const theme = createBrandTheme({ accent: '#FFD60A', minimumContrast: 4.5 })
  assert.notEqual(theme.schemes.light.accent, '#FFD60A')
  assert.ok(contrast(theme.schemes.light.accent, '#FFFFFF') >= 4.5)
})

console.log(`brand: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
