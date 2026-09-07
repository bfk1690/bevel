/**
 * Zoom tests.
 *
 * The focal-point maths is the part a device only shows by accident: it looks
 * right on a picture pinched in the middle of the screen and wrong on one
 * pinched in a corner, which is the case nobody tries by hand.
 */
import assert from 'node:assert/strict'

import {
  clampTransform,
  distanceBetween,
  focalPoint,
  focusedTransform,
  isZoomed,
  resistScale,
  scaleFromPinch,
  settledScale,
} from '../src/utils/zoom.ts'

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

const W = 400
const H = 800

test('two fingers have a distance, one does not', () => {
  assert.equal(distanceBetween([{ pageX: 0, pageY: 0 }, { pageX: 3, pageY: 4 }]), 5)
  assert.equal(distanceBetween([{ pageX: 0, pageY: 0 }]), 0, 'a lone finger cannot pinch')
  assert.equal(distanceBetween([]), 0)
})

test('a third finger does not drag the focal point across the picture', () => {
  const two = [
    { pageX: 100, pageY: 200 },
    { pageX: 300, pageY: 400 },
  ]
  // Re-gripping mid-pinch is exactly when someone is looking closely
  const three = [...two, { pageX: 0, pageY: 0 }]
  assert.deepEqual(focalPoint(three, W, H), focalPoint(two, W, H))
  assert.equal(distanceBetween(three), distanceBetween(two))
})

test('the focal point is measured from the centre of the page', () => {
  assert.deepEqual(focalPoint([{ pageX: 200, pageY: 400 }], W, H), { x: 0, y: 0 })
  assert.deepEqual(focalPoint([{ pageX: 300, pageY: 400 }], W, H), { x: 100, y: 0 })
})

test('what is under the fingers stays under the fingers', () => {
  const from = { scale: 1, x: 0, y: 0 }
  const focus = { x: 120, y: -80 }

  const next = focusedTransform(2, focus, from, focus)

  // A point p is drawn at p * s + t. Solving for the point that was under the
  // focus before the zoom, it must still be there after
  const before = (focus.x - from.x) / from.scale
  const after = before * next.scale + next.x
  assert.ok(Math.abs(after - focus.x) < 0.001, `drifted to ${after}`)
})

test('scaling about the centre is the bug, not the behaviour', () => {
  // The old way: keep the translation and only change the scale
  const focus = { x: 150, y: 0 }
  const centred = { scale: 2, x: 0, y: 0 }
  const focused = focusedTransform(2, focus, { scale: 1, x: 0, y: 0 }, focus)

  assert.notEqual(focused.x, centred.x)
  assert.equal(focused.x, -150, 'the image moves so the corner detail does not')
})

test('moving both fingers moves the image with them', () => {
  const from = { scale: 2, x: 0, y: 0 }
  const started = { x: 0, y: 0 }
  // Same scale, focus shifted right by 40: pure two-finger panning
  const next = focusedTransform(2, { x: 40, y: 0 }, from, started)
  assert.equal(next.x, 40)
  assert.equal(next.scale, 2)
})

test('a resting image cannot be dragged at all', () => {
  const clamped = clampTransform({ scale: 1, x: 300, y: -500 }, W, H)
  assert.deepEqual(clamped, { scale: 1, x: 0, y: 0 })
})

test('a zoomed image can be dragged as far as it has overflow', () => {
  // At 2x, half a screen of picture hangs off each side
  const limitX = (W * 2 - W) / 2
  assert.equal(clampTransform({ scale: 2, x: 9999, y: 0 }, W, H).x, limitX)
  assert.equal(clampTransform({ scale: 2, x: -9999, y: 0 }, W, H).x, -limitX)
  assert.equal(clampTransform({ scale: 2, x: 50, y: 0 }, W, H).x, 50, 'inside, it is left alone')
})

test('the bounds follow the scale being shown, not the one it will settle at', () => {
  // Clamping to the settled size while the image is still stretched past the
  // maximum drags it sideways under the fingers
  const stretched = clampTransform({ scale: 5, x: 700, y: 0 }, W, H)
  const settled = clampTransform({ scale: 4, x: 700, y: 0 }, W, H)
  assert.ok(stretched.x > settled.x)
})

test('the limits give, but not much', () => {
  assert.equal(resistScale(3, 4), 3, 'inside the range nothing happens')
  assert.equal(resistScale(5, 4), 4.2, 'a point past the maximum moves a fifth of a point')
  assert.ok(resistScale(0.5, 4) > 0.5, 'and pulling below one resists harder')
  assert.ok(resistScale(0.5, 4) < 1)
})

test('a pinch asks for the ratio of the distances', () => {
  assert.equal(scaleFromPinch(1, 100, 200), 2)
  assert.equal(scaleFromPinch(2, 200, 100), 1)
  // A second finger landing mid-gesture has no starting distance yet, and
  // dividing by it would send the picture to infinity
  assert.equal(scaleFromPinch(2, 0, 300), 2)
})

test('what was borrowed is given back on release', () => {
  assert.equal(settledScale(4.6, 4), 4)
  assert.equal(settledScale(0.7, 4), 1)
  assert.equal(settledScale(2.5, 4), 2.5)
})

test('a hair over one is not zoomed in', () => {
  // Otherwise a pinch that barely moved leaves the pager disabled on an image
  // that looks untouched
  assert.equal(isZoomed(1), false)
  assert.equal(isZoomed(1.005), false)
  assert.equal(isZoomed(1.2), true)
})

console.log(`zoom: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
