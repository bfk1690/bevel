import { useState, type ReactNode } from 'react'
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { Modal } from '../feedback/modal'
import { resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import type { ColorInput, InputVariantSpec, RadiusToken, SizeToken } from '../theme/types'
import { formatDate, type WeekStart } from '../utils/date'
import { Button } from './button'
import { Calendar, type DateRange } from './calendar'
import { Text } from './text'

type Common = {
  label?: string
  placeholder?: string
  helper?: string
  error?: string | null
  required?: boolean
  disabled?: boolean
  /** Sheet title. Falls back to `label` */
  title?: string
  minDate?: Date | null
  maxDate?: Date | null
  isDisabled?: (date: Date) => boolean
  weekStart?: WeekStart
  locale?: string
  /** Replaces the default long-form date text */
  format?: (date: Date) => string
  clearLabel?: string
  doneLabel?: string
  /** Shows a clear action in the sheet */
  clearable?: boolean
  size?: SizeToken
  variant?: string
  radius?: RadiusToken | number
  bg?: ColorInput
  style?: StyleProp<ViewStyle>
}

export type DateFieldProps =
  | (Common & { range?: false; value: Date | null; onChange: (value: Date | null) => void })
  | (Common & { range: true; value: DateRange; onChange: (value: DateRange) => void })

/**
 * Date field.
 *
 * The closed control is drawn from the text field recipe, so a form does not
 * change materials halfway down, and the calendar opens in a sheet rather than
 * a platform picker - the two platforms disagree on what a date picker is, and
 * neither of their answers matches a themed app.
 *
 * A single date closes the sheet on pick, because the choice is complete. A
 * range does not: it needs two taps and an explicit end.
 */
export function DateField(props: DateFieldProps) {
  const {
    label,
    placeholder,
    helper,
    error,
    required,
    disabled,
    title,
    minDate,
    maxDate,
    isDisabled,
    weekStart,
    locale,
    format,
    clearLabel = 'Clear',
    doneLabel = 'Done',
    clearable = true,
    size = 'md',
    variant,
    radius,
    bg,
    style,
  } = props

  const { colors, theme, radius: radii, space } = useTheme()
  const config = theme.components.Input
  const spec: InputVariantSpec = config.variants[variant ?? config.defaultVariant] ?? {}

  const [open, setOpen] = useState(false)
  const isRange = props.range === true
  const hasError = typeof error === 'string' && error.length > 0

  const show = (date: Date) => (format ? format(date) : formatDate(date, locale))

  const display: string | null = isRange
    ? props.value.start
      ? `${show(props.value.start)}${props.value.end ? ` - ${show(props.value.end)}` : ''}`
      : null
    : props.value
      ? show(props.value)
      : null

  const radiusToken = radius ?? spec.radius ?? config.radius
  const borderRadius =
    typeof radiusToken === 'number' ? radiusToken : (radii[radiusToken] ?? radii.sm)

  const clear = () => {
    if (isRange) props.onChange({ start: null, end: null })
    else props.onChange(null)
  }

  return (
    <View style={[{ gap: space(1.5) }, style]}>
      {(label != null || required === true) && (
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
          color={display == null ? 'textFaint' : 'text'}
          numberOfLines={1}
          style={styles.value}>
          {display ?? placeholder ?? ''}
        </Text>
        <CalendarGlyph color={colors.textFaint} size={config.iconSize[size]} />
      </Pressable>

      {(hasError || helper != null) && (
        <Text variant={config.helperVariant} color={hasError ? 'danger' : 'textFaint'}>
          {hasError ? error : helper}
        </Text>
      )}

      <Modal visible={open} onClose={() => setOpen(false)} title={title ?? label} variant="sheet">
        {isRange ? (
          <Calendar
            range={props.value}
            onRangeChange={props.onChange}
            minDate={minDate}
            maxDate={maxDate}
            isDisabled={isDisabled}
            weekStart={weekStart}
            locale={locale}
          />
        ) : (
          <Calendar
            value={props.value}
            onChange={(date) => {
              props.onChange(date)
              setOpen(false)
            }}
            minDate={minDate}
            maxDate={maxDate}
            isDisabled={isDisabled}
            weekStart={weekStart}
            locale={locale}
          />
        )}

        <View style={[styles.actions, { gap: space(2) }]}>
          {clearable && (
            <View style={styles.action}>
              <Button label={clearLabel} variant="ghost" onPress={clear} />
            </View>
          )}
          {isRange && (
            <View style={styles.action}>
              <Button label={doneLabel} onPress={() => setOpen(false)} />
            </View>
          )}
        </View>
      </Modal>
    </View>
  )
}

/** Calendar mark, drawn rather than imported */
function CalendarGlyph({ color, size }: { color: string; size: number }) {
  return (
    <View
      style={{
        width: size,
        height: size * 0.92,
        borderWidth: 1.5,
        borderColor: color,
        borderRadius: 3,
        paddingTop: size * 0.24,
        alignItems: 'center',
      }}>
      <View style={{ width: size * 0.5, height: 1.5, backgroundColor: color }} />
      <View style={{ width: size * 0.5, height: 1.5, backgroundColor: color, marginTop: 2 }} />
    </View>
  )
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  field: { flexDirection: 'row', alignItems: 'center' },
  value: { flex: 1 },
  actions: { flexDirection: 'row' },
  action: { flex: 1 },
})
