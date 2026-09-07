import { useState } from 'react'
import { Card, ListItem, SegmentedControl, SkeletonRows, StateView, Text, toast } from '@bfkk/bevel'

import { Demo, Stack } from './ui'

type Mode = 'ready' | 'loading' | 'empty' | 'error'

export function StateDemo() {
  const [mode, setMode] = useState<Mode>('loading')

  return (
    <Stack>
      <Demo
        title="The four faces of a list"
        note="Loading wins over an error it is busy clearing, or pressing try again looks like it did nothing. An error wins over empty, because we could not load this and there is nothing here are different statements - a failed request shown as an empty state is how someone concludes their data is gone.">
        <SegmentedControl
          value={mode}
          onChange={setMode}
          options={[
            { value: 'loading', label: 'Loading' },
            { value: 'error', label: 'Error' },
            { value: 'empty', label: 'Empty' },
            { value: 'ready', label: 'Ready' },
          ]}
        />

        <Card padding={0} style={{ paddingHorizontal: 16, minHeight: 220, justifyContent: 'center' }}>
          <StateView
            loading={mode === 'loading'}
            error={mode === 'error' ? new Error('The server took too long to answer') : null}
            empty={mode === 'empty'}
            onRetry={() => {
              setMode('loading')
              setTimeout(() => setMode('ready'), 1200)
            }}
            emptyTitle="No orders yet"
            emptyMessage="Orders you place will show up here."
            emptyActionLabel="Browse the shop"
            onEmptyAction={() => toast.info('Shop')}>
            <ListItem title="HJ-88421" subtitle="Ada Lovelace" divider />
            <ListItem title="HJ-88420" subtitle="Grace Hopper" divider />
            <ListItem title="HJ-88418" subtitle="Alan Turing" />
          </StateView>
        </Card>
      </Demo>

      <Demo
        title="Placeholders have a shape"
        note="The point is not that something is loading - a spinner already says that. Rows the size of the rows to come mean the screen does not jump when they arrive.">
        <Card>
          <SkeletonRows count={3} avatar />
        </Card>
        <Card>
          <SkeletonRows count={2} />
        </Card>
      </Demo>

      <Demo title="Anything can replace a face">
        <Card padding={0} style={{ paddingHorizontal: 16, minHeight: 120, justifyContent: 'center' }}>
          <StateView
            empty
            emptyView={
              <Text variant="caption" color="textFaint" align="center" style={{ paddingVertical: 24 }}>
                A quieter empty, for a section rather than a screen.
              </Text>
            }>
            <Text>unused</Text>
          </StateView>
        </Card>
      </Demo>
    </Stack>
  )
}
