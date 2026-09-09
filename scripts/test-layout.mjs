/**
 * Responsive layout tests.
 *
 * Written because two apps had each rolled their own orientation handling, and
 * because a whole class of landscape bug had just been fixed in the kit: it
 * had no idea a window could be wider than it is tall.
 */
import assert from 'node:assert/strict'

import { breakpointFor, orientationFor, pickResponsive } from '../src/utils/layout.ts'

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

test('a phone is compact, a tablet is not', () => {
  assert.equal(breakpointFor(393), 'compact')
  assert.equal(breakpointFor(430), 'compact')
  assert.equal(breakpointFor(834), 'medium')
  assert.equal(breakpointFor(1024), 'expanded')
})

test('the boundaries belong to the wider name', () => {
  assert.equal(breakpointFor(599), 'compact')
  assert.equal(breakpointFor(600), 'medium')
  assert.equal(breakpointFor(999), 'medium')
  assert.equal(breakpointFor(1000), 'expanded')
})

test('an unmeasured window is compact', () => {
  // The narrow answer fits in a wide space; the wide one does not fit in a
  // narrow one, so guessing narrow is the guess that cannot overflow
  assert.equal(breakpointFor(0), 'compact')
  assert.equal(breakpointFor(Number.NaN), 'compact')
})

test('orientation is the window, not the device', () => {
  // A phone lying flat has an orientation and no useful shape; an app in a
  // split view is portrait-shaped on a landscape tablet
  assert.equal(orientationFor(393, 852), 'portrait')
  assert.equal(orientationFor(852, 393), 'landscape')
  assert.equal(orientationFor(500, 500), 'portrait', 'square is not landscape')
})

test('a value falls DOWN the scale, never up', () => {
  const columns = { compact: 1, expanded: 3 }
  assert.equal(pickResponsive(columns, 'compact'), 1)
  assert.equal(pickResponsive(columns, 'medium'), 1, 'medium takes the compact answer')
  assert.equal(pickResponsive(columns, 'expanded'), 3)
})

test('falling upwards would overflow the screen', () => {
  // Only `expanded` given: a phone must NOT be handed the three-column layout
  assert.equal(pickResponsive({ expanded: 3 }, 'compact'), undefined)
  assert.equal(pickResponsive({ expanded: 3 }, 'medium'), undefined)
})

test('nothing named is nothing returned', () => {
  assert.equal(pickResponsive({}, 'expanded'), undefined)
})

test('a falsy value is still a value', () => {
  // `0` columns or `false` is an answer somebody wrote down on purpose
  assert.equal(pickResponsive({ compact: 0 }, 'expanded'), 0)
  assert.equal(pickResponsive({ compact: false }, 'medium'), false)
})

console.log(`layout: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
