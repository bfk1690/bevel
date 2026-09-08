import { Component, type ErrorInfo, type ReactNode } from 'react'

import { Text } from '../primitives/text'
import { EmptyState } from './empty-state'

export type ErrorBoundaryProps = {
  children: ReactNode
  /**
   * Replaces the default screen.
   *
   * `reset` clears the error and renders the children again. Worth wiring to
   * a retry button; not worth wiring to anything automatic, since a component
   * that threw once usually throws again and a loop is harder to diagnose than
   * a stuck screen.
   */
  fallback?: (state: { error: Error; reset: () => void }) => ReactNode
  /** Somewhere to send it. This is the only place an app learns it happened */
  onError?: (error: Error, info: ErrorInfo) => void
  title?: string
  message?: string
  retryLabel?: string
  /**
   * Shows the error's own message under the explanation.
   *
   * Off by default. A stack trace in front of somebody who cannot act on it is
   * noise at best, and at worst it prints whatever was in the failing request.
   */
  showDetail?: boolean
  /**
   * Clears the error when this changes - a route key, usually.
   *
   * Without it a boundary that has caught once stays broken for the life of
   * the screen, and navigating away and back lands on the same message.
   */
  resetKey?: unknown
}

type State = { error: Error | null }

/**
 * Catches what a render throws, and keeps the rest of the app up.
 *
 * A class on purpose: this is the one thing React still has no hook for.
 *
 * It catches RENDERS, and nothing else. A rejected promise, a failed request,
 * a throw inside an event handler - none of those reach it, and a screen that
 * relies on this for its error handling will show a blank space instead.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info)
  }

  componentDidUpdate(previous: ErrorBoundaryProps) {
    if (this.state.error != null && previous.resetKey !== this.props.resetKey) {
      this.reset()
    }
  }

  reset = () => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (error == null) return this.props.children

    const {
      fallback,
      title = 'Something went wrong',
      message = 'This screen stopped before it finished drawing.',
      retryLabel = 'Try again',
      showDetail = false,
    } = this.props

    if (fallback) return fallback({ error, reset: this.reset })

    return (
      <EmptyState title={title} message={message} actionLabel={retryLabel} onAction={this.reset}>
        {showDetail && error.message ? (
          <Text variant="micro" color="textFaint" align="center">
            {error.message}
          </Text>
        ) : null}
      </EmptyState>
    )
  }
}
