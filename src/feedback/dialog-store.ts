export type DialogKind = 'alert' | 'confirm' | 'prompt'

export type DialogOptions = {
  title: string
  message?: string
  /** Label on the accepting button. Defaults per kind */
  confirmLabel?: string
  cancelLabel?: string
  /**
   * Paints the accepting button as a warning and moves it away from the thumb.
   *
   * For anything that cannot be undone. The point is not the colour: it is
   * that the button which destroys something should not be where the finger
   * already is after two taps of muscle memory.
   */
  destructive?: boolean
  /** prompt only */
  placeholder?: string
  /** prompt only */
  defaultValue?: string
  /** prompt only. Rejects the value and keeps the dialog up */
  validate?: (value: string) => string | null
}

export type DialogResult = boolean | string | null

export type DialogRequest = DialogOptions & {
  id: string
  kind: DialogKind
  resolve: (result: DialogResult) => void
}

type DialogState = { queue: readonly DialogRequest[] }

/**
 * Dialog state, kept outside React.
 *
 * Raised from anywhere - an interceptor, a background job, a catch block - so
 * routing it through a context would force every call site to be inside the
 * tree. Independent of any state library: a UI kit cannot assume Redux,
 * Zustand or anything else is present.
 *
 * Unlike a toast, a dialog QUEUES. Each one has somebody awaiting its answer,
 * so replacing the one on screen would leave that promise unresolved forever -
 * and the caller is usually holding a lock, a spinner or a half-finished save
 * while it waits.
 */
let state: DialogState = { queue: [] }
const listeners = new Set<() => void>()

function emit(next: DialogState) {
  state = next
  for (const listener of listeners) listener()
}

export const dialogStore = {
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  getSnapshot(): DialogState {
    return state
  },
}

let counter = 0

function ask(kind: DialogKind, options: DialogOptions): Promise<DialogResult> {
  return new Promise((resolve) => {
    const request: DialogRequest = { ...options, kind, id: `dialog-${(counter += 1)}`, resolve }
    emit({ queue: [...state.queue, request] })
  })
}

/** The one on screen, if any */
export function currentDialog(): DialogRequest | null {
  return state.queue[0] ?? null
}

/** Answers the dialog on screen and lets the next one through */
export function resolveDialog(id: string, result: DialogResult): void {
  const request = state.queue.find((item) => item.id === id)
  if (request == null) return
  emit({ queue: state.queue.filter((item) => item.id !== id) })
  request.resolve(result)
}

/**
 * Clears everything waiting, answering each as cancelled.
 *
 * For signing out or leaving the screen a question belonged to. Resolving
 * rather than dropping matters: every caller is inside an `await`.
 */
export function clearDialogs(): void {
  const waiting = state.queue
  emit({ queue: [] })
  for (const request of waiting) request.resolve(request.kind === 'prompt' ? null : false)
}

/**
 * Imperative entry point.
 *
 *   if (await dialog.confirm({ title: 'Delete this?', destructive: true })) ...
 *   const name = await dialog.prompt({ title: 'Rename', defaultValue: current })
 */
export const dialog = {
  alert: (options: DialogOptions) => ask('alert', options) as Promise<boolean>,
  confirm: (options: DialogOptions) => ask('confirm', options) as Promise<boolean>,
  prompt: (options: DialogOptions) => ask('prompt', options) as Promise<string | null>,
  current: currentDialog,
  clear: clearDialogs,
}
