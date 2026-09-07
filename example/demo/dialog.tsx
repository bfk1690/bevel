import { useState } from 'react'
import { Button, Card, Text, dialog, toast, useTheme } from '@bfkk/bevel'

import { Demo, Spec, Stack } from './ui'

export function DialogDemo() {
  const { space } = useTheme()
  const [name, setName] = useState('Untitled')
  const [answered, setAnswered] = useState<string>('nothing yet')

  return (
    <Stack>
      <Demo
        title="Asking, and waiting for the answer"
        note="Raised imperatively and awaited, so the question sits in the flow that needed it rather than in a piece of state the screen has to carry. Mount one host near the root: a question raised from an interceptor has no component to live in, and the ones that do usually ask from a handler that has navigated away by the time the answer arrives.">
        <Button
          label="Ask something"
          onPress={async () => {
            const ok = await dialog.confirm({
              title: 'Leave without saving?',
              message: 'The last two changes have not been written yet.',
              confirmLabel: 'Leave',
              cancelLabel: 'Stay',
            })
            setAnswered(ok ? 'left' : 'stayed')
          }}
        />
        <Spec label="answer">
          <Text variant="caption" color="textMuted">
            {answered}
          </Text>
        </Spec>
      </Demo>

      <Demo
        title="Destructive"
        note="The colour is the smaller half of it. The button that destroys something is also the one a stray tap outside the dialog must not reach, which is why this one does not close on the scrim.">
        <Button
          label="Delete the archive"
          variant="danger"
          onPress={async () => {
            const ok = await dialog.confirm({
              title: 'Delete the archive?',
              message: 'Four years of messages. This cannot be undone.',
              confirmLabel: 'Delete',
              destructive: true,
            })
            toast[ok ? 'warning' : 'info'](ok ? 'Deleted' : 'Kept')
          }}
        />
      </Demo>

      <Demo
        title="Asking for a value"
        note="A rejected value keeps the dialog up rather than closing and complaining afterwards: closing throws away what was typed along with the reason it was refused. The complaint clears as soon as the value changes, since leaving it up while someone fixes it says the fix has already failed.">
        <Card>
          <Text variant="heading">{name}</Text>
        </Card>
        <Button
          label="Rename"
          variant="secondary"
          onPress={async () => {
            const next = await dialog.prompt({
              title: 'Rename',
              message: 'Two characters at least, and nothing that is only spaces.',
              defaultValue: name,
              placeholder: 'Name',
              confirmLabel: 'Rename',
              validate: (value) =>
                value.trim().length < 2 ? 'That is too short to find again later.' : null,
            })
            if (next != null) setName(next)
          }}
        />
      </Demo>

      <Demo
        title="Telling, not asking"
        note="One button, and the scrim closes it. An alert that traps you behind a single OK is a modal used as punctuation.">
        <Button
          label="Show an alert"
          variant="outline"
          onPress={() =>
            dialog.alert({
              title: 'Export finished',
              message: 'Nine hundred and twelve rows went into a file in Downloads.',
            })
          }
        />
      </Demo>

      <Demo
        title="Two at once"
        note="Unlike a toast, a dialog queues. Each one has somebody awaiting its answer, so replacing the one on screen would leave that promise unresolved forever - and the caller is usually holding a lock or a spinner while it waits. Clearing them answers each as cancelled rather than dropping it, because every caller is inside an await.">
        <Button
          label="Raise three"
          variant="secondary"
          onPress={() => {
            void dialog.confirm({ title: 'First', message: 'Answer me and the next arrives.' })
            void dialog.confirm({ title: 'Second' })
            void dialog.alert({ title: 'Third' })
          }}
        />
        <Button
          label="Clear whatever is waiting"
          variant="ghost"
          onPress={() => {
            dialog.clear()
            toast.info('All answered as cancelled')
          }}
          style={{ marginTop: space(2) }}
        />
      </Demo>
    </Stack>
  )
}
