/**
 * Motion tests.
 *
 * The distinction being pinned down: movement the reader set off is shortened,
 * movement that happens at them is stopped.
 */
import assert from 'node:assert/strict'

import {
  allowsAmbientMotion,
  shouldHideOnScroll,
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

test('a hiding control commits, it does not hover half off the edge', () => {
  // Mapping the offset straight onto the travel looks right while a finger is
  // moving and is wrong the moment it stops: the button is left cut in two by
  // the bottom of the screen
  assert.equal(shouldHideOnScroll({ offset: 400, delta: 40, hidden: false }), true)
  assert.equal(shouldHideOnScroll({ offset: 400, delta: -40, hidden: true }), false)
})

test('stopping changes nothing', () => {
  // A finger held still is not an instruction either way
  assert.equal(shouldHideOnScroll({ offset: 400, delta: 0, hidden: true }), true)
  assert.equal(shouldHideOnScroll({ offset: 400, delta: 0, hidden: false }), false)
  assert.equal(shouldHideOnScroll({ offset: 400, delta: 3, hidden: false }), false, 'a wobble is not a scroll')
  assert.equal(shouldHideOnScroll({ offset: 400, delta: -3, hidden: true }), true)
})

test('the top of a list always shows it', () => {
  // Nothing to get out of the way of up there, and a button that vanishes on
  // the first flick of a short page reads as a fault
  assert.equal(shouldHideOnScroll({ offset: 0, delta: 40, hidden: true }), false)
  assert.equal(shouldHideOnScroll({ offset: 20, delta: 40, hidden: true, minOffset: 56 }), false)
  assert.equal(shouldHideOnScroll({ offset: 90, delta: 40, hidden: false, minOffset: 56 }), true)
})

test('the bounce past the top is not a scroll upwards', () => {
  assert.equal(shouldHideOnScroll({ offset: -30, delta: -50, hidden: true }), false)
})

console.log(`motion: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
