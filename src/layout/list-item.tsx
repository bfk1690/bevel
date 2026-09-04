import { memo, type ReactNode } from 'react'
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { Text } from '../primitives/text'
import { resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import type { ColorInput } from '../theme/types'

export type ListItemProps = {
  title: string
  subtitle?: string
  /** Avatar, icon, thumbnail */
  left?: ReactNode
  /** Value, badge, switch. Replaced by the chevron when `onPress` is set */
  right?: ReactNode
  onPress?: () => void
  /** Navigation affordance. Defaults on for pressable rows without a `right` */
  chevron?: boolean
  disabled?: boolean
  divider?: boolean
  /** Indent of the divider, so it lines up with the text rather than the icon */
  dividerInset?: number
  bg?: ColorInput | 'none'
  destructive?: boolean
  style?: StyleProp<ViewStyle>
}

/**
 * Row in a list or settings group.
 *
 * The divider belongs to the row rather than the list so a single row can drop
 * it - the last item of a group, or one that sits above a section header -
 * without the list having to know its own boundaries.
 */
function ListItemBase({
  title,
  subtitle,
  left,
  right,
  onPress,
  chevron,
  disabled = false,
  divider = false,
  dividerInset,
  bg = 'none',
  destructive = false,
  style,
}: ListItemProps) {
  const { colors, space, sizes } = useTheme()

  const showChevron = chevron ?? (onPress != null && right == null)
  const backgroundColor = bg === 'none' ? 'transparent' : resolveColor(colors, bg, colors.surface)

  const content = (
    <>
      <View style={[styles.row, { gap: space(3), paddingVertical: space(3) }]}>
        {left}
        <View style={styles.body}>
          <Text variant="body" color={destructive ? 'danger' : 'text'} numberOfLines={1}>
            {title}
          </Text>
          {subtitle != null && (
            <Text variant="caption" color="textMuted" numberOfLines={2}>
              {subtitle}
            </Text>
          )}
        </View>
        {right}
        {showChevron && <Chevron color={colors.textFaint} size={sizes.icon.sm} />}
      </View>
      {divider && (
        <View
          style={{
            height: StyleSheet.hairlineWidth,
            backgroundColor: colors.border,
            marginLeft: dividerInset ?? 0,
          }}
        />
      )}
    </>
  )

  if (onPress == null) {
    return <View style={[{ backgroundColor }, style]}>{content}</View>
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        { backgroundColor: pressed ? colors.raised : backgroundColor, opacity: disabled ? 0.5 : 1 },
        style,
      ]}>
      {content}
    </Pressable>
  )
}

function Chevron({ color, size }: { color: string; size: number }) {
  return (
    <View
      style={{
        width: size * 0.45,
        height: size * 0.45,
        borderRightWidth: 1.5,
        borderTopWidth: 1.5,
        borderColor: color,
        transform: [{ rotate: '45deg' }],
      }}
    />
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  body: { flex: 1, gap: 2 },
})

export const ListItem = memo(ListItemBase)
