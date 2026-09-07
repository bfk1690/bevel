/**
 * Field validation.
 *
 * Rules are functions that return a message or null, and they are given their
 * OWN message. A kit that ships its own wording would either be English-only
 * or drag a translation layer in behind it; this way the app keeps its voice
 * and its language.
 */

export type Validator<T = string> = (value: T) => string | null

/**
 * Present and not blank.
 *
 * `false` counts as missing and `0` does not. An unticked checkbox is an
 * unanswered question, while a quantity of zero is an answer - treating them
 * the same is how a form ends up demanding that someone order at least one.
 */
export function required(message: string): Validator<unknown> {
  return (value) => {
    if (value == null) return message
    if (typeof value === 'string') return value.trim().length > 0 ? null : message
    if (typeof value === 'boolean') return value ? null : message
    if (Array.isArray(value)) return value.length > 0 ? null : message
    return null
  }
}

const segmenter =
  typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null

/**
 * Counts what a person would count.
 *
 * `.length` counts code units, so an emoji is two. `Array.from` counts code
 * points, which is better but still splits an emoji carrying a skin tone into
 * two. Only grapheme segmentation agrees with the person typing, who sees one
 * character and expects it to cost one.
 *
 * Where the runtime has no segmenter this falls back to code points - wrong
 * for a handful of emoji, right for every alphabet, and never a crash.
 */
export function countCharacters(text: string): number {
  if (!text) return 0
  if (segmenter) {
    let count = 0
    for (const _ of segmenter.segment(text)) count += 1
    return count
  }
  return Array.from(text).length
}

export function minLength(length: number, message: string): Validator<string> {
  return (value) => (countCharacters(value ?? '') >= length ? null : message)
}

export function maxLength(length: number, message: string): Validator<string> {
  return (value) => (countCharacters(value ?? '') <= length ? null : message)
}

export function pattern(expression: RegExp, message: string): Validator<string> {
  return (value) => {
    // A global regex keeps its lastIndex between calls and starts failing every
    // other check, so it is used through a fresh copy
    const safe = expression.global ? new RegExp(expression.source, expression.flags.replace('g', '')) : expression
    return safe.test(value ?? '') ? null : message
  }
}

/**
 * Deliberately loose.
 *
 * The address either delivers or it does not, and no expression settles that.
 * Anything stricter starts rejecting real addresses - plus signs, new
 * top-level domains, non-Latin characters - which is a worse failure than
 * letting a typo through to a verification email.
 */
export function email(message: string): Validator<string> {
  return pattern(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u, message)
}

export function numeric(message: string): Validator<string> {
  return pattern(/^-?\d+(\.\d+)?$/, message)
}

export function range(min: number, max: number, message: string): Validator<number | string> {
  return (value) => {
    const numberValue = typeof value === 'number' ? value : Number(value)
    if (Number.isNaN(numberValue)) return message
    return numberValue >= min && numberValue <= max ? null : message
  }
}

/** Compares against another field, read at check time rather than captured */
export function matches(other: () => string, message: string): Validator<string> {
  return (value) => (value === other() ? null : message)
}

/**
 * The FIRST failing rule wins.
 *
 * Showing every problem at once turns a field into a list of complaints, and
 * the user can only fix one of them at a time anyway.
 */
export function validate<T>(value: T, rules: readonly Validator<T>[] = []): string | null {
  for (const rule of rules) {
    const message = rule(value)
    if (message != null) return message
  }
  return null
}

export type RuleMap<V> = { [K in keyof V]?: readonly Validator<V[K]>[] }

export type ErrorMap<V> = { [K in keyof V]?: string | null }

export function validateAll<V extends Record<string, unknown>>(
  values: V,
  rules: RuleMap<V>,
): ErrorMap<V> {
  const errors: ErrorMap<V> = {}
  for (const key of Object.keys(values) as (keyof V)[]) {
    errors[key] = validate(values[key], rules[key])
  }
  return errors
}

export function hasErrors<V>(errors: ErrorMap<V>): boolean {
  return Object.values(errors).some((message) => message != null)
}
