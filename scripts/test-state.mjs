/**
 * View state tests.
 *
 * The precedence is the whole decision, so it is what gets asserted.
 */
import assert from 'node:assert/strict'

import { errorMessage, resolveViewState } from '../src/utils/state.ts'

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

test('nothing happening means the content', () => {
  assert.equal(resolveViewState({}), 'ready')
  assert.equal(resolveViewState({ loading: false, error: null, empty: false }), 'ready')
})

test('loading wins over an error it is busy clearing', () => {
  // Otherwise pressing "try again" looks like it did nothing
  assert.equal(resolveViewState({ loading: true, error: new Error('failed') }), 'loading')
  assert.equal(resolveViewState({ loading: true, empty: true }), 'loading')
})

test('an error wins over empty', () => {
  // "We could not load this" and "there is nothing here" are different
  // statements, and a failed request shown as empty is how someone concludes
  // their data is gone
  assert.equal(resolveViewState({ error: new Error('failed'), empty: true }), 'error')
  assert.equal(resolveViewState({ error: 'offline' }), 'error')
})

test('empty is only empty when it is said so', () => {
  assert.equal(resolveViewState({ empty: true }), 'empty')
  assert.equal(resolveViewState({ empty: false }), 'ready')
  assert.equal(resolveViewState({ error: false }), 'ready', 'false is not an error')
  assert.equal(resolveViewState({ error: 0 }), 'ready', 'nor is a zero')
  assert.equal(resolveViewState({ error: '' }), 'ready', 'nor a blank message')
  assert.equal(resolveViewState({ error: 'offline' }), 'error')
})

test('a message is pulled out of whatever was thrown', () => {
  assert.equal(errorMessage(new Error('Timed out'), 'fallback'), 'Timed out')
  assert.equal(errorMessage('Offline', 'fallback'), 'Offline')
  assert.equal(errorMessage({ message: 'Bad gateway' }, 'fallback'), 'Bad gateway')
  assert.equal(errorMessage(new Error('   '), 'fallback'), 'fallback', 'blank is not a message')
  assert.equal(errorMessage(null, 'fallback'), 'fallback')
  assert.equal(errorMessage({ code: 500 }, 'fallback'), 'fallback')
})

console.log(`state: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
