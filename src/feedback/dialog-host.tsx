import { useEffect, useState, useSyncExternalStore, type ReactElement } from 'react'
import { StyleSheet, View } from 'react-native'

import { Button } from '../primitives/button'
import { Input } from '../primitives/input'
import { Text } from '../primitives/text'
import { useTheme } from '../theme/provider'
import { Modal } from './modal'
import { dialogStore, resolveDialog, type DialogRequest } from './dialog-store'

export type DialogHostProps = {
  /** Overrides the built-in card, for a house style of dialog */
  render?: (request: DialogRequest, answer: (result: boolean | string | null) => void) => ReactElement
}

/**
 * Renders whatever `dialog.confirm` and friends have raised.
 *
 * Mount it once, near the root and inside the provider. One host rather than a
 * dialog per call site: a question asked from an interceptor has no component
 * to live in, and the ones that DO have a component usually ask from an event
 * handler that has already navigated away by the time the answer arrives.
 */
export function DialogHost({ render }: DialogHostProps) {
  const { queue } = useSyncExternalStore(dialogStore.subscribe, dialogStore.getSnapshot, dialogStore.getSnapshot)
  const request = queue[0] ?? null

  return request == null ? null : (
    <DialogCard key={request.id} request={request} render={render} />
  )
}

/**
 * Keyed by request id, so the next question in the queue gets a fresh card
 * rather than inheriting the answer half-typed into the last one.
 */
function DialogCard({ request, render }: { request: DialogRequest; render: DialogHostProps['render'] }) {
  const { colors, space } = useTheme()
  const [value, setValue] = useState(request.defaultValue ?? '')
  const [error, setError] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  // Mounted closed and opened on the next commit, so the modal has a state to
  // animate FROM. Opening straight into `visible` skips the entrance.
  useEffect(() => setVisible(true), [])

  const answer = (result: boolean | string | null) => {
    setVisible(false)
    // Answered after the exit rather than during it: resolving first lets the
    // caller navigate away, and the dialog vanishes mid-animation
    setTimeout(() => resolveDialog(request.id, result), EXIT_DELAY)
  }

  const accept = () => {
    if (request.kind !== 'prompt') {
      answer(true)
      return
    }
    const complaint = request.validate?.(value) ?? null
    // A rejected value keeps the dialog up: closing it would throw away what
    // was typed along with the reason it was refused
    if (complaint != null) {
      setError(complaint)
      return
    }
    answer(value)
  }

  const cancel = () => answer(request.kind === 'prompt' ? null : false)

  if (render != null) return render(request, answer)

  const confirmLabel = request.confirmLabel ?? (request.kind === 'alert' ? 'OK' : 'Confirm')
  const dismissable = request.kind === 'alert' && !request.destructive

  return (
    <Modal
      visible={visible}
      onClose={cancel}
      variant="center"
      title={request.title}
      // A destructive question is not answered by a stray tap outside it
      dismissOnBackdrop={dismissable}
      keyboardAware={request.kind === 'prompt'}
      handle={false}>
      <View style={{ gap: space(4) }}>
        {request.message != null && (
          <Text variant="body" color="textMuted">
            {request.message}
          </Text>
        )}

        {request.kind === 'prompt' && (
          <Input
            value={value}
            onChangeText={(next) => {
              setValue(next)
              // The complaint goes as soon as the value changes: leaving it up
              // while they fix it says the fix has already failed
              if (error != null) setError(null)
            }}
            placeholder={request.placeholder}
            error={error}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={accept}
          />
        )}

        <View style={[styles.actions, { gap: space(2) }]}>
          {request.kind !== 'alert' && (
            <View style={styles.action}>
              <Button label={request.cancelLabel ?? 'Cancel'} variant="secondary" onPress={cancel} />
            </View>
          )}
          <View style={styles.action}>
            <Button
              label={confirmLabel}
              variant={request.destructive === true ? 'danger' : 'primary'}
              onPress={accept}
            />
          </View>
        </View>
      </View>
    </Modal>
  )
}

/** Long enough for the modal's own exit, short enough not to feel stuck */
const EXIT_DELAY = 200

const styles = StyleSheet.create({
  actions: { flexDirection: 'row' },
  action: { flex: 1 },
})
