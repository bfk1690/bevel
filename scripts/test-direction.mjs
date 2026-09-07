/**
 * Direction tests.
 *
 * Layout properties have `start` and `end` and flip on their own. Text
 * alignment does not, which is the only reason these helpers exist.
 */
import assert from 'node:assert/strict'

import { I18nManager } from './rn-stub.mjs'
import {
  isRTL,
  leadingAlign,
  leadingSide,
  trailingAlign,
  trailingSide,
} from '../src/theme/direction.ts'

let passed = 0
let failed = 0

function test(name, run) {
  try {
    I18nManager.isRTL = false
    run()
    passed += 1
  } catch (error) {
    failed += 1
    console.error(`  x ${name}\n    ${error.message}`)
  } finally {
    I18nManager.isRTL = false
  }
}

test('left to right is the ordinary case', () => {
  assert.equal(isRTL(), false)
  assert.equal(leadingAlign(), 'left')
  assert.equal(trailingAlign(), 'right')
  assert.equal(leadingSide(), 'left')
  assert.equal(trailingSide(), 'right')
})

test('right to left mirrors every one of them', () => {
  I18nManager.isRTL = true
  assert.equal(isRTL(), true)
  // A right-aligned value in Arabic sits where the line BEGINS, and reads as
  // a mistake
  assert.equal(leadingAlign(), 'right')
  assert.equal(trailingAlign(), 'left')
  assert.equal(leadingSide(), 'right')
  assert.equal(trailingSide(), 'left')
})

test('the setting is read at call time, not captured at import', () => {
  // A module evaluated during startup can run before the app has applied its
  // own setting, and a captured value would be wrong for the whole launch
  assert.equal(trailingAlign(), 'right')
  I18nManager.isRTL = true
  assert.equal(trailingAlign(), 'left', 'the same function, a different answer')
})

console.log(`direction: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
