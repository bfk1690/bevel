import { useRef } from 'react'
import { StyleSheet, View } from 'react-native'

import { Button } from '../primitives/button'
import { Text } from '../primitives/text'
import { useTheme } from '../theme/provider'
import { Modal } from './modal'

export type ActionSheetAction = {
  label: string
  onPress: () => void
  destructive?: boolean
  disabled?: boolean
}

export type ActionSheetProps = {
  visible: boolean
  onClose: () => void
  title?: string
  message?: string
  actions: readonly ActionSheetAction[]
  /** Set to null to leave the sheet without an explicit way out */
  cancelLabel?: string | null
}

/**
 * A short list of things to do, from the bottom edge.
 *
 * The cancel sits apart from the actions rather than at the end of the list.
 * Grouped with them it becomes a fourth option to read past; separated, it is
 * where the thumb already expects a way out.
 *
 * ⚠️ An action runs AFTER the sheet has left the tree, not when it is tapped.
 *
 * It used to run immediately after `onClose()`, and the comment here claimed
 * that closing first kept a handler from "fighting a sheet on its way down" -
 * the opposite of what happened. `onClose` only starts a 200ms exit, so a
 * handler that opened a second sheet presented it while this one was still
 * dismissing. On iOS that presentation is dropped and the app is left under a
 * scrim it cannot tap away: the freeze people hit when one sheet leads to
 * another.
 */
export function ActionSheet({
  visible,
  onClose,
  title,
  message,
  actions,
  cancelLabel = 'Cancel',
}: ActionSheetProps) {
  const { space } = useTheme()
  /** The chosen action, held until the sheet has finished leaving. */
  const pending = useRef<(() => void) | null>(null)

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      variant="sheet"
      handle={false}
      onClosed={() => {
        const run = pending.current
        pending.current = null
        run?.()
      }}>
      {(title != null || message != null) && (
        <View style={[styles.head, { gap: space(1), paddingBottom: space(1) }]}>
          {title != null && (
            <Text variant="bodyStrong" align="center">
              {title}
            </Text>
          )}
          {message != null && (
            <Text variant="caption" color="textMuted" align="center">
              {message}
            </Text>
          )}
        </View>
      )}

      <View style={{ gap: space(2) }}>
        {actions.map((action, index) => (
          <Button
            key={`${action.label}-${index}`}
            label={action.label}
            variant={action.destructive ? 'danger' : 'secondary'}
            disabled={action.disabled}
            onPress={() => {
              pending.current = action.onPress
              onClose()
            }}
          />
        ))}
      </View>

      {cancelLabel != null && (
        <View style={{ paddingTop: space(1) }}>
          <Button
            label={cancelLabel}
            variant="ghost"
            onPress={() => {
              // Cancelling clears any action left from a previous open.
              pending.current = null
              onClose()
            }}
          />
        </View>
      )}
    </Modal>
  )
}

const styles = StyleSheet.create({
  head: { alignItems: 'center' },
})
