import { memo } from 'react'

import { formatDuration, spokenDuration, type DurationStyle, type SpokenUnits } from '../utils/duration'
import { useCountdown } from '../utils/hooks'
import { Text, type BevelTextProps } from './text'

export type CountdownProps = Omit<BevelTextProps, 'children'> & {
  /** The moment it reaches zero */
  to: Date | number
  /**
   * `clock` for something running, `compact` for something stated.
   *
   * Named `format` rather than `style`, which a text component already owns.
   */
  format?: DurationStyle
  /** Keeps the hours field even at zero, so the digits do not shift later */
  showHours?: boolean
  /** Rolls days into the hours field rather than printing them */
  hideDays?: boolean
  onEnd?: () => void
  /** Pauses without losing the target */
  running?: boolean
  /** Shown instead of 00:00 once the time is up */
  endLabel?: string
  /**
   * Wording for the spoken label, when the app is not in English.
   *
   * The face reads `02:30`; a screen reader announcing that says "two colon
   * thirty", which is not a length of time.
   */
  spokenUnits?: Partial<SpokenUnits>
}

/**
 * A clock counting down to a moment.
 *
 * Seconds round up, so it shows 1 while any of the last second remains and
 * reaches zero exactly when the time does - rather than sitting on zero for a
 * second like a timer that gave up early.
 *
 * The remaining time is read from the clock on every tick, so a phone that
 * slept through half the countdown comes back with the right number.
 */
function CountdownBase({
  to,
  format = 'clock',
  showHours,
  hideDays,
  onEnd,
  running = true,
  endLabel,
  spokenUnits,
  ...rest
}: CountdownProps) {
  const { msLeft, done } = useCountdown(to, { onEnd, running })

  const face =
    done && endLabel != null
      ? endLabel
      : formatDuration(msLeft, { style: format, showHours, hideDays })

  return (
    <Text
      // Said in words, because the face is punctuation to a screen reader
      accessibilityLabel={done && endLabel != null ? endLabel : spokenDuration(msLeft, spokenUnits)}
      /**
       * Not announced on its own.
       *
       * The label changes every second; as a live region it would interrupt
       * whatever is being read, every second, for as long as the timer runs.
       * Someone who wants the time asks for it - and gets a sentence.
       */
      accessibilityLiveRegion="none"
      {...rest}>
      {face}
    </Text>
  )
}

export const Countdown = memo(CountdownBase)
