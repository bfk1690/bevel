import { memo, useCallback, useMemo, useRef, type ReactNode } from 'react'
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native'

import { darken, luminance, resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import { shadow as shadowStyle } from '../theme/shadow'
import type {
  ButtonVariantSpec,
  ColorInput,
  PressEffect,
  RadiusToken,
  ShadowPreset,
  SizeToken,
} from '../theme/types'
import { dismissKeyboard } from '../utils/keyboard'
import { Text } from './text'

/** A node, or a render function receiving the resolved icon size and color */
export type ButtonSlot = ReactNode | ((props: { size: number; color: string }) => ReactNode)

export type ButtonProps = Omit<PressableProps, 'style' | 'children' | 'onPress'> & {
  label?: string
  /** Replaces the built-in content row entirely */
  children?: ReactNode
  onPress?: (event: GestureResponderEvent) => void
  /** Any key defined in `theme.components.Button.variants` */
  variant?: string
  size?: SizeToken
  loading?: boolean
  /** Leading node - an icon, an avatar, a logo */
  left?: ButtonSlot
  right?: ButtonSlot
  /** Small uppercase label before the text */
  tag?: string
  /** Badge after the text - a price, a count, a shortcut */
  trailing?: string
  /** Stretch to the container's width. Defaults to true */
  full?: boolean
  align?: 'center' | 'flex-start' | 'flex-end' | 'space-between'
  /** Per-instance overrides; the variant supplies the rest */
  bg?: ColorInput
  fg?: ColorInput
  border?: ColorInput
  radius?: RadiusToken | number
  press?: PressEffect
  shadow?: ShadowPreset
  /** Bevel depth in px for `press: 'depth'` */
  depth?: number
  /**
   * Ignore repeat presses within this window (ms). `true` uses 400ms.
   *
   * On by default: a double tap on a navigating or submitting button is one of
   * the most common defects in mobile apps, and the fix is easy to forget at
   * every call site. Pass `false` for controls meant to fire rapidly, such as
   * quantity steppers.
   */
  preventDoublePress?: boolean | number
  /** Dismiss the keyboard before firing. Defaults to true */
  dismissKeyboardOnPress?: boolean
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

const PRESS_IN = { toValue: 0.97, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: true }
const PRESS_OUT = { toValue: 1, duration: 130, easing: Easing.out(Easing.quad), useNativeDriver: true }
const DEFAULT_DOUBLE_PRESS_MS = 400

function ButtonBase({
  label,
  children,
  onPress,
  variant,
  size = 'md',
  loading = false,
  disabled,
  left,
  right,
  tag,
  trailing,
  full = true,
  align = 'center',
  bg,
  fg,
  border,
  radius,
  press,
  shadow,
  depth,
  preventDoublePress = true,
  dismissKeyboardOnPress = true,
  style,
  textStyle,
  accessibilityLabel,
  ...rest
}: ButtonProps) {
  const { colors, theme, radius: radii, sizes } = useTheme()
  const config = theme.components.Button
  const spec: ButtonVariantSpec = config.variants[variant ?? config.defaultVariant] ?? {}

  /** Blocks interaction. Loading counts: a second press would fire twice. */
  const isDisabled = disabled === true || loading
  /**
   * Drives appearance, and loading does NOT count.
   *
   * A button that greys out while it works reads as "you cannot do this",
   * which is the opposite of what is happening - it is doing exactly what was
   * asked. It keeps its color, its gradient and its width, and swaps the label
   * for a spinner.
   */
  const isInactive = disabled === true

  const resolved = useMemo(() => {
    const height = config.height[size]
    const radiusToken = radius ?? spec.radius ?? config.radius
    const borderRadius =
      typeof radiusToken === 'number' ? radiusToken : (radii[radiusToken] ?? radii.sm)

    const background = resolveColor(
      colors,
      bg ?? (isInactive ? (config.disabledBg ?? 'borderStrong') : spec.bg),
      'transparent',
    )
    const isFlat = background === 'transparent' || background === 'rgba(0, 0, 0, 0)'

    // A variant without `fg` picks a foreground from the background's
    // luminance, so an overridden `bg` can never produce invisible text.
    const foreground = fg
      ? resolveColor(colors, fg, colors.text)
      : spec.fg
        ? resolveColor(colors, spec.fg, colors.text)
        : isFlat
          ? colors.text
          : luminance(background) > 0.55
            ? colors.text
            : colors.onAccent

    const borderColor = resolveColor(colors, border ?? spec.border, 'transparent')
    const borderWidth =
      border !== undefined && spec.borderWidth === undefined
        ? sizes.borderWidth
        : (spec.borderWidth ?? 0)

    let effect: PressEffect = press ?? spec.press ?? config.press
    // The bevel needs an opaque edge to compress against; on a transparent
    // surface it would draw a floating line, so fall back to dimming.
    if (effect === 'depth' && isFlat) effect = 'opacity'

    const bevel = depth ?? spec.depth ?? config.depth[size]
    // Darken less on light surfaces: the same ratio turns a pale button muddy.
    const edgeSource = isFlat ? borderColor : background
    const edgeColor = darken(edgeSource, luminance(edgeSource) > 0.6 ? 0.18 : 0.32)

    const preset = shadow ?? spec.shadow ?? config.shadow

    return {
      height,
      borderRadius,
      background,
      foreground,
      borderColor,
      borderWidth,
      effect,
      bevel: effect === 'depth' ? bevel : 0,
      edgeColor,
      iconSize: config.iconSize[size],
      gap: config.gap[size],
      paddingX: config.paddingX[size],
      typeVariant: config.typeVariant[size],
      opacity: spec.opacity ?? 1,
      shadow: isInactive || isFlat ? shadowStyle('none') : shadowStyle(preset, colors.media),
      gradient: spec.gradient ? theme.gradients[spec.gradient] : undefined,
    }
  }, [
    bg,
    border,
    colors,
    config,
    depth,
    fg,
    isInactive,
    press,
    radii,
    radius,
    shadow,
    size,
    sizes.borderWidth,
    spec,
    theme.gradients,
  ])

  /**
   * Touch target floor.
   *
   * A small button is a legitimate design choice, but a small TARGET is not:
   * the gap is made up with hit slop instead of forcing a taller control.
   */
  const slop = useMemo(() => {
    const extra = Math.max(0, (sizes.minTap - resolved.height) / 2)
    const value = Math.round(sizes.hitSlop + extra)
    return { top: value, bottom: value, left: value, right: value }
  }, [resolved.height, sizes.hitSlop, sizes.minTap])

  const lastPress = useRef(0)
  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      if (preventDoublePress !== false) {
        const windowMs =
          typeof preventDoublePress === 'number' ? preventDoublePress : DEFAULT_DOUBLE_PRESS_MS
        const now = Date.now()
        if (now - lastPress.current < windowMs) return
        lastPress.current = now
      }
      if (dismissKeyboardOnPress) dismissKeyboard()
      onPress?.(event)
    },
    [dismissKeyboardOnPress, onPress, preventDoublePress],
  )

  const scale = useRef(new Animated.Value(1)).current
  const onPressIn = useCallback(() => {
    Animated.timing(scale, PRESS_IN).start()
  }, [scale])
  const onPressOut = useCallback(() => {
    Animated.timing(scale, PRESS_OUT).start()
  }, [scale])

  const shell: ViewStyle = {
    height: resolved.height,
    borderRadius: resolved.borderRadius,
    backgroundColor: resolved.background,
    borderColor: resolved.borderColor,
    borderWidth: resolved.borderWidth,
    justifyContent: align,
    paddingHorizontal: label != null || children != null ? resolved.paddingX : 0,
    gap: resolved.gap,
    opacity: isInactive ? config.disabledOpacity : resolved.opacity,
    ...resolved.shadow,
  }

  const content = (
    <>
      {resolved.gradient && !isInactive ? (
        // The gradient is clipped in its OWN layer: putting `overflow: hidden`
        // on the shell would also clip the shadow, which iOS masks to bounds.
        <View
          style={[StyleSheet.absoluteFill, { borderRadius: resolved.borderRadius, overflow: 'hidden' }]}
          pointerEvents="none">
          <GradientLayer colors={resolved.gradient} />
        </View>
      ) : null}

      <View style={[styles.row, { gap: resolved.gap }, loading && styles.hidden]}>
        {renderSlot(left, resolved.iconSize, resolved.foreground)}
        {children ?? (
          <>
            {tag != null && (
              <Text variant="micro" style={[{ color: resolved.foreground, opacity: 0.72 }]}>
                {tag}
              </Text>
            )}
            {label != null && (
              <Text
                variant={resolved.typeVariant}
                numberOfLines={1}
                style={[{ color: resolved.foreground }, textStyle]}>
                {label}
              </Text>
            )}
            {trailing != null && (
              <View style={styles.trailing}>
                <Text variant="micro" style={{ color: resolved.foreground }}>
                  {trailing}
                </Text>
              </View>
            )}
          </>
        )}
        {renderSlot(right, resolved.iconSize, resolved.foreground)}
      </View>

      {/* Absolutely positioned so the button keeps its width while loading -
          swapping the label out makes the control jump mid-interaction. */}
      {loading ? (
        <View style={styles.center} pointerEvents="none">
          <ActivityIndicator color={resolved.foreground} size="small" />
        </View>
      ) : null}
    </>
  )

  const common = {
    accessibilityRole: 'button' as const,
    accessibilityState: { disabled: isDisabled, busy: loading },
    accessibilityLabel: accessibilityLabel ?? label,
    disabled: isDisabled,
    hitSlop: slop,
    onPress: handlePress,
    ...rest,
  }

  // `scale` and `none` need no pressed state, so they use a static style array
  // and the component never re-renders on touch.
  if (resolved.effect === 'scale') {
    return (
      <AnimatedPressable
        {...common}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.base, full && styles.full, shell, { transform: [{ scale }] }, style]}>
        {content}
      </AnimatedPressable>
    )
  }

  if (resolved.effect === 'none') {
    return (
      <Pressable {...common} style={[styles.base, full && styles.full, shell, style]}>
        {content}
      </Pressable>
    )
  }

  return (
    <Pressable
      {...common}
      style={({ pressed }) => [
        styles.base,
        full && styles.full,
        shell,
        resolved.effect === 'depth'
          ? {
              // The border lives inside the height, so compressing it and
              // translating by the same amount keeps the footprint identical -
              // neighbours never shift when the button is pressed.
              borderBottomWidth: pressed && !isDisabled ? 0 : resolved.bevel,
              borderBottomColor: resolved.edgeColor,
              transform: [{ translateY: pressed && !isDisabled ? resolved.bevel : 0 }],
            }
          : pressed && !isDisabled && styles.dimmed,
        style,
      ]}>
      {content}
    </Pressable>
  )
}

function GradientLayer({ colors }: { colors: readonly string[] }) {
  const { renderGradient } = useTheme()
  if (!renderGradient) return null
  return <>{renderGradient({ colors, style: StyleSheet.absoluteFill })}</>
}

function renderSlot(slot: ButtonSlot | undefined, size: number, color: string): ReactNode {
  if (slot == null) return null
  return typeof slot === 'function' ? slot({ size, color }) : slot
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    overflow: 'visible',
  },
  full: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  hidden: { opacity: 0 },
  center: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimmed: { opacity: 0.62 },
  trailing: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    // Tied to the label color rather than a fixed token: the badge sits on
    // solid, gradient and outlined surfaces alike.
    backgroundColor: 'rgba(0,0,0,0.16)',
  },
})

function areEqual(prev: ButtonProps, next: ButtonProps): boolean {
  return (
    prev.label === next.label &&
    prev.variant === next.variant &&
    prev.size === next.size &&
    prev.loading === next.loading &&
    prev.disabled === next.disabled &&
    prev.tag === next.tag &&
    prev.trailing === next.trailing &&
    prev.full === next.full &&
    prev.align === next.align &&
    prev.bg === next.bg &&
    prev.fg === next.fg &&
    prev.border === next.border &&
    prev.radius === next.radius &&
    prev.press === next.press &&
    prev.shadow === next.shadow &&
    prev.depth === next.depth &&
    prev.onPress === next.onPress &&
    prev.left === next.left &&
    prev.right === next.right &&
    prev.children === next.children &&
    prev.style === next.style &&
    prev.textStyle === next.textStyle &&
    prev.preventDoublePress === next.preventDoublePress &&
    prev.dismissKeyboardOnPress === next.dismissKeyboardOnPress
  )
}

/**
 * Button.
 *
 * Everything visual comes from `theme.components.Button`: sizes, radii, press
 * behaviour and the variant table. An app adds a variant by naming it in the
 * theme, not by forking this file, and any single call can still override the
 * pieces it needs.
 *
 * Press behaviour is a first-class choice rather than a house style - `depth`
 * renders a physical bevel, `scale` a soft press, `opacity` a flat dim, `none`
 * nothing at all.
 */
export const Button = memo(ButtonBase, areEqual)
