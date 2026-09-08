/**
 * Reordering tests.
 *
 * The rounding is the interesting part: a swap that waits until a row has been
 * dragged a full row past means the picture on screen disagrees with where the
 * item will land, for half of every step.
 */
import assert from 'node:assert/strict'

import { moveItem, restingOffset, slotShift, targetIndex } from '../src/utils/reorder.ts'

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

const LIST = ['a', 'b', 'c', 'd', 'e']
const H = 60

test('an item moves and everything else closes up behind it', () => {
  assert.deepEqual(moveItem(LIST, 0, 2), ['b', 'c', 'a', 'd', 'e'])
  assert.deepEqual(moveItem(LIST, 4, 0), ['e', 'a', 'b', 'c', 'd'])
  assert.deepEqual(moveItem(LIST, 1, 2), ['a', 'c', 'b', 'd', 'e'])
})

test('the original list is never touched', () => {
  const before = [...LIST]
  moveItem(LIST, 0, 4)
  assert.deepEqual(LIST, before, 'a list held in state must not be mutated under it')
})

test('a move to nowhere is not a move', () => {
  assert.deepEqual(moveItem(LIST, 2, 2), LIST)
  assert.deepEqual(moveItem(LIST, -1, 2), LIST)
  assert.deepEqual(moveItem(LIST, 0, 9), LIST, 'and neither is one off the end')
  assert.deepEqual(moveItem([], 0, 0), [])
})

test('the swap happens as the centres cross, not a whole row later', () => {
  // Half a row down is already the next slot
  assert.equal(targetIndex(0, H * 0.6, H, 5), 1)
  assert.equal(targetIndex(0, H * 0.4, H, 5), 0, 'and just under half is not')
  assert.equal(targetIndex(2, -H * 0.6, H, 5), 1, 'the same going up')
})

test('a row cannot be dragged out of the list', () => {
  assert.equal(targetIndex(0, -H * 5, H, 5), 0)
  assert.equal(targetIndex(4, H * 5, H, 5), 4)
  assert.equal(targetIndex(2, H * 99, H, 5), 4)
})

test('an unmeasured row does not divide by zero', () => {
  // Height is zero for a frame after mount, and NaN as an index empties a list
  assert.equal(targetIndex(2, 120, 0, 5), 2)
  assert.equal(targetIndex(2, 120, H, 0), 0)
})

test('the gap opens ahead of the finger, downwards', () => {
  // Dragging a from 0 to 2: b and c come up one, d and e stay
  assert.equal(slotShift(0, 0, 2, H), 0, 'the dragged row is not shifted by this')
  assert.equal(slotShift(1, 0, 2, H), -H)
  assert.equal(slotShift(2, 0, 2, H), -H)
  assert.equal(slotShift(3, 0, 2, H), 0)
})

test('and upwards', () => {
  // Dragging e from 4 to 1: b, c and d go down one
  assert.equal(slotShift(4, 4, 1, H), 0)
  assert.equal(slotShift(1, 4, 1, H), H)
  assert.equal(slotShift(3, 4, 1, H), H)
  assert.equal(slotShift(0, 4, 1, H), 0)
})

test('nothing shifts when nothing has moved', () => {
  for (let index = 0; index < LIST.length; index += 1) {
    assert.equal(slotShift(index, 2, 2, H), 0, `row ${index} moved for no reason`)
  }
})

test('the shifts agree with the list they are illustrating', () => {
  // Every row that shifted must be one whose index actually changed
  for (const [from, to] of [[0, 3], [3, 0], [1, 2], [4, 2]]) {
    const after = moveItem(LIST, from, to)
    for (let index = 0; index < LIST.length; index += 1) {
      if (index === from) continue
      const shifted = slotShift(index, from, to, H) !== 0
      const changed = after.indexOf(LIST[index]) !== index
      assert.equal(shifted, changed, `row ${index} disagreed moving ${from} to ${to}`)
    }
  }
})

test('a dropped row settles where it landed, not where it began', () => {
  // Springing back and then re-laying-out shows the item in two places in two
  // frames, which reads as the drop having failed
  assert.equal(restingOffset(0, 2, H), 2 * H)
  assert.equal(restingOffset(4, 1, H), -3 * H)
  assert.equal(restingOffset(2, 2, H), 0)
})

console.log(`reorder: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
