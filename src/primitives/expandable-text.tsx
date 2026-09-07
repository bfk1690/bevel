import { useCallback, useState } from 'react'
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native'

import type { ColorInput, TypeToken } from '../theme/types'
import { useTheme } from '../theme/provider'
import { Text } from './text'

export type ExpandableTextProps = {
  children: string
  /** Lines shown before it is expanded */
  lines?: number
  moreLabel?: string
  lessLabel?: string
  /** Hides the control once expanded, for text that is read and left */
  collapsible?: boolean
  variant?: TypeToken
  color?: ColorInput
  actionColor?: ColorInput
  style?: StyleProp<ViewStyle>
}

/**
 * Long text, with a way out.
 *
 * The control only appears when the text is ACTUALLY clipped, which is decided
 * by the platform rather than by counting characters: the same sentence takes
 * three lines in one language and five in another, and a "read more" under two
 * lines of visible text is a link that does nothing.
 */
export function ExpandableText({
  children,
  lines = 3,
  moreLabel = 'More',
  lessLabel = 'Less',
  collapsible = true,
  variant = 'body',
  color = 'text',
  actionColor = 'accent',
  style,
}: ExpandableTextProps) {
  const { space } = useTheme()
  const [expanded, setExpanded] = useState(false)
  const [clipped, setClipped] = useState(false)

  const onTextLayout = useCallback(
    (event: { nativeEvent: { lines: readonly unknown[] } }) => {
      // Reported once, on the collapsed pass: after expanding, the line count
      // is the full one and would say nothing was ever clipped.
      if (expanded) return
      setClipped(event.nativeEvent.lines.length > lines)
    },
    [expanded, lines],
  )

  return (
    <View style={[{ gap: space(1) }, style]}>
      <Text
        variant={variant}
        color={color}
        numberOfLines={expanded ? undefined : lines}
        onTextLayout={onTextLayout}>
        {children}
      </Text>

      {clipped && (expanded ? collapsible : true) && (
        <Pressable
          onPress={() => setExpanded((previous) => !previous)}
          accessibilityRole="button"
          accessibilityState={{ expanded }}>
          <Text variant="caption" color={actionColor}>
            {expanded ? lessLabel : moreLabel}
          </Text>
        </Pressable>
      )}
    </View>
  )
}
