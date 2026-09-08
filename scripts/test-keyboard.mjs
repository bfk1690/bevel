/**
 * Keyboard bar tests.
 *
 * One decision, learned from a device: nothing is subtracted from the
 * keyboard's height. Two places were taking the safe area off the same
 * measurement and the bar came to rest behind the keys.
 */
import assert from 'node:assert/strict'

import { footerPadding, keyboardLift } from '../src/utils/keyboard.ts'

let passed = 0
let failed = 0

function test(name, run) {
  try {
    run()
    passed += 1
  } catch (error) {
    failed += 1
    console.error(`  x ${name}\n    ${error.message}`)
  }
}

test('a bar rises by the whole keyboard', () => {
  // endCoordinates is measured from the bottom of the SCREEN, so the full
  // height puts the bar's bottom edge on the keyboard's top edge
  assert.equal(keyboardLift(336), 336)
  assert.equal(keyboardLift(336, 8), 344, 'plus whatever gap was asked for')
})

test('the safe area is not taken off it', () => {
  // It was, in two places at once, and the bar sat a home indicator's worth
  // behind the keyboard with half the action unreachable
  const safeBottom = 34
  assert.notEqual(keyboardLift(336), 336 - safeBottom)
})

test('no keyboard, no lift', () => {
  assert.equal(keyboardLift(0), 0)
  assert.equal(keyboardLift(-10), 0)
  assert.equal(keyboardLift(Number.NaN), 0)
  assert.equal(keyboardLift(0, 12), 0, 'and no gap either, since there is nothing to clear')
})

test('the home indicator is reserved only while it can be seen', () => {
  // With the keyboard up it is covered, and keeping the padding leaves the
  // action floating above the keys for no reason
  assert.equal(footerPadding(false, 34, 12), 46)
  assert.equal(footerPadding(true, 34, 12), 12)
})

test('a phone without a home indicator changes nothing', () => {
  assert.equal(footerPadding(false, 0, 12), 12)
  assert.equal(footerPadding(true, 0, 12), 12)
  assert.equal(footerPadding(false, -5, 12), 12, 'and a nonsense inset is not subtracted')
})

console.log(`keyboard: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
