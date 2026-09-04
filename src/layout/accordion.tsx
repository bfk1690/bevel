import { memo, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { Text } from '../primitives/text'
import { useTheme } from '../theme/provider'

export type AccordionItemProps = {
  title: string
  subtitle?: string
  children?: ReactNode
  expanded: boolean
  onToggle: () => void
  /** Trailing node in the header, before the chevron */
  right?: ReactNode
  disabled?: boolean
  divider?: boolean
  style?: StyleProp<ViewStyle>
}

/**
 * A single disclosure row.
 *
 * The panel animates its measured height rather than being mounted and
 * unmounted, so the content keeps its state - a half-filled field inside a
 * collapsed section is still half-filled when it comes back.
 *
 * Height cannot run on the native driver, so it is the one animation here that
 * touches the JS thread. The chevron is driven separately and natively, which
 * keeps the part the eye tracks smooth even under load.
 */
function AccordionItemBase({
  title,
  subtitle,
  children,
  expanded,
  onToggle,
  right,
  disabled = false,
  divider = true,
  style,
}: AccordionItemProps) {
  const { colors, space, sizes } = useTheme()
  const [contentHeight, setContentHeight] = useState(0)
  const progress = useRef(new Animated.Value(expanded ? 1 : 0)).current

  useEffect(() => {
    Animated.timing(progress, {
      toValue: expanded ? 1 : 0,
      duration: expanded ? 240 : 200,
      easing: expanded ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start()
  }, [expanded, progress])

  const onContentLayout = useCallback((event: LayoutChangeEvent) => {
    setContentHeight(event.nativeEvent.layout.height)
  }, [])

  return (
    <View style={style}>
      <Pressable
        onPress={disabled ? undefined : onToggle}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ expanded, disabled }}
        accessibilityLabel={title}
        style={({ pressed }) => [
          styles.header,
          {
            paddingVertical: space(3.5),
            gap: space(3),
            opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
          },
        ]}>
        <View style={styles.titles}>
          <Text variant="body">{title}</Text>
          {subtitle != null && (
            <Text variant="caption" color="textMuted">
              {subtitle}
            </Text>
          )}
        </View>
        {right}
        <Animated.View
          style={{
            transform: [
              {
                rotate: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '180deg'],
                }),
              },
            ],
          }}>
          <Chevron color={colors.textFaint} size={sizes.icon.sm} />
        </Animated.View>
      </Pressable>

      <Animated.View
        style={{
          height: progress.interpolate({ inputRange: [0, 1], outputRange: [0, contentHeight] }),
          opacity: progress,
          overflow: 'hidden',
        }}>
        {/* Absolute, so measuring the natural height does not force the
            collapsed row open while it happens. */}
        <View onLayout={onContentLayout} style={styles.measure}>
          <View style={{ paddingBottom: space(3.5) }}>{children}</View>
        </View>
      </Animated.View>

      {divider && (
        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />
      )}
    </View>
  )
}

function Chevron({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.5,
          height: size * 0.5,
          borderRightWidth: 1.5,
          borderBottomWidth: 1.5,
          borderColor: color,
          transform: [{ rotate: '45deg' }, { translateY: -size * 0.12 }],
        }}
      />
    </View>
  )
}

export const AccordionItem = memo(AccordionItemBase)

export type AccordionEntry = {
  key: string
  title: string
  subtitle?: string
  content: ReactNode
  right?: ReactNode
  disabled?: boolean
}

export type AccordionProps = {
  items: readonly AccordionEntry[]
  /** Uncontrolled starting state */
  defaultExpanded?: readonly string[]
  expanded?: readonly string[]
  onExpandedChange?: (keys: string[]) => void
  /**
   * Only one panel at a time.
   *
   * Worth it for long content: with several open, the row a user just tapped
   * can end up below the fold, which reads as nothing having happened.
   */
  single?: boolean
  style?: StyleProp<ViewStyle>
}

export function Accordion({
  items,
  defaultExpanded = [],
  expanded,
  onExpandedChange,
  single = false,
  style,
}: AccordionProps) {
  const [internal, setInternal] = useState<readonly string[]>(defaultExpanded)
  const open = expanded ?? internal

  const toggle = useCallback(
    (key: string) => {
      const isOpen = open.includes(key)
      const next = single ? (isOpen ? [] : [key]) : isOpen ? open.filter((k) => k !== key) : [...open, key]
      if (expanded === undefined) setInternal(next)
      onExpandedChange?.(next)
    },
    [expanded, onExpandedChange, open, single],
  )

  return (
    <View style={style}>
      {items.map((item, index) => (
        <AccordionItem
          key={item.key}
          title={item.title}
          subtitle={item.subtitle}
          right={item.right}
          disabled={item.disabled}
          expanded={open.includes(item.key)}
          onToggle={() => toggle(item.key)}
          divider={index < items.length - 1}>
          {item.content}
        </AccordionItem>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center' },
  titles: { flex: 1, gap: 2 },
  measure: { position: 'absolute', left: 0, right: 0, top: 0 },
})
