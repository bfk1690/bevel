/**
 * Formatting tests.
 *
 * These are the functions every app rewrites, and the cases below are the ones
 * each rewrite gets wrong.
 */
import assert from 'node:assert/strict'

import {
  fileExtension,
  fileKind,
  formatBytes,
  formatCount,
  truncateMiddle,
} from '../src/utils/format.ts'

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

test('sizes step in the units a file manager shows', () => {
  assert.equal(formatBytes(0), '0 B')
  assert.equal(formatBytes(512), '512 B')
  assert.equal(formatBytes(1024), '1 KB')
  assert.equal(formatBytes(1536), '1.5 KB')
  assert.equal(formatBytes(1048576), '1 MB')
  assert.equal(formatBytes(1073741824), '1 GB')
})

test('whole sizes stay whole, and bytes never fractional', () => {
  assert.equal(formatBytes(2048), '2 KB', 'not 2.0 KB')
  assert.equal(formatBytes(999), '999 B')
  assert.equal(formatBytes(1000), '1000 B', 'still bytes below the binary step')
})

test('nonsense sizes answer with zero rather than NaN', () => {
  assert.equal(formatBytes(-40), '0 B')
  assert.equal(formatBytes(Number.NaN), '0 B')
  assert.equal(formatBytes(Number.POSITIVE_INFINITY), '0 B')
})

test('counts keep their exact value while it fits', () => {
  assert.equal(formatCount(0), '0')
  assert.equal(formatCount(999), '999', 'more useful than 1k and the same width')
  assert.equal(formatCount(1000), '1k')
  assert.equal(formatCount(1500), '1.5k')
  assert.equal(formatCount(15000), '15k', 'not 15.0k')
  assert.equal(formatCount(1200000), '1.2M')
  assert.equal(formatCount(-2500), '-2.5k')
})

test('names are shortened from the middle so the extension survives', () => {
  assert.equal(truncateMiddle('short.pdf', 24), 'short.pdf')
  const long = truncateMiddle('quarterly-report-final-v3.pdf', 20)
  assert.ok(long.length <= 20, `was ${long.length}`)
  assert.ok(long.startsWith('quarterly'), long)
  assert.ok(long.endsWith('.pdf'), 'the half that says what it is')
})

test('truncation copes with silly limits', () => {
  assert.equal(truncateMiddle('anything', 0), '')
  assert.equal(truncateMiddle('anything', 1), '…')
  assert.equal(truncateMiddle('', 10), '')
})

test('extensions are read from the last dot', () => {
  assert.equal(fileExtension('report.PDF'), 'pdf')
  assert.equal(fileExtension('archive.tar.gz'), 'gz')
  assert.equal(fileExtension('.gitignore'), '', 'a dotfile has no extension')
  assert.equal(fileExtension('README'), '')
  assert.equal(fileExtension('trailing.'), '')
})

test('files are grouped by what you would do with them', () => {
  assert.equal(fileKind('holiday.HEIC'), 'image')
  assert.equal(fileKind('clip.mov'), 'video')
  assert.equal(fileKind('demo.mp3'), 'audio')
  assert.equal(fileKind('invoice.pdf'), 'document')
  assert.equal(fileKind('backup.7z'), 'archive')
  assert.equal(fileKind('mystery.xyz'), 'other')
})

console.log(`format: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
