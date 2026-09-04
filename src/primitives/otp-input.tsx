import { memo, useCallback, useEffect, useRef, useState } from 'react'
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import type { ColorInput, SizeToken } from '../theme/types'
import { Text } from './text'

export type OtpInputProps = {
  value: string
  onChange: (value: string) => void
  length?: number
  /** Fires once the last cell is filled - usually submits the form */
  onComplete?: (value: string) => void
  autoFocus?: boolean
  disabled?: boolean
  error?: boolean
  /** Masks the digits, for codes that unlock money rather than sessions */
  secure?: boolean
  size?: SizeToken
  tone?: ColorInput
  style?: StyleProp<ViewStyle>
}

const CELL: Record<SizeToken, { width: number; height: number }> = {
  sm: { width: 38, height: 46 },
  md: { width: 46, height: 56 },
  lg: { width: 52, height: 64 },
}

/**
 * One-time code field.
 *
 * A single hidden input backs every cell rather than one input per digit.
 * Per-cell inputs have to hand focus back and forth, which breaks in the three
 * places that matter most: pasting a code, deleting backwards through an empty
 * cell, and platform autofill from an SMS.
 */
function OtpInputBase({
  value,
  onChange,
  length = 6,
  onComplete,
  autoFocus = false,
  disabled = false,
  error = false,
  secure = false,
  size = 'md',
  tone = 'accent',
  style,
}: OtpInputProps) {
  const { colors, radius, space, type } = useTheme()
  const inputRef = useRef<TextInput>(null)
  const [focused, setFocused] = useState(false)
  const completed = useRef(false)

  const cell = CELL[size]
  const accent = resolveColor(colors, tone, colors.accent)

  useEffect(() => {
    if (value.length === length) {
      if (!completed.current) {
        completed.current = true
        onComplete?.(value)
      }
      return
    }
    completed.current = false
  }, [length, onComplete, value])

  const handleChange = useCallback(
    (next: string) => {
      // Autofill can deliver the whole code at once, and a paste can carry
      // spaces or dashes: keep the digits and cut to length.
      const digits = next.replace(/\D/g, '').slice(0, length)
      onChange(digits)
    },
    [length, onChange],
  )

  const focus = useCallback(() => inputRef.current?.focus(), [])

  return (
    <Pressable
      onPress={disabled ? undefined : focus}
      accessibilityRole="none"
      accessibilityLabel={`${length} digit code`}
      style={[styles.row, { gap: space(2) }, style]}>
      {Array.from({ length }, (_, index) => {
        const char = value[index]
        const isActive = focused && index === Math.min(value.length, length - 1)
        return (
          <View
            key={index}
            style={{
              width: cell.width,
              height: cell.height,
              borderRadius: radius.sm,
              borderWidth: isActive || error ? 2 : 1,
              borderColor: error ? colors.danger : isActive ? accent : colors.border,
              backgroundColor: colors.sunk,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: disabled ? 0.5 : 1,
            }}>
            {char != null &&
              (secure ? (
                <View style={[styles.mask, { backgroundColor: colors.text }]} />
              ) : (
                <Text variant="title" style={{ lineHeight: type.title.fontSize * 1.1 }}>
                  {char}
                </Text>
              ))}
          </View>
        )
      })}

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoFocus={autoFocus}
        editable={!disabled}
        keyboardType="number-pad"
        returnKeyType="done"
        maxLength={length}
        // Platform SMS autofill. Without these the user has to leave the app,
        // read the code and type it back.
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        caretHidden
        // Covers the cells so a tap lands on the input itself; kept in the
        // layout rather than hidden, because an input with `display: none`
        // cannot receive autofill.
        style={styles.hidden}
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  mask: { width: 10, height: 10, borderRadius: 5 },
  hidden: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0,
    color: 'transparent',
  },
})

export const OtpInput = memo(OtpInputBase)
