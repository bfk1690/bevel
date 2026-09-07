/**
 * Which of the four screens to show.
 *
 * Every list has the same four faces - loading, failed, empty, and the content
 * itself - and every app re-decides the order in which they win. Writing it
 * down once is the point of this file.
 */

export type ViewState = 'loading' | 'error' | 'empty' | 'ready'

export type ViewStateInput = {
  loading?: boolean
  error?: unknown
  empty?: boolean
}

/**
 * Loading wins over everything.
 *
 * A retry in flight should show progress rather than the error it is busy
 * trying to clear - otherwise pressing "try again" looks like it did nothing.
 *
 * An error then wins over empty, because "we could not load this" and "there
 * is nothing here" are different statements and only one of them is true. A
 * failed request rendered as an empty state is how a user concludes their data
 * is gone.
 */
export function resolveViewState({ loading, error, empty }: ViewStateInput): ViewState {
  if (loading === true) return 'loading'
  // Any truthy value is an error and every falsy one is not, which is how an
  // error prop is threaded through an app in practice - `error && ...`. A
  // blank string carries no message and so states no failure.
  if (error) return 'error'
  if (empty === true) return 'empty'
  return 'ready'
}

/** Pulls a readable line out of whatever was thrown */
export function errorMessage(error: unknown, fallback: string): string {
  if (error == null) return fallback
  if (typeof error === 'string') return error.trim() || fallback
  if (error instanceof Error) return error.message.trim() || fallback
  if (typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message.trim()
  }
  return fallback
}
