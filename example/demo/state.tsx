import { useState } from 'react'
import {
  Card,
  ErrorBoundary,
  ListItem,
  SegmentedControl,
  SkeletonRows,
  StateView,
  Text,
  toast,
} from '@bfkk/bevel'

import { Demo, Stack } from './ui'

type Mode = 'ready' | 'loading' | 'empty' | 'error'

/** Throws on demand, so the boundary below has something to catch */
function Explodes({ broken }: { broken: boolean }) {
  if (broken) throw new Error("Cannot read properties of undefined (reading 'title')")
  return (
    <Card>
      <Text variant="caption" color="textMuted">
        Drawing normally.
      </Text>
    </Card>
  )
}

export function StateDemo() {
  const [mode, setMode] = useState<Mode>('loading')
  const [broken, setBroken] = useState(false)
  const [attempt, setAttempt] = useState(0)

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
      <Demo
        title="When a render throws"
        note="Catches what a render throws and keeps the rest of the app up - the one thing React still has no hook for, which is why this is a class. It catches renders and nothing else: a rejected promise, a failed request, a throw inside an event handler never reach it, and a screen relying on this for its error handling shows a blank space instead.">
        <ErrorBoundary
          resetKey={attempt}
          showDetail
          onError={(error) => toast.error(error.message)}>
          <Explodes broken={broken} />
        </ErrorBoundary>
        <SegmentedControl
          value={broken ? 'broken' : 'fine'}
          onChange={(value) => {
            setBroken(value === 'broken')
            // The boundary is told to clear by a key change - without one it
            // stays broken for the life of the screen, and navigating away and
            // back lands on the same message
            if (value === 'fine') setAttempt((count) => count + 1)
          }}
          options={[
            { value: 'fine', label: 'Draws fine' },
            { value: 'broken', label: 'Throws' },
          ]}
        />
        <Text variant="caption" color="textFaint">
          Try again re-renders the same broken child, so it fails again - which
          is honest. Nothing retries on its own: a component that threw once
          usually throws again, and a loop is harder to diagnose than a stuck
          screen.
        </Text>
      </Demo>
    </Stack>
  )
}
