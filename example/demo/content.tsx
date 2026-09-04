import { useState } from 'react'
import { View } from 'react-native'
import { Avatar, Badge, Card, Divider, EmptyState, ListItem, Switch, Text, toast, useTheme } from '@bfkk/bevel'

import { Demo, Row, Stack } from './ui'

export function ContentDemo() {
  const [alerts, setAlerts] = useState(true)
  const { space } = useTheme()

  return (
    <Stack>
      <Demo title="Card">
        <Card title="With a title" subtitle="And a subtitle" right={<Badge label="new" />}>
          <Text variant="caption" color="textMuted">
            Children go under the title row.
          </Text>
        </Card>
        <Card>
          <Text variant="body">A bare card is just a surface.</Text>
        </Card>
        <Card onPress={() => toast.info('Card pressed')} title="Pressable">
          <Text variant="caption" color="textMuted">
            Adding a press handler turns it into a row without changing its shape.
          </Text>
        </Card>
        <Card bg="accentSoft" border="accent" shadow="none" title="Tinted" />
        <Card shadow="float" title="Floating" subtitle="shadow=float" />
      </Demo>

      <Demo
        title="List rows"
        note="The divider belongs to the row, not the list, so the last item can drop it without the list knowing its own boundaries.">
        <Card padding={0} gap={0}>
          <ListItem
            title="Ada Lovelace"
            subtitle="Analytical engine"
            left={<Avatar name="Ada Lovelace" status="ok" />}
            onPress={() => toast.info('Opened')}
            divider
            dividerInset={space(14)}
          />
          <ListItem
            title="Notifications"
            right={<Switch value={alerts} onChange={setAlerts} size="sm" />}
            divider
            dividerInset={space(4)}
          />
          <ListItem title="Storage" right={<Text variant="caption" color="textMuted">12.4 GB</Text>} divider dividerInset={space(4)} />
          <ListItem title="Delete account" destructive onPress={() => toast.warning('Not really')} />
        </Card>
      </Demo>

      <Demo title="Badges" row>
        <Badge label="soft" />
        <Badge label="solid" variant="solid" />
        <Badge label="outline" variant="outline" />
        <Badge label="ok" tone="ok" />
        <Badge label="warning" tone="warning" />
        <Badge label="danger" tone="danger" dot />
        <Badge label="raw color" tone="#8E4EC6" />
        <Badge label="md" size="md" />
      </Demo>

      <Demo
        title="Avatars"
        note="The tint is hashed from the name, so one person keeps one color everywhere with nothing stored.">
        <Row>
          <Avatar name="Ada Lovelace" />
          <Avatar name="Grace Hopper" />
          <Avatar name="Alan Turing" />
          <Avatar name="Katherine Johnson" size={56} />
          <Avatar name="Ada" shape="rounded" />
          <Avatar name="Ada" status="ok" />
          <Avatar name="Ada" status="danger" />
          <Avatar source="https://i.pravatar.cc/120?img=12" name="Photo" />
        </Row>
      </Demo>

      <Demo title="Divider">
        <Divider />
        <Divider label="or" />
        <Divider inset={space(8)} />
        <View style={{ flexDirection: 'row', height: space(8), alignItems: 'center', gap: space(3) }}>
          <Text variant="caption">left</Text>
          <Divider orientation="vertical" />
          <Text variant="caption">right</Text>
        </View>
      </Demo>

      <Demo
        title="Empty state"
        note="The action is part of the component: an empty state that only explains the absence leaves the user with nothing to do.">
        <Card padding={0}>
          <EmptyState
            title="No albums yet"
            message="Albums you create will show up here."
            actionLabel="Create one"
            onAction={() => toast.success('Created')}
            secondaryLabel="Learn more"
            onSecondary={() => toast.info('Docs')}
          />
        </Card>
        <Card padding={0}>
          <EmptyState compact title="No results" message="Try a different search." />
        </Card>
      </Demo>
    </Stack>
  )
}
