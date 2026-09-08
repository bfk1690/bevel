/**
 * Motion tests.
 *
 * The distinction being pinned down: movement the reader set off is shortened,
 * movement that happens at them is stopped.
 */
import assert from 'node:assert/strict'

import {
  allowsAmbientMotion,
  transitionDuration,
  REDUCED_TRANSITION_MS,
} from '../src/utils/motion.ts'

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

test('ordinarily nothing is touched', () => {
  assert.equal(transitionDuration(300, false), 300)
  assert.equal(allowsAmbientMotion(false), true)
})

test('a transition is shortened, not cut', () => {
  // A change that happens between two frames is not seen happening, and the
  // reader is left working out what moved
  const shortened = transitionDuration(300, true)
  assert.ok(shortened > 0, 'instant is not the answer')
  assert.equal(shortened, REDUCED_TRANSITION_MS)
})

test('a transition already shorter than the floor is left alone', () => {
  // Otherwise reducing motion would make something take LONGER
  assert.equal(transitionDuration(40, true), 40)
  assert.equal(transitionDuration(REDUCED_TRANSITION_MS, true), REDUCED_TRANSITION_MS)
})

test('movement nobody asked for stops', () => {
  // A carousel advancing on its own happens AT the reader and cannot be
  // predicted, which is what makes it unbearable for some people
  assert.equal(allowsAmbientMotion(true), false)
})

console.log(`motion: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
