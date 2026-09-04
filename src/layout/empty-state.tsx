import { memo, type ReactNode } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { Button } from '../primitives/button'
import { Text } from '../primitives/text'
import { useTheme } from '../theme/provider'

export type EmptyStateProps = {
  title: string
  /** One sentence on why it is empty, or what to do about it */
  message?: string
  /** Illustration or icon */
  media?: ReactNode
  actionLabel?: string
  onAction?: () => void
  /** Secondary, quieter action - "Learn more", "Clear filters" */
  secondaryLabel?: string
  onSecondary?: () => void
  compact?: boolean
  style?: StyleProp<ViewStyle>
}

/**
 * Empty, error and no-results placeholder.
 *
 * The action is part of the component rather than an afterthought: an empty
 * state that only explains the absence leaves the user with nothing to do.
 */
function EmptyStateBase({
  title,
  message,
  media,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  compact = false,
  style,
}: EmptyStateProps) {
  const { space } = useTheme()

  return (
    <View
      style={[
        styles.root,
        {
          gap: space(compact ? 2 : 3),
          paddingVertical: space(compact ? 6 : 10),
          paddingHorizontal: space(6),
        },
        style,
      ]}>
      {media}
      <Text variant={compact ? 'bodyStrong' : 'heading'} align="center">
        {title}
      </Text>
      {message != null && (
        <Text variant="caption" color="textMuted" align="center">
          {message}
        </Text>
      )}
      {actionLabel != null && onAction != null && (
        <Button label={actionLabel} onPress={onAction} full={false} style={{ marginTop: space(1) }} />
      )}
      {secondaryLabel != null && onSecondary != null && (
        <Button label={secondaryLabel} onPress={onSecondary} variant="ghost" full={false} size="sm" />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center' },
})

export const EmptyState = memo(EmptyStateBase)
