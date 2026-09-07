/**
 * Column width tests.
 *
 * The cases are the ones a phone hits constantly: not enough room, a table
 * that has not been measured yet, and a column that must not be squeezed.
 */
import assert from 'node:assert/strict'

import { overflowsRow, resolveColumnWidths } from '../src/utils/table.ts'

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

test('fixed columns keep their width', () => {
  assert.deepEqual(resolveColumnWidths([{ width: 80 }, { width: 120 }], 400), [80, 120])
  // Even when that overflows - scrolling beats squeezing
  assert.deepEqual(resolveColumnWidths([{ width: 300 }, { width: 300 }], 400), [300, 300])
})

test('flexible columns share what is left', () => {
  assert.deepEqual(resolveColumnWidths([{ flex: 1 }, { flex: 1 }], 400), [200, 200])
  assert.deepEqual(resolveColumnWidths([{ flex: 3 }, { flex: 1 }], 400), [300, 100])
  // An omitted flex counts as one
  assert.deepEqual(resolveColumnWidths([{}, {}], 400), [200, 200])
})

test('fixed and flexible mix', () => {
  assert.deepEqual(resolveColumnWidths([{ width: 100 }, { flex: 1 }, { flex: 1 }], 500), [100, 200, 200])
})

test('a flexible column is never squeezed below its minimum', () => {
  const widths = resolveColumnWidths([{ flex: 1 }, { flex: 1 }, { flex: 1 }], 120, 96)
  assert.deepEqual(widths, [96, 96, 96], 'the table will scroll instead')
  assert.deepEqual(resolveColumnWidths([{ flex: 1, minWidth: 200 }], 100), [200])
})

test('an unmeasured table gives every flexible column its minimum', () => {
  // Guessing wide and correcting on layout looks like the table jumped
  assert.deepEqual(resolveColumnWidths([{ flex: 1 }, { flex: 2 }], 0, 80), [80, 80])
  assert.deepEqual(resolveColumnWidths([{ width: 50 }, { flex: 1 }], 0, 80), [50, 80])
})

test('fixed columns wider than the table leave nothing to share', () => {
  assert.deepEqual(resolveColumnWidths([{ width: 500 }, { flex: 1 }], 400, 90), [500, 90])
})

test('no columns, no widths', () => {
  assert.deepEqual(resolveColumnWidths([], 400), [])
  assert.equal(overflowsRow([], 400), false)
})

test('overflow is what decides whether the row scrolls', () => {
  assert.equal(overflowsRow([100, 100], 400), false)
  assert.equal(overflowsRow([300, 300], 400), true)
  assert.equal(overflowsRow([200, 200], 400), false, 'an exact fit does not scroll')
  assert.equal(overflowsRow([100], 0), true, 'nor does an unmeasured row claim to fit')
})

console.log(`table: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
