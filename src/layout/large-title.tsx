import { useMemo } from 'react'
import { Animated, type StyleProp, type ViewStyle } from 'react-native'

import { Text } from '../primitives/text'
import { useTheme } from '../theme/provider'
import { useScrollOffset } from './scroll-context'

export type LargeTitleProps = {
  title: string
  subtitle?: string
  /** How far the screen scrolls before it has fully faded */
  fadeDistance?: number
  style?: StyleProp<ViewStyle>
}

/**
 * The page title, at the top of the content.
 *
 * It lives INSIDE the scroll view, which is the whole point: it scrolls away
 * and takes its space with it. Drawn in a fixed header instead, fading it out
 * leaves the gap it occupied behind - the title disappears and a band of empty
 * screen stays where it was.
 *
 * It fades a little faster than it scrolls, so the bar title has taken over by
 * the time this one is gone rather than the two overlapping halfway.
 */
export function LargeTitle({ title, subtitle, fadeDistance = 44, style }: LargeTitleProps) {
  const { space } = useTheme()
  const { y } = useScrollOffset()

  const fade = useMemo(
    () =>
      y.interpolate({
        inputRange: [0, Math.max(1, fadeDistance)],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      }),
    [fadeDistance, y],
  )

  return (
    <Animated.View style={[{ paddingBottom: space(3), gap: 2, opacity: fade }, style]}>
      <Text variant="title" numberOfLines={1}>
        {title}
      </Text>
      {subtitle != null && (
        <Text variant="caption" color="textMuted" numberOfLines={1}>
          {subtitle}
        </Text>
      )}
    </Animated.View>
  )
}
