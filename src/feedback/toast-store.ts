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
  /**
   * A second action, for the pair that actually comes up: do the thing, or
   * look at it. A third is a menu, and a toast is not one.
   */
  secondaryAction?: ToastAction
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

/**
 * Changes a toast that is still on screen.
 *
 * For the shape every upload has: a loading toast that becomes a success or a
 * failure. Raising a second toast would replace the first with a fresh
 * countdown and a fresh entrance, which reads as two separate events rather
 * than one that finished.
 *
 * A toast the user has already dismissed is NOT brought back. They closed it;
 * the work finishing is not a reason to overrule that.
 */
export function updateToast(id: string, patch: Partial<Omit<ToastOptions, 'id'>>): boolean {
  const current = state.current
  if (current == null || current.id !== id) return false

  const tone = patch.tone ?? current.tone
  emit({
    current: {
      ...current,
      ...patch,
      tone,
      // A loading toast has no countdown; the thing it becomes needs one
      duration:
        patch.duration ??
        (current.tone === 'loading' && tone !== 'loading' ? DEFAULT_DURATION : current.duration),
    },
  })
  return true
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
  update: updateToast,
  dismiss: dismissToast,
  clear: clearToasts,
  current: currentToast,
}
