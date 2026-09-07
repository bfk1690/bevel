import { useState } from 'react'
import { View } from 'react-native'
import {
  Avatar,
  Badge,
  Card,
  ListItem,
  SwipeableRow,
  Switch,
  Text,
  toast,
  useTheme,
  type SwipeAction,
} from '@bfkk/bevel'

import { Demo, Spec, Stack } from './ui'

const PEOPLE = [
  { name: 'Ada Lovelace', note: 'Sent you the notes' },
  { name: 'Grace Hopper', note: 'Found the moth' },
  { name: 'Alan Turing', note: 'Left a voice message' },
]

export function SwipeDemo() {
  const { colors, space } = useTheme()
  const [openRow, setOpenRow] = useState<string | null>(null)
  const [fullSwipe, setFullSwipe] = useState(true)
  const [inbox, setInbox] = useState(PEOPLE)

  const actions = (name: string): SwipeAction[] => [
    { key: 'pin', label: 'Pin', tone: 'accent', onPress: () => toast.info(`Pinned ${name}`) },
    { key: 'mute', label: 'Mute', tone: 'warning', onPress: () => toast.info(`Muted ${name}`) },
    { key: 'delete', label: 'Delete', onPress: () => toast.warning(`Deleted ${name}`) },
  ]

  return (
    <Stack>
      <Demo
        title="Actions behind the row"
        note="They sit behind rather than pushing: the row keeps its place in the list and moves off what is underneath, which is why a half-open row still reads as one row instead of two columns. Where it lands when you let go is decided by distance and speed together - a quick short flick is as clear an instruction as a slow long pull, and asking for the pull as well would be asking you to do the animation's work.">
        <Card padding={0} gap={0} style={{ overflow: 'hidden' }}>
          {PEOPLE.map((person, index) => (
            <SwipeableRow
              key={person.name}
              actions={actions(person.name)}
              bg="surface"
              onOpenChange={(open) => setOpenRow(open ? person.name : null)}>
              <View style={{ paddingHorizontal: space(4) }}>
                <ListItem
                  title={person.name}
                  subtitle={person.note}
                  left={<Avatar name={person.name} />}
                  divider={index < PEOPLE.length - 1}
                />
              </View>
            </SwipeableRow>
          ))}
        </Card>
        <Spec label="open">
          <Text variant="caption" color="textMuted">
            {openRow ?? 'nothing'}
          </Text>
        </Spec>
      </Demo>

      <Demo
        title="Running the edge action outright"
        note="Carry the drag past half the row and the outermost action runs without waiting for a second tap. It is worth turning on when one action is the obvious one - deleting a message, clearing a notification - and worth leaving off when the actions are equals, since it quietly promotes whichever happens to sit at the edge. Past the actions' own width the colour keeps going to the edge, so the row says what letting go will do before you let go.">
        <Card padding={0} gap={0} style={{ overflow: 'hidden' }}>
          {inbox.map((person, index) => (
            <SwipeableRow
              key={person.name}
              bg="surface"
              fullSwipe={fullSwipe}
              actions={[
                {
                  key: 'delete',
                  label: 'Delete',
                  onPress: () => {
                    setInbox((rows) => rows.filter((row) => row.name !== person.name))
                    toast.warning(`Deleted ${person.name}`)
                  },
                },
              ]}>
              <View style={{ paddingHorizontal: space(4) }}>
                <ListItem
                  title={person.name}
                  subtitle={person.note}
                  left={<Avatar name={person.name} />}
                  divider={index < inbox.length - 1}
                />
              </View>
            </SwipeableRow>
          ))}
          {inbox.length === 0 && (
            <View style={{ padding: space(5), alignItems: 'center' }}>
              <Text
                variant="caption"
                color="textFaint"
                onPress={() => setInbox(PEOPLE)}
                style={{ color: colors.accent }}>
                Put them back
              </Text>
            </View>
          )}
        </Card>
        <Spec label="fullSwipe">
          <Switch value={fullSwipe} onChange={setFullSwipe} />
        </Spec>
      </Demo>

      <Demo
        title="From the other edge"
        note="The same row, mirrored. A left swipe reads as doing something forward - marking read, accepting, archiving - while the right side keeps the destructive end. Nothing enforces that; it is only what a hand expects after using every other list on the phone.">
        <Card padding={0} gap={0} style={{ overflow: 'hidden' }}>
          <SwipeableRow
            side="left"
            bg="surface"
            actionWidth={96}
            actions={[
              {
                key: 'read',
                label: 'Mark read',
                tone: 'ok',
                onPress: () => toast.success('Marked read'),
              },
            ]}>
            <View style={{ paddingHorizontal: space(4) }}>
              <ListItem
                title="Two unread"
                subtitle="Swipe me rightwards"
                left={<Avatar name="Two" />}
                right={<Badge label="2" tone="accent" />}
              />
            </View>
          </SwipeableRow>
        </Card>
      </Demo>

      <Demo
        title="Rows that do not move"
        note="A row with nothing to do about it should not move at all. A row that slides open onto an empty tray teaches the gesture and then breaks the promise, which is worse than never having offered it.">
        <Card padding={0} gap={0} style={{ overflow: 'hidden' }}>
          <SwipeableRow
            disabled
            bg="surface"
            actions={[{ key: 'delete', label: 'Delete', onPress: () => {} }]}>
            <View style={{ paddingHorizontal: space(4) }}>
              <ListItem title="System message" subtitle="Nothing to do here" />
            </View>
          </SwipeableRow>
        </Card>
      </Demo>
    </Stack>
  )
}
