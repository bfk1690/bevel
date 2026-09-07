import { useState } from 'react'
import { View } from 'react-native'
import { Button, Card, Steps, Text, useTheme } from '@bfkk/bevel'

import { Demo, Row, Spec, Stack } from './ui'

const CHECKOUT = [
  { key: 'basket', label: 'Basket', caption: 'Three items, one of them heavy.' },
  { key: 'address', label: 'Address', caption: 'Where it goes and when it can arrive.' },
  { key: 'payment', label: 'Payment', caption: 'Card, or the wallet on this phone.' },
]

const LONG = [
  'Account',
  'Identity',
  'Address',
  'Income',
  'Documents',
  'Review',
  'Signature',
].map((label) => ({ key: label.toLowerCase(), label, caption: `${label} details` }))

export function StepsDemo() {
  const { space } = useTheme()
  const [current, setCurrent] = useState(1)
  const [long, setLong] = useState(2)

  return (
    <Stack>
      <Demo
        title="Where you are in a flow"
        note="Up to a handful it draws them: seeing that there are three and being on the second is genuinely reassuring. A finished step is tappable and an unreached one is not - offering a shortcut past a step that has not been filled in ends in an error whose cause is invisible.">
        <Card>
          <Steps
            steps={CHECKOUT}
            current={current}
            onStepPress={(index) => setCurrent(index)}
          />
          <View style={{ height: space(2) }} />
          <Text variant="body" color="textMuted">
            {CHECKOUT[Math.min(current, CHECKOUT.length - 1)]?.caption}
          </Text>
        </Card>
        <Row>
          <Button
            label="Back"
            variant="secondary"
            size="sm"
            full={false}
            disabled={current === 0}
            onPress={() => setCurrent((step) => Math.max(0, step - 1))}
          />
          <Button
            label={current >= CHECKOUT.length ? 'Start again' : 'Next'}
            size="sm"
            full={false}
            onPress={() =>
              setCurrent((step) => (step >= CHECKOUT.length ? 0 : step + 1))
            }
          />
        </Row>
        <Spec label="current">
          <Text variant="caption" color="textMuted">
            {current >= CHECKOUT.length ? 'finished' : String(current)}
          </Text>
        </Spec>
      </Demo>

      <Demo
        title="Past a handful, it says the number"
        note="Seven markers with labels under them on a phone leaves each label two truncated words, which teaches nothing about where you are. A count and a bar are smaller and say more. The switch happens on its own at five steps, and compactFrom moves or disables it.">
        <Card>
          <Steps steps={LONG} current={long} />
        </Card>
        <Row>
          <Button
            label="Back"
            variant="secondary"
            size="sm"
            full={false}
            disabled={long === 0}
            onPress={() => setLong((step) => Math.max(0, step - 1))}
          />
          <Button
            label={long >= LONG.length ? 'Start again' : 'Next'}
            size="sm"
            full={false}
            onPress={() => setLong((step) => (step >= LONG.length ? 0 : step + 1))}
          />
        </Row>
      </Demo>

      <Demo
        title="The bar counts what is behind you"
        note="The step you are ON is not finished, so it does not fill the bar. That is why the last screen of a flow does not read as complete: finishing it is what completes it, and a flow says so by passing a current equal to its own length.">
        <Card gap={space(4)}>
          <Steps steps={LONG} current={0} />
          <Steps steps={LONG} current={3} />
          <Steps steps={LONG} current={LONG.length - 1} />
          <Steps steps={LONG} current={LONG.length} />
        </Card>
      </Demo>

      <Demo
        title="Either form, whatever the count"
        note="compactFrom is the only lever: Infinity always draws markers, zero always counts. Both are here because a two-step flow sometimes wants the count and a six-step one sometimes has room.">
        <Card gap={space(4)}>
          <Steps steps={LONG.slice(0, 6)} current={2} compactFrom={Infinity} tone="ok" />
          <Steps steps={CHECKOUT} current={1} compactFrom={0} tone="#8E4EC6" />
          <Steps
            steps={CHECKOUT}
            current={2}
            compactFrom={0}
            formatSummary={(step, count) => `${step + 1}/${count}`}
          />
        </Card>
      </Demo>
    </Stack>
  )
}
