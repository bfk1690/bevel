/**
 * Password strength tests.
 *
 * The interesting cases are the ones a rule-based checker gets wrong:
 * `Password1!` satisfies every classic requirement and is still the first
 * thing anyone tries.
 */
import assert from 'node:assert/strict'

import { passwordStrength } from '../src/utils/password.ts'

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

test('nothing typed is nothing to judge', () => {
  const empty = passwordStrength('')
  assert.equal(empty.score, 0)
  assert.equal(empty.bits, 0)
  assert.equal(empty.tooShort, true)
  assert.ok(empty.suggestion)
})

test('length beats decoration', () => {
  // Every classic rule satisfied, and still one of the first guesses
  const decorated = passwordStrength('Password1!')
  const plain = passwordStrength('spruce lantern quiet')

  assert.ok(decorated.score <= 1, `Password1! scored ${decorated.score}`)
  assert.ok(plain.score >= 3, `a long phrase scored ${plain.score}`)
  assert.ok(plain.bits > decorated.bits * 2)
})

test('the obvious ones are named as obvious', () => {
  for (const value of ['password', '123456', 'qwerty', 'sifre']) {
    const result = passwordStrength(value)
    assert.equal(result.score, 0, `${value} scored ${result.score}`)
    assert.ok(result.suggestion)
  }
})

test("what it protects cannot be what unlocks it", () => {
  const options = { blocklist: ['ada@example.com', 'Bevel'] }

  const own = passwordStrength('ada1988summer', options)
  const other = passwordStrength('kiln1988summer', options)
  assert.ok(own.bits < other.bits, 'using the email local part costs it')

  assert.ok(passwordStrength('bevelbevel22', options).suggestion, 'so does the app name')

  // The domain is not the secret. Punishing it would fail half a company on
  // the same word for no gain
  const withDomain = passwordStrength('examplemistgrip42', options)
  const noList = passwordStrength('examplemistgrip42')
  assert.equal(withDomain.bits, noList.bits)
})

test('keyboard runs are not length', () => {
  const run = passwordStrength('abcdefghij')
  const jumbled = passwordStrength('kqvbnzrwmt')
  assert.ok(run.bits < jumbled.bits, `${run.bits} should be under ${jumbled.bits}`)
})

test('the same few characters are not length either', () => {
  const repeated = passwordStrength('aaaaaaaaaaaaaaaa')
  const varied = passwordStrength('yarnfoldmistgrip')
  assert.ok(repeated.score < varied.score)
})

test('a real passphrase reaches the top', () => {
  const strong = passwordStrength('quiet lantern spruce harbour')
  assert.equal(strong.score, 4)
  assert.equal(strong.suggestion, null, 'and there is nothing left to say')
})

test('short is reported separately from weak', () => {
  // A form can block on the first and only advise on the second
  const short = passwordStrength('kQ7#z', { minLength: 8 })
  assert.equal(short.tooShort, true)

  const long = passwordStrength('kQ7#zpLm2@wR', { minLength: 8 })
  assert.equal(long.tooShort, false)
  assert.ok(long.score >= 3)
})

test('only one thing is asked for at a time', () => {
  // Five rules at once are read as a wall and answered with Password1!
  const result = passwordStrength('abc')
  assert.equal(typeof result.suggestion, 'string')
  assert.ok(!result.suggestion.includes('\n'))
})

console.log(`password: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
