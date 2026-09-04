import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import {
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { alpha, resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import type { ColorInput } from '../theme/types'
import {
  buildHourOptions,
  buildMinuteOptions,
  clampTime,
  from12Hour,
  prefers12Hour,
  snapMinutes,
  to12Hour,
  type Period,
  type TimeValue,
} from '../utils/time'
import { Text } from './text'

export type TimePickerProps = {
  value: TimeValue
  onChange: (value: TimeValue) => void
  /** 1, 5, 15 - whatever the domain actually offers */
  minuteStep?: number
  /** Defaults to whatever the locale writes */
  use12Hour?: boolean
  locale?: string
  minTime?: TimeValue | null
  maxTime?: TimeValue | null
  /** Odd numbers centre cleanly. Defaults to 5 */
  visibleRows?: number
  tone?: ColorInput
  style?: StyleProp<ViewStyle>
}

/**
 * Wheel time picker.
 *
 * A scroll view with snapping rather than a native picker: the platform
 * pickers cannot be themed, differ from each other, and on Android the dialog
 * takes over the whole screen for a two-number decision.
 *
 * Rows are a fixed height so `snapToInterval` can do the work the platform
 * would otherwise do in native code, which keeps the deceleration curve and
 * the snap on the UI thread.
 */
function TimePickerBase({
  value,
  onChange,
  minuteStep = 1,
  use12Hour,
  locale,
  minTime,
  maxTime,
  visibleRows = 5,
  tone = 'accent',
  style,
}: TimePickerProps) {
  const { colors, radius, space, sizes } = useTheme()

  const twelve = use12Hour ?? prefers12Hour(locale)
  const rowHeight = Math.round(sizes.control.sm)
  const height = rowHeight * visibleRows
  /**
   * Columns are a fixed width.
   *
   * Left to size themselves the scroll views spread across the sheet and the
   * three wheels stop reading as one control - the eye has to travel to
   * connect an hour with its minutes.
   */
  const columnWidth = Math.round(rowHeight * 2)

  const hours = useMemo(() => buildHourOptions(twelve), [twelve])
  const minutes = useMemo(() => buildMinuteOptions(minuteStep), [minuteStep])

  const snapped = useMemo(() => snapMinutes(value, minuteStep), [minuteStep, value])
  const { hour: displayHour, period } = to12Hour(snapped.hours)

  const commit = useCallback(
    (next: TimeValue) => {
      onChange(clampTime(next, minTime, maxTime))
    },
    [maxTime, minTime, onChange],
  )

  const accent = resolveColor(colors, tone, colors.accent)

  return (
    <View style={[styles.root, { height }, style]}>
      {/*
        The columns are grouped, and the band fills the group.
        
        Sizing the band by arithmetic instead - column width times count - is
        how it ends up a few points narrower than what it highlights: the
        separator between the wheels has a width of its own.
      */}
      <View style={[styles.group, { paddingHorizontal: space(2) }]}>
        <View
          pointerEvents="none"
          style={[
            styles.band,
            {
              height: rowHeight,
              top: (height - rowHeight) / 2,
              borderRadius: radius.sm,
              backgroundColor: alpha(accent, 0.12),
            },
          ]}
        />

        <Wheel
        options={hours}
        selected={twelve ? displayHour : snapped.hours}
        rowHeight={rowHeight}
        height={height}
        width={columnWidth}
        format={(hour) => (twelve ? String(hour) : String(hour).padStart(2, '0'))}
        onSelect={(hour) =>
          commit({
            hours: twelve ? from12Hour(hour, period) : hour,
            minutes: snapped.minutes,
          })
        }
      />

        <Text variant="heading" color="textMuted" style={{ paddingHorizontal: space(1) }}>
          :
        </Text>

        <Wheel
        options={minutes}
        selected={snapped.minutes}
        rowHeight={rowHeight}
        height={height}
        width={columnWidth}
        format={(minute) => String(minute).padStart(2, '0')}
        onSelect={(minute) => commit({ hours: snapped.hours, minutes: minute })}
      />

        {twelve && (
          <Wheel
            options={['AM', 'PM'] as const}
            selected={period}
            rowHeight={rowHeight}
            height={height}
            width={columnWidth}
            format={(item) => item}
            onSelect={(next) =>
              commit({ hours: from12Hour(displayHour, next as Period), minutes: snapped.minutes })
            }
          />
        )}
      </View>
    </View>
  )
}

type WheelProps<T extends string | number> = {
  options: readonly T[]
  selected: T
  rowHeight: number
  height: number
  width: number
  format: (option: T) => string
  onSelect: (option: T) => void
}

function Wheel<T extends string | number>({
  options,
  selected,
  rowHeight,
  height,
  width,
  format,
  onSelect,
}: WheelProps<T>) {
  const { colors } = useTheme()
  const ref = useRef<ScrollView>(null)
  const index = Math.max(0, options.indexOf(selected))
  /** What the user last scrolled to, so an echo of our own change is ignored */
  const reported = useRef(index)

  useEffect(() => {
    if (index === reported.current) return
    reported.current = index
    ref.current?.scrollTo({ y: index * rowHeight, animated: true })
  }, [index, rowHeight])

  const settle = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(event.nativeEvent.contentOffset.y / rowHeight)
      const bounded = Math.min(options.length - 1, Math.max(0, next))
      if (bounded === reported.current) return
      reported.current = bounded
      const option = options[bounded]
      if (option !== undefined) onSelect(option)
    },
    [onSelect, options, rowHeight],
  )

  return (
    <ScrollView
      ref={ref}
      // flexGrow is what a ScrollView carries by default, and in a row it
      // overrides the width: the columns spread across the sheet and stop
      // reading as one control.
      style={{ height, width, flexGrow: 0, flexShrink: 0 }}
      showsVerticalScrollIndicator={false}
      snapToInterval={rowHeight}
      decelerationRate="fast"
      // A slow drag never gains momentum, so both endings have to be handled
      // or the wheel is left resting between two rows.
      onMomentumScrollEnd={settle}
      onScrollEndDrag={settle}
      contentOffset={{ x: 0, y: index * rowHeight }}
      contentContainerStyle={{ paddingVertical: (height - rowHeight) / 2 }}>
      {options.map((option) => {
        const isSelected = option === selected
        return (
          <View key={String(option)} style={[styles.row, { height: rowHeight }]}>
            <Text
              variant="body"
              style={{
                color: isSelected ? colors.text : colors.textFaint,
                fontWeight: isSelected ? '700' : '400',
              }}>
              {format(option)}
            </Text>
          </View>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center' },
  group: { flexDirection: 'row', alignItems: 'center' },
  band: { position: 'absolute', left: 0, right: 0 },
  row: { alignItems: 'center', justifyContent: 'center' },
})

export const TimePicker = memo(TimePickerBase)
