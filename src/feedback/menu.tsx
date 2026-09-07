import { Fragment, type ReactNode, type RefObject } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { Text } from '../primitives/text'
import { useTheme } from '../theme/provider'
import type { Placement } from '../utils/placement'
import { Popover } from './popover'

export type MenuSection = {
  /** A heading rather than a choice. Nothing happens when it is pressed */
  section: string
}

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

export type MenuEntry = MenuItem | MenuSection

function isSection(entry: MenuEntry): entry is MenuSection {
  return 'section' in entry
}

export type MenuProps = {
  visible: boolean
  onClose: () => void
  anchorRef: RefObject<View | null>
  items: readonly MenuEntry[]
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
      {items.map((item, index) => {
        if (isSection(item)) {
          return (
            <View
              key={`${item.section}-${index}`}
              style={{
                paddingHorizontal: space(2.5),
                paddingTop: index === 0 ? space(1.5) : space(3),
                paddingBottom: space(1),
              }}>
              <Text variant="micro" color="textFaint">
                {item.section}
              </Text>
            </View>
          )
        }

        // No rule between every pair: a line under each of four items turns a
        // short menu into a grid. Section headings do the grouping instead,
        // and only where the grouping actually changes.
        return (
        <Fragment key={`${item.label}-${index}`}>
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
        )
      })}
    </Popover>
  )
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', borderRadius: 8 },
  label: { flex: 1 },
})
