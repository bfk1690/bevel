export type PasswordScore = 0 | 1 | 2 | 3 | 4

export type PasswordAssessment = {
  score: PasswordScore
  /** Rough bits of entropy, after the penalties below */
  bits: number
  /**
   * The single most useful next step, or `null` when there is nothing left to
   * say. One at a time on purpose: a list of five rules is read as a wall and
   * answered with `Password1!`.
   */
  suggestion: string | null
  /** Fails `minLength`, so a form can block on it rather than only advise */
  tooShort: boolean
}

export type PasswordOptions = {
  minLength?: number
  /**
   * Words that must not appear in it - the person's own email, name, or the
   * app's. A password made of the thing it protects is the one attackers try.
   */
  blocklist?: readonly string[]
  /** Overrides the wording of each suggestion */
  messages?: Partial<Record<SuggestionKey, string>>
}

export type SuggestionKey = 'length' | 'blocked' | 'sequence' | 'repeat' | 'variety' | 'common'

const DEFAULT_MESSAGES: Record<SuggestionKey, string> = {
  length: 'Longer helps more than anything else.',
  blocked: 'Avoid using your own details in it.',
  sequence: 'Avoid runs like 1234 or qwerty.',
  repeat: 'Avoid repeating the same few characters.',
  variety: 'Mix in another kind of character.',
  common: 'This is one of the first passwords anyone tries.',
}

/**
 * The passwords that appear at the top of every leaked list.
 *
 * Deliberately short. A real check belongs on the server against a proper
 * corpus - this only catches what is embarrassing to let through on a phone,
 * without shipping a megabyte of word list to do it.
 */
const COMMON = [
  'password', 'parola', 'sifre', '123456', '12345678', '123456789', 'qwerty',
  'qwertyuiop', 'asdfgh', 'abc123', 'password1', 'iloveyou', 'admin', 'welcome',
  'monkey', 'dragon', 'letmein', 'football', 'baseball', 'sunshine', 'princess',
  'trustno1', 'master', 'shadow', 'superman', 'batman', 'starwars', 'whatever',
  'zaq12wsx', '1q2w3e4r', 'antalya', 'galatasaray', 'fenerbahce', 'besiktas',
]

const LOWER = /[a-zà-ɏ]/
const UPPER = /[A-ZÀ-ɏ]/
const DIGIT = /[0-9]/
const SYMBOL = /[^a-zA-Z0-9À-ɏ]/

/** How many characters an attacker has to guess from, given what was used */
function poolSize(value: string): number {
  let pool = 0
  if (LOWER.test(value)) pool += 26
  if (UPPER.test(value)) pool += 26
  if (DIGIT.test(value)) pool += 10
  if (SYMBOL.test(value)) pool += 33
  return Math.max(pool, 1)
}

/** Longest run of characters stepping by one, either way: abc, 321, but not aab */
function longestRun(value: string): number {
  let longest = 1
  let run = 1
  for (let index = 1; index < value.length; index += 1) {
    const step = value.charCodeAt(index) - value.charCodeAt(index - 1)
    if (step === 1 || step === -1) {
      run += 1
      longest = Math.max(longest, run)
    } else {
      run = 1
    }
  }
  return value.length === 0 ? 0 : longest
}

function uniqueRatio(value: string): number {
  if (value.length === 0) return 0
  return new Set(value.toLowerCase()).size / value.length
}

function classes(value: string): number {
  return [LOWER, UPPER, DIGIT, SYMBOL].filter((pattern) => pattern.test(value)).length
}

/**
 * How much guessing a password would take, and the one thing worth changing.
 *
 * The score is driven by LENGTH far more than by character classes, because
 * that is what actually costs an attacker time. Demanding a symbol produces
 * `Password1!`, which is a common word with two predictable decorations - the
 * blocklist and common-word checks below cost it more than the symbol earned.
 */
export function passwordStrength(
  value: string,
  { minLength = 8, blocklist = [], messages }: PasswordOptions = {},
): PasswordAssessment {
  const say = { ...DEFAULT_MESSAGES, ...messages }
  const trimmed = value ?? ''
  const lowered = trimmed.toLowerCase()

  if (trimmed.length === 0) {
    return { score: 0, bits: 0, suggestion: say.length, tooShort: true }
  }

  // Anything the person could be guessed to use, plus what they were given
  const forbidden = [
    ...COMMON,
    ...blocklist.flatMap((entry) => {
      const word = entry.trim().toLowerCase()
      // An email is really its local part: nobody's password is the domain
      const local = word.includes('@') ? word.slice(0, word.indexOf('@')) : word
      return local.length >= 3 ? [local] : []
    }),
  ]

  const hit = forbidden.find((word) => word.length >= 3 && lowered.includes(word))
  const isCommon = hit != null && COMMON.includes(hit) && lowered.length <= hit.length + 3

  let bits = trimmed.length * Math.log2(poolSize(trimmed))

  // A guessable word inside it is not length an attacker has to work through
  if (hit != null) bits -= Math.min(bits * 0.6, hit.length * Math.log2(poolSize(trimmed)) * 0.8)

  const run = longestRun(trimmed)
  if (run >= 3) bits -= (run - 2) * 4

  const variety = uniqueRatio(trimmed)
  if (variety < 0.5) bits *= 0.6

  bits = Math.max(0, bits)

  const tooShort = trimmed.length < minLength

  const score: PasswordScore = tooShort
    ? bits < 20
      ? 0
      : 1
    : bits < 28
      ? 0
      : bits < 40
        ? 1
        : bits < 60
          ? 2
          : bits < 90
            ? 3
            : 4

  // Ordered by what would help most, and only one is given
  const suggestion =
    isCommon
      ? say.common
      : hit != null
        ? say.blocked
        : tooShort || bits < 40
          ? say.length
          : run >= 4
            ? say.sequence
            : variety < 0.5
              ? say.repeat
              : classes(trimmed) < 2 && bits < 90
                ? say.variety
                : null

  return { score, bits: Math.round(bits), suggestion, tooShort }
}
