/**
 * Chart tests.
 *
 * One rule carries most of these: the scale starts at zero. Cutting the axis
 * is the single most common way a chart lies, and a component cannot know when
 * doing it would be honest.
 */
import assert from 'node:assert/strict'

import { niceCeiling, scaleBars } from '../src/utils/chart.ts'

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

test('bars are shares of the tallest, measured from zero', () => {
  const { bars, max } = scaleBars({ values: [5, 10], nice: false })
  assert.equal(max, 10)
  assert.equal(bars[0].ratio, 0.5)
  assert.equal(bars[1].ratio, 1)
})

test('the axis is never cut', () => {
  // Starting the scale near the smallest value turns a 3% difference into a
  // doubling on screen
  const { bars } = scaleBars({ values: [97, 100], nice: false })
  assert.ok(bars[0].ratio > 0.9, `a 3% gap was drawn as ${(1 - bars[0].ratio) * 100}%`)
  assert.ok(bars[0].ratio < 1)
})

test('an empty plot is empty, not full', () => {
  // Dividing by a zero ceiling would make every bar the tallest
  const { bars, max } = scaleBars({ values: [0, 0, 0] })
  assert.equal(max, 0)
  assert.ok(bars.every((bar) => bar.ratio === 0))
  assert.deepEqual(scaleBars({ values: [] }).bars, [])
})

test('nonsense does not become a bar', () => {
  const { bars } = scaleBars({ values: [10, Number.NaN, Number.POSITIVE_INFINITY], nice: false })
  assert.equal(bars[1].ratio, 0)
  assert.equal(bars[2].ratio, 0)
  assert.equal(bars[0].ratio, 1, 'and it does not drag the scale up with it')
})

test('negatives are clamped, not drawn upside down', () => {
  // Bars going both ways need an axis line and a label convention; doing half
  // of that silently is worse than not doing it
  const { bars } = scaleBars({ values: [-5, 10], nice: false })
  assert.equal(bars[0].ratio, 0)
  assert.ok(bars[0].ratio >= 0)
})

test('the top rounds to a figure people read without thinking', () => {
  assert.equal(niceCeiling(8437), 10000)
  assert.equal(niceCeiling(1400), 2000)
  assert.equal(niceCeiling(2300), 2500)
  assert.equal(niceCeiling(4600), 5000)
  assert.equal(niceCeiling(1000), 1000, 'a round number is already round')
})

test('rounding the top never hides a bar', () => {
  for (const values of [[8437], [3, 7, 11], [0.4, 0.9], [999999]]) {
    const { bars, max } = scaleBars({ values })
    const highest = Math.max(...values)
    assert.ok(max >= highest, `${max} cannot hold ${highest}`)
    assert.ok(bars.every((bar) => bar.ratio <= 1))
  }
})

test('a fixed maximum holds two charts to one scale', () => {
  // Two charts side by side with their own scales invite a comparison that is
  // not there
  const left = scaleBars({ values: [5], max: 100 })
  const right = scaleBars({ values: [50], max: 100 })
  assert.equal(left.bars[0].ratio, 0.05)
  assert.equal(right.bars[0].ratio, 0.5)
})

test('a fixed maximum below the data still draws honestly', () => {
  const { bars } = scaleBars({ values: [150], max: 100 })
  assert.ok(bars[0].ratio > 1, 'the caller asked for it and can clip it')
})

console.log(`chart: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
