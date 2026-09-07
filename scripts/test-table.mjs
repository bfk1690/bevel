/**
 * Column width tests.
 *
 * The cases are the ones a phone hits constantly: not enough room, a table
 * that has not been measured yet, and a column that must not be squeezed.
 */
import assert from 'node:assert/strict'

import {
  compareValues,
  nextSort,
  overflowsRow,
  resolveColumnWidths,
  sortRows,
} from '../src/utils/table.ts'

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

test('a header cycles through ascending, descending and off', () => {
  // The third press is the one people expect and almost nobody implements
  const first = nextSort(null, 'name')
  assert.deepEqual(first, { key: 'name', direction: 'asc' })
  const second = nextSort(first, 'name')
  assert.deepEqual(second, { key: 'name', direction: 'desc' })
  assert.equal(nextSort(second, 'name'), null, 'back to the order it arrived in')
})

test('pressing a different header starts that column over', () => {
  const sorted = { key: 'name', direction: 'desc' }
  assert.deepEqual(nextSort(sorted, 'total'), { key: 'total', direction: 'asc' })
})

test('numbers inside text sort as numbers', () => {
  // Plain string comparison is why a list of order numbers comes out shuffled
  assert.ok(compareValues('9', '10') < 0)
  assert.ok(compareValues('HJ-9', 'HJ-10') < 0)
  assert.ok(compareValues('item 2', 'item 11') < 0)
  assert.equal(compareValues('same', 'same'), 0)
})

test('sorting never touches the array it was given', () => {
  const rows = [{ n: 'b' }, { n: 'a' }, { n: 'c' }]
  const sorted = sortRows(rows, { key: 'n', direction: 'asc' }, (row) => row.n)
  assert.deepEqual(sorted.map((row) => row.n), ['a', 'b', 'c'])
  assert.deepEqual(rows.map((row) => row.n), ['b', 'a', 'c'], 'the original order survives')
})

test('turning sorting off gives the original order back', () => {
  const rows = [{ n: 'b' }, { n: 'a' }]
  const same = sortRows(rows, null, (row) => row.n)
  assert.deepEqual(same.map((row) => row.n), ['b', 'a'])
  assert.notEqual(same, rows, 'still a copy')
})

test('descending is ascending, reversed', () => {
  const rows = [{ n: '2' }, { n: '10' }, { n: '1' }]
  const down = sortRows(rows, { key: 'n', direction: 'desc' }, (row) => row.n)
  assert.deepEqual(down.map((row) => row.n), ['10', '2', '1'])
})

test('a column can bring its own comparator', () => {
  const rows = [{ size: 'large' }, { size: 'small' }, { size: 'medium' }]
  const order = ['small', 'medium', 'large']
  const sorted = sortRows(
    rows,
    { key: 'size', direction: 'asc' },
    (row) => row.size,
    () => (a, b) => order.indexOf(a.size) - order.indexOf(b.size),
  )
  assert.deepEqual(sorted.map((row) => row.size), ['small', 'medium', 'large'])
})

console.log(`table: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
