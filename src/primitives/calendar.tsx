import { memo, useMemo, useState } from 'react'
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { alpha, resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import type { ColorInput } from '../theme/types'
import {
  addMonths,
  buildMonthGrid,
  formatMonthYear,
  isAfter,
  isBefore,
  isSameDay,
  isWithin,
  startOfDay,
  startOfMonth,
  weekdayLabels,
  type WeekStart,
} from '../utils/date'
import { Text } from './text'

export type DateRange = { start: Date | null; end: Date | null }

export type CalendarProps = {
  /** Single-date selection */
  value?: Date | null
  onChange?: (date: Date) => void
  /** Passing this switches the calendar to range selection */
  range?: DateRange
  onRangeChange?: (range: DateRange) => void
  /** Controlled visible month */
  month?: Date
  onMonthChange?: (month: Date) => void
  minDate?: Date | null
  maxDate?: Date | null
  /** Blocks individual days - weekends, holidays, sold-out slots */
  isDisabled?: (date: Date) => boolean
  /** 0 is Sunday. Defaults to Monday, which most of the world starts on */
  weekStart?: WeekStart
  /** BCP 47 tag for month and weekday names. Defaults to the device locale */
  locale?: string
  tone?: ColorInput
  style?: StyleProp<ViewStyle>
}

/**
 * Month grid.
 *
 * Six rows, always: a grid that changes height between months makes the sheet
 * jump as the user pages through it, and the buttons underneath move out from
 * under their thumb.
 *
 * All arithmetic lives in `utils/date` and is unit tested there - date code
 * fails on specific days, not on average ones.
 */
function CalendarBase({
  value,
  onChange,
  range,
  onRangeChange,
  month,
  onMonthChange,
  minDate,
  maxDate,
  isDisabled,
  weekStart = 1,
  locale,
  tone = 'accent',
  style,
}: CalendarProps) {
  const { colors, radius, space, sizes } = useTheme()
  const today = useMemo(() => startOfDay(new Date()), [])

  const [internalMonth, setInternalMonth] = useState(() =>
    startOfMonth(month ?? value ?? range?.start ?? today),
  )
  const visible = month ? startOfMonth(month) : internalMonth

  const setMonth = (next: Date) => {
    if (month === undefined) setInternalMonth(next)
    onMonthChange?.(next)
  }

  /**
   * Rows of seven, not one wrapping list.
   *
   * A percentage width cannot divide seven exactly: the rounding pushes the
   * last cell of every row onto the next line, and the grid quietly renders
   * six columns under a seven-column header. Explicit rows with flexible
   * cells divide the width the way a layout engine is meant to.
   */
  const weeks = useMemo(() => {
    const cells = buildMonthGrid(visible.getFullYear(), visible.getMonth(), weekStart)
    const rows: (typeof cells)[] = []
    for (let index = 0; index < cells.length; index += 7) {
      rows.push(cells.slice(index, index + 7))
    }
    return rows
  }, [visible, weekStart])
  const labels = useMemo(() => weekdayLabels(weekStart, locale), [locale, weekStart])

  const accent = resolveColor(colors, tone, colors.accent)
  const isRangeMode = range !== undefined

  const blocked = (date: Date) =>
    (minDate != null && isBefore(date, minDate)) ||
    (maxDate != null && isAfter(date, maxDate)) ||
    isDisabled?.(date) === true

  const select = (date: Date) => {
    const day = startOfDay(date)
    if (!isRangeMode) {
      onChange?.(day)
      return
    }
    const { start, end } = range
    // A third tap starts a new range: the alternative is asking the user to
    // clear it first, which nobody does.
    if (start == null || end != null) {
      onRangeChange?.({ start: day, end: null })
      return
    }
    if (isBefore(day, start)) {
      onRangeChange?.({ start: day, end: start })
      return
    }
    onRangeChange?.({ start, end: day })
  }

  const canGo = (delta: number) => {
    const target = addMonths(visible, delta)
    if (delta < 0 && minDate != null && isBefore(new Date(target.getFullYear(), target.getMonth() + 1, 0), minDate)) {
      return false
    }
    if (delta > 0 && maxDate != null && isAfter(startOfMonth(target), maxDate)) return false
    return true
  }

  return (
    <View style={[{ gap: space(2) }, style]}>
      <View style={styles.header}>
        <Arrow
          direction="left"
          color={canGo(-1) ? colors.text : colors.textFaint}
          size={sizes.icon.md}
          hitSlop={sizes.hitSlop}
          disabled={!canGo(-1)}
          onPress={() => setMonth(addMonths(visible, -1))}
        />
        <Text variant="bodyStrong" style={styles.title} numberOfLines={1}>
          {formatMonthYear(visible, locale)}
        </Text>
        <Arrow
          direction="right"
          color={canGo(1) ? colors.text : colors.textFaint}
          size={sizes.icon.md}
          hitSlop={sizes.hitSlop}
          disabled={!canGo(1)}
          onPress={() => setMonth(addMonths(visible, 1))}
        />
      </View>

      <View style={styles.row}>
        {labels.map((label) => (
          <View key={label} style={styles.cell}>
            <Text variant="micro" color="textFaint">
              {label}
            </Text>
          </View>
        ))}
      </View>

      {weeks.map((week, weekIndex) => (
        <View key={`week-${weekIndex}`} style={styles.row}>
          {week.map((cell) => {
            const disabled = blocked(cell.date)
            const isStart = isRangeMode && isSameDay(cell.date, range.start)
            const isEnd = isRangeMode && isSameDay(cell.date, range.end)
            const selected = isRangeMode ? isStart || isEnd : isSameDay(cell.date, value)
            const between =
              isRangeMode && !selected && isWithin(cell.date, range.start, range.end)
            const isToday = isSameDay(cell.date, today)

            return (
              <Pressable
                key={cell.date.getTime()}
                disabled={disabled}
                onPress={() => select(cell.date)}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled }}
                accessibilityLabel={cell.date.toDateString()}
                style={styles.cell}>
              {/* The connecting band sits behind the day and reaches the cell
                  edges, so a range reads as one continuous stretch rather than
                  a row of separate marks. */}
                {(between || (isRangeMode && (isStart || isEnd) && range.end != null)) && (
                  <View
                    style={[
                      styles.band,
                      {
                        backgroundColor: alpha(accent, 0.14),
                        left: isStart ? '50%' : 0,
                        right: isEnd ? '50%' : 0,
                      },
                    ]}
                  />
                )}
                <View
                  style={[
                    styles.day,
                    {
                      borderRadius: radius.pill,
                      backgroundColor: selected ? accent : 'transparent',
                    },
                  ]}>
                  <Text
                    variant="caption"
                    style={{
                      color: selected
                        ? colors.onAccent
                        : disabled
                          ? alpha(colors.textFaint, 0.5)
                          : cell.inMonth
                            ? isToday
                              ? accent
                              : colors.text
                            : colors.textFaint,
                      fontWeight: isToday || selected ? '700' : '400',
                    }}>
                    {cell.date.getDate()}
                  </Text>
                </View>
                {isToday && !selected && (
                  <View style={[styles.today, { backgroundColor: accent }]} />
                )}
              </Pressable>
            )
          })}
        </View>
      ))}
    </View>
  )
}

function Arrow({
  direction,
  color,
  size,
  hitSlop,
  disabled,
  onPress,
}: {
  direction: 'left' | 'right'
  color: string
  size: number
  hitSlop: number
  disabled: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={direction === 'left' ? 'Previous month' : 'Next month'}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.45,
          height: size * 0.45,
          borderRightWidth: 2,
          borderBottomWidth: 2,
          borderColor: color,
          transform: [{ rotate: direction === 'left' ? '135deg' : '-45deg' }],
        }}
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center' },
  title: { flex: 1, textAlign: 'center' },
  row: { flexDirection: 'row' },
  cell: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  band: { position: 'absolute', top: '15%', bottom: '15%' },
  day: { width: '76%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  today: { position: 'absolute', bottom: '14%', width: 4, height: 4, borderRadius: 2 },
})

export const Calendar = memo(CalendarBase)
