import { Children, memo } from 'react'
import { Text as RNText, type TextProps, type TextStyle } from 'react-native'

import { resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import type { ColorInput, TypeToken } from '../theme/types'
import { upper } from '../utils/case'

export type BevelTextProps = TextProps & {
  variant?: TypeToken
  /** Role name or raw color */
  color?: ColorInput
  /** Force uppercase regardless of the variant's own flag */
  uppercase?: boolean
  align?: TextStyle['textAlign']
  /** Overrides the variant's weight without leaving the type scale */
  weight?: TextStyle['fontWeight']
}

/**
 * The single text primitive.
 *
 * `variant` and `color` are deliberately independent: the type scale and
 * semantic color are orthogonal, so the same `caption` can render neutral in
 * one place and as a warning in another without a new variant.
 *
 * Casing is applied to the STRING, never through `textTransform`, because
 * platform casing is locale-blind (see `utils/case`).
 */
function TextBase({
  variant = 'body',
  color = 'text',
  uppercase,
  align,
  weight,
  style,
  children,
  ...rest
}: BevelTextProps) {
  // Subscribes this component to theme changes - required even though the
  // style proxy below already resolves to the active scheme.
  const { colors, type } = useTheme()
  const spec = type[variant]

  const cased = uppercase ?? spec.uppercase === true

  return (
    <RNText
      style={[
        {
          fontSize: spec.fontSize,
          lineHeight: spec.lineHeight,
          fontWeight: weight ?? spec.fontWeight,
          fontFamily: spec.fontFamily,
          letterSpacing: spec.letterSpacing,
          color: resolveColor(colors, color, colors.text),
          textAlign: align,
        },
        style,
      ]}
      {...rest}>
      {cased
        ? Children.map(children, (child) => (typeof child === 'string' ? upper(child) : child))
        : children}
    </RNText>
  )
}

export const Text = memo(TextBase)
