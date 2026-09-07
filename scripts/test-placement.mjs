/**
 * Anchored placement tests.
 *
 * The cases are the ones a device only shows by accident: an anchor near an
 * edge, a bubble wider than the room left for it, and a screen too small for
 * any side to fit.
 */
import assert from 'node:assert/strict'

import { resolvePlacement } from '../src/utils/placement.ts'

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

const SCREEN = { width: 400, height: 800 }
const INSETS = { top: 50, right: 0, bottom: 34, left: 0 }
const CONTENT = { width: 200, height: 100 }

const at = (x, y, width = 40, height = 40) => ({ x, y, width, height })

test('auto prefers below the anchor', () => {
  const result = resolvePlacement({
    anchor: at(180, 300),
    content: CONTENT,
    screen: SCREEN,
    insets: INSETS,
  })
  assert.equal(result.placement, 'bottom')
  assert.equal(result.top, 300 + 40 + 8)
})

test('auto flips above when there is no room below', () => {
  const result = resolvePlacement({
    anchor: at(180, 700),
    content: CONTENT,
    screen: SCREEN,
    insets: INSETS,
  })
  assert.equal(result.placement, 'top')
  assert.equal(result.top, 700 - 8 - 100)
})

test('an explicit side is kept when it fits', () => {
  const result = resolvePlacement({
    anchor: at(180, 400),
    content: CONTENT,
    screen: SCREEN,
    insets: INSETS,
    placement: 'top',
  })
  assert.equal(result.placement, 'top')
})

test('an explicit side flips when it does not fit and its opposite does', () => {
  const result = resolvePlacement({
    anchor: at(180, 60),
    content: CONTENT,
    screen: SCREEN,
    insets: INSETS,
    placement: 'top',
  })
  assert.equal(result.placement, 'bottom')
})

test('an explicit side is honoured when neither side fits', () => {
  // Flipping would not help, so the request stands and the clamp takes over
  const result = resolvePlacement({
    anchor: at(180, 300),
    content: { width: 200, height: 900 },
    screen: SCREEN,
    insets: INSETS,
    placement: 'top',
  })
  assert.equal(result.placement, 'top')
})

test('a bubble centred on the anchor is clamped inside the screen', () => {
  const left = resolvePlacement({
    anchor: at(4, 300),
    content: CONTENT,
    screen: SCREEN,
    insets: INSETS,
    margin: 8,
  })
  assert.equal(left.left, 8, 'cannot cross the left margin')

  const right = resolvePlacement({
    anchor: at(380, 300),
    content: CONTENT,
    screen: SCREEN,
    insets: INSETS,
    margin: 8,
  })
  assert.equal(right.left, 400 - 8 - 200, 'cannot cross the right margin')
})

test('safe-area insets are respected, not just the screen bounds', () => {
  const result = resolvePlacement({
    anchor: at(180, 100),
    content: CONTENT,
    screen: SCREEN,
    insets: { top: 120, right: 0, bottom: 34, left: 0 },
    placement: 'top',
  })
  // Above the anchor there is less room than the notch leaves, so it flips
  assert.equal(result.placement, 'bottom')
})

test('the arrow follows the anchor when the bubble is pushed aside', () => {
  const result = resolvePlacement({
    anchor: at(4, 300),
    content: CONTENT,
    screen: SCREEN,
    insets: INSETS,
    margin: 8,
    arrowSize: 8,
    cornerRadius: 12,
  })
  // The anchor's centre is at x=24, the bubble starts at x=8
  assert.equal(result.arrowOffset, 20)
})

test('the arrow never slides onto a rounded corner', () => {
  const far = resolvePlacement({
    anchor: at(380, 300),
    content: CONTENT,
    screen: SCREEN,
    insets: INSETS,
    arrowSize: 8,
    cornerRadius: 12,
  })
  assert.ok(far.arrowOffset <= 200 - 20, `was ${far.arrowOffset}`)
  assert.ok(far.arrowOffset >= 20, `was ${far.arrowOffset}`)
})

test('a bubble wider than the screen still starts inside it', () => {
  const result = resolvePlacement({
    anchor: at(180, 300),
    content: { width: 500, height: 100 },
    screen: SCREEN,
    insets: INSETS,
    margin: 8,
  })
  // The clamp would invert here, and an inverted clamp walks off the far edge
  assert.equal(result.left, 8)
})

test('side placement centres on the anchor and offsets across', () => {
  const result = resolvePlacement({
    anchor: at(40, 400),
    content: { width: 120, height: 60 },
    screen: SCREEN,
    insets: INSETS,
    placement: 'right',
    offset: 10,
  })
  assert.equal(result.placement, 'right')
  assert.equal(result.left, 40 + 40 + 10)
  assert.equal(result.top, 400 + 20 - 30)
})

test('a side placement flips to the other side when it would fall off', () => {
  const result = resolvePlacement({
    anchor: at(340, 400),
    content: { width: 200, height: 60 },
    screen: SCREEN,
    insets: INSETS,
    placement: 'right',
  })
  assert.equal(result.placement, 'left')
})

test('auto falls back to the roomiest side when nothing fits', () => {
  const result = resolvePlacement({
    anchor: at(180, 380, 40, 40),
    content: { width: 380, height: 700 },
    screen: SCREEN,
    insets: INSETS,
  })
  // Below the anchor has the most room, even though it is not enough
  assert.equal(result.placement, 'bottom')
  assert.ok(result.top >= INSETS.top + 8)
})

console.log(`placement: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
