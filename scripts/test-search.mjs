/**
 * Search tests.
 *
 * Mostly about what a searcher does NOT mean: the accent they skipped, the
 * case they did not think about, and the keyboard they did not switch.
 */
import assert from 'node:assert/strict'

import { foldText, rankSuggestions, scoreMatch } from '../src/utils/search.ts'

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

test('folding collapses case, accents and the two Turkish i letters', () => {
  assert.equal(foldText('Şişli'), 'sisli')
  assert.equal(foldText('İstanbul'), 'istanbul')
  assert.equal(foldText('IŞIK'), 'isik')
  assert.equal(foldText('Kadıköy'), 'kadikoy')
  assert.equal(foldText('Gümüşhane'), 'gumushane')
  assert.equal(foldText('Café'), 'cafe')
  assert.equal(foldText('Müller'), 'muller')
})

test('folding is for comparison, not for display', () => {
  // The casing helpers keep these apart on purpose; here they must meet
  assert.equal(foldText('ışık'), foldText('IŞIK'))
  assert.equal(foldText('istanbul'), foldText('İSTANBUL'))
})

test('the four tiers are ordered the way a person reads them', () => {
  assert.equal(scoreMatch('Ankara', 'ankara'), 4)
  assert.equal(scoreMatch('Ankara Cankaya', 'ankara'), 3)
  assert.equal(scoreMatch('Buyuk Ankara', 'ankara'), 2, 'a word inside starting with it')
  assert.equal(scoreMatch('Sankara', 'ankara'), 1, 'buried anywhere')
  assert.equal(scoreMatch('Izmir', 'ankara'), 0)
})

test('an exact match outranks everything, however long the list', () => {
  const items = ['Ankara Cankaya', 'Buyuk Ankara', 'Ankara']
  const ranked = rankSuggestions('ankara', items, (item) => item)
  assert.equal(ranked[0], 'Ankara')
})

test('equally good matches keep the order they arrived in', () => {
  // A list already ordered by something meaningful must not reshuffle on every
  // keystroke
  const items = ['Istanbul Kadikoy', 'Istanbul Sisli', 'Istanbul Besiktas']
  const ranked = rankSuggestions('istanbul', items, (item) => item)
  assert.deepEqual(ranked, items)
})

test('a query typed without its accents still finds the entry', () => {
  const items = ['Şişli', 'Kadıköy', 'Üsküdar']
  assert.deepEqual(rankSuggestions('sisli', items, (item) => item), ['Şişli'])
  assert.deepEqual(rankSuggestions('kadikoy', items, (item) => item), ['Kadıköy'])
  assert.deepEqual(rankSuggestions('uskudar', items, (item) => item), ['Üsküdar'])
})

test('an empty query offers nothing unless it is asked to', () => {
  const items = ['a', 'b', 'c']
  assert.deepEqual(rankSuggestions('', items, (item) => item), [])
  assert.deepEqual(rankSuggestions('   ', items, (item) => item), [])
  assert.deepEqual(rankSuggestions('', items, (item) => item, { emptyReturnsAll: true }), items)
  assert.deepEqual(
    rankSuggestions('', items, (item) => item, { emptyReturnsAll: true, limit: 2 }),
    ['a', 'b'],
  )
})

test('the limit applies after the ordering, not before', () => {
  const items = ['Sankara', 'Ankara Cankaya', 'Ankara']
  const ranked = rankSuggestions('ankara', items, (item) => item, { limit: 1 })
  assert.deepEqual(ranked, ['Ankara'], 'the best match survives the cut')
})

test('nothing matching means nothing returned', () => {
  assert.deepEqual(rankSuggestions('xyz', ['a', 'b'], (item) => item), [])
})

console.log(`search: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
