/**
 * Validation tests.
 *
 * The interesting cases are the ones where "empty" is ambiguous, and where a
 * regex quietly behaves differently the second time it is called.
 */
import assert from 'node:assert/strict'

import {
  countCharacters,
  email,
  hasErrors,
  matches,
  maxLength,
  minLength,
  numeric,
  pattern,
  range,
  required,
  validate,
  validateAll,
} from '../src/utils/validate.ts'

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

const REQUIRED = required('needed')

test('required rejects blank strings, including whitespace', () => {
  assert.equal(REQUIRED(''), 'needed')
  assert.equal(REQUIRED('   '), 'needed')
  assert.equal(REQUIRED(null), 'needed')
  assert.equal(REQUIRED(undefined), 'needed')
  assert.equal(REQUIRED('a'), null)
})

test('an unticked box is missing, a quantity of zero is not', () => {
  // Treating them the same is how a form demands that someone order at least one
  assert.equal(REQUIRED(false), 'needed')
  assert.equal(REQUIRED(true), null)
  assert.equal(REQUIRED(0), null)
})

test('required rejects an empty list', () => {
  assert.equal(REQUIRED([]), 'needed')
  assert.equal(REQUIRED(['one']), null)
})

test('lengths count what a person would count', () => {
  const rule = minLength(2, 'short')
  assert.equal(rule('ab'), null)
  assert.equal(rule('a'), 'short')
  assert.equal(maxLength(2, 'long')('abc'), 'long')

  // .length says four, Array.from says two, a person says one
  assert.equal(countCharacters('👍🏽'), 1)
  assert.equal(rule('👍🏽'), 'short')
  assert.equal(minLength(1, 'short')('👍🏽'), null)

  assert.equal(countCharacters(''), 0)
  assert.equal(countCharacters('merhaba'), 7)
  assert.equal(countCharacters('ışık'), 4, 'every alphabet counts plainly')
})

test('a global regex does not start failing every other call', () => {
  const rule = pattern(/\d+/g, 'digits')
  assert.equal(rule('123'), null)
  assert.equal(rule('123'), null, 'lastIndex would have broken this one')
  assert.equal(rule('abc'), 'digits')
})

test('email is loose on purpose', () => {
  const rule = email('bad address')
  assert.equal(rule('ada@example.com'), null)
  assert.equal(rule('ada+tag@example.co.uk'), null)
  assert.equal(rule('ada@örnek.com'), null, 'non-Latin domains are real')
  assert.equal(rule('ada'), 'bad address')
  assert.equal(rule('ada@'), 'bad address')
  assert.equal(rule('ada@example'), 'bad address')
  assert.equal(rule('two words@example.com'), 'bad address')
})

test('numbers and ranges', () => {
  assert.equal(numeric('nan')('42'), null)
  assert.equal(numeric('nan')('-3.5'), null)
  assert.equal(numeric('nan')('4a'), 'nan')
  assert.equal(range(1, 10, 'out')('5'), null)
  assert.equal(range(1, 10, 'out')(11), 'out')
  assert.equal(range(1, 10, 'out')('abc'), 'out')
})

test('matches reads the other field at check time', () => {
  let other = 'first'
  const rule = matches(() => other, 'mismatch')
  assert.equal(rule('first'), null)
  other = 'changed'
  assert.equal(rule('first'), 'mismatch', 'not captured when the rule was built')
})

test('the first failing rule wins', () => {
  const message = validate('', [required('needed'), minLength(5, 'short')])
  assert.equal(message, 'needed', 'one complaint at a time')
  assert.equal(validate('ab', [required('needed'), minLength(5, 'short')]), 'short')
  assert.equal(validate('abcdef', [required('needed'), minLength(5, 'short')]), null)
  assert.equal(validate('anything'), null, 'no rules, no complaints')
})

test('validateAll reports one message per field', () => {
  const errors = validateAll(
    { name: '', email: 'nope', age: '30' },
    { name: [required('needed')], email: [email('bad')], age: [numeric('nan')] },
  )
  assert.deepEqual(errors, { name: 'needed', email: 'bad', age: null })
  assert.equal(hasErrors(errors), true)
  assert.equal(hasErrors({ a: null, b: null }), false)
})

console.log(`validate: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
