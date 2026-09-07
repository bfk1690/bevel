import {
  forwardRef,
  memo,
  useCallback,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from 'react'
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native'

import { trailingAlign } from '../theme/direction'
import { resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import type { ColorInput, InputVariantSpec, RadiusToken, SizeToken } from '../theme/types'
import { applyMask, unmask, type Mask } from '../utils/mask'
import { Text } from './text'

/**
 * Focus and blur payloads are read back off `TextInputProps` instead of being
 * imported by name: React Native has renamed those event types across
 * versions, and deriving them keeps one source compiling against all of them.
 */
type FocusEventArg = Parameters<NonNullable<TextInputProps['onFocus']>>[0]
type BlurEventArg = Parameters<NonNullable<TextInputProps['onBlur']>>[0]

export type InputSlot = ReactNode | ((props: { size: number; color: string }) => ReactNode)

export type InputProps = Omit<TextInputProps, 'style' | 'onChangeText'> & {
  label?: string
  /**
   * Marks the field required with an asterisk.
   *
   * Marking what is required beats annotating what is optional: in a form
   * where most fields are optional, "(optional)" on each one is noise.
   */
  required?: boolean
  helper?: string
  error?: string | null
  /** Overrides the theme's error presentation for this field */
  errorMode?: 'compact' | 'below'
  variant?: string
  size?: SizeToken
  left?: InputSlot
  right?: InputSlot
  onRightPress?: () => void
  /**
   * Password visibility toggle. `true` draws a built-in glyph; pass a render
   * function to supply an icon from your own set.
   */
  secureToggle?: boolean | ((props: { visible: boolean; size: number; color: string }) => ReactNode)
  /** Pattern (`'(###) ### ## ##'`) or a function */
  mask?: Mask
  onChangeText?: (value: string) => void
  /** Receives the value with every literal stripped - what a server wants */
  onChangeRaw?: (raw: string) => void
  /** Shows `12/40` when `maxLength` is set */
  showCount?: boolean
  /** Anchor for scroll-to-first-error; measure this view, not the input */
  anchorRef?: Ref<View>
  /**
   * iOS keyboards without a return key (number pads) leave the user stuck.
   * Passing this renders an accessory bar above the keyboard.
   */
  accessory?: { doneLabel?: string; nextLabel?: string; onNext?: () => void }
  bg?: ColorInput
  border?: ColorInput
  radius?: RadiusToken | number
  containerStyle?: StyleProp<ViewStyle>
  fieldStyle?: StyleProp<ViewStyle>
  inputStyle?: StyleProp<TextStyle>
}

function InputBase(
  {
    label,
    required,
    helper,
    error,
    errorMode,
    variant,
    size = 'md',
    left,
    right,
    onRightPress,
    secureToggle,
    mask,
    value,
    onChangeText,
    onChangeRaw,
    showCount,
    anchorRef,
    accessory,
    bg,
    border,
    radius,
    containerStyle,
    fieldStyle,
    inputStyle,
    multiline,
    editable = true,
    secureTextEntry,
    maxLength,
    onFocus,
    onBlur,
    ...rest
  }: InputProps,
  ref: Ref<TextInput>,
) {
  const { colors, theme, radius: radii, sizes } = useTheme()
  const config = theme.components.Input
  const spec: InputVariantSpec = config.variants[variant ?? config.defaultVariant] ?? {}

  const inputRef = useRef<TextInput>(null)
  useImperativeHandle(ref, () => inputRef.current as TextInput, [])

  const [focused, setFocused] = useState(false)
  const [hidden, setHidden] = useState(true)
  const accessoryId = useId()

  const hasError = typeof error === 'string' && error.length > 0
  const mode = errorMode ?? config.errorMode

  const resolved = useMemo(() => {
    const radiusToken = radius ?? spec.radius ?? config.radius
    const borderRadius =
      typeof radiusToken === 'number' ? radiusToken : (radii[radiusToken] ?? radii.sm)

    const base = resolveColor(colors, bg ?? spec.bg, 'transparent')
    const errorBg = resolveColor(colors, spec.errorBg, base)
    const focusBg = resolveColor(colors, spec.focusBg, base)

    const idle = resolveColor(colors, border ?? spec.border, 'transparent')
    const focus = resolveColor(colors, spec.focusBorder, idle)
    const invalid = resolveColor(colors, spec.errorBorder, colors.danger)

    return {
      borderRadius,
      background: hasError ? errorBg : focused ? focusBg : base,
      borderColor: hasError ? invalid : focused ? focus : idle,
      borderWidth: spec.borderWidth ?? 0,
      text: resolveColor(colors, spec.fg, colors.text),
      placeholder: resolveColor(colors, spec.placeholder, colors.textFaint),
      height: multiline ? config.multilineHeight : config.height[size],
      paddingX: config.paddingX[size],
      gap: config.gap[size],
      iconSize: config.iconSize[size],
      typeVariant: config.typeVariant[size],
    }
  }, [
    bg,
    border,
    colors,
    config,
    focused,
    hasError,
    multiline,
    radii,
    radius,
    size,
    spec,
  ])

  const handleFocus = useCallback(
    (event: FocusEventArg) => {
      setFocused(true)
      onFocus?.(event)
    },
    [onFocus],
  )

  const handleBlur = useCallback(
    (event: BlurEventArg) => {
      setFocused(false)
      onBlur?.(event)
    },
    [onBlur],
  )

  const handleChange = useCallback(
    (next: string) => {
      const formatted = mask ? applyMask(next, mask) : next
      onChangeText?.(formatted)
      onChangeRaw?.(mask ? unmask(formatted) : formatted)
    },
    [mask, onChangeRaw, onChangeText],
  )

  const focus = useCallback(() => inputRef.current?.focus(), [])

  const isSecure = secureTextEntry === true || (secureToggle != null && secureToggle !== false)
  const secure = isSecure ? (secureToggle != null && secureToggle !== false ? hidden : true) : false

  // `compact` folds the message into the label row so the form's height does
  // not change as errors appear; `below` gives it a line of its own.
  const message = hasError && mode === 'compact' ? error : null
  const belowMessage = hasError && mode === 'below' ? error : helper

  const displayed = mask && typeof value === 'string' ? applyMask(value, mask) : value

  const field = (
    <Pressable
      onPress={focus}
      // The whole field is the target, not just the 1-line text run inside it
      accessibilityRole="none"
      style={[
        styles.field,
        {
          minHeight: resolved.height,
          borderRadius: resolved.borderRadius,
          backgroundColor: resolved.background,
          borderColor: resolved.borderColor,
          borderWidth: resolved.borderWidth,
          paddingHorizontal: resolved.paddingX,
          gap: resolved.gap,
          alignItems: multiline ? 'flex-start' : 'center',
          paddingVertical: multiline ? resolved.gap : 0,
          opacity: editable ? 1 : 0.6,
        },
        fieldStyle,
      ]}>
      {renderSlot(left, resolved.iconSize, resolved.placeholder)}

      <TextInput
        ref={inputRef}
        value={displayed}
        onChangeText={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        editable={editable}
        /**
         * The visible label is a separate view, so nothing connects the two on
         * its own: a screen reader lands on the field and announces "text
         * field", with the word that says what to type in it left behind.
         * The message and the helper follow as the hint, which is where a
         * screen reader expects the sentence about a field rather than its
         * name.
         */
        accessibilityLabel={label}
        accessibilityHint={hasError ? (error ?? undefined) : helper}
        accessibilityState={{ disabled: !editable }}
        multiline={multiline}
        maxLength={maxLength}
        secureTextEntry={secure}
        placeholderTextColor={resolved.placeholder}
        inputAccessoryViewID={accessory && Platform.OS === 'ios' ? accessoryId : undefined}
        style={[
          styles.input,
          {
            color: resolved.text,
            fontSize: theme.type[resolved.typeVariant].fontSize,
            fontFamily: theme.type[resolved.typeVariant].fontFamily,
            // A line height on a single-line input clips descenders on Android
            lineHeight: multiline ? theme.type[resolved.typeVariant].lineHeight : undefined,
            height: multiline ? '100%' : '100%',
            textAlignVertical: multiline ? 'top' : 'center',
          },
          inputStyle,
        ]}
        {...rest}
      />

      {showCount && maxLength != null && (
        <Text
          variant="micro"
          // The counter is quiet until it matters. Colouring it from the start
          // makes a limit nobody is near look like a problem; going loud only
          // at the end tells the writer when to start cutting.
          color={
            (displayed ?? '').length >= maxLength
              ? 'danger'
              : (displayed ?? '').length >= maxLength * 0.9
                ? 'warning'
                : 'textFaint'
          }>
          {`${(displayed ?? '').length}/${maxLength}`}
        </Text>
      )}

      {secureToggle != null && secureToggle !== false ? (
        <Pressable
          onPress={() => setHidden((prev) => !prev)}
          hitSlop={sizes.hitSlop}
          accessibilityRole="button"
          accessibilityState={{ selected: !hidden }}>
          {typeof secureToggle === 'function' ? (
            secureToggle({ visible: !hidden, size: resolved.iconSize, color: resolved.placeholder })
          ) : (
            <EyeGlyph visible={!hidden} size={resolved.iconSize} color={resolved.placeholder} />
          )}
        </Pressable>
      ) : right != null ? (
        <Pressable
          onPress={onRightPress}
          disabled={onRightPress == null}
          hitSlop={sizes.hitSlop}
          accessibilityRole={onRightPress ? 'button' : 'none'}>
          {renderSlot(right, resolved.iconSize, resolved.placeholder)}
        </Pressable>
      ) : null}
    </Pressable>
  )

  return (
    <View ref={anchorRef} style={[styles.container, containerStyle]} collapsable={false}>
      {(label != null || message != null) && (
        <View style={styles.labelRow}>
          {label != null && (
            <Text variant={config.labelVariant} color={hasError ? 'danger' : 'textMuted'}>
              {label}
            </Text>
          )}
          {required === true && (
            <Text variant={config.labelVariant} color="danger">
              *
            </Text>
          )}
          {message != null && (
            <Text variant={config.helperVariant} color="danger" numberOfLines={1} style={[styles.message, { textAlign: trailingAlign() }]}>
              {message}
            </Text>
          )}
        </View>
      )}

      {field}

      {belowMessage != null && belowMessage !== '' && (
        <Text variant={config.helperVariant} color={hasError ? 'danger' : 'textFaint'}>
          {belowMessage}
        </Text>
      )}

      {accessory && Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={accessoryId}>
          <View style={[styles.accessory, { backgroundColor: colors.raised }]}>
            {accessory.onNext ? (
              <Pressable onPress={accessory.onNext} hitSlop={sizes.hitSlop}>
                <Text variant="label" color="accent">
                  {accessory.nextLabel ?? 'Next'}
                </Text>
              </Pressable>
            ) : (
              <View />
            )}
            <Pressable onPress={Keyboard.dismiss} hitSlop={sizes.hitSlop}>
              <Text variant="label" color="accent">
                {accessory.doneLabel ?? 'Done'}
              </Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      )}
    </View>
  )
}

function renderSlot(slot: InputSlot | undefined, size: number, color: string): ReactNode {
  if (slot == null) return null
  return typeof slot === 'function' ? slot({ size, color }) : slot
}

/**
 * Built-in visibility glyph, drawn with views.
 *
 * A default that works without an icon dependency: the package cannot ship an
 * icon set, and a toggle that renders nothing until you wire one up is worse
 * than a plain one.
 */
function EyeGlyph({ visible, size, color }: { visible: boolean; size: number; color: string }) {
  const width = size
  const height = Math.round(size * 0.66)
  return (
    <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width,
          height,
          borderRadius: height / 2,
          borderWidth: 1.5,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: height * 0.42,
          height: height * 0.42,
          borderRadius: height,
          backgroundColor: color,
        }}
      />
      {!visible && (
        <View
          style={{
            position: 'absolute',
            width: width * 1.15,
            height: 1.5,
            backgroundColor: color,
            transform: [{ rotate: '-35deg' }],
          }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  message: { flex: 1 },
  field: { flexDirection: 'row', overflow: 'hidden' },
  input: { flex: 1, padding: 0, margin: 0 },
  accessory: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
})

/**
 * Text field.
 *
 * Focus, error and disabled are STATES of one variant rather than separate
 * variants, so an app restyles a field by describing a single surface.
 */
export const Input = memo(forwardRef<TextInput, InputProps>(InputBase))
