import { memo, useCallback, useEffect, useState } from 'react'

import { useAppState } from '../utils/motion'
import { formatRelative, relativeTickMs, type RelativeOptions } from '../utils/relative'
import { Text, type BevelTextProps } from './text'

export type RelativeTimeProps = Omit<BevelTextProps, 'children'> &
  Omit<RelativeOptions, 'now'> & {
    value: Date | number | string
    /**
     * Keeps the label current on its own.
     *
     * On by default. Turn it off inside a long list that already re-renders on
     * a clock of its own.
     */
    live?: boolean
  }

/**
 * A timestamp in words, kept current.
 *
 * The redraw is sized to the unit on screen rather than run on a fixed
 * interval: a list that ticks every second to keep "3 days ago" honest is
 * spending a frame a second on a string that changes twice a week. Past the
 * cutoff the label is a fixed date and no timer runs at all.
 */
function RelativeTimeBase({
  value,
  live = true,
  locale,
  style,
  nowWithinMs,
  cutoffDays,
  formatAbsolute,
  ...rest
}: RelativeTimeProps) {
  const [now, setNow] = useState(() => Date.now())
  const [wokeAt, setWokeAt] = useState(0)

  /**
   * Timers are throttled or stopped while the app is away, so the label on
   * screen when it comes back is as old as the trip. Reading the clock again
   * on the way in is what stops a message from this morning still saying
   * "just now".
   */
  const wake = useCallback(() => setWokeAt(Date.now()), [])
  useAppState(live ? wake : undefined)

  useEffect(() => {
    if (!live) return

    let timer: ReturnType<typeof setTimeout> | undefined

    const schedule = () => {
      setNow(Date.now())
      const wait = relativeTickMs(value, { cutoffDays })
      if (wait == null) return
      timer = setTimeout(schedule, wait)
    }

    schedule()

    return () => {
      if (timer != null) clearTimeout(timer)
    }
  }, [cutoffDays, live, value, wokeAt])

  return (
    <Text {...rest} style={style}>
      {formatRelative(value, { now, locale, nowWithinMs, cutoffDays, formatAbsolute })}
    </Text>
  )
}

export const RelativeTime = memo(RelativeTimeBase)
