import { memo, useMemo, type ReactNode } from 'react'
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { Text } from '../primitives/text'
import { resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import type { ColorInput } from '../theme/types'
import { useScrollOffset } from './scroll-context'

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
  /**
   * Holds the bar title back until the screen has scrolled.
   *
   * Pair it with a `LargeTitle` at the top of the content: that one scrolls
   * away, this one fades in as it leaves, and the two never both read as the
   * title of the page.
   */
  large?: boolean
  /** How far the screen must scroll for the collapse to finish */
  collapseDistance?: number
  /**
   * Usually `useScrollToTop()`.
   *
   * Left explicit rather than wired up automatically: a title that silently
   * does something when tapped is a control nobody knows is there, and one
   * that jumps the list under a reader who only brushed it.
   */
  onTitlePress?: () => void
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
  large = false,
  collapseDistance = 48,
  onTitlePress,
  style,
}: HeaderProps) {
  const { colors, space, sizes } = useTheme()
  const { y } = useScrollOffset()

  /**
   * The bar title fades in as the large one scrolls away.
   *
   * Both are real titles at their own size rather than one being resized: font
   * size cannot run on the native driver, and animating it would put the one
   * thing the eye follows on the JS thread.
   */
  const collapse = useMemo(
    () =>
      y.interpolate({
        inputRange: [0, Math.max(1, collapseDistance)],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
    [collapseDistance, y],
  )

  const backgroundColor = bg === 'none' ? 'transparent' : resolveColor(colors, bg, colors.canvas)

  const leading = left ?? (onBack ? <BackControl onPress={onBack} color={colors.text} /> : null)

  // In centered mode both sides reserve the same width so the title stays put
  // when only one of them is present.
  const sideWidth = align === 'center' ? sizes.control.sm : undefined

  const barTitle =
    title != null ? (
      large ? (
        <Animated.View style={{ opacity: collapse }}>
          <Text variant="heading" numberOfLines={1}>
            {title}
          </Text>
        </Animated.View>
      ) : (
        <Text variant="heading" numberOfLines={1}>
          {title}
        </Text>
      )
    ) : null

  const bar = (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: large ? 'transparent' : backgroundColor,
          paddingHorizontal: space(4),
          paddingVertical: space(2),
          gap: space(2),
          borderBottomWidth: !large && divider ? StyleSheet.hairlineWidth : 0,
          borderBottomColor: colors.border,
        },
        !large && style,
      ]}>
      {(leading != null || sideWidth != null) && (
        <View style={[styles.side, sideWidth != null && { width: sideWidth }]}>{leading}</View>
      )}

      <Pressable
        onPress={onTitlePress}
        disabled={onTitlePress == null}
        accessibilityRole={onTitlePress ? 'button' : 'header'}
        accessibilityLabel={title}
        style={[styles.titles, align === 'center' && styles.centered]}>
        {barTitle}
        {subtitle != null && !large && (
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </Pressable>

      {(right != null || sideWidth != null) && (
        <View style={[styles.side, styles.trailing, sideWidth != null && { width: sideWidth }]}>
          {right}
        </View>
      )}
    </View>
  )

  return bar
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
          marginStart: size * 0.15,
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
