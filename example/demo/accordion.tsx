import { useState } from 'react'
import { Accordion, AccordionItem, Badge, Card, Text, useTheme } from '@bfkk/bevel'

import { Demo, Stack } from './ui'

const FAQ = [
  {
    key: 'shipping',
    title: 'When will my order arrive?',
    subtitle: 'Delivery windows',
    content: 'Orders placed before 16:00 leave the same day and arrive within two working days.',
  },
  {
    key: 'returns',
    title: 'Can I return something?',
    content: 'Anything unopened can go back within fourteen days. Refunds land in about a week.',
  },
  {
    key: 'support',
    title: 'How do I reach a human?',
    content: 'The chat button in the profile tab is answered between 09:00 and 18:00.',
  },
]

export function AccordionDemo() {
  const [expanded, setExpanded] = useState<readonly string[]>(['a'])
  const [single, setSingle] = useState(false)
  const { space } = useTheme()

  return (
    <Stack>
      <Demo
        title="Multiple open"
        note="The panel animates its measured height instead of mounting and unmounting, so a half-filled field inside a collapsed section is still half-filled when it comes back.">
        <Card padding={0} gap={0} style={{ paddingHorizontal: space(4) }}>
          <Accordion
            items={FAQ.map((item) => ({
              ...item,
              content: (
                <Text variant="caption" color="textMuted">
                  {item.content}
                </Text>
              ),
            }))}
            defaultExpanded={['shipping']}
          />
        </Card>
      </Demo>

      <Demo
        title="One at a time"
        note="Worth it for long content: with several panels open, the row just tapped can end up below the fold, which reads as nothing having happened.">
        <Card padding={0} gap={0} style={{ paddingHorizontal: space(4) }}>
          <Accordion
            single
            items={FAQ.map((item) => ({
              ...item,
              subtitle: undefined,
              content: (
                <Text variant="caption" color="textMuted">
                  {item.content}
                </Text>
              ),
            }))}
          />
        </Card>
      </Demo>

      <Demo title="With trailing content in the header">
        <Card padding={0} gap={0} style={{ paddingHorizontal: space(4) }}>
          <Accordion
            items={[
              {
                key: 'unread',
                title: 'Notifications',
                right: <Badge label="3" tone="danger" variant="solid" />,
                content: (
                  <Text variant="caption" color="textMuted">
                    Three unread messages.
                  </Text>
                ),
              },
              {
                key: 'archive',
                title: 'Archive',
                disabled: true,
                content: <Text variant="caption">Unreachable while disabled.</Text>,
              },
            ]}
          />
        </Card>
      </Demo>

      <Demo title="Controlled" note="Pass expanded and onExpandedChange to drive it from your own state.">
        <Card padding={0} gap={0} style={{ paddingHorizontal: space(4) }}>
          <AccordionItem
            title="Controlled panel"
            subtitle={expanded.includes('a') ? 'open' : 'closed'}
            expanded={expanded.includes('a')}
            onToggle={() => setExpanded((prev) => (prev.includes('a') ? [] : ['a']))}
            divider={false}>
            <Text variant="caption" color="textMuted">
              The parent owns the state here, which is what lets a form open the section that
              failed validation.
            </Text>
          </AccordionItem>
        </Card>
      </Demo>
    </Stack>
  )
}
