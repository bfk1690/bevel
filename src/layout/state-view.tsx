import { type ReactNode } from 'react'
import { View, type StyleProp, type ViewStyle } from 'react-native'

import { Skeleton } from '../primitives/skeleton'
import { useTheme } from '../theme/provider'
import { errorMessage, resolveViewState } from '../utils/state'
import { EmptyState } from './empty-state'

export type StateViewProps = {
  /** Optional: used on its own it renders only the placeholder faces */
  children?: ReactNode
  loading?: boolean
  error?: unknown
  empty?: boolean
  onRetry?: () => void

  /** Replaces the default placeholder bars */
  loadingView?: ReactNode
  /** Replaces the whole empty state */
  emptyView?: ReactNode
  errorView?: ReactNode

  emptyTitle?: string
  emptyMessage?: string
  emptyActionLabel?: string
  onEmptyAction?: () => void

  errorTitle?: string
  /** Used when the thrown value carries no readable message */
  errorFallback?: string
  retryLabel?: string

  style?: StyleProp<ViewStyle>
}

/**
 * The four faces of a list.
 *
 * Loading, failed, empty, and the content itself. Every app writes these four
 * and re-decides the order in which they win; the order lives in
 * `utils/state` and is tested there.
 *
 * The default loading view is a set of placeholder bars rather than a spinner.
 * A spinner says only that something is happening, while bars say what shape
 * it will be - and the screen does not jump when the content lands.
 */
export function StateView({
  children,
  loading,
  error,
  empty,
  onRetry,
  loadingView,
  emptyView,
  errorView,
  emptyTitle = 'Nothing here yet',
  emptyMessage,
  emptyActionLabel,
  onEmptyAction,
  errorTitle = 'Something went wrong',
  errorFallback = 'Please try again.',
  retryLabel = 'Try again',
  style,
}: StateViewProps) {
  const { space } = useTheme()
  const state = resolveViewState({ loading, error, empty })

  if (state === 'loading') {
    return (
      <View style={style}>
        {loadingView ?? (
          <View style={{ gap: space(5), paddingVertical: space(3) }}>
            {[0, 1, 2].map((row) => (
              <View key={row} style={{ gap: space(2) }}>
                <Skeleton height={14} width="45%" />
                <Skeleton lines={2} height={11} />
              </View>
            ))}
          </View>
        )}
      </View>
    )
  }

  if (state === 'error') {
    return (
      <View style={style}>
        {errorView ?? (
          <EmptyState
            title={errorTitle}
            message={errorMessage(error, errorFallback)}
            actionLabel={onRetry ? retryLabel : undefined}
            onAction={onRetry}
          />
        )}
      </View>
    )
  }

  if (state === 'empty') {
    return (
      <View style={style}>
        {emptyView ?? (
          <EmptyState
            title={emptyTitle}
            message={emptyMessage}
            actionLabel={emptyActionLabel}
            onAction={onEmptyAction}
          />
        )}
      </View>
    )
  }

  return <>{children ?? null}</>
}
