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
