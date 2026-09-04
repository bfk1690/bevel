/**
 * Pure-layer tests.
 *
 * Only modules with no React Native imports are covered here - color math,
 * masking and casing. Anything touching a native module needs a device and is
 * verified in the example app instead; mocking it would buy confidence that
 * does not survive contact with a real build.
 *
 *   node --experimental-strip-types scripts/test.mjs
 */
import assert from 'node:assert/strict'

import { alpha, contrast, darken, lighten, mix, parseColor, readableOn } from '../src/theme/color.ts'
import { applyMask, createMask, unmask } from '../src/utils/mask.ts'
import { lower, upper } from '../src/utils/case.ts'

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

// ── color ───────────────────────────────────────────────────────────────────

test('parses shorthand hex', () => {
  assert.deepEqual(parseColor('#fff'), { r: 255, g: 255, b: 255, a: 1 })
})

test('parses hex with alpha', () => {
  const parsed = parseColor('#00000080')
  assert.equal(parsed.r, 0)
  assert.ok(Math.abs(parsed.a - 0.502) < 0.01)
})

test('parses rgb and rgba', () => {
  assert.deepEqual(parseColor('rgb(10, 20, 30)'), { r: 10, g: 20, b: 30, a: 1 })
  assert.equal(parseColor('rgba(10, 20, 30, 0.5)').a, 0.5)
})

test('returns unparseable colors unchanged instead of throwing', () => {
  assert.equal(darken('not-a-color', 0.2), 'not-a-color')
  assert.equal(alpha('nope', 0.5), 'nope')
})

test('darken and lighten move in opposite directions', () => {
  assert.equal(darken('#808080', 0.5), 'rgba(64, 64, 64, 1)')
  assert.equal(lighten('#808080', 0.5), 'rgba(192, 192, 192, 1)')
})

test('darken keeps the alpha channel', () => {
  assert.equal(darken('rgba(255, 255, 255, 0.4)', 0.5), 'rgba(128, 128, 128, 0.4)')
})

test('mix interpolates between two colors', () => {
  assert.equal(mix('#000000', '#ffffff', 0.5), 'rgba(128, 128, 128, 1)')
})

test('contrast matches the WCAG extremes', () => {
  assert.equal(Math.round(contrast('#000000', '#ffffff')), 21)
  assert.equal(contrast('#123456', '#123456'), 1)
})

test('readableOn picks the legible foreground', () => {
  assert.equal(readableOn('#ffffff'), '#000000')
  assert.equal(readableOn('#000000'), '#FFFFFF')
  // A translucent surface cannot be judged: fall back to the light option
  assert.equal(readableOn('rgba(255,255,255,0.2)'), '#FFFFFF')
})

// ── mask ────────────────────────────────────────────────────────────────────

const phone = createMask('(###) ### ## ##')

test('mask inserts literals as digits arrive', () => {
  assert.equal(phone('5'), '(5')
  assert.equal(phone('555'), '(555')
  assert.equal(phone('5551234'), '(555) 123 4')
  assert.equal(phone('5551234567'), '(555) 123 45 67')
})

test('mask ignores overflow and re-formats already-formatted input', () => {
  assert.equal(phone('55512345678999'), '(555) 123 45 67')
  assert.equal(phone('(555) 123 45 67'), '(555) 123 45 67')
})

test('mask drops characters a slot cannot hold', () => {
  assert.equal(createMask('####')('12ab34'), '1234')
  assert.equal(createMask('AA-##')('tr42'), 'tr-42')
})

test('letter and wildcard slots', () => {
  assert.equal(createMask('A*#')('a12'), 'a12')
  assert.equal(createMask('***')('a1!'), 'a1')
  // The digit slot skips letters and finds the digit behind them
  assert.equal(createMask('A#')('ab7'), 'a7')
})

test('applyMask accepts a pattern or a function', () => {
  assert.equal(applyMask('5551234567', '(###) ### ## ##'), '(555) 123 45 67')
  assert.equal(applyMask('abc', (raw) => raw.toUpperCase()), 'ABC')
})

test('unmask strips every literal', () => {
  assert.equal(unmask('(555) 123 45 67'), '5551234567')
  assert.equal(unmask('TR-42'), 'TR42')
})

// ── case ────────────────────────────────────────────────────────────────────

test('default locale uses the invariant mapping', () => {
  assert.equal(upper('title'), 'TITLE')
  assert.equal(lower('TITLE'), 'title')
})

test('turkish keeps the dot on i and removes it from dotless i', () => {
  assert.equal(upper('iyi', 'tr'), 'İYİ')
  assert.equal(upper('ışık', 'tr'), 'IŞIK')
  assert.equal(lower('İYİ', 'tr'), 'iyi')
  assert.equal(lower('IŞIK', 'tr'), 'ışık')
})

test('turkish casing is not applied to other locales', () => {
  assert.equal(upper('iyi'), 'IYI')
})

console.log(`${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
