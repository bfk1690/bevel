import type {
  ButtonConfig,
  InputConfig,
  Palette,
  RadiusToken,
  Sizes,
  TypeStyle,
  TypeToken,
} from './types'

/**
 * DEFAULT PALETTE - neutral and unbranded.
 *
 * The package has no color of its own by design. These values exist so an app
 * that configures nothing still renders a coherent screen; a real app passes
 * only what differs through `defineTheme({ schemes: { ... } })`.
 */
const light: Palette = {
  sunk: '#F0F1F3',
  canvas: '#FFFFFF',
  surface: '#F7F8F9',
  raised: '#EDEEF0',
  sheet: '#FFFFFF',
  border: '#E1E3E6',
  borderStrong: '#CBCED3',
  text: '#16181C',
  textMuted: '#5F6673',
  textFaint: '#8B929E',
  accent: '#0A84FF',
  accentSoft: 'rgba(10, 132, 255, 0.12)',
  onAccent: '#FFFFFF',
  ok: '#12A150',
  okSoft: 'rgba(18, 161, 80, 0.12)',
  warning: '#C77700',
  warningSoft: 'rgba(199, 119, 0, 0.12)',
  danger: '#E5484D',
  dangerSoft: 'rgba(229, 72, 77, 0.12)',
  media: '#000000',
  onMedia: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.45)',
  skeleton: '#E4E6E9',
}

const dark: Palette = {
  sunk: '#0A0B0C',
  canvas: '#000000',
  surface: '#121316',
  raised: '#1D1F23',
  sheet: '#26282D',
  border: '#26282D',
  borderStrong: '#35383E',
  text: '#FFFFFF',
  textMuted: '#A3A9B3',
  textFaint: '#71767F',
  accent: '#0A84FF',
  accentSoft: 'rgba(10, 132, 255, 0.18)',
  onAccent: '#FFFFFF',
  ok: '#30D158',
  okSoft: 'rgba(48, 209, 88, 0.16)',
  warning: '#FFD60A',
  warningSoft: 'rgba(255, 214, 10, 0.16)',
  danger: '#FF453A',
  dangerSoft: 'rgba(255, 69, 58, 0.16)',
  media: '#000000',
  onMedia: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.72)',
  skeleton: '#1D1F23',
}

export const defaultSchemes: Record<string, Palette> = { light, dark }

export const defaultRadius: Record<RadiusToken, number> = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  /** Fully rounded. Intentionally large - components clamp it to their height */
  pill: 999,
}

/**
 * Type scale.
 *
 * Weights are numeric strings: both platforms accept them, and they avoid the
 * Android inconsistency between '600' and 'semibold'.
 *
 * `micro` is flagged uppercase; `Text` applies it to the string with a
 * locale-safe helper rather than through `textTransform`.
 */
export const defaultType: Record<TypeToken, TypeStyle> = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -0.5 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.3 },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '600', letterSpacing: -0.2 },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400' },
  bodyStrong: { fontSize: 15, lineHeight: 21, fontWeight: '600' },
  label: { fontSize: 15, lineHeight: 18, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 17, fontWeight: '400' },
  micro: { fontSize: 11, lineHeight: 14, fontWeight: '600', letterSpacing: 0.4, uppercase: true },
}

export const defaultSizes: Sizes = {
  control: { sm: 36, md: 50, lg: 58 },
  icon: { sm: 16, md: 20, lg: 22 },
  minTap: 44,
  hitSlop: 10,
  borderWidth: 1,
}

/**
 * DEFAULT BUTTON RECIPE.
 *
 * A starting point, not a mandate: every field here can be replaced, and new
 * variants can be added, from the theme.
 */
export const defaultButton: ButtonConfig = {
  defaultVariant: 'primary',
  radius: 'sm',
  press: 'depth',
  shadow: 'card',
  height: { sm: 36, md: 50, lg: 58 },
  depth: { sm: 2, md: 4, lg: 5 },
  paddingX: { sm: 12, md: 16, lg: 20 },
  gap: { sm: 6, md: 8, lg: 10 },
  iconSize: { sm: 16, md: 20, lg: 22 },
  typeVariant: { sm: 'caption', md: 'label', lg: 'label' },
  disabledOpacity: 0.55,
  variants: {
    /** At most ONE per screen - it marks the primary action */
    primary: { bg: 'accent', fg: 'onAccent' },
    secondary: { bg: 'raised', fg: 'text', shadow: 'none' },
    outline: {
      bg: 'transparent',
      fg: 'accent',
      border: 'border',
      borderWidth: 1,
      shadow: 'none',
    },
    ghost: { bg: 'transparent', fg: 'textMuted', press: 'opacity', shadow: 'none' },
    danger: { bg: 'danger', fg: 'onAccent' },
    /** Action sitting ON a filled or gradient surface, where `outline` reads washed out */
    inverse: { bg: 'canvas', fg: 'text', shadow: 'float' },
  },
}

/**
 * DEFAULT TEXT FIELD RECIPE.
 *
 * The resting surface is `sunk`: an input is a well you type into, so it reads
 * as recessed rather than raised. Focus is carried by the border, not by a
 * background change, which keeps the field from flashing on every tap.
 */
export const defaultInput: InputConfig = {
  defaultVariant: 'default',
  radius: 'sm',
  height: { sm: 40, md: 50, lg: 56 },
  paddingX: { sm: 10, md: 14, lg: 16 },
  gap: { sm: 6, md: 8, lg: 10 },
  iconSize: { sm: 16, md: 20, lg: 22 },
  typeVariant: { sm: 'caption', md: 'body', lg: 'body' },
  labelVariant: 'caption',
  helperVariant: 'caption',
  multilineHeight: 110,
  errorMode: 'compact',
  variants: {
    default: {
      bg: 'sunk',
      fg: 'text',
      placeholder: 'textFaint',
      border: 'border',
      borderWidth: 1,
      focusBorder: 'accent',
      errorBorder: 'danger',
      errorBg: 'dangerSoft',
    },
    /** Search bars and filter rows */
    pill: { bg: 'raised', fg: 'text', placeholder: 'textFaint', borderWidth: 0, radius: 'pill' },
    /** Chromeless field for inline editing */
    plain: { bg: 'transparent', fg: 'text', placeholder: 'textFaint', borderWidth: 0 },
  },
}

export const defaultGradients: Record<string, readonly string[]> = {}
