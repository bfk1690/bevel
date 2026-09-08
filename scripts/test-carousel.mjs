/**
 * Carousel paging tests.
 *
 * Two of these were reported from a device before they were written down: a
 * carousel that stopped at the last slide instead of coming round, and a dot
 * row where paging through the middle of a long list looked like nothing was
 * happening. Both are arithmetic, and neither is visible in a screenshot.
 */
import assert from 'node:assert/strict'

import {
  dotWindow,
  loopCorrection,
  loopedIndex,
  loopedOffset,
  pageFromOffset,
} from '../src/utils/carousel.ts'

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

test('an offset lands on the nearest page', () => {
  assert.equal(pageFromOffset(0, 400, 5), 0)
  assert.equal(pageFromOffset(390, 400, 5), 1, 'nearly there counts as there')
  assert.equal(pageFromOffset(210, 400, 5), 1, 'and past the midpoint too')
  assert.equal(pageFromOffset(190, 400, 5), 0)
})

test('an offset can never name a page that is not there', () => {
  assert.equal(pageFromOffset(99999, 400, 5), 4)
  assert.equal(pageFromOffset(-200, 400, 5), 0, 'the bounce at the start is not page minus one')
})

test('an unmeasured pager reports a page, not NaN', () => {
  // Width is zero for one frame after mount, and NaN as a page index renders
  // an empty carousel that never recovers
  assert.equal(pageFromOffset(120, 0, 5), 0)
  assert.equal(pageFromOffset(120, 400, 0), 0)
})

test('the clones map back onto real pages', () => {
  const count = 4
  // The pager renders [last, 0, 1, 2, 3, first]
  assert.equal(loopedIndex(0, count), 3, 'the leading clone IS the last page')
  assert.equal(loopedIndex(1, count), 0)
  assert.equal(loopedIndex(4, count), 3)
  assert.equal(loopedIndex(5, count), 0, 'and the trailing clone is the first')
})

test('a real page knows where it sits among the clones', () => {
  assert.equal(loopedOffset(0), 1, 'page zero is second in the cloned list')
  assert.equal(loopedOffset(3), 4)
  // The two have to agree, or the pager lands one page off
  for (let index = 0; index < 6; index += 1) {
    assert.equal(loopedIndex(loopedOffset(index), 6), index, `round trip failed at ${index}`)
  }
})

test('landing on a clone asks for a silent jump, and only then', () => {
  const count = 4
  assert.equal(loopCorrection(0, count), count, 'the leading clone jumps to the real last page')
  assert.equal(loopCorrection(5, count), 1, 'the trailing clone jumps to the real first')
  assert.equal(loopCorrection(1, count), null, 'a real page needs nothing')
  assert.equal(loopCorrection(3, count), null)
})

test('the correction lands on the page the clone was showing', () => {
  const count = 4
  // Otherwise the seam is visible: the picture changes during the jump
  const leading = loopCorrection(0, count)
  assert.equal(loopedIndex(leading, count), loopedIndex(0, count))

  const trailing = loopCorrection(count + 1, count)
  assert.equal(loopedIndex(trailing, count), loopedIndex(count + 1, count))
})

test('an empty carousel does not loop anywhere', () => {
  assert.equal(loopedIndex(0, 0), 0)
  assert.equal(loopCorrection(0, 0), null)
  assert.deepEqual(dotWindow(0, 0), { start: 0, dots: [] })
})

test('few enough pages, and every dot is drawn at full size', () => {
  const { start, dots } = dotWindow(1, 4, 5)
  assert.equal(start, 0)
  assert.equal(dots.length, 4)
  assert.deepEqual(dots.map((dot) => dot.index), [0, 1, 2, 3])
  assert.ok(dots.every((dot) => dot.scale === 1), 'nothing is standing in for anything')
})

test('the active dot MOVES through the window', () => {
  // The reported bug: centring the window on the active page keeps the
  // highlight in the middle for ever while the indices shuffle underneath, so
  // paging through a long list looks like nothing is happening
  const count = 12
  let start = 0
  const positions = []

  for (let active = 0; active < count; active += 1) {
    const window = dotWindow(active, count, 5, start)
    start = window.start
    positions.push(window.dots.findIndex((dot) => dot.index === active))
  }

  assert.ok(positions.some((position) => position !== positions[0]), 'the highlight never moved')
  assert.ok(!positions.every((position) => position === 2), 'it sat in the middle the whole way')
})

test('the window only shifts when the active dot reaches its edge', () => {
  const count = 12

  // Sitting in the middle of the window moves nothing
  assert.equal(dotWindow(3, count, 5, 2).start, 2)
  assert.equal(dotWindow(4, count, 5, 2).start, 2)

  // Reaching the last drawn dot shifts by enough to keep one page of lookahead
  assert.equal(dotWindow(6, count, 5, 2).start, 3)
  // And the same going back
  assert.equal(dotWindow(2, count, 5, 2).start, 1)
})

test('the window never runs off either end', () => {
  const count = 12
  const max = 5

  const first = dotWindow(0, count, max, 0)
  assert.equal(first.start, 0)
  assert.equal(first.dots[0].index, 0)

  const last = dotWindow(count - 1, count, max, count)
  assert.equal(last.start, count - max)
  assert.equal(last.dots[max - 1].index, count - 1, 'the final page is drawn')

  // A start remembered from a longer list is not trusted blindly
  assert.equal(dotWindow(1, count, max, 99).start <= count - max, true)
})

test('the window always draws exactly as many dots as it may', () => {
  for (let active = 0; active < 12; active += 1) {
    const { dots } = dotWindow(active, 12, 5, 0)
    assert.equal(dots.length, 5, `drew ${dots.length} at ${active}`)
    assert.ok(dots.some((dot) => dot.index === active), 'the active page must be in the window')
  }
})

test('the small dots are the ones standing for pages off the end', () => {
  const middle = dotWindow(6, 12, 5, 4)
  // Both edges have more beyond them, so both shrink
  assert.ok(middle.dots[0].scale < 1)
  assert.ok(middle.dots[4].scale < 1)

  const atStart = dotWindow(0, 12, 5, 0)
  assert.equal(atStart.dots[0].scale, 1, 'nothing is hidden before the first page')
  assert.ok(atStart.dots[4].scale < 1)

  const atEnd = dotWindow(11, 12, 5, 7)
  assert.ok(atEnd.dots[0].scale < 1)
  assert.equal(atEnd.dots[4].scale, 1, 'nor after the last')
})

test('the active dot is always full size, wherever it sits', () => {
  // Swept with the window carried forward, the way it actually runs. Feeding
  // it a start that keeps the active dot in the middle would prove nothing:
  // the case that matters is the last page, which DOES sit on the window's
  // edge - and an edge dot is only shrunk when there is something past it
  const count = 12
  let start = 0
  for (let active = 0; active < count; active += 1) {
    const window = dotWindow(active, count, 5, start)
    start = window.start
    const current = window.dots.find((dot) => dot.index === active)
    assert.equal(current.scale, 1, `the active dot shrank at ${active}`)
  }

  for (let active = count - 1; active >= 0; active -= 1) {
    const window = dotWindow(active, count, 5, start)
    start = window.start
    const current = window.dots.find((dot) => dot.index === active)
    assert.equal(current.scale, 1, `the active dot shrank at ${active} on the way back`)
  }
})

console.log(`carousel: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
