/**
 * Sheet snapping tests.
 *
 * Feel decisions, pinned down for the same reason as the swipe ones: nobody
 * can review a number that was tuned until the complaints stopped.
 */
import assert from 'node:assert/strict'

import { DISMISS, nearestSnapIndex, resolveSnapPoints } from '../src/utils/sheet.ts'

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

test('percentages are of the room the sheet has', () => {
  // Not of the screen: the sheet lives under a status bar and over a home
  // indicator, and "half" of the screen is not half of what is left
  assert.deepEqual(resolveSnapPoints(['25%', '50%', '90%'], 800), [200, 400, 720])
  assert.deepEqual(resolveSnapPoints([120, '50%'], 800), [120, 400])
})

test('points come back smallest first, whatever order they were given', () => {
  assert.deepEqual(resolveSnapPoints(['90%', '25%', '50%'], 800), [200, 400, 720])
  assert.deepEqual(resolveSnapPoints([400, 400, 200], 800), [200, 400], 'and only once each')
})

test('nothing exceeds the room available', () => {
  assert.deepEqual(resolveSnapPoints(['150%', 2000], 800), [800])
  assert.deepEqual(resolveSnapPoints(['50%'], 0), [], 'unmeasured is not a size')
  assert.deepEqual(resolveSnapPoints([0, -20, '0%'], 800), [], 'and neither is nothing')
})

test('let go, and it goes to the nearest size', () => {
  const snaps = [200, 400, 720]
  assert.equal(nearestSnapIndex({ height: 230, velocity: 0, snaps, current: 200 }), 0)
  assert.equal(nearestSnapIndex({ height: 360, velocity: 0, snaps, current: 200 }), 1)
  assert.equal(nearestSnapIndex({ height: 700, velocity: 0, snaps, current: 400 }), 2)
})

test('a flick beats the distance', () => {
  const snaps = [200, 400, 720]
  // Barely moved, thrown upwards: that is a clear instruction
  assert.equal(nearestSnapIndex({ height: 210, velocity: -1.2, snaps, current: 200 }), 1)
  assert.equal(nearestSnapIndex({ height: 700, velocity: 1.2, snaps, current: 720 }), 1)
})

test('a flick moves one step, not all of them', () => {
  const snaps = [200, 400, 720]
  // Otherwise a sheet can be thrown from peek to full and skip the size the
  // reader was reaching for
  assert.equal(nearestSnapIndex({ height: 205, velocity: -3, snaps, current: 200 }), 1)
  assert.equal(nearestSnapIndex({ height: 715, velocity: 3, snaps, current: 720 }), 1)
})

test('thrown down from the smallest size, it closes', () => {
  const snaps = [200, 400]
  assert.equal(nearestSnapIndex({ height: 190, velocity: 1.2, snaps, current: 200 }), DISMISS)
  assert.equal(
    nearestSnapIndex({ height: 190, velocity: 1.2, snaps, current: 200, dismissible: false }),
    0,
    'unless it is not allowed to',
  )
})

test('dragged well under the smallest size, it closes too', () => {
  const snaps = [200, 400]
  // Let go at a fifth of the smallest size: that is a dismissal, not a request
  // for the smallest size
  assert.equal(nearestSnapIndex({ height: 40, velocity: 0, snaps, current: 200 }), DISMISS)
  assert.equal(nearestSnapIndex({ height: 140, velocity: 0, snaps, current: 200 }), 0, 'but close to it is not')
})

test('no snap points at all is not a crash', () => {
  assert.equal(nearestSnapIndex({ height: 300, velocity: 0, snaps: [], current: 0 }), DISMISS)
  assert.equal(
    nearestSnapIndex({ height: 300, velocity: 0, snaps: [], current: 0, dismissible: false }),
    0,
  )
})

console.log(`sheet: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
