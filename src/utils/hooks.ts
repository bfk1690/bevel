import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * A value that lags behind, so expensive work runs once the typing stops.
 *
 * The timer is cleared on every change, which is the whole mechanism: what
 * survives is the last value that sat still long enough.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [settled, setSettled] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delayMs)
    return () => clearTimeout(timer)
  }, [delayMs, value])

  return settled
}

export type Disclosure = {
  open: boolean
  show: () => void
  hide: () => void
  toggle: () => void
}

/**
 * Open and closed, with stable callbacks.
 *
 * The callbacks matter more than the state: passing `() => setOpen(true)` into
 * a memoized sheet re-renders it on every parent render, which is exactly the
 * component you least want to re-render.
 */
export function useDisclosure(initial = false): Disclosure {
  const [open, setOpen] = useState(initial)

  return {
    open,
    show: useCallback(() => setOpen(true), []),
    hide: useCallback(() => setOpen(false), []),
    toggle: useCallback(() => setOpen((previous) => !previous), []),
  }
}

/**
 * The previous render's value.
 *
 * For the cases where a component has to react to a change rather than to a
 * state - a page that scrolled, a value that arrived from elsewhere.
 */
export function usePrevious<T>(value: T): T | undefined {
  const previous = useRef<T | undefined>(undefined)

  useEffect(() => {
    previous.current = value
  }, [value])

  return previous.current
}

/**
 * A callback that cannot fire after the component has gone.
 *
 * Anything asynchronous that ends in `setState` needs this or it wakes up into
 * a screen that is no longer there.
 */
export function useIsMounted(): () => boolean {
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  return useCallback(() => mounted.current, [])
}

export type CountdownOptions = {
  /** Fired once, when the time runs out */
  onEnd?: () => void
  /** Pauses without losing the target */
  running?: boolean
}

export type CountdownState = {
  /** Milliseconds left, never negative */
  msLeft: number
  done: boolean
  /** Puts the same length of time back on the clock, from now */
  restart: (durationMs: number) => void
}

/**
 * Counts down to a moment.
 *
 * Ticks are aimed at the next second boundary rather than set to 1000ms: each
 * tick of a plain interval is a little late, the error accumulates, and a
 * whole second eventually disappears from the display.
 *
 * The remaining time is recomputed from the clock every tick rather than
 * subtracted from itself, so a phone that slept through half the countdown
 * comes back with the right number instead of the one it went away with.
 */
export function useCountdown(
  target: Date | number | null,
  { onEnd, running = true }: CountdownOptions = {},
): CountdownState {
  const [end, setEnd] = useState<number | null>(() =>
    target == null ? null : target instanceof Date ? target.getTime() : target,
  )

  useEffect(() => {
    setEnd(target == null ? null : target instanceof Date ? target.getTime() : target)
  }, [target])

  const [msLeft, setMsLeft] = useState(() => (end == null ? 0 : Math.max(0, end - Date.now())))
  const ended = useRef(false)

  useEffect(() => {
    ended.current = false
  }, [end])

  useEffect(() => {
    if (end == null || !running) return

    let timer: ReturnType<typeof setTimeout> | undefined

    const tick = () => {
      const left = Math.max(0, end - Date.now())
      setMsLeft(left)

      if (left === 0) {
        if (!ended.current) {
          ended.current = true
          onEnd?.()
        }
        return
      }

      const remainder = left % 1000
      timer = setTimeout(tick, remainder === 0 ? 1000 : remainder)
    }

    tick()

    return () => {
      if (timer != null) clearTimeout(timer)
    }
  }, [end, onEnd, running])

  const restart = useCallback((durationMs: number) => {
    ended.current = false
    setEnd(Date.now() + Math.max(0, durationMs))
  }, [])

  return { msLeft, done: end != null && msLeft === 0, restart }
}
