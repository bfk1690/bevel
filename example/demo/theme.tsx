import { View } from 'react-native'
import {
  Card,
  Text,
  alpha,
  contrast,
  darken,
  lighten,
  mix,
  readableOn,
  shadow,
  useTheme,
} from '@bfkk/bevel'

import { Demo, Row, Stack } from './ui'

const ROLES = [
  'canvas',
  'sunk',
  'surface',
  'raised',
  'sheet',
  'border',
  'borderStrong',
  'text',
  'textMuted',
  'textFaint',
  'accent',
  'accentSoft',
  'onAccent',
  'ok',
  'okSoft',
  'warning',
  'warningSoft',
  'danger',
  'dangerSoft',
  'media',
  'onMedia',
  'overlay',
  'skeleton',
] as const

export function ThemeDemo() {
  const { colors, radius, space, sizes, theme, scheme } = useTheme()

  return (
    <Stack>
      <Demo
        title="Surface ladder"
        note="The ladder climbs in one direction. In a dark theme depth cannot come from shadow - black over black is invisible - so it comes from surface lightness instead.">
        {(['sunk', 'canvas', 'surface', 'raised', 'sheet'] as const).map((role) => (
          <View
            key={role}
            style={{
              backgroundColor: colors[role],
              borderRadius: radius.sm,
              borderWidth: 1,
              borderColor: colors.border,
              padding: space(3),
            }}>
            <Text variant="caption">{`${role}  ${colors[role]}`}</Text>
          </View>
        ))}
      </Demo>

      <Demo title={`All roles - ${scheme}`}>
        <View style={{ gap: space(1.5) }}>
          {ROLES.map((role) => (
            <Row key={role} gap={space(2)}>
              <View
                style={{
                  width: space(10),
                  height: space(6),
                  borderRadius: radius.xs,
                  backgroundColor: colors[role],
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
              <Text variant="caption" style={{ flex: 1 }}>
                {role}
              </Text>
              <Text variant="micro" color="textFaint">
                {colors[role]}
              </Text>
            </Row>
          ))}
        </View>
      </Demo>

      <Demo title="Radius">
        <Row>
          {(['none', 'xs', 'sm', 'md', 'lg', 'xl', 'pill'] as const).map((token) => (
            <View key={token} style={{ alignItems: 'center', gap: 4 }}>
              <View
                style={{
                  width: space(14),
                  height: space(10),
                  borderRadius: radius[token],
                  backgroundColor: colors.raised,
                }}
              />
              <Text variant="micro" color="textFaint">
                {`${token} ${dp(radius[token])}`}
              </Text>
            </View>
          ))}
        </Row>
      </Demo>

      <Demo title="Spacing" note={`One unit is ${theme.spacingUnit}dp, scaled with mode "${theme.scale}".`}>
        {[1, 2, 3, 4, 6, 8].map((steps) => (
          <Row key={steps}>
            <View style={{ height: space(2), width: space(steps), backgroundColor: colors.accent }} />
            <Text variant="micro" color="textFaint">
              {`space(${steps}) = ${dp(space(steps))}`}
            </Text>
          </Row>
        ))}
      </Demo>

      <Demo title="Shadows" note="iOS and Android need separate values, not one spec translated.">
        <Row gap={space(3)}>
          {(['card', 'float', 'dock', 'toast'] as const).map((preset) => (
            <View key={preset} style={{ alignItems: 'center', gap: 6 }}>
              <View
                style={[
                  {
                    width: space(16),
                    height: space(12),
                    borderRadius: radius.md,
                    backgroundColor: colors.surface,
                  },
                  shadow(preset, colors.media),
                ]}
              />
              <Text variant="micro" color="textFaint">
                {preset}
              </Text>
            </View>
          ))}
        </Row>
      </Demo>

      <Demo
        title="Color math"
        note="Memoized: a bevel edge is its background darkened, and recomputing that every frame is waste.">
        <Card gap={space(2)}>
          <Swatch label={`darken(accent, .3)`} color={darken(colors.accent, 0.3)} />
          <Swatch label={`lighten(accent, .3)`} color={lighten(colors.accent, 0.3)} />
          <Swatch label={`alpha(accent, .2)`} color={alpha(colors.accent, 0.2)} />
          <Swatch label={`mix(accent, danger, .5)`} color={mix(colors.accent, colors.danger, 0.5)} />
          <Text variant="caption" color="textMuted">
            {`contrast(text, canvas) = ${contrast(colors.text, colors.canvas).toFixed(1)}:1`}
          </Text>
          <Text variant="caption" color="textMuted">
            {`readableOn(accent) = ${readableOn(colors.accent)}`}
          </Text>
        </Card>
      </Demo>

      <Demo
        title="Control sizes"
        note="Values land on the device pixel grid, so they are not round numbers - snapping keeps edges crisp on a 3x screen.">
        <Text variant="caption" color="textMuted">
          {`control  sm ${dp(sizes.control.sm)}  md ${dp(sizes.control.md)}  lg ${dp(sizes.control.lg)}`}
        </Text>
        <Text variant="caption" color="textMuted">
          {`icon  sm ${dp(sizes.icon.sm)}  md ${dp(sizes.icon.md)}  lg ${dp(sizes.icon.lg)}`}
        </Text>
        <Text variant="caption" color="textMuted">
          {`minTap ${dp(sizes.minTap)}  hitSlop ${dp(sizes.hitSlop)}  borderWidth ${sizes.borderWidth}`}
        </Text>
        <Text variant="caption" color="textMuted">
          The 44dp touch floor never scales below itself, whatever the device.
        </Text>
      </Demo>
    </Stack>
  )
}

/** Trims the pixel-grid tail so a spec sheet stays readable */
function dp(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function Swatch({ label, color }: { label: string; color: string }) {
  const { colors, radius, space } = useTheme()
  return (
    <Row>
      <View
        style={{
          width: space(10),
          height: space(6),
          borderRadius: radius.xs,
          backgroundColor: color,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      />
      <Text variant="caption" style={{ flex: 1 }}>
        {label}
      </Text>
      <Text variant="micro" color="textFaint">
        {color}
      </Text>
    </Row>
  )
}
