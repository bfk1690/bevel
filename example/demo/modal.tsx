import { useState } from 'react'
import { Button, Input, Modal, Text } from 'bevel'

import { Demo, Stack } from './ui'

export function ModalDemo() {
  const [open, setOpen] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const close = () => setOpen(null)

  return (
    <Stack>
      <Demo
        title="Sheet"
        note="Rises from the bottom and leaves the page behind it in place, which is why it suits pickers and confirmations.">
        <Button label="Open sheet" variant="secondary" onPress={() => setOpen('sheet')} />
      </Demo>

      <Demo title="Center" note="Floats above the page. Use it for short, blocking decisions.">
        <Button label="Open dialog" variant="secondary" onPress={() => setOpen('center')} />
      </Demo>

      <Demo title="Full" note="Covers the screen, safe areas included - a sub-page rather than an interruption.">
        <Button label="Open full" variant="secondary" onPress={() => setOpen('full')} />
      </Demo>

      <Demo
        title="Scrollable and keyboard-aware"
        note="A modal containing a field must lift with the keyboard, or the field ends up underneath it.">
        <Button label="Open form" variant="secondary" onPress={() => setOpen('form')} />
      </Demo>

      <Demo
        title="Non-dismissable backdrop"
        note="Destructive confirmations should not close on a stray tap outside.">
        <Button label="Open" variant="danger" onPress={() => setOpen('locked')} />
      </Demo>

      <Modal visible={open === 'sheet'} onClose={close} title="Sheet" variant="sheet">
        <Text variant="body" color="textMuted">
          The handle is a drag affordance. Tap the scrim or swipe down to close.
        </Text>
        <Button label="Close" variant="secondary" onPress={close} />
      </Modal>

      <Modal visible={open === 'center'} onClose={close} title="Delete this album?" variant="center">
        <Text variant="body" color="textMuted">
          Sixteen photos will be removed. This cannot be undone.
        </Text>
        <Button label="Delete" variant="danger" onPress={close} />
        <Button label="Keep" variant="ghost" onPress={close} />
      </Modal>

      <Modal visible={open === 'full'} onClose={close} title="Full screen" variant="full" scrollable>
        <Text variant="body" color="textMuted">
          Full modals carry their own safe-area padding, so a close control never lands under the
          status bar or the home indicator.
        </Text>
        <Button label="Close" variant="secondary" onPress={close} />
      </Modal>

      <Modal
        visible={open === 'form'}
        onClose={close}
        title="Add a note"
        variant="sheet"
        scrollable
        keyboardAware>
        <Input label="Note" value={note} onChangeText={setNote} multiline placeholder="Type here" />
        <Button label="Save" onPress={close} />
      </Modal>

      <Modal
        visible={open === 'locked'}
        onClose={close}
        title="Confirm"
        variant="center"
        dismissOnBackdrop={false}>
        <Text variant="body" color="textMuted">
          Tapping outside does nothing. Choose one.
        </Text>
        <Button label="Confirm" variant="danger" onPress={close} />
        <Button label="Cancel" variant="ghost" onPress={close} />
      </Modal>
    </Stack>
  )
}
