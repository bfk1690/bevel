import { Fragment, type ReactNode, type RefObject } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { Text } from '../primitives/text'
import { useTheme } from '../theme/provider'
import type { Placement } from '../utils/placement'
import { Popover } from './popover'

export type MenuItem = {
  label: string
  onPress: () => void
  /** Icon or marker before the label */
  left?: ReactNode
  /** Value, shortcut or check mark after it */
  right?: ReactNode
  destructive?: boolean
  disabled?: boolean
}

export type MenuProps = {
  visible: boolean
  onClose: () => void
  anchorRef: RefObject<View | null>
  items: readonly MenuItem[]
  placement?: Placement | 'auto'
  minWidth?: number
  maxWidth?: number
}

/**
 * Actions anchored to the control that opened them.
 *
 * Choosing an item closes the menu without the caller saying so: leaving it
 * open after a choice means the user has to dismiss something they already
 * finished with.
 *
 * A destructive item is coloured but not moved to the end - reordering an
 * action list by severity puts things in a different place from one menu to
 * the next, and muscle memory is worth more than the extra warning.
 */
export function Menu({
  visible,
  onClose,
  anchorRef,
  items,
  placement = 'auto',
  minWidth = 180,
  maxWidth = 280,
}: MenuProps) {
  const { colors, space } = useTheme()

  return (
    <Popover
      visible={visible}
      onClose={onClose}
      anchorRef={anchorRef}
      placement={placement}
      maxWidth={maxWidth}
      arrow={false}
      style={{ padding: space(1), minWidth }}>
      {items.map((item, index) => (
        <Fragment key={`${item.label}-${index}`}>
          {index > 0 && (
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />
          )}
          <Pressable
            onPress={() => {
              if (item.disabled) return
              onClose()
              item.onPress()
            }}
            disabled={item.disabled}
            accessibilityRole="menuitem"
            accessibilityState={{ disabled: item.disabled }}
            style={({ pressed }) => [
              styles.item,
              {
                paddingVertical: space(2.5),
                paddingHorizontal: space(2.5),
                gap: space(2.5),
                backgroundColor: pressed ? colors.raised : 'transparent',
                opacity: item.disabled ? 0.4 : 1,
              },
            ]}>
            {item.left}
            <Text
              variant="body"
              color={item.destructive ? 'danger' : 'text'}
              numberOfLines={1}
              style={styles.label}>
              {item.label}
            </Text>
            {item.right}
          </Pressable>
        </Fragment>
      ))}
    </Popover>
  )
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', borderRadius: 8 },
  label: { flex: 1 },
})
