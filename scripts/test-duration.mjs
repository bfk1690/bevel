/**
 * Duration tests.
 *
 * Two decisions worth pinning: a countdown rounds seconds up, and its ticks
 * aim at the next second boundary rather than counting 1000ms at a time.
 */
import assert from 'node:assert/strict'

import {
  durationParts,
  formatDuration,
  nextSecondIn,
  remaining,
} from '../src/utils/duration.ts'

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

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

test('seconds round up, so a running timer never shows zero', () => {
  // 900ms left is not zero. Rounding down parks the display on 0 for a second
  assert.equal(durationParts(900).seconds, 1)
  assert.equal(formatDuration(900), '00:01')
  assert.equal(formatDuration(0), '00:00', 'and zero is zero')
  assert.equal(formatDuration(-500), '00:00', 'as is anything past it')
})

test('rounding up carries all the way', () => {
  // 59.4 seconds is a minute once rounded, not 0:60
  const parts = durationParts(59 * SECOND + 400)
  assert.equal(parts.minutes, 1)
  assert.equal(parts.seconds, 0)
  assert.equal(formatDuration(59 * SECOND + 400), '01:00')
})

test('the clock only grows a field when it needs one', () => {
  assert.equal(formatDuration(90 * SECOND), '01:30')
  assert.equal(formatDuration(HOUR + 5 * MINUTE), '01:05:00')
  assert.equal(formatDuration(30 * SECOND, { showHours: true }), '00:00:30')
})

test('days are printed, or rolled into the hours', () => {
  assert.equal(formatDuration(2 * DAY + 3 * HOUR), '2d 03:00:00')
  assert.equal(formatDuration(2 * DAY + 3 * HOUR, { hideDays: true }), '51:00:00')
})

test('the compact form is for reading once, not watching', () => {
  assert.equal(formatDuration(2 * DAY + 3 * HOUR, { style: 'compact' }), '2d 3h')
  assert.equal(formatDuration(HOUR + 23 * MINUTE, { style: 'compact' }), '1h 23m')
  assert.equal(formatDuration(90 * SECOND, { style: 'compact' }), '1m 30s')
  assert.equal(formatDuration(9 * SECOND, { style: 'compact' }), '9s')
})

test('what is left is never negative', () => {
  const now = Date.UTC(2026, 8, 7, 12, 0, 0)
  assert.equal(remaining(now + 5 * SECOND, now), 5 * SECOND)
  assert.equal(remaining(now - 5 * SECOND, now), 0)
  assert.equal(remaining(new Date(now + MINUTE), now), MINUTE)
  assert.equal(remaining(Number.NaN, now), 0)
})

test('ticks aim at the second boundary, not 1000ms later', () => {
  // On a plain interval each tick is a little late, the error accumulates, and
  // a whole second eventually disappears from the display
  assert.equal(nextSecondIn(5400), 400)
  assert.equal(nextSecondIn(5001), 1)
  assert.equal(nextSecondIn(5000), 1000, 'exactly on the boundary waits a full second')
  assert.equal(nextSecondIn(0), 1000)
  assert.equal(nextSecondIn(-20), 1000)
})

console.log(`duration: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
