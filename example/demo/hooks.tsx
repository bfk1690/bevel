import { useState } from 'react'
import { Button, Card, Modal, SearchField, Text, useDebouncedValue, useDisclosure } from '@bfkk/bevel'

import { Demo, Stack } from './ui'

export function HooksDemo() {
  const [query, setQuery] = useState('')
  const settled = useDebouncedValue(query, 400)
  const sheet = useDisclosure()

  return (
    <Stack>
      <Demo
        title="useDebouncedValue"
        note="The timer is cleared on every change, so what survives is the last value that sat still long enough. Type quickly and the second line waits.">
        <SearchField value={query} onChangeText={setQuery} onClear={() => setQuery('')} placeholder="Type here" />
        <Card gap={4}>
          <Text variant="caption" color="textMuted">{`live: ${query || '-'}`}</Text>
          <Text variant="caption">{`settled: ${settled || '-'}`}</Text>
        </Card>
      </Demo>

      <Demo
        title="useDisclosure"
        note="The stable callbacks matter more than the boolean: passing an inline arrow into a memoized sheet re-renders it on every parent render, which is the component you least want re-rendering.">
        <Button label="Open" variant="secondary" onPress={sheet.show} />
        <Modal visible={sheet.open} onClose={sheet.hide} title="Opened by a hook">
          <Text variant="caption" color="textMuted">
            show, hide and toggle keep the same identity between renders.
          </Text>
          <Button label="Close" variant="ghost" onPress={sheet.hide} />
        </Modal>
      </Demo>
    </Stack>
  )
}
