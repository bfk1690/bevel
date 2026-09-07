import { memo, type ReactNode } from 'react'
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { Button } from '../primitives/button'
import { Text } from '../primitives/text'
import { alpha, resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import type { ColorInput, RadiusToken } from '../theme/types'

export type BannerProps = {
  message: string
  title?: string
  /** A role name or raw color. `accent` is informational, `danger` a failure */
  tone?: ColorInput
  icon?: ReactNode
  actionLabel?: string
  onAction?: () => void
  /** Shows a close control */
  onDismiss?: () => void
  radius?: RadiusToken | number
  style?: StyleProp<ViewStyle>
}

/**
 * Inline message.
 *
 * Where a toast reports something that just happened and leaves, a banner
 * states a condition that is still true - offline, over quota, a draft not yet
 * published - and stays until it is not.
 *
 * The tone is carried by a bar down the leading edge rather than a wash across
 * the whole block: a filled panel competes with the content it sits above, and
 * at low opacity a tint is the first thing lost on a poor screen.
 */
function BannerBase({
  message,
  title,
  tone = 'accent',
  icon,
  actionLabel,
  onAction,
  onDismiss,
  radius = 'sm',
  style,
}: BannerProps) {
  const { colors, radius: radii, space, sizes } = useTheme()

  const accent = resolveColor(colors, tone, colors.accent)
  const borderRadius = typeof radius === 'number' ? radius : (radii[radius] ?? radii.sm)

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.root,
        {
          borderRadius,
          backgroundColor: alpha(accent, 0.1),
          paddingVertical: space(3),
          paddingHorizontal: space(3),
          gap: space(2.5),
        },
        style,
      ]}>
      <View style={[styles.bar, { backgroundColor: accent, borderTopLeftRadius: borderRadius, borderBottomLeftRadius: borderRadius }]} />

      {icon}

      <View style={[styles.body, { gap: space(1) }]}>
        {title != null && <Text variant="bodyStrong">{title}</Text>}
        <Text variant="caption" color="textMuted">
          {message}
        </Text>
        {actionLabel != null && onAction != null && (
          <View style={{ paddingTop: space(1) }}>
            <Button
              label={actionLabel}
              size="sm"
              variant="ghost"
              full={false}
              fg={accent}
              onPress={onAction}
            />
          </View>
        )}
      </View>

      {onDismiss != null && (
        <Pressable
          onPress={onDismiss}
          hitSlop={sizes.hitSlop}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          style={styles.close}>
          <View style={[styles.closeBar, { backgroundColor: colors.textMuted }]} />
          <View style={[styles.closeBar, styles.closeBarCross, { backgroundColor: colors.textMuted }]} />
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', overflow: 'hidden' },
  bar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  body: { flex: 1 },
  close: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  closeBar: { position: 'absolute', width: 12, height: 1.5, transform: [{ rotate: '45deg' }] },
  closeBarCross: { transform: [{ rotate: '-45deg' }] },
})

export const Banner = memo(BannerBase)
