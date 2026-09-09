import { View } from 'react-native'
import {
  Card,
  Grid,
  Text,
  breakpointFor,
  pickResponsive,
  useBreakpoint,
  useOrientation,
  useResponsive,
  useTheme,
} from '@bfkk/bevel'

import { Demo, Spec, Stack } from './ui'

export function ResponsiveDemo() {
  const { colors, radius, space } = useTheme()
  const orientation = useOrientation()
  const breakpoint = useBreakpoint()
  const columns = useResponsive({ compact: 2, medium: 3, expanded: 5 }) ?? 2

  return (
    <Stack>
      <Demo
        title="The window, not the device"
        note="They disagree more often than it seems: a phone lying flat has an orientation and no useful shape, and an app in a split view on a tablet is portrait-shaped while the tablet is landscape. Layout answers to the window, so that is what these report - and it needs no native orientation module to say it. Turn the phone and watch both lines change.">
        <Spec label="orientation">
          <Text variant="caption" color="textMuted">
            {orientation}
          </Text>
        </Spec>
        <Spec label="breakpoint">
          <Text variant="caption" color="textMuted">
            {breakpoint}
          </Text>
        </Spec>
      </Demo>

      <Demo
        title="A value per width"
        note="Named widths rather than raw numbers, because a layout decision is about how much room there is and not about a particular phone. Compact is a phone upright, medium a phone on its side or a small tablet, expanded a tablet or a window given most of a large screen.">
        <Grid
          data={Array.from({ length: 10 }, (_, index) => index)}
          keyExtractor={(index) => String(index)}
          columns={columns}
          gap={8}
          aspectRatio={0.7}
          renderItem={(index) => (
            <View
              style={{
                flex: 1,
                borderRadius: radius.sm,
                backgroundColor: index % 2 === 0 ? colors.accent : colors.raised,
              }}
            />
          )}
        />
        <View style={{ height: space(2) }} />
        <Spec label="columns here">
          <Text variant="caption" color="textMuted">
            {String(columns)}
          </Text>
        </Spec>
      </Demo>

      <Demo
        title="It falls down the scale, never up"
        note="A layout that names compact and expanded, opened at medium, gets the compact one. The narrower answer fits in a wider space; the wider one does not fit in a narrower space, so falling upwards would overflow the screen rather than merely leave room on it. A layout that names only expanded gets nothing on a phone - deliberately, because there is no safe way to shrink a shape nobody designed.">
        <Card gap={space(2)}>
          {(['compact', 'medium', 'expanded'] as const).map((name) => (
            <Spec key={name} label={name}>
              <Text variant="caption" color="textMuted">
                {`{ compact: 1, expanded: 3 } → ${String(pickResponsive({ compact: 1, expanded: 3 }, name))}`}
              </Text>
            </Spec>
          ))}
          <Spec label="only expanded">
            <Text variant="caption" color="textFaint">
              {`on a phone → ${String(pickResponsive({ expanded: 3 }, 'compact'))}`}
            </Text>
          </Spec>
        </Card>
      </Demo>

      <Demo
        title="Where the lines fall"
        note="600 and 1000 points. Below 600 is a phone in either orientation on all but the largest handsets; above 1000 is a tablet with the window to itself.">
        <Card gap={space(1)}>
          {[393, 430, 600, 834, 1024, 1366].map((width) => (
            <Spec key={width} label={`${width}pt`}>
              <Text variant="caption" color="textMuted">
                {breakpointFor(width)}
              </Text>
            </Spec>
          ))}
        </Card>
      </Demo>
    </Stack>
  )
}
