import { fs, scaleValue } from './scale'
import {
  defaultButton,
  defaultGradients,
  defaultInput,
  defaultRadius,
  defaultSchemes,
  defaultSizes,
  defaultType,
} from './tokens'
import type {
  ButtonConfig,
  ButtonVariantSpec,
  InputConfig,
  InputVariantSpec,
  Palette,
  RadiusToken,
  ScaleMode,
  SizeToken,
  Sizes,
  Theme,
  TypeStyle,
  TypeToken,
} from './types'

type SchemeInput = Partial<Palette> & {
  /** Base scheme to extend. Defaults to the built-in scheme of the same name, else `light` */
  extends?: string
}

export type ThemeInput = {
  id?: string
  /** Defaults to `'moderate'`. Pass `'none'` to work in raw dp. */
  scale?: ScaleMode
  schemes?: Record<string, SchemeInput>
  defaultScheme?: string
  radius?: Partial<Record<RadiusToken, number>>
  type?: Partial<Record<TypeToken, Partial<TypeStyle>>>
  /** Applied to every type token; a per-token `fontFamily` still wins */
  fontFamily?: string
  sizes?: {
    control?: Partial<Record<SizeToken, number>>
    icon?: Partial<Record<SizeToken, number>>
    minTap?: number
    hitSlop?: number
    borderWidth?: number
  }
  /** One spacing unit in dp. `space(4)` = 4 x unit. Defaults to 4. */
  spacingUnit?: number
  gradients?: Record<string, readonly string[]>
  components?: {
    Button?: Partial<Omit<ButtonConfig, 'height' | 'depth' | 'paddingX' | 'gap' | 'iconSize' | 'typeVariant' | 'variants'>> & {
      height?: Partial<Record<SizeToken, number>>
      depth?: Partial<Record<SizeToken, number>>
      paddingX?: Partial<Record<SizeToken, number>>
      gap?: Partial<Record<SizeToken, number>>
      iconSize?: Partial<Record<SizeToken, number>>
      typeVariant?: Partial<Record<SizeToken, TypeToken>>
      /** Merged over the built-in variants; adding new ones is expected */
      variants?: Record<string, ButtonVariantSpec>
    }
    Input?: Partial<Omit<InputConfig, 'height' | 'paddingX' | 'gap' | 'iconSize' | 'typeVariant' | 'variants'>> & {
      height?: Partial<Record<SizeToken, number>>
      paddingX?: Partial<Record<SizeToken, number>>
      gap?: Partial<Record<SizeToken, number>>
      iconSize?: Partial<Record<SizeToken, number>>
      typeVariant?: Partial<Record<SizeToken, TypeToken>>
      variants?: Record<string, InputVariantSpec>
    }
  }
}

function mergeSizeMap(
  base: Record<SizeToken, number>,
  patch: Partial<Record<SizeToken, number>> | undefined,
  mode: ScaleMode,
): Record<SizeToken, number> {
  return {
    sm: scaleValue(patch?.sm ?? base.sm, mode),
    md: scaleValue(patch?.md ?? base.md, mode),
    lg: scaleValue(patch?.lg ?? base.lg, mode),
  }
}

/**
 * Builds a theme.
 *
 * Scaling is applied HERE, once. Components never scale raw numbers
 * themselves, which keeps the scaling mode a theme setting instead of a
 * library-wide constant, and avoids values freezing at import time before the
 * theme exists.
 */
export function defineTheme(input: ThemeInput = {}): Theme {
  const mode: ScaleMode = input.scale ?? 'moderate'

  const schemeNames = new Set([...Object.keys(defaultSchemes), ...Object.keys(input.schemes ?? {})])
  const schemes: Record<string, Palette> = {}
  for (const name of schemeNames) {
    const patch = input.schemes?.[name]
    const baseName = patch?.extends ?? (defaultSchemes[name] ? name : 'light')
    const base = defaultSchemes[baseName] ?? defaultSchemes.light!
    const { extends: _drop, ...colors } = patch ?? {}
    schemes[name] = { ...base, ...colors } as Palette
  }

  const defaultScheme =
    input.defaultScheme && schemes[input.defaultScheme]
      ? input.defaultScheme
      : Object.keys(schemes).includes('light')
        ? 'light'
        : Object.keys(schemes)[0]!

  const radius = {} as Record<RadiusToken, number>
  for (const key of Object.keys(defaultRadius) as RadiusToken[]) {
    const value = input.radius?.[key] ?? defaultRadius[key]
    // `pill` is a sentinel meaning "fully round", so scaling it is meaningless
    radius[key] = key === 'pill' || key === 'none' ? value : scaleValue(value, mode)
  }

  const type = {} as Record<TypeToken, TypeStyle>
  for (const key of Object.keys(defaultType) as TypeToken[]) {
    const base = defaultType[key]
    const patch = input.type?.[key]
    const merged: TypeStyle = { ...base, ...patch }
    type[key] = {
      ...merged,
      fontFamily: patch?.fontFamily ?? base.fontFamily ?? input.fontFamily,
      fontSize: fs(merged.fontSize, mode),
      lineHeight: fs(merged.lineHeight, mode),
    }
  }

  const sizes: Sizes = {
    control: mergeSizeMap(defaultSizes.control, input.sizes?.control, mode),
    icon: mergeSizeMap(defaultSizes.icon, input.sizes?.icon, mode),
    // A floor that scales is not a floor. On a large screen the target may
    // grow, but on a small one it must never drop below the configured
    // minimum - that value is an accessibility guarantee, not a proportion.
    minTap: Math.max(
      input.sizes?.minTap ?? defaultSizes.minTap,
      scaleValue(input.sizes?.minTap ?? defaultSizes.minTap, mode),
    ),
    hitSlop: scaleValue(input.sizes?.hitSlop ?? defaultSizes.hitSlop, mode),
    // Borders are never scaled: below 1dp some devices drop the hairline
    // entirely, above it the line reads heavy.
    borderWidth: input.sizes?.borderWidth ?? defaultSizes.borderWidth,
  }

  const buttonInput = input.components?.Button
  const button: ButtonConfig = {
    ...defaultButton,
    ...buttonInput,
    height: mergeSizeMap(defaultButton.height, buttonInput?.height, mode),
    depth: mergeSizeMap(defaultButton.depth, buttonInput?.depth, mode),
    paddingX: mergeSizeMap(defaultButton.paddingX, buttonInput?.paddingX, mode),
    gap: mergeSizeMap(defaultButton.gap, buttonInput?.gap, mode),
    iconSize: mergeSizeMap(defaultButton.iconSize, buttonInput?.iconSize, mode),
    typeVariant: { ...defaultButton.typeVariant, ...buttonInput?.typeVariant },
    variants: mergeSpecs(defaultButton.variants, buttonInput?.variants),
  }

  const inputConfig = input.components?.Input
  const field: InputConfig = {
    ...defaultInput,
    ...inputConfig,
    height: mergeSizeMap(defaultInput.height, inputConfig?.height, mode),
    paddingX: mergeSizeMap(defaultInput.paddingX, inputConfig?.paddingX, mode),
    gap: mergeSizeMap(defaultInput.gap, inputConfig?.gap, mode),
    iconSize: mergeSizeMap(defaultInput.iconSize, inputConfig?.iconSize, mode),
    typeVariant: { ...defaultInput.typeVariant, ...inputConfig?.typeVariant },
    multilineHeight: scaleValue(inputConfig?.multilineHeight ?? defaultInput.multilineHeight, mode),
    variants: mergeSpecs(defaultInput.variants, inputConfig?.variants),
  }

  const spacingUnit = input.spacingUnit ?? 4
  const spaceCache = new Map<number, number>()

  return {
    id: input.id ?? 'bevel',
    scale: mode,
    schemes,
    defaultScheme,
    radius,
    type,
    sizes,
    gradients: { ...defaultGradients, ...input.gradients },
    spacingUnit,
    space(steps: number) {
      const hit = spaceCache.get(steps)
      if (hit !== undefined) return hit
      const value = scaleValue(steps * spacingUnit, mode)
      spaceCache.set(steps, value)
      return value
    },
    components: { Button: button, Input: field },
  }
}

/** Per-variant shallow merge: an app overrides one property without restating the rest */
function mergeSpecs<T extends object>(
  base: Record<string, T>,
  patch: Record<string, T> | undefined,
): Record<string, T> {
  if (!patch) return base
  const out: Record<string, T> = { ...base }
  for (const [name, spec] of Object.entries(patch)) {
    out[name] = { ...base[name], ...spec }
  }
  return out
}

/** Zero-config theme - components fall back to it when no provider is mounted */
export const defaultTheme: Theme = defineTheme()
