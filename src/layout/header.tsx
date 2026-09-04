import { memo, type ReactNode } from 'react'
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { Text } from '../primitives/text'
import { resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import type { ColorInput } from '../theme/types'

export type HeaderProps = {
  title?: string
  subtitle?: string
  /** Renders a back control on the left */
  onBack?: () => void
  /** Replaces the back control entirely */
  left?: ReactNode
  right?: ReactNode
  /**
   * `center` mirrors the native iOS bar, `left` the large-title style used by
   * most Android and web layouts.
   */
  align?: 'left' | 'center'
  bg?: ColorInput | 'none'
  /** Hairline under the bar. Off when the screen below is a plain surface */
  divider?: boolean
  style?: StyleProp<ViewStyle>
}

function HeaderBase({
  title,
  subtitle,
  onBack,
  left,
  right,
  align = 'left',
  bg = 'none',
  divider = false,
  style,
}: HeaderProps) {
  const { colors, space, sizes } = useTheme()

  const backgroundColor = bg === 'none' ? 'transparent' : resolveColor(colors, bg, colors.canvas)

  const leading = left ?? (onBack ? <BackControl onPress={onBack} color={colors.text} /> : null)

  // In centered mode both sides reserve the same width so the title stays put
  // when only one of them is present.
  const sideWidth = align === 'center' ? sizes.control.sm : undefined

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor,
          paddingHorizontal: space(4),
          paddingVertical: space(2),
          gap: space(2),
          borderBottomWidth: divider ? StyleSheet.hairlineWidth : 0,
          borderBottomColor: colors.border,
        },
        style,
      ]}>
      {(leading != null || sideWidth != null) && (
        <View style={[styles.side, sideWidth != null && { width: sideWidth }]}>{leading}</View>
      )}

      <View style={[styles.titles, align === 'center' && styles.centered]}>
        {title != null && (
          <Text variant="heading" numberOfLines={1}>
            {title}
          </Text>
        )}
        {subtitle != null && (
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {(right != null || sideWidth != null) && (
        <View style={[styles.side, styles.trailing, sideWidth != null && { width: sideWidth }]}>
          {right}
        </View>
      )}
    </View>
  )
}

/**
 * Back control with a drawn chevron.
 *
 * Built from views rather than an icon font so the header works before an app
 * has chosen an icon set. Pass `left` to replace it with your own.
 */
function BackControl({ onPress, color }: { onPress: () => void; color: string }) {
  const { sizes } = useTheme()
  const size = sizes.icon.md
  return (
    <Pressable
      onPress={onPress}
      hitSlop={sizes.hitSlop}
      accessibilityRole="button"
      accessibilityLabel="Back"
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.5,
          height: size * 0.5,
          borderLeftWidth: 2,
          borderBottomWidth: 2,
          borderColor: color,
          transform: [{ rotate: '45deg' }],
          marginLeft: size * 0.15,
        }}
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center' },
  side: { flexShrink: 0 },
  trailing: { alignItems: 'flex-end' },
  titles: { flex: 1, gap: 1 },
  centered: { alignItems: 'center' },
})

export const Header = memo(HeaderBase)
