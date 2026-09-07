import { alpha, contrast, darken, lighten, readableOn } from './color'
import { defineTheme, type ThemeInput } from './define-theme'
import type { Palette, Theme } from './types'

/**
 * Nudges a colour until it is readable on a background.
 *
 * A brand colour is chosen against white and then used on black, where it can
 * be far too dark to read - or the reverse. Rather than refusing it, or
 * silently shipping a contrast of 2:1, the colour is walked towards whichever
 * end has room until it clears the threshold.
 *
 * It walks in small steps and gives up after a bounded number of them, so a
 * colour that cannot be saved returns the closest it got instead of looping.
 */
export function ensureContrast(
  color: string,
  background: string,
  minimum = 4.5,
  step = 0.06,
): string {
  if (contrast(color, background) >= minimum) return color

  // Towards white on a dark background, towards black on a light one
  const towardsLight = contrast('#FFFFFF', background) > contrast('#000000', background)
  let candidate = color

  for (let attempt = 0; attempt < 20; attempt += 1) {
    candidate = towardsLight ? lighten(candidate, step) : darken(candidate, step)
    if (contrast(candidate, background) >= minimum) return candidate
  }

  return candidate
}

type SchemePatch = Partial<Palette> & { extends?: string }

export type BrandInput = Omit<ThemeInput, 'schemes'> & {
  /** The one colour an app actually has */
  accent: string
  /** Overrides for the light scheme, applied after the derived values */
  light?: SchemePatch
  dark?: SchemePatch
  /**
   * Contrast the accent must clear against each canvas.
   *
   * The default is a VISIBILITY threshold, not a text one. A brand colour is
   * the app's, not ours to correct: pushing yellow until it reads as body text
   * on white turns it brown, and the app no longer looks like itself. What is
   * worth preventing is a colour that cannot be seen at all - navy on black -
   * so the accent is only moved when it disappears.
   *
   * Raise it where the accent is used as running text rather than as a fill.
   */
  minimumContrast?: number
}

/**
 * A whole theme from one brand colour.
 *
 * What an app usually has is a hex code from a brand guide, not a palette. The
 * three values that hex implies - the tint behind it, the text on top of it,
 * and the version of it that survives a dark background - are derived here
 * rather than guessed at by hand in every project, which is where a soft
 * variant ends up at a different opacity on each screen.
 *
 * The label on the accent is decided by the ACCENT, not by the scheme: a
 * yellow brand takes black labels on both a white and a black background,
 * because what the label sits on is the yellow.
 *
 * Everything derived can still be overridden: this is a starting point, not a
 * replacement for a designer.
 */
export function createBrandTheme({
  accent,
  light,
  dark,
  minimumContrast = 3,
  ...rest
}: BrandInput): Theme {
  // The canvases the derived values have to work against
  const lightCanvas = light?.canvas ?? '#FFFFFF'
  const darkCanvas = dark?.canvas ?? '#000000'

  const lightAccent = ensureContrast(accent, lightCanvas, minimumContrast)
  const darkAccent = ensureContrast(accent, darkCanvas, minimumContrast)

  return defineTheme({
    ...rest,
    schemes: {
      light: {
        accent: lightAccent,
        // Text ON the accent is decided by the accent, not by the scheme: a
        // yellow brand takes black labels in both.
        onAccent: readableOn(lightAccent),
        accentSoft: alpha(lightAccent, 0.12),
        ...light,
      },
      dark: {
        accent: darkAccent,
        onAccent: readableOn(darkAccent),
        // A tint has to be stronger on a dark surface to be seen at all
        accentSoft: alpha(darkAccent, 0.18),
        ...dark,
      },
    },
  })
}
