import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { useTheme } from '../theme/provider'
import { shadow as shadowStyle } from '../theme/shadow'
import { rankSuggestions } from '../utils/search'
import { Input, type InputProps } from './input'
import { Text } from './text'

export type AutocompleteProps<T> = Omit<InputProps, 'value' | 'onChangeText'> & {
  value: string
  onChangeText: (value: string) => void
  options: readonly T[]
  /** The text a candidate is matched and displayed by */
  toText: (item: T) => string
  onSelect: (item: T) => void
  /** Secondary line under the suggestion */
  toDescription?: (item: T) => string | undefined
  renderOption?: (item: T, index: number) => ReactNode
  /** Longest list of suggestions. Defaults to 6 */
  limit?: number
  /** Shows every option when the field is focused and still empty */
  showAllWhenEmpty?: boolean
  emptyLabel?: string
  containerStyle?: StyleProp<ViewStyle>
}

/**
 * A field that suggests as you type.
 *
 * The list is drawn INLINE, below the field, rather than floating over the
 * screen. A floating list has to be measured, flipped and clamped, and it
 * covers the very form the user is filling in; in a form, pushing the fields
 * below it down is both simpler and less surprising.
 *
 * Matching folds accents and case away, so someone typing "sisli" on a
 * keyboard they cannot be bothered to switch still finds "Şişli".
 */
export function Autocomplete<T>({
  value,
  onChangeText,
  options,
  toText,
  onSelect,
  toDescription,
  renderOption,
  limit = 6,
  showAllWhenEmpty = false,
  emptyLabel,
  containerStyle,
  onFocus,
  onBlur,
  ...rest
}: AutocompleteProps<T>) {
  const { colors, radius, space } = useTheme()
  const [focused, setFocused] = useState(false)

  const suggestions = useMemo(
    () => rankSuggestions(value, options, toText, { limit, emptyReturnsAll: showAllWhenEmpty }),
    [limit, options, showAllWhenEmpty, toText, value],
  )

  const choose = useCallback(
    (item: T) => {
      onChangeText(toText(item))
      onSelect(item)
      setFocused(false)
    },
    [onChangeText, onSelect, toText],
  )

  // An exact match is not a suggestion: once the field holds what the list
  // would offer, the list is only in the way.
  const settled = suggestions.length === 1 && toText(suggestions[0]!) === value
  const open = focused && !settled && (suggestions.length > 0 || emptyLabel != null)

  return (
    <View style={[{ gap: space(2) }, containerStyle]}>
      <Input
        value={value}
        onChangeText={onChangeText}
        autoCorrect={false}
        onFocus={(event) => {
          setFocused(true)
          onFocus?.(event)
        }}
        onBlur={(event) => {
          // Left open for a moment so a tap on a suggestion is not lost to the
          // blur that the same tap causes
          setTimeout(() => setFocused(false), 120)
          onBlur?.(event)
        }}
        {...rest}
      />

      {open && (
        <View
          style={[
            styles.list,
            {
              borderRadius: radius.md,
              backgroundColor: colors.sheet,
              borderColor: colors.border,
              ...shadowStyle('float', colors.media),
            },
          ]}>
          <ScrollView keyboardShouldPersistTaps="always" style={styles.scroll}>
            {suggestions.length === 0 && emptyLabel != null && (
              <Text
                variant="caption"
                color="textFaint"
                style={{ paddingHorizontal: space(3), paddingVertical: space(3) }}>
                {emptyLabel}
              </Text>
            )}

            {suggestions.map((item, index) => (
              <Pressable
                key={`${toText(item)}-${index}`}
                onPress={() => choose(item)}
                accessibilityRole="button"
                style={({ pressed }) => [
                  {
                    paddingHorizontal: space(3),
                    paddingVertical: space(2.5),
                    gap: 2,
                    backgroundColor: pressed ? colors.raised : 'transparent',
                  },
                  index > 0 && {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: colors.border,
                  },
                ]}>
                {renderOption ? (
                  renderOption(item, index)
                ) : (
                  <>
                    <Text variant="body">{toText(item)}</Text>
                    {toDescription?.(item) != null && (
                      <Text variant="caption" color="textMuted">
                        {toDescription(item)}
                      </Text>
                    )}
                  </>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  list: { borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  // Enough for about four rows before it scrolls, so the list never swallows
  // the form it belongs to
  scroll: { maxHeight: 240 },
})
