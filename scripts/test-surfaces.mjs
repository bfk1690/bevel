/**
 * Stacked-surface tests.
 *
 * Written after a device report: in dark mode the selected segment of a
 * segmented control could not be told from its track. The indicator was
 * `canvas` on a `sunk` track - white on grey in light, and pure black on
 * near-black in dark, where it was the darkest thing on the screen.
 *
 * The ladder is not a single direction of luminance. `raised` is DARKER than
 * `canvas` in light and LIGHTER than it in dark, which is what a surface
 * ladder is for and also why a pair chosen by eye in one scheme can invert in
 * the other. Nobody can hold that in their head; this holds it instead.
 */
import assert from 'node:assert/strict'

import { contrast } from '../src/theme/color.ts'
import { defaultTheme } from '../src/theme/define-theme.ts'

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

/**
 * Two surfaces of the same family are never going to reach a text ratio, and
 * should not: this is a shape on a shape, read by its edge as much as its
 * fill. Below about this they stop being two things.
 */
const SEPARATION = 1.1

/**
 * Only the pairs that must read by FILL ALONE.
 *
 * A card on a screen is not here on purpose, though it is also two surfaces:
 * in light it is separated by its border and its shadow, and asserting a fill
 * ratio for it would be asserting something the design deliberately does
 * another way. These two have neither - a small shape inside a track, no
 * border, and in dark no usable shadow either.
 */
const STACKED = [
  { over: 'sunk', on: 'sheet', what: 'the segmented indicator, and the slider thumb' },
]

const schemes = Object.entries(defaultTheme.schemes)

test('every scheme has more than one scheme to check', () => {
  assert.ok(schemes.length >= 2, 'a single scheme would make all of this vacuous')
})

for (const [name, colors] of schemes) {
  for (const pair of STACKED) {
    test(`${name}: ${pair.on} is visible on ${pair.over} (${pair.what})`, () => {
      const ratio = contrast(colors[pair.on], colors[pair.over])
      assert.ok(
        ratio >= SEPARATION,
        `${pair.on} on ${pair.over} came to ${ratio.toFixed(2)}, under ${SEPARATION}`,
      )
    })
  }

  test(`${name}: no other rung would do the job better`, () => {
    // If one did, the components should be using it. This is the check that
    // keeps the choice honest when the palette is next edited
    const chosen = contrast(colors.sheet, colors.sunk)
    for (const rung of ['canvas', 'surface', 'raised']) {
      assert.ok(
        chosen >= contrast(colors[rung], colors.sunk),
        `${rung} separates from the track better than sheet does in ${name}`,
      )
    }
  })
}

test('the pairing that was reported would now fail', () => {
  // The regression itself, pinned: canvas on sunk in the dark scheme
  const dark = defaultTheme.schemes.dark
  assert.ok(
    contrast(dark.canvas, dark.sunk) < SEPARATION,
    'the old pairing has become acceptable, so this test no longer means anything',
  )
})

console.log(`surfaces: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
