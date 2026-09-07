import { useState } from 'react'
import { View } from 'react-native'
import { Card, Switch, TabBar, Text, toast, useTheme } from '@bfkk/bevel'

import { Demo, Spec, Stack } from './ui'

type Route = 'home' | 'search' | 'saved' | 'profile'

const TABS = [
  { value: 'home' as const, label: 'Home' },
  { value: 'search' as const, label: 'Search' },
  { value: 'saved' as const, label: 'Saved', badge: 3 },
  { value: 'profile' as const, label: 'Profile', badge: true as const },
]

export function TabBarDemo() {
  const { colors, radius } = useTheme()
  const [route, setRoute] = useState<Route>('home')
  const [labelActiveOnly, setLabelActiveOnly] = useState(false)

  return (
    <Stack>
      <Demo
        title="The bar along the bottom"
        note="Presentational on purpose: it takes the current value and reports taps, so whichever router the app uses stays the one that owns the route. Nothing in it knows what a screen is - which is also why it can be dropped into a screen's footer without a navigation library present.">
        {/* Framed like a screen, since a bar with nothing above it is hard to
            judge */}
        <View
          style={{
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
          }}>
          <View style={{ height: 120, backgroundColor: colors.sunk, padding: 16 }}>
            <Text variant="caption" color="textFaint">
              {`The ${route} screen`}
            </Text>
          </View>
          <TabBar
            value={route}
            onChange={setRoute}
            items={TABS}
            labelActiveOnly={labelActiveOnly}
            respectSafeArea={false}
            onReselect={() => toast.info('Back to the top')}
          />
        </View>
        <Spec label="labelActiveOnly">
          <Switch value={labelActiveOnly} onChange={setLabelActiveOnly} />
        </Spec>
      </Demo>

      <Demo
        title="Tapping the tab you are already on"
        note="Sends the screen home. Every platform with a tab bar does it, and an app that does not feels broken to anyone who has tried it once. Reselecting is reported separately from changing, so the router is not asked to navigate to where it already is.">
        <Card>
          <Text variant="caption" color="textMuted">
            Tap the highlighted tab above.
          </Text>
        </Card>
      </Demo>

      <Demo
        title="Counts and dots"
        note="A number when the number matters, a dot when only the fact does. Either hangs off the icon's corner rather than taking a place in the row - in the row it would shift the label sideways the moment a count appeared."
      >
        <Card>
          <Text variant="caption" color="textMuted">
            Saved carries a count. Profile carries a dot: something is waiting,
            and saying how many would be pretending to know.
          </Text>
        </Card>
      </Demo>

      <Demo
        title="Icons"
        note="The kit ships no icon set, so a tab draws its own and is handed the state and the colour already resolved for it. That keeps the choice of icon library with the app, and keeps the bar working before one has been chosen.">
        <View
          style={{
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
          }}>
          <TabBar
            value={route}
            onChange={setRoute}
            respectSafeArea={false}
            items={TABS.map((tab) => ({
              ...tab,
              icon: (active, color) => (
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: active ? 4 : 11,
                    backgroundColor: color,
                  }}
                />
              ),
            }))}
          />
        </View>
      </Demo>
    </Stack>
  )
}
