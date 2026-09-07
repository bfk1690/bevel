import { memo, type ReactNode } from 'react'
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { Progress } from '../primitives/progress'
import { Text } from '../primitives/text'
import { resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import type { ColorInput } from '../theme/types'
import { fileKind, formatBytes, truncateMiddle, type FileKind } from '../utils/format'

export type FileState = 'idle' | 'uploading' | 'done' | 'failed'

export type FileRowProps = {
  name: string
  /** Bytes. Omitted while it is still unknown */
  size?: number
  state?: FileState
  /** 0 to 1 while uploading. Omitted draws an indeterminate bar */
  progress?: number
  /** Shown instead of the size when something went wrong */
  error?: string
  thumbnail?: ReactNode
  onPress?: () => void
  onRemove?: () => void
  onRetry?: () => void
  /** Longest name drawn before it is shortened from the middle */
  maxNameLength?: number
  style?: StyleProp<ViewStyle>
}

const KIND_LABEL: Record<FileKind, string> = {
  image: 'IMG',
  video: 'VID',
  audio: 'AUD',
  document: 'DOC',
  archive: 'ZIP',
  other: 'FILE',
}

const KIND_TONE: Record<FileKind, ColorInput> = {
  image: 'accent',
  video: 'accent',
  audio: 'ok',
  document: 'textMuted',
  archive: 'warning',
  other: 'textMuted',
}

/**
 * One file in a list of them.
 *
 * The name is shortened from the MIDDLE. Cutting the tail off throws away the
 * extension, which is the half that says what the thing is - and in a list of
 * uploads from one folder, the front halves are often identical anyway.
 *
 * A failure keeps the row in place with a retry rather than removing it. A
 * file that vanishes on error leaves the user unsure whether it was sent.
 */
function FileRowBase({
  name,
  size,
  state = 'idle',
  progress,
  error,
  thumbnail,
  onPress,
  onRemove,
  onRetry,
  maxNameLength = 28,
  style,
}: FileRowProps) {
  const { colors, radius, space, sizes } = useTheme()

  const kind = fileKind(name)
  const failed = state === 'failed'
  const uploading = state === 'uploading'
  const tone = resolveColor(colors, failed ? 'danger' : KIND_TONE[kind], colors.textMuted)

  const body = (
    <>
      <View
        style={[
          styles.badge,
          {
            width: sizes.control.md,
            height: sizes.control.md,
            borderRadius: radius.sm,
            backgroundColor: colors.sunk,
          },
        ]}>
        {thumbnail ?? (
          <Text variant="micro" style={{ color: tone }}>
            {KIND_LABEL[kind]}
          </Text>
        )}
      </View>

      <View style={[styles.body, { gap: space(1) }]}>
        <Text variant="body" numberOfLines={1}>
          {truncateMiddle(name, maxNameLength)}
        </Text>

        {failed ? (
          <Text variant="caption" color="danger">
            {error ?? 'Upload failed'}
          </Text>
        ) : uploading ? (
          <Progress value={progress} height={3} />
        ) : (
          <Text variant="caption" color="textMuted">
            {size != null ? formatBytes(size) : ''}
          </Text>
        )}
      </View>

      {failed && onRetry != null && (
        <Pressable onPress={onRetry} hitSlop={sizes.hitSlop} accessibilityRole="button" accessibilityLabel="Retry">
          <Text variant="label" color="accent">
            Retry
          </Text>
        </Pressable>
      )}

      {onRemove != null && (
        <Pressable
          onPress={onRemove}
          hitSlop={sizes.hitSlop}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${name}`}
          style={styles.remove}>
          <View style={[styles.removeBar, { backgroundColor: colors.textMuted }]} />
          <View style={[styles.removeBar, styles.removeBarCross, { backgroundColor: colors.textMuted }]} />
        </Pressable>
      )}
    </>
  )

  const shell: ViewStyle = {
    paddingVertical: space(2.5),
    gap: space(3),
    opacity: uploading ? 0.85 : 1,
  }

  if (onPress == null) return <View style={[styles.row, shell, style]}>{body}</View>

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, shell, pressed && { opacity: 0.7 }, style]}>
      {body}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  badge: { alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  remove: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  removeBar: { position: 'absolute', width: 12, height: 1.5, transform: [{ rotate: '45deg' }] },
  removeBarCross: { transform: [{ rotate: '-45deg' }] },
})

export const FileRow = memo(FileRowBase)
