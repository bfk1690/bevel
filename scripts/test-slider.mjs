/**
 * Slider arithmetic tests.
 *
 * The edges are the point: an unmeasured track, a range of zero length, and a
 * step that does not divide the range evenly.
 */
import assert from 'node:assert/strict'

import {
  clampValue,
  nearestBound,
  orderRange,
  positionOfValue,
  ratioOfValue,
  snapToStep,
  valueOfPosition,
  valueOfRatio,
} from '../src/utils/slider.ts'

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

const SCALE = { min: 0, max: 100 }

test('clamping holds both ends', () => {
  assert.equal(clampValue(-10, SCALE), 0)
  assert.equal(clampValue(110, SCALE), 100)
  assert.equal(clampValue(42, SCALE), 42)
})

test('a range of zero length collapses instead of dividing by zero', () => {
  const flat = { min: 5, max: 5 }
  assert.equal(clampValue(9, flat), 5)
  assert.equal(ratioOfValue(9, flat), 0)
  assert.equal(valueOfRatio(0.5, flat), 5)
})

test('steps are measured from the minimum, not from zero', () => {
  const scale = { min: 2, max: 22, step: 5 }
  // Stepping from zero would offer 0, 5, 10 - values this slider cannot hold
  assert.equal(snapToStep(3, scale), 2)
  assert.equal(snapToStep(5, scale), 7)
  assert.equal(snapToStep(20, scale), 22)
})

test('a step that does not divide the range still reaches the maximum', () => {
  const scale = { min: 0, max: 10, step: 3 }
  assert.equal(snapToStep(9.6, scale), 10, 'clamped rather than overshooting to 12')
  assert.equal(snapToStep(4.4, scale), 3)
  assert.equal(snapToStep(4.6, scale), 6)
})

test('no step means no rounding', () => {
  assert.equal(snapToStep(42.42, SCALE), 42.42)
  assert.equal(snapToStep(42.42, { ...SCALE, step: 0 }), 42.42)
  assert.equal(snapToStep(-5, SCALE), 0, 'still clamped')
})

test('ratio and value are inverses', () => {
  assert.equal(ratioOfValue(0, SCALE), 0)
  assert.equal(ratioOfValue(50, SCALE), 0.5)
  assert.equal(ratioOfValue(100, SCALE), 1)
  assert.equal(valueOfRatio(0.25, SCALE), 25)
  // Out-of-range ratios are pulled back rather than extrapolated
  assert.equal(ratioOfValue(-20, SCALE), 0)
  assert.equal(valueOfRatio(2, SCALE), 100)
})

test('position maps both ways along the track', () => {
  assert.equal(positionOfValue(50, SCALE, 200), 100)
  assert.equal(positionOfValue(100, SCALE, 200), 200)
  assert.equal(valueOfPosition(150, SCALE, 200), 75)
  assert.equal(valueOfPosition(-20, SCALE, 200), 0)
  assert.equal(valueOfPosition(400, SCALE, 200), 100)
})

test('an unmeasured track answers with the minimum', () => {
  assert.equal(valueOfPosition(120, SCALE, 0), 0)
  assert.equal(valueOfPosition(120, { min: 10, max: 20 }, 0), 10)
  assert.equal(positionOfValue(50, SCALE, -5), 0)
})

test('the nearer bound wins, and a tie goes to the end', () => {
  assert.equal(nearestBound(10, 0, 100), 'start')
  assert.equal(nearestBound(90, 0, 100), 'end')
  // A collapsed range can still be opened by dragging right
  assert.equal(nearestBound(50, 50, 50), 'end')
})

test('a range keeps its order whichever bound moved', () => {
  assert.deepEqual(orderRange(20, 80), [20, 80])
  assert.deepEqual(orderRange(80, 20), [20, 80])
  assert.deepEqual(orderRange(50, 50), [50, 50])
})

console.log(`slider: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
