import { memo, useEffect, useMemo, useState } from 'react'
import { Image, StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native'

import { readableOn, resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import type { ColorInput } from '../theme/types'
import { Text } from './text'

export type AvatarProps = {
  /** Remote or local image. Falls back to initials when absent or broken */
  source?: ImageSourcePropType | string | null
  name?: string
  size?: number
  shape?: 'circle' | 'rounded'
  /** Overrides the color derived from the name */
  bg?: ColorInput
  /** Presence dot in the corner */
  status?: ColorInput | null
  style?: StyleProp<ViewStyle>
}

/**
 * Deterministic tint from a name.
 *
 * Random colors make the same person look different on every screen, and a
 * single default makes a list of people a wall of identical circles. Hashing
 * the name keeps one person one color, everywhere, with nothing stored.
 */
const TINTS = ['#E5484D', '#F76808', '#FFB224', '#30A46C', '#0A84FF', '#8E4EC6', '#E93D82']

function tintFor(name: string): string {
  let hash = 0
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) >>> 0
  }
  return TINTS[hash % TINTS.length]!
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2)
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`
}

function AvatarBase({ source, name, size = 40, shape = 'circle', bg, status, style }: AvatarProps) {
  const { colors, radius } = useTheme()
  const [failed, setFailed] = useState(false)

  const resolvedSource: ImageSourcePropType | null = useMemo(() => {
    if (source == null) return null
    return typeof source === 'string' ? { uri: source } : source
  }, [source])

  // A new address deserves a fresh attempt: the last one failing says nothing
  // about this one.
  useEffect(() => setFailed(false), [resolvedSource])

  const background = bg
    ? resolveColor(colors, bg, colors.raised)
    : name
      ? tintFor(name)
      : colors.raised

  const borderRadius = shape === 'circle' ? size / 2 : radius.sm
  const dot = Math.max(8, Math.round(size * 0.28))

  return (
    <View style={[{ width: size, height: size }, style]}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius,
          backgroundColor: background,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
        {resolvedSource && !failed ? (
          <Image
            source={resolvedSource}
            style={{ width: size, height: size }}
            resizeMode="cover"
            /**
             * A broken address falls back to the initials rather than leaving
             * a coloured hole. An avatar that cannot load is still a person,
             * and their name is right there.
             */
            onError={() => setFailed(true)}
          />
        ) : (
          <Text
            variant="label"
            style={{ color: readableOn(background), fontSize: Math.round(size * 0.36) }}>
            {initialsOf(name ?? '')}
          </Text>
        )}
      </View>

      {status != null && (
        <View
          style={[
            styles.status,
            {
              width: dot,
              height: dot,
              borderRadius: dot / 2,
              backgroundColor: resolveColor(colors, status, colors.ok),
              borderColor: colors.canvas,
            },
          ]}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  status: { position: 'absolute', right: 0, bottom: 0, borderWidth: 2 },
})

export const Avatar = memo(AvatarBase)
