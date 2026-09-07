import { useState } from 'react'
import { View } from 'react-native'
import { Card, Fab, ListItem, SegmentedControl, Switch, Text, toast, useTheme } from '@bfkk/bevel'

import { Demo, Spec, Stack } from './ui'

/**
 * The button itself is handed to the screen through the registry, since it
 * belongs over the scroll area rather than inside it.
 */
export function FabDemo() {
  const { space } = useTheme()

  return (
    <Stack>
      <Demo
        title="The one action a screen is really for"
        note="It floats over the content, which means it also covers some of it. That is the whole design problem: one per screen, out of the way while the list moves, and reachable without crossing the screen. Two floating buttons is a toolbar that has escaped.">
        <Card padding={0} gap={0} style={{ overflow: 'hidden' }}>
          {Array.from({ length: 12 }, (_, index) => (
            <View key={index} style={{ paddingHorizontal: space(4) }}>
              <ListItem
                title={`Row ${index + 1}`}
                subtitle="Scroll and watch the corner"
                divider={index < 11}
              />
            </View>
          ))}
        </Card>
      </Demo>

      <Demo
        title="Getting out of the way"
        note="Scroll down and it drops off the edge; scroll up and it is back before the finger stops. The direction is not tracked in JavaScript: a clamped difference of the scroll offset grows going down and shrinks going up on its own, which keeps the whole thing on the native driver.">
        <Spec label="hideOnScroll">
          <Text variant="caption" color="textMuted">
            on, in the corner
          </Text>
        </Spec>
        <Spec label="collapseOnScroll">
          <Text variant="caption" color="textMuted">
            sheds its label while moving
          </Text>
        </Spec>
      </Demo>

      <Demo
        title="Where it sits"
        note="Bottom right by default, because that is where a thumb is. Centred suits a single decisive action on a short screen; left is for the rare layout whose right edge is already busy. It clears the home indicator on its own - the safe area comes from the provider, not from a guess."
      >
        <Placement />
      </Demo>
    </Stack>
  )
}

function Placement() {
  const { colors, radius, space } = useTheme()
  const [extended, setExtended] = useState(true)
  const [position, setPosition] = useState<'left' | 'center' | 'right'>('right')

  return (
    <>
      <SegmentedControl
        value={position}
        onChange={setPosition}
        options={[
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Centre' },
          { value: 'right', label: 'Right' },
        ]}
      />

      {/* A stand-in for a screen, so the button can be seen in its corner
          without leaving the page. respectSafeArea is off because inside a box
          the home indicator belongs to something else */}
      <View
        style={{
          height: 160,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.sunk,
          overflow: 'hidden',
          padding: space(3),
        }}>
        <Text variant="caption" color="textFaint">
          A screen
        </Text>
        <Fab
          label={extended ? 'New note' : undefined}
          accessibilityLabel="New note"
          onPress={() => toast.info('Pressed')}
          position={position}
          respectSafeArea={false}
          offset={12}
          inset={12}
        />
      </View>

      <Spec label="extended">
        <Switch value={extended} onChange={setExtended} />
      </Spec>
      <Text variant="caption" color="textFaint">
        {extended
          ? 'The pill says what happens. A circle asks you to guess from an icon.'
          : 'A circle, once the action is obvious from the screen it is on.'}
      </Text>
    </>
  )
}

/** Handed to the screen so it floats over the list rather than scrolling with it */
export function FabDemoOverlay() {
  return (
    <Fab
      label="Compose"
      onPress={() => toast.success('Composing')}
      hideOnScroll
      collapseOnScroll
    />
  )
}
