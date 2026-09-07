import { useCallback, useRef, type ComponentType, type ReactElement, type ReactNode } from 'react'
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
  type FlatListProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { Button } from '../primitives/button'
import { Text } from '../primitives/text'
import { useTheme } from '../theme/provider'
import { errorMessage } from '../utils/state'
import { shouldLoadMore } from '../utils/pagination'
import { EmptyState } from './empty-state'
import { StateView } from './state-view'

/**
 * The slice of a list component this needs.
 *
 * FlatList and FlashList agree on all of it, which is what makes swapping one
 * for the other a single prop rather than a rewrite.
 */
export type ListComponentProps<T> = Pick<
  FlatListProps<T>,
  | 'data'
  | 'renderItem'
  | 'keyExtractor'
  | 'onEndReached'
  | 'onEndReachedThreshold'
  | 'ListHeaderComponent'
  | 'ListFooterComponent'
  | 'ListEmptyComponent'
  | 'ItemSeparatorComponent'
  | 'refreshControl'
  | 'contentContainerStyle'
  | 'style'
  | 'keyboardShouldPersistTaps'
  | 'showsVerticalScrollIndicator'
>

export type InfiniteListProps<T> = {
  data: readonly T[]
  renderItem: (item: T, index: number) => ReactElement | null
  keyExtractor: (item: T, index: number) => string

  /** Asks for the next page. Guarded, so it fires once per page */
  onLoadMore?: () => void
  loadingMore?: boolean
  hasMore?: boolean
  /** The first page is still on its way */
  loading?: boolean
  error?: unknown
  onRetry?: () => void

  /**
   * The list to draw with. Defaults to React Native's own `FlatList`.
   *
   * Pass `FlashList` here to use it. It is NOT a dependency of this package: a
   * bundler cannot resolve a module conditionally, so an optional native
   * dependency is either forced on everyone or fails to build for the people
   * who skipped it. Injecting it costs one prop and keeps the choice with the
   * app that pays for it.
   */
  ListComponent?: ComponentType<ListComponentProps<T>>

  header?: ReactNode
  separator?: ComponentType
  emptyTitle?: string
  emptyMessage?: string
  retryLabel?: string
  endLabel?: string
  refreshControl?: FlatListProps<T>['refreshControl']
  contentContainerStyle?: StyleProp<ViewStyle>
  style?: StyleProp<ViewStyle>
}

/**
 * A list that asks for more as it runs out.
 *
 * `onEndReached` is not a request for the next page - it is a report that the
 * end is near, and it fires again on every scroll that keeps it near. The
 * guard in `utils/pagination` is what turns that into one fetch per page, and
 * it is tested there.
 */
export function InfiniteList<T>({
  data,
  renderItem,
  keyExtractor,
  onLoadMore,
  loadingMore = false,
  hasMore = true,
  loading = false,
  error,
  onRetry,
  ListComponent,
  header,
  separator,
  emptyTitle = 'Nothing here yet',
  emptyMessage,
  retryLabel = 'Try again',
  endLabel,
  refreshControl,
  contentContainerStyle,
  style,
}: InfiniteListProps<T>) {
  const { colors, space } = useTheme()
  const List = (ListComponent ?? FlatList) as ComponentType<ListComponentProps<T>>

  /** The page this list has already asked for, so one end does not fetch twice */
  const asked = useRef(0)

  const reachedEnd = useCallback(() => {
    if (!shouldLoadMore({ loading: loading || loadingMore, hasMore, error })) return
    // Even guarded by state, the callback can fire twice before a re-render
    // lands - once per scroll event in the same frame.
    if (asked.current === data.length) return
    asked.current = data.length
    onLoadMore?.()
  }, [data.length, error, hasMore, loading, loadingMore, onLoadMore])

  const footer = (
    <View style={{ paddingVertical: space(4), alignItems: 'center', gap: space(2) }}>
      {loadingMore && <ActivityIndicator color={colors.textMuted} />}

      {!loadingMore && error != null && data.length > 0 && (
        <>
          <Text variant="caption" color="danger">
            {errorMessage(error, 'Could not load more')}
          </Text>
          {onRetry != null && (
            <Button label={retryLabel} variant="ghost" size="sm" full={false} onPress={onRetry} />
          )}
        </>
      )}

      {!loadingMore && !hasMore && endLabel != null && data.length > 0 && (
        <Text variant="caption" color="textFaint">
          {endLabel}
        </Text>
      )}
    </View>
  )

  // The first page and a failed first page are screens, not list rows: a
  // spinner at the bottom of an empty list says nothing about what went wrong.
  if (loading || (error != null && data.length === 0)) {
    return (
      <StateView
        loading={loading}
        error={error}
        onRetry={onRetry}
        retryLabel={retryLabel}
        style={[styles.fill, style]}
      />
    )
  }

  return (
    <List
      data={data as T[]}
      renderItem={({ item, index }) => renderItem(item, index)}
      keyExtractor={keyExtractor}
      onEndReached={reachedEnd}
      onEndReachedThreshold={0.4}
      ListHeaderComponent={header != null ? <>{header}</> : undefined}
      ListFooterComponent={footer}
      ListEmptyComponent={<EmptyState title={emptyTitle} message={emptyMessage} />}
      ItemSeparatorComponent={separator}
      refreshControl={refreshControl}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={contentContainerStyle}
      style={[styles.fill, style]}
    />
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
})
