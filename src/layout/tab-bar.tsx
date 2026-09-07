import { memo, type ReactNode } from 'react'
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { Badge } from '../primitives/badge'
import { Text } from '../primitives/text'
import { resolveColor } from '../theme/color'
import { useInsets, useTheme } from '../theme/provider'
import type { ColorInput } from '../theme/types'

export type TabBarItem<T> = {
  value: T
  label: string
  /** Given the state and the colour already resolved for it */
  icon?: (active: boolean, color: string) => ReactNode
  /** A count, or a dot when the number does not matter */
  badge?: string | number | true
  disabled?: boolean
}

export type TabBarProps<T> = {
  value: T
  onChange: (value: T) => void
  items: readonly TabBarItem<T>[]
  /**
   * Tapping the tab you are already on.
   *
   * Sends the screen home on every platform that has a tab bar, and an app
   * that does not do it feels broken to anyone who has tried it once.
   */
  onReselect?: (value: T) => void
  /**
   * Hides the label of every tab except the active one.
   *
   * Worth it with five tabs and long words, and a loss otherwise: a label
   * that only appears once you are there cannot help you decide where to go.
   */
  labelActiveOnly?: boolean
  tone?: ColorInput
  bg?: ColorInput
  /** Hairline along the top edge, separating the bar from the content */
  divider?: boolean
  /**
   * Adds the bottom safe area to the bar's padding, clearing the home
   * indicator. On by default; off when the bar is inside a box of its own
   * rather than along the bottom of the screen.
   */
  respectSafeArea?: boolean
  style?: StyleProp<ViewStyle>
}

/**
 * The bar along the bottom.
 *
 * Presentational on purpose: it takes the current value and reports taps, so
 * whichever router the app uses stays the one that owns the route. Nothing
 * here knows what a screen is.
 */
function TabBarBase<T>({
  value,
  onChange,
  items,
  onReselect,
  labelActiveOnly = false,
  tone = 'accent',
  bg = 'canvas',
  divider = true,
  respectSafeArea = true,
  style,
}: TabBarProps<T>) {
  const { colors, space, sizes } = useTheme()
  const insets = useInsets()

  const accent = resolveColor(colors, tone, colors.accent)

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        {
          backgroundColor: resolveColor(colors, bg, colors.canvas),
          // The bar sits on the home indicator, so its own padding has to
          // clear it - otherwise every label is a thumb's width too low
          paddingBottom: (respectSafeArea ? insets.bottom : 0) || space(2),
          paddingTop: space(2),
          borderTopWidth: divider ? StyleSheet.hairlineWidth : 0,
          borderTopColor: colors.border,
        },
        style,
      ]}>
      {items.map((item) => {
        const active = item.value === value
        const color = item.disabled === true ? colors.textFaint : active ? accent : colors.textMuted

        return (
          <Pressable
            key={String(item.value)}
            onPress={() => (active ? onReselect?.(item.value) : onChange(item.value))}
            disabled={item.disabled}
            accessibilityRole="tab"
            accessibilityState={{ selected: active, disabled: item.disabled }}
            accessibilityLabel={item.label}
            hitSlop={{ top: sizes.hitSlop, bottom: 0 }}
            style={({ pressed }) => [
              styles.tab,
              { gap: space(1), opacity: item.disabled === true ? 0.4 : pressed ? 0.6 : 1 },
            ]}>
            <View>
              {item.icon?.(active, color) ?? <Dot color={color} active={active} />}
              {item.badge != null && (
                <View style={styles.badge}>
                  {item.badge === true ? (
                    <View style={[styles.dot, { backgroundColor: colors.danger }]} />
                  ) : (
                    <Badge label={String(item.badge)} tone="danger" size="sm" />
                  )}
                </View>
              )}
            </View>

            {(!labelActiveOnly || active) && (
              <Text variant="micro" numberOfLines={1} style={{ color }}>
                {item.label}
              </Text>
            )}
          </Pressable>
        )
      })}
    </View>
  )
}

/** Stand-in mark, so the bar works before an app has chosen an icon set */
function Dot({ color, active }: { color: string; active: boolean }) {
  return (
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: color,
        backgroundColor: active ? color : 'transparent',
      }}
    />
  )
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'flex-end' },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  // Hangs off the icon's top-right corner rather than taking a place in the
  // row, which would shift the label whenever a count appeared
  badge: { position: 'absolute', top: -6, left: 12 },
  dot: { width: 8, height: 8, borderRadius: 4 },
})

export const TabBar = memo(TabBarBase) as typeof TabBarBase
