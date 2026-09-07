import { Pressable, View } from 'react-native'
import { useTheme } from '@bfkk/bevel'

/**
 * Scheme switch for the gallery header.
 *
 * A labelled button spent a third of the header on the word "Dark" and still
 * only said what would happen, not what is. A sun and a moon say both at a
 * glance and leave the title the room it needs.
 */
export function ThemeToggle() {
  const { colors, scheme, setPreference, radius, sizes } = useTheme()
  const dark = scheme === 'dark'
  const size = Math.round(sizes.control.sm)
  const glyph = Math.round(size * 0.5)

  return (
    <Pressable
      onPress={() => setPreference(dark ? 'light' : 'dark')}
      accessibilityRole="button"
      accessibilityLabel={dark ? 'Switch to the light scheme' : 'Switch to the dark scheme'}
      hitSlop={sizes.hitSlop}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: radius.pill,
        backgroundColor: colors.raised,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}>
      {dark ? (
        <Moon color={colors.text} background={colors.raised} size={glyph} />
      ) : (
        <Sun color={colors.text} size={glyph} />
      )}
    </Pressable>
  )
}

/**
 * Spokes first, core on top.
 *
 * The rays are full-width bars crossing the middle; drawing the disc over them
 * in the same colour hides the crossing and leaves eight spokes around a solid
 * core. Two shapes instead of nine.
 */
function Sun({ color, size }: { color: string; size: number }) {
  const ray = Math.max(1.5, size * 0.1)
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {[0, 45, 90, 135].map((angle) => (
        <View
          key={angle}
          style={{
            position: 'absolute',
            width: size,
            height: ray,
            borderRadius: ray,
            backgroundColor: color,
            transform: [{ rotate: `${angle}deg` }],
          }}
        />
      ))}
      <View
        style={{
          width: size * 0.58,
          height: size * 0.58,
          borderRadius: size,
          backgroundColor: color,
        }}
      />
    </View>
  )
}

/**
 * A crescent is a disc with a bite taken out of it.
 *
 * The bite is a second disc in the surface colour, which is why the background
 * has to be passed in rather than assumed.
 */
function Moon({ color, background, size }: { color: string; background: string; size: number }) {
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: -size * 0.22,
          left: size * 0.28,
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: background,
        }}
      />
    </View>
  )
}
