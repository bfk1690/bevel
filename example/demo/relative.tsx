import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { Avatar, Card, ListItem, RelativeTime, Text, formatRelative, useTheme } from '@bfkk/bevel'

import { Demo, Spec, Stack } from './ui'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const MESSAGES = [
  { name: 'Ada Lovelace', note: 'Sent you the notes', age: 12_000 },
  { name: 'Grace Hopper', note: 'Found the moth', age: 9 * MINUTE },
  { name: 'Alan Turing', note: 'Left a voice message', age: 5 * HOUR },
  { name: 'Katherine Johnson', note: 'Checked the numbers', age: 3 * DAY },
  { name: 'Hedy Lamarr', note: 'Filed the patent', age: 40 * DAY },
]

export function RelativeDemo() {
  const { space } = useTheme()
  const [start] = useState(() => Date.now())
  const [, tick] = useState(0)

  // Only here, to show the label moving in a demo nobody will sit in front of
  // for five minutes
  useEffect(() => {
    const timer = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <Stack>
      <Demo
        title="A timestamp in words"
        note="The redraw is sized to the unit on screen rather than run on a fixed interval: a list ticking every second to keep '3 days ago' honest spends a frame a second on a string that changes twice a week. Past the cutoff the label is a fixed date and no timer runs at all.">
        <Card padding={0} gap={0} style={{ overflow: 'hidden' }}>
          {MESSAGES.map((message, index) => (
            <View key={message.name} style={{ paddingHorizontal: space(4) }}>
              <ListItem
                title={message.name}
                subtitle={message.note}
                left={<Avatar name={message.name} />}
                right={
                  <RelativeTime
                    value={start - message.age}
                    variant="micro"
                    color="textFaint"
                    locale="en"
                  />
                }
                divider={index < MESSAGES.length - 1}
              />
            </View>
          ))}
        </Card>
      </Demo>

      <Demo
        title="Counting up"
        note="This one was opened when the page was. Watch the label cross from seconds into minutes: forty seconds is not rounded up to a minute, because rounding up prints a time in the future for something that already happened.">
        <Spec label="opened">
          <RelativeTime value={start} variant="body" locale="en" />
        </Spec>
        <Spec label="seconds since">
          <Text variant="caption" color="textMuted">
            {Math.round((Date.now() - start) / 1000)}
          </Text>
        </Spec>
      </Demo>

      <Demo
        title="Where counting stops"
        note="Fourteen days ago makes the reader work out which Tuesday that was. A date does not. The cutoff is a week by default, and both the cutoff and the date's own formatting can be taken over.">
        <Spec label="6 days">
          <RelativeTime value={start - 6 * DAY} locale="en" />
        </Spec>
        <Spec label="8 days">
          <RelativeTime value={start - 8 * DAY} locale="en" />
        </Spec>
        <Spec label="cutoff 1 day">
          <RelativeTime value={start - 3 * DAY} locale="en" cutoffDays={1} />
        </Spec>
        <Spec label="never cuts off">
          <RelativeTime value={start - 400 * DAY} locale="en" cutoffDays={0} />
        </Spec>
      </Demo>

      <Demo
        title="Both directions, and other languages"
        note="What is coming reads as coming. The wording comes from the platform's own relative formatter, so a Turkish build says it in Turkish without the kit shipping a phrasebook - and falls back to English only if the runtime was built without the data.">
        <Spec label="in 5 minutes">
          <Text variant="caption" color="textMuted">
            {formatRelative(start + 5 * MINUTE, { now: start, locale: 'en' })}
          </Text>
        </Spec>
        <Spec label="tr">
          <Text variant="caption" color="textMuted">
            {formatRelative(start - 3 * HOUR, { now: start, locale: 'tr' })}
          </Text>
        </Spec>
        <Spec label="de">
          <Text variant="caption" color="textMuted">
            {formatRelative(start - 2 * DAY, { now: start, locale: 'de' })}
          </Text>
        </Spec>
        <Spec label="short">
          <Text variant="caption" color="textMuted">
            {formatRelative(start - 2 * DAY, { now: start, locale: 'en', style: 'short' })}
          </Text>
        </Spec>
      </Demo>
    </Stack>
  )
}
