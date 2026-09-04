import { memo } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import type { ColorInput } from '../theme/types'
import { Text } from './text'

export type DividerProps = {
  orientation?: 'horizontal' | 'vertical'
  /** Indent from both ends - list rows usually inset to the content edge */
  inset?: number
  color?: ColorInput
  /** Centered caption, for "or" style separators */
  label?: string
  spacing?: number
  style?: StyleProp<ViewStyle>
}

function DividerBase({
  orientation = 'horizontal',
  inset = 0,
  color = 'border',
  label,
  spacing,
  style,
}: DividerProps) {
  const { colors, space } = useTheme()
  const line = resolveColor(colors, color, colors.border)
  const gap = spacing ?? space(3)

  // Hairlines are drawn at the thinnest line the screen can actually render,
  // not at 1dp, which reads heavy on high-density displays.
  const thickness = StyleSheet.hairlineWidth

  if (orientation === 'vertical') {
    return (
      <View
        style={[{ width: thickness, alignSelf: 'stretch', backgroundColor: line, marginVertical: inset }, style]}
      />
    )
  }

  if (label != null) {
    return (
      <View style={[styles.labelRow, { gap, marginHorizontal: inset }, style]}>
        <View style={{ flex: 1, height: thickness, backgroundColor: line }} />
        <Text variant="micro" color="textFaint">
          {label}
        </Text>
        <View style={{ flex: 1, height: thickness, backgroundColor: line }} />
      </View>
    )
  }

  return <View style={[{ height: thickness, backgroundColor: line, marginHorizontal: inset }, style]} />
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', alignItems: 'center' },
})

export const Divider = memo(DividerBase)
