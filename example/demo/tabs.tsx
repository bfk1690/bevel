import { useState } from 'react'
import { View } from 'react-native'
import { Card, TabView, Tabs, Text, useTheme } from '@bfkk/bevel'

import { Demo, Stack } from './ui'

const INBOX = [
  { value: 'all', label: 'All', badge: 12 },
  { value: 'unread', label: 'Unread', badge: 3 },
  { value: 'archived', label: 'Archived' },
]

const CATEGORIES = [
  { value: 'new', label: 'New arrivals' },
  { value: 'women', label: 'Women' },
  { value: 'men', label: 'Men' },
  { value: 'kids', label: 'Kids' },
  { value: 'home', label: 'Home and living' },
  { value: 'beauty', label: 'Beauty' },
  { value: 'sale', label: 'Sale' },
]

export function TabsDemo() {
  const [inbox, setInbox] = useState('all')
  const [category, setCategory] = useState('new')
  const [pair, setPair] = useState('details')
  const [small, setSmall] = useState('a')
  const [paged, setPaged] = useState('one')
  const [status, setStatus] = useState('a')
  const { space, colors } = useTheme()

  return (
    <Stack>
      <Demo
        title="Equal widths"
        note="Tabs sit above the content they switch and mark the selection with a line under the label. A filled pill reads as a button, and these are not buttons - they are a place you already are.">
        <Tabs value={pair} onChange={setPair} items={[
          { value: 'details', label: 'Details' },
          { value: 'reviews', label: 'Reviews' },
        ]} />
        <View style={{ paddingVertical: space(4) }}>
          <Text variant="body" color="textMuted">
            {pair === 'details' ? 'Fabric, fit and care.' : 'What people wrote about it.'}
          </Text>
        </View>
      </Demo>

      <Demo
        title="Tabs with pages"
        note="Both directions work: tapping moves the pages, swiping moves the tabs. The indicator is driven by the pager's scroll position, so during a swipe it travels with the finger rather than catching up once the page has settled - the difference between a gesture performed on the screen and one reported to it. Pages are built when first visited, so five tabs are not five screens' worth of work for the one being looked at.">
        <Card padding={0} gap={0} style={{ height: space(60), overflow: 'hidden' }}>
          <TabView
            value={paged}
            onChange={setPaged}
            items={[
              {
                value: 'one',
                label: 'Details',
                render: () => (
                  <View style={{ padding: space(4) }}>
                    <Text variant="body">Swipe sideways.</Text>
                    <Text variant="caption" color="textMuted">
                      The underline comes with you.
                    </Text>
                  </View>
                ),
              },
              {
                value: 'two',
                label: 'Reviews',
                badge: 12,
                render: () => (
                  <View style={{ padding: space(4) }}>
                    <Text variant="body">Second page.</Text>
                  </View>
                ),
              },
              {
                value: 'three',
                label: 'Shipping',
                render: () => (
                  <View style={{ padding: space(4) }}>
                    <Text variant="body">Third page.</Text>
                  </View>
                ),
              },
            ]}
          />
        </Card>
      </Demo>

      <Demo title="With counts">
        <Tabs value={inbox} onChange={setInbox} items={INBOX} />
      </Demo>

      <Demo
        title="Scrollable"
        note="Past four or five, equal widths squeeze every label into two truncated words. A scroller keeps them readable and admits the list is long. The selected tab is scrolled back into view when it changes.">
        <Tabs scrollable value={category} onChange={setCategory} items={CATEGORIES} />
      </Demo>

      <Demo title="Small">
        <Tabs
          size="sm"
          value={small}
          onChange={setSmall}
          items={[
            { value: 'a', label: 'Day' },
            { value: 'b', label: 'Week' },
            { value: 'c', label: 'Month' },
          ]}
        />
      </Demo>

      <Demo title="Disabled tab and no divider">
        <Tabs
          divider={false}
          value={status}
          onChange={setStatus}
          items={[
            { value: 'a', label: 'Open' },
            { value: 'b', label: 'Closed' },
            { value: 'c', label: 'Locked', disabled: true },
          ]}
        />
      </Demo>

      <Demo title="Tinted" note="Any role name or raw color.">
        <Tabs tone="ok" value={pair} onChange={setPair} items={[
          { value: 'details', label: 'Details' },
          { value: 'reviews', label: 'Reviews' },
        ]} />
        <Tabs tone="#8E4EC6" value={pair} onChange={setPair} items={[
          { value: 'details', label: 'Details' },
          { value: 'reviews', label: 'Reviews' },
        ]} />
      </Demo>

      <Demo title="Inside a card" note="The strip carries its own divider, so it separates itself from the content below.">
        <Card padding={0} gap={0} style={{ overflow: 'hidden' }}>
          <View style={{ paddingHorizontal: space(2) }}>
            <Tabs value={inbox} onChange={setInbox} items={INBOX} />
          </View>
          <View style={{ padding: space(4), backgroundColor: colors.surface }}>
            <Text variant="caption" color="textMuted">
              {`Showing: ${inbox}`}
            </Text>
          </View>
        </Card>
      </Demo>
    </Stack>
  )
}
