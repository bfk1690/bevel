import type { TextStyle } from 'react-native'

/**
 * Color ROLES, not brand names.
 *
 * A role says where a color belongs, so a component never has to guess. The
 * surface ladder (sunk -> canvas -> surface -> raised -> sheet) climbs in one
 * direction: each step sits visually above the previous one.
 *
 * That ordering matters most in dark themes, where depth cannot come from
 * shadow (black on black is invisible) and has to come from surface lightness
 * instead.
 */
export type ColorRole =
  /** Recessed area: input wells, tracks, channels */
  | 'sunk'
  /** Screen background */
  | 'canvas'
  /** Cards and panels */
  | 'surface'
  /** Elements sitting ON a card: buttons, chips, badges */
  | 'raised'
  /** Layers opened above the screen: modals, sheets */
  | 'sheet'
  | 'border'
  | 'borderStrong'
  | 'text'
  | 'textMuted'
  | 'textFaint'
  /** Primary action and selection */
  | 'accent'
  /** Low-opacity background counterpart of accent */
  | 'accentSoft'
  /** Text ON accent. Never assumed - contrast depends on the brand color */
  | 'onAccent'
  | 'ok'
  | 'okSoft'
  | 'warning'
  | 'warningSoft'
  | 'danger'
  | 'dangerSoft'
  /** Color BEHIND photos and video. Accents must not bleed here: they shift how
   * the media's own tones are read */
  | 'media'
  /** Text ON media: a neutral that does not depend on the surface below */
  | 'onMedia'
  /** Scrim: behind modals, over crops */
  | 'overlay'
  | 'skeleton'

/** Roles are required; brand-specific extras (`cyan`, `hot`) are allowed */
export type Palette = { [K in ColorRole]: string } & { [key: string]: string }

/** A role name, or a raw color (`#fff`, `rgba(...)`, `transparent`) */
export type ColorInput = ColorRole | (string & {})

export type RadiusToken = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'pill'
export type SizeToken = 'sm' | 'md' | 'lg'
export type TypeToken =
  | 'display'
  | 'title'
  | 'heading'
  | 'body'
  | 'bodyStrong'
  | 'label'
  | 'caption'
  | 'micro'

export type TypeStyle = {
  fontSize: number
  lineHeight: number
  fontWeight: TextStyle['fontWeight']
  fontFamily?: string
  letterSpacing?: number
  /**
   * Render the text uppercased.
   *
   * Applied to the STRING, never through `textTransform`. Platform casing is
   * locale-blind and mangles languages where the mapping is not 1:1 - most
   * visibly Turkish, where lowercase `i` must become `I` with a dot.
   */
  uppercase?: boolean
}

/**
 * Device scaling mode.
 *
 * Values are multiplied against a reference viewport so a layout designed on
 * one device holds its proportions on another. Opt out with `'none'` to work
 * in raw dp.
 */
export type ScaleMode = 'none' | 'moderate' | 'width' | 'height'

/**
 * How a pressable reacts to touch.
 *
 * `depth` renders a physical, beveled edge that compresses on press; `scale`
 * shrinks the control; `opacity` dims it; `none` leaves it flat. Any of them
 * can be set globally on the theme, per variant, or per instance - no style is
 * privileged over the others.
 */
export type PressEffect = 'depth' | 'scale' | 'opacity' | 'none'
export type ShadowPreset = 'none' | 'card' | 'float' | 'dock' | 'toast'

/**
 * A button variant is DATA, not code.
 *
 * Because variants live in the theme, an app adds its own (`marketing`, `ai`,
 * `checkout`) without forking the package, and overriding one means writing
 * only the properties that differ.
 */
export type ButtonVariantSpec = {
  bg?: ColorInput
  fg?: ColorInput
  border?: ColorInput
  borderWidth?: number
  /** Key into `theme.gradients`. Painting is delegated to `renderGradient` so
   * the package never depends on a gradient library */
  gradient?: string
  press?: PressEffect
  shadow?: ShadowPreset
  /** Bevel depth in px for `press: 'depth'`. Defaults to the theme's per-size value */
  depth?: number
  radius?: RadiusToken | number
  /** When `fg` is omitted, pick black or white from the background's luminance */
  autoContrast?: boolean
  opacity?: number
}

export type ButtonConfig = {
  defaultVariant: string
  radius: RadiusToken | number
  press: PressEffect
  shadow: ShadowPreset
  height: Record<SizeToken, number>
  depth: Record<SizeToken, number>
  paddingX: Record<SizeToken, number>
  gap: Record<SizeToken, number>
  iconSize: Record<SizeToken, number>
  typeVariant: Record<SizeToken, TypeToken>
  /** Background for the disabled state. Falls back to `borderStrong` */
  disabledBg?: ColorInput
  disabledOpacity: number
  variants: Record<string, ButtonVariantSpec>
}

/**
 * Text field variant. Focus and error are STATES of a variant, not separate
 * variants, so an app restyles both by describing one surface.
 */
export type InputVariantSpec = {
  bg?: ColorInput
  fg?: ColorInput
  placeholder?: ColorInput
  border?: ColorInput
  borderWidth?: number
  focusBorder?: ColorInput
  focusBg?: ColorInput
  errorBorder?: ColorInput
  errorBg?: ColorInput
  radius?: RadiusToken | number
}

export type InputConfig = {
  defaultVariant: string
  radius: RadiusToken | number
  height: Record<SizeToken, number>
  paddingX: Record<SizeToken, number>
  gap: Record<SizeToken, number>
  iconSize: Record<SizeToken, number>
  typeVariant: Record<SizeToken, TypeToken>
  labelVariant: TypeToken
  helperVariant: TypeToken
  /** Minimum height for `multiline` fields */
  multilineHeight: number
  /**
   * `compact` marks the field itself and reuses the label row for the message;
   * `below` keeps the field neutral and adds a line underneath.
   *
   * Dense forms tend to want `compact` - a message line under every field
   * changes the height of the form as errors appear and disappear.
   */
  errorMode: 'compact' | 'below'
  variants: Record<string, InputVariantSpec>
}

export type Sizes = {
  control: Record<SizeToken, number>
  icon: Record<SizeToken, number>
  /** Accessibility floor for touch targets - 44dp (Apple HIG) */
  minTap: number
  hitSlop: number
  borderWidth: number
}

export type Theme = {
  id: string
  scale: ScaleMode
  schemes: Record<string, Palette>
  defaultScheme: string
  radius: Record<RadiusToken, number>
  type: Record<TypeToken, TypeStyle>
  sizes: Sizes
  gradients: Record<string, readonly string[]>
  spacingUnit: number
  /** `space(4)` -> 4 x unit, already scaled */
  space: (steps: number) => number
  components: { Button: ButtonConfig; Input: InputConfig }
}
