/**
 * Step flow tests.
 *
 * Mostly about one decision: the step you are on is not finished, so it does
 * not count towards the bar.
 */
import assert from 'node:assert/strict'

import { clampStep, shouldCompact, stepProgress, stepStatus } from '../src/utils/steps.ts'

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

test('a step is behind you, under you, or ahead', () => {
  assert.equal(stepStatus(0, 2), 'done')
  assert.equal(stepStatus(1, 2), 'done')
  assert.equal(stepStatus(2, 2), 'current')
  assert.equal(stepStatus(3, 2), 'upcoming')
})

test('a finished flow leaves no current step', () => {
  const count = 3
  // `current === count` is how a flow says it is over
  assert.equal(stepStatus(2, count), 'done')
  assert.equal(stepProgress(count, count), 1)
})

test('the bar counts what is behind you, not what you are looking at', () => {
  assert.equal(stepProgress(0, 4), 0, 'the first screen has nothing behind it')
  assert.equal(stepProgress(2, 4), 0.5)
  // Still on the last screen: it is not finished until the flow says so
  assert.equal(stepProgress(3, 4), 0.75)
  assert.equal(stepProgress(4, 4), 1)
})

test('nothing goes out of the flow', () => {
  assert.equal(clampStep(-3, 4), 0)
  assert.equal(clampStep(9, 4), 4)
  assert.equal(clampStep(1.7, 4), 1, 'and a fraction is not a step')
  assert.equal(clampStep(2, 0), 0, 'an empty flow has nowhere to be')
  assert.equal(stepProgress(2, 0), 0)
})

test('past a handful, the markers stop being worth drawing', () => {
  // Seven labelled markers on a phone leaves each label two truncated words
  assert.equal(shouldCompact(4), false)
  assert.equal(shouldCompact(5), false)
  assert.equal(shouldCompact(6), true)

  assert.equal(shouldCompact(3, 2), true, 'the threshold moves')
  assert.equal(shouldCompact(1, 0), true, 'and zero means always')
})

console.log(`steps: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
