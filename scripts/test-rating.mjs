/**
 * Rating and carousel paging tests.
 *
 * Both are small pieces of arithmetic whose mistakes are invisible until a
 * user cannot give one star, or a row of dots runs off the screen.
 */
import assert from 'node:assert/strict'

import { clampRating, ratingFromRatio, snapRating, starFill } from '../src/utils/rating.ts'
import { dotWindow, pageFromOffset } from '../src/utils/carousel.ts'

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

test('touching anywhere in the first star means one star', () => {
  // Rounding to nearest would make the left half of star one mean zero
  assert.equal(ratingFromRatio(0.01, 5), 1)
  assert.equal(ratingFromRatio(0.19, 5), 1)
  assert.equal(ratingFromRatio(0.21, 5), 2)
  assert.equal(ratingFromRatio(1, 5), 5)
})

test('only an untouched row is zero', () => {
  assert.equal(ratingFromRatio(0, 5), 0)
  assert.equal(ratingFromRatio(-1, 5), 0)
  assert.equal(ratingFromRatio(2, 5), 5)
})

test('half stars land on halves', () => {
  assert.equal(ratingFromRatio(0.05, 5, true), 0.5)
  assert.equal(ratingFromRatio(0.15, 5, true), 1)
  assert.equal(ratingFromRatio(0.25, 5, true), 1.5)
  assert.equal(ratingFromRatio(1, 5, true), 5)
})

test('each star knows how to draw itself', () => {
  assert.equal(starFill(0, 3), 'full')
  assert.equal(starFill(2, 3), 'full')
  assert.equal(starFill(3, 3), 'empty')
  assert.equal(starFill(3, 3.5), 'half')
  assert.equal(starFill(3, 3.9), 'half', 'a sliver still reads as half')
  assert.equal(starFill(3, 3.4), 'empty', 'and below the midpoint it reads as empty')
})

test('averages are snapped to what the row can draw', () => {
  assert.equal(snapRating(4.2, 5), 4)
  assert.equal(snapRating(4.6, 5), 5)
  assert.equal(snapRating(4.2, 5, true), 4)
  assert.equal(snapRating(4.3, 5, true), 4.5)
  assert.equal(snapRating(9, 5), 5)
  assert.equal(clampRating(-2, 5), 0)
})

test('a page is the nearest whole one', () => {
  assert.equal(pageFromOffset(0, 400, 4), 0)
  assert.equal(pageFromOffset(180, 400, 4), 0)
  assert.equal(pageFromOffset(220, 400, 4), 1)
  assert.equal(pageFromOffset(1600, 400, 4), 3, 'never past the last page')
  assert.equal(pageFromOffset(-40, 400, 4), 0, 'nor before the first')
})

test('an unmeasured pager reports the first page, not NaN', () => {
  assert.equal(pageFromOffset(120, 0, 4), 0)
  assert.equal(pageFromOffset(120, 400, 0), 0)
})

test('few pages get one dot each', () => {
  assert.deepEqual(
    dotWindow(1, 4, 5).map((dot) => dot.index),
    [0, 1, 2, 3],
  )
  assert.ok(dotWindow(1, 4, 5).every((dot) => dot.scale === 1))
  assert.deepEqual(dotWindow(0, 0, 5), [])
})

test('many pages get a window that follows the active one', () => {
  const start = dotWindow(0, 12, 5)
  assert.equal(start.length, 5)
  assert.deepEqual(start.map((dot) => dot.index), [0, 1, 2, 3, 4])

  const middle = dotWindow(6, 12, 5)
  assert.deepEqual(middle.map((dot) => dot.index), [4, 5, 6, 7, 8])

  const end = dotWindow(11, 12, 5)
  assert.deepEqual(end.map((dot) => dot.index), [7, 8, 9, 10, 11])
})

test('the window shrinks its dots only where more pages continue', () => {
  const start = dotWindow(0, 12, 5)
  assert.equal(start[0].scale, 1, 'the true first page stays full size')
  assert.equal(start[4].scale, 0.45, 'the far edge says there is more')

  const end = dotWindow(11, 12, 5)
  assert.equal(end[0].scale, 0.45)
  assert.equal(end[4].scale, 1, 'the true last page stays full size')

  const middle = dotWindow(6, 12, 5)
  assert.equal(middle[0].scale, 0.45)
  assert.equal(middle[1].scale, 0.7)
  assert.equal(middle[2].scale, 1)
})

console.log(`rating: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
