import type { ColorInput } from '../theme/types'

export type ToastTone = 'success' | 'error' | 'warning' | 'info' | 'loading' | 'default'

export type ToastAction = {
  label: string
  onPress: () => void
}

export type ToastOptions = {
  message: string
  title?: string
  tone?: ToastTone
  /** ms on screen. `0` keeps it up until dismissed - implied by `loading` */
  duration?: number
  action?: ToastAction
  /** Give one to dismiss this toast later by id; otherwise one is generated */
  id?: string
  tint?: ColorInput
}

export type ToastItem = ToastOptions & { id: string; tone: ToastTone; duration: number }

type ToastState = { current: ToastItem | null }

/**
 * Toast state, kept outside React.
 *
 * A toast is fired from anywhere - an interceptor, a saga, a catch block - so
 * routing it through a context would force every call site to be inside the
 * tree. The store is deliberately independent of any state library: a UI kit
 * cannot assume Redux, Zustand or anything else is present.
 *
 * There is exactly ONE slot, and the newest message takes it. Queueing was
 * wrong: tapping "retry" while a success toast was still fading left the user
 * staring at stale news, and the error they needed to read only arrived
 * seconds later. A toast reports what just happened, so the latest one is by
 * definition the relevant one.
 */
let state: ToastState = { current: null }
const listeners = new Set<() => void>()

function emit(next: ToastState) {
  state = next
  for (const listener of listeners) listener()
}

export const toastStore = {
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  getSnapshot(): ToastState {
    return state
  },
}

let counter = 0

const DEFAULT_DURATION = 3200

export function showToast(options: ToastOptions): string {
  const tone = options.tone ?? 'default'
  const id = options.id ?? `toast-${(counter += 1)}`
  const item: ToastItem = {
    ...options,
    id,
    tone,
    // A loading toast has no natural end: it is dismissed when the work is.
    duration: options.duration ?? (tone === 'loading' ? 0 : DEFAULT_DURATION),
  }

  // Replaces whatever is on screen, including its timer - the new message
  // gets its full duration rather than inheriting what was left of the old.
  emit({ current: item })
  return id
}

/** Without an id, dismisses whatever is showing */
export function dismissToast(id?: string): void {
  if (id != null && state.current?.id !== id) return
  emit({ current: null })
}

export function clearToasts(): void {
  emit({ current: null })
}

/** What is on screen right now, if anything */
export function currentToast(): ToastItem | null {
  return state.current
}

function tone(tone: ToastTone) {
  return (message: string, options?: Omit<ToastOptions, 'message' | 'tone'>) =>
    showToast({ ...options, message, tone })
}

/**
 * Imperative entry point.
 *
 *   toast.success('Saved')
 *   const id = toast.loading('Uploading...')
 *   toast.dismiss(id)
 */
export const toast = {
  show: showToast,
  success: tone('success'),
  error: tone('error'),
  warning: tone('warning'),
  info: tone('info'),
  loading: tone('loading'),
  dismiss: dismissToast,
  clear: clearToasts,
  current: currentToast,
}
