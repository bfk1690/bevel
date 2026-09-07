import { memo } from 'react'
import { StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native'

import { resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import type { ColorInput } from '../theme/types'
import { Avatar } from './avatar'
import { Text } from './text'

export type AvatarGroupItem = {
  name?: string
  source?: ImageSourcePropType | string | null
}

export type AvatarGroupProps = {
  items: readonly AvatarGroupItem[]
  /** Faces to show before collapsing the rest into a count. Defaults to 4 */
  max?: number
  size?: number
  /** How much of each face the next one covers, 0 to 0.7. Defaults to 0.35 */
  overlap?: number
  /** Ring separating the faces. Match it to the surface behind the group */
  ring?: ColorInput
  shape?: 'circle' | 'rounded'
  style?: StyleProp<ViewStyle>
}

/**
 * Overlapping faces.
 *
 * The ring is not decoration: without a border in the surface color the faces
 * merge into one shape as soon as two of them share a tone, and the group
 * stops reading as a count of people.
 *
 * The first face is drawn last so the stack overlaps leftwards, the way a hand
 * of cards is held - each new face tucks behind the one before it instead of
 * covering it.
 */
function AvatarGroupBase({
  items,
  max = 4,
  size = 32,
  overlap = 0.35,
  ring = 'canvas',
  shape = 'circle',
  style,
}: AvatarGroupProps) {
  const { colors, radius } = useTheme()

  const clamped = Math.max(0, Math.min(0.7, overlap))
  const step = Math.round(size * (1 - clamped))
  const visible = items.slice(0, Math.max(1, max))
  const remaining = items.length - visible.length

  const ringColor = resolveColor(colors, ring, colors.canvas)
  const ringWidth = Math.max(1.5, Math.round(size * 0.06))
  // The ring sits OUTSIDE the face, so its radius has to grow by its own
  // width. Reusing the face's radius leaves a sliver at each corner where the
  // face behind shows through.
  const borderRadius = shape === 'circle' ? size : radius.sm + ringWidth

  return (
    <View style={[styles.row, style]} accessibilityLabel={`${items.length} people`}>
      {visible.map((item, index) => (
        <View
          key={`${item.name ?? 'face'}-${index}`}
          style={{
            marginStart: index === 0 ? 0 : step - size,
            borderRadius,
            borderWidth: ringWidth,
            borderColor: ringColor,
            // Later faces sit behind, so the leftmost stays fully visible
            zIndex: visible.length - index,
          }}>
          <Avatar name={item.name} source={item.source} size={size} shape={shape} />
        </View>
      ))}

      {remaining > 0 && (
        <View
          style={{
            marginStart: step - size,
            width: size,
            height: size,
            borderRadius,
            borderWidth: ringWidth,
            borderColor: ringColor,
            backgroundColor: colors.raised,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 0,
          }}>
          <Text variant="micro" color="textMuted" style={{ fontSize: Math.round(size * 0.3) }}>
            {`+${remaining}`}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
})

export const AvatarGroup = memo(AvatarGroupBase)
