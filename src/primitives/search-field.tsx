import { forwardRef, type Ref } from 'react'
import { StyleSheet, TextInput, View } from 'react-native'

import { Input, type InputProps } from './input'

export type SearchFieldProps = Omit<InputProps, 'left' | 'right' | 'onRightPress' | 'variant'> & {
  /** Cleared through this rather than a state reset, so the caller stays in charge */
  onClear?: () => void
  variant?: string
}

/**
 * A text field that looks like a search.
 *
 * The magnifier and the clear button are drawn here rather than left to the
 * caller: every search field in an app wearing a different icon is the kind of
 * difference nobody decides on, it just accumulates.
 */
export const SearchField = forwardRef(function SearchField(
  { onClear, value, variant = 'pill', size = 'sm', ...rest }: SearchFieldProps,
  ref: Ref<TextInput>,
) {
  const hasText = typeof value === 'string' && value.length > 0

  return (
    <Input
      ref={ref}
      value={value}
      variant={variant}
      size={size}
      autoCorrect={false}
      autoCapitalize="none"
      returnKeyType="search"
      clearButtonMode="never"
      left={({ size: glyph, color }) => <SearchGlyph size={glyph} color={color} />}
      right={hasText ? ({ size: glyph, color }) => <ClearGlyph size={glyph} color={color} /> : undefined}
      onRightPress={onClear}
      {...rest}
    />
  )
})

/** Magnifier, drawn rather than imported */
export function SearchGlyph({ size, color }: { size: number; color: string }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.62,
          height: size * 0.62,
          borderRadius: size,
          borderWidth: 1.5,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: size * 0.1,
          bottom: size * 0.14,
          width: size * 0.28,
          height: 1.5,
          borderRadius: 1,
          backgroundColor: color,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  )
}

export function ClearGlyph({ size, color }: { size: number; color: string }) {
  return (
    <View
      style={[
        styles.clear,
        { width: size * 0.8, height: size * 0.8, borderRadius: size, backgroundColor: color },
      ]}>
      <View style={[styles.clearBar, { width: size * 0.36 }]} />
      <View style={[styles.clearBar, styles.clearBarCross, { width: size * 0.36 }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  clear: { alignItems: 'center', justifyContent: 'center', opacity: 0.55 },
  clearBar: {
    position: 'absolute',
    height: 1.5,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
  },
  clearBarCross: { transform: [{ rotate: '-45deg' }] },
})
