import { useSyncExternalStore } from 'react'
import { View } from 'react-native'
import {
  Card,
  Fab,
  ListItem,
  SegmentedControl,
  Switch,
  Text,
  toast,
  useInsets,
  useTheme,
} from '@bfkk/bevel'

import { Demo, Spec, Stack } from './ui'

type Placement = 'start' | 'center' | 'end'

/**
 * The page and its floating button are handed to the screen separately - one
 * as content, one as the overlay - so the controls and the button they steer
 * cannot share ordinary state. A store outside React is the smallest way to
 * join them, and it is what the package's own toast does.
 */
type Settings = { placement: Placement; extended: boolean; hides: boolean }

let settings: Settings = { placement: 'end', extended: true, hides: true }
const listeners = new Set<() => void>()

function update(patch: Partial<Settings>) {
  settings = { ...settings, ...patch }
  for (const listener of listeners) listener()
}

function useSettings(): Settings {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => settings,
    () => settings,
  )
}

export function FabDemo() {
  const { space } = useTheme()
  const insets = useInsets()
  const { placement, extended, hides } = useSettings()

  return (
    <Stack>
      <Demo
        title="The one action a screen is really for"
        note="It floats over the content, which means it also covers some of it. That is the whole design problem: one per screen, out of the way while the list moves, and reachable without crossing the screen. There is exactly one on this page, and every control below steers that one - two floating buttons is a toolbar that has escaped, and a demo that broke its own rule to show you the rule would not be worth much.">
        <Spec label="position">
          <SegmentedControl
            value={placement}
            onChange={(value) => update({ placement: value })}
            options={[
              { value: 'start' as const, label: 'Start' },
              { value: 'center' as const, label: 'Centre' },
              { value: 'end' as const, label: 'End' },
            ]}
          />
        </Spec>
        <Text variant="caption" color="textFaint">
          Start and end mirror in a right-to-left layout, which is what a
          floating button is expected to do. `left` and `right` are the escape
          hatch for a layout that must not move.
        </Text>
      </Demo>

      <Demo
        title="Saying what it does"
        note="The pill says what happens; a circle asks you to guess from an icon. Collapsing while the list moves gives back the width without giving up the label - it is taken back once the screen has been still for a moment, rather than on a scroll-end event, because momentum, a bounce and a finger held still are all stopped as far as the reader is concerned.">
        <Spec label="extended">
          <Switch value={extended} onChange={(value) => update({ extended: value })} />
        </Spec>
        <Spec label="hideOnScroll">
          <Switch value={hides} onChange={(value) => update({ hides: value })} />
        </Spec>
      </Demo>

      <Demo
        title="Where the bottom edge actually is"
        note="Printed rather than described. The button clears the home indicator by taking the bottom safe area from the provider and adding its own offset - if the first figure below reads zero on a phone that has a home indicator, the app has not passed its insets in, and every component that keeps clear of an edge is guessing.">
        <Spec label="insets.bottom">
          <Text variant="caption" color="textMuted">
            {`${Math.round(insets.bottom)}pt`}
          </Text>
        </Spec>
        <Spec label="button sits at">
          <Text variant="caption" color="textMuted">
            {`${Math.round(insets.bottom) + 16}pt above the edge`}
          </Text>
        </Spec>
      </Demo>

      <Demo
        title="Getting out of the way"
        note="Scroll down and it drops off the edge; scroll up and it is back before the finger stops. Hidden or shown, and nothing in between - stop halfway through a scroll and it still commits, because a button left standing half off the bottom of the screen is cut in two by the edge. It clears the home indicator without being told: the safe area comes from the provider, not from a guess.">
        <Card padding={0} gap={0} style={{ overflow: 'hidden' }}>
          {Array.from({ length: 14 }, (_, index) => (
            <View key={index} style={{ paddingHorizontal: space(4) }}>
              <ListItem
                title={`Row ${index + 1}`}
                subtitle="Scroll and watch the corner"
                divider={index < 13}
              />
            </View>
          ))}
        </Card>
      </Demo>
    </Stack>
  )
}

/** Handed to the screen so it floats over the list rather than scrolling with it */
export function FabDemoOverlay() {
  const { placement, extended, hides } = useSettings()

  return (
    <Fab
      label={extended ? 'Compose' : undefined}
      accessibilityLabel="Compose"
      position={placement}
      hideOnScroll={hides}
      collapseOnScroll={extended}
      onPress={() => toast.success('Composing')}
    />
  )
}
