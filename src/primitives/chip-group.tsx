import { useState, type ReactNode } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { useTheme } from '../theme/provider'
import type { ColorInput } from '../theme/types'
import { Chip } from './chip'

export type ChipOption<T> = {
  value: T
  label: string
  disabled?: boolean
}

export type ChipGroupProps<T> = {
  options: readonly ChipOption<T>[]
  /** A single value, or an array when `multiple` */
  value: T | readonly T[] | null
  onChange: (value: T) => void
  multiple?: boolean
  /**
   * Chips shown before the rest collapse behind a count.
   *
   * A filter row that wraps to four lines has stopped being a row and started
   * being a screen. Collapsing keeps the shape of the thing above it.
   */
  max?: number
  moreLabel?: (hidden: number) => string
  lessLabel?: string
  tone?: ColorInput
  left?: (option: ChipOption<T>) => ReactNode
  style?: StyleProp<ViewStyle>
}

/**
 * A row of choices.
 *
 * Selection lives with the group, so no caller writes the same "add unless it
 * is there, remove if it is" again - and gets it subtly different each time.
 */
export function ChipGroup<T>({
  options,
  value,
  onChange,
  multiple = false,
  max,
  moreLabel = (hidden) => `+${hidden}`,
  lessLabel = 'Less',
  tone,
  left,
  style,
}: ChipGroupProps<T>) {
  const { space } = useTheme()
  const [expanded, setExpanded] = useState(false)

  const selected = (option: ChipOption<T>) =>
    multiple
      ? Array.isArray(value) && (value as readonly T[]).includes(option.value)
      : value === option.value

  const collapses = max != null && options.length > max
  const shown = collapses && !expanded ? options.slice(0, max) : options
  const hidden = options.length - shown.length

  return (
    <View style={[styles.row, { gap: space(2) }, style]}>
      {shown.map((option, index) => (
        <Chip
          key={`${String(option.value)}-${index}`}
          label={option.label}
          selected={selected(option)}
          disabled={option.disabled}
          tone={tone}
          left={left?.(option)}
          onPress={() => onChange(option.value)}
        />
      ))}

      {collapses && (
        // The counter is a chip too, so the row keeps one rhythm rather than
        // ending in a link that sits at a different height
        <Chip
          label={expanded ? lessLabel : moreLabel(hidden)}
          onPress={() => setExpanded((previous) => !previous)}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
})
