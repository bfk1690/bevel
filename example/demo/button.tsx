import { useState } from 'react'
import { View } from 'react-native'
import { Button, Text, useTheme } from 'bevel'

import { Demo, Row, Spec, Stack } from './ui'

export function ButtonDemo() {
  const [loading, setLoading] = useState(false)
  const { space } = useTheme()

  const work = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1600)
  }

  return (
    <Stack>
      <Demo
        title="Variants"
        note="Every variant is a row in the theme. Adding one is a theme edit, not a fork.">
        <Button label="primary" />
        <Button label="secondary" variant="secondary" />
        <Button label="outline" variant="outline" />
        <Button label="ghost" variant="ghost" />
        <Button label="danger" variant="danger" />
        <Button label="hero (app variant with a gradient)" variant="hero" />
      </Demo>

      <Demo title="Sizes" row>
        <Button label="sm" size="sm" full={false} />
        <Button label="md" size="md" full={false} />
        <Button label="lg" size="lg" full={false} />
      </Demo>

      <Demo
        title="Press behaviour"
        note="Depth renders a physical bevel that compresses; the footprint never changes, so neighbours do not shift.">
        <Spec label="depth (default)">
          <Button label="Press and hold" press="depth" />
        </Spec>
        <Spec label="scale">
          <Button label="Press and hold" press="scale" variant="secondary" />
        </Spec>
        <Spec label="opacity">
          <Button label="Press and hold" press="opacity" variant="secondary" />
        </Spec>
        <Spec label="none">
          <Button label="Press and hold" press="none" variant="secondary" />
        </Spec>
      </Demo>

      <Demo title="Depth amount" row note="Per instance, or per variant in the theme.">
        <Button label="2" depth={2} full={false} />
        <Button label="6" depth={6} full={false} />
        <Button label="10" depth={10} full={false} />
      </Demo>

      <Demo
        title="Loading"
        note="The label is hidden, not removed, so the width holds still. Loading is not disabled: the button keeps its color because it is doing exactly what was asked.">
        <Button label={loading ? 'Working' : 'Start work'} loading={loading} onPress={work} />
        <Row>
          <Button label="Loading" loading full={false} />
          <Button label="Loading" loading variant="secondary" full={false} />
          <Button label="Loading" loading variant="hero" full={false} />
        </Row>
      </Demo>

      <Demo title="Disabled" note="A real disabled button loses its fill, its shadow and its gradient.">
        <Row>
          <Button label="primary" disabled full={false} />
          <Button label="secondary" variant="secondary" disabled full={false} />
          <Button label="hero" variant="hero" disabled full={false} />
        </Row>
      </Demo>

      <Demo
        title="Slots"
        note="left and right take a node, or a function receiving the resolved icon size and color - so an icon inherits the variant without being told about it.">
        <Button
          label="With a leading dot"
          left={({ size, color }) => (
            <View
              style={{ width: size * 0.5, height: size * 0.5, borderRadius: size, backgroundColor: color }}
            />
          )}
        />
        <Button label="Buy credits" tag="AI" trailing="49" variant="hero" />
        <Button label="Trailing badge" trailing="12" variant="secondary" />
      </Demo>

      <Demo title="Alignment" note="A full-width button can still align its content.">
        <Button label="center" align="center" variant="secondary" />
        <Button label="flex-start" align="flex-start" variant="secondary" />
        <Button label="space-between" align="space-between" variant="secondary" trailing="99" />
      </Demo>

      <Demo
        title="Per-instance overrides"
        note="Raw colors are accepted anywhere a role name is, so a one-off never needs a new variant.">
        <Row>
          <Button label="bg + fg" bg="#FF6B00" fg="#1A0A00" full={false} />
          <Button label="radius pill" radius="pill" full={false} />
          <Button label="radius 0" radius={0} full={false} />
          <Button label="border" bg="transparent" border="accent" fg="accent" full={false} />
        </Row>
      </Demo>

      <Demo
        title="Contrast is derived"
        note="These variants declare no foreground. The label color comes from the background's luminance, so an overridden bg can never produce invisible text.">
        <Row>
          <Button label="on white" bg="#FFFFFF" full={false} />
          <Button label="on yellow" bg="#FFD60A" full={false} />
          <Button label="on navy" bg="#0B1E3F" full={false} />
        </Row>
      </Demo>

      <Demo
        title="Repeat presses"
        note="preventDoublePress is on by default at 400ms - a double tap on a navigating button is one of the most common defects in mobile apps. Turn it off for steppers.">
        <Counter />
      </Demo>

      <Demo title="Width" row>
        <Button label="full={false}" full={false} />
        <View style={{ width: space(40) }}>
          <Button label="inside a fixed width" />
        </View>
      </Demo>
    </Stack>
  )
}

function Counter() {
  const [guarded, setGuarded] = useState(0)
  const [free, setFree] = useState(0)
  const { space } = useTheme()
  return (
    <View style={{ gap: space(2) }}>
      <Row>
        <Button label={`guarded: ${guarded}`} full={false} onPress={() => setGuarded((n) => n + 1)} />
        <Button
          label={`free: ${free}`}
          variant="secondary"
          full={false}
          preventDoublePress={false}
          onPress={() => setFree((n) => n + 1)}
        />
      </Row>
      <Text variant="caption" color="textMuted">
        Tap each one as fast as you can.
      </Text>
    </View>
  )
}
