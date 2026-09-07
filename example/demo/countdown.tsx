import { useState } from 'react'
import { View } from 'react-native'
import {
  Button,
  Card,
  Countdown,
  OtpInput,
  Text,
  formatDuration,
  toast,
  useCountdown,
  useTheme,
} from '@bfkk/bevel'

import { Demo, Row, Spec, Stack } from './ui'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export function CountdownDemo() {
  const { space } = useTheme()
  const [running, setRunning] = useState(true)
  const [code, setCode] = useState('')
  const [start] = useState(() => Date.now())

  // The resend timer, which is what most countdowns in an app actually are
  const resend = useCountdown(start + 30_000)

  return (
    <Stack>
      <Demo
        title="Counting down to a moment"
        note="Seconds round up, so it shows 1 while any of the last second remains and reaches zero exactly when the time does - rather than sitting on zero for a second like a timer that gave up early. The ticks aim at the next second boundary instead of counting 1000ms at a time: each tick of a plain interval is a little late, the error accumulates, and a whole second eventually disappears from the display.">
        <Card>
          <Countdown to={start + 10 * MINUTE} variant="display" running={running} />
          <Text variant="caption" color="textMuted">
            Reads the clock on every tick, so a phone that slept through half of
            it comes back with the right number rather than the one it left with.
          </Text>
        </Card>
        <Row>
          <Button
            label={running ? 'Pause' : 'Resume'}
            variant="secondary"
            size="sm"
            full={false}
            onPress={() => setRunning((value) => !value)}
          />
        </Row>
      </Demo>

      <Demo
        title="What most countdowns in an app are"
        note="A code you cannot ask for again yet. The button is disabled while the clock runs and takes its own label back at zero - one piece of state, not two that can disagree.">
        <Card gap={space(4)}>
          <OtpInput value={code} onChange={setCode} length={6} />
          <Button
            label={
              resend.done ? 'Send a new code' : `Send a new code in ${formatDuration(resend.msLeft)}`
            }
            variant="secondary"
            disabled={!resend.done}
            onPress={() => {
              resend.restart(30_000)
              toast.info('Sent')
            }}
          />
        </Card>
      </Demo>

      <Demo
        title="Two ways of saying it"
        note="Clock is for something running, where the digits must not move about. Compact is for something stated, read once. The hours field can be kept at zero so the width does not change when a long timer crosses an hour.">
        <Spec label="clock">
          <Countdown to={start + 90_000} />
        </Spec>
        <Spec label="showHours">
          <Countdown to={start + 90_000} showHours />
        </Spec>
        <Spec label="compact">
          <Countdown to={start + HOUR + 23 * MINUTE} format="compact" />
        </Spec>
        <Spec label="days">
          <Countdown to={start + 2 * DAY + 3 * HOUR} />
        </Spec>
        <Spec label="hideDays">
          <Countdown to={start + 2 * DAY + 3 * HOUR} hideDays />
        </Spec>
      </Demo>

      <Demo
        title="When it runs out"
        note="A finished countdown can say so rather than showing zeroes, and onEnd fires exactly once - not on every render after the fact.">
        <Card>
          <Countdown
            to={start + 8000}
            endLabel="Time is up"
            variant="heading"
            onEnd={() => toast.warning('Time is up')}
          />
        </Card>
        <View style={{ height: space(1) }} />
        <Text variant="caption" color="textFaint">
          Eight seconds from when this page opened.
        </Text>
      </Demo>
    </Stack>
  )
}
