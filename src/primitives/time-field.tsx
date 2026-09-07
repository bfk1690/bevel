import { useState } from 'react'
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { Modal } from '../feedback/modal'
import { resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import type { ColorInput, InputVariantSpec, RadiusToken, SizeToken } from '../theme/types'
import { clampTime, formatTime, snapMinutes, type TimeValue } from '../utils/time'
import { Button } from './button'
import { Text } from './text'
import { TimePicker } from './time-picker'

export type TimeFieldProps = {
  value: TimeValue | null
  onChange: (value: TimeValue | null) => void
  label?: string
  placeholder?: string
  helper?: string
  error?: string | null
  required?: boolean
  disabled?: boolean
  /** Sheet title. Falls back to `label` */
  title?: string
  minuteStep?: number
  use12Hour?: boolean
  locale?: string
  minTime?: TimeValue | null
  maxTime?: TimeValue | null
  /** The value used when the sheet opens with nothing selected */
  defaultTime?: TimeValue
  clearable?: boolean
  clearLabel?: string
  doneLabel?: string
  size?: SizeToken
  variant?: string
  radius?: RadiusToken | number
  bg?: ColorInput
  style?: StyleProp<ViewStyle>
}

const NOON: TimeValue = { hours: 12, minutes: 0 }

/**
 * Time field.
 *
 * Drawn from the text field recipe like every other picker here, so a form
 * keeps one material throughout. The sheet keeps a done button even though the
 * wheels report every change: scrolling past a value is not choosing it, and
 * closing on the first stop would take the decision away mid-gesture.
 */
export function TimeField({
  value,
  onChange,
  label,
  placeholder,
  helper,
  error,
  required,
  disabled,
  title,
  minuteStep = 1,
  use12Hour,
  locale,
  minTime,
  maxTime,
  defaultTime = NOON,
  clearable = true,
  clearLabel = 'Clear',
  doneLabel = 'Done',
  size = 'md',
  variant,
  radius,
  bg,
  style,
}: TimeFieldProps) {
  const { colors, theme, radius: radii, space } = useTheme()
  const config = theme.components.Input
  const spec: InputVariantSpec = config.variants[variant ?? config.defaultVariant] ?? {}

  const [open, setOpen] = useState(false)
  /** The sheet edits a copy, so cancelling by swiping down changes nothing */
  const [draft, setDraft] = useState<TimeValue>(value ?? defaultTime)

  const hasError = typeof error === 'string' && error.length > 0
  const display = value ? formatTime(value, locale, use12Hour) : null

  const radiusToken = radius ?? spec.radius ?? config.radius
  const borderRadius =
    typeof radiusToken === 'number' ? radiusToken : (radii[radiusToken] ?? radii.sm)

  const openSheet = () => {
    setDraft(clampTime(snapMinutes(value ?? defaultTime, minuteStep), minTime, maxTime))
    setOpen(true)
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
        onPress={disabled ? undefined : openSheet}
        accessibilityRole="button"
        accessibilityState={{ disabled, expanded: open }}
        accessibilityLabel={label}
        // What it holds now, so the field is not announced as an empty button
        accessibilityValue={{ text: display ?? placeholder }}
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
        <ClockGlyph color={colors.textFaint} size={config.iconSize[size]} />
      </Pressable>

      {(hasError || helper != null) && (
        <Text variant={config.helperVariant} color={hasError ? 'danger' : 'textFaint'}>
          {hasError ? error : helper}
        </Text>
      )}

      <Modal visible={open} onClose={() => setOpen(false)} title={title ?? label} variant="sheet">
        <TimePicker
          value={draft}
          onChange={setDraft}
          minuteStep={minuteStep}
          use12Hour={use12Hour}
          locale={locale}
          minTime={minTime}
          maxTime={maxTime}
        />

        <View style={[styles.actions, { gap: space(2) }]}>
          {clearable && (
            <View style={styles.action}>
              <Button
                label={clearLabel}
                variant="ghost"
                onPress={() => {
                  onChange(null)
                  setOpen(false)
                }}
              />
            </View>
          )}
          <View style={styles.action}>
            <Button
              label={doneLabel}
              onPress={() => {
                onChange(draft)
                setOpen(false)
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  )
}

/** Clock face, drawn rather than imported */
function ClockGlyph({ color, size }: { color: string; size: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <View style={{ position: 'absolute', width: 1.5, height: size * 0.3, backgroundColor: color, top: size * 0.2 }} />
      <View
        style={{
          position: 'absolute',
          width: size * 0.24,
          height: 1.5,
          backgroundColor: color,
          left: size / 2,
          top: size / 2,
        }}
      />
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
