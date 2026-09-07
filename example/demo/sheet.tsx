import { useState } from 'react'
import { View } from 'react-native'
import {
  Button,
  Card,
  Chip,
  ChipGroup,
  Divider,
  ListItem,
  Sheet,
  Text,
  toast,
  useTheme,
} from '@bfkk/bevel'

import { Demo, Spec, Stack } from './ui'

const PLACES = [
  { name: 'Karaköy', note: '4 min away' },
  { name: 'Kadıköy', note: '11 min away' },
  { name: 'Moda', note: '18 min away' },
  { name: 'Beşiktaş', note: '23 min away' },
  { name: 'Üsküdar', note: '26 min away' },
  { name: 'Balat', note: '31 min away' },
]

export function SheetDemo() {
  const { colors, radius, space } = useTheme()
  const [places, setPlaces] = useState(false)
  const [index, setIndex] = useState(0)
  const [filters, setFilters] = useState(false)
  const [chosen, setChosen] = useState<readonly string[]>(['open'])
  const [required, setRequired] = useState(false)

  return (
    <Stack>
      <Demo
        title="A place to live, not a question to answer"
        note="Where a modal asks something and leaves, a sheet stays up while the screen behind it is used, and the reader resizes it to suit what they are doing - a map with a list over it, a player, a filter panel. Drag the handle: it settles at a peek, a half and nearly full.">
        <View
          style={{
            height: 140,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.sunk,
            padding: space(4),
            justifyContent: 'flex-end',
          }}>
          <Text variant="caption" color="textFaint">
            Whatever is behind the sheet
          </Text>
        </View>
        <Button label="Show nearby places" onPress={() => setPlaces(true)} />
        <Spec label="index">
          <Text variant="caption" color="textMuted">
            {String(index)}
          </Text>
        </Spec>
      </Demo>

      <Demo
        title="A flick moves one step"
        note="Speed beats position, as it does anywhere a finger throws something: waiting until the sheet has been dragged past halfway before accepting the gesture asks the hand to do the animation's work. But a flick moves one size, not all of them - otherwise a sheet is thrown from peek to full and skips the size the reader was reaching for.">
        <Card>
          <Text variant="caption" color="textMuted">
            The drag is limited to the handle. A sheet that resizes from
            anywhere fights the list inside it: a downward flick meant for the
            content collapses the whole thing instead.
          </Text>
        </Card>
      </Demo>

      <Demo
        title="One size, and a footer"
        note="With a single snap point it is an ordinary bottom sheet. The footer sits outside the scrolling area, so a long list never buries the button that acts on it.">
        <Button label="Filters" variant="secondary" onPress={() => setFilters(true)} />
      </Demo>

      <Demo
        title="One that cannot be waved away"
        note="Not dismissible and no backdrop tap: for the rare sheet that is the only way forward. Rare on purpose - a sheet that cannot be closed is a screen wearing the wrong clothes.">
        <Button label="Choose a payment method" variant="outline" onPress={() => setRequired(true)} />
      </Demo>

      <Sheet
        visible={places}
        onClose={() => setPlaces(false)}
        snapPoints={['22%', '55%', '90%']}
        index={index}
        onIndexChange={setIndex}
        title="Nearby"
      >
        {PLACES.map((place, position) => (
          <ListItem
            key={place.name}
            title={place.name}
            subtitle={place.note}
            onPress={() => toast.info(place.name)}
            divider={position < PLACES.length - 1}
          />
        ))}
      </Sheet>

      <Sheet
        visible={filters}
        onClose={() => setFilters(false)}
        snapPoints={['45%']}
        title="Filters"
        footer={
          <Button
            label="Show results"
            onPress={() => {
              setFilters(false)
              toast.success(`${chosen.length} filters`)
            }}
          />
        }>
        <ChipGroup
          value={chosen}
          // The group reports which chip was hit; toggling is the caller's,
          // because only the caller knows whether two filters can coexist
          onChange={(value) =>
            setChosen((current) =>
              current.includes(value) ? current.filter((key) => key !== value) : [...current, value],
            )
          }
          multiple
          options={[
            { value: 'open', label: 'Open now' },
            { value: 'near', label: 'Walking distance' },
            { value: 'quiet', label: 'Quiet' },
            { value: 'outside', label: 'Tables outside' },
          ]}
        />
        <View style={{ height: space(3) }} />
        <Divider />
        <View style={{ height: space(3) }} />
        <Text variant="caption" color="textMuted">
          The footer is outside the scrolling area, so a long list never buries
          the button that acts on it.
        </Text>
      </Sheet>

      <Sheet
        visible={required}
        onClose={() => setRequired(false)}
        snapPoints={['40%']}
        dismissible={false}
        dismissOnBackdrop={false}
        title="How would you like to pay?">
        <View style={{ gap: space(3) }}>
          {['This phone', 'Card ending 4417', 'Add a new card'].map((option) => (
            <Chip
              key={option}
              label={option}
              selected={false}
              onPress={() => {
                setRequired(false)
                toast.success(option)
              }}
            />
          ))}
        </View>
      </Sheet>
    </Stack>
  )
}
