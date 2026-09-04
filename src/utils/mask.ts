/**
 * Input masking.
 *
 * Deliberately pattern-driven rather than a list of named formats: phone
 * numbers, national IDs and card expiries differ by country, so a built-in
 * `'phone'` mask would be wrong everywhere except where it was written.
 *
 *   createMask('(###) ### ## ##')   phone
 *   createMask('#### #### #### ####') card
 *   createMask('##/##')             expiry
 *   createMask('AA-####')           plate
 *
 * Tokens: `#` digit, `A` letter, `*` letter or digit. Anything else is a
 * literal and is re-inserted as the user types.
 */
export type MaskFn = (raw: string) => string
export type Mask = string | MaskFn

const DIGIT = /\d/
const LETTER = /\p{L}/u
const ALNUM = /[\p{L}\p{N}]/u

function isToken(char: string): boolean {
  return char === '#' || char === 'A' || char === '*'
}

function accepts(token: string, char: string): boolean {
  if (token === '#') return DIGIT.test(char)
  if (token === 'A') return LETTER.test(char)
  return ALNUM.test(char)
}

export function createMask(pattern: string): MaskFn {
  return (raw: string) => {
    const chars = Array.from(raw).filter((c) => ALNUM.test(c))
    let out = ''
    let index = 0
    for (const slot of pattern) {
      if (index >= chars.length) break
      if (!isToken(slot)) {
        out += slot
        continue
      }
      // A character the slot cannot hold is skipped rather than consuming the
      // slot, so pasting "12ab34" into a digits mask yields "1234" instead of
      // stopping at the first letter.
      while (index < chars.length && !accepts(slot, chars[index]!)) index += 1
      if (index >= chars.length) break
      out += chars[index]!
      index += 1
    }
    return out
  }
}

export function applyMask(value: string, mask: Mask): string {
  return typeof mask === 'function' ? mask(value) : createMask(mask)(value)
}

/** Strips every literal, leaving what should be sent to a server */
export function unmask(value: string): string {
  return Array.from(value)
    .filter((c) => ALNUM.test(c))
    .join('')
}
