/**
 * Safe-area tests.
 *
 * Written after a toast was reported cut off in landscape. Nothing in the kit
 * looked at the horizontal insets, which are zero in portrait and about 59pt a
 * side once the phone is turned - so the bug could not be seen on the screen
 * anybody develops on.
 */
import assert from 'node:assert/strict'

import { sidePadding, ZERO_INSETS } from '../src/utils/optional.ts'

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

const PORTRAIT = { top: 59, right: 0, bottom: 34, left: 0 }
const LANDSCAPE = { top: 0, right: 59, bottom: 21, left: 59 }

test('portrait is left exactly as it was', () => {
  // Which is why nothing noticed: this is the only orientation most screens
  // are ever looked at in
  assert.deepEqual(sidePadding(PORTRAIT, 16), { paddingLeft: 16, paddingRight: 16 })
  assert.deepEqual(sidePadding(ZERO_INSETS, 16), { paddingLeft: 16, paddingRight: 16 })
})

test('turned on its side, the housing is cleared', () => {
  assert.deepEqual(sidePadding(LANDSCAPE, 16), { paddingLeft: 75, paddingRight: 75 })
})

test('the gutter is added to the inset, not replaced by it', () => {
  // Taking the larger of the two puts content hard against the edge of the
  // usable area and calls it a margin
  const { paddingLeft } = sidePadding(LANDSCAPE, 16)
  assert.ok(paddingLeft > LANDSCAPE.left, `${paddingLeft} leaves no room inside the safe area`)
  assert.equal(paddingLeft, LANDSCAPE.left + 16)
})

test('an uneven safe area is respected on each side separately', () => {
  // One side carries the housing and the other does not, on some devices
  const uneven = { top: 0, right: 0, bottom: 21, left: 59 }
  assert.deepEqual(sidePadding(uneven, 12), { paddingLeft: 71, paddingRight: 12 })
})

test('no gutter asked for, just the safe area', () => {
  assert.deepEqual(sidePadding(LANDSCAPE), { paddingLeft: 59, paddingRight: 59 })
})

test('a nonsense inset is not subtracted from the gutter', () => {
  const odd = { top: 0, right: -20, bottom: 0, left: -5 }
  assert.deepEqual(sidePadding(odd, 16), { paddingLeft: 16, paddingRight: 16 })
})

console.log(`insets: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
