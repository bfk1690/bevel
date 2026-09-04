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
  /** Reusing an id replaces that toast instead of queueing another */
  id?: string
  tint?: ColorInput
}

export type ToastItem = ToastOptions & { id: string; tone: ToastTone; duration: number }

type ToastState = { queue: readonly ToastItem[] }

/**
 * Toast state, kept outside React.
 *
 * A toast is fired from anywhere - an interceptor, a saga, a catch block - so
 * routing it through a context would force every call site to be inside the
 * tree. The store is deliberately independent of any state library: a UI kit
 * cannot assume Redux, Zustand or anything else is present.
 */
let state: ToastState = { queue: [] }
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

  const existing = state.queue.findIndex((entry) => entry.id === id)
  if (existing >= 0) {
    const queue = state.queue.slice()
    queue[existing] = item
    emit({ queue })
    return id
  }

  emit({ queue: [...state.queue, item] })
  return id
}

export function dismissToast(id?: string): void {
  if (id == null) {
    emit({ queue: state.queue.slice(1) })
    return
  }
  emit({ queue: state.queue.filter((entry) => entry.id !== id) })
}

export function clearToasts(): void {
  emit({ queue: [] })
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
}
