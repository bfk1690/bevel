/**
 * Relative time tests.
 *
 * The rounding is the part worth pinning: a timestamp that reads as being in
 * the future because forty seconds was called a minute is a bug people report
 * as "the clock is wrong".
 */
import assert from 'node:assert/strict'

import { formatRelative, relativeTickMs } from '../src/utils/relative.ts'

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

const NOW = Date.UTC(2026, 8, 7, 12, 0, 0)
const ago = (ms) => new Date(NOW - ms)
const ahead = (ms) => new Date(NOW + ms)

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

test('a moment ago is not counted out in seconds', () => {
  assert.equal(formatRelative(ago(0), { now: NOW }), 'just now')
  assert.equal(formatRelative(ago(20 * SECOND), { now: NOW }), 'just now')
  assert.equal(formatRelative(ahead(10 * SECOND), { now: NOW }), 'just now', 'and neither is a moment away')
  assert.notEqual(formatRelative(ago(50 * SECOND), { now: NOW }), 'just now', 'past the window it is')
})

test('the gap is named in the largest unit that fits', () => {
  assert.match(formatRelative(ago(3 * MINUTE), { now: NOW, locale: 'en' }), /3 minutes ago/)
  assert.match(formatRelative(ago(2 * HOUR), { now: NOW, locale: 'en' }), /2 hours ago/)
  assert.match(formatRelative(ago(3 * DAY), { now: NOW, locale: 'en' }), /3 days ago/)
})

test('rounding never pushes the past into the future', () => {
  // Forty seconds is not a minute. Rounding up prints "in 1 minute" for
  // something that already happened
  const label = formatRelative(ago(58 * SECOND), { now: NOW, locale: 'en' })
  assert.ok(!label.includes('in '), `looked like the future: ${label}`)
  assert.match(label, /second/)

  const hour = formatRelative(ago(HOUR + 59 * MINUTE), { now: NOW, locale: 'en' })
  assert.match(hour, /1 hour ago/, 'and an hour and a half is still one hour')
})

test('what is coming reads as coming', () => {
  assert.match(formatRelative(ahead(5 * MINUTE), { now: NOW, locale: 'en' }), /in 5 minutes/)
  assert.match(formatRelative(ahead(2 * DAY), { now: NOW, locale: 'en' }), /in 2 days/)
})

test('old enough, and it becomes a date', () => {
  // "Fourteen days ago" makes the reader work out which Tuesday that was
  const old = formatRelative(ago(14 * DAY), { now: NOW, locale: 'en' })
  assert.ok(!old.includes('ago'), `still counting: ${old}`)
  assert.match(old, /2026/)

  assert.match(formatRelative(ago(6 * DAY), { now: NOW, locale: 'en' }), /days ago/, 'inside it, it counts')
})

test('the cutoff and the formatting can be taken over', () => {
  const stamped = formatRelative(ago(3 * DAY), {
    now: NOW,
    cutoffDays: 1,
    formatAbsolute: () => 'a Tuesday',
  })
  assert.equal(stamped, 'a Tuesday')

  assert.match(
    formatRelative(ago(400 * DAY), { now: NOW, cutoffDays: 0, locale: 'en' }),
    /days ago/,
    'and a zero cutoff keeps counting forever',
  )
})

test('nonsense in, nothing out', () => {
  assert.equal(formatRelative('not a date', { now: NOW }), '')
  assert.equal(relativeTickMs('not a date', { now: NOW }), null)
})

test('the tick is sized to the unit on screen', () => {
  assert.equal(relativeTickMs(ago(10 * SECOND), { now: NOW }), 5 * SECOND)
  assert.equal(relativeTickMs(ago(10 * MINUTE), { now: NOW }), 30 * SECOND)
  assert.equal(relativeTickMs(ago(10 * HOUR), { now: NOW }), 5 * MINUTE)
  assert.equal(relativeTickMs(ago(3 * DAY), { now: NOW }), HOUR)
})

test('a fixed date never needs redrawing', () => {
  // A list re-rendering every second to keep "3 days ago" honest spends a
  // frame a second on a string that changes twice a week
  assert.equal(relativeTickMs(ago(30 * DAY), { now: NOW }), null)
  assert.equal(relativeTickMs(ahead(30 * DAY), { now: NOW }), null)
})

console.log(`relative: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
