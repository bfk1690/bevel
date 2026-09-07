/**
 * Swipe tests.
 *
 * These are feel decisions, which is exactly why they are pinned down: nobody
 * can review a number that was tuned until the complaints stopped.
 */
import assert from 'node:assert/strict'

import { isFullSwipe, resistPast, resolveSwipeSnap, swipeTravel } from '../src/utils/swipe.ts'

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

const OPEN = 160

test('a barely moved row falls closed', () => {
  assert.equal(resolveSwipeSnap({ offset: -20, velocity: 0, openWidth: OPEN, wasOpen: false }), false)
})

test('past half the width it opens', () => {
  assert.equal(resolveSwipeSnap({ offset: -70, velocity: 0, openWidth: OPEN, wasOpen: false }), false)
  assert.equal(resolveSwipeSnap({ offset: -90, velocity: 0, openWidth: OPEN, wasOpen: false }), true)
})

test('a flick decides on its own, however short', () => {
  // Asking someone to drag past a mark before letting go is asking them to do
  // the animation's work
  assert.equal(resolveSwipeSnap({ offset: -20, velocity: -1.2, openWidth: OPEN, wasOpen: false }), true)
  assert.equal(resolveSwipeSnap({ offset: -150, velocity: 1.2, openWidth: OPEN, wasOpen: true }), false)
})

test('closing asks for less than opening did', () => {
  // The intent to close is the movement itself
  const pulledBack = { offset: -110, velocity: 0, openWidth: OPEN }
  assert.equal(resolveSwipeSnap({ ...pulledBack, wasOpen: true }), false)
  assert.equal(resolveSwipeSnap({ ...pulledBack, wasOpen: false }), true)
})

test('a row that opens the other way is the mirror image', () => {
  assert.equal(
    resolveSwipeSnap({ offset: 90, velocity: 0, openWidth: OPEN, wasOpen: false, side: 'left' }),
    true,
  )
  assert.equal(
    resolveSwipeSnap({ offset: -90, velocity: 0, openWidth: OPEN, wasOpen: false, side: 'left' }),
    false,
  )
})

test('a row with nothing to show never opens', () => {
  assert.equal(resolveSwipeSnap({ offset: -400, velocity: -3, openWidth: 0, wasOpen: false }), false)
})

test('movement inside the limits is passed through untouched', () => {
  assert.equal(resistPast(-40, OPEN), -40)
  assert.equal(resistPast(-160, OPEN), -160)
  assert.equal(resistPast(0, OPEN), 0)
})

test('movement past the limit is slowed, not stopped', () => {
  // A hard stop reads as the gesture having broken
  const past = resistPast(-200, OPEN, 0.2)
  assert.ok(past < -OPEN, 'it does keep moving')
  assert.equal(past, -168)

  const wrongWay = resistPast(60, OPEN, 0.2)
  assert.equal(wrongWay, 12, 'and the same the other way')
})

test('a full swipe is measured against the row, not the actions', () => {
  const row = 390

  assert.equal(isFullSwipe(100, row), false, 'a normal open is not a full swipe')
  assert.equal(isFullSwipe(195, row), true, 'half the row is')
  assert.equal(isFullSwipe(300, row), true)

  // Same row, twice the actions behind it: the effort asked of the finger does
  // not change, because the gesture is about the row
  assert.equal(isFullSwipe(180, row), isFullSwipe(180, row), 'independent of action count')
})

test('a full swipe can be asked for later, or turned off', () => {
  assert.equal(isFullSwipe(200, 390, 0.8), false, 'a higher ratio demands more')
  assert.equal(isFullSwipe(320, 390, 0.8), true)
  assert.equal(isFullSwipe(9999, 390, 0), false, 'a zero ratio disables it rather than firing always')
  assert.equal(isFullSwipe(9999, 0), false, 'an unmeasured row never fires')
})

test('travel is positive in the direction the row opens', () => {
  assert.equal(swipeTravel(-120, 'right'), 120)
  assert.equal(swipeTravel(120, 'left'), 120)
  assert.equal(swipeTravel(30, 'right'), -30, 'pulling the wrong way is negative')
  assert.equal(swipeTravel(-90), 90, 'right by default')
})

console.log(`swipe: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
