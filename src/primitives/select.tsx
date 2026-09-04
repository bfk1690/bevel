import { useMemo, useState, type ReactNode } from 'react'
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { Modal } from '../feedback/modal'
import { resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import type { ColorInput, InputVariantSpec, RadiusToken, SizeToken } from '../theme/types'
import { Button } from './button'
import { Checkbox } from './checkbox'
import { Input } from './input'
import { Radio } from './radio'
import { Text } from './text'

export type SelectOption<T> = {
  value: T
  label: string
  description?: string
  disabled?: boolean
}

type Common<T> = {
  options: readonly SelectOption<T>[]
  label?: string
  placeholder?: string
  helper?: string
  error?: string | null
  required?: boolean
  disabled?: boolean
  /** Title of the sheet. Falls back to `label` */
  title?: string
  /** Filters the list. Worth turning on past roughly a dozen options */
  searchable?: boolean
  searchPlaceholder?: string
  emptyLabel?: string
  doneLabel?: string
  size?: SizeToken
  variant?: string
  radius?: RadiusToken | number
  bg?: ColorInput
  renderOption?: (option: SelectOption<T>, selected: boolean) => ReactNode
  style?: StyleProp<ViewStyle>
}

export type SingleSelectProps<T> = Common<T> & {
  multiple?: false
  value: T | null
  onChange: (value: T) => void
}

export type MultiSelectProps<T> = Common<T> & {
  multiple: true
  value: readonly T[]
  onChange: (value: T[]) => void
}

export type SelectProps<T> = SingleSelectProps<T> | MultiSelectProps<T>

/**
 * Option picker.
 *
 * The closed control is drawn from the same recipe as a text field, so a form
 * does not visibly change materials halfway down. Options open in a sheet
 * rather than a platform picker: the two platforms disagree on what a picker
 * looks like, and inline lists push the rest of the form off screen.
 *
 * Not memoized on purpose - wrapping a generic component erases its type
 * parameter, and a picker is not rendered often enough for it to matter.
 */
export function Select<T>(props: SingleSelectProps<T>): ReactNode
export function Select<T>(props: MultiSelectProps<T>): ReactNode
/**
 * Overloads rather than a bare union: inferring `T` from a union member picks
 * the wrong branch for a multi-select, and the option values then fail to
 * typecheck against an array element type.
 */
export function Select<T>(props: SelectProps<T>) {
  const {
    options,
    label,
    placeholder,
    helper,
    error,
    required,
    disabled,
    title,
    searchable = false,
    searchPlaceholder,
    emptyLabel = 'No results',
    doneLabel = 'Done',
    size = 'md',
    variant,
    radius,
    bg,
    renderOption,
    style,
  } = props

  const { colors, theme, radius: radii, space } = useTheme()
  const config = theme.components.Input
  const spec: InputVariantSpec = config.variants[variant ?? config.defaultVariant] ?? {}

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const multiple = props.multiple === true
  const selectedValues = multiple ? (props.value as readonly T[]) : []
  const hasError = typeof error === 'string' && error.length > 0

  const selectedLabel = useMemo(() => {
    if (multiple) {
      const labels = options.filter((o) => selectedValues.includes(o.value)).map((o) => o.label)
      return labels.length > 0 ? labels.join(', ') : null
    }
    return options.find((o) => o.value === (props.value as T | null))?.label ?? null
  }, [multiple, options, props.value, selectedValues])

  const visible = useMemo(() => {
    if (!searchable || query.trim() === '') return options
    const needle = query.trim().toLocaleLowerCase()
    return options.filter((option) => option.label.toLocaleLowerCase().includes(needle))
  }, [options, query, searchable])

  const radiusToken = radius ?? spec.radius ?? config.radius
  const borderRadius =
    typeof radiusToken === 'number' ? radiusToken : (radii[radiusToken] ?? radii.sm)

  const pick = (option: SelectOption<T>) => {
    if (option.disabled) return
    if (multiple) {
      const next = selectedValues.includes(option.value)
        ? selectedValues.filter((v) => v !== option.value)
        : [...selectedValues, option.value]
      props.onChange(next as T[])
      return
    }
    ;(props.onChange as (value: T) => void)(option.value)
    setOpen(false)
  }

  return (
    <View style={[{ gap: space(1.5) }, style]}>
      {(label != null || hasError) && (
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
        </View>
      )}

      <Pressable
        onPress={disabled ? undefined : () => setOpen(true)}
        accessibilityRole="button"
        accessibilityState={{ disabled, expanded: open }}
        accessibilityLabel={label}
        style={({ pressed }) => [
          styles.field,
          {
            minHeight: config.height[size],
            paddingHorizontal: config.paddingX[size],
            gap: config.gap[size],
            borderRadius,
            backgroundColor: resolveColor(colors, bg ?? spec.bg, 'transparent'),
            borderWidth: spec.borderWidth ?? 0,
            borderColor: hasError
              ? resolveColor(colors, spec.errorBorder, colors.danger)
              : resolveColor(colors, spec.border, 'transparent'),
            opacity: disabled ? 0.6 : pressed ? 0.85 : 1,
          },
        ]}>
        <Text
          variant={config.typeVariant[size]}
          color={selectedLabel == null ? 'textFaint' : 'text'}
          numberOfLines={1}
          style={styles.value}>
          {selectedLabel ?? placeholder ?? ''}
        </Text>
        <Caret color={colors.textFaint} />
      </Pressable>

      {(hasError || helper != null) && (
        <Text variant={config.helperVariant} color={hasError ? 'danger' : 'textFaint'}>
          {hasError ? error : helper}
        </Text>
      )}

      <Modal
        visible={open}
        onClose={() => setOpen(false)}
        title={title ?? label}
        variant="sheet"
        scrollable
        keyboardAware={searchable}>
        {searchable && (
          <Input
            value={query}
            onChangeText={setQuery}
            placeholder={searchPlaceholder}
            variant="pill"
            autoCorrect={false}
          />
        )}

        <View style={{ gap: space(3), paddingVertical: space(1) }}>
          {visible.length === 0 && (
            <Text variant="caption" color="textFaint">
              {emptyLabel}
            </Text>
          )}
          {visible.map((option, index) => {
            const selected = multiple
              ? selectedValues.includes(option.value)
              : option.value === (props.value as T | null)
            if (renderOption) {
              return (
                <Pressable key={index} onPress={() => pick(option)}>
                  {renderOption(option, selected)}
                </Pressable>
              )
            }
            return multiple ? (
              <Checkbox
                key={index}
                checked={selected}
                onChange={() => pick(option)}
                label={option.label}
                description={option.description}
                disabled={option.disabled}
              />
            ) : (
              <Radio
                key={index}
                selected={selected}
                onSelect={() => pick(option)}
                label={option.label}
                description={option.description}
                disabled={option.disabled}
              />
            )
          })}
        </View>

        {/* Single choice closes on pick; a multi-select needs an explicit end */}
        {multiple && <Button label={doneLabel} onPress={() => setOpen(false)} />}
      </Modal>
    </View>
  )
}

/** Downward caret, drawn rather than imported */
function Caret({ color }: { color: string }) {
  return (
    <View
      style={{
        width: 8,
        height: 8,
        borderRightWidth: 1.5,
        borderBottomWidth: 1.5,
        borderColor: color,
        transform: [{ rotate: '45deg' }, { translateY: -2 }],
      }}
    />
  )
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  field: { flexDirection: 'row', alignItems: 'center' },
  value: { flex: 1 },
})
