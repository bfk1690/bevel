/**
 * Grid tests.
 *
 * The rounding is the point: percentage widths in a wrapping row round
 * independently, and three items of 33.33% can total 100.01% - which drops the
 * third onto its own line on some screens and not others.
 */
import assert from 'node:assert/strict'

import { resolveGrid, rowsOf } from '../src/utils/grid.ts'

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

test('columns come from what actually fits', () => {
  assert.equal(resolveGrid({ width: 360, minItemWidth: 100, gap: 8 }).columns, 3)
  assert.equal(resolveGrid({ width: 360, minItemWidth: 170, gap: 8 }).columns, 2)
  assert.equal(resolveGrid({ width: 360, minItemWidth: 400, gap: 8 }).columns, 1, 'never zero')
})

test('the row adds up exactly', () => {
  for (const width of [320, 360, 390, 428, 744]) {
    const { columns, itemWidth, gap } = resolveGrid({ width, minItemWidth: 110, gap: 10 })
    const total = itemWidth * columns + gap * (columns - 1)
    assert.ok(Math.abs(total - width) < 0.001, `${width} came to ${total}`)
  }
})

test('the gap is counted, not assumed away', () => {
  // Two 100pt items and one 8pt gap need 208. A point short is one column,
  // which is the whole reason the gap cannot be left out of the division
  assert.equal(resolveGrid({ width: 208, minItemWidth: 100, gap: 8 }).columns, 2)
  assert.equal(resolveGrid({ width: 207, minItemWidth: 100, gap: 8 }).columns, 1)
  assert.equal(resolveGrid({ width: 200, minItemWidth: 100, gap: 0 }).columns, 2, 'no gap, no shortfall')
})

test('a ceiling holds on a wide screen', () => {
  const wide = resolveGrid({ width: 1200, minItemWidth: 100, maxColumns: 4 })
  assert.equal(wide.columns, 4)
  assert.ok(wide.itemWidth > 100, 'and the items take the extra room')
})

test('a fixed count ignores what would have fitted', () => {
  assert.equal(resolveGrid({ width: 360, minItemWidth: 300, columns: 3 }).columns, 3)
  assert.equal(resolveGrid({ width: 360, columns: 0 }).columns, 1, 'but not below one')
})

test('an unmeasured grid answers one column and no width', () => {
  // The first frame has nothing to divide up. NaN here becomes an invisible
  // list rather than a visible error
  const empty = resolveGrid({ width: 0 })
  assert.equal(empty.columns, 1)
  assert.equal(empty.itemWidth, 0)
  assert.ok(Number.isFinite(resolveGrid({ width: Number.NaN }).itemWidth))
})

test('rows keep their order and their remainder', () => {
  assert.deepEqual(rowsOf([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]])
  assert.deepEqual(rowsOf([1, 2, 3], 3), [[1, 2, 3]])
  assert.deepEqual(rowsOf([], 3), [])
  assert.deepEqual(rowsOf([1, 2], 0), [[1], [2]], 'a zero-wide row would never end')
})

console.log(`grid: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
