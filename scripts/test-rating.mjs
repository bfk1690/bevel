/**
 * Rating and carousel paging tests.
 *
 * Both are small pieces of arithmetic whose mistakes are invisible until a
 * user cannot give one star, or a row of dots runs off the screen.
 */
import assert from 'node:assert/strict'

import { clampRating, ratingFromRatio, snapRating, starFill } from '../src/utils/rating.ts'
import {
  dotWindow,
  loopCorrection,
  loopedIndex,
  loopedOffset,
  pageFromOffset,
} from '../src/utils/carousel.ts'

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
  const { dots } = dotWindow(1, 4, 5)
  assert.deepEqual(dots.map((dot) => dot.index), [0, 1, 2, 3])
  assert.ok(dots.every((dot) => dot.scale === 1))
  assert.deepEqual(dotWindow(0, 0, 5).dots, [])
})

test('the active dot travels through the window instead of sitting in it', () => {
  // Centring the window every time pins the highlight in the middle, and
  // paging through a long list then looks like nothing is happening.
  let start = 0
  const positions = []
  for (let active = 0; active < 8; active += 1) {
    const window = dotWindow(active, 12, 5, start)
    start = window.start
    positions.push(window.dots.findIndex((dot) => dot.index === active))
  }
  assert.deepEqual(positions.slice(0, 4), [0, 1, 2, 3], 'it moves across at first')
  assert.ok(new Set(positions).size > 1, 'and never freezes in one place')
})

test('the window only shifts once the active page reaches its edge', () => {
  const first = dotWindow(2, 12, 5, 0)
  assert.equal(first.start, 0, 'still inside, so it holds still')

  const shifted = dotWindow(4, 12, 5, 0)
  assert.equal(shifted.start, 1, 'at the edge, so it moves by one')

  const back = dotWindow(1, 12, 5, 3)
  assert.equal(back.start, 0, 'and back the other way')
})

test('the window stops at both ends of the list', () => {
  assert.equal(dotWindow(0, 12, 5, 0).start, 0)
  assert.equal(dotWindow(11, 12, 5, 6).start, 7)
  assert.equal(dotWindow(11, 12, 5, 99).start, 7, 'a stale start is pulled back in')
})

test('edge dots shrink only where pages continue, and never the active one', () => {
  const middle = dotWindow(6, 12, 5, 4)
  assert.equal(middle.dots[0].scale, 0.45)
  assert.equal(middle.dots[1].scale, 0.7)
  assert.equal(middle.dots.find((dot) => dot.index === 6).scale, 1)

  const atStart = dotWindow(0, 12, 5, 0)
  assert.equal(atStart.dots[0].scale, 1, 'the true first page is not a stub')
  assert.equal(atStart.dots[4].scale, 0.45)

  const atEnd = dotWindow(11, 12, 5, 7)
  assert.equal(atEnd.dots[4].scale, 1, 'nor the true last one')
  assert.equal(atEnd.dots[0].scale, 0.45)
})

test('an endless pager maps its clones onto real pages', () => {
  // The pager renders [last, ...pages, first]
  assert.equal(loopedIndex(1, 4), 0)
  assert.equal(loopedIndex(4, 4), 3)
  assert.equal(loopedIndex(0, 4), 3, 'the clone before the start is the last page')
  assert.equal(loopedIndex(5, 4), 0, 'and the one after the end is the first')
  assert.equal(loopedOffset(0), 1)
  assert.equal(loopedOffset(3), 4)
})

test('landing on a clone asks for a silent jump to the real page', () => {
  assert.equal(loopCorrection(0, 4), 4, 'from the leading clone to the real last')
  assert.equal(loopCorrection(5, 4), 1, 'from the trailing clone to the real first')
  assert.equal(loopCorrection(2, 4), null, 'a real page needs no correction')
  assert.equal(loopCorrection(1, 4), null)
  assert.equal(loopCorrection(4, 4), null)
})

console.log(`rating: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
