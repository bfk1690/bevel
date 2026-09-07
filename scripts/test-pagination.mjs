/**
 * Paging tests.
 *
 * The guard is the whole component: without it a list fetches its second page
 * twice and keeps asking for a page that does not exist.
 */
import assert from 'node:assert/strict'

import { appendPage, isLastPage, shouldLoadMore } from '../src/utils/pagination.ts'

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

test('a fresh list with more to come will load', () => {
  assert.equal(shouldLoadMore({}), true)
  assert.equal(shouldLoadMore({ hasMore: true }), true)
})

test('nothing loads while a request is in flight', () => {
  // onEndReached fires again on every scroll that keeps the end near
  assert.equal(shouldLoadMore({ loading: true }), false)
  assert.equal(shouldLoadMore({ loading: true, hasMore: true }), false)
})

test('the end of the data is the end of the requests', () => {
  assert.equal(shouldLoadMore({ hasMore: false }), false)
  assert.equal(shouldLoadMore({ hasMore: false, loading: false }), false)
})

test('a failed page does not retry itself', () => {
  // Scrolling near the end again would hammer a server that just said no, with
  // nothing on screen to say anything is being attempted
  assert.equal(shouldLoadMore({ error: new Error('offline') }), false)
  assert.equal(shouldLoadMore({ error: 'offline', hasMore: true }), false)
  assert.equal(shouldLoadMore({ error: null }), true, 'a cleared error unblocks it')
})

test('a list that has not been asked for anything yet waits', () => {
  assert.equal(shouldLoadMore({ ready: false }), false)
})

test('a repeated row is dropped rather than duplicated', () => {
  const current = [{ id: 'a' }, { id: 'b' }]
  const page = [{ id: 'b' }, { id: 'c' }]
  const merged = appendPage(current, page, (item) => item.id)
  assert.deepEqual(merged.map((item) => item.id), ['a', 'b', 'c'])
})

test('the copy already on screen is the one kept', () => {
  // Replacing it would redraw a row the user may be reading
  const current = [{ id: 'a', title: 'first' }]
  const page = [{ id: 'a', title: 'second' }]
  const merged = appendPage(current, page, (item) => item.id)
  assert.equal(merged.length, 1)
  assert.equal(merged[0].title, 'first')
})

test('appending never touches the list it was given', () => {
  const current = [{ id: 'a' }]
  const merged = appendPage(current, [{ id: 'b' }], (item) => item.id)
  assert.equal(current.length, 1)
  assert.equal(merged.length, 2)
})

test('duplicates inside one page are dropped too', () => {
  const merged = appendPage([], [{ id: 'a' }, { id: 'a' }, { id: 'b' }], (item) => item.id)
  assert.deepEqual(merged.map((item) => item.id), ['a', 'b'])
})

test('a short page is the last one', () => {
  assert.equal(isLastPage(20, 20), false)
  assert.equal(isLastPage(19, 20), true)
  assert.equal(isLastPage(0, 20), true)
  assert.equal(isLastPage(5, 0), true, 'a page size of zero can only be the end')
})

console.log(`pagination: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
