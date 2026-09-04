/**
 * Locale-safe letter casing.
 *
 * `String.prototype.toUpperCase()` applies the invariant Unicode mapping, which
 * is wrong in languages where casing is not 1:1. Turkish is the common case:
 * `i` must uppercase to `I` with a dot, and `i` without a dot is a different
 * letter. Left to the default, UI labels come out subtly misspelled and it
 * reads like a broken font rather than a casing bug.
 *
 * `textTransform: 'uppercase'` has the same problem - the platform does the
 * mapping, and it is equally locale-blind.
 *
 * The mappings are written out instead of calling `toLocaleUpperCase(locale)`
 * on purpose: locale-aware casing depends on the engine's ICU build, and
 * mobile JS engines often ship a trimmed one. Explicit mapping gives the same
 * output everywhere, including in tests running on a full-ICU runtime.
 */
export type CaseLocale = 'default' | 'tr'

let activeLocale: CaseLocale = 'default'

/** Set once at startup, next to the app's i18n setup */
export function setCaseLocale(locale: CaseLocale): void {
  activeLocale = locale
}

export function getCaseLocale(): CaseLocale {
  return activeLocale
}

export function upper(text: string, locale: CaseLocale = activeLocale): string {
  if (locale === 'tr') {
    return text.replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase()
  }
  return text.toUpperCase()
}

export function lower(text: string, locale: CaseLocale = activeLocale): string {
  if (locale === 'tr') {
    return text.replace(/I/g, 'ı').replace(/İ/g, 'i').toLowerCase()
  }
  return text.toLowerCase()
}
