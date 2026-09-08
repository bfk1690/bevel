/**
 * Stat tests.
 *
 * The one that matters: painting every rise green is the most common lie a
 * dashboard tells.
 */
import assert from 'node:assert/strict'

import {
  deltaDirection,
  deltaVerdict,
  formatDelta,
  percentChange,
} from '../src/utils/stat.ts'

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

test('which way it went', () => {
  assert.equal(deltaDirection(4), 'up')
  assert.equal(deltaDirection(-4), 'down')
  assert.equal(deltaDirection(0), 'flat', 'no change is not a rise')
})

test('up is not the same as good', () => {
  // Response time, error rate, cost per order and churn all get worse going up
  assert.equal(deltaVerdict(12, 'up'), 'good')
  assert.equal(deltaVerdict(12, 'down'), 'bad')
  assert.equal(deltaVerdict(-12, 'down'), 'good')
  assert.equal(deltaVerdict(-12, 'up'), 'bad')
})

test('a metric that has not said which way it wants is left alone', () => {
  // Our opinion of an unlabelled number is the thing that is neutral, not the
  // number
  assert.equal(deltaVerdict(50), 'neutral')
  assert.equal(deltaVerdict(-50), 'neutral')
  assert.equal(deltaVerdict(0, 'up'), 'neutral', 'and standing still is nobody winning')
})

test('the sign is always shown, plus included', () => {
  // +12 and 12 in the same column read as different kinds of number
  assert.equal(formatDelta(12), '+12')
  assert.equal(formatDelta(-12), '−12')
  assert.equal(formatDelta(0), '0')
})

test('percentages carry a decimal, absolutes do not', () => {
  assert.equal(formatDelta(12.34, { percent: true }), '+12.3%')
  assert.equal(formatDelta(12.34), '+12')
  assert.equal(formatDelta(12.34, { precision: 2 }), '+12.34')
})

test('nonsense in, nothing out', () => {
  assert.equal(formatDelta(Number.NaN), '')
  assert.equal(formatDelta(Number.POSITIVE_INFINITY), '')
})

test('a rise from nothing is not a percentage', () => {
  // "+Infinity%" is worse than printing nothing at all
  assert.equal(percentChange(0, 40), null)
  assert.equal(percentChange(Number.NaN, 40), null)
})

test('a change against a real figure is', () => {
  assert.equal(percentChange(200, 250), 25)
  assert.equal(percentChange(200, 150), -25)
  assert.equal(percentChange(200, 200), 0)
})

test('a rise off a negative figure is still a rise', () => {
  // Dividing by the signed value flips the sign and reports an improvement as
  // a collapse
  const climbing = percentChange(-100, -50)
  assert.ok(climbing > 0, `moving from -100 to -50 reported ${climbing}`)
})

console.log(`stat: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
